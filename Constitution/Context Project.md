# ProductGen — Plataforma de Product Intelligence

> Este arquivo é lido pelo Claude Code no início de cada sessão. Ele documenta o contexto completo do projeto, decisões arquiteturais, padrões de código e regras de negócio.

---

## Sobre o usuário

**O fundador deste projeto não é programador.** Aja sempre considerando isso:

- Explique decisões técnicas em português claro antes de implementá-las
- Pergunte antes de mudanças que afetem múltiplos arquivos ou destruam dados
- Sugira validações em vez de assumir intenção
- Quando der erro, explique a causa e a correção em linguagem acessível
- Prefira soluções simples e legíveis a soluções "elegantes" mas obscuras
- Comente código-chave em português pra facilitar a leitura
- Não use jargão sem explicar (ou apontar pra explicação)

O fundador modelou o domínio com profundidade incomum (lifecycle, RLS, particionamento, audit log). Trate-o como product owner técnico, não como dev. Ele dirige; você executa.

---

## O que é o ProductGen

Plataforma SaaS B2B pra times de produto irem de **estratégia** até **entrega** de forma rastreável. Concorrentes / benchmarks: Productboard, Aha!, Jira Product Discovery.

**Diferencial proposto:** modelagem rigorosa do fluxo Discovery → Delivery → Outcomes, com lifecycle estrito que força disciplina (ex: não pode planejar épico sem hipótese validada vinculada).

**Estágio atual:** banco de dados modelado e populado. Backend a ser construído. Frontend depois.

---

## Stack técnica

### Já existente
- **Postgres 16** rodando em Docker local (porta 5432)
- Banco `productgen` com schema completo, seeds e views

### A construir
- **Backend (em desenvolvimento)**:
  - **TypeScript + Node.js 20+**
  - **Fastify** como framework web (mais leve que Express, mais simples que NestJS)
  - **node-postgres (pg)** pra acessar o Postgres com SQL puro — **sem ORM**, propositalmente
  - **Zod** pra validação de input
  - **jose** pra JWT
  - **dotenv** pra variáveis de ambiente
- **Testes**: Vitest + Testcontainers (sobe Postgres real em container nos testes)
- **Linting**: ESLint + Prettier configurados pra TS estrito

### Por que SQL puro e não ORM (Prisma, Drizzle, TypeORM)

O schema usa features avançadas do Postgres que ORMs ou escondem ou implementam mal:
- Row-Level Security (RLS) com `SET LOCAL`
- Triggers genéricos de auditoria e validação de lifecycle
- Particionamento por mês (entity_events)
- Tipos enum nativos
- Extensões (ltree, pg_trgm, citext)
- Partial unique indexes

Com `pg` direto e SQL puro, mantemos controle total. Use template literals com placeholders parametrizados (`$1, $2`) pra evitar SQL injection.

### Frontend (decisão futura, não escolhido ainda)

Possíveis: Next.js 15, Remix, ou TanStack Start. Não escolher ainda — focar primeiro em backend funcional.

---

## Arquitetura conceitual (4 camadas + fundação)

```
                  WORKSPACE (tenant)
                       │
                   PRODUCT (foco)
                  ╱   │   ╲
        ┌────────╯    │    ╰────────┐
        ▼             ▼             ▼
   PILLARS       OBJECTIVES      PERSONAS
                    │
                    ▼
                KEY RESULTS

        ┌──────────┴──────────┐
        ▼                     ▼
   DISCOVERY              DELIVERY
   evidências            roadmap items
        ▼                  (init/epic/feat)
      dores                    │
        ▼                      ▼
   hipóteses ◄──────► outcomes (mediu?)
        ▼
   experimentos

   ASSETS (anexáveis a qualquer entidade)
   ENTITY_EVENTS (audit log de tudo)
```

### Fluxos canônicos

**Fluxo 1 — Cliente reclama:**
ticket de suporte → `evidence` (status: `new`) → triada (`triaged`) → vinculada a uma `pain` existente ou cria nova → `pain` em `investigating` → equipe formula `hypothesis` → roda `experiment` → valida → cria `roadmap_item` → entrega → mede `outcome`.

**Fluxo 2 — Liderança define OKR:**
`objective` novo → `key_results` definidos → time olha quais `hypotheses` validadas movem esses KRs → cria `roadmap_items` vinculados a hipóteses E a KRs → entrega → `outcome` confirma se o KR mexeu.

**Fluxo 3 — Eng terminou uma feature:**
`roadmap_item` (feature) sincroniza status do Jira → muda pra `delivered` → automaticamente pede outcome → janela de 30 dias → mede valor final do KR → confirma ou não.

