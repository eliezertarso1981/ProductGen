---
title: PRD Canônica v2 — ÍNDICE MESTRE
doc_id: 00-INDEX
parent: PRD Canônica v2 — Plataforma de Inteligência de Produto
audience: [llm, backend_engineer, data_engineer, product_manager]
db_engine: postgresql_16
language: pt-BR
last_updated: 2026-05-14
---

# PRD Canônica v2 — Índice Mestre

> Documento de navegação. Carregue este arquivo primeiro em qualquer tarefa que envolva o PRD. Ele direciona para os arquivos específicos.

## Por que esta PRD foi quebrada em 14 arquivos?

A versão monolítica tem ~25k tokens. Carregar tudo a cada tarefa:
1. Dilui o contexto da LLM com regras irrelevantes para a tarefa atual
2. Aumenta probabilidade de alucinação por "lost in the middle"
3. Confunde edição (regras parecidas em múltiplas entidades viram fonte de erro)

Cada arquivo cobre **um contexto coerente** e tem ~1–4k tokens. Carregue apenas o que precisar.

## Como usar (instrução para LLMs)

1. **Sempre** carregar `00-INDEX.md` + `01-conventions.md` + `02-enums.md`. São pré-requisitos universais (~6.2k tokens combinados).
2. Carregar os arquivos de **domínio** que tocam a tarefa (vide receitas abaixo).
3. Se a tarefa envolve infra (RLS, views, partições, triggers), carregar `11-infrastructure.md`.
4. Se for implementação de backend, adicionar `12-backend-ops.md`.
5. Para migrations novas, carregar `13-appendices.md` (vê o que já foi aplicado e o que ainda falta).

## Mapa de arquivos

| Arquivo | Domínio | Tokens | Quando carregar |
|---|---|---:|---|
| `00-INDEX.md` | Índice mestre | ~2,050 | **SEMPRE** (este arquivo) |
| `01-conventions.md` | §0+§1+§2 Princípios, convenções, taxonomia | ~3,100 | **SEMPRE** |
| `02-enums.md` | §3 Catálogo de 23 enums | ~1,050 | **SEMPRE** |
| `03-identity.md` | §4.1 users, workspaces, members, squads | ~2,650 | Tarefa toca autenticação, multi-tenancy, ownership de produtos |
| `04-product-core.md` | §4.2+§4.3 products, pillars, personas | ~2,500 | Tarefa toca catálogo de produtos, personas, pilares estratégicos |
| `05-discovery.md` | §4.4 evidences, insights, pains, hypotheses, experiments | ~4,150 | Tarefa toca discovery layer (ciclo evidence→experiment) |
| `06-strategy.md` | §4.5 objectives, key_results, product_metrics, metric_history | ~2,200 | Tarefa toca OKRs, KPIs, north-star metrics |
| `07-delivery.md` | §4.6 roadmap_items, prds, outcomes, releases, engineering_handoffs | ~4,150 | Tarefa toca planning layer (roadmap, PRDs, handoff Jira/ADO) |
| `08-ownership-collab.md` | §4.7+§4.8 entity_assignments, comments, tags, followers | ~2,050 | Tarefa toca ownership polimórfico ou colaboração (comments, tags) |
| `09-assets-semantic.md` | §4.9+§4.10 media_assets, entity_assets, entity_links, entity_embeddings | ~2,200 | Tarefa toca uploads de mídia, grafo semântico, RAG, embeddings |
| `10-governance-events.md` | §4.11+§4.12 decision_logs, entity_permissions, entity_events | ~1,900 | Tarefa toca governança (audit log), permissões granulares ou eventos |
| `11-infrastructure.md` | §5+§6+§7+§8 Views, funções, RLS, particionamento | ~1,450 | Tarefa toca infra de banco (não regra de negócio) |
| `12-backend-ops.md` | §9+§10 Convenções backend + glossário | ~1,150 | Tarefa é implementar endpoint, helper, transaction wrapper |
| `13-appendices.md` | §11+§12 Anexos: estado pós-mig001, itens 🆕 pendentes | ~1,200 | Auditoria de schema, planning de próxima migration |

## Mapa de entidades (43 total)

Use esta tabela para descobrir em qual arquivo está cada entidade. Cada ícone (📦 🔗 🌐 📜 🏷️) representa o tipo da entidade — vide [`01-conventions.md`](./01-conventions.md) §2.7.

### Identity & Access — `03-identity.md`
- 📦 `users` — usuários humanos (global, sem RLS)
- 📦 `workspaces` — contêiner organizacional top-level
- 🔗 `workspace_members` — membership user ↔ workspace
- 🔗 `product_members` — membership user ↔ product
- 📦 `squads` — times de produto
- 🔗 `squad_members` — membership user ↔ squad

### Product Core & Personas — `04-product-core.md`
- 📦 `products` — produtos digitais
- 📦 `strategic_pillars` — pilares estratégicos (north stars por workspace)
- 📦 `personas` — perfis de usuário
- 🔗 `product_personas` — junção produto ↔ persona
- 🔗 `pain_personas` — quem sente a dor
- 🔗 `insight_personas` — quem expressou o insight

