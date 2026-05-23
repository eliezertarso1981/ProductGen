import { Pool } from 'pg';
import { AppError, mapDbError } from '../../shared/errors';
import { hashSignupPassword, validateSignupPassword } from '../../auth/password';
import { createSession, revokeAllSessionsService } from '../auth/auth.session';
import { signAccessToken } from '../../auth/jwt';
import { slugifyName, ensureUniqueSlug } from '../../shared/slug';
import { getPlanDefinition } from '../../config/plans';
import {
  issueEmailVerificationToken,
  markEmailVerificationSent,
} from './email-verification';
import type {
  CreateWorkspaceInput,
  EnterpriseLeadInput,
  SetWorkspacePlanInput,
  SignupInput,
  UpdateMeInput,
} from './onboarding.schemas';

export async function isEmailAvailable(pool: Pool, email: string): Promise<boolean> {
  const result = await pool.query<{ id: string }>(
    `SELECT u.id
     FROM users u
     WHERE u.email = $1
       AND u.deleted_at IS NULL
       AND EXISTS (
         SELECT 1
         FROM workspace_members wm
         WHERE wm.user_id = u.id
           AND wm.removed_at IS NULL
       )
     LIMIT 1`,
    [email.toLowerCase()],
  );
  return !result.rows[0];
}

async function findIncompleteSignupUserId(pool: Pool, email: string): Promise<string | null> {
  const result = await pool.query<{ id: string }>(
    `SELECT u.id
     FROM users u
     WHERE u.email = $1
       AND u.deleted_at IS NULL
       AND NOT EXISTS (
         SELECT 1
         FROM workspace_members wm
         WHERE wm.user_id = u.id
           AND wm.removed_at IS NULL
       )
     LIMIT 1`,
    [email.toLowerCase()],
  );
  return result.rows[0]?.id ?? null;
}

export async function isSlugAvailable(
  pool: Pool,
  slug: string,
  excludeWorkspaceId?: string,
): Promise<boolean> {
  const result = await pool.query<{ id: string }>(
    `SELECT id
     FROM workspaces
     WHERE slug = $1
       AND deleted_at IS NULL
       AND ($2::uuid IS NULL OR id <> $2)
     LIMIT 1`,
    [slug, excludeWorkspaceId ?? null],
  );
  return !result.rows[0];
}

export async function signupService(
  pool: Pool,
  input: SignupInput,
  metadata: { userAgent?: string; ip?: string },
) {
  validateSignupPassword(input.password);

  const normalizedEmail = input.email.toLowerCase();
  const incompleteUserId = await findIncompleteSignupUserId(pool, normalizedEmail);

  if (!incompleteUserId) {
    const available = await isEmailAvailable(pool, normalizedEmail);
    if (!available) {
      throw new AppError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado');
    }
  }

  const passwordHash = await hashSignupPassword(input.password);

  const userResult = incompleteUserId
    ? await pool.query<{
        id: string;
        name: string;
        email: string;
        email_verified_at: string | null;
      }>(
        `UPDATE users
         SET name = $2,
             password_hash = $3,
             updated_at = now()
         WHERE id = $1
           AND deleted_at IS NULL
         RETURNING id, name, email, email_verified_at`,
        [incompleteUserId, input.full_name, passwordHash],
      )
    : await pool.query<{
        id: string;
        name: string;
        email: string;
        email_verified_at: string | null;
      }>(
        `INSERT INTO users (email, name, password_hash)
         VALUES ($1, $2, $3)
         RETURNING id, name, email, email_verified_at`,
        [normalizedEmail, input.full_name, passwordHash],
      );

  const user = userResult.rows[0];
  if (!user) {
    throw new AppError(409, 'EMAIL_TAKEN', 'Este e-mail já está cadastrado');
  }

  if (incompleteUserId) {
    await revokeAllSessionsService(pool, user.id);
  }

  try {
    const verificationToken = await issueEmailVerificationToken(pool, user.id);
    await markEmailVerificationSent(pool, user.id, verificationToken);
  } catch (err) {
    if (!isMissingRelationError(err, 'email_verification_tokens')) {
      throw err;
    }
    console.warn(
      '[onboarding] Tabela email_verification_tokens ausente — execute npm run db:migrate na API.',
    );
  }

  const session = await createSession(pool, user.id, metadata);
  const token = await signAccessToken({
    user_id: user.id,
    email: user.email,
    session_id: session.id,
  });

  return {
    token,
    refresh_token: session.refreshToken,
    user,
    workspace: null,
    workspaces: [],
  };
}

