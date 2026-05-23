import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';
import { runMigrations } from '../src/db/run-migrations';

const cliArgs = process.argv.slice(2).filter((arg) => !arg.startsWith('--'));
const withSeed = process.argv.includes('--seed');
const skipSchema = process.argv.includes('--skip-schema');
const schemaPath = resolve(
  process.cwd(),
  cliArgs[0] ?? '../docs/reference/database/productgen_schema.sql',
);
const seedPath = resolve(process.cwd(), cliArgs[1] ?? '../DB/seed-dev.sql');

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL é obrigatório.');
    process.exit(1);
  }

  const needsRailwaySsl =
    databaseUrl.includes('railway') ||
    databaseUrl.includes('rlwy.net') ||
    process.env.DATABASE_SSL === 'true';

  const client = new Client({
    connectionString: databaseUrl,
    ssl: needsRailwaySsl ? { rejectUnauthorized: false } : undefined,
  });
  await client.connect();

  try {
    if (!skipSchema) {
      const schemaSql = await readFile(schemaPath, 'utf-8');
      console.log(`Aplicando schema: ${schemaPath}`);
      await client.query(schemaSql);
      console.log('Schema aplicado.');
    }

    await runMigrations(client);

    if (withSeed) {
      const seedSql = await readFile(seedPath, 'utf-8');
      console.log(`Aplicando seed: ${seedPath}`);
      await client.query(seedSql);
      console.log('Seed aplicado.');
    }
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
