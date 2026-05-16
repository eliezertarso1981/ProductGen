---
title: 09 — Assets & Semantic Graph
doc_id: 09-assets-semantic
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 1800
last_updated: 2026-05-14
---

# 09 — Assets & Semantic Graph (§4.9 + §4.10)

> Uploads de mídia (`media_assets` é catálogo; `entity_assets` é uso polimórfico — ex.: avatar, anexo de PRD). `entity_links` é um grafo semântico genérico entre entidades (similar_to, derived_from, supersedes). `entity_embeddings` armazena vetores para busca semântica e RAG.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)

## Entidades nesta documentação

- 🏷️ `media_assets`
- 🌐 `entity_assets`
- 🌐 `entity_links`
- 🌐 `entity_embeddings`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.9 Assets

### `media_assets` 🏷️
> 🏷️ **Entidade de Catálogo** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Repositório central de mídia (imagens, vídeos, documentos, AI-generated).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NULL | — | FK |
| `uploaded_by` | `uuid` | NULL | — | FK `users.id` |
| `type` | `text` | NOT NULL | — | `image`, `video`, `document`, `audio`, `ai_generated` |
| `mime_type` | `text` | NOT NULL | — | Ex.: `image/png` |
| `file_name` | `text` | NOT NULL | — | |
| `original_url` | `text` | NOT NULL | — | URL no storage |
| `thumbnail_url` | `text` | NULL | — | |
| `preview_url` | `text` | NULL | — | |
| `storage_provider` | `text` | NULL | — | `s3`, `gcs`, `r2`, etc. |
| `storage_key` | `text` | NOT NULL | — | Path interno no provider |
| `file_size` | `int8` | NULL | — | Bytes |
| `width` | `int4` | NULL | — | Pixels (imagens/vídeos) |
| `height` | `int4` | NULL | — | |
| `duration_seconds` | `int4` | NULL | — | (vídeos/áudios) |
| `checksum` | `text` | NULL | — | SHA-256 |
| `generated_by_ai` | `bool` | NULL | `false` | |
| `generation_prompt` | `text` | NULL | — | (se AI) |
| `generation_model` | `text` | NULL | — | (se AI) |
| `metadata` | `jsonb` | NULL | `'{}'` | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:** `idx_media_assets_workspace`, `idx_media_assets_type`, `idx_media_assets_uploaded_by`, `idx_media_assets_created_at` (DESC), `idx_media_assets_deleted_at`.

**Triggers:** `trg_media_assets_updated_at`.

**RLS Policy:** `media_assets_workspace_isolation`.

**Regras de negócio:**
- Deduplicação opcional via `checksum`.
- Soft delete não remove do storage imediatamente — backend tem job de garbage collection após N dias.
- Assets AI-generated devem ter `generated_by_ai=true` e `generation_prompt`/`generation_model` preenchidos.

**Eventos gerados:** `media_asset.uploaded`, `media_asset.deleted`.

---

### `entity_assets` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Relação polimórfica entre entidades e assets de mídia.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `asset_id` | `uuid` | NOT NULL | — | FK `media_assets.id` ON DELETE CASCADE |
| `role` | `text` | NOT NULL | — | Ver vocabulário abaixo |
| `position` | `int4` | NULL | `0` | Ordenação |
| `is_primary` | `bool` | NULL | `false` | |
| `uploaded_by` | `uuid` | NULL | — | FK `users.id` |
| `metadata` | `jsonb` | NULL | `'{}'` | |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_entity_assets_entity`, `idx_entity_assets_asset`, `idx_entity_assets_role`, `idx_entity_assets_primary`, `idx_entity_assets_workspace`.
- `idx_entity_assets_unique_primary` UNIQUE (`entity_type`, `entity_id`, `role`) WHERE `is_primary = true AND deleted_at IS NULL`.

**RLS Policy:** `entity_assets_workspace_isolation`.

**Vocabulário de `role` por `entity_type`:**

| Entity | Roles válidas |
|---|---|
| `workspace` | `logo` |
| `product` | `logo`, `banner`, `attachment` |
| `user` | `avatar` |
| `persona` | `avatar` |
| `squad` | `avatar` |
| `evidence` | `attachment`, `recording`, `screenshot` |
| `hypothesis` | `prototype`, `wireframe`, `screenshot` |
| `experiment` | `evidence`, `recording` |
| `prd` | `attachment`, `diagram`, `mockup` |
| `roadmap_item` | `flow`, `specification`, `mockup` |

**Regras de negócio:**
- ⚠️ Apenas 1 `is_primary=true` ativo por (entity_type, entity_id, role) — enforced.
- Soft delete preserva histórico; storage do asset gerenciado em `media_assets`.

**Eventos gerados:** `entity_asset.attached`, `entity_asset.detached`, `entity_asset.primary_changed`.

---

## 4.10 Semantic Graph

### `entity_links` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Grafo semântico genérico ligando duas entidades quaisquer com tipo de relação. Base para AI (graph traversal, clustering, lineage).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `source_type` | `text` | NOT NULL | — | §2.5 |
| `source_id` | `uuid` | NOT NULL | — | |
| `target_type` | `text` | NOT NULL | — | |
| `target_id` | `uuid` | NOT NULL | — | |
| `relationship_type` | `relationship_type` | NOT NULL | — | Enum §3.21 |
| `strength` | `numeric` | NULL | — | 0.0-1.0 (peso do link, útil para AI) |
| `metadata` | `jsonb` | NULL | `'{}'` | |
| `created_by` | `uuid` | NULL | — | FK `users.id` |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:** `idx_entity_links_source`, `idx_entity_links_target`.

**Regras de negócio:**
- Relações dirigidas. Para bidirecional, criar dois links (ou usar `related_to` que é semanticamente simétrico).
- ⚠️ Backend valida que `source_type` e `target_type` são compatíveis com `relationship_type`:
  - `evidence → insight` via `generated_from`
  - `insight → pain` via `generated_from`
  - `pain → hypothesis` via `generated_from` (ou usar `pain_hypothesis_links`)
  - `hypothesis → roadmap_item` via `generated_from` (ou `hypothesis_roadmap_links`)
  - `roadmap_item → outcome` via `measures` / `impacts`
- Links exclusivos (junções dedicadas) **devem** continuar usando suas tabelas; `entity_links` é para relações ad-hoc.

**Eventos gerados:** `entity_link.created`, `entity_link.removed`.

---

### `entity_embeddings` 🌐
> 🌐 **Entidade Polimórfica** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Embeddings vetoriais de entidades para semantic search, deduplicação, recomendação.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK |
| `entity_type` | `text` | NOT NULL | — | §2.5 |
| `entity_id` | `uuid` | NOT NULL | — | |
| `embedding` | `jsonb` | NULL | — | Array de floats. Futuro: `vector(N)` via pgvector |
| `embedding_model` | `text` | NULL | — | Ex.: `text-embedding-3-small` |
| `generated_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK, UNIQUE(`entity_type`, `entity_id`), FK.

**Índices:**
- `idx_entity_embeddings_workspace` (`workspace_id`) 🆕

**Regras de negócio:**
- Re-embedding cria novo registro? Decisão atual: UNIQUE(entity_type, entity_id) → `INSERT ... ON CONFLICT DO UPDATE` substitui.
- 🆕 **Migration futura:** trocar `jsonb` por `vector(N)` (pgvector) + índice HNSW. Backend deve abstrair.

**Eventos gerados:** — (regeneração silenciosa).

---
