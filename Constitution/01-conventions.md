---
title: 01 — Convenções, Princípios e Taxonomia
doc_id: 01-conventions
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
depends_on: ["00-INDEX.md"]
audience: [llm, backend_engineer, data_engineer]
db_engine: postgresql_16
language: pt-BR
tokens_estimate: 2500
last_updated: 2026-05-14
---

# 01 — Convenções, Princípios e Taxonomia

> Este arquivo concentra os princípios arquiteturais, convenções gerais (naming, RLS, auditoria, entity_type, scoring, taxonomia de entidades) e instruções de uso da PRD. **É pré-requisito para todos os outros arquivos** — qualquer tarefa precisa começar aqui.

## Pré-requisitos de leitura

Os arquivos abaixo devem ser carregados ANTES deste para que o contexto esteja completo (convenções, enums, taxonomia):

- [`00-INDEX.md`](./00-INDEX.md)

## Cross-reference (PRD monolítica → arquivos)

Caso encontre referências a "§X.Y" no texto abaixo, o mapa completo está em [`00-INDEX.md`](./00-INDEX.md) (seção "Mapa de arquivos"). Resumo: §0–§3 → [`01-conventions.md`](./01-conventions.md) + [`02-enums.md`](./02-enums.md). §4.x → arquivo do domínio. §5–§8 → [`11-infrastructure.md`](./11-infrastructure.md). §9–§10 → [`12-backend-ops.md`](./12-backend-ops.md). §11–§12 → [`13-appendices.md`](./13-appendices.md).

---

## 0. Como usar este documento (instruções para LLMs)

Este documento descreve o **estado-alvo completo** do banco de dados. Use-o para:

1. **Auditar** um schema atual contra o alvo (gerar diff).
2. **Gerar migrations idempotentes** (`ALTER` / `CREATE` / `DROP`) para alinhar o schema ao alvo.
3. **Implementar regras de negócio** na camada de aplicação (backend).
4. **Validar conformidade** de PRs que mexem no schema.

### Convenções de leitura

- Toda tabela tem o cabeçalho padronizado: `Escopo · Soft delete · RLS · Status`.
- Cada tabela tem as seções fixas, **sempre na mesma ordem**: Propósito → Colunas → Constraints → Índices → Triggers → RLS Policy → Regras de negócio → Eventos gerados → Relacionamentos.
- 🆕 em uma coluna ou tabela significa **"alvo, ainda não existe no schema atual"** — a IA deve gerar `ALTER` / `CREATE` para isso.
- ✅ em uma coluna significa **"presente no schema atual"** (apenas usado em casos ambíguos; ausência de 🆕 implica ✅).
- 🔒 indica RLS habilitada.
- ⚠️ indica regra ou invariante crítico.
- **Soft delete** = NUNCA `DELETE`; usar `UPDATE ... SET deleted_at = now()`. Listagens filtram `deleted_at IS NULL` por padrão.
- **Imutável** = NUNCA `UPDATE` em produção; criar novo registro com novo `id`.
- Tipos PostgreSQL: `uuid`, `text`, `citext`, `timestamptz`, `int4`, `int8`, `numeric`, `bool`, `jsonb`, `tsvector`, `ltree`. Não usar `varchar(n)` nem `serial`.
- Toda PK é `uuid` com default `gen_random_uuid()`.
- Toda FK é simples (uma coluna referenciando outra). Não usar FKs compostas.

### Como gerar migrations a partir deste documento

1. Para cada item marcado 🆕, gere um `ALTER TABLE ... ADD COLUMN IF NOT EXISTS` ou `CREATE TABLE IF NOT EXISTS`.
2. Para cada `enum` no §3, gere `CREATE TYPE IF NOT EXISTS` (PostgreSQL não suporta nativamente — use `DO $$ BEGIN CREATE TYPE ...; EXCEPTION WHEN duplicate_object THEN null; END $$;`).
3. Para cada índice listado em "Índices", gere `CREATE INDEX IF NOT EXISTS`.
4. Para cada trigger listado, gere `DROP TRIGGER IF EXISTS ...` seguido de `CREATE TRIGGER`.
5. Encapsular tudo em `BEGIN; ... COMMIT;`.
6. NUNCA usar `DROP TABLE`, `DROP COLUMN`, `TRUNCATE` sem confirmação humana explícita.

---

## 1. Princípios Arquiteturais

### 1.1 Identidade da plataforma

A plataforma é um **Product Operating System** focado em:

- Product Discovery (evidências → insights → dores → hipóteses → experimentos)
- Product Strategy (OKRs, métricas, pilares estratégicos)
- Product Planning (roadmap, features, PRDs, outcomes, releases)
- Engineering Handoff (Jira, Azure DevOps)
- Product Intelligence (knowledge graph, embeddings, decision logs)

