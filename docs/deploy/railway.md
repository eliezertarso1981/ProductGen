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

```bash
cd api
DATABASE_URL="..." npm run db:schema
DATABASE_URL="..." npm run db:seed   # opcional
```
