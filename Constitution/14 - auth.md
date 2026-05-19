# ProductGen — Regras de Autenticação e Relacionamento

> Documento de referência das regras de identidade, autenticação, autorização e relacionamento entre usuários, workspaces e produtos. Cliente-alvo: **times de produto dentro de empresas grandes**.

---

## Camada 1 — Modelo conceitual

### User (pessoa global)

- **Identidade única no sistema**, não pertence a workspace
- Atributos principais: `id`, `email` (único globalmente), `name`, `password_hash`, `email_verified_at`, `avatar_url`, `last_login_at`, `created_at`
- Uma pessoa = uma `users` row, mesmo que participe de N workspaces
- Email é a chave universal de identidade
- User é deletável (soft delete + hard delete em 30 dias)

### Workspace (tenant, organização)

- Container de tudo. Cliente paga aqui (assinatura)
- Atributos principais: `id`, `slug` (único, ex: `acme-corp`), `name`, `created_by_user_id`, `plan`, `created_at`
- Não existe sem ao menos um membro (o criador vira `owner` automaticamente)
- Quando deletado soft, fica em "trash" por 30 dias antes do hard delete
- Hard delete cascateia tudo dentro

### Workspace Member (relação User × Workspace)

- Liga um usuário a um workspace com um papel
- Atributos principais: `workspace_id`, `user_id`, `role`, `invited_by_user_id`, `joined_at`, `last_accessed_at`, `onboarded_at`, `removed_at`
- Roles: `owner`, `admin`, `member`, `viewer`, `guest` (detalhes na Camada 4)
- PK composta `(workspace_id, user_id)` — pessoa só tem 1 papel por workspace

### Product (sub-unidade dentro do workspace)

- Cada produto do portfolio do cliente
- Atributos principais: `id`, `workspace_id`, `slug` (único no workspace), `name`, `vision`, `created_at`, `archived_at`
- Sempre pertence a 1 workspace
- Múltiplos produtos por workspace é first-class (cliente-alvo tem portfolio)

### Product Member (relação User × Product)

- Define acesso granular a cada produto
- Atributos principais: `product_id`, `user_id`, `workspace_id`, `role`, `added_by_user_id`, `added_at`
- Roles: `owner`, `editor`, `viewer`, `none` (explicit deny)
- Default quando não há row: derivado do workspace role (algoritmo na Camada 4)

---

## Camada 2 — Autenticação

### Método de login

**Email + senha** é o único método nesta fase. OAuth externo (Google, Microsoft) e SAML SSO ficam pra fase futura, plano Enterprise.

#### Senha

- Hash com **Argon2id** (parâmetros: memory=64MB, iterations=3, parallelism=4)
- Mínimo **12 caracteres**, sem regras de "1 maiúscula 1 número 1 símbolo" (UX ruim, baixa segurança real)
- Validação contra lista de senhas vazadas no signup e troca de senha (HaveIBeenPwned API ou base local)
- Trocar senha **revoga todas as sessões ativas** do user

#### Email

- Único globalmente (case-insensitive — `citext` no Postgres)
- Verificação obrigatória antes de algumas ações:
  - Criar workspace
  - Convidar outros usuários
  - Aceitar invite recebido
- Sem verificação, user pode logar e visualizar conteúdo de workspaces onde já é membro

### Tokens (sessão)

#### Access token (JWT, short-lived)

- **TTL: 15 minutos**
- Algoritmo de assinatura: **RS256** (chave assimétrica, melhor pra distribuir verificação entre serviços)
- Payload (claims):
  - `user_id` (uuid)
  - `email`
  - `iat` (issued at)
  - `exp` (expiration)
  - `session_id` (uuid, referência à sessão no banco)
- **NÃO contém**: `workspace_id`, `role`, `permissions` — esses mudam, não dá pra confiar no token

#### Refresh token (opaque, long-lived)

- **TTL: 30 dias deslizante** (renova a cada uso bem-sucedido)
- Armazenado no banco em tabela de sessões (hash, não plain)
- Pode ser revogado individualmente (logout de 1 device)
- **Rotacionado a cada uso**: revoga o anterior, emite novo
- Detecção de reutilização: se um refresh token já usado for apresentado novamente, revoga TODAS as sessões do user (sinal de comprometimento)

### Onde guardar tokens no frontend

- **httpOnly secure cookies** pra ambos os tokens
- Configuração:
  - `pg_access`: httpOnly, secure, sameSite=lax, expires=15min, path=/
  - `pg_refresh`: httpOnly, secure, sameSite=strict, expires=30d, path=/api/auth/refresh
- **Proibido**: localStorage, sessionStorage (XSS-vulneráveis)
- **Proibido**: Authorization header se frontend e API estão no mesmo domínio
- CORS rigoroso: API só aceita origin do app oficial

### Endpoints de autenticação

```
POST   /api/auth/signup            cria user + workspace + workspace_member (owner)
POST   /api/auth/login             valida senha, emite tokens (cookies)
POST   /api/auth/logout            revoga sessão atual
POST   /api/auth/logout-all        revoga todas sessões do user
POST   /api/auth/refresh           troca refresh por novo access (rotacionando refresh)
POST   /api/auth/forgot-password   envia email com token (1h TTL)
POST   /api/auth/reset-password    consome token, troca senha, revoga todas sessões
POST   /api/auth/verify-email      confirma email com token (24h TTL)
POST   /api/auth/resend-verification reenvia email de verificação (rate-limited)
GET    /api/auth/me                retorna user atual + workspaces que tem acesso
GET    /api/auth/sessions          lista sessões ativas (devices logados)
DELETE /api/auth/sessions/:id      revoga sessão específica
POST   /api/auth/change-password   troca senha (exige senha atual)
POST   /api/auth/change-email      inicia troca de email (envia token pro novo)
POST   /api/auth/confirm-email-change consome token de troca de email
```

### Fluxo de signup

```
1. POST /api/auth/signup
   Body: { email, password, name, workspace_name? }

2. Validações:
   - Email válido e não usado
   - Senha mín 12 chars, não está em lista de vazadas
   - Nome não vazio

3. Cria registros:
   - users (com password_hash Argon2id, email_verified_at = NULL)
   - workspaces (se workspace_name informado, senão criação adiada)
   - workspace_members (user vira owner)
   - workspace_settings (defaults)
   - auth_tokens (purpose=verify_email, 24h TTL)

4. Envia email de verificação

5. Emite access + refresh tokens (user pode usar a app com restrições)

6. Retorna 201 com user + workspace + tokens (via cookies)
```

