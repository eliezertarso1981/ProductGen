import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { Client } from 'pg';

let stopContainer: () => Promise<unknown>;

const testJwtPrivateKey = `-----BEGIN PRIVATE KEY-----
MIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQDUrg4NYmMreLCI
k3nhkgNxxJ3A5wQF7G1ARPxt8KuN1GZOYaVZSYfnig7N4QBXtAsUdMEtBg+egObW
gZFOzcftpQHHnr23Hue4ceALyfzMOsokItvwV8YwrKLaw95fpCIbGvT/1MYn8zqN
lTXNjVjsNRDKXqx7Sd62vdU8GbBQaHGSBR0K0ByxQRoEECVa4Icy3Q+yFVgvRuNG
AqBKPXThKmOX9vHOGSVcALTkXugWW5ew3Gcxq7Bv2LpHodA31ZsKGqcBcBIN1yJ0
Acy0yZ+E58YSDWeSj0EZbuZScmYYlBRBSnkqTFpsUjFW5imn0meH23HcBueIaD8V
JTExar/XAgMBAAECggEAUbmmlbcSc5B3iaveAHOK1kte8VL0ZVBSNQmtVJPQYHpX
a9Qy5SoPysXu5WcKKil5vn0VBDeZhedzjMcSLs19f5DSK8KQlU8PbP15Qh52gYYv
yg4JJQSdmHOmStlMWMUqA+9qaOp60Lwy6lgFajzgCDhmANW7gs7CgcdVqrgWW/br
JRckVK+9+EXane4e6MUhJzHRkEIDUBn0M+lmaN/U3u1LxRKX/wvWckqBu0ts3K9k
KT6w4tFDn4NC7Eash3JnQREo3AwUmt86TpiLrKDSu0xXlDHT5Ge3R3jloqAFoIyf
OvPYn9VnNU8RZlKu64Ekua8ng+LJC5adVS5cHD05HQKBgQDp8e+zkPfhRuUudZkh
LHE5OK8IdH8iC0ARN82ovlpINpEr9HbXgtiaOXGqfovwTHnefDAfq1bWI8oYjoVC
l3KpiUbtWkGdb7fssLd6dUZYRBW/ueLVhAxl3lfI/7jmDFFoFsVmJ3YUr0ZMxutA
Bp91T+fsWHbnjxCGsBajZPRgmwKBgQDouubvybFp+lVNuIL48yJ1y/+tNHkEChop
g8dZsME60a7Gr/RSp442Uukv4SoJttGt0GXklwwCF3489+7BS8KmAAhRC0aKdqv3
4gL5B6I6cEGlpVKQu5nmQNZHU4f6GQ5eZ7wo4povNGkjRheYzDaT9Olo+BchCxRi
tSxi56LbdQKBgQC5VkJgL+kxP8kxFVlLPro0awO/3wsZHXCUM3FqzeMYcqJwACxm
b/LJu9ihCcAzj2K9MAWwET2qSJBDBCXuq6zbQzY9s9NntqoviZDSIzanlsjkK4/Z
N9PaoFtLkcwZ9IhJvkCEvZ5+pJ09FhopjxWlCrjiNPN+X4joK3jD2acBIQKBgQCc
xmsTVRdCgPQ96vGvqnmoSMfvcc2jvvpoxPDhpoREj0PhbF5135GZXrjfHBspeBI/
uIcrOeVI83KCt7IKXHK/SH5RufrHA7JMxd+iylWqcDyIzZmVDgtaZIr0eXy8KWzY
g6DpGd0rt26r6Ge08rxBZ1Zk89sA02nkJI/GAKxgkQKBgAnKGiY8jIXZ4dERxmj3
RtRoxbFvL1INHUbCc6u5+OVdHw8F4qaGJ0TuqrjMzOCwGeRyF0hpwCRFH8vxVXJN
w5aKo1xx4ThyGS2cPTpgUVySeJ1qJh+sFy0spn1EY/Fk0C2dW1Vve1F+BJFLOETe
VUtBfJGo138ZCo9Glu3wb2Es
-----END PRIVATE KEY-----`;

const testJwtPublicKey = `-----BEGIN PUBLIC KEY-----
MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA1K4ODWJjK3iwiJN54ZID
ccSdwOcEBextQET8bfCrjdRmTmGlWUmH54oOzeEAV7QLFHTBLQYPnoDm1oGRTs3H
7aUBx569tx7nuHHgC8n8zDrKJCLb8FfGMKyi2sPeX6QiGxr0/9TGJ/M6jZU1zY1Y
7DUQyl6se0netr3VPBmwUGhxkgUdCtAcsUEaBBAlWuCHMt0PshVYL0bjRgKgSj10
4Spjl/bxzhklXAC05F7oFluXsNxnMauwb9i6R6HQN9WbChqnAXASDdcidAHMtMmf
hOfGEg1nko9BGW7mUnJmGJQUQUp5KkxabFIxVuYpp9Jnh9tx3AbniGg/FSUxMWq/
1wIDAQAB
-----END PUBLIC KEY-----`;

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
  process.env.JWT_PRIVATE_KEY = testJwtPrivateKey;
  process.env.JWT_PUBLIC_KEY = testJwtPublicKey;
  process.env.COOKIE_SECRET = 'test-cookie-secret-32-chars-minimum!!';
  process.env.NODE_ENV = 'test';
  process.env.PORT = '3000';
  process.env.LOG_LEVEL = 'warn'; // silencia logs nos testes

  // Aplica o schema completo (tabelas, triggers, RLS, lifecycle_transitions)
  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  const schemaPath = join(process.cwd(), '..', 'docs', 'reference', 'database', 'productgen_schema.sql');
  const schema = readFileSync(schemaPath, 'utf-8');
  await client.query(schema);

  const migrationsDir = join(process.cwd(), '..', 'DB', 'migrations');
  // productgen_schema.sql already includes 003 usage tables/triggers; re-applying 003 fails.
  const migrationFiles = readdirSync(migrationsDir)
    .filter((name) => name.endsWith('.sql') && name !== '003_workspace_usage.sql')
    .sort((a, b) => a.localeCompare(b));
  for (const file of migrationFiles) {
    await client.query(readFileSync(join(migrationsDir, file), 'utf-8'));
  }

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
