import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { buildApp } from '../src/app';

type AppWithSwagger = ReturnType<typeof buildApp> & {
  swagger: () => unknown;
  ready: () => Promise<void>;
  close: () => Promise<void>;
};

const staticPath = resolve(
  process.cwd(),
  process.argv[2] ?? '../docs/static/openapi/productgen.json',
);

async function main() {
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
