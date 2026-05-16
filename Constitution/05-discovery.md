---
title: 05 — Discovery Layer
doc_id: 05-discovery
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md", "04-product-core.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 3700
last_updated: 2026-05-14
---

# 05 — Discovery Layer (§4.4)

> O coração do Product Discovery. Cobre o ciclo: `Evidence → Insight → Pain → Hypothesis → Experiment`. Pains podem ser canônicos (reutilizáveis) ou standard (operacionais); `pain_relationships` mantém merges, splits, similares e hierarquia. Hipóteses usam fórmula "If/Then/Because" e ligam-se a dores via `pain_hypothesis_links`. Este é o maior domínio do PRD.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)
- [`04-product-core.md`](./04-product-core.md)

## Entidades nesta documentação

- 📦 `evidences`
- 📦 `insights`
- 📦 `pains`
- 🔗 `pain_relationships`
- 📦 `hypotheses`
- 📦 `experiments`
- 🔗 `pain_hypothesis_links`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.4 Discovery

### `evidences` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Evidência bruta de pesquisa, suporte, vendas, analytics. Insumo primário do discovery.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `product_id` | `uuid` | NULL | — | FK `products.id`. NULL = evidência cross-produto |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NOT NULL | — | |
| `source` | `evidence_source` | NOT NULL | — | Enum §3.5 |
| `source_url` | `text` | NULL | — | Link para sistema original (ex.: ticket Zendesk) |
| `customer_identifier` | `text` | NULL | — | Email, nome de conta, anonimizado conforme LGPD |
| `confidence_score` | `numeric` | NULL | — | 0.0-1.0 |
| `evidence_strength` | `numeric` | NULL | — | 0.0-1.0. Subjetivo do pesquisador |
| `sample_size` | `int4` | NULL | — | Quantos clientes/eventos |
| `status` | `evidence_status` | NULL | `'new'` | Enum §3.6 |
| `metadata` | `jsonb` | NULL | `'{}'` | Campos auxiliares (transcript, tags brutas) |
| `search_vector` | `tsvector` | NULL | — | Atualizado por trigger |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `owner_id` | `uuid` | NULL | — | FK `users.id`. Pesquisador responsável |
| `collected_at` | `timestamptz` | NULL | `now()` | Quando a evidência foi coletada (≠ created_at) |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_evidences_search` GIN (`search_vector`)
- `idx_evidences_workspace` (`workspace_id`) 🆕
- `idx_evidences_product` (`product_id`) 🆕
- `idx_evidences_owner` (`owner_id`)
- `idx_evidences_status` (`status`) 🆕
- `idx_evidences_deleted_at` (`deleted_at`)

**Triggers:**
- `trg_evidences_search` BEFORE INSERT/UPDATE → `update_search_vector()` (concatena `title || description`)
- `trg_evidences_updated_at` BEFORE UPDATE → `set_updated_at()` 🆕

**RLS Policy:** `evidences_workspace_isolation` USING `workspace_id = current_workspace_id()`.

**Regras de negócio:**
- ⚠️ `customer_identifier` é PII — backend deve permitir anonimização sob solicitação (LGPD direito ao apagamento → soft delete + scrub).
- Evidência pode gerar 1+ insights via `entity_links` (`relationship_type='generated_from'`).
- Anexos via `entity_assets` (`entity_type='evidence'`, `role='attachment'` ou `'recording'`).

**Eventos gerados:** `evidence.created`, `evidence.triaged`, `evidence.linked`, `evidence.archived`.

**Relacionamentos:**
- → `workspaces`, `products`, `users` (created_by, owner_id).
- ← linked via `entity_links` para `insights`, `pains`.

---

### `insights` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Interpretação estruturada extraída de uma ou mais evidências. É o passo de "o que isso significa?".

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NULL | — | FK `products.id` |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NOT NULL | — | |
| `confidence_score` | `numeric` | NULL | — | 0.0-1.0 |
| `impact_score` | `numeric` | NULL | — | 0.0-1.0 |
| `frequency_score` | `numeric` | NULL | — | 0.0-1.0. Quão frequente o sinal aparece |
| `evidence_count` | `int4` | NULL | `0` | Denormalização do count de evidências linkadas |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `metadata` | `jsonb` | NULL | `'{}'` | |
| `search_vector` | `tsvector` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs (`workspace_id`, `product_id`, `owner_id`).

> ⚠️ A coluna `persona_id` foi **removida** (PRD §1.3 estabelece N:N). Usar `insight_personas`.

**Índices:**
- `idx_insights_search` GIN (`search_vector`)
- `idx_insights_workspace` (`workspace_id`) 🆕
- `idx_insights_product` (`product_id`) 🆕
- `idx_insights_owner` (`owner_id`) 🆕
- `idx_insights_deleted_at` (`deleted_at`)

**Triggers:**
- `trg_insights_search` BEFORE INSERT/UPDATE → `update_search_vector()`
- `trg_insights_updated_at` BEFORE UPDATE → `set_updated_at()`

**RLS Policy:** `insights_workspace_isolation` USING `workspace_id = current_workspace_id()`.

**Regras de negócio:**
- Insight pode gerar pains via `entity_links` (`relationship_type='generated_from'`).
- Personas vinculadas via `insight_personas` (N:N).
- `evidence_count` deve ser mantido consistente pelo backend ao linkar/deslinkar evidências.

**Eventos gerados:** `insight.created`, `insight.updated`, `insight.linked_to_pain`, `insight.archived`.

**Relacionamentos:**
- → `workspaces`, `products`, `users`.
- ← `insight_personas`, `entity_links` (origem/destino).

---

### `pains` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Problemas validados do cliente. Estado central do discovery — gera hipóteses e roadmap.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `canonical_pain_id` | `uuid` | NULL | — | FK `pains.id`. Aponta para dor canônica equivalente |
| `parent_pain_id` | `uuid` | NULL | — | FK `pains.id`. Hierarquia (split/merge) |
| `root_pain_id` | `uuid` | NULL | — | FK `pains.id`. Raiz da árvore (denormalização para queries de lineage) |
| `type` | `pain_type` | NULL | `'standard'` | Enum §3.7 |
| `title` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `status` | `pain_status` | NULL | `'identified'` | Enum §3.8 |
| `severity` | `int4` | NULL | — | 1-5. CHECK `BETWEEN 1 AND 5` |
| `reach_estimate` | `int4` | NULL | — | Nº estimado de clientes afetados |
| `confidence_score` | `numeric` | NULL | — | 0.0-1.0 |
| `priority_score` | `numeric` | NULL | — | Resultado do scoring (§2.6) |
| `scoring_method` | `text` | NULL | — | §2.6 |
| `scoring_payload` | `jsonb` | NULL | `'{}'` | §2.6 |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `search_vector` | `tsvector` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:**
- PK, FKs.
- `pains_severity_check` CHECK `severity BETWEEN 1 AND 5`.

**Índices:**
- `idx_pains_search` GIN, `idx_pains_workspace`, `idx_pains_product`, `idx_pains_owner`, `idx_pains_status`, `idx_pains_deleted_at`.
- `idx_pains_canonical` (`canonical_pain_id`) 🆕
- `idx_pains_root` (`root_pain_id`) 🆕

**Triggers:**
- `trg_pains_search`, `trg_pains_updated_at`.

**RLS Policy:** `pains_workspace_isolation`.

**Regras de negócio:**
- ⚠️ **Merge:** múltiplas dores → 1 dor consolidada. Originais ficam (soft-delete + `entity_link relationship_type='merged_from'`). Ou via `pain_relationships`.
- ⚠️ **Split:** 1 dor → múltiplas dores filhas. Cada filha aponta para `parent_pain_id`. `root_pain_id` recursivo.
- ⚠️ **Inheritance no split:** dores filhas herdam (via copy on write) hipóteses, experimentos, evidências, roadmap_items, comentários, owners, assets. Backend é responsável pela copia.
- Mudança de `status` para `merged` ou `split` exige criação de registros em `pain_relationships`.
- Mudança de `priority_score` quando `scoring_payload` é alterado: recálculo automático no backend.

**Eventos gerados:** `pain.created`, `pain.status_changed`, `pain.merged`, `pain.split`, `pain.priority_changed`, `pain.owner_changed`, `pain.archived`.

**Relacionamentos:**
- → `workspaces`, `products`, `users` (created_by, owner_id), `pains` (canonical, parent, root).
- ← `pain_personas`, `pain_hypothesis_links`, `pain_relationships` (source/target), `outcomes.pain_id`.

---

### `pain_relationships` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Rastreia relações entre dores (merge, split, duplicate, causality).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `source_pain_id` | `uuid` | NOT NULL | — | FK `pains.id` ON DELETE CASCADE |
| `target_pain_id` | `uuid` | NOT NULL | — | FK `pains.id` ON DELETE CASCADE |
| `relationship_type` | `relationship_type` | NOT NULL | — | Enum §3.21. Usual: `merged_from`, `split_from`, `duplicates`, `causes` |
| `reason` | `text` | NULL | — | Justificativa textual |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_pain_relationships_source` (`source_pain_id`) 🆕
- `idx_pain_relationships_target` (`target_pain_id`) 🆕