### Fluxo de login

```
1. POST /api/auth/login
   Body: { email, password }

2. Validações:
   - Email existe (resposta neutra se não — não vazar)
   - Senha confere (verify Argon2id)
   - User não deletado

3. Cria sessão:
   - user_sessions row (refresh_token_hash, user_agent, ip, expires_at = now+30d)

4. Emite access + refresh tokens (via cookies)

5. Atualiza users.last_login_at

6. Retorna 200 com user + lista de workspaces

Rate limit: 5 tentativas por IP por 15 minutos
```

### Fluxo de forgot password

```
1. POST /api/auth/forgot-password
   Body: { email }

2. SEMPRE retorna 200 (não vaza se email existe)

3. Se email existir:
   - Gera token aleatório (32 bytes hex)
   - Salva hash em auth_tokens (purpose=reset_password, 1h TTL, single-use)
   - Envia email com link app.productgen.com/reset-password?token=...

4. Rate limit: 3 por email por hora

5. POST /api/auth/reset-password
   Body: { token, new_password }

6. Validações:
   - Token existe, não usado, não expirado
   - Senha nova passa nas regras

7. Atualiza users.password_hash
8. Marca auth_tokens.used_at
9. REVOGA TODAS as sessões ativas do user (segurança)
10. Envia email de notificação ("sua senha foi trocada")
```

### Fluxo de verificação de email

```
1. Após signup, user recebe email com link
2. Link: app.productgen.com/verify-email?token=...
3. POST /api/auth/verify-email
   Body: { token }
4. Validações:
   - Token existe, não usado, não expirado
   - Pertence ao user logado (ou aceita login automático se já válido)
5. Atualiza users.email_verified_at = now()
6. Marca auth_tokens.used_at
7. Retorna 200
```

### Rate limiting

| Endpoint | Limite |
|---|---|
| `POST /api/auth/login` | 5 tentativas por IP por 15 minutos |
| `POST /api/auth/signup` | 3 por IP por hora |
| `POST /api/auth/forgot-password` | 3 por email por hora |
| `POST /api/auth/resend-verification` | 3 por user por hora |
| `POST /api/auth/refresh` | 60 por user por hora |
| `POST /api/auth/change-password` | 5 por user por hora |
| Demais endpoints autenticados | 1000 req por user por hora (global) |

### 2FA / MFA (futuro, plano Enterprise)

Não implementar na v1. Mas deixar ganchos no schema (campo `mfa_enabled`, tabela de backup codes).

Quando implementar:
- TOTP (Google Authenticator, Authy, 1Password)
- 10 backup codes single-use
- Opt-in por user
- Pode ser **obrigatório por workspace policy** (admin força MFA pra todos)

---

## Camada 3 — Workspace switcher (user em múltiplos workspaces)

### Regras

- **Um user pode pertencer a N workspaces.** Ex: consultora trabalha pra Acme e Beta.
- Token de acesso **não tem workspace_id**. A escolha do workspace ativo é separada.
- API resolve o workspace ativo em ordem de prioridade:
  1. Header HTTP `X-Workspace-Id: <uuid>` (explícito, usado por chamadas programáticas)
  2. Cookie `pg_workspace=<uuid>` (preferência guardada do user no browser)
  3. Default: primeiro workspace onde o user é membro ativo, ordenado por `last_accessed_at` DESC

- Antes de qualquer query, API valida: **user é membro ativo desse workspace?** Se não, retorna 403.
- Depois roda `SET LOCAL app.current_workspace = '<uuid>'` na transação Postgres (RLS aplica).

### Trocar de workspace

- UI: workspace switcher na sidebar (já definido no design)
- Ação: `POST /api/auth/switch-workspace` com body `{ workspace_id }`
- Validações:
  - User é membro ativo desse workspace?
  - Workspace não está em trash?
- Atualiza cookie `pg_workspace`
- Atualiza `workspace_members.last_accessed_at`
- Retorna 200 com:
  - Workspace info (name, plan, settings)
  - Lista de produtos do workspace que o user tem acesso
  - Workspace role do user
- Frontend invalida cache de queries do workspace anterior

### Workspace ativo vs produto ativo

- **Workspace** sempre tem 1 ativo (necessário pra RLS).
- **Produto** pode estar ativo ou em modo agregado:
  - `pg_product=<uuid>` → filtrar tudo por esse produto
  - `pg_product=all` → modo agregado (dashboard mostra dados do workspace inteiro)
- Algumas telas só fazem sentido com produto específico (ex: roadmap, listagem de dores) — forçam seleção
- Outras suportam agregado (ex: dashboard, OKRs corporativos)

---

## Camada 4 — Permissões (RBAC em duas camadas)

> **Como ler esta camada:** define a estrutura macro de papéis (workspace × produto). Cada role é um **preset nomeado de permissions atômicas** — o catálogo completo de permissions, mapping role→permissions, e como API/frontend consomem isso estão na **Camada 4.5**.

### Camada grossa: Workspace roles

| Role | Pode |
|---|---|
| **owner** | Tudo. Deletar workspace, gerenciar billing, transferir ownership, promover/rebaixar admins. **Sempre existe ao menos 1 owner ativo** — não pode rebaixar o último owner |
| **admin** | Gerenciar membros do workspace, criar/arquivar produtos, configurações de workspace (settings, integrações), ver tudo. Não pode deletar workspace nem mexer em billing |
| **member** | Acesso de leitura a todos os produtos por default. Acesso de escrita nos produtos onde for `editor` ou `owner` no `product_members`. Pode criar evidências/dores próprias (relatórios pessoais) |
| **viewer** | Só leitura em tudo. Não cria nada. Útil pra liderança que só consome reports |
| **guest** | Acesso restrito apenas aos produtos onde for explicitamente convidado. **Não vê** a lista de produtos do workspace além daqueles. Útil pra consultor externo, parceiro |

#### Regras invariantes do workspace

