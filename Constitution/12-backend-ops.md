---
title: 12 — Backend Conventions & Glossary
doc_id: 12-backend-ops
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md"]
audience: [llm, backend_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 800
last_updated: 2026-05-14
---

# 12 — Convenções de Backend & Glossário (§9 + §10)

> Regras práticas para a camada de aplicação: idempotência de endpoints, padrões de transação, gestão do contexto `app.current_workspace_id`, emissão de `entity_events`, espelhamento de `*_owner_id`. O glossário define termos do domínio usados em todo o PRD.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 9. Convenções para o backend (camada de aplicação)

### 9.1 Eventos
- Todo `INSERT`/`UPDATE` significativo em entidade de domínio **deve** emitir `entity_event`.
- Significativo = mudança de status, ownership, prioridade, conclusão, soft delete.
- Edições triviais (typo, descrição) **não** geram evento (apenas `updated_at`).

### 9.2 Soft delete
- Service layer expõe `delete()` que faz `UPDATE deleted_at = now()`.
- Repository layer filtra `deleted_at IS NULL` por padrão.
- Endpoints administrativos (com flag explícita) podem listar deletadas para restore.

### 9.3 Scoring
- Recálculo automático ao mudar `scoring_payload`.
- Função de cálculo por método: `score_rice()`, `score_ice()`, `score_wsjf()`, `score_value_effort()`.
- Resultado persistido em `priority_score`.

### 9.4 Search
- Aplicação usa `tsquery` sobre `search_vector` para full-text.
- Frontend pode oferecer toggle "buscar também em deletados" para admins.

### 9.5 Embeddings
- Geração assíncrona após `INSERT`/`UPDATE` em `evidences`, `insights`, `pains`, `hypotheses`, `roadmap_items`.
- Usar fila (Redis/SQS/etc.) com retry.

### 9.6 Ownership denormalização
- Colunas `*_owner_id` em entidades são **espelho** do `is_primary=true` ativo em `entity_assignments`.
- Backend mantém ambos consistentes: criar entity_assignment → atualizar coluna espelho; encerrar entity_assignment → limpar coluna espelho.

### 9.7 Audit trail
- `created_by` setado uma vez na criação; nunca atualizado.
- Edições rastreadas via `entity_events` (mais flexível que `updated_by` única coluna).

---

## 10. Glossário

| Termo | Significado |
|---|---|
| **Workspace** | Tenant isolado. Equivale a "organização" ou "empresa" no sistema. |
| **Produto** | Produto digital gerenciado. Tem PM, UX, PO, vision, lifecycle stage. |
| **Pilar Estratégico** | Frente estratégica do produto. Agrupa OKRs e roadmap items. |
| **Discovery** | Evidence → Insight → Pain → Hypothesis → Experiment. |
| **Delivery** | Roadmap Item → PRD → Release → Outcome. |
| **Dor (Pain)** | Problema validado do cliente. Canônica (reutilizável) ou standard. |
| **Hipótese** | "Se fizermos X, então Y, porque Z". Testável via experimento. |
| **Roadmap Item** | Entrega planejada. Pode ser initiative, epic ou feature. |
| **Feature** | `roadmap_items.type='feature'`. NÃO é tabela separada. |
| **PRD** | Product Requirement Document. Spec funcional da entrega. |
| **Outcome** | Impacto esperado/medido da entrega. |
| **OKR** | Objective + Key Results (`objectives` + `key_results`). |
| **North Star** | Métrica única que captura valor entregue. |
| **Soft Delete** | `deleted_at IS NOT NULL`. Entidade preservada para histórico. |
| **Polimórfica** | Tabela com `(entity_type, entity_id)` apontando para qualquer entidade. |
| **Event Sourcing** | Histórico de mudanças como sequência de eventos imutáveis. |
| **RLS** | Row-Level Security do PostgreSQL. Isolamento por workspace. |
| **LTREE** | Tipo do PostgreSQL para árvores hierárquicas. Usado em `roadmap_items.path`. |
| **Embedding** | Vetor numérico que representa semântica de uma entidade (para AI). |
| **Knowledge Graph** | `entity_links` + `entity_embeddings` formam o grafo de conhecimento. |
| **Handoff** | Transferência do roadmap_item para o time de engenharia (Jira/Azure DevOps). |

---