**Regras de negócio:**
- Append-only. Para "desfazer" um merge, criar relationship inverso ou usar `decision_logs`.
- Evita ciclos: backend valida que não há ciclos `source → ... → source`.

**Eventos gerados:** `pain_relationship.created`.

---

### `hypotheses` 📦
> 📦 **Entidade de Domínio** · **Escopo:** product · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Hipóteses no formato "Se X, então Y, porque Z". Validáveis via experimentos.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `title` | `text` | NOT NULL | — | |
| `if_clause` | `text` | NOT NULL | — | "Se nós fizermos X..." |
| `then_clause` | `text` | NOT NULL | — | "...então acontecerá Y..." |
| `because_clause` | `text` | NOT NULL | — | "...porque Z." |
| `assumptions` | `jsonb` | NULL | `'[]'` | Array de premissas: `[{text, riskLevel, validated}]` |
| `confidence` | `int4` | NULL | — | 1-5. CHECK |
| `priority_score` | `numeric` | NULL | — | §2.6 |
| `impact_score` | `numeric` | NULL | — | 0.0-1.0 |
| `effort_score` | `numeric` | NULL | — | 0.0-1.0 |
| `scoring_method` | `text` | NULL | — | §2.6 |
| `scoring_payload` | `jsonb` | NULL | `'{}'` | §2.6 |
| `status` | `hypothesis_status` | NULL | `'formulated'` | Enum §3.9 |
| `outcome_summary` | `text` | NULL | — | Resumo do resultado após experimentação |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `search_vector` | `tsvector` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:**
- PK, FKs.
- `hypotheses_confidence_check` CHECK `confidence BETWEEN 1 AND 5`.

