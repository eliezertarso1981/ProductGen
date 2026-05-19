import { Pool } from 'pg';
import { FastifyRequest } from 'fastify';
import { AppError } from '../shared/errors';

export const PERMISSIONS = [
  'workspace.read',
  'workspace.update',
  'workspace.delete',
  'workspace.transfer_ownership',
  'workspace.manage_billing',
  'workspace.manage_integrations',
  'workspace.export_data',
  'members.read',
  'members.invite',
  'members.update_role',
  'members.remove',
  'members.read_audit',
  'product.read',
  'product.create',
  'product.update',
  'product.archive',
  'product.delete',
  'product.manage_members',
  'pillar.read',
  'pillar.create',
  'pillar.update',
  'pillar.delete',
  'objective.read',
  'objective.create',
  'objective.update',
  'objective.delete',
  'objective.transition',
  'key_result.read',
  'key_result.create',
  'key_result.update',
  'key_result.delete',
  'persona.read',
  'persona.create',
  'persona.update',
  'persona.delete',
  'persona.link_product',
  'evidence.read',
  'evidence.create',
  'evidence.update',
  'evidence.delete',
  'evidence.transition',
  'evidence.link_pain',
  'evidence.bulk_import',
  'pain.read',
  'pain.create',
  'pain.update',
  'pain.delete',
  'pain.transition',
  'pain.discard',
  'pain.link_persona',
  'pain.link_hypothesis',
  'hypothesis.read',
  'hypothesis.create',
  'hypothesis.update',
  'hypothesis.delete',
  'hypothesis.transition',
  'hypothesis.discard',
  'hypothesis.link_roadmap',
  'experiment.read',
  'experiment.create',
  'experiment.update',
  'experiment.delete',
  'experiment.transition',
  'experiment.record_result',
  'roadmap_item.read',
  'roadmap_item.create',
  'roadmap_item.update',
  'roadmap_item.delete',
  'roadmap_item.transition',
  'roadmap_item.cancel',
  'roadmap_item.rollback',
  'roadmap_item.sync_external',
  'roadmap_item.reorder',
  'outcome.read',
  'outcome.create',
  'outcome.update',
  'outcome.delete',
  'outcome.transition',
  'comment.read',
  'comment.create',
  'comment.update_own',
  'comment.delete_own',
  'comment.moderate',
  'asset.read',
  'asset.upload',
  'asset.delete',
  'audit.read',
  'audit.export',
  'analytics.read_dashboard',
  'analytics.read_funnel',
  'analytics.export',
  'impersonate.use',
  'webhook.manage',
  'api_token.manage',
] as const;

export type Permission = (typeof PERMISSIONS)[number];
export type WorkspaceRole = 'owner' | 'admin' | 'member' | 'viewer' | 'guest';
export type ProductRole = 'owner' | 'editor' | 'viewer' | 'none';

const ALL_PERMISSIONS = new Set<Permission>(PERMISSIONS);

const WORKSPACE_ROLE_PERMISSIONS: Record<WorkspaceRole, Permission[]> = {
  owner: [...PERMISSIONS],
  admin: without(PERMISSIONS, [
    'workspace.delete',
    'workspace.transfer_ownership',
    'workspace.manage_billing',
    'impersonate.use',
  ]),
  member: [
    'workspace.read',
    'members.read',
    'product.read',
    'pillar.read',
    'objective.read',
    'key_result.read',
    'persona.read',
    'analytics.read_dashboard',
    'analytics.read_funnel',
    'audit.read',
    'asset.read',
    'asset.upload',
  ],
  viewer: [
    'workspace.read',
    'members.read',
    'product.read',
    'pillar.read',
    'objective.read',
    'key_result.read',
    'persona.read',
    'evidence.read',
    'pain.read',
    'hypothesis.read',
    'experiment.read',
    'roadmap_item.read',
    'outcome.read',
    'comment.read',
    'asset.read',
    'analytics.read_dashboard',
    'analytics.read_funnel',
  ],
  guest: ['workspace.read'],
};

