---
title: 06 — Strategy Layer
doc_id: 06-strategy
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md", "04-product-core.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 1800
last_updated: 2026-05-14
---

# 06 — Strategy Layer (§4.5)

> Camada estratégica: Objetivos (OKRs), Key Results mensuráveis, métricas de produto (KPIs e north-stars) e seu histórico imutável (`metric_history`). Objetivos podem amarrar-se a `strategic_pillars`; KRs podem ser cascateados via `parent_id`; métricas têm fórmula e periodicidade declaradas.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)
- [`04-product-core.md`](./04-product-core.md)

## Entidades nesta documentação

- 📦 `objectives`
- 📦 `key_results`
- 📦 `product_metrics`
- 📜 `metric_history`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.5 Strategy

### `objectives` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Objetivos estratégicos (Os do OKR). Definem direção qualitativa do produto.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `pillar_id` | `uuid` | NULL | — | 🆕 FK `strategic_pillars.id`. Vincula objetivo a um pilar |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `status` | `objective_status` | NULL | `'draft'` | Enum §3.12 |
| `horizon_start` | `date` | NULL | — | Janela temporal (ex.: trimestre) |
| `horizon_end` | `date` | NULL | — | |
| `score` | `numeric` | NULL | — | 🆕 0.0-1.0. Média ponderada dos KRs |
| `health_status` | `health_status` | NULL | `'gray'` | 🆕 Enum §3.13. Derivado de `score`. |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:**
- PK, FKs.
- CHECK `score IS NULL OR (score >= 0 AND score <= 1)` 🆕
- CHECK `horizon_end IS NULL OR horizon_start IS NULL OR horizon_end >= horizon_start` 🆕

**Índices:**
- `idx_objectives_workspace`, `idx_objectives_product`, `idx_objectives_deleted_at`.
- `idx_objectives_pillar` (`pillar_id`) 🆕
- `idx_objectives_owner` (`owner_id`) 🆕

**Triggers:** `trg_objectives_updated_at`.

**RLS:** ❌

**Regras de negócio:**
- `score` deve ser recalculado pelo backend quando qualquer KR mudar (média ponderada por `key_results.target` vs `current_value`).
- `health_status` derivado:
  - `score >= 0.7` → `green`
  - `0.4 <= score < 0.7` → `yellow`
  - `score < 0.4` → `red`
  - `score IS NULL` → `gray`

**Eventos gerados:** `objective.created`, `objective.activated`, `objective.score_updated`, `objective.completed`, `objective.cancelled`.

**Relacionamentos:**
- → `workspaces`, `products`, `strategic_pillars` 🆕, `users`.
- ← `key_results.objective_id`.

---

### `key_results` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim 🆕 · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Resultados mensuráveis (KRs do OKR). Pertencem a um Objective.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `objective_id` | `uuid` | NOT NULL | — | FK `objectives.id` |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | 🆕 |
| `baseline` | `numeric` | NULL | — | Valor inicial |
| `target` | `numeric` | NULL | — | Valor alvo |
| `current_value` | `numeric` | NULL | — | Valor atual |
| `unit` | `text` | NULL | — | "%", "$", "users", etc. |
| `status` | `key_result_status` | NULL | `'measuring'` | 🆕 Enum §3.20 |
| `measurement_date` | `date` | NULL | — | 🆕 Data da última medição |
| `owner_id` | `uuid` | NULL | — | 🆕 FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | 🆕 |

**Constraints:** PK, FKs.

**Índices:**
- `idx_key_results_objective` (`objective_id`) 🆕
- `idx_key_results_owner` (`owner_id`) 🆕
- `idx_key_results_deleted_at` 🆕

**Triggers:** `trg_key_results_updated_at` 🆕 BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌

**Regras de negócio:**
- Progresso: `(current_value - baseline) / (target - baseline)` clamp [0,1].
- Quando atualizar `current_value`, registrar em histórico (criar `key_result_history` se necessário no futuro — fora do escopo atual).
- KR concluído (`status='achieved'`) congela `current_value`.

**Eventos gerados:** `key_result.created`, `key_result.progress_updated`, `key_result.achieved`, `key_result.not_achieved`.

**Relacionamentos:**
- → `workspaces`, `objectives`, `users`.
- ← `roadmap_key_result_links.key_result_id`, `outcomes.key_result_id`.

---

### `product_metrics` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim 🆕 · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Métricas estratégicas do produto (north star, KPIs, counter-metrics, guardrails).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `type` | `metric_type` | NOT NULL | — | Enum §3.14 |
| `name` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `formula` | `text` | NULL | — | 🆕 Definição da métrica (ex.: "WAU / MAU") |
| `current_value` | `numeric` | NULL | — | |
| `target_value` | `numeric` | NULL | — | |
| `unit` | `text` | NULL | — | 🆕 "%", "$", "users" |
| `periodicity` | `metric_periodicity` | NULL | — | 🆕 Enum §3.15 |
| `owner_id` | `uuid` | NULL | — | 🆕 FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | (Adicionado pela migration 001) |
| `deleted_at` | `timestamptz` | NULL | — | 🆕 |

**Constraints:** PK, FKs.

**Índices:**
- `idx_product_metrics_product` (`product_id`) 🆕
- `idx_product_metrics_type` (`type`) 🆕

**Triggers:** `trg_product_metrics_updated_at` (adicionada pela migration 001).

**RLS:** ❌

**Regras de negócio:**
- ⚠️ **Apenas uma** métrica `type='north_star'` ativa por produto. Backend valida.
- Atualizações de `current_value` **devem** criar registro em `metric_history`.

**Eventos gerados:** `product_metric.created`, `product_metric.target_changed`, `product_metric.value_updated` (resumo; detalhes em `metric_history`).

**Relacionamentos:**
- → `workspaces`, `products`, `users`.
- ← `metric_history.metric_id` (CASCADE).

---

### `metric_history` 📜
> 📜 **Entidade Imutável** · **Escopo:** workspace (via metric) · **Soft delete:** N/A (append-only) · **RLS:** não · **Status:** existente

**Propósito:** Histórico imutável de valores de `product_metrics`. Permite analytics temporais e forecasting.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `metric_id` | `uuid` | NOT NULL | — | FK `product_metrics.id` ON DELETE CASCADE |
| `previous_value` | `numeric` | NULL | — | |
| `current_value` | `numeric` | NULL | — | |
| `measured_at` | `timestamptz` | NULL | `now()` | |
| `measured_by` | `uuid` | NULL | — | FK `users.id` |
| `metadata` | `jsonb` | NULL | `'{}'` | Contexto (fonte, query, dashboard) |

**Constraints:** PK, FKs.

**Índices:** `idx_metric_history_measured_at` (`measured_at DESC`).

**Triggers:** —

**RLS:** ❌

**Regras de negócio:**
- ⚠️ **Append-only.** Nunca `UPDATE`. Correções via novo registro com metadata explicando.
- Backend insere automaticamente em cada update de `product_metrics.current_value`.

**Eventos gerados:** — (a inserção em si É o evento).

**Relacionamentos:**
- → `product_metrics` (CASCADE).
- → `users` (measured_by).

---
