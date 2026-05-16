---
title: 04 — Product Core & Personas
doc_id: 04-product-core
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md", "01-conventions.md", "02-enums.md", "03-identity.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 2100
last_updated: 2026-05-14
---

# 04 — Product Core & Personas (§4.2 + §4.3)

> Catálogo de produtos digitais (`products`), pilares estratégicos do workspace (`strategic_pillars`) e o sistema de personas. Personas são globais ao workspace e ligam-se a produtos, dores e insights via tabelas de junção dedicadas.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)
- [`01-conventions.md`](./01-conventions.md)
- [`02-enums.md`](./02-enums.md)
- [`03-identity.md`](./03-identity.md)

## Entidades nesta documentação

- 📦 `products`
- 📦 `strategic_pillars`
- 📦 `personas`
- 🔗 `product_personas`
- 🔗 `pain_personas`
- 🔗 `insight_personas`

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 4.2 Product Core

### `products` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** sim 🔒 · **Status:** existente

**Propósito:** Produto digital gerenciado na plataforma. Tem liderança explícita (director, PM, UX, PO) e estágio de ciclo de vida.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `name` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `vision` | `text` | NULL | — | Visão de longo prazo |
| `strategic_goal` | `text` | NULL | — | Objetivo estratégico atual |
| `north_star_metric` | `text` | NULL | — | Referência textual; métrica completa em `product_metrics` (type=north_star) |
| `lifecycle_stage` | `lifecycle_stage` | NULL | `'development'` | Enum §3.4 |
| `lifecycle_updated_at` | `timestamptz` | NULL | — | Atualizado quando `lifecycle_stage` muda |
| `director_id` | `uuid` | NULL | — | FK `users.id`. Denormaliza owner primário (role=director) |
| `pm_owner_id` | `uuid` | NULL | — | FK `users.id`. Owner PM ativo |
| `ux_owner_id` | `uuid` | NULL | — | FK `users.id`. Owner UX ativo |
| `po_owner_id` | `uuid` | NULL | — | FK `users.id`. Owner PO ativo |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FKs.

**Índices:**
- `idx_products_workspace` (`workspace_id`)

**Triggers:**
- `trg_products_updated_at` BEFORE UPDATE → `set_updated_at()`
- `trg_products_validate_ownership` CONSTRAINT TRIGGER AFTER INSERT OR UPDATE DEFERRABLE INITIALLY DEFERRED → `validate_product_ownership_roles()` — valida que cada `*_owner_id` seja membro de `product_members` com role compatível.

**RLS Policy:** `products_workspace_isolation` USING `workspace_id = current_workspace_id()`.

**Regras de negócio:**
- ⚠️ Owner setado em coluna **deve** ter role compatível em `product_members` (enforced).
- Mudança de `lifecycle_stage` **deve** atualizar `lifecycle_updated_at` e gerar `entity_event` tipo `product.lifecycle_changed`.
- Mudança de ownership **deve** gerar `entity_event` e criar/encerrar registro em `entity_assignments`.
- Logo/banner via `entity_assets`.

**Eventos gerados:** `product.created`, `product.lifecycle_changed`, `product.ownership_changed`, `product.archived`, `product.restored`.

**Relacionamentos:**
- → `workspaces`, `users` (4 owners).
- ← `strategic_pillars`, `roadmap_items`, `pains`, `hypotheses`, `evidences`, `insights`, `objectives`, `product_metrics`, `product_personas`, `product_members`, `releases`.

---

### `strategic_pillars` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente (com 🆕)

**Propósito:** Frentes estratégicas do produto. Servem como eixo de categorização para roadmap, OKRs e analytics de portfólio.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` |
| `name` | `text` | NOT NULL | — | |
| `description` | `text` | NULL | — | |
| `color` | `text` | NULL | — | Hex `#RRGGBB` para UI |
| `position` | `int4` | NULL | `0` | Ordenação manual |
| `priority` | `int4` | NULL | — | 🆕 1=alta, 5=baixa (escala 1-5) |
| `status` | `pillar_status` | NULL | `'planned'` | 🆕 Enum §3.3 |
| `owner_id` | `uuid` | NULL | — | 🆕 FK `users.id`. Owner do pilar |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:**
- PK, FKs (`workspace_id`, `product_id`, `owner_id` 🆕).
- CHECK `priority BETWEEN 1 AND 5` 🆕

**Índices:**
- `idx_strategic_pillars_product` (`product_id`) 🆕 (não existe atualmente)
- `idx_strategic_pillars_owner` (`owner_id`) 🆕

