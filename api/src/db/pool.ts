import { Pool } from 'pg';
import { config } from '../config/env';

export const pool = new Pool({
  connectionString: config.DATABASE_URL,
  max: 20,                    // máximo de conexões simultâneas
  idleTimeoutMillis: 30_000,  // encerra conexão ociosa após 30s
  connectionTimeoutMillis: 2_000,
  ssl: config.DATABASE_SSL ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => {
  console.error('Erro inesperado no pool de conexões do Postgres (conexão ociosa):', err);
});