- Workspace sempre tem **≥1 owner ativo**
- Owner que quer sair precisa: (a) promover outro a owner antes, ou (b) deletar o workspace
- Apenas owner pode promover outro a owner
- Apenas owner pode rebaixar admin
- Admin pode promover/rebaixar member, viewer, guest
- Admin não pode rebaixar outro admin (só owner)

### Camada fina: Product roles

| Role | Pode |
|---|---|
| **owner** | Tudo no produto: criar/editar/deletar qualquer entidade, gerenciar product_members, arquivar produto. **Cada produto tem ≥1 owner** |
| **editor** | Criar/editar/deletar entidades do produto (evidências, dores, hipóteses, roadmap, etc). Não muda settings nem members |
| **viewer** | Só leitura do produto |
| **none** | **Acesso explicitamente negado**, mesmo se workspace role permitiria. Útil pra excluir alguém de produto sensível |

### Algoritmo de resolução de permissão

Pergunta: "User X pode fazer ação Y no produto P?"

```
1. User é membro ATIVO do workspace de P?
   → Não: DENY
   → Sim: continua

2. User é workspace owner ou admin?
   → Sim: ALLOW (qualquer ação)
   → Não: continua

3. User tem row em product_members(P, user)?
   → Sim:
     - role = 'none'         → DENY
     - role = 'viewer'       → ALLOW se ação é leitura, DENY se é escrita
     - role = 'editor'       → ALLOW leitura e escrita, DENY actions de admin
     - role = 'owner'        → ALLOW tudo no produto
   → Não: continua

4. User é workspace guest?
   → Sim: DENY (guest precisa de product_members explícito)

5. User é workspace viewer?
   → Sim: ALLOW se ação é leitura, DENY se é escrita

6. User é workspace member?
   → ALLOW se ação é leitura, DENY se é escrita (sem row em product_members)

7. Default: DENY
```

#### Operações requerem qual nível

| Operação | Nível requerido |
|---|---|
| Visualizar entidades do produto | read |
| Comentar em entidades | read |
| Criar/editar/deletar entidades (evidências, dores, hipóteses, etc) | write |
| Arquivar/restaurar entidades | write |
| Mudar settings do produto | admin |
| Gerenciar product_members | admin |
| Deletar produto | admin |
| Mudar workspace settings | workspace admin/owner |
| Convidar usuários para o workspace | workspace admin/owner |
| Deletar workspace | workspace owner |

### Implementação esperada

- API expõe um helper `canUserAccessProduct(userId, productId, requiredAccess)` que retorna boolean
- Esse helper é chamado **no início de cada endpoint** antes de qualquer ação
- RLS no Postgres é a segunda camada (defesa em profundidade) — mesmo que API falhe, banco bloqueia
- Permissões nunca são cacheadas com TTL > 60s (mudanças de role devem refletir rápido)

---

## Camada 4.5 — Sistema de Permissions (catálogo atômico)

> A Camada 4 define **roles** (owner, admin, member, viewer, guest, etc). Esta camada define o que cada role **pode efetivamente fazer** em termos de permissions atômicas. Roles são apenas **presets nomeados** que combinam permissions desse catálogo.

### Filosofia

- **Permissions são fixas no código** (catálogo TypeScript versionado com deploy). Toda permission existe porque há código que a respeita. Não faz sentido criar permission sem endpoint que a use.
- **Roles são presets de permissions** (mapping role → conjunto de permissions). Roles podem virar editáveis no futuro (plano Enterprise), mas o catálogo de permissions sempre é estático.
- **Permissions são contextuais.** A pergunta nunca é "user pode `pain.create`?". É "user pode `pain.create` neste workspace, neste produto?".
- **Frontend NÃO é fonte da verdade.** Frontend recebe permissions efetivas pra renderizar UI corretamente, mas backend **revalida em cada mutação**. Defesa em profundidade.

### Convenção de nomes

Todas as permissions seguem o padrão `<recurso>.<ação>`:

- **Recurso**: substantivo singular da entidade (`pain`, `hypothesis`, `roadmap_item`, `workspace`, `product`)
- **Ação**: verbo curto (`read`, `create`, `update`, `delete`) ou ação específica (`transition_to_resolved`, `archive`, `export`)

Permissions sensíveis (ex: deletar workspace, exportar dados, gerenciar billing) são **isoladas** em vez de inclusas em CRUD genérico.

### Catálogo completo de permissions

#### Workspace (gestão do tenant)

| Permission | O que permite |
|---|---|
| `workspace.read` | Ver dados básicos do workspace (nome, members, settings públicos) |
| `workspace.update` | Editar nome, slug, configurações gerais |
| `workspace.delete` | Soft-deletar workspace |
| `workspace.transfer_ownership` | Transferir ownership pra outro user |
| `workspace.manage_billing` | Acessar e editar billing, planos, métodos de pagamento |
| `workspace.manage_integrations` | Configurar integrações (Jira, Slack, etc) no nível do workspace |
| `workspace.export_data` | Exportar dados do workspace (GDPR, backup) |

#### Workspace Members (gestão de pessoas)

| Permission | O que permite |
|---|---|
| `members.read` | Ver lista de membros e suas roles |
| `members.invite` | Criar invites pra novos membros |
| `members.update_role` | Mudar role de outros membros (não outros owners; admin só member/viewer/guest) |
| `members.remove` | Remover membros do workspace |
| `members.read_audit` | Ver auditoria de ações dos membros |

#### Products (gestão do portfolio)

| Permission | O que permite |
|---|---|
| `product.read` | Ver lista de produtos do workspace e dados básicos |
| `product.create` | Criar novo produto no workspace |
| `product.update` | Editar nome, visão, slug do produto |
| `product.archive` | Arquivar produto (soft delete) |
| `product.delete` | Deletar permanentemente (após arquivar) |
| `product.manage_members` | Gerenciar product_members (adicionar, mudar role, remover) |

#### Pillars (frentes estratégicas — workspace-level)

| Permission | O que permite |
|---|---|
| `pillar.read` | Ver pilares estratégicos |
| `pillar.create` | Criar novo pilar |
| `pillar.update` | Editar pilar existente |
| `pillar.delete` | Soft-deletar pilar |

#### Objectives e Key Results (OKRs)

