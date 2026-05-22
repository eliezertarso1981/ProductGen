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

## Web — build falha em `strategy-store.tsx` / snapshot antigo

Se o log ainda mostra `status: patch.status` na linha ~588, a Railway **não está usando o `main` atual** (o snapshot `sha256:9f74eaca...` é de um commit antigo).

1. **Settings → Source**: repositório correto, branch **`main`**
2. **Deployments** → **Deploy** no commit mais recente (não “Redeploy” de um deploy antigo)
3. Marque **Clear build cache**
4. **Root Directory** = `web`

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

## Troubleshooting — `pkcs8 must be PKCS#8 formatted string`

A `JWT_PRIVATE_KEY` no Railway está em formato errado (comum: chave `BEGIN RSA PRIVATE KEY`, PEM multiline colado errado, ou aspas extras).

1. No seu PC, gere chaves novas (PKCS#8 + SPKI):

```bash
cd api
npm run jwt:keys
```

2. Copie **cada linha inteira** (`JWT_PRIVATE_KEY=...` e `JWT_PUBLIC_KEY=...`) para **Variables** do serviço API.
3. **Não** envolva o valor em aspas duplas no painel.
4. O valor deve conter `\n` literais entre as partes do PEM, por exemplo:
   `-----BEGIN PRIVATE KEY-----\nMIIE...\n-----END PRIVATE KEY-----`
5. Apague as variáveis antigas, cole as novas, **Redeploy**.

Headers corretos:
- Privada: `-----BEGIN PRIVATE KEY-----` (PKCS#8)
- Pública: `-----BEGIN PUBLIC KEY-----` (SPKI)

Erro `DATABASE_URL: Required` → adicione `DATABASE_URL=${{NomeDoServicoPostgres.DATABASE_URL}}`.

## Onboarding (signup) — erro 500 / “Erro interno do servidor”

O fluxo `/signup` precisa das tabelas da migração `DB/migrations/002_onboarding.sql` (`email_verification_tokens`, colunas extras em `workspaces`, etc.). Se o Postgres foi criado **antes** dessa feature, rode **uma vez** no seu PC com a URL pública do Railway:

```bash
cd api
set DATABASE_URL=postgresql://...@ballast.proxy.rlwy.net:PORT/railway
npm run db:migrate
```

(`npm run db:schema` também aplica migrações; `db:migrate` só roda as migrações, sem recriar o schema inteiro.)

Depois **redeploy** a API (ou reinicie o serviço) e tente o cadastro de novo.

## Sentry (monitoramento de erros — plano free)

1. Crie conta em [sentry.io](https://sentry.io) → projeto **ProductGen** (ou dois: API + Web).
2. Copie o **DSN** (Client Keys).

| Serviço | Variável | Valor |
|---------|----------|--------|
| API | `SENTRY_DSN` | DSN do projeto |
| API | `SENTRY_ENVIRONMENT` | `production` (opcional) |
| Web | `NEXT_PUBLIC_SENTRY_DSN` | mesmo DSN (ou projeto só do front) |
| Web | `NEXT_PUBLIC_SENTRY_ENVIRONMENT` | `production` (opcional) |

3. **Redeploy** API e Web após salvar (no Web o DSN entra no **build**).
4. Teste: force um erro ou veja Issues no painel Sentry após um 500.

Sem DSN, o app funciona normalmente (Sentry desligado em dev local).
