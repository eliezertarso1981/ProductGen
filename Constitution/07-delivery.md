---
title: 07 — Delivery Layer
doc_id: 07-delivery
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md", "04-product-core.md", "05-discovery.md", "06-strategy.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 3600
last_updated: 2026-05-14
---

# 07 — Delivery Layer (§4.6)

> Camada de planning até o handoff para engenharia. `roadmap_items` é hierárquico via LTREE (initiative → epic → feature). `prds` são versionados (não imutáveis: cada versão é um novo registro). `outcomes` medem resultado pós-release contra KRs/métricas. `engineering_handoffs` registra o momento do handoff para Jira/ADO; `external_references` mantém o link bidirecional com sistemas externos. **Esta é a fronteira do escopo da plataforma** — pós-handoff, o ciclo é responsabilidade do sistema de delivery (não documentado aqui).

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)
- [`04-product-core.md`](./04-product-core.md)
- [`05-discovery.md`](./05-discovery.md)
- [`06-strategy.md`](./06-strategy.md)

## Entidades nesta documentação

- 📦 `roadmap_items`
- 🔗 `hypothesis_roadmap_links`
- 🔗 `roadmap_key_result_links`
- 📦 `prds`
- 📦 `outcomes`
- 📦 `releases`
- 📦 `engineering_handoffs`
- 🌐 `external_references`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.6 Delivery

### `roadmap_items` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Núcleo da camada de delivery. Engloba Initiatives, Epics e Features em uma única tabela hierárquica.

**⚠️ Decisão arquitetural:** Feature **não** é tabela separada. `Feature = roadmap_items WHERE type='feature'`. Hierarquia: `initiative → epic → feature` via `parent_id` + `path` (LTREE).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `pillar_id` | `uuid` | NULL | — | FK `strategic_pillars.id` |
| `parent_id` | `uuid` | NULL | — | FK `roadmap_items.id`. NULL = raiz |
| `path` | `ltree` | NULL | — | Caminho na árvore. Atualizado pelo backend ao criar/mover |
| `type` | `delivery_type` | NOT NULL | — | Enum §3.16 (`initiative`, `epic`, `feature`) |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `status` | `delivery_status` | NULL | `'proposed'` | Enum §3.17 |
| `priority_score` | `numeric` | NULL | — | §2.6 |
| `complexity_score` | `numeric` | NULL | — | 0.0-1.0 |
| `impact_score` | `numeric` | NULL | — | 0.0-1.0 |
| `effort_score` | `numeric` | NULL | — | 🆕 0.0-1.0 (conceitual lista para Feature) |
| `scoring_method` | `text` | NULL | — | §2.6 |
| `scoring_payload` | `jsonb` | NULL | `'{}'` | §2.6 |
| `acceptance_criteria` | `text` | NULL | — | |
| `analytics_requirements` | `text` | NULL | — | |
| `rollout_strategy` | `text` | NULL | — | |
| `rollback_strategy` | `text` | NULL | — | |
| `release_version` | `text` | NULL | — | Versão alvo (ex.: "v2.3.0") |
| `external_system` | `text` | NULL | — | Ex.: `jira`, `azure_devops`. Use enum §3.23 |
| `external_id` | `text` | NULL | — | ID na ferramenta externa |
| `external_url` | `text` | NULL | — | Link |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `search_vector` | `tsvector` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs, FK `parent_id` autoref.

**Índices:**
- `idx_roadmap_workspace`, `idx_roadmap_product`, `idx_roadmap_owner`, `idx_roadmap_status`, `idx_roadmap_search` GIN, `idx_roadmap_deleted_at`.
- `idx_roadmap_path` GIST (`path`)
- `idx_roadmap_external_sync` UNIQUE (`product_id`, `external_system`, `external_id`) WHERE `external_id IS NOT NULL`
- `idx_roadmap_parent` (`parent_id`) 🆕
- `idx_roadmap_pillar` (`pillar_id`) 🆕
- `idx_roadmap_type` (`type`) 🆕

**Triggers:** `trg_roadmap_search`, `trg_roadmap_items_updated_at`.

**RLS Policy:** `roadmap_workspace_isolation`.

**Regras de negócio:**
- ⚠️ Hierarquia por tipo: `feature.parent` deve ser `epic` ou NULL; `epic.parent` deve ser `initiative` ou NULL. Backend valida.
- `path` LTREE atualizado em cascata quando `parent_id` muda.
- Mudança de `status` para `cancelled` ou `rolled_back` exige `decision_logs`.
- External sync: `(product_id, external_system, external_id)` é UNIQUE quando setado, evitando duplicação de sync com Jira.
- Anexos: flow charts, specs via `entity_assets`.

**Eventos gerados:** `roadmap_item.proposed`, `roadmap_item.prioritized`, `roadmap_item.in_development`, `roadmap_item.delivered`, `roadmap_item.cancelled`, `roadmap_item.rolled_back`, `roadmap_item.ownership_changed`.