---

## Decisões arquiteturais (já tomadas, não revisar sem motivo forte)

### Multi-tenancy: shared schema + RLS
- Toda tabela de domínio tem coluna `workspace_id`
- Row-Level Security (RLS) `FORCE` em todas as tabelas com workspace_id
- Aplicação **DEVE** rodar `SET LOCAL app.current_workspace = '<uuid>'` no início de cada transação
- Função helper `current_workspace_id()` lê esse setting no banco

### IDs: UUID padrão Postgres
- Todas as PKs usam `uuid PRIMARY KEY DEFAULT gen_random_uuid()`
- Extensão `pgcrypto` instalada
- IDs são gerados no banco (default), não na aplicação

### Soft delete
- Toda tabela de domínio tem `deleted_at timestamptz`
- Queries de produto **sempre** filtram `WHERE deleted_at IS NULL`
- **Não cascadear** soft delete em FK — links permanecem visíveis pra auditoria
- Partial unique indexes onde aplicável: `CREATE UNIQUE INDEX ... WHERE deleted_at IS NULL`

### Audit log: tabela `entity_events` (event sourcing leve, log derivado)
- Cada INSERT/UPDATE em tabelas de domínio gera evento automaticamente via trigger `audit_entity_changes`
- Particionado por mês (12 partições + default)
- Imutável: `REVOKE UPDATE, DELETE ON entity_events FROM PUBLIC`
- Estado vive nas tabelas de domínio; eventos são histórico paralelo

### State machine de lifecycle
- Tabela `lifecycle_transitions` declara transições válidas por entidade
- Trigger genérico `validate_lifecycle_transition` valida toda mudança de status
- Validações específicas (regras complexas além da tabela):
  - Hipótese só vai pra `validated` se tiver experimento `analyzed` com `result = validated`
  - `roadmap_item` (initiative/epic) só vai pra `planned` se tiver hipótese `validated`/`in_execution`/`delivered` vinculada
  - Experimento `planned → running` exige `success_criteria` com mín. 10 chars
- Estados terminais com `requires_reason = true` exigem campo de justificativa preenchido

### Validação cross-workspace
- Trigger `validate_link_same_workspace` em todas as tabelas de junção N:M
- Impede vincular entidades de tenants diferentes
- RLS protege SELECT, mas INSERT em links também precisa proteger

### Hierarquia de roadmap_items: ltree
- Coluna `path ltree` permite query de subárvore eficiente
- Estrutura: initiative > epic > feature
- Tabela única polimórfica via `type` (não três tabelas separadas)

### Assets: polimorfismo via attachments
- Tabela `assets` tem metadata + ponteiro pro storage (S3/R2/GCS, **nunca o binário no banco**)
- Tabela `asset_attachments` com `attachable_type` enum + `attachable_id` uuid
- Dedup por checksum SHA-256

---

## Schema: as 28+ tabelas

### Fundação
- `workspaces` — tenants
- `users` — globais (uma pessoa pode estar em vários workspaces)
- `workspace_members` — junção com role (owner/admin/member/viewer)

### Estratégia
- `products` — o produto, com `vision` qualitativa
- `strategic_pillars` — frentes de atuação (3-5 pilares por produto)
- `objectives` — O de OKR
- `key_results` — KR mensurável (filho de objective, cascade)

### Personas
- `personas` — segmentos de cliente, com `segment_size_estimate`

### Discovery
- `evidences` — input bruto. Lifecycle: `new → triaged → linked → archived`
- `pains` — dores agrupadas. Lifecycle: `identified → investigating → prioritized → addressed → resolved`. Terminal: `discarded` (exige `discard_reason`)
- `hypotheses` — apostas Se/Então/Porque (`if_clause`, `then_clause`, `because_clause`). Lifecycle complexo, ver tabela `lifecycle_transitions`
- `experiments` — testes de hipótese, com `success_criteria` obrigatório

### Delivery
- `roadmap_items` — initiative/epic/feature, hierarquia via ltree, sincroniza com Jira/Linear via `external_*`

### Outcomes
- `outcomes` — medição pós-entrega, vincula `roadmap_item` a `key_result` e/ou `pain`

### Relações N:M (sempre tabelas dedicadas, NUNCA polimorfismo)
- `evidence_pain_links`
- `pain_persona_links`
- `pain_hypothesis_links`
- `hypothesis_roadmap_links`
- `roadmap_pillar_links`
- `roadmap_key_result_links`

### Assets
- `assets` — metadata + storage pointer
- `asset_attachments` — polimórfico (única exceção justificada)