const PRODUCT_ROLE_PERMISSIONS: Record<ProductRole, Permission[]> = {
  owner: [
    'product.read',
    'product.update',
    'product.archive',
    'product.manage_members',
    'objective.read',
    'objective.create',
    'objective.update',
    'objective.delete',
    'objective.transition',
    'key_result.read',
    'key_result.create',
    'key_result.update',
    'key_result.delete',
    'persona.read',
    'persona.link_product',
    'evidence.read',
    'evidence.create',
    'evidence.update',
    'evidence.delete',
    'evidence.transition',
    'evidence.link_pain',
    'evidence.bulk_import',
    'pain.read',
    'pain.create',
    'pain.update',
    'pain.delete',
    'pain.transition',
    'pain.discard',
    'pain.link_persona',
    'pain.link_hypothesis',
    'hypothesis.read',
    'hypothesis.create',
    'hypothesis.update',
    'hypothesis.delete',
    'hypothesis.transition',
    'hypothesis.discard',
    'hypothesis.link_roadmap',
    'experiment.read',
    'experiment.create',
    'experiment.update',
    'experiment.delete',
    'experiment.transition',
    'experiment.record_result',
    'roadmap_item.read',
    'roadmap_item.create',
    'roadmap_item.update',
    'roadmap_item.delete',
    'roadmap_item.transition',
    'roadmap_item.reorder',
    'outcome.read',
    'outcome.create',
    'outcome.update',
    'outcome.transition',
    'comment.read',
    'comment.create',
    'comment.update_own',
    'comment.delete_own',
    'comment.moderate',
    'asset.read',
    'asset.upload',
    'asset.delete',
    'analytics.read_dashboard',
    'analytics.read_funnel',
    'audit.read',
  ],
  editor: [
    'product.read',
    'objective.read',
    'key_result.read',
    'key_result.update',
    'persona.read',
    'evidence.read',
    'evidence.create',
    'evidence.update',
    'evidence.delete',
    'evidence.transition',
    'evidence.link_pain',
    'pain.read',
    'pain.create',
    'pain.update',
    'pain.delete',
    'pain.transition',
    'pain.discard',
    'pain.link_persona',
    'pain.link_hypothesis',
    'hypothesis.read',
    'hypothesis.create',
    'hypothesis.update',
    'hypothesis.delete',
    'hypothesis.transition',
    'hypothesis.discard',
    'hypothesis.link_roadmap',
    'experiment.read',
    'experiment.create',
    'experiment.update',
    'experiment.delete',
    'experiment.transition',
    'experiment.record_result',
    'roadmap_item.read',
    'roadmap_item.create',
    'roadmap_item.update',
    'roadmap_item.delete',
    'roadmap_item.transition',
    'roadmap_item.reorder',
    'outcome.read',
    'outcome.create',
    'outcome.update',
    'outcome.transition',
    'comment.read',
    'comment.create',
    'comment.update_own',
    'comment.delete_own',
    'asset.read',
    'asset.upload',
  ],
  viewer: [
    'product.read',
    'evidence.read',
    'pain.read',
    'hypothesis.read',
    'experiment.read',
    'roadmap_item.read',
    'outcome.read',
    'comment.read',
    'asset.read',
  ],
  none: [],
};

const PRODUCT_SCOPED_PERMISSIONS = new Set<Permission>([
  'product.read',
  'product.update',
  'product.archive',
  'product.delete',
  'product.manage_members',
  'evidence.read',
  'evidence.create',
  'evidence.update',
  'evidence.delete',
  'evidence.transition',
  'evidence.link_pain',
  'evidence.bulk_import',
  'pain.read',
  'pain.create',
  'pain.update',
  'pain.delete',
  'pain.transition',
  'pain.discard',
  'pain.link_persona',
  'pain.link_hypothesis',
  'hypothesis.read',
  'hypothesis.create',
  'hypothesis.update',
  'hypothesis.delete',
  'hypothesis.transition',
  'hypothesis.discard',
  'hypothesis.link_roadmap',
  'experiment.read',
  'experiment.create',
  'experiment.update',
  'experiment.delete',
  'experiment.transition',
  'experiment.record_result',
  'roadmap_item.read',
  'roadmap_item.create',
  'roadmap_item.update',
  'roadmap_item.delete',
  'roadmap_item.transition',
  'roadmap_item.cancel',
  'roadmap_item.rollback',
  'roadmap_item.sync_external',
  'roadmap_item.reorder',
  'outcome.read',
  'outcome.create',
  'outcome.update',
  'outcome.delete',
  'outcome.transition',
]);