| Permission | O que permite |
|---|---|
| `objective.read` | Ver objectives (workspace ou produto) |
| `objective.create` | Criar objective novo |
| `objective.update` | Editar objective |
| `objective.delete` | Soft-deletar objective |
| `objective.transition` | Mudar status (draft → active → achieved/missed/cancelled) |
| `key_result.read` | Ver KRs |
| `key_result.create` | Criar KR vinculado a objective |
| `key_result.update` | Editar KR (incluindo update de progresso) |
| `key_result.delete` | Soft-deletar KR |

#### Personas

| Permission | O que permite |
|---|---|
| `persona.read` | Ver personas |
| `persona.create` | Criar persona |
| `persona.update` | Editar persona |
| `persona.delete` | Soft-deletar persona |
| `persona.link_product` | Vincular/desvincular persona a produto |

#### Discovery — Evidences

| Permission | O que permite |
|---|---|
| `evidence.read` | Ver evidências |
| `evidence.create` | Criar evidência (incluindo upload de attachments) |
| `evidence.update` | Editar evidência |
| `evidence.delete` | Soft-deletar evidência |
| `evidence.transition` | Mudar status (new → triaged → linked → archived) |
| `evidence.link_pain` | Vincular evidência a dor |
| `evidence.bulk_import` | Importar evidências em lote (CSV, API) |

#### Discovery — Pains

| Permission | O que permite |
|---|---|
| `pain.read` | Ver dores |
| `pain.create` | Criar dor |
| `pain.update` | Editar dor (título, descrição, severidade, reach) |
| `pain.delete` | Soft-deletar dor |
| `pain.transition` | Mudar status (identified → investigating → prioritized → addressed → resolved) |
| `pain.discard` | Marcar como descartada (requer reason) |
| `pain.link_persona` | Vincular/desvincular personas |
| `pain.link_hypothesis` | Vincular dor a hipótese |

#### Discovery — Hypotheses

| Permission | O que permite |
|---|---|
| `hypothesis.read` | Ver hipóteses |
| `hypothesis.create` | Criar hipótese (if/then/because) |
| `hypothesis.update` | Editar hipótese |
| `hypothesis.delete` | Soft-deletar hipótese |
| `hypothesis.transition` | Mudar status (formulated → validating → validated/invalidated → in_execution → delivered) |
| `hypothesis.discard` | Marcar como descartada/deprioritizada (requer reason) |
| `hypothesis.link_roadmap` | Vincular hipótese a roadmap item |

#### Discovery — Experiments

| Permission | O que permite |
|---|---|
| `experiment.read` | Ver experimentos |
| `experiment.create` | Criar experimento (hipótese, success_criteria, plan) |
| `experiment.update` | Editar experimento |
| `experiment.delete` | Soft-deletar experimento |
| `experiment.transition` | Mudar status (planned → running → completed → analyzed) |
| `experiment.record_result` | Registrar resultado final (validated/invalidated/inconclusive) |

#### Delivery — Roadmap Items

| Permission | O que permite |
|---|---|
| `roadmap_item.read` | Ver itens do roadmap |
| `roadmap_item.create` | Criar iniciativa, épico ou feature |
| `roadmap_item.update` | Editar item (título, descrição, datas, owner) |
| `roadmap_item.delete` | Soft-deletar item |
| `roadmap_item.transition` | Mudar status (proposed → planned → in_development → ...) |
| `roadmap_item.cancel` | Marcar como cancelled (requer reason) |
| `roadmap_item.rollback` | Marcar como rolled_back (requer reason) |
| `roadmap_item.sync_external` | Forçar sync com Jira/Linear |
| `roadmap_item.reorder` | Reordenar itens (drag-and-drop) |

#### Outcomes

| Permission | O que permite |
|---|---|
| `outcome.read` | Ver outcomes |
| `outcome.create` | Criar outcome vinculado a roadmap item entregue |
| `outcome.update` | Editar (incluindo registrar medições) |
| `outcome.delete` | Soft-deletar outcome |
| `outcome.transition` | Mudar status (hypothesized → measuring → confirmed/not_confirmed/inconclusive) |

#### Comments & Discussions (futuro, mas reservado)

| Permission | O que permite |
|---|---|
| `comment.read` | Ver comentários em entidades |
| `comment.create` | Adicionar comentário |
| `comment.update_own` | Editar próprios comentários |
| `comment.delete_own` | Deletar próprios comentários |
| `comment.moderate` | Editar/deletar comentários de outros |

#### Assets & Attachments

| Permission | O que permite |
|---|---|
| `asset.read` | Ver assets (imagens, documentos) anexados |
| `asset.upload` | Fazer upload de novos assets |
| `asset.delete` | Deletar assets |

#### Audit & Analytics

| Permission | O que permite |
|---|---|
| `audit.read` | Ver `entity_events` (log de mudanças) |
| `audit.export` | Exportar audit log em CSV/JSON |
| `analytics.read_dashboard` | Ver dashboard agregado do workspace |
| `analytics.read_funnel` | Ver funil de discovery |
| `analytics.export` | Exportar relatórios analíticos |

#### Permissions especiais (administrativas)

| Permission | O que permite |
|---|---|
| `impersonate.use` | Logar como outro user (plano Enterprise, futuro) |
| `webhook.manage` | Criar/editar/deletar webhooks de saída |
| `api_token.manage` | Criar tokens de API (acesso programático) |

### Mapping de roles → permissions (presets v1)

#### Workspace roles

**owner** — tudo
```
TODAS as permissions do catálogo
```

**admin** — quase tudo, exceto billing/deleção de workspace
```
workspace.read, workspace.update, workspace.manage_integrations, workspace.export_data
members.* (todas)
product.* (todas)
pillar.* (todas)
objective.* (todas)
key_result.* (todas)
persona.* (todas)
evidence.* (todas, em todos produtos)
pain.* (todas, em todos produtos)
hypothesis.* (todas, em todos produtos)
experiment.* (todas, em todos produtos)
roadmap_item.* (todas, em todos produtos)
outcome.* (todas, em todos produtos)
comment.* (todas)
asset.* (todas)
audit.read, audit.export
analytics.* (todas)
webhook.manage, api_token.manage
```

**member** — leitura ampla + escrita conforme product_members
```
workspace.read
members.read
product.read
pillar.read
objective.read, key_result.read
persona.read
analytics.read_dashboard, analytics.read_funnel
audit.read (apenas próprias ações + entidades que tem acesso)
asset.read, asset.upload

# Permissions de escrita em entidades de produto: 
# DERIVADAS do product_members.role (resolução contextual, ver abaixo)
```

