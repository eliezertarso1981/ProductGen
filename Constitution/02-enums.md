---
title: 02 — Catálogo de Enums
doc_id: 02-enums
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 750
last_updated: 2026-05-14
---

# 02 — Catálogo de Enums

> Catálogo dos 23 enums (`CREATE TYPE ... AS ENUM`). A ordem dos valores em cada enum é semântica (estado inicial primeiro, terminais por último). Este arquivo é pré-requisito de qualquer arquivo de domínio.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 3. Catálogo de Enums

Os enums abaixo são `CREATE TYPE ... AS ENUM`. Ordem dos valores **é semântica** (estado inicial primeiro, estados terminais por último).

### 3.1 `workspace_role`
```
admin, member, stakeholder
```
- `admin`: governa workspace (membros, integrações, billing).
- `member`: cria/edita entidades.
- `stakeholder`: leitura + comentários; sem edição.

### 3.2 `product_role`
```
director, cpo, gpm, pm, po, ux, pd, stakeholder
```
- `director`: liderança executiva.
- `cpo`: chief product officer.
- `gpm`: group product manager.
- `pm`: product manager.
- `po`: product owner.
- `ux`: UX designer/researcher.
- `pd`: product designer.
- `stakeholder`: visibilidade restrita.

### 3.3 `pillar_status` 🆕
```
planned, in_progress, completed, blocked
```

### 3.4 `lifecycle_stage`
```
development, introduction, growth, maturity, decline
```

### 3.5 `evidence_source`
```
interview, support_ticket, nps, sales_call, usage_data, survey, review, internal, analytics, other
```

### 3.6 `evidence_status`
```
new, triaged, linked, archived
```

### 3.7 `pain_type`
```
canonical, standard
```
- `canonical`: dor consolidada, reutilizável organizacionalmente.
- `standard`: dor operacional vinculada a um produto/contexto.

### 3.8 `pain_status`
```
identified, investigating, prioritized, addressed, resolved, discarded, merged, split
```

### 3.9 `hypothesis_status`
```
formulated, validating, validated, invalidated, in_execution, delivered, deprioritized, discarded
```

### 3.10 `experiment_status`
```
planned, running, completed, analyzed
```

### 3.11 `experiment_result`
```
validated, invalidated, inconclusive
```

### 3.12 `objective_status`
```
draft, active, completed, cancelled
```

### 3.13 `health_status` 🆕
```
green, yellow, red, gray
```
- `green`: score ≥ 0.7
- `yellow`: 0.4 ≤ score < 0.7
- `red`: score < 0.4
- `gray`: score = NULL (não mensurável ainda)

### 3.14 `metric_type`
```
north_star, kpi, counter_metric, guardrail_metric
```

### 3.15 `metric_periodicity` 🆕
```
daily, weekly, monthly, quarterly, yearly
```

### 3.16 `delivery_type`
```
initiative, epic, feature
```

### 3.17 `delivery_status`
```
proposed, planned, in_development, in_validation, delivered, measuring_outcome, cancelled, rolled_back
```

### 3.18 `prd_status` 🆕
```
draft, reviewing, approved, archived
```

### 3.19 `outcome_status`
```
hypothesized, measuring, achieved, not_achieved, cancelled
```

### 3.20 `key_result_status` 🆕
```
measuring, achieved, not_achieved, cancelled
```

### 3.21 `relationship_type`
```
related_to, causes, supports, blocks, duplicates, merged_from, split_from, generated_from, inspired_by, measures, impacts
```

### 3.22 `visibility_level`
```
public, private, restricted
```
- `public`: visível para todos os membros do workspace.
- `private`: visível apenas para o autor.
- `restricted`: visível apenas para usuários listados em `entity_permissions`.

### 3.23 `external_provider` 🆕
```
jira, azure_devops, slack, figma, ga4, mixpanel, notion, linear, github, other
```

---