### Sistema
- `entity_events` — audit log particionado
- `lifecycle_transitions` — state machine declarativa

### Views consolidadas (já criadas)
- `v_discovery_funnel` — funil de conversão evidência → outcome
- `v_lifecycle_health` — idade média/máxima por estado (detecta gargalos)
- `v_hypothesis_validation_stats` — taxa de invalidação (saúde do discovery)
- `v_roadmap_strategic_coverage` — roadmap com sinais estratégicos
- `v_pain_traceability` — drill-down completo por dor
- `v_status_transitions` — histórico de transições com tempo em estado
- `v_cycle_times` — cycle time agregado por estado
- `v_outcomes_dashboard` — fechamento do loop

---

## Padrões de código (backend)

### Estrutura de pastas (a criar)
```
api/
├── src/
│   ├── server.ts              ← bootstrap Fastify
│   ├── config/
│   │   └── env.ts             ← validação de variáveis com Zod
│   ├── db/
│   │   ├── pool.ts            ← pool de conexões pg
│   │   └── tx.ts              ← helper de transação com workspace context
│   ├── auth/
│   │   ├── jwt.ts             ← geração e verificação de JWT
│   │   └── middleware.ts      ← auth + workspace context
│   ├── modules/
│   │   ├── pains/
│   │   │   ├── pains.routes.ts
│   │   │   ├── pains.service.ts
│   │   │   ├── pains.repo.ts
│   │   │   └── pains.schemas.ts (Zod)
│   │   ├── hypotheses/
│   │   ├── roadmap/
│   │   └── ...
│   └── shared/
│       ├── errors.ts
│       └── types.ts
├── tests/
├── package.json
├── tsconfig.json
└── .env
```

### Padrão de transação com RLS

**Toda operação em tabelas de domínio precisa setar workspace context.** Use sempre o helper `withWorkspaceTx`:

```typescript
// db/tx.ts
import { Pool, PoolClient } from 'pg';

export async function withWorkspaceTx<T>(
  pool: Pool,
  workspaceId: string,
  actorId: string,
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(`SET LOCAL app.current_workspace = $1`, [workspaceId]);
    await client.query(`SET LOCAL app.current_actor = $1`, [actorId]);
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}
```

**Toda rota** que toca o banco usa esse helper. Nunca query direto no pool sem isso.

### Padrão de repository (sem ORM)

Repositories ficam em `*.repo.ts`, expõem funções tipadas:

```typescript
// pains/pains.repo.ts
import { PoolClient } from 'pg';

export interface Pain {
  id: string;
  workspace_id: string;
  product_id: string;
  title: string;
  status: PainStatus;
  // ... outros campos
}

export async function findPainsByProduct(
  client: PoolClient,
  productId: string
): Promise<Pain[]> {
  const result = await client.query<Pain>(
    `SELECT * FROM pains 
     WHERE product_id = $1 AND deleted_at IS NULL
     ORDER BY severity DESC NULLS LAST, created_at DESC`,
    [productId]
  );
  return result.rows;
}
```

### Validação com Zod

Schemas Zod em `*.schemas.ts`. Validam input antes de chegar no service:

```typescript
import { z } from 'zod';

export const createPainSchema = z.object({
  product_id: z.string().uuid(),
  title: z.string().min(3).max(200),
  description: z.string().optional(),
  severity: z.number().int().min(1).max(5).optional(),
  reach_estimate: z.number().int().nonnegative().optional(),
});

export type CreatePainInput = z.infer<typeof createPainSchema>;
```

### Tratamento de erro do banco

Erros do Postgres têm códigos previsíveis. Mapeie pra erros HTTP semânticos:

- `23505` (unique_violation) → 409 Conflict
- `23503` (foreign_key_violation) → 422 Unprocessable Entity
- `23514` (check_violation) → 422
- `P0001` com mensagem "Invalid lifecycle transition" → 422 com detalhe da transição inválida
- `P0001` com "requires a reason" → 422

### Auth

- Endpoint `POST /auth/login` recebe email/senha (uso interno) ou trocará por SSO
- Retorna JWT com claims: `{ user_id, workspace_id, role, exp }`
- Middleware decodifica JWT, anexa `req.user`, e o helper `withWorkspaceTx` lê dali

### Errors

Use uma classe base `AppError` com `statusCode`, `code`, `message`. Captura central no Fastify `setErrorHandler` retorna JSON estruturado:

```json
{ "error": { "code": "PAIN_INVALID_TRANSITION", "message": "..." } }
```

---