**viewer** — só leitura
```
workspace.read
members.read
product.read
pillar.read
objective.read, key_result.read
persona.read
evidence.read, pain.read, hypothesis.read, experiment.read, roadmap_item.read, outcome.read (em todos produtos)
comment.read, asset.read
analytics.read_dashboard, analytics.read_funnel
```

**guest** — leitura restrita apenas em produtos onde foi convidado
```
workspace.read (apenas dados básicos)
product.read (apenas produtos onde tem product_members)
# Demais permissions: derivadas do product_members.role nesses produtos específicos
```

#### Product roles (resolução contextual)

Quando user tem workspace role `member` ou `guest`, suas permissions em entidades de produto **dependem** do `product_members.role` naquele produto específico:

**product.role = owner** — controle total daquele produto
```
product.read, product.update, product.archive, product.manage_members
pillar.read (workspace-level, herda do workspace role)
objective.* (do produto)
key_result.* (do produto)
persona.read, persona.link_product
evidence.*, pain.*, hypothesis.*, experiment.*, roadmap_item.*, outcome.* (todas, naquele produto)
comment.*, asset.*
analytics.read_* (daquele produto)
audit.read (daquele produto)
```

**product.role = editor** — pode criar/editar/deletar entidades, mas não muda settings nem members
```
product.read
objective.read, key_result.read, key_result.update (apenas progresso)
persona.read
evidence.create, evidence.update, evidence.delete, evidence.transition, evidence.link_pain
pain.create, pain.update, pain.delete, pain.transition, pain.discard, pain.link_*
hypothesis.create, hypothesis.update, hypothesis.delete, hypothesis.transition, hypothesis.discard, hypothesis.link_roadmap
experiment.create, experiment.update, experiment.delete, experiment.transition, experiment.record_result
roadmap_item.create, roadmap_item.update, roadmap_item.delete, roadmap_item.transition, roadmap_item.reorder
outcome.create, outcome.update, outcome.transition
comment.create, comment.update_own, comment.delete_own
asset.upload
(NÃO tem: product.update, product.manage_members, *.archive sensíveis)
```

**product.role = viewer** — só leitura daquele produto
```
product.read
evidence.read, pain.read, hypothesis.read, experiment.read, roadmap_item.read, outcome.read
comment.read, asset.read
```

**product.role = none** — DENY explícito
```
(nenhuma permission, mesmo se workspace role daria)
```

### Algoritmo de resolução de permissions

Função pública da API: `getEffectivePermissions(userId, context)` → `string[]`

```
context = {
  workspace_id: uuid,
  product_id?: uuid  // opcional; se ausente, retorna apenas permissions workspace-level
}

1. Valida que user é membro ATIVO do workspace.
   Se não: retorna [].

2. Busca workspace_role do user no workspace.

3. Inicializa effective = permissions do preset do workspace_role.

4. Se workspace_role é 'owner' ou 'admin':
   → effective já contém TUDO.
   → retorna effective.

5. Se context.product_id está presente:
   a. Busca product_members(product_id, user_id).role
   b. Se role = 'none': 
      → Remove de effective TODAS permissions de entidades daquele produto.
      → Mantém apenas permissions workspace-level (workspace.read, members.read, etc).
   c. Se role = 'owner' / 'editor' / 'viewer':
      → Adiciona a effective as permissions do preset product_role.
   d. Se não há row product_members:
      - Se workspace_role = 'guest': remove permissions desse produto (guest precisa de row explícita).
      - Se workspace_role = 'member': adiciona permissions de 'viewer' (leitura default).
      - Se workspace_role = 'viewer': já tem leitura via preset workspace.

6. Aplica regras especiais:
   - Single-owner protection: se action vai deixar workspace ou produto sem owner ativo → DENY mesmo se permission existe.
   - email_verified obrigatório pra: members.invite, workspace.create, workspace.transfer_ownership.

7. Retorna effective (lista única de strings).
```

**Cacheamento:**
- Resultado pode ser cacheado por **até 60 segundos** por par `(user_id, workspace_id, product_id)`.
- Invalidação imediata em: mudança de role (workspace ou produto), remoção de membro, soft delete do user.

### Como API consome (backend)

#### Middleware de autorização

Toda rota autenticada passa por middleware que:

1. Valida JWT, popula `req.user`
2. Resolve `workspace_id` ativo (header > cookie > default)
3. Valida membership no workspace
4. Roda `SET LOCAL app.current_workspace = '<uuid>'` na conexão Postgres
5. Resolve `effective_permissions` (cacheado por 60s)
6. Popula `req.permissions: Set<string>`

#### Checagem por rota — decorador / guard

Cada endpoint declara as permissions que exige:

```ts
// Pseudocódigo Fastify/Express-style
app.post(
  "/api/products/:productId/pains",
  requirePermission("pain.create", { scope: "product", from: "params.productId" }),
  async (req, res) => {
    // Aqui já é seguro assumir que user pode criar pain neste product.
    const pain = await createPain(req.body, req.user.id, req.params.productId);
    res.json(pain);
  }
);
```

O guard `requirePermission`:
1. Lê `req.permissions` (já populado pelo middleware)
2. Lê scope (`workspace` ou `product`). Se `product`, exige product_id (do path/body/query).
3. Resolve effective permissions naquele contexto.
4. Se permission não está no set: retorna **403 Forbidden** com body:
   ```json
   {
     "error": "PERMISSION_DENIED",
     "required": "pain.create",
     "scope": "product",
     "context": { "product_id": "..." },
     "user_role": { "workspace": "member", "product": "viewer" }
   }
   ```
5. Loga em `entity_events` o denial (tipo `permission_denied`) — útil pra audit e detectar tentativas suspeitas.

#### Helper imperativo (pra lógica condicional)

Quando a permissão depende de condições dinâmicas (ex: usuário pode editar a própria evidência mesmo sem `evidence.update` se for o autor):

```ts
async function canEditEvidence(userId: string, evidenceId: string): Promise<boolean> {
  const evidence = await db.evidences.find(evidenceId);
  if (evidence.created_by_user_id === userId) return true;
  return await hasPermission(userId, "evidence.update", { product_id: evidence.product_id });
}
```