**NÃO é:** ferramenta de execução técnica (sprints, code review, CI/CD). O ciclo termina no **handoff para engenharia**.

### 1.2 Multi-tenant por workspace

- Todo dado de domínio pertence a um `workspace_id`.
- Isolamento via PostgreSQL Row-Level Security (RLS).
- Função `current_workspace_id() RETURNS uuid` deve ser setada por sessão (via `SET LOCAL`) antes de qualquer query.
- Tabelas globais (sem RLS): `users`, `workspaces`, e tabelas de catálogo.

### 1.3 Discovery-first

Fluxo canônico:

```
Evidence → Insight → Pain → Hypothesis → Experiment → Roadmap Item → PRD → Outcome
```

Cada nó pode ter múltiplas origens e múltiplos destinos. As ligações são mantidas em tabelas de junção dedicadas (`pain_hypothesis_links`, `hypothesis_roadmap_links`) e/ou em `entity_links` (grafo semântico genérico).

### 1.4 Event-sourced

- Toda transição estratégica (mudança de status, ownership, prioridade, conclusão) gera um registro em `entity_events`.
- Eventos são **imutáveis**.
- A tabela é particionada por ano sobre `occurred_at`.
- Backend é responsável por emitir eventos; não há triggers automáticos universais (decisão deliberada — eventos precisam de contexto semântico que triggers não têm).

### 1.5 Soft delete universal

- Todas as entidades de domínio têm `deleted_at timestamptz NULL`.
- Tabelas de junção (`*_links`, `*_personas`, `entity_tags`) e tabelas immutables (`metric_history`, `entity_events`) **não** têm soft delete.
- Reconstrução histórica deve permanecer possível.

### 1.6 Polimorfismo controlado

Tabelas polimórficas usam o par `(entity_type text, entity_id uuid)`:

- `entity_assets`, `entity_assignments`, `entity_followers`, `entity_links`, `entity_permissions`, `entity_tags`, `comments`, `decision_logs`, `entity_events`, `entity_embeddings`, `external_references`.

`entity_type` é um **texto canônico** (não enum), pois novas entidades podem ser adicionadas sem migration de tipo. Valores válidos no §2.5.

### 1.7 Ownership separado de membership

- `workspace_members` e `product_members` definem **quem pertence**.
- `entity_assignments` define **quem é responsável por quê**, com histórico temporal.
- Os campos `*_owner_id` em `products`, `pains`, `hypotheses` etc. são **denormalizações** do owner primário ativo em `entity_assignments` — backend deve manter consistência.

### 1.8 Imutabilidade de assignments

- `entity_assignments` é **append-only**.
- Reassignment cria novo registro; unassignment seta `unassigned_at = now()`.
- NUNCA atualizar `user_id`, `squad_id`, `assignment_role` de um registro existente.

---

## 2. Convenções Gerais

### 2.1 Naming

- Tabelas: `snake_case`, plural (`pains`, `roadmap_items`).
- Tabelas de junção: `<a>_<b>_links` ou `<a>_<b>` (ex.: `pain_hypothesis_links`, `product_personas`).
- Colunas: `snake_case`, singular.
- PK: sempre `id uuid`.
- FK: `<entidade_singular>_id` (ex.: `product_id`, `workspace_id`).
- Timestamps: `created_at`, `updated_at`, `deleted_at`, ou nomes específicos (`assigned_at`, `collected_at`, `started_at`, `occurred_at`).
- Booleans: prefixo `is_` ou verbo (`is_primary`, `approved_for_delivery`, `generated_by_ai`).
- Enums: nome do tipo `<contexto>_<conceito>` (ex.: `pain_status`, `hypothesis_status`).

### 2.2 Campos de auditoria

Toda entidade de domínio tem:

| Campo | Tipo | Default | Significado |
|---|---|---|---|
| `created_at` | `timestamptz` | `now()` | Criação |
| `updated_at` | `timestamptz` | `now()` | Última modificação (trigger `set_updated_at`) |
| `deleted_at` | `timestamptz` | `NULL` | Soft delete |
| `created_by` | `uuid` | — | FK `users.id`. Quem criou. |

`updated_by` **não é** padrão — usa-se `entity_events` com `actor_id` para reconstrução de autoria por edição.

### 2.3 Soft delete: regras

- Listagens **devem** filtrar `WHERE deleted_at IS NULL`.
- Detalhes podem mostrar entidades deletadas com banner "deletada em X".
- `DELETE` físico é proibido em produção, exceto:
  - Tabelas de junção (cascateadas via FK).
  - `metric_history` (append-only por design).
  - `entity_events` (gerenciado via retenção de partição).
- Restauração: `UPDATE ... SET deleted_at = NULL`.

### 2.4 RLS (Row-Level Security)

Tabelas com RLS habilitada têm a policy padrão:

```sql
CREATE POLICY <table>_workspace_isolation ON <table>
  AS PERMISSIVE FOR ALL
  USING (workspace_id = current_workspace_id());
```

