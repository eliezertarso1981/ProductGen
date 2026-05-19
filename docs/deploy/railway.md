# Deploy na Railway (monorepo)

O repositório tem **api/** e **web/**. Cada serviço na Railway precisa de um **Root Directory** próprio.

## Serviços

| Serviço | Root Directory | Health check |
|---------|----------------|--------------|
| Postgres | Plugin Railway | — |
| API | `api` | `/health` |
| Web | `web` | `/login` |

## Erro comum

`Railpack could not determine how to build the app` com pastas `api/`, `web/` na raiz → o Root Directory está na **raiz do repo**. Corrija em **Settings → Root Directory**.

## API — variáveis

- `DATABASE_URL` (referência do Postgres)
- `NODE_ENV=production`
- `CORS_ORIGIN` = URL pública do front
- `COOKIE_SAME_SITE=none`
- `COOKIE_SECRET`, `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY`
- Não defina `PORT` (Railway injeta)

## Web — variáveis

- `NEXT_PUBLIC_PRODUCTGEN_API_URL` = URL pública da API (**no build**)

## Banco (uma vez)

Use `DATABASE_PUBLIC_URL` do Postgres (rede pública) no seu terminal local:

```bash
cd api
DATABASE_URL="..." npm run db:schema
DATABASE_URL="..." npm run db:seed   # opcional
```

## Troubleshooting — health check `/health` falha

O build Docker pode passar e o deploy falhar se o processo **não escuta** na porta ou **sai antes** do listen.

1. **Deploy Logs** (não Build Logs): procure `Variáveis de ambiente inválidas`, `JWT_PRIVATE_KEY`, `Erro inesperado no pool`, ou crash antes de `API listening on`.
2. **Root Directory** do serviço API deve ser **`api`**. Se estiver na raiz do repo, o contexto Docker/cache pode estar errado — ajuste e **limpe o build cache** antes de redeploy.
3. **Variáveis obrigatórias (API)**:
   - `DATABASE_URL` (referência `${{Postgres.DATABASE_URL}}`)
   - `NODE_ENV=production`
   - `CORS_ORIGIN` = URL pública do front
   - `COOKIE_SAME_SITE=none` (front e API em domínios diferentes)
   - `COOKIE_SECRET` (≥ 32 caracteres)
   - `JWT_PRIVATE_KEY`, `JWT_PUBLIC_KEY` (PEM; no painel Railway use `\n` para quebras de linha, não colar PEM multiline “cru”)
   - Não defina `PORT` manualmente (Railway injeta)
   - Opcional: `DATABASE_SSL=true` (padrão `true` em production)
4. **Schema do banco**: com `DATABASE_PUBLIC_URL`, rode `npm run db:schema` localmente uma vez.
5. **Postgres SSL**: em production a API usa SSL no pool (`rejectUnauthorized: false`). Erros transitentes no pool **não** derrubam mais o processo; `/health` continua respondendo.
