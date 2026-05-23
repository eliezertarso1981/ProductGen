import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Pool } from 'pg';
import { buildApp } from '../src/app';

const SIGNUP_PASSWORD = 'Productgen1!';

let app: ReturnType<typeof buildApp>;
let adminPool: Pool;

beforeAll(async () => {
  app = buildApp();
  await app.ready();
  adminPool = new Pool({ connectionString: process.env.ADMIN_DATABASE_URL });
});

afterAll(async () => {
  await app.close();
  await adminPool.end();
});

describe('Onboarding happy path', () => {
  it('signup → workspace → plan → complete', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const email = `onboard-${suffix}@example.com`;

    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        full_name: 'Onboarding User',
        email,
        password: SIGNUP_PASSWORD,
        accept_terms: true,
        marketing_opt_in: false,
      },
    });
    expect(signup.statusCode).toBe(201);
    const signupBody = JSON.parse(signup.body) as { token: string; user: { email: string } };
    expect(signupBody.user.email).toBe(email);
    expect(signupBody.token).toBeDefined();

    const meBefore = await app.inject({
      method: 'GET',
      url: '/auth/me',
      headers: { Authorization: `Bearer ${signupBody.token}` },
    });
    expect(meBefore.statusCode).toBe(200);
    expect(JSON.parse(meBefore.body).workspaces).toEqual([]);

    const workspace = await app.inject({
      method: 'POST',
      url: '/workspaces',
      headers: { Authorization: `Bearer ${signupBody.token}` },
      payload: {
        name: `Empresa ${suffix}`,
        company_size: '11-50',
        country_code: 'BR',
      },
    });
    expect(workspace.statusCode).toBe(201);
    const workspaceBody = JSON.parse(workspace.body) as {
      workspace: { id: string; slug: string };
    };

    const plan = await app.inject({
      method: 'PATCH',
      url: `/workspaces/${workspaceBody.workspace.id}/plan`,
      headers: {
        Authorization: `Bearer ${signupBody.token}`,
        'X-Workspace-Id': workspaceBody.workspace.id,
      },
      payload: { plan: 'starter' },
    });
    expect(plan.statusCode).toBe(200);

    const product = await app.inject({
      method: 'POST',
      url: `/workspaces/${workspaceBody.workspace.id}/products`,
      headers: {
        Authorization: `Bearer ${signupBody.token}`,
        'X-Workspace-Id': workspaceBody.workspace.id,
      },
      payload: { name: 'Produto inicial' },
    });
    expect(product.statusCode).toBe(201);

    const complete = await app.inject({
      method: 'POST',
      url: '/onboarding/complete',
      headers: {
        Authorization: `Bearer ${signupBody.token}`,
        'X-Workspace-Id': workspaceBody.workspace.id,
      },
    });
    expect(complete.statusCode).toBe(200);
    expect(JSON.parse(complete.body).onboarded_at).toBeDefined();

    const status = await app.inject({
      method: 'GET',
      url: '/auth/onboarding-status',
      headers: {
        Authorization: `Bearer ${signupBody.token}`,
        'X-Workspace-Id': workspaceBody.workspace.id,
      },
    });
    expect(status.statusCode).toBe(200);
    const statusBody = JSON.parse(status.body);
    expect(statusBody.has_workspace).toBe(true);
    expect(statusBody.onboarded).toBe(true);
    expect(statusBody.plan).toBe('starter');
  });
});

describe('POST /workspaces', () => {
  it('retorna 409 quando o slug já existe', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const email = `slug-dup-${suffix}@example.com`;
    const slug = `dup-${suffix}`;

    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        full_name: 'Slug Dup User',
        email,
        password: SIGNUP_PASSWORD,
        accept_terms: true,
      },
    });
    expect(signup.statusCode).toBe(201);
    const token = (JSON.parse(signup.body) as { token: string }).token;

    const first = await app.inject({
      method: 'POST',
      url: '/workspaces',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'Primeira Empresa',
        slug,
        company_size: '1-10',
        country_code: 'BR',
      },
    });
    expect(first.statusCode).toBe(201);

    const second = await app.inject({
      method: 'POST',
      url: '/workspaces',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'Segunda Empresa',
        slug,
        company_size: '1-10',
        country_code: 'BR',
      },
    });
    expect(second.statusCode).toBe(409);
    const body = JSON.parse(second.body) as { error: { code: string } };
    expect(body.error.code).toBe('SLUG_TAKEN');
  });

  it('retorna 400 para logo_url inválida', async () => {
    const suffix = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const signup = await app.inject({
      method: 'POST',
      url: '/auth/signup',
      payload: {
        full_name: 'Invalid Logo User',
        email: `logo-${suffix}@example.com`,
        password: SIGNUP_PASSWORD,
        accept_terms: true,
      },
    });
    const token = (JSON.parse(signup.body) as { token: string }).token;

    const res = await app.inject({
      method: 'POST',
      url: '/workspaces',
      headers: { Authorization: `Bearer ${token}` },
      payload: {
        name: 'Empresa Logo',
        company_size: '11-50',
        country_code: 'BR',
        logo_url: 'not-a-url',
      },
    });
    expect(res.statusCode).toBe(400);
  });
});

describe('GET /auth/email-available', () => {
  it('retorna available true para email novo', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/email-available?email=novo-' + Date.now() + '@example.com',
    });
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res.body).available).toBe(true);
  });
});

describe('GET /plans', () => {
  it('retorna catálogo de planos', async () => {
    const res = await app.inject({ method: 'GET', url: '/plans' });
    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.body) as {
      plans: Array<{ code: string; display: { description: string } }>;
    };
    expect(body.plans.length).toBeGreaterThanOrEqual(3);
    const starter = body.plans.find((p) => p.code === 'starter');
    expect(starter?.display.description).toBeTruthy();
  });
});
