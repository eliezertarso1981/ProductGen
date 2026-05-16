import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { readFileSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

let stopContainer: () => Promise<unknown>;

export async function setup() {
  // Sobe Postgres 16 em container isolado — porta atribuída aleatoriamente pelo Docker
  const container = await new PostgreSqlContainer('postgres:16')
    .withDatabase('productgen_test')
    .withUsername('postgres')
    .withPassword('postgres')
    .start();

  const dbUrl = container.getConnectionUri();
  const appDbUrl = dbUrl.replace('postgres:postgres@', 'productgen_app:postgres@');

  // Propaga para todos os workers de teste (process.env é herdado pelos workers)
  process.env.DATABASE_URL = appDbUrl;
  process.env.ADMIN_DATABASE_URL = dbUrl;
  process.env.JWT_SECRET = 'test-jwt-secret-32-chars-minimum-here!!';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.LOG_LEVEL = 'warn'; // silencia logs nos testes

  // Aplica o schema completo (tabelas, triggers, RLS, lifecycle_transitions)
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const schemaPath = join(process.cwd(), '..', 'docs', 'reference', 'database', 'productgen_schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  await client.query(schema);
  await client.query(`
    CREATE ROLE productgen_app LOGIN PASSWORD 'postgres';
    GRANT USAGE ON SCHEMA public TO productgen_app;
    GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO productgen_app;
  `);
  await client.end();

  stopContainer = () => container.stop();
}

export async function teardown() {
  await stopContainer?.();
}
