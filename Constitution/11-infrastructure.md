---
title: 11 — Infraestrutura
doc_id: 11-infrastructure
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md"]
audience: [llm, backend_engineer, data_engineer, dba]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 1100
last_updated: 2026-05-14
---

# 11 — Infraestrutura: Views, Funções, RLS e Particionamento (§5 + §6 + §7 + §8)

> Camada de infra. Views agregadas (`v_product_health`, `v_activity_feed`, `v_roadmap_strategic_coverage`). Funções e triggers obrigatórios (`set_updated_at`, validações). Políticas RLS por workspace. Estratégia de particionamento de `entity_events`. **Carregue este arquivo junto com o arquivo do domínio cuja entidade você está mudando.**

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 5. Views

### `v_activity_feed`
**Propósito:** Timeline unificada de eventos, comentários e decisões.

**Definição:**
```sql
SELECT 'event'::text AS source_type, e.id, e.workspace_id, e.entity_type, e.entity_id,
       e.event_type AS title, e.reason AS description, e.actor_id AS user_id,
       e.occurred_at AS created_at
  FROM entity_events e
UNION ALL
SELECT 'comment', c.id, c.workspace_id, c.entity_type, c.entity_id,
       'comment_added', c.content, c.created_by, c.created_at
  FROM comments c WHERE c.deleted_at IS NULL
UNION ALL
SELECT 'decision', d.id, d.workspace_id, d.entity_type, d.entity_id,
       d.decision_type, d.rationale, d.decided_by, d.created_at
  FROM decision_logs d WHERE d.deleted_at IS NULL;
```

**Uso:** activity feeds, dashboards, AI timeline reconstruction.

---

### `v_product_health`
**Propósito:** Contagens agregadas de entidades por produto (saúde de portfólio).

**Definição:** Junta `products` LEFT JOIN `pains` (por `product_id`), `hypotheses` (por `product_id`), `roadmap_items` (por `product_id`), `outcomes` (via `roadmap_item_id`), `evidences` (por `product_id`), `prds` (via `roadmap_item_id`). **Sempre filtrar `deleted_at IS NULL` em todas as junções.**

> ⚠️ Bug histórico: a versão antiga juntava `outcomes` e `prds` por `workspace_id`, contando workspace-wide. Corrigido pela migration 001 para juntar via `roadmap_item_id`.

---

### `v_roadmap_strategic_coverage`
**Propósito:** Cobertura estratégica do roadmap (qual pilar/produto/owner).

**Definição:** `roadmap_items` LEFT JOIN `strategic_pillars`, `products`, `users` (owner).

---

## 6. Funções e Triggers Obrigatórios

### 6.1 `set_updated_at()`
```sql
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END; $$;
```
Aplicar em toda tabela com `updated_at`. Convenção de nome: `trg_<table>_updated_at`.

### 6.2 `current_workspace_id()`
```sql
CREATE OR REPLACE FUNCTION public.current_workspace_id()
RETURNS uuid LANGUAGE sql STABLE AS $$
  SELECT current_setting('app.current_workspace_id', true)::uuid;
$$;
```
Setado por sessão via `SET LOCAL app.current_workspace_id = '<uuid>'` antes de queries. Usado por RLS policies.

### 6.3 `update_search_vector()`
```sql
CREATE OR REPLACE FUNCTION public.update_search_vector()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('portuguese', COALESCE(NEW.title, '')), 'A') ||
    setweight(to_tsvector('portuguese', COALESCE(NEW.description, '')), 'B');
  RETURN NEW;
END; $$;
```
Aplicar em `evidences`, `insights`, `pains`, `hypotheses`, `roadmap_items`.

### 6.4 `validate_product_ownership_roles()`
Trigger CONSTRAINT DEFERRABLE em `products`. Garante que `director_id`/`pm_owner_id`/`ux_owner_id`/`po_owner_id` apontem para `users` que tenham `product_members.role` compatível. Ver §4.2 `products`.

### 6.5 `ensure_entity_events_partition(target_year int)`
Cria partição anual de `entity_events`. Idempotente. Agendar para rodar 1×/ano. Ver §4.12.

---

## 7. Segurança

### 7.1 RLS
Tabelas com RLS obrigatória: `products`, `evidences`, `insights`, `hypotheses`, `pains`, `roadmap_items`, `media_assets`, `entity_assets`, `entity_permissions`.

Padrão de policy:
```sql
CREATE POLICY <table>_workspace_isolation ON <table>
  AS PERMISSIVE FOR ALL
  USING (workspace_id = current_workspace_id());
```

Backend **deve** setar `SET LOCAL app.current_workspace_id = '<uuid>'` no início de cada transação.

### 7.2 Conexão
- Usuário de aplicação **não** deve ter `BYPASSRLS`.
- Migrations rodam com usuário separado (privilegiado).

### 7.3 PII
- `evidences.customer_identifier`, `users.email`: PII. Cumprir LGPD (direito ao apagamento, portabilidade).
- Soft delete + scrub (substituir por hash) ao receber solicitação de apagamento.

---

## 8. Particionamento

### `entity_events` (PARTITION BY RANGE de `occurred_at`)
- Partições anuais (1 ano cada).
- Já criadas: 2026, 2027, 2028.
- Manutenção: rodar `ensure_entity_events_partition(EXTRACT(YEAR FROM now())::int + 1)` anualmente.
- Retenção: aplicação atual mantém indefinidamente; políticas de retenção (drop partition após N anos) são decisão de produto.

### Outras tabelas
- **Candidatas futuras** para particionamento se volume crescer: `comments`, `metric_history`, `entity_links`. Não particionar prematuramente.

---
