---
title: 13 — Anexos
doc_id: 13-appendices
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 900
last_updated: 2026-05-14
---

# 13 — Anexos A e B (§11 + §12)

> Estado pós-migration 001 (Anexo A) e checklist de itens 🆕 ainda não aplicados ao schema (Anexo B). Use estes anexos antes de gerar migration nova: A diz o que já existe, B diz o que ainda precisa ser feito. Evita duplicação.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 11. Anexo A — Estado pós-migration 001

A migration `001_prd_schema_alignment.sql` aplicou:
- DROP `users.avatar_url`, DROP `insights.persona_id`.
- ADD `deleted_at` em `evidences`, `hypotheses`, `insights`, `pains`, `roadmap_items`, `objectives`, `outcomes`.
- ADD `evidences.owner_id`, `hypotheses.{created_by, scoring_method, scoring_payload}`, `pains.created_by`, `roadmap_items.created_by`, `product_metrics.updated_at`.
- CHECK + UNIQUE partial em `entity_assignments`.
- Trigger `trg_products_validate_ownership` (CONSTRAINT DEFERRABLE).
- Fix de `v_product_health` (joins via `roadmap_item_id`).
- Partições `entity_events_2027`, `entity_events_2028` + função helper.

## 12. Anexo B — Itens 🆕 deste documento ainda não aplicados ao schema

A IA que ler este documento deve gerar migrations para cobrir:

### B.1 Novos enums
- `pillar_status` (§3.3)
- `health_status` (§3.13)
- `metric_periodicity` (§3.15)
- `prd_status` (§3.18)
- `key_result_status` (§3.20)
- `external_provider` (§3.23)

### B.2 Novas colunas
- `workspaces.description`
- `strategic_pillars.{priority, status, owner_id}`
- `personas.needs`
- `experiments.{sample_target, sample_actual, created_by}`
- `objectives.{pillar_id, score, health_status}`
- `key_results.{description, status, measurement_date, owner_id, deleted_at}`
- `product_metrics.{formula, unit, periodicity, owner_id, deleted_at}`
- `roadmap_items.effort_score`
- `prds.{status, deleted_at}` + UNIQUE(`roadmap_item_id`, `version`)
- `outcomes.{title, description, owner_id}`
- `hypothesis_roadmap_links.created_at`
- `roadmap_key_result_links.created_at`

### B.3 Novos índices
Listados em cada tabela com 🆕. Resumo dos mais críticos:
- `idx_objectives_pillar`, `idx_objectives_owner`
- `idx_key_results_objective`, `idx_key_results_owner`, `idx_key_results_deleted_at`
- `idx_product_metrics_product`, `idx_product_metrics_type`
- `idx_prds_roadmap_item`, `idx_prds_status`, `idx_prds_deleted_at`
- `idx_outcomes_roadmap_item`, `idx_outcomes_key_result`, `idx_outcomes_pain`, `idx_outcomes_owner`
- `idx_roadmap_parent`, `idx_roadmap_pillar`, `idx_roadmap_type`
- `idx_strategic_pillars_product`, `idx_strategic_pillars_owner`
- `idx_pains_canonical`, `idx_pains_root`
- `idx_pain_relationships_source`, `idx_pain_relationships_target`
- `idx_entity_events_entity`, `idx_entity_events_workspace`, `idx_entity_events_actor`, `idx_entity_events_correlation`
- `idx_entity_tags_tag`
- `idx_decision_logs_entity`, `idx_decision_logs_workspace`, `idx_decision_logs_type`
- `idx_entity_embeddings_workspace`
- `idx_evidences_workspace`, `idx_evidences_product`, `idx_evidences_status`
- `idx_insights_workspace`, `idx_insights_product`, `idx_insights_owner`
- `idx_personas_workspace`
- `idx_experiments_status`, `idx_experiments_owner`
- `idx_releases_product`, UNIQUE(`product_id`, `version`)
- `idx_engineering_handoffs_roadmap_item`

### B.4 Novas tabelas
- `external_references` (§4.6) — refs genéricas a sistemas externos.

### B.5 Novas constraints
- `objectives` CHECK `score` ∈ [0,1] e `horizon_end ≥ horizon_start`.
- `prds` UNIQUE(`roadmap_item_id`, `version`) e CHECK aprovação.
- `releases` UNIQUE(`product_id`, `version`).
- `strategic_pillars` CHECK `priority` ∈ [1,5].

### B.6 Novos triggers
- `trg_key_results_updated_at`
- `trg_evidences_updated_at` (existia? validar; migration 001 não adicionou explicitamente)
- `trg_external_references_updated_at`

---

**FIM DA PRD CANÔNICA v2.**