Regra: lógica condicional fica no **service layer**, não no guard. Guards são declarativos.

### Como Frontend consome

#### Endpoint `/api/auth/me` reformulado

Resposta completa quando frontend faz bootstrap:

```json
{
  "user": {
    "id": "u-...",
    "name": "Eliezer Silva",
    "email": "eliezer@acme.com",
    "email_verified_at": "2025-11-01T...",
    "avatar_url": null
  },
  "workspaces": [
    {
      "id": "ws-...",
      "slug": "acme-corp",
      "name": "Acme Corp",
      "role": "admin",
      "permissions": [
        "workspace.read", "workspace.update", "members.invite", "product.create", "..."
      ],
      "products": [
        {
          "id": "p-core",
          "slug": "acme-core",
          "name": "Acme Core",
          "role": "owner",
          "permissions": ["pain.create", "pain.update", "..."]
        },
        {
          "id": "p-mobile",
          "name": "Acme Mobile",
          "role": "viewer",
          "permissions": ["pain.read", "..."]
        }
      ]
    }
  ],
  "current_workspace_id": "ws-...",
  "current_product_id": "p-core"
}
```

**Observações:**
- Permissions vêm **pré-calculadas** pelo backend (frontend não recalcula).
- Frontend popula um store (Zustand, Redux, Context) com isso.
- Toda mudança de workspace/produto **refaz a chamada** ou usa endpoint `GET /api/auth/permissions?workspace_id=&product_id=`.

#### Hook `usePermissions()`

```tsx
// hooks/use-permissions.ts
import { useAuthStore } from "@/lib/auth-store";

export function usePermissions() {
  const { currentWorkspace, currentProduct } = useAuthStore();

  function can(permission: string, opts?: { productId?: string }): boolean {
    // Se opts.productId é passado e diferente do current, busca permissions daquele produto.
    const productId = opts?.productId ?? currentProduct?.id;
    const product = currentWorkspace?.products.find(p => p.id === productId);

    // Permissions workspace-level
    if (currentWorkspace?.permissions.includes(permission)) return true;

    // Permissions product-level
    if (product?.permissions.includes(permission)) return true;

    return false;
  }

  function role(): { workspace: string | null; product: string | null } {
    return {
      workspace: currentWorkspace?.role ?? null,
      product: currentProduct?.role ?? null,
    };
  }

  return { can, role };
}
```

#### Uso declarativo em UI

```tsx
function PainListPage() {
  const { can } = usePermissions();

  return (
    <div>
      <Header>
        {can("pain.create") && (
          <Button onClick={openCreateModal}>Nova dor</Button>
        )}
      </Header>

      <PainList>
        {pains.map(pain => (
          <PainCard key={pain.id} pain={pain}>
            {can("pain.update") && <EditButton />}
            {can("pain.delete") && <DeleteButton />}
            {can("pain.transition") && <StatusDropdown />}
          </PainCard>
        ))}
      </PainList>
    </div>
  );
}
```

#### Componente wrapper (opcional)

```tsx
<RequirePermission permission="workspace.manage_billing">
  <BillingSettingsTab />
</RequirePermission>
```

Implementação simples:

```tsx
function RequirePermission({ permission, fallback = null, children }) {
  const { can } = usePermissions();
  return can(permission) ? children : fallback;
}
```

#### Páginas inteiras protegidas (route-level)

No App Router do Next.js, use server component que valida no servidor:

```tsx
// app/(app)/settings/billing/page.tsx
import { redirect } from "next/navigation";
import { checkPermission } from "@/lib/permissions-server";

export default async function BillingPage() {
  const allowed = await checkPermission("workspace.manage_billing");
  if (!allowed) redirect("/dashboard?error=permission_denied");

  return <BillingContent />;
}
```

### Defesa em profundidade

**Princípio:** frontend pode esconder UI, mas backend é a única fonte da verdade.

Camadas de defesa (do mais externo ao mais interno):

1. **Frontend (UX)** — esconde botões/menus pra ações sem permissão. Evita confusão do user, não é segurança.
2. **API middleware** — bloqueia request antes de chegar no handler. Retorna 403 com info estruturada.
3. **API service layer** — re-valida em operações sensíveis (delete, transferência de ownership).
4. **Postgres RLS** — última linha. Mesmo se API falhar, banco só retorna rows do workspace ativo.
5. **Audit log** — toda tentativa negada vira evento. Tentativas repetidas viram alerta de segurança.

**Implicação prática:** nunca confiar em payload do frontend dizendo "user pode fazer isso porque a UI mostrou botão". Sempre revalidar.

### Audit de permission denials

Toda chamada que resulta em 403 grava evento:

```
event_type: 'permission_denied'
user_id: <user que tentou>
workspace_id: <contexto>
product_id: <contexto se aplicável>
required_permission: 'pain.delete'
endpoint: 'DELETE /api/pains/:id'
ip: <ip do request>
user_agent: <ua>
timestamp: <now>
```

- 5+ denials do mesmo user em 1 hora: dispara notificação pro workspace admin
- Pode indicar: tentativa de privilege escalation, bug no frontend (botão que deveria estar escondido), member confuso

### Roles customizadas (futuro, plano Enterprise)

V1: presets fixos.
V2 (Enterprise): workspace pode criar roles customizadas combinando permissions do catálogo.

```
Exemplo: role "Auditor Compliance"
permissions: [
  "workspace.read", "members.read",
  "audit.read", "audit.export",
  "evidence.read", "pain.read", "hypothesis.read",
  "roadmap_item.read", "outcome.read",
  "analytics.read_dashboard", "analytics.export"
]
# Não pode editar nada, mas vê tudo + exporta auditoria
```

Modelagem que prepara isso:

- Tabela `workspace_custom_roles` (`id`, `workspace_id`, `name`, `description`, `permissions[]`, `created_at`)
- `workspace_members.role` deixa de ser enum e vira FK pra `workspace_roles` (tabela com presets + customizadas)
- Validação: workspace pode criar até N roles customizadas (limite do plano)

Não implementar agora. Mas saber que vai vir.

### Decisões fechadas (Camada 4.5)

