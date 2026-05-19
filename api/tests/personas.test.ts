import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';
import { authHeader, createFixtures, loginAs } from './helpers';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;

let token: string;
let workspaceId: string;
let productId: string;

beforeAll(async () => {
  app = buildApp();
  await app.ready();

  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });

  const fixtures = await createFixtures(adminPool);
  workspaceId = fixtures.workspace.id;
  productId = fixtures.product.id;
  token = await loginAs(app, fixtures.email, fixtures.slug);
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('CRUD de personas', () => {
  it('cria, lista, atualiza e remove personas com code humano PS-XX', async () => {
    const created = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceId}/personas`,
      headers: authHeader(token),
      payload: {
        name: 'Camila Souza',
        description: 'Product Manager',
        metadata: { role: 'Product Manager', avatarId: 'camila', scope: 'workspace' },
      },
    });

    expect(created.statusCode).toBe(201);
    const persona = JSON.parse(created.body);
    expect(persona.id).toBeDefined();
    expect(persona.code).toBe('PS-01');
    expect(persona.workspace_id).toBe(workspaceId);
    expect(persona.metadata.role).toBe('Product Manager');

    const listed = await app.inject({
      method: 'GET',
      url: `/workspaces/${workspaceId}/personas`,
      headers: authHeader(token),
    });

    expect(listed.statusCode).toBe(200);
    expect(JSON.parse(listed.body).map((item: { code: string }) => item.code)).toContain('PS-01');

    const updated = await app.inject({
      method: 'PATCH',
      url: `/personas/${persona.id}`,
      headers: authHeader(token),
      payload: {
        name: 'Camila Souza Atualizada',
        metadata: { role: 'Head of Product', scope: 'workspace' },
      },
    });

    expect(updated.statusCode).toBe(200);
    const updatedBody = JSON.parse(updated.body);
    expect(updatedBody.name).toBe('Camila Souza Atualizada');
    expect(updatedBody.code).toBe('PS-01');
    expect(updatedBody.metadata.role).toBe('Head of Product');

    const deleted = await app.inject({
      method: 'DELETE',
      url: `/personas/${persona.id}`,
      headers: authHeader(token),
    });

    expect(deleted.statusCode).toBe(204);

    const missing = await app.inject({
      method: 'GET',
      url: `/personas/${persona.id}`,
      headers: authHeader(token),
    });
    expect(missing.statusCode).toBe(404);
  });

  it('vincula e desvincula personas a dores opcionalmente', async () => {
    const createdPersona = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceId}/personas`,
      headers: authHeader(token),
      payload: { name: 'Eduardo Lima' },
    });
    expect(createdPersona.statusCode).toBe(201);
    const persona = JSON.parse(createdPersona.body);

    const createdPain = await app.inject({
      method: 'POST',
      url: `/products/${productId}/pains`,
      headers: authHeader(token),
      payload: {
        title: 'Feedback disperso',
        description: 'Feedback de clientes espalhado em muitos canais',
        severity: 4,
      },
    });
    expect(createdPain.statusCode).toBe(201);
    const pain = JSON.parse(createdPain.body);

    const linked = await app.inject({
      method: 'POST',
      url: `/pains/${pain.id}/personas/${persona.id}`,
      headers: authHeader(token),
    });
    expect(linked.statusCode).toBe(201);
    expect(JSON.parse(linked.body)).toEqual({ pain_id: pain.id, persona_id: persona.id });

    const listed = await app.inject({
      method: 'GET',
      url: `/pains/${pain.id}/personas`,
      headers: authHeader(token),
    });
    expect(listed.statusCode).toBe(200);
    const linkedPersonas = JSON.parse(listed.body);
    expect(linkedPersonas).toHaveLength(1);
    expect(linkedPersonas[0].code).toBe(persona.code);

    const unlinked = await app.inject({
      method: 'DELETE',
      url: `/pains/${pain.id}/personas/${persona.id}`,
      headers: authHeader(token),
    });
    expect(unlinked.statusCode).toBe(204);

    const listedAfterUnlink = await app.inject({
      method: 'GET',
      url: `/pains/${pain.id}/personas`,
      headers: authHeader(token),
    });
    expect(JSON.parse(listedAfterUnlink.body)).toHaveLength(0);
  });
});
