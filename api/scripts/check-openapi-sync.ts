import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { generateKeyPairSync } from 'node:crypto';

type BuildApp = typeof import('../src/app').buildApp;
type AppWithSwagger = ReturnType<BuildApp> & {
  swagger: () => unknown;
  ready: () => Promise<void>;
  close: () => Promise<void>;
};

const staticPath = resolve(
  process.cwd(),
  process.argv[2] ?? '../docs/static/openapi/productgen.json',
);

async function main() {
  ensureJwtKeysForDocsCheck();
  const { buildApp } = await import('../src/app');
  const app = buildApp() as AppWithSwagger;

  try {
    await app.ready();
    const exported = `${JSON.stringify(app.swagger(), null, 2)}\n`;
    const onDisk = await readFile(staticPath, 'utf-8');

    if (exported !== onDisk) {
      console.error(
        `OpenAPI desatualizado: ${staticPath}\nRode: npm run openapi:export`,
      );
      process.exit(1);
    }

    console.log(`OpenAPI em sync com ${staticPath}`);
  } finally {
    await app.close();
  }
}

function ensureJwtKeysForDocsCheck() {
  if (process.env.JWT_PRIVATE_KEY && process.env.JWT_PUBLIC_KEY) return;

  const { privateKey, publicKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  process.env.JWT_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
  process.env.JWT_PUBLIC_KEY = publicKey.export({ type: 'spki', format: 'pem' }).toString();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