| Decisão | Escolha |
|---|---|
| RBAC puro vs RBAC + Permissions | **RBAC + Permissions** (roles = presets de permissions atômicas) |
| Catálogo de permissions | **Fixo no código** (TypeScript const), versionado com deploy |
| Granularidade | **Híbrido** (CRUD + ações sensíveis isoladas como `pain.discard`, `roadmap_item.cancel`) |
| Scope de permissions | **Contextual** (workspace + produto, resolvido em runtime) |
| Frontend consome | **Bootstrap** envia permissions efetivas, frontend usa pra UI, backend revalida em toda mutação |
| Cache de permissions | **TTL 60s** por (user, workspace, product), invalidado em mudança de role |
| Resposta de denial | **403** com body estruturado (required, scope, context, user_role) |
| Audit de denials | **Sim**, gravado em `entity_events` com event_type `permission_denied` |
| Roles customizadas | **Não na v1** (só presets); preparar schema pra futuro |

---

## Camada 5 — Invites e onboarding

### Convidar para o workspace

```
1. Admin ou owner gera invite:
   POST /api/workspaces/:id/invites
   Body: {
     email,
     workspace_role: 'admin' | 'member' | 'viewer' | 'guest',
     product_assignments?: [{ product_id, role: 'owner' | 'editor' | 'viewer' }]
   }

2. Validações:
   - Quem convida tem permissão (admin ou owner)
   - Email é válido
   - Se workspace_role = 'guest', product_assignments é obrigatório (ao menos 1)
   - Email ainda não é membro ativo do workspace
   - Não há invite pending pra esse email nesse workspace

3. Sistema cria registro:
   - workspace_invites (token aleatório 32 bytes hex, expires_at = now + 7 dias)

4. Envia email:
   - Subject: "[Workspace Acme Corp] Você foi convidado por Maria Souza"
   - Link: app.productgen.com/invite/:token

5. Retorna 201 com invite info

Rate limit: 50 invites por workspace por dia
```

### Aceitar invite

```
1. User clica no link

2. Frontend chama GET /api/auth/invites/:token (público, retorna info do invite)

3. Se token inválido/expirado: tela de erro
4. Se token OK e user já tem conta:
   - Mostra tela "Você foi convidado pra Acme Corp. Aceitar?"
   - User confirma → POST /api/auth/invites/:token/accept
5. Se token OK e user não tem conta:
   - Mostra tela de signup com email pré-preenchido (e bloqueado)
   - User completa signup → após verificar email, aceita automaticamente
6. Ao aceitar:
   - Cria workspace_members (com role do invite)
   - Cria product_members pra cada item em product_assignments
   - Marca workspace_invites.accepted_at e accepted_by_user_id
   - Cookie pg_workspace atualizado pro novo workspace
```

### Revogar invite

```
- Admin ou owner pode revogar invite pending
- POST /api/workspaces/:id/invites/:invite_id/revoke
- Marca workspace_invites.status = 'revoked'
- Token deixa de funcionar imediatamente
```

### Invite expira em 7 dias

- Cron job marca invites pending com `expires_at < now()` como `status = 'expired'`
- Cliente pode reenviar (gera novo token, novo email, mesmo invite row recebe novo expires_at)

### Self-service signup vs invite-only

Configurado em `workspace_settings.signup_mode`:

| Modo | Comportamento |
|---|---|
| `open` | Qualquer pessoa pode criar workspace novo. Default na v1 pra growth orgânico |
| `domain_restricted` | Workspace existente aceita signups automáticos se email termina em domínio da whitelist (`allowed_email_domains`). User cai direto no workspace existente |
| `invite_only` | Ninguém entra sem invite explícito. Cliente Enterprise quase sempre usa esse |

**Cuidado com `domain_restricted`:** apenas após validação de propriedade do domínio (ver Camada 7).

### Primeiro acesso ao workspace

Quando user aceita invite e cai no workspace pela primeira vez:

- Tour rápido (3-4 telas) explicando navegação principal
- Sugestão de qual produto explorar primeiro (`workspace_settings.default_product_id`)
- Marca `workspace_members.onboarded_at`
- Após onboarding, tour não aparece mais (a menos que o user reset manualmente em Settings)

---

## Camada 6 — Casos especiais e edge cases

### Transferir ownership de workspace

- Apenas `owner` pode iniciar
- Designa outro membro existente como novo owner
- Owner anterior **mantém** role de admin (não vira member)
- Confirmação por email obrigatória pro **owner anterior** (não pro novo — ele recebe notificação)
- Auditoria registra a transferência

### Deletar conta de user

- User pode iniciar via Settings → "Deletar minha conta"
- Confirmação por senha + checkbox "entendo que essa ação é permanente"
- **Não pode deletar** se for único owner de algum workspace:
  - Sistema mostra lista dos workspaces afetados
  - User precisa: transferir ownership ou deletar esses workspaces antes
- Soft delete inicial:
  - `users.deleted_at = now()`
  - Email é hasheado pra liberar reuso futuro (`user-deleted-{hash}@deleted.local`)
  - Sessões ativas revogadas imediatamente
- Hard delete após 30 dias:
  - Dados pessoais purgados (nome, avatar, email original)
  - Conteúdo de produto (evidências criadas, comentários) **fica preservado**, atribuído a "Usuário removido"
- Conformidade LGPD/GDPR: hard delete pode ser antecipado por requisição formal

### Remover membro do workspace

- Admin ou owner inicia: `DELETE /api/workspaces/:id/members/:user_id`
- Validações:
  - Não pode remover o último owner
  - Admin não pode remover outro admin (só owner pode)
- Ação:
  - Marca `workspace_members.removed_at = now()`
  - Sessões ativas do user no contexto desse workspace são revogadas
  - Conteúdo criado pelo user permanece atribuído (não anonimiza por remoção)
  - User recebe email de notificação
- Member pode ser readicionado depois (mesma row `workspace_member`, `removed_at` volta a NULL, role pode mudar)

### Workspace com 1 só owner que tenta sair

- Sistema bloqueia a ação
- Mensagem: "Você é o único owner. Promova outro a owner antes ou delete o workspace"
- Tela oferece dois caminhos: promover outro ou deletar

### User aceitou invite mas nunca usou

- Workspace member fica "dormente" (`last_accessed_at IS NULL`)
- Aparece nas listas com badge "Nunca acessou" + tempo desde joined_at
- Admin pode remover sem cerimônia

