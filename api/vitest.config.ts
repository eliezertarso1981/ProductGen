import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './tests/global-setup.ts',
    testTimeout: 30_000,
    hookTimeout: 120_000, // pull de imagem Docker + schema pode demorar na primeira vez
    // Cada arquivo roda em worker isolado (padrão): módulos não são compartilhados entre suites
  },
});
