---
title: 08 — Ownership & Collaboration
doc_id: 08-ownership-collab
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 1700
last_updated: 2026-05-14
---

# 08 — Ownership & Collaboration (§4.7 + §4.8)

> Mecanismos transversais. `entity_assignments` é a fonte de verdade para ownership (append-only, polimórfico via `entity_type`/`entity_id`); colunas `*_owner_id` nas tabelas de domínio são denormalizações. Tags e comentários funcionam em qualquer entidade. Followers controlam notificações.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)

## Entidades nesta documentação

- 🌐 `entity_assignments`
- 🌐 `comments`
- 🌐 `entity_followers`
- 🏷️ `tags`
- 🌐 `entity_tags`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.7 Ownership

### `entity_assignments` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** N/A (usa `unassigned_at`) · **RLS:** não · **Status:** existente

**Propósito:** Modelo central de responsabilidade. Substitui `owner_id` simplista por histórico temporal completo. Suporta múltiplos owners, atribuição a squads, e auditoria.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `user_id` | `uuid` | NULL | — | FK `users.id`. NULL se atribuído a squad |
| `squad_id` | `uuid` | NULL | — | FK `squads.id`. NULL se atribuído a user |
| `assignment_role` | `text` | NOT NULL | — | Ex.: `pm_owner`, `researcher`, `validator`, `ux_researcher`, `responsible_squad` |
| `assigned_by` | `uuid` | NULL | — | FK `users.id` |
| `assigned_at` | `timestamptz` | NULL | `now()` | |
| `unassigned_at` | `timestamptz` | NULL | — | NULL = ativo |
| `is_primary` | `bool` | NULL | `false` | Apenas 1 primary ativo por (entity, role) |
| `metadata` | `jsonb` | NULL | `'{}'` | Contexto extra |

**Constraints:**
- PK, FKs.
- `entity_assignments_user_or_squad_check` CHECK (`user_id IS NOT NULL OR squad_id IS NOT NULL`) — assignment não pode ser órfão.

**Índices:**
- `idx_entity_assignments_entity` (`entity_type`, `entity_id`)
- `idx_entity_assignments_squad` (`squad_id`)
- `idx_entity_assignments_user` (`user_id`)
- `idx_entity_assignments_unique_primary` UNIQUE (`entity_type`, `entity_id`, `assignment_role`) WHERE `is_primary = true AND unassigned_at IS NULL`

**Triggers:** —

**RLS:** ❌ (a aplicação valida acesso via membership).

**Regras de negócio:**
- ⚠️ **Append-only.** NUNCA `UPDATE` em `user_id`, `squad_id`, `assignment_role`, `is_primary` de um registro existente. Reassignment = novo registro + close do anterior (`unassigned_at = now()`).
- ⚠️ Apenas 1 `is_primary=true` ativo por (entity_type, entity_id, assignment_role) — enforced pelo unique partial index.
- ⚠️ Toda mudança gera `entity_event` (`*.ownership_changed`).
- Para entidades com colunas denormalizadas de owner (`products.pm_owner_id`, `pains.owner_id`, etc.), backend mantém **espelho** do primary ativo.

**`assignment_role` por entidade (vocabulário recomendado):**

| Entity | Roles válidos |
|---|---|
| `product` | `director`, `pm_owner`, `ux_owner`, `po_owner`, `responsible_squad` |
| `pain` | `primary_owner`, `researcher`, `responsible_squad` |
| `hypothesis` | `owner`, `validator`, `ux_researcher` |
| `experiment` | `owner` |
| `roadmap_item` | `pm`, `tech_lead`, `designer`, `responsible_squad` |
| `objective` | `owner`, `sponsor` |
| `key_result` | `owner` |

**Eventos gerados:** Não dispara — é a *fonte* dos eventos `ownership_changed` (backend escreve em ambos).

---

## 4.8 Collaboration

### `comments` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Comentários polimórficos em qualquer entidade. Suporta threads (parent_comment_id) e visibilidade.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `parent_comment_id` | `uuid` | NULL | — | FK `comments.id`. NULL = thread root |
| `content` | `text` | NOT NULL | — | Markdown |
| `visibility` | `visibility_level` | NULL | `'public'` | Enum §3.22 |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:** `idx_comments_entity` (`entity_type`, `entity_id`).

**Triggers:** —

**RLS:** ❌ (a aplicação filtra; visibilidade `private`/`restricted` requer checagem em app).

**Regras de negócio:**
- Mentions: `@user_id` no `content` deve disparar notificação (responsabilidade do backend).
- `visibility='private'`: visível apenas para `created_by`.
- `visibility='restricted'`: visível para `created_by` + usuários em `entity_permissions` para esta entidade.
- Soft delete de comentário NÃO remove thread.

**Eventos gerados:** `comment.created`, `comment.deleted` (para activity feed).

---

### `entity_followers` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Lista de watchers/followers de qualquer entidade. Base para notificações e feeds.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `user_id` | `uuid` | NOT NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, UNIQUE(`entity_type`, `entity_id`, `user_id`), FKs.

**Índices:** `idx_followers_entity`.

**Regras de negócio:**
- Toggle (follow/unfollow) via INSERT/DELETE.
- Backend adiciona automaticamente como follower: `created_by`, `owner_id`, e quem comenta.

**Eventos gerados:** — (mudanças são triviais).

---

### `tags` 🏷️
> 🏷️ **Entidade de Catálogo** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Catálogo de tags do workspace.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `name` | `text` | NOT NULL | — | UNIQUE por workspace |
| `color` | `text` | NULL | — | Hex |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, UNIQUE(`workspace_id`, `name`), FK.

---

### `entity_tags` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Junção polimórfica de tags a entidades.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `entity_type` | `text` | NOT NULL | — | §2.5; parte da PK |
| `entity_id` | `uuid` | NOT NULL | — | Parte da PK |
| `tag_id` | `uuid` | NOT NULL | — | FK `tags.id` ON DELETE CASCADE; parte da PK |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`entity_type`, `entity_id`, `tag_id`).

**Índices:**
- `idx_entity_tags_tag` (`tag_id`) 🆕 (para query "quais entidades têm a tag X")

---
