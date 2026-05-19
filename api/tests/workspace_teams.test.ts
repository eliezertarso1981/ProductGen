import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;

let token: string;
let workspaceId: string;
let productId: string;
let memberUserId: string;
let teamId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });

  const fixtures = await createFixtures(adminPool);
  workspaceId = fixtures.workspace.id;
  productId = fixtures.product.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);

  const memberRes = await adminPool.query<{ id: string }>(
    `INSERT INTO users (email, name) VALUES ($1, 'Team Member') RETURNING id`,
    [`team-member-${Date.now()}@example.com`],
  );
  memberUserId = memberRes.rows[0].id;

  await adminPool.query(
    `INSERT INTO workspace_members (workspace_id, user_id, role) VALUES ($1, $2, 'member')`,
    [workspaceId, memberUserId],
  );
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('CRUD de workspace_teams', () => {
  it('POST /workspaces/:workspace_id/teams cria time com código humano e vínculos iniciais', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceId}/teams`,
      headers: authHeader(token),
      payload: {
        name: 'Squad Plataforma',
        description: 'Grupo responsável pelo core',
        color: 'var(--primary)',
        member_ids: [memberUserId],
        product_ids: [productId],
      },
    });

    expect(res.statusCode).toBe(201);
    const body = JSON.parse(res.body);
    expect(body.id).toBeDefined();
    expect(body.workspace_id).toBe(workspaceId);
    expect(body.code).toMatch(/^TM-\d{2,}$/);
    expect(body.name).toBe('Squad Plataforma');
    expect(body.member_ids).toContain(memberUserId);
    expect(body.product_ids).toContain(productId);
    teamId = body.id;
  });

  it('GET /workspaces/:workspace_id/teams lista times do workspace', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/teams`,
      headers: authHeader(token),
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          id: teamId,
          code: expect.stringMatching(/^TM-\d{2,}$/),
        }),
      ]),
    );
  });

  it('PATCH /teams/:id atualiza dados do time', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/teams/${teamId}`,
      headers: authHeader(token),
      payload: { name: 'Squad Growth', description: null },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body);
    expect(body.name).toBe('Squad Growth');
    expect(body.description).toBeNull();
    expect(body.code).toMatch(/^TM-\d{2,}$/);
  });

  it('remove e reassocia membro do time', async () => {
    const remove = await app.inject({
      method: 'DELETE',
      url: `/teams/${teamId}/members/${memberUserId}`,
      headers: authHeader(token),
    });

    expect(remove.statusCode).toBe(200);
    expect(JSON.parse(remove.body).member_ids).not.toContain(memberUserId);

    const add = await app.inject({
      method: 'POST',
      url: `/teams/${teamId}/members/${memberUserId}`,
      headers: authHeader(token),
    });

    expect(add.statusCode).toBe(201);
    expect(JSON.parse(add.body).member_ids).toContain(memberUserId);
  });

  it('remove e reassocia produto ao time', async () => {
    const remove = await app.inject({
      method: 'DELETE',
      url: `/teams/${teamId}/products/${productId}`,
      headers: authHeader(token),
    });

    expect(remove.statusCode).toBe(200);
    expect(JSON.parse(remove.body).product_ids).not.toContain(productId);

    const add = await app.inject({
      method: 'POST',
      url: `/teams/${teamId}/products/${productId}`,
      headers: authHeader(token),
    });

    expect(add.statusCode).toBe(201);
    expect(JSON.parse(add.body).product_ids).toContain(productId);
  });

  it('DELETE /teams/:id faz soft delete e GET retorna 404', async () => {
    const del = await app.inject({
      method: 'DELETE',
      url: `/teams/${teamId}`,
      headers: authHeader(token),
    });

    expect(del.statusCode).toBe(204);

    const get = await app.inject({
      method: 'GET',
      url: `/teams/${teamId}`,
      headers: authHeader(token),
    });

    expect(get.statusCode).toBe(404);
  });
});