## Comandos comuns

### Subir/parar Postgres local
```bash
cd C:\Users\Eliez\OneDrive\Documentos\ProductGen\DB
docker compose up -d        # subir
docker compose down         # parar (mantém dados)
docker compose down -v      # parar e apagar tudo
```

### Conectar via psql dentro do container
```bash
docker exec -it productgen-db psql -U postgres -d productgen
```

### Credenciais do banco (dev local)
- Host: `localhost`
- Port: `5432`
- User: `postgres`
- Password: `postgres`
- Database: `productgen`
- Connection string: `postgresql://postgres:postgres@localhost:5432/productgen`

### Variáveis de ambiente esperadas (.env)
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/productgen
JWT_SECRET=<gerar com openssl rand -hex 64>
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
```

### Setar workspace pra debug no DBeaver/psql
```sql
SET app.current_workspace = '11111111-1111-1111-1111-111111111111';
SET app.current_actor = '22222222-2222-2222-2222-222222222222';
```

(esses são os UUIDs do workspace/user de seed)

---

## Anti-padrões — NÃO FAZER

❌ **Não usar ORM** (Prisma/Drizzle/TypeORM). Decisão arquitetural firme.

❌ **Não fazer query no banco sem `SET LOCAL app.current_workspace`**. Sempre usar `withWorkspaceTx`. Esquecer disso significa: queries retornam vazio (RLS bloqueia) ou, em caso de bug, vazamento entre tenants.

❌ **Não escrever SQL com concatenação de string** (SQL injection). Sempre usar placeholders parametrizados `$1, $2`.

❌ **Não cascadear soft delete via aplicação**. Se uma `pain` é soft-deleted, suas evidências e hipóteses linkadas continuam vivas. Filtragem de "não mostrar links de pain deletada" é responsabilidade da query (`JOIN ... AND p.deleted_at IS NULL`).

❌ **Não pular validação de lifecycle**. Se você quer mudar status de uma entidade, deve passar pelas transições permitidas. Se uma transição não for permitida e você acha que deveria, primeiro adicione na tabela `lifecycle_transitions`, não bypasse.

❌ **Não criar polimorfismo genérico** (tabela `links(from_type, from_id, to_type, to_id)`). Use tabelas N:M dedicadas. Única exceção justificada: `asset_attachments`.

❌ **Não auto-mover status entre entidades** (ex: experimento `analyzed` muda hipótese pra `validated` sozinho). Apenas sugerir via evento (`event_type = 'transition_suggested'`). Mudanças importantes precisam ser explícitas.

❌ **Não armazenar binários no Postgres**. Assets vão pra storage externo (S3/R2/GCS); banco guarda só metadata.

❌ **Não usar `gen_random_uuid()` na aplicação**. IDs são gerados no banco via DEFAULT.

❌ **Não confundir `addressed` com `resolved` em pain**. Addressed = trabalhamos nisso. Resolved = a métrica/evidência mostra que sumiu. Manter separados é o que evita "fábrica de feature".

---

## Lifecycle de cada entidade (resumo)

### evidences
`new → triaged → linked → archived` (e voltas permitidas)

### pains
`identified → investigating → prioritized → addressed → resolved`
Terminal: `discarded` (exige `discard_reason`)
Pode reabrir: `resolved → identified`, `discarded → identified`

### hypotheses (mais rico)
`formulated → validating → validated → in_execution → delivered`
Alternativos: `invalidated`, `discarded`, `deprioritized`
Reabertura: `invalidated → formulated` (preserva linhagem via `cloned_from_id`)

### experiments
`planned → running → completed → analyzed`
Estado `analyzed` exige `result` preenchido (validated/invalidated/inconclusive)

### roadmap_items
`proposed → planned → in_development → in_validation → delivered → measuring_outcome`
Terminais: `cancelled` (exige `cancel_reason`), `rolled_back` (exige `rollback_reason`)

### objectives
`draft → active → achieved | missed | cancelled`

### outcomes
`hypothesized → measuring → confirmed | not_confirmed | inconclusive`

---

## Estrutura do repositório (após criar backend)

```
ProductGen/
├── DB/
│   ├── docker-compose.yml
│   └── (volumes Docker — não versionar)
├── docs/                           ← Docusaurus + Scalar + documentação do projeto
│   ├── docs/                       ← páginas da documentação
│   ├── src/                        ← páginas React do Docusaurus
│   ├── static/openapi/             ← OpenAPI JSON exportado da API
│   └── reference/database/         ← scripts SQL de referência
├── api/                            ← backend (a construir)
│   └── (estrutura descrita acima)
├── web/                            ← frontend (futuro)
├── CLAUDE.md                       ← este arquivo
└── README.md
```

---

## Decisões em aberto (a tratar quando chegar a hora)

1. **State machine bypass para admin** — hoje não há jeito de pular validação de lifecycle. Em produção será necessário pra correção de dados. Implementar via `SET LOCAL app.bypass_lifecycle = true` checado nos triggers.

2. **Outcome `not_confirmed` reabrir pain automaticamente** — hoje não é automático. Decisão de produto: virar trigger ou virar sugestão (evento)?

3. **Particionamento futuro** — `entity_events` está com 12 partições. Automatizar criação mensal com `pg_partman` antes do mês 13.

4. **Storage de assets em produção** — local de dev usa filesystem fake; produção precisa de S3/R2/GCS configurado.

5. **Frontend stack** — não escolhido. Opções: Next.js 15, Remix, TanStack Start.

6. **Sistema de comments/discussions** — fora do schema atual. Adicionar quando começar a precisar.

7. **Notificações** — fora do schema atual. Provavelmente requer Redis pra fila + worker.

8. **Migrations versionadas** — script monolítico hoje. Migrar pra `node-pg-migrate` ou `dbmate` quando o schema começar a evoluir em produção.

9. **Integração Jira/Linear** — campos `external_*` em `roadmap_items` previstos, mas sincronização não implementada.

---

## Convenções de nomenclatura

- Tabelas: `snake_case`, plural (`pains`, `hypotheses`, `roadmap_items`)
- Colunas: `snake_case`, sem prefixo da tabela
- Índices: `idx_<tabela>_<colunas>` ou `idx_<tabela>_<scope>` (ex: `idx_pains_workspace_status`)
- Triggers: `trg_<tabela>_<acao>`
- Funções: `verb_noun()` em `snake_case` (`audit_entity_changes`, `validate_lifecycle_transition`)
- Tipos enum: `<dominio>_<grupo>` (`pain_status`, `evidence_source`)

No código TypeScript:
- Files: `kebab-case.ts` ou `dot.notation.ts` (`pains.service.ts`)
- Types/interfaces: `PascalCase`
- Funções e variáveis: `camelCase`
- Constantes globais: `UPPER_SNAKE_CASE`
- Use português pros nomes de módulos de produto se ajudar leitura — ex: `dores`, `hipoteses` é OK se a equipe pensar nesses nomes.

---

## Próximos passos imediatos (em ordem)

1. **Setup do projeto API**: `package.json`, `tsconfig.json`, `.env.example`, ESLint, Prettier
2. **Camada de banco**: pool de conexões + helper `withWorkspaceTx` + teste manual de conexão
3. **Auth básico**: endpoint de login (mock pra dev), JWT, middleware
4. **Primeiro CRUD**: `pains` ponta a ponta (list, create, update status, soft delete) — valida arquitetura
5. **Replicar padrão**: hypotheses, experiments, roadmap_items
6. **Endpoints de view**: expor as 8 views já criadas como GET endpoints
7. **Testes**: cobertura mínima de happy path por módulo
8. **Deploy**: Fly.io ou Railway pro backend, Postgres em managed (Neon ou Supabase)

Não pular passos. Cada um valida uma camada da arquitetura.

---

## Como interagir comigo

Quando você (Claude Code) for executar tarefas:

- **Antes de mudar arquivos**, mostre o que vai fazer e pergunte se posso prosseguir, exceto pra coisas óbvias (criar arquivo novo numa task explícita).
- **Antes de instalar pacote**, fale qual e por que. O fundador prefere stacks enxutas.
- **Antes de escrever migration ou alterar schema**, **sempre** confirme. O banco está estável.
- **Quando der erro**, explique a causa em português antes de propor a correção.
- **Quando tiver dúvida sobre regra de negócio**, pergunte. Não invente. O domínio foi modelado com cuidado.
- **Quando for sugerir refator ou abstração**, justifique o ganho. Aceito complexidade só quando o benefício é claro.
- **Em commits**, escreva mensagens em português, imperativas, curtas: "adiciona endpoint de criação de pain", "corrige validação de transição em hypothesis".
- **Não faça commits automaticamente.** O fundador revisa e commita manualmente.

---

## Recursos do projeto

- Documentação do projeto: `docs/`
- Schema SQL completo: `docs/reference/database/productgen_schema.sql`
- OpenAPI estático para Scalar: `docs/static/openapi/productgen.json`

Esses arquivos são a fonte da verdade do schema. Se algo no código diverge deles, o código está errado.
