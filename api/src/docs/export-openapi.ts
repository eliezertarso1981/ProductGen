import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { generateKeyPairSync } from 'node:crypto';

type BuildApp = typeof import('../app').buildApp;
type AppWithSwagger = ReturnType<BuildApp> & {
  swagger: () => unknown;
};

const outputPath = resolve(
  process.cwd(),
  process.argv[2] ?? '../docs/static/openapi/productgen.json',
);

async function main() {
  ensureEnvForDocsExport();
  const { buildApp } = await import('../app');
  const app = buildApp() as AppWithSwagger;

  try {
    await app.ready();
    const openapi = app.swagger();

    await mkdir(dirname(outputPath), { recursive: true });
    await writeFile(outputPath, `${JSON.stringify(openapi, null, 2)}\n`, 'utf-8');

    console.log(`OpenAPI exportado para ${outputPath}`);
  } finally {
    await app.close();
  }
}

function ensureEnvForDocsExport() {
  ensureJwtKeysForDocsExport();

  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = 'postgresql://openapi:openapi@127.0.0.1:5432/productgen_openapi';
  }

  if (!process.env.COOKIE_SECRET) {
    process.env.COOKIE_SECRET = 'openapi-docs-check-cookie-secret-min-32-chars';
  }
}

function ensureJwtKeysForDocsExport() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) return;

  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.JWT_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