### Email muda

- User troca email em Settings → confirma com senha atual → digita novo email
- Sistema valida:
  - Novo email não está em uso (por outro user ativo)
  - Não há requisição pendente de troca pra esse user
- Cria `auth_tokens` (purpose=change_email, payload={new_email}, TTL 24h)
- Envia token pro **novo** email (precisa provar acesso)
- Email antigo recebe notificação de segurança ("alguém pediu pra trocar seu email. Não foi você? Clique aqui pra cancelar")
- User clica no link do novo email → POST /api/auth/confirm-email-change → email atualizado, token consumido
- Cooldown: **30 dias** entre trocas de email (evita abuso)
- Após troca: sessões ativas **mantidas** (não revoga, pois é o mesmo dono)

### Mesmo user em múltiplos dispositivos

- Não é problema. Cada device tem sua sessão (`user_sessions` row própria).
- Settings mostra "Sessões ativas":
  - User Agent (Chrome MacOS, Firefox Windows, Safari iOS)
  - IP / cidade (aproximada via IP geolocation)
  - Last used at
  - Botão "Logout deste device"
- User pode revogar individualmente ou clicar "Logout de todos os outros devices"

### Sessão "espião" (impersonation, plano Enterprise)

Não implementar na v1. Mas deixar ganchos:

- Owner do workspace pode iniciar "Login as <user>" pra debug
- Cria sessão especial com flag `impersonated_by: admin_user_id`
- Toda ação loga isso em `entity_events` (visível na auditoria)
- Banner vermelho fixo no topo: "Você está logado como Maria Souza · [Sair]"
- Limite de tempo: 1 hora
- Owner não consegue impersonate outro owner

### Múltiplas sessões expirando

- Refresh token expira em 30 dias deslizantes
- Se user fica 30+ dias sem usar, sessão expira → precisa logar de novo
- Sessões expiradas são limpas por cron job (90 dias após `expires_at`)

### Tentativa de uso de refresh token revogado

- API recebe refresh token que foi revogado
- **Sinal de comprometimento**: alguém pegou refresh antigo
- Resposta:
  - Revoga **todas** as sessões do user
  - Envia email de alerta ("Detectamos possível acesso não autorizado. Todas suas sessões foram encerradas. Faça login novamente")
  - User precisa logar e idealmente trocar senha

### IP suspeito (futuro)

Não implementar na v1. Mas estrutura permite:
- Detecção de login de IP/país muito diferente do habitual
- Pede confirmação por email antes de emitir tokens
- Plano Enterprise pode forçar 2FA em IPs suspeitos

---

## Decisões fechadas

| Decisão | Escolha |
|---|---|
| Hash de senha | **Argon2id** (memory=64MB, iterations=3, parallelism=4) |
| Algoritmo JWT | **RS256** (chave assimétrica) |
| Múltiplos emails por user | **Não** (1 email por user, futuro reavaliar) |
| Quem cria workspace | **Qualquer user autenticado** (self-service, futuro reavaliar) |
| OAuth externo (Google/Microsoft) | **Não implementar na v1** |
| SAML SSO | **Não implementar na v1** (plano Enterprise futuro) |
| MFA / 2FA | **Não implementar na v1** (deixar ganchos no schema) |
| Domain claiming | **Não implementar na v1** (deixar ganchos no schema) |
| TTL access token | **15 minutos** |
| TTL refresh token | **30 dias deslizante** |
| TTL token de verificação de email | **24 horas** |
| TTL token de reset de senha | **1 hora** |
| TTL workspace invite | **7 dias** |
| Cooldown troca de email | **30 dias** |
| Soft delete antes de hard | **30 dias** |
| Storage de tokens no frontend | **Cookies httpOnly secure** |
| Onboarding flag | **`workspace_members.onboarded_at`** |

---

## Decisões em aberto

| Decisão | Status |
|---|---|
| Pricing model (seat vs produto vs flat) | A decidir |
| 2FA obrigatório por workspace policy | Definir após v1 |
| Roles customizadas (workspace cria roles próprias combinando permissions) | Roadmap futuro (plano Enterprise) |
| Domain claiming (DNS verification) | Roadmap futuro |
| OAuth externo (Google/Microsoft) | Roadmap futuro |
| SAML SSO | Roadmap futuro (plano Enterprise) |
| Impersonation (login as user) | Roadmap futuro (plano Enterprise) |
| Geolocation de sessões | Roadmap futuro |
| Detecção de IP suspeito | Roadmap futuro |

---

## Resumo executivo

**Autenticação na v1:**
- Email + senha apenas
- Hash Argon2id, JWT RS256
- Cookies httpOnly pra tokens
- Verificação de email, forgot password, troca de email funcionais

**Identidade:**
- User é global (vive fora dos workspaces)
- 1 email = 1 user (case-insensitive)

**Multi-tenancy:**
- User pode estar em N workspaces
- Workspace ativo via cookie `pg_workspace`
- RLS no Postgres garante isolamento

**Permissões em 2 camadas:**
- Workspace role: owner / admin / member / viewer / guest
- Product role: owner / editor / viewer / none
- Algoritmo resolve permissão combinando ambos

**Permissions (Camada 4.5):**
- Catálogo atômico fixo no código (~80 permissions no formato `recurso.ação`)
- Roles são **presets de permissions** (owner, admin etc combinam permissions específicas)
- Backend: middleware popula `req.permissions`, guards declarativos por endpoint (`requirePermission("pain.create")`)
- Frontend: bootstrap em `/api/auth/me` traz permissions efetivas; hook `usePermissions().can('pain.create')` esconde UI
- **Frontend não é fonte da verdade** — backend revalida toda mutação. Defesa em profundidade (UX → middleware → service → RLS → audit).
- Denials geram audit event (`permission_denied`); 5+ denials/hora alerta admin
- Cache 60s por (user, workspace, product), invalidado em mudança de role

**Invariantes:**
- Workspace sempre tem ≥1 owner ativo
- Produto sempre tem ≥1 owner ativo
- User não pode deletar conta se for único owner de algum workspace

**Convites:**
- Email-based, token 32 bytes, 7 dias TTL
- Pode incluir product_assignments pra acesso granular
- Cliente Enterprise tipicamente usa `invite_only`
