import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildApp } from '../app';

type AppWithSwagger = ReturnType<typeof buildApp> & {
  swagger: () => unknown;
};

const outputPath = resolve(
  process.cwd(),
  process.argv[2] ?? '../docs/static/openapi/productgen.json',
);

async function main() {
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

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
