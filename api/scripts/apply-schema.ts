import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { Client } from 'pg';
import 'dotenv/config';

const schemaPath = resolve(
  process.cwd(),
  process.argv[2] ?? '../docs/reference/database/productgen_schema.sql',
);
const seedPath = resolve(process.cwd(), process.argv[3] ?? '../DB/seed-dev.sql');

async function main() {
  const withSeed = process.argv.includes('--seed');
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('DATABASE_URL é obrigatório.');
    process.exit(1);
  }

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const schemaSql = await readFile(schemaPath, 'utf-8');
    console.log(`Aplicando schema: ${schemaPath}`);
    await client.query(schemaSql);
    console.log('Schema aplicado.');

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