**Tabelas com RLS obrigatória:** `products`, `evidences`, `insights`, `hypotheses`, `pains`, `roadmap_items`, `media_assets`, `entity_assets`, `entity_permissions`, e qualquer entidade que mantenha PII por workspace.

**Tabelas sem RLS:** `users`, `workspaces` (acesso governado por `workspace_members`).

### 2.5 `entity_type`: valores canônicos

Para qualquer tabela polimórfica, `entity_type` deve ser um destes valores (singular, lowercase, sem hífen):

```
workspace, product, persona, squad, user,
evidence, insight, pain, hypothesis, experiment,
objective, key_result, product_metric,
roadmap_item, prd, outcome, release,
strategic_pillar, decision_log, comment
```

A aplicação deve validar contra esta lista. Banco não impõe via CHECK (custo de manutenção alto).

### 2.6 Scoring polimórfico

Entidades com prioritização (`pains`, `hypotheses`, `roadmap_items`) têm:

- `scoring_method text` — valores válidos: `rice`, `ice`, `wsjf`, `value_effort`, `custom`.
- `scoring_payload jsonb` — estrutura específica do método. Exemplos:
  - RICE: `{"reach": 1000, "impact": 3, "confidence": 0.8, "effort": 5}`
  - ICE: `{"impact": 8, "confidence": 7, "ease": 6}`
  - WSJF: `{"business_value": 8, "time_criticality": 5, "risk_reduction": 3, "job_size": 4}`
  - Value vs Effort: `{"value": 8, "effort": 3}`
- `priority_score numeric` — resultado computado, persistido para ordenação eficiente.

Backend é responsável por recalcular `priority_score` quando `scoring_payload` muda.

### 2.7 Taxonomia de entidades

Toda tabela definida em §4 é uma **entidade**. Para tornar explícito o papel arquitetural de cada uma, este documento classifica cada entidade em um dos **cinco tipos** abaixo. O tipo aparece no heading da entidade (via ícone) e na linha de metadados logo abaixo.

| Ícone | Tipo | Definição | Características | Exemplos |
|---|---|---|---|---|
| 📦 | **Entidade de Domínio** | Conceito de negócio com identidade própria, ciclo de vida e regras próprias. | PK simples `id uuid`, soft delete, `created_at`/`updated_at`, owner; emite eventos próprios. | `users`, `products`, `pains`, `hypotheses`, `objectives`, `roadmap_items`, `prds`, `outcomes` |
| 🔗 | **Entidade de Junção** | Tabela de relacionamento M:N entre **duas** entidades de domínio específicas. | PK composta ou `id` + UNIQUE composto; sem soft delete (FK cascade); pode carregar atributos próprios do vínculo. | `product_personas`, `pain_personas`, `pain_hypothesis_links`, `hypothesis_roadmap_links`, `workspace_members`, `squad_members` |
| 🌐 | **Entidade Polimórfica** | Comportamento aplicado a **múltiplas** entidades de domínio via o par `(entity_type, entity_id)`. | Não tem FK direta às entidades de origem (custo de polimorfismo); RLS por `workspace_id`; validação de `entity_type` na aplicação. | `entity_assignments`, `comments`, `entity_followers`, `entity_links`, `entity_permissions`, `entity_assets`, `entity_embeddings`, `decision_logs`, `external_references` |
| 📜 | **Entidade Imutável** | Append-only por design: nunca `UPDATE` nem `DELETE` (exceto retenção operacional). | Sem `updated_at`, sem `deleted_at`; só `created_at`/`occurred_at`. Reconstrução histórica é caso de uso primário. | `metric_history` |
| 🏷️ | **Entidade de Catálogo** | Dados de referência reutilizáveis dentro de um workspace, sem ciclo de vida transacional. | Escopo workspace, UNIQUE em campos de identidade (nome/slug); referenciada por entidades polimórficas. | `tags`, `media_assets` |

**Combinações:** uma entidade pode acumular dois ícones quando se aplica mais de uma classificação. O caso canônico é `entity_events` (📜🌐 — polimórfica **e** imutável).

**Regras práticas:**
- 📦 **Domínio** → CRUD completo no backend, com permissões granulares e soft delete.
- 🔗 **Junção** → operações são apenas `INSERT` e `DELETE` (hard); raramente `UPDATE` (só se há atributos no vínculo).
- 🌐 **Polimórfica** → backend precisa validar `entity_type` contra a lista canônica de §2.5 antes de qualquer `INSERT`.
- 📜 **Imutável** → tentativas de `UPDATE` ou `DELETE` devem ser bloqueadas por trigger (`raise exception`) ou via convenção forte no DAL.
- 🏷️ **Catálogo** → exposto em endpoints de lookup/autocomplete; mudanças são raras e auditáveis.

---