### Discovery Layer — `05-discovery.md`
- 📦 `evidences` — fato observado (entrevista, ticket, NPS…)
- 📦 `insights` — padrão interpretado a partir de evidências
- 📦 `pains` — problema priorizável (canônico ou standard)
- 🔗 `pain_relationships` — relações pai/filho, merge, split, similar
- 📦 `hypotheses` — "se… então… porque…"
- 📦 `experiments` — teste controlado para validar/refutar hipótese
- 🔗 `pain_hypothesis_links` — junção dor ↔ hipótese

### Strategy Layer — `06-strategy.md`
- 📦 `objectives` — Objetivos (OKR-style)
- 📦 `key_results` — Key Results mensuráveis
- 📦 `product_metrics` — KPIs e north-star metrics
- 📜 `metric_history` — histórico append-only de valores de métrica

### Delivery Layer — `07-delivery.md`
- 📦 `roadmap_items` — initiative / epic / feature (hierarquia LTREE)
- 🔗 `hypothesis_roadmap_links` — junção hipótese ↔ roadmap_item
- 🔗 `roadmap_key_result_links` — junção roadmap_item ↔ KR (linhagem estratégica)
- 📦 `prds` — Product Requirements Documents (versionados)
- 📦 `outcomes` — resultados mensuráveis pós-release
- 📦 `releases` — release vehicles (versão, data, escopo)
- 📦 `engineering_handoffs` — handoff para Jira/ADO
- 🌐 `external_references` — IDs externos (Jira ticket, Linear issue, etc.)

### Ownership & Collaboration — `08-ownership-collab.md`
- 🌐 `entity_assignments` — quem é responsável por qual entidade (append-only)
- 🌐 `comments` — comentários polimórficos
- 🌐 `entity_followers` — quem segue uma entidade (notificações)
- 🏷️ `tags` — catálogo de tags do workspace
- 🌐 `entity_tags` — tags aplicadas a entidades

### Assets & Semantic Graph — `09-assets-semantic.md`
- 🏷️ `media_assets` — catálogo de arquivos (S3/URL)
- 🌐 `entity_assets` — uso de mídia em entidades (avatar, anexo, etc.)
- 🌐 `entity_links` — grafo semântico genérico entre entidades
- 🌐 `entity_embeddings` — vetores de similaridade para RAG

### Governance & Events — `10-governance-events.md`
- 🌐 `decision_logs` — log polimórfico de decisões estratégicas
- 🌐 `entity_permissions` — permissões granulares por entidade
- 📜🌐 `entity_events` — eventos imutáveis (event sourcing, particionado)

## Receitas: "para fazer X, carregue Y"

### Implementar CRUD de entidade
| Entidade | Arquivos a carregar |
|---|---|
| `pains` | `00`, `01`, `02`, `05` (discovery), `03` (users), `08` (ownership), `12` (backend ops) |
| `hypotheses` | `00`, `01`, `02`, `05` (discovery), `03`, `08`, `12` |
| `roadmap_items` | `00`, `01`, `02`, `07` (delivery), `06` (KR links), `03`, `08`, `12` |
| `prds` | `00`, `01`, `02`, `07`, `09` (media), `08`, `12` |
| `personas` | `00`, `01`, `02`, `04` (product-core), `09` (avatares), `12` |

### Tarefas de infra
| Tarefa | Arquivos |
|---|---|
| Adicionar RLS a uma tabela | `00`, `01`, `11` (infra), arquivo do domínio da tabela |
| Criar nova view de agregação | `00`, `01`, `11`, arquivos das entidades agregadas |
| Particionar nova tabela | `00`, `01`, `11` |
| Migration nova | `00`, `01`, `13` (apêndices), arquivo do domínio afetado |

### Auditoria
| Tarefa | Arquivos |
|---|---|
| Auditar schema atual vs PRD | TODOS (mesmo orçamento da PRD monolítica) |
| Verificar conformidade de PR | `00`, `01`, `02`, arquivo do domínio do PR |

## Convenções entre arquivos

1. **Cross-references**: cada arquivo tem no topo um mapa "§X.Y → arquivo" para o caso de você encontrar referências internas no texto.
2. **Frontmatter**: todo arquivo tem YAML frontmatter com `doc_id`, `depends_on` (pré-requisitos) e `tokens_estimate`.
3. **Idempotência**: arquivos são auto-contidos para seu domínio. Carregar 2× não muda nada (não há side effects).
4. **Atualizações**: quando uma entidade muda, edita-se o arquivo do domínio dela. Se a mudança afeta convenções universais, edita-se `01-conventions.md`. Sempre atualizar `00-INDEX.md` se houver entidade nova/removida.

## Pendências (Anexo B → `13-appendices.md`)

Itens marcados 🆕 ainda não foram aplicados ao schema. Antes de gerar migrations novas, leia o Anexo B para evitar duplicação.
