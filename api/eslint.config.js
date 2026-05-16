// @ts-check
const tseslint = require('typescript-eslint');

module.exports = tseslint.config(
  tseslint.configs.recommended,
  {
    rules: {
      // Variáveis não usadas são erro, exceto se começam com _
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      // any explícito vira aviso (às vezes necessário em código de banco)
      '@typescript-eslint/no-explicit-any': 'warn',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
);
