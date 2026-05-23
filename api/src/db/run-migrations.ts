import { readdir, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Client } from 'pg';

function resolveMigrationsDir(): string {
  const candidates = [
    process.env.MIGRATIONS_DIR,
    resolve(process.cwd(), 'migrations'),
    resolve(process.cwd(), '../DB/migrations'),
  ].filter((value): value is string => Boolean(value));

  for (const dir of candidates) {
    if (existsSync(dir)) return dir;
  }

  throw new Error(
    `Pasta de migrações não encontrada. Tentou: ${candidates.join(', ')}`,
  );
}

export async function runMigrations(client: Client, migrationsDir?: string): Promise<void> {
  const dir = migrationsDir ?? resolveMigrationsDir();
  const files = (await readdir(dir))
    .filter((name) => name.endsWith('.sql'))
    .sort((a, b) => a.localeCompare(b));

  for (const file of files) {
    const migrationPath = join(dir, file);
    const migrationSql = await readFile(migrationPath, 'utf-8');
    console.log(`Aplicando migração: ${file}`);
    await client.query(migrationSql);
  }
  console.log('Migrações aplicadas.');
}

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
    await runMigrations(client);
  } finally {
    await client.end();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