**Relacionamentos:**
- → `workspaces`, `products`, `strategic_pillars`, `roadmap_items` (parent), `users`.
- ← `prds.roadmap_item_id`, `outcomes.roadmap_item_id`, `engineering_handoffs.roadmap_item_id`, `hypothesis_roadmap_links`, `roadmap_key_result_links`, `external_references` 🆕.

---

### `hypothesis_roadmap_links` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Liga hipóteses a roadmap_items (N:N). Permite responder "esta feature valida quais hipóteses?".

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `hypothesis_id` | `uuid` | NOT NULL | — | FK ON DELETE CASCADE; parte da PK |
| `roadmap_item_id` | `uuid` | NOT NULL | — | FK ON DELETE CASCADE; parte da PK |

**Constraints:** PK.

> 🆕 Adicionar `created_at timestamptz DEFAULT now()`.

---

### `roadmap_key_result_links` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Liga roadmap_items a KRs (N:N).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `roadmap_item_id` | `uuid` | NOT NULL | — | FK ON DELETE CASCADE; parte da PK |
| `key_result_id` | `uuid` | NOT NULL | — | FK ON DELETE CASCADE; parte da PK |

**Constraints:** PK.

> 🆕 Adicionar `created_at timestamptz DEFAULT now()`.

---

### `prds` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace (via roadmap_item) · **Soft delete:** sim 🆕 · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Product Requirement Document. Documenta uma feature/epic do roadmap para handoff técnico.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `roadmap_item_id` | `uuid` | NOT NULL | — | FK `roadmap_items.id` ON DELETE CASCADE |
| `version` | `int4` | NULL | `1` | Versão sequencial. Versões antigas são preservadas. |
| `status` | `prd_status` | NULL | `'draft'` | 🆕 Enum §3.18 |
| `title` | `text` | NOT NULL | — | |
| `content` | `text` | NOT NULL | — | Conteúdo do PRD (markdown) |
| `assumptions` | `text` | NULL | — | |
| `business_rules` | `text` | NULL | — | |
| `non_functional_requirements` | `text` | NULL | — | |
| `analytics_requirements` | `text` | NULL | — | |
| `rollout_strategy` | `text` | NULL | — | |
| `rollback_strategy` | `text` | NULL | — | |
| `approved_by` | `uuid` | NULL | — | FK `users.id` |
| `approved_at` | `timestamptz` | NULL | — | |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | 🆕 |

**Constraints:**
- PK, FKs.
- UNIQUE(`roadmap_item_id`, `version`) 🆕
- CHECK `approved_at IS NULL OR approved_by IS NOT NULL` 🆕

**Índices:**
- `idx_prds_roadmap_item` (`roadmap_item_id`) 🆕
- `idx_prds_status` 🆕
- `idx_prds_deleted_at` 🆕

**Triggers:** `trg_prds_updated_at`.

**RLS:** ❌

**Regras de negócio:**
- ⚠️ Apenas **uma** PRD pode estar `status='approved'` por `roadmap_item_id` simultaneamente. Backend valida.
- Versionamento: nova edição cria novo registro com `version = max(version) + 1`, mantendo as anteriores.
- Anexos: diagramas, mockups via `entity_assets` (`entity_type='prd'`).
- Aprovação dispara `entity_event prd.approved` e `decision_logs`.

**Eventos gerados:** `prd.draft_created`, `prd.submitted_for_review`, `prd.approved`, `prd.archived`.

**Relacionamentos:**
- → `workspaces`, `roadmap_items` (CASCADE), `users` (created_by, approved_by).

---

### `outcomes` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Impacto esperado/medido de um roadmap_item. Liga feature → métrica → resultado.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `roadmap_item_id` | `uuid` | NOT NULL | — | FK `roadmap_items.id` |
| `key_result_id` | `uuid` | NULL | — | FK `key_results.id` |
| `pain_id` | `uuid` | NULL | — | FK `pains.id`. Dor que se espera mitigar |
| `title` | `text` | NULL | — | 🆕 Título resumido do outcome |
| `description` | `text` | NULL | — | 🆕 Detalhamento |
| `hypothesized_impact` | `text` | NOT NULL | — | Hipótese de impacto antes da entrega |
| `status` | `outcome_status` | NULL | `'hypothesized'` | Enum §3.19 |
| `baseline_value` | `numeric` | NULL | — | Valor antes da entrega |
| `final_value` | `numeric` | NULL | — | Valor após período de medição |
| `baseline_snapshot` | `jsonb` | NULL | — | Snapshot completo de métricas antes |
| `metrics_snapshot` | `jsonb` | NULL | — | Snapshot completo após |
| `conclusion` | `text` | NULL | — | Análise textual do resultado |
| `owner_id` | `uuid` | NULL | — | 🆕 FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | (Adicionada pela migration 001) |

**Constraints:** PK, FKs.

