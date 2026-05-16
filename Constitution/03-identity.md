---
title: 03 — Identity & Access
doc_id: 03-identity
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 2000
last_updated: 2026-05-14
---

# 03 — Identity & Access (§4.1)

> Identidades humanas (`users`), contêineres organizacionais (`workspaces`) e suas relações de membership. Estas tabelas são referenciadas por TODAS as outras entidades de domínio via FKs como `created_by`, `owner_id`, `assigned_to`, `workspace_id`. Tabelas globais (sem RLS): `users`, `workspaces`.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)

## Entidades nesta documentação

- 📦 `users`
- 📦 `workspaces`
- 🔗 `workspace_members`
- 🔗 `product_members`
- 📦 `squads`
- 🔗 `squad_members`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4. Schema Canônico

### Mapa de domínios

Cada item da coluna **Entidades** vem com o ícone do seu tipo (vide §2.7): 📦 Domínio · 🔗 Junção · 🌐 Polimórfica · 📜 Imutável · 🏷️ Catálogo.

| § | Domínio | Entidades |
|---|---|---|
| 4.1 | Identity & Access | `users` 📦, `workspaces` 📦, `workspace_members` 🔗, `product_members` 🔗, `squads` 📦, `squad_members` 🔗 |
| 4.2 | Product Core | `products` 📦, `strategic_pillars` 📦 |
| 4.3 | Personas | `personas` 📦, `product_personas` 🔗, `pain_personas` 🔗, `insight_personas` 🔗 |
| 4.4 | Discovery | `evidences` 📦, `insights` 📦, `pains` 📦, `pain_relationships` 🔗, `hypotheses` 📦, `experiments` 📦, `pain_hypothesis_links` 🔗 |
| 4.5 | Strategy | `objectives` 📦, `key_results` 📦, `product_metrics` 📦, `metric_history` 📜 |
| 4.6 | Delivery | `roadmap_items` 📦, `hypothesis_roadmap_links` 🔗, `roadmap_key_result_links` 🔗, `prds` 📦, `outcomes` 📦, `releases` 📦, `engineering_handoffs` 📦, `external_references` 🌐 🆕 |
| 4.7 | Ownership | `entity_assignments` 🌐 |
| 4.8 | Collaboration | `comments` 🌐, `entity_followers` 🌐, `tags` 🏷️, `entity_tags` 🌐 |
| 4.9 | Assets | `media_assets` 🏷️, `entity_assets` 🌐 |
| 4.10 | Semantic Graph | `entity_links` 🌐, `entity_embeddings` 🌐 |
| 4.11 | Governance | `decision_logs` 🌐, `entity_permissions` 🌐 |
| 4.12 | Event Sourcing | `entity_events` 📜🌐 (+ partições anuais) |

---

## 4.1 Identity & Access

### `users` 📦
> 📦 **Entidade de Domínio** · **Escopo:** global · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Representa um usuário humano da plataforma. Avatares **não** ficam aqui — usam `entity_assets` com `role='avatar'`.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `email` | `citext` | NOT NULL | — | UNIQUE, case-insensitive |
| `name` | `text` | NOT NULL | — | Nome completo |
| `nickname` | `text` | NULL | — | Apelido / display name |
| `primary_role` | `text` | NULL | — | Valores: `CPO`, `GPM`, `PM`, `PO`, `UX`, `PD` (texto livre; aplicação valida) |
| `bio` | `text` | NULL | — | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | Trigger `set_updated_at` |
| `deleted_at` | `timestamptz` | NULL | — | Soft delete |

**Constraints:** PK(`id`), UNIQUE(`email`).

**Índices:** —

**Triggers:** `trg_users_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌ (tabela global; acesso controlado por `workspace_members`).

**Regras de negócio:**
- ⚠️ Avatar **nunca** como coluna; usar `entity_assets` (`entity_type='user'`, `role='avatar'`, `is_primary=true`).
- `email` é UNIQUE e case-insensitive (citext).
- Soft delete preserva histórico (FKs `actor_id`, `created_by`, `owner_id` permanecem válidas).

**Eventos gerados:** —

**Relacionamentos:**
- ← referenciado por dezenas de FKs (`actor_id`, `created_by`, `owner_id`, `decided_by`, `approved_by`, etc.).

---

### `workspaces` 📦
> 📦 **Entidade de Domínio** · **Escopo:** global · **Soft delete:** sim · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Contêiner organizacional top-level. Representa uma empresa, unidade de negócio ou ambiente isolado.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `name` | `text` | NOT NULL | — | |
| `slug` | `text` | NOT NULL | — | UNIQUE, URL-safe |
| `description` | `text` | NULL | — | 🆕 Descrição do workspace |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | Soft delete |

**Constraints:** PK(`id`), UNIQUE(`slug`).

**Índices:** —

**Triggers:** `trg_workspaces_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌

