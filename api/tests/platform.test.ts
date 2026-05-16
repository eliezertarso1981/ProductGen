import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { createFixtures, loginAs, authHeader } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;
let token: string;
let productId: string;
let userId: string;
let commentId: string;
let assignmentId: string;
let decisionLogId: string;
let assetId: string;
let attachmentId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
  const fixtures = await createFixtures(adminPool);
  productId = fixtures.product.id;
  userId = fixtures.user.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('P4 platform — colaboração, governança, eventos e assets', () => {
  it('cria, lista e remove comentário polimórfico', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/entities/product/${productId}/comments`,
      headers: authHeader(token),
      payload: {
        content: 'Comentário de contexto para o produto',
        visibility: 'public',
      },
    });
    expect(create.statusCode).toBe(201);
    commentId = JSON.parse(create.body).id;

    const list = await app.inject({
      method: 'GET',
      url: `/entities/product/${productId}/comments`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBe(1);

    const del = await app.inject({
      method: 'DELETE',
      url: `/comments/${commentId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);
  });

  it('cria atribuição primary e encerra atribuição', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/entities/product/${productId}/assignments`,
      headers: authHeader(token),
      payload: {
        user_id: userId,
        assignment_role: 'pm_owner',
        is_primary: true,
      },
    });
    expect(create.statusCode).toBe(201);
    const body = JSON.parse(create.body);
    assignmentId = body.id;
    expect(body.is_primary).toBe(true);

    const list = await app.inject({
      method: 'GET',
      url: `/entities/product/${productId}/assignments`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBe(1);

    const close = await app.inject({
      method: 'DELETE',
      url: `/entity-assignments/${assignmentId}`,
      headers: authHeader(token),
    });
    expect(close.statusCode).toBe(204);
  });

  it('registra decision log e consulta entity_events', async () => {
    const create = await app.inject({
      method: 'POST',
      url: `/entities/product/${productId}/decision-logs`,
      headers: authHeader(token),
      payload: {
        decision_type: 'strategic_pivot',
        title: 'Focar retenção',
        rationale: 'Retenção virou gargalo principal do produto.',
      },
    });
    expect(create.statusCode).toBe(201);
    decisionLogId = JSON.parse(create.body).id;

    const list = await app.inject({
      method: 'GET',
      url: `/entities/product/${productId}/decision-logs`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBe(1);

    const events = await app.inject({
      method: 'GET',
      url: `/entities/product/${productId}/events`,
      headers: authHeader(token),
    });
    expect(events.statusCode).toBe(200);
    expect(JSON.parse(events.body).length).toBeGreaterThan(0);

    const del = await app.inject({
      method: 'DELETE',
      url: `/decision-logs/${decisionLogId}`,
      headers: authHeader(token),
    });
    expect(del.statusCode).toBe(204);
  });

  it('registra media asset e anexa em uma entidade', async () => {
    const create = await app.inject({
      method: 'POST',
      url: '/media-assets',
      headers: authHeader(token),
      payload: {
        filename: 'mockup.png',
        mime_type: 'image/png',
        size_bytes: 12345,
        storage_provider: 'local',
        storage_bucket: 'productgen-tests',
        storage_key: 'mockups/mockup.png',
        asset_type: 'image',
      },
    });
    expect(create.statusCode).toBe(201);
    assetId = JSON.parse(create.body).id;

    const attach = await app.inject({
      method: 'POST',
      url: `/entities/product/${productId}/assets`,
      headers: authHeader(token),
      payload: {
        asset_id: assetId,
        role: 'attachment',
      },
    });
    expect(attach.statusCode).toBe(201);
    attachmentId = JSON.parse(attach.body).id;

    const list = await app.inject({
      method: 'GET',
      url: `/entities/product/${productId}/assets`,
      headers: authHeader(token),
    });
    expect(list.statusCode).toBe(200);
    expect(JSON.parse(list.body).length).toBe(1);

    const detach = await app.inject({
      method: 'DELETE',
      url: `/entity-assets/${attachmentId}`,
      headers: authHeader(token),
    });
    expect(detach.statusCode).toBe(204);

    const delAsset = await app.inject({
      method: 'DELETE',
      url: `/media-assets/${assetId}`,
      headers: authHeader(token),
    });
    expect(delAsset.statusCode).toBe(204);
  });
});