export async function createWorkspaceService(
  pool: Pool,
  userId: string,
  input: CreateWorkspaceInput,
) {
  const slug = input.slug
    ? input.slug
    : await ensureUniqueSlug(pool, slugifyName(input.name));

  if (!(await isSlugAvailable(pool, slug))) {
    throw new AppError(409, 'SLUG_TAKEN', 'Este slug já está em uso');
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const wsResult = await client.query<{
      id: string;
      name: string;
      slug: string;
      plan: string;
      status: string;
    }>(
      `INSERT INTO workspaces (
         name, slug, created_by_user_id, logo_url, company_size, country_code, status, plan
       )
       VALUES ($1, $2, $3, $4, $5, $6, 'active', 'free')
       RETURNING id, name, slug, plan, status`,
      [
        input.name,
        slug,
        userId,
        input.logo_url ?? null,
        input.company_size,
        input.country_code,
      ],
    );
    const workspace = wsResult.rows[0];

    await client.query(
      `INSERT INTO workspace_members (workspace_id, user_id, role)
       VALUES ($1, $2, 'owner')`,
      [workspace.id, userId],
    );

    await client.query('COMMIT');

    return {
      id: workspace.id,
      name: workspace.name,
      slug: workspace.slug,
      plan: workspace.plan,
      status: workspace.status,
      role: 'owner',
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (isPostgresUniqueSlugViolation(err)) {
      throw new AppError(409, 'SLUG_TAKEN', 'Este slug já está em uso');
    }
    mapDbError(err);
  } finally {
    client.release();
  }
}

export async function updateMeService(pool: Pool, userId: string, input: UpdateMeInput) {
  const result = await pool.query<{
    id: string;
    name: string;
    email: string;
    job_title: string | null;
    avatar_url: string | null;
    email_verified_at: string | null;
  }>(
    `UPDATE users
     SET name = COALESCE($2, name),
         job_title = COALESCE($3, job_title),
         avatar_url = COALESCE($4, avatar_url),
         updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, name, email, job_title, avatar_url, email_verified_at`,
    [userId, input.name ?? null, input.job_title ?? null, input.avatar_url ?? null],
  );
  const user = result.rows[0];
  if (!user) throw new AppError(404, 'NOT_FOUND', 'Usuário não encontrado');
  return user;
}

export async function setWorkspacePlanService(
  pool: Pool,
  userId: string,
  workspaceId: string,
  input: SetWorkspacePlanInput,
) {
  const membership = await pool.query<{ role: string }>(
    `SELECT role
     FROM workspace_members
     WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL`,
    [workspaceId, userId],
  );
  const role = membership.rows[0]?.role;
  if (!role || role !== 'owner') {
    throw new AppError(403, 'FORBIDDEN', 'Apenas o owner pode alterar o plano');
  }

  if (!getPlanDefinition(input.plan)) {
    throw new AppError(400, 'VALIDATION_ERROR', 'Plano inválido');
  }

  const status = input.plan === 'enterprise' ? 'trial_enterprise' : 'active';
  const result = await pool.query<{ id: string; plan: string; status: string }>(
    `UPDATE workspaces
     SET plan = $2, status = $3, updated_at = now()
     WHERE id = $1 AND deleted_at IS NULL
     RETURNING id, plan, status`,
    [workspaceId, input.plan, status],
  );
  const workspace = result.rows[0];
  if (!workspace) throw new AppError(404, 'NOT_FOUND', 'Workspace não encontrado');

  if (input.plan === 'enterprise' && input.enterprise_lead) {
    await createEnterpriseLeadService(pool, userId, {
      workspace_id: workspaceId,
      ...input.enterprise_lead,
    });
  }

  return workspace;
}

export async function createEnterpriseLeadService(
  pool: Pool,
  userId: string,
  input: EnterpriseLeadInput,
) {
  const result = await pool.query<{ id: string }>(
    `INSERT INTO enterprise_leads (
       workspace_id, user_id, contact_name, contact_email, contact_phone, message
     )
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id`,
    [
      input.workspace_id ?? null,
      userId,
      input.contact_name,
      input.contact_email,
      input.contact_phone ?? null,
      input.message ?? null,
    ],
  );
  return { id: result.rows[0].id };
}

export async function completeOnboardingService(
  pool: Pool,
  userId: string,
  workspaceId: string,
) {
  try {
    const result = await pool.query<{ onboarded_at: string }>(
      `UPDATE workspace_members
       SET onboarded_at = COALESCE(onboarded_at, now())
       WHERE workspace_id = $1 AND user_id = $2 AND removed_at IS NULL
       RETURNING onboarded_at`,
      [workspaceId, userId],
    );
    if (!result.rows[0]) {
      throw new AppError(404, 'NOT_FOUND', 'Membro do workspace não encontrado');
    }
    return { onboarded_at: result.rows[0].onboarded_at };
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

export async function getOnboardingStatus(pool: Pool, userId: string, workspaceId?: string) {
  try {
    const workspaces = await pool.query<{
      workspace_id: string;
      plan: string;
      onboarded_at: string | null;
      status: string;
    }>(
      `SELECT wm.workspace_id, w.plan, wm.onboarded_at, COALESCE(w.status, 'active') AS status
       FROM workspace_members wm
       JOIN workspaces w ON w.id = wm.workspace_id
       WHERE wm.user_id = $1
         AND wm.removed_at IS NULL
         AND w.deleted_at IS NULL
       ORDER BY wm.last_accessed_at DESC NULLS LAST, wm.joined_at DESC
       LIMIT 1`,
      [userId],
    );

    const active =
      workspaceId != null
        ? workspaces.rows.find((row) => row.workspace_id === workspaceId) ?? workspaces.rows[0]
        : workspaces.rows[0];

    const userResult = await pool.query<{ email_verified_at: string | null }>(
      `SELECT email_verified_at FROM users WHERE id = $1 AND deleted_at IS NULL`,
      [userId],
    );

    return {
      has_workspace: workspaces.rows.length > 0,
      onboarded: Boolean(active?.onboarded_at),
      plan: active?.plan ?? null,
      workspace_status: active?.status ?? null,
      email_verified: Boolean(userResult.rows[0]?.email_verified_at),
      workspace_id: active?.workspace_id ?? null,
    };
  } catch (err) {
    if (err instanceof AppError) throw err;
    mapDbError(err);
  }
}

function isMissingRelationError(err: unknown, relation: string): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false;
  const pgErr = err as { code?: string; message?: string };
  return pgErr.code === '42P01' && (pgErr.message?.includes(relation) ?? false);
}

function isPostgresUniqueSlugViolation(err: unknown): boolean {
  if (typeof err !== 'object' || err === null || !('code' in err)) return false;
  const pgErr = err as { code?: string; constraint?: string; message?: string };
  return (
    pgErr.code === '23505' &&
    (pgErr.constraint?.includes('slug') === true || pgErr.message?.includes('slug') === true)
  );
}