**Índices:** `idx_hypotheses_workspace`, `idx_hypotheses_product`, `idx_hypotheses_owner`, `idx_hypotheses_status`, `idx_hypotheses_search` GIN, `idx_hypotheses_deleted_at`.

**Triggers:** `trg_hypotheses_search`, `trg_hypotheses_updated_at`.

**RLS Policy:** `hypotheses_workspace_isolation`.

**Regras de negócio:**
- Vinculada a 1+ dores via `pain_hypothesis_links`.
- Gera experimentos (FK `experiments.hypothesis_id`).
- Vinculada a roadmap_items via `hypothesis_roadmap_links`.
- Mudança para `invalidated` ou `discarded` exige `decision_logs`.
- Anexos: protótipos, wireframes via `entity_assets`.

**Eventos gerados:** `hypothesis.formulated`, `hypothesis.validating`, `hypothesis.validated`, `hypothesis.invalidated`, `hypothesis.linked_to_roadmap`, `hypothesis.archived`.

**Relacionamentos:**
- → `workspaces`, `products`, `users`.
- ← `experiments`, `pain_hypothesis_links`, `hypothesis_roadmap_links`, `outcomes` (via `entity_links`).

---

### `experiments` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace (via hypothesis → product) · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Validações executadas sobre hipóteses.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `hypothesis_id` | `uuid` | NOT NULL | — | FK `hypotheses.id` |
| `title` | `text` | NOT NULL | — | |
| `method` | `text` | NULL | — | Metodologia (A/B test, usability test, fake door, prototype, etc.) |
| `success_criteria` | `text` | NOT NULL | — | Critério mensurável |
| `sample_target` | `int4` | NULL | — | 🆕 Tamanho alvo da amostra |
| `sample_actual` | `int4` | NULL | — | 🆕 Tamanho real atingido |
| `status` | `experiment_status` | NULL | `'planned'` | Enum §3.10 |
| `result` | `experiment_result` | NULL | — | Enum §3.11 |
| `learnings` | `text` | NULL | — | Aprendizados pós-experimento |
| `created_by` | `uuid` | NULL | — | 🆕 FK `users.id` |
| `owner_id` | `uuid` | NULL | — | FK `users.id` |
| `started_at` | `timestamptz` | NULL | — | |
| `finished_at` | `timestamptz` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_experiments_hypothesis` (`hypothesis_id`)
- `idx_experiments_status` (`status`) 🆕
- `idx_experiments_owner` (`owner_id`) 🆕

**Triggers:** `trg_experiments_updated_at`.

**RLS:** ❌ (herda via hypothesis).

**Regras de negócio:**
- Conclusão do experimento (`status='analyzed'` + `result` setado) **deve** disparar atualização de `hypotheses.status` (manual via backend).
- Evidências e gravações via `entity_assets`.

**Eventos gerados:** `experiment.planned`, `experiment.started`, `experiment.completed`, `experiment.analyzed`.

**Relacionamentos:**
- → `workspaces`, `hypotheses`, `users`.

---

### `pain_hypothesis_links` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Vincula dores a hipóteses (N:N).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `pain_id` | `uuid` | NOT NULL | — | FK `pains.id` ON DELETE CASCADE; parte da PK |
| `hypothesis_id` | `uuid` | NOT NULL | — | FK `hypotheses.id` ON DELETE CASCADE; parte da PK |

**Constraints:** PK(`pain_id`, `hypothesis_id`).

> 🆕 Adicionar `created_at timestamptz DEFAULT now()` para consistência com outras junções.

**Regras de negócio:** Junção pura. DELETE físico permitido.

---