export async function getEffectivePermissions(
  pool: Pool,
  userId: string,
  context: { workspaceId: string; productId?: string },
): Promise<Permission[]> {
  const membership = await getWorkspaceRole(pool, userId, context.workspaceId);
  if (!membership) return [];

  const effective = new Set<Permission>(
    WORKSPACE_ROLE_PERMISSIONS[membership.role as WorkspaceRole] ?? [],
  );

  if (membership.role === 'owner' || membership.role === 'admin') {
    return [...effective];
  }

  if (context.productId) {
    const productRole = await getProductRole(pool, userId, context.productId);
    if (productRole === 'none') {
      for (const permission of PRODUCT_SCOPED_PERMISSIONS) effective.delete(permission);
    } else if (productRole) {
      addAll(effective, PRODUCT_ROLE_PERMISSIONS[productRole]);
    } else if (membership.role === 'member') {
      addAll(effective, PRODUCT_ROLE_PERMISSIONS.viewer);
    } else if (membership.role === 'guest') {
      for (const permission of PRODUCT_SCOPED_PERMISSIONS) effective.delete(permission);
    }
  }

  return [...effective];
}

export async function hasPermission(
  pool: Pool,
  userId: string,
  permission: Permission,
  context: { workspaceId: string; productId?: string },
): Promise<boolean> {
  const permissions = await getEffectivePermissions(pool, userId, context);
  return permissions.includes(permission);
}

export async function assertWorkspacePermission(
  pool: Pool,
  request: FastifyRequest,
  workspaceId: string,
  permission: Permission,
): Promise<void> {
  if (workspaceId !== request.user.workspace_id) {
    throw permissionDenied(permission, 'workspace', { workspace_id: workspaceId }, request.user.role);
  }

  const allowed = await hasPermission(pool, request.user.user_id, permission, { workspaceId });
  if (!allowed) {
    throw permissionDenied(permission, 'workspace', { workspace_id: workspaceId }, request.user.role);
  }
}

export async function assertProductPermission(
  pool: Pool,
  request: FastifyRequest,
  productId: string,
  permission: Permission,
): Promise<void> {
  const product = await getProductContext(pool, productId, request.user.workspace_id);
  if (!product || product.workspace_id !== request.user.workspace_id) {
    throw new AppError(404, 'NOT_FOUND', 'Product not found');
  }

  const allowed = await hasPermission(pool, request.user.user_id, permission, {
    workspaceId: product.workspace_id,
    productId,
  });
  if (!allowed) {
    throw permissionDenied(permission, 'product', { product_id: productId }, request.user.role);
  }
}

export async function getProductRole(
  pool: Pool,
  userId: string,
  productId: string,
): Promise<ProductRole | null> {
  const result = await pool.query<{ role: ProductRole }>(
    `SELECT role
     FROM product_members
     WHERE product_id = $1 AND user_id = $2`,
    [productId, userId],
  );
  return result.rows[0]?.role ?? null;
}

function permissionDenied(
  required: Permission,
  scope: 'workspace' | 'product',
  context: Record<string, string>,
  workspaceRole: string,
) {
  const err = new AppError(403, 'PERMISSION_DENIED', 'Permissão insuficiente');
  (err as AppError & { details: unknown }).details = {
    required,
    scope,
    context,
    user_role: { workspace: workspaceRole },
  };
  return err;
}

async function getWorkspaceRole(pool: Pool, userId: string, workspaceId: string) {
  const result = await pool.query<{ role: WorkspaceRole }>(
    `SELECT role
     FROM workspace_members
     WHERE workspace_id = $1
       AND user_id = $2
       AND removed_at IS NULL`,
    [workspaceId, userId],
  );
  return result.rows[0] ?? null;
}

async function getProductContext(pool: Pool, productId: string, workspaceId: string) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('SELECT set_config(\'app.current_workspace\', $1, true)', [workspaceId]);
    const result = await client.query<{ workspace_id: string }>(
      `SELECT workspace_id
       FROM products
       WHERE id = $1 AND deleted_at IS NULL`,
      [productId],
    );
    await client.query('COMMIT');
    return result.rows[0] ?? null;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function addAll(target: Set<Permission>, permissions: Permission[]) {
  for (const permission of permissions) target.add(permission);
}

function without(source: readonly Permission[], excluded: Permission[]) {
  const excludedSet = new Set(excluded);
  return source.filter((permission) => !excludedSet.has(permission));
}

export function isKnownPermission(value: string): value is Permission {
  return ALL_PERMISSIONS.has(value as Permission);
}
