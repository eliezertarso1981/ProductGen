---
title: 10 — Governance & Event Sourcing
doc_id: 10-governance-events
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 1500
last_updated: 2026-05-14
---

# 10 — Governance & Event Sourcing (§4.11 + §4.12)

> Trilha de auditoria e governança. `decision_logs` registra decisões estratégicas (kill switch, pivô, priorização). `entity_permissions` é uma camada opcional de permissão por entidade (overrides do nível workspace_role). `entity_events` é a tabela de event sourcing — imutável, particionada por ano sobre `occurred_at`, emitida pelo backend (não trigger automático).

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)

## Entidades nesta documentação

- 🌐 `decision_logs`
- 🌐 `entity_permissions`
- 📜🌐 `entity_events`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.11 Governance

### `decision_logs` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Registro estruturado de decisões estratégicas. Diferente de `entity_events` (que é técnico/automático), `decision_logs` é deliberado/narrativo.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5. A entidade sobre a qual se decidiu |
| `entity_id` | `uuid` | NOT NULL | — | |
| `decision_type` | `text` | NOT NULL | — | Ex.: `hypothesis_invalidated`, `feature_cancelled`, `priority_changed`, `strategic_pivot`, `merge_pains`, `split_pain` |
| `title` | `text` | NOT NULL | — | |
| `rationale` | `text` | NOT NULL | — | Justificativa |
| `impact_analysis` | `text` | NULL | — | Análise de consequências |
| `decided_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_decision_logs_entity` (`entity_type`, `entity_id`) 🆕
- `idx_decision_logs_workspace` (`workspace_id`) 🆕
- `idx_decision_logs_type` (`decision_type`) 🆕

**Regras de negócio:**
- Toda decisão deve gerar também `entity_event` correspondente (decision_log é o narrativo; event é o atômico).
- Imutável na prática: correções via novo `decision_log` referenciando o anterior em `impact_analysis`.

**Eventos gerados:** `decision.logged`.

---

### `entity_permissions` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Permissões granulares por entidade. Permite expor uma única dor/hipótese para um stakeholder externo, ou restringir uma feature confidencial.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `user_id` | `uuid` | NULL | — | FK `users.id`. NULL = permissão genérica (ex.: para um link público — não usado ainda) |
| `permission` | `text` | NOT NULL | — | `read`, `comment`, `edit`, `admin` |
| `granted_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:** `idx_entity_permissions_entity`, `idx_entity_permissions_user`.

**RLS Policy:** `entity_permissions_workspace_isolation`.

**Regras de negócio:**
- Permissões aditivas sobre o que `workspace_members.role` já permite.
- Soft delete = revogação (preserva histórico de quem teve acesso).

**Eventos gerados:** `entity_permission.granted`, `entity_permission.revoked`.

---

## 4.12 Event Sourcing

### `entity_events` 📜🌐
> 📜🌐 **Entidade Polimórfica Imutável** · **Escopo:** workspace · **Soft delete:** N/A (imutável) · **RLS:** não · **Status:** existente (particionada)

**Propósito:** Event store central. Toda transição estratégica do sistema é registrada aqui. Base para activity feed, audit trail, AI timeline.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | — | PK (composta com `occurred_at`) |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `event_type` | `text` | NOT NULL | — | Padrão: `<entity>.<verb>` (ex.: `pain.merged`, `hypothesis.validated`) |
| `from_status` | `text` | NULL | — | Status anterior (se aplicável) |
| `to_status` | `text` | NULL | — | Status novo |
| `reason` | `text` | NULL | — | Justificativa textual |
| `actor_id` | `uuid` | NULL | — | FK `users.id`. Quem disparou o evento |
| `correlation_id` | `uuid` | NULL | — | Agrupa eventos de uma mesma transação/operação |
| `causation_id` | `uuid` | NULL | — | Aponta para evento que causou este |
| `metadata` | `jsonb` | NULL | `'{}'` | Payload extra (previous_value, new_value, contexto) |
| `occurred_at` | `timestamptz` | NOT NULL | `now()` | Parte da PK (chave de particionamento) |

**Constraints:** PK(`id`, `occurred_at`), FKs.

**Partições:** PARTITION BY RANGE (`occurred_at`). Partições anuais:
- `entity_events_2026`
- `entity_events_2027`
- `entity_events_2028`
- ... criadas por `ensure_entity_events_partition(year)`.

**Índices:** (aplicar nas partições conforme volume)
- `idx_entity_events_entity` (`entity_type`, `entity_id`, `occurred_at DESC`) 🆕
- `idx_entity_events_workspace` (`workspace_id`, `occurred_at DESC`) 🆕
- `idx_entity_events_actor` (`actor_id`) 🆕
- `idx_entity_events_correlation` (`correlation_id`) 🆕

**Triggers:** —

**RLS:** ❌ (queries filtradas pela aplicação).

**Regras de negócio:**
- ⚠️ **Imutável.** Nunca `UPDATE` nem `DELETE` direto. Retenção via drop de partições antigas.
- Backend emite eventos explicitamente — não há trigger universal de captura.
- Convenção: `event_type` no formato `<lowercase_entity>.<past_tense_verb>`:
  - `pain.created`, `pain.status_changed`, `pain.merged`, `pain.split`, `pain.archived`
  - `hypothesis.formulated`, `hypothesis.validated`, `hypothesis.invalidated`
  - `roadmap_item.delivered`, `roadmap_item.cancelled`
  - `outcome.achieved`, `outcome.not_achieved`
  - `product.lifecycle_changed`, `product.ownership_changed`
- `correlation_id` permite reconstruir operações compostas (ex.: split de dor cria múltiplos eventos com mesmo correlation_id).
- `causation_id` é DAG temporal: evento B foi causado pelo evento A.

**Função de manutenção:**
```sql
SELECT public.ensure_entity_events_partition(EXTRACT(YEAR FROM now())::int + 1);
```
Agendar anualmente (pg_cron ou job externo) para evitar falhas de insert em mudanças de ano.

---