**Regras de negócio:**
- Logo do workspace via `entity_assets` (`entity_type='workspace'`, `role='logo'`).
- `slug` deve casar regex `^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$`.

**Eventos gerados:** `workspace.created`, `workspace.archived`, `workspace.restored`.

**Relacionamentos:**
- ← praticamente todas as tabelas de domínio têm `workspace_id` FK para `workspaces.id`.

---

### `workspace_members` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Define a participação de um usuário em um workspace, com papel.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` ON DELETE CASCADE; parte da PK |
| `user_id` | `uuid` | NOT NULL | — | FK `users.id` ON DELETE CASCADE; parte da PK |
| `role` | `workspace_role` | NOT NULL | `'member'` | Enum §3.1 |
| `joined_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`workspace_id`, `user_id`).

**Índices:** PK index cobre ambos os accessos.

**Triggers:** —

**RLS:** ❌ (a aplicação verifica se o usuário pode ler/escrever esta linha).

**Regras de negócio:**
- ⚠️ Um workspace **sempre** deve ter pelo menos um `admin`. Backend valida.
- Remoção é DELETE físico (não soft delete) — histórico fica em `entity_events`.

**Eventos gerados:** `workspace_member.added`, `workspace_member.role_changed`, `workspace_member.removed`.

**Relacionamentos:**
- → `workspaces` (CASCADE).
- → `users` (CASCADE).

---

### `product_members` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** product · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Define a participação de um usuário em um produto, com papel funcional (PM, UX, PD, etc.).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` ON DELETE CASCADE; parte da PK |
| `user_id` | `uuid` | NOT NULL | — | FK `users.id` ON DELETE CASCADE; parte da PK |
| `role` | `product_role` | NOT NULL | — | Enum §3.2 |
| `joined_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`product_id`, `user_id`).

**Índices:** PK index.

**Triggers:** —

**RLS:** ❌

**Regras de negócio:**
- ⚠️ Um usuário só pode ser `pm_owner_id` de um produto se tiver `product_members.role = 'pm'` no mesmo produto. Mesmo invariante para `director_id`/`director`, `ux_owner_id`/`ux`, `po_owner_id`/`po`. Enforced via trigger `trg_products_validate_ownership` em `products`.
- Um usuário pode ter múltiplos `product_members` (em produtos diferentes), com papéis diferentes.

**Eventos gerados:** `product_member.added`, `product_member.role_changed`, `product_member.removed`.

**Relacionamentos:**
- → `products` (CASCADE).
- → `users` (CASCADE).

---

### `squads` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Unidade operacional organizacional. Squads são entidades de primeira classe — podem possuir produtos, dores, hipóteses e itens de roadmap (via `entity_assignments`).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `name` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | Soft delete |

**Constraints:** PK(`id`), FK `workspace_id`, FK `created_by`.

**Índices:** —

**Triggers:** `trg_squads_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌

**Regras de negócio:**
- Avatar via `entity_assets` (`entity_type='squad'`, `role='avatar'`).
- Membership em `squad_members`.

**Eventos gerados:** `squad.created`, `squad.updated`, `squad.archived`.

**Relacionamentos:**
- → `workspaces`, `users` (created_by).
- ← `squad_members.squad_id`, `entity_assignments.squad_id`.

---

### `squad_members` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** squad · **Soft delete:** N/A (usa `left_at`) · **RLS:** não · **Status:** existente

**Propósito:** Composição temporal de squads. Permite reconstruir quem estava em qual squad em qualquer momento.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `squad_id` | `uuid` | NOT NULL | — | FK `squads.id` ON DELETE CASCADE; parte da PK |
| `user_id` | `uuid` | NOT NULL | — | FK `users.id` ON DELETE CASCADE; parte da PK |
| `role` | `text` | NULL | — | Texto livre (ex.: `engineering_lead`, `designer`). Não usar enum. |
| `joined_at` | `timestamptz` | NOT NULL | `now()` | Parte da PK |
| `left_at` | `timestamptz` | NULL | — | NULL = membro ativo |

**Constraints:** PK(`squad_id`, `user_id`, `joined_at`).

**Índices:** PK index.

**Triggers:** —

**RLS:** ❌

**Regras de negócio:**
- ⚠️ **Append-only.** Para registrar saída, faz `UPDATE ... SET left_at = now()`.
- Reentrada gera novo registro com novo `joined_at`.
- `WHERE left_at IS NULL` para membros ativos.

**Eventos gerados:** `squad_member.joined`, `squad_member.left`.

**Relacionamentos:**
- → `squads` (CASCADE).
- → `users` (CASCADE).

---
