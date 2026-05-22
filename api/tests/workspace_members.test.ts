import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;

let token: string;
let workspaceId: string;
let actorUserId: string;

let memberUserId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });

  const fixtures = await createFixtures(adminPool);
  workspaceId = fixtures.workspace.id;
  actorUserId = fixtures.user.id;

  token = await loginAs(app, fixtures.email, fixtures.slug);

  const memberRes = await adminPool.query<{ id: string }>(
    `INSERT INTO users (email, name) VALUES ($1, 'Member User') RETURNING id`,
    [`member-${Date.now()}@example.com`],
  );
  memberUserId = memberRes.rows[0].id;
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('CRUD de workspace_members', () => {
  it('GET /workspaces/:workspace_id/members lista os membros do workspace', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/members`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(Array.isArray(body)).toBe(true);
    expect(body.length).toBeGreaterThanOrEqual(1);

    const owner = body.find((m: any) => m.user_id === actorUserId);
    expect(owner).toBeTruthy();
    expect(owner.role).toBe('owner');
  });

  it('POST /workspaces/:workspace_id/members adiciona um membro (201)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceId}/members`,
      headers: authHeader(token),
      payload: {
        user_id: memberUserId,
        role: 'member',
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.workspace_id).toBe(workspaceId);
    expect(body.user_id).toBe(memberUserId);
    expect(body.role).toBe('member');
  });

  it('GET /workspaces/:workspace_id/members/:user_id retorna o membro', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/members/${memberUserId}`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.workspace_id).toBe(workspaceId);
    expect(body.user_id).toBe(memberUserId);
    expect(body.role).toBe('member');
  });

  it('PATCH /workspaces/:workspace_id/members/:user_id atualiza role', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/workspaces/${workspaceId}/members/${memberUserId}`,
      headers: authHeader(token),
      payload: { role: 'admin' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.role).toBe('admin');
  });

  it('PATCH /workspaces/:workspace_id/members/:user_id atualiza job_function', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/workspaces/${workspaceId}/members/${memberUserId}`,
      headers: authHeader(token),
      payload: { job_function: 'PM' },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.job_function).toBe('PM');
  });

  it('DELETE /workspaces/:workspace_id/members/:user_id faz soft delete (204) e GET retorna 404', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/workspaces/${workspaceId}/members/${memberUserId}`,
      headers: authHeader(token),
    });

    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/members/${memberUserId}`,
      headers: authHeader(token),
    });

    expect(get.statusCode).toBe(404);
  });

  it('RBAC: ator sem membership no workspace alvo recebe 403', async () => {
    const other = await createFixtures(adminPool);

    // Garante explicitamente que "other.user" não tem membership no workspace alvo
    // (caso exista por alguma razão no seed/fixtures)
    await adminPool.query(
      `
      UPDATE workspace_members
      SET removed_at = now()
      WHERE workspace_id = $1
        AND user_id = $2
        AND removed_at IS NULL
      `,
      [workspaceId, other.user.id],
    );

    // Validação: garantir que NÃO existe membership ativa para o "other" no workspace alvo
    const activeMembership = await adminPool.query(
      `
      SELECT 1
      FROM workspace_members
      WHERE workspace_id = $1
        AND user_id = $2
        AND removed_at IS NULL
      `,
      [workspaceId, other.user.id],
    );

    // eslint-disable-next-line no-console
    console.log('[RLS test debug] other.user.id =', other.user.id, 'activeMembership =', activeMembership.rows.length);
    expect(activeMembership.rows.length).toBe(0);

    const otherToken = await loginAs(app, other.email, other.slug);

    const res = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/members/${other.user.id}`,
      headers: authHeader(otherToken),
    });

    expect(res.statusCode).toBe(403);
    expect(JSON.parse(res.body).error.code).toBe('PERMISSION_DENIED');
  });
});