**Triggers:** `trg_strategic_pillars_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌ (herda escopo de `products` via FK).

**Regras de negócio:**
- Mudança de status gera `entity_event` tipo `strategic_pillar.status_changed`.
- Pillar pode agrupar `roadmap_items` (FK `roadmap_items.pillar_id`) e `objectives` (FK `objectives.pillar_id` 🆕).

**Eventos gerados:** `strategic_pillar.created`, `strategic_pillar.status_changed`, `strategic_pillar.archived`.

**Relacionamentos:**
- → `workspaces`, `products`, `users` (owner_id 🆕).
- ← `roadmap_items.pillar_id`, `objectives.pillar_id` 🆕.

---

## 4.3 Personas

### `personas` 📦
> 📦 **Entidade de Domínio** · **Escopo:** workspace · **Soft delete:** sim · **RLS:** não · **Status:** existente

**Propósito:** Arquétipos de clientes/usuários. Compartilhados pelo workspace; vinculados a produtos via `product_personas`.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `id` | `uuid` | NOT NULL | `gen_random_uuid()` | PK |
| `workspace_id` | `uuid` | NOT NULL | — | FK `workspaces.id` |
| `name` | `text` | NOT NULL | — | |
| `segment` | `text` | NULL | — | Segmento (ex.: "SMB", "Enterprise") |
| `archetype` | `text` | NULL | — | Arquétipo narrativo (ex.: "explorer", "pragmatist") |
| `jobs_to_be_done` | `text` | NULL | — | JTBD principal |
| `frustrations` | `text` | NULL | — | Dores recorrentes |
| `goals` | `text` | NULL | — | Objetivos |
| `behaviors` | `text` | NULL | — | Comportamentos observados |
| `needs` | `text` | NULL | — | 🆕 Necessidades (conceitual diferencia de goals) |
| `demographics` | `jsonb` | NULL | `'{}'` | Estrutura livre (idade, geo, cargo, etc.) |
| `created_at` | `timestamptz` | NULL | `now()` | |
| `updated_at` | `timestamptz` | NULL | `now()` | |
| `deleted_at` | `timestamptz` | NULL | — | |

**Constraints:** PK, FK `workspace_id`.

**Índices:**
- `idx_personas_workspace` (`workspace_id`) 🆕

**Triggers:** `trg_personas_updated_at` BEFORE UPDATE → `set_updated_at()`.

**RLS:** ❌

**Regras de negócio:**
- Avatar via `entity_assets` (`entity_type='persona'`, `role='avatar'`).
- Persona não tem `product_id` direto — vinculada via `product_personas` (N:N).

**Eventos gerados:** `persona.created`, `persona.updated`, `persona.archived`.

**Relacionamentos:**
- → `workspaces`.
- ← `product_personas`, `pain_personas`, `insight_personas`.

---

### `product_personas` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** product · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Vincula personas a produtos (N:N).

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `product_id` | `uuid` | NOT NULL | — | FK `products.id` ON DELETE CASCADE; parte da PK |
| `persona_id` | `uuid` | NOT NULL | — | FK `personas.id` ON DELETE CASCADE; parte da PK |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`product_id`, `persona_id`).

**Índices:** PK index.

**Triggers:** —

**RLS:** ❌

**Regras de negócio:** Junção pura. DELETE físico permitido (não há histórico relevante).

**Eventos gerados:** —

---

### `pain_personas` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Vincula dores a personas afetadas.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `pain_id` | `uuid` | NOT NULL | — | FK `pains.id` ON DELETE CASCADE; parte da PK |
| `persona_id` | `uuid` | NOT NULL | — | FK `personas.id` ON DELETE CASCADE; parte da PK |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`pain_id`, `persona_id`).

**Triggers:** —

**Regras de negócio:** Suporta queries de "quais dores afetam persona X" e priorização ponderada por segmento.

---

### `insight_personas` 🔗
> 🔗 **Entidade de Junção** · **Escopo:** workspace · **Soft delete:** não · **RLS:** não · **Status:** existente

**Propósito:** Vincula insights a personas. Substitui a antiga coluna `insights.persona_id` (1:N), agora N:N.

**Colunas:**

| Coluna | Tipo | Null | Default | Notas |
|---|---|---|---|---|
| `insight_id` | `uuid` | NOT NULL | — | FK `insights.id` ON DELETE CASCADE; parte da PK |
| `persona_id` | `uuid` | NOT NULL | — | FK `personas.id` ON DELETE CASCADE; parte da PK |
| `created_at` | `timestamptz` | NULL | `now()` | |

**Constraints:** PK(`insight_id`, `persona_id`).

**Regras de negócio:** Um insight pode afetar múltiplas personas (PRD §1.3).

---
