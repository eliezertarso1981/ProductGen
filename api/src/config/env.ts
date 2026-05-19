import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatório'),
  /** `true`/`false` ou omitido (SSL ligado em production). */
  DATABASE_SSL: z.enum(['true', 'false', '1', '0']).optional(),
  JWT_PRIVATE_KEY: z.string().min(1, 'JWT_PRIVATE_KEY é obrigatório'),
  JWT_PUBLIC_KEY: z.string().min(1, 'JWT_PUBLIC_KEY é obrigatório'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(3000),
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  COOKIE_SECRET: z.string().min(32, 'COOKIE_SECRET deve ter no mínimo 32 caracteres'),
  /** Use `none` quando front e API estão em domínios diferentes (ex.: Railway). Requer HTTPS. */
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])
    .default('info'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Variáveis de ambiente inválidas ou ausentes:');
  console.error(parsed.error.flatten().fieldErrors);
  process.exit(1);
}

const env = parsed.data;

function resolveDatabaseSsl(
  value: (typeof env)['DATABASE_SSL'],
  nodeEnv: (typeof env)['NODE_ENV'],
): boolean {
  if (value === 'true' || value === '1') return true;
  if (value === 'false' || value === '0') return false;
  return nodeEnv === 'production';
}

export const config = {
  ...env,
  DATABASE_SSL: resolveDatabaseSsl(env.DATABASE_SSL, env.NODE_ENV),
};