**Índices:**
- `idx_outcomes_deleted_at` (existe pós-migration)
- `idx_outcomes_roadmap_item` (`roadmap_item_id`) 🆕
- `idx_outcomes_key_result` (`key_result_id`) 🆕
- `idx_outcomes_pain` (`pain_id`) 🆕
- `idx_outcomes_owner` (`owner_id`) 🆕

**Triggers:** `trg_outcomes_updated_at`.

**RLS:** ❌

**Regras de negócio:**
- Outcome é criado idealmente no momento `roadmap_items.status='delivered'` (com `baseline_snapshot`).
- Período de medição típico: 30/60/90 dias após delivery.
- Mudança de status para `achieved`/`not_achieved` exige `conclusion` preenchida.
- Pode estar ligado a uma `pain_id` ("entregamos para mitigar dor X") OU `key_result_id` ("entregamos para mover KR Y").

**Eventos gerados:** `outcome.hypothesized`, `outcome.measuring_started`, `outcome.achieved`, `outcome.not_achieved`.

**Relacionamentos:**
- → `workspaces`, `roadmap_items`, `key_results`, `pains`, `users`.

---

### `releases` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Marcos de release de produto. Agregação temporal de roadmap_items entregues.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `version` | `text` | NOT NULL | — | Ex.: "v2.3.0" |
| `title` | `text` | NULL | — | |
| `description` | `text` | NULL | — | |
| `planned_release_date` | `date` | NULL | — | |
| `actual_release_date` | `date` | NULL | — | |
| `changelog` | `text` | NULL | — | Markdown |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_releases_product` (`product_id`) 🆕
- UNIQUE(`product_id`, `version`) 🆕

**Triggers:** —

**RLS:** ❌

**Regras de negócio:**
- Releases são imutáveis na prática (changelogs são histórico). Não há soft delete por design.
- `roadmap_items.release_version` referencia esta tabela por texto (não FK estrita) para permitir versões planejadas antes da release existir.

**Eventos gerados:** `release.planned`, `release.shipped`.

---

### `engineering_handoffs` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Sincronização específica de roadmap_item para sistemas de engenharia (Jira, Azure DevOps).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `roadmap_item_id` | `uuid` | NOT NULL | — | FK ON DELETE CASCADE |
| `external_provider` | `text` | NULL | — | Valores: `jira`, `azure_devops` |
| `external_project` | `text` | NULL | — | Project key/id no sistema externo |
| `external_ticket_id` | `text` | NULL | — | |
| `external_ticket_url` | `text` | NULL | — | |
| `engineering_owner` | `text` | NULL | — | Nome/email do owner no sistema externo |
| `handoff_notes` | `text` | NULL | — | |
| `approved_for_delivery` | `bool` | NULL | `false` | |
| `synced_at` | `timestamptz` | NULL | — | Última sincronização |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_engineering_handoffs_roadmap_item` (`roadmap_item_id`) 🆕

**Triggers:** —

**RLS:** ❌

**Regras de negócio:**
- Especialização para handoff. Para refs externas genéricas (Figma, Notion, Slack), usar `external_references`.
- `approved_for_delivery=true` é pré-requisito para criar tickets via integração.

**Eventos gerados:** `engineering_handoff.created`, `engineering_handoff.approved`, `engineering_handoff.synced`.

---

### `external_references` 🌐 🆕
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** **proposta nova**

**Propósito:** Tabela polimórfica genérica para referenciar entidades em sistemas externos (Slack, Figma, GA4, Mixpanel, Notion, Linear, GitHub, etc.). Complementa `engineering_handoffs` (que é especializada para Jira/Azure DevOps).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `provider` | `external_provider` | NOT NULL | — | Enum §3.23 |
| `external_id` | `text` | NULL | — | ID no sistema externo |
| `external_url` | `text` | NOT NULL | — | Link |
| `label` | `text` | NULL | — | Nome amigável (ex.: "Figma — Mobile Onboarding") |
| `metadata` | `jsonb` | NULL | `'{}'` | Dados arbitrários (preview, last_modified, etc.) |
| `synced_at` | `timestamptz` | NULL | — | |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs (`workspace_id`, `created_by`).

**Índices:**
- `idx_external_references_entity` (`entity_type`, `entity_id`)
- `idx_external_references_workspace` (`workspace_id`)
- `idx_external_references_provider` (`provider`)

**Triggers:** `trg_external_references_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌ (a aplicação filtra por workspace).

**Regras de negócio:**
- Permite ter múltiplas refs externas por entidade (uma feature pode ter link Figma + Mixpanel + Notion).
- Para integrações ativas (com OAuth e sync bidirecional) usar `engineering_handoffs` se Jira/Azure; caso contrário, esta tabela é suficiente como "shortcut link".

**Eventos gerados:** `external_reference.created`, `external_reference.synced`, `external_reference.removed`.

**Relacionamentos:**
- → `workspaces`, `users`.

---
