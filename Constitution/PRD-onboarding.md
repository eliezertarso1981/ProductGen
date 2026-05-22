# PRD — Onboarding de Cliente Novo (Self-Service)

> **Documento:** Product Requirements Document
> **Produto:** [NOME_DO_PRODUTO] — Plataforma de gestão de produto (benchmark: ProductPlan)
> **Versão:** 1.0 (Draft)
> **Status:** Em validação
> **Autor:** Time de Produto
> **Destino:** Contexto para implementação assistida por Cursor (IA)

---

## 1. Contexto e Benchmark

Estamos construindo uma plataforma de gestão de produto inspirada no **ProductPlan** (https://www.productplan.com). O ProductPlan organiza o trabalho de produto em quatro grandes áreas:

- **Roadmaps** — Lanes (raias), Bars (barras/iniciativas), Milestones (marcos), Containers
- **Strategy** — Objectives e Key Results (OKRs)
- **Discovery** — Ideas, Opportunities, Customers, Tags
- **Launches** — Launches, Checklist Sections, Tasks

Acima de tudo isso existe um conceito de **Account** (conta da empresa) que agrupa **Users** e **Teams**.

Esta PRD cobre o **primeiro contato do cliente** com a plataforma: do "ainda não tenho conta" até o "tenho meu primeiro produto e pilares estratégicos cadastrados, pronto para usar". É a porta de entrada do funil de aquisição self-service.

> O benchmark do ProductPlan é referência de **vocabulário e estrutura de dados**, não de fluxo de onboarding. O nosso onboarding deve ser mais guiado (wizard) que o do ProductPlan, que assume usuário já familiarizado com a categoria.

---

## 2. Objetivo

Permitir que um usuário sem conta consiga, em menos de **5 minutos**, sair do estado "nunca ouvi falar" para "tenho minha conta criada, plano escolhido e primeiro produto com pilares e OKRs cadastrados", sem precisar de intervenção do time comercial para os planos **Starter** e **Professional**.

### Metas mensuráveis (sugestão para validar)

- **Conversão sign-up → workspace criado:** ≥ 80%
- **Conversão workspace criado → wizard concluído:** ≥ 60%
- **Tempo médio do fluxo completo:** ≤ 5 min
- **Taxa de erro/abandono em validação de e-mail:** ≤ 10%

---

## 3. Escopo

### 3.1. Dentro do escopo

- Tela de "Criar minha conta" (acessada a partir de landing page / login)
- Cadastro de **Workspace** (nome, logo, tamanho da empresa, país)
- Cadastro do **primeiro usuário** (Admin do Workspace)
- Seleção de **plano** (Starter, Professional, Enterprise)
- Envio de **e-mail transacional** de boas-vindas e confirmação de conta
- Wizard de onboarding pós-confirmação:
  - Cadastro do **primeiro Produto**
  - Cadastro de **Pilares Estratégicos**
  - Cadastro de **OKRs** (Objectives + Key Results) iniciais
- Definição do schema de dados das entidades acima
- APIs/endpoints REST para suportar cada passo
- Tratamento dos limites de plano (enforcement de quotas)

### 3.2. Fora do escopo (próximas iterações)

- Convite de outros usuários para o workspace (será feito após o onboarding, em fluxo separado)
- **Cobrança / meio de pagamento** — será especificado em PRD separada. Nesta versão, a seleção de plano apenas registra a intenção; não há gateway, cartão ou faturamento
- **Modelagem detalhada de Product, Pillar, Objective e Key Result** — esta PRD descreve apenas os **campos do wizard** que o usuário preenche. A modelagem de dados dessas entidades virá em PRD específica do módulo de Strategy/Discovery
- Importação de roadmap existente (CSV, Jira, etc.)
- Customização avançada de logo (crop, filtros)
- Múltiplos workspaces por usuário no primeiro release
- Login social (Google, Microsoft)

---

## 4. Personas

| Persona | Perfil | Necessidade no onboarding |
|---|---|---|
| **PM individual** | Gestor de produto em PME tentando organizar trabalho | Cadastro rápido, plano Starter, tutorial guiado |
| **Head de Produto** | Lidera time de produto em empresa média | Avalia Professional, quer ver limites antes de comprar |
| **Líder de inovação (Enterprise)** | Empresa grande, processo de compra envolve TI/jurídico | Cria conta de avaliação, depois converte via comercial |

---

## 5. Fluxo de Onboarding — Visão Macro

```
[Landing/Login] 
   │
   ▼
[1. Criar minha conta] ─ email + senha + nome
   │
   ▼
[2. Cadastrar Workspace] ─ nome, logo, tamanho, país
   │
   ▼
[3. Confirmar dados do usuário Admin]
   │
   ▼
[4. Selecionar plano] ─ Starter | Professional | Enterprise
   │
   ▼
[Conta criada] ── envia e-mail de boas-vindas + confirmação
   │
   ▼
[5. Wizard de onboarding]
   ├─ 5.1 Cadastrar primeiro Produto
   ├─ 5.2 Cadastrar Pilares Estratégicos
   └─ 5.3 Cadastrar OKRs (Objectives + Key Results)
   │
   ▼
[Dashboard do produto] ── fim do onboarding
```

---

## 6. Detalhamento Funcional dos Passos

### 6.1. Passo 1 — Criar minha conta

**Tela:** `/signup`

**Campos:**
- Nome completo (string, obrigatório, 2–100 chars)
- E-mail corporativo (string, obrigatório, formato válido, **único no sistema**)
- Senha (string, obrigatório, mínimo 8 chars, pelo menos 1 letra maiúscula, 1 número, 1 caractere especial)
- Confirmação de senha
- Checkbox "Li e aceito os Termos de Uso e Política de Privacidade" (obrigatório)
- Checkbox opcional "Quero receber novidades por e-mail"

**Regras:**
- Validação em tempo real (debounce 500ms) de e-mail já cadastrado
- Indicador visual de força de senha
- Botão "Continuar" só ativa quando tudo válido
- Link "Já tenho conta" → `/login`

**Saída:** Cria registro `users` com `status = pending_workspace`, gera **token de sessão temporário** para os próximos passos.

---

### 6.2. Passo 2 — Cadastrar Workspace

**Tela:** `/signup/workspace`

**Campos:**
- Nome do workspace (string, obrigatório, 2–80 chars) — geralmente nome da empresa
- Logo (upload de imagem, opcional, formatos PNG/JPG/SVG, máx **[ASSUMIR/VALIDAR] 2MB**, dimensão recomendada 512×512)
- Tamanho da empresa (select, obrigatório):
  - `1-10` (Solo / Startup)
  - `11-50` (Small)
  - `51-200` (Medium)
  - `201-1000` (Large)
  - `1000+` (Enterprise)
- País (select com busca, obrigatório, ISO 3166-1 alpha-2). Pré-selecionar pela geolocalização de IP.

**Regras:**
- Slug do workspace é gerado automaticamente a partir do nome (`acme-inc`), com validação de unicidade e opção de editar
- Logo é armazenado em storage de objetos (S3-compatível) e referenciado por URL
- Quando tamanho da empresa = `1000+`, o passo 4 (plano) sugere Enterprise por padrão

**Saída:** Cria registro `workspaces`, vincula o usuário criado no passo 1 como `OWNER`.

---

### 6.3. Passo 3 — Confirmar dados do usuário Admin

**Tela:** `/signup/admin`

> Este passo confirma/complementa os dados do usuário criado no passo 1 e o **promove a Admin do workspace**.

**Campos:**
- Nome completo (pré-preenchido do passo 1, editável)
- Cargo/função (string, opcional, ex: "Head de Produto")
- Foto de perfil (upload opcional, mesmas regras do logo)
- E-mail (read-only — confirmação visual)

**Regras:**
- O usuário do passo 1 recebe role `ADMIN` no workspace criado
- Se o usuário cancelar aqui, o workspace permanece em estado `incomplete` por **[ASSUMIR/VALIDAR] 24h** antes de ser hard-deleted

**Saída:** Atualiza `users` e cria registro `workspace_memberships` com `role = ADMIN`.

---

### 6.4. Passo 4 — Selecionar plano

**Tela:** `/signup/plan`

**Apresentação:** Três cards lado a lado com comparativo de features.

| Característica | Starter | Professional | Enterprise |
|---|---|---|---|
| Produtos | 1 | até 50 | acima de 50 (ilimitado) |
| PRDs automáticas/mês | 10 | 1.000 | Ilimitado |
| Armazenamento | **[VALIDAR] 1 GB** | **[VALIDAR] 50 GB** | **[VALIDAR] 500 GB+** |
| Usuários por workspace | **[VALIDAR] até 3** | **[VALIDAR] até 25** | Ilimitado |
| Suporte | E-mail | E-mail + Chat | Dedicado |
| API | ❌ | ✅ | ✅ |

> **Nota:** Preços e fluxo de cobrança serão definidos em PRD separada. Nesta primeira versão, todos os planos são tratados como "ativos" após seleção, sem etapa de pagamento.

**Regras:**
- **Starter:** clique em "Começar" → conclui criação, vai para wizard
- **Professional:** clique em "Selecionar" → conclui criação e vai para wizard. (Fluxo de pagamento será adicionado em iteração futura.)
- **Enterprise:** clique em "Falar com vendas" → abre modal com formulário (nome, e-mail, telefone, mensagem) e dispara lead para CRM. O workspace fica em modo `trial_enterprise` até comercial converter manualmente

**Saída:** Atualiza `workspaces.plan_id`.

---

### 6.5. E-mail de boas-vindas / confirmação

**Disparo:** Imediatamente após o passo 4 (assíncrono, via fila).

**Destinatário:** E-mail informado no passo 1.

**Conteúdo mínimo:**
- Assunto: "Bem-vindo(a) ao [PRODUTO], [Nome]! Sua conta está pronta."
- Saudação personalizada
- Resumo do workspace criado (nome, plano)
- **Link de confirmação de e-mail** (token único, expira em **[ASSUMIR/VALIDAR] 7 dias**)
- CTA principal: "Continuar configuração" → leva ao wizard
- Links secundários: documentação, central de ajuda, contato

**Regras:**
- Enquanto e-mail não for confirmado, o workspace funciona em modo "banner persistente" pedindo confirmação
- Após 7 dias sem confirmação, **bloquear ações de escrita** até confirmar
- Reenvio de e-mail disponível no perfil do usuário

---

### 6.6. Wizard de onboarding pós-confirmação

**Tela:** `/onboarding` (com indicador de progresso 3 etapas)

> Este wizard é o coração do onboarding. Inspirado em produtos como Linear, Notion, Vercel. O objetivo é o usuário sair com **valor concreto criado**, não com tela em branco.

#### 6.6.1. Etapa 1/3 — Cadastrar primeiro Produto

**Campos:**
- Nome do produto (string, obrigatório, 2–80 chars)
- Descrição curta (textarea, opcional, até 500 chars)
- Tipo/categoria (select, opcional — ex: SaaS, Mobile App, Marketplace, Interno)
- Cor de identificação (color picker, opcional, default randômico)

**Saída:** Cria `products` vinculado ao workspace.

#### 6.6.2. Etapa 2/3 — Cadastrar Pilares Estratégicos

> "Pilares" são os grandes temas de longo prazo que orientam o produto (ex: Crescimento, Retenção, Operações, Plataforma). Equivalem ao conceito de **Themes** ou **Strategic Pillars** em frameworks de produto.

**Interface:** Lista editável onde o usuário adiciona N pilares (mínimo 1, sugerido 3–5, máximo **[ASSUMIR/VALIDAR] 10**).

**Por pilar:**
- Nome (string, obrigatório, 2–60 chars)
- Descrição (textarea, opcional, até 300 chars)
- Cor (opcional)

**Templates sugeridos (1-clique):**
- "Crescimento, Retenção, Receita"
- "Aquisição, Ativação, Retenção, Receita, Recomendação" (AARRR)
- "Plataforma, Produto Core, Experiência do Usuário"

**Saída:** Cria N registros em `pillars` vinculados ao produto.

#### 6.6.3. Etapa 3/3 — Cadastrar OKRs

> Pelo menos 1 Objective + 1 Key Result é obrigatório. Pode pular ("Configurar depois") mas tela mostra benefícios de configurar agora.

**Interface:**
- Botão "Adicionar Objective"
- Cada Objective expande mostrando lista de Key Results editáveis

**Por Objective:**
- Título (string, obrigatório, 2–120 chars)
- Descrição (opcional)
- Pilar associado (select dos pilares criados na etapa 2)
- Período (select: Q1, Q2, Q3, Q4 do ano atual; ou trimestre atual default)

**Por Key Result:**
- Título (string, obrigatório)
- Tipo de métrica (select: Número, Percentual, Valor monetário, Booleano)
- Valor inicial (number)
- Valor alvo (number)
- Unidade (string, ex: "usuários", "%", "R$")

**Saída:** Cria registros em `objectives` e `key_results`, espelhando vocabulário do ProductPlan (`Get Objectives`, `Get Key Results`).

#### 6.6.4. Tela final — "Tudo pronto!"

- Resumo do que foi criado (1 produto, X pilares, Y OKRs)
- CTA principal: "Ir para meu Dashboard"
- CTAs secundários:
  - "Convidar meu time" (próximo fluxo, fora do escopo desta PRD)
  - "Ver tour rápido do produto"

---

## 7. Modelagem de Dados

> Sintaxe inspirada em Prisma / TypeORM, ajustar para a stack escolhida.
> **Escopo desta PRD:** apenas as entidades necessárias para o onboarding propriamente dito (conta, workspace, papel do usuário, plano selecionado). A modelagem de `Product`, `Pillar`, `Objective` e `KeyResult` será detalhada em PRD própria do módulo de Strategy/Discovery. Aqui o wizard apenas **consome** essas entidades futuras via API.

```
User
├── id (uuid, pk)
├── email (string, unique)
├── password_hash (string)
├── full_name (string)
├── job_title (string, nullable)
├── avatar_url (string, nullable)
├── email_verified_at (timestamp, nullable)
├── status (enum: pending_workspace, active, suspended)
├── created_at, updated_at

Workspace
├── id (uuid, pk)
├── name (string)
├── slug (string, unique)
├── logo_url (string, nullable)
├── company_size (enum: 1-10, 11-50, 51-200, 201-1000, 1000+)
├── country_code (string, 2 chars)
├── plan_code (enum: starter, professional, enterprise)
├── status (enum: incomplete, active, trial_enterprise, suspended, deleted)
├── created_at, updated_at

WorkspaceMembership
├── id (uuid, pk)
├── workspace_id (fk → workspaces)
├── user_id (fk → users)
├── role (enum: OWNER, ADMIN, MEMBER, VIEWER)
├── created_at

EmailVerificationToken
├── id, user_id, token (string), expires_at, used_at

EnterpriseLead
├── id (uuid, pk)
├── workspace_id (fk, nullable)
├── contact_name, contact_email, contact_phone
├── message (text, nullable)
├── status (enum: new, contacted, converted, lost)
├── created_at
```

> **Catálogo de planos:** os limites (`max_products`, `max_auto_prds_per_month`, `max_storage_bytes`, `max_users`) ficam em **configuração da aplicação** (arquivo/constante ou tabela de catálogo), não como dado mutável por cliente. Isso simplifica o MVP — uma tabela `Plan` completa entra junto com a PRD de cobrança.

---

## 8. APIs / Endpoints

> REST, JSON, autenticação via Bearer token (JWT). Versão `/api/v1`.

| Método | Endpoint | Descrição |
|---|---|---|
| POST | `/api/v1/auth/signup` | Cria usuário (passo 1) |
| POST | `/api/v1/auth/login` | Login |
| POST | `/api/v1/auth/verify-email` | Confirma e-mail via token |
| POST | `/api/v1/auth/resend-verification` | Reenvia e-mail de confirmação |
| POST | `/api/v1/workspaces` | Cria workspace (passo 2) |
| PATCH | `/api/v1/workspaces/:id` | Atualiza workspace (logo, etc.) |
| GET | `/api/v1/workspaces/slug-available?slug=` | Valida disponibilidade do slug |
| PATCH | `/api/v1/users/me` | Atualiza dados do usuário admin (passo 3) |
| GET | `/api/v1/plans` | Lista catálogo de planos disponíveis (somente leitura, vem de config) |
| PATCH | `/api/v1/workspaces/:id/plan` | Define plano selecionado pelo workspace (passo 4) |
| POST | `/api/v1/uploads/logo` | Upload de logo/avatar (retorna URL) |
| POST | `/api/v1/leads/enterprise` | Captura lead Enterprise |

> **Endpoints do wizard (produto, pilares, OKRs)** serão definidos na PRD do módulo de Strategy/Discovery. Esta PRD apenas exige que esses endpoints **existam** no momento do wizard. Sugestão de contratos (a confirmar): `POST /api/v1/products`, `POST /api/v1/products/:id/pillars`, `POST /api/v1/products/:id/objectives`, `POST /api/v1/objectives/:id/key-results`.

Todas as respostas seguem padrão:
```json
{
  "data": { ... },
  "meta": { "request_id": "uuid" },
  "errors": [ { "code": "string", "message": "string", "field": "string" } ]
}
```

---

## 9. Requisitos Não-Funcionais

- **Performance:** cada passo do wizard deve carregar em < 1.5s (TTI)
- **Segurança:**
  - Senhas hasheadas com bcrypt/argon2
  - Rate limiting no signup (**[ASSUMIR/VALIDAR] 5 tentativas / hora / IP**)
  - Token de confirmação de e-mail criptograficamente seguro (256 bits)
  - Validação CSRF em todos os POST
- **Acessibilidade:** WCAG 2.1 nível AA (labels, contraste, navegação por teclado)
- **i18n:** strings externalizadas — primeiro release em **pt-BR e en-US**
- **Responsivo:** funcional em mobile (>= 360px) e desktop
- **Observabilidade:**
  - Eventos de analytics em cada passo (`signup_started`, `workspace_created`, `plan_selected`, `wizard_step_completed`, `onboarding_completed`)
  - Logs estruturados com `correlation_id`
- **LGPD/GDPR:** consentimento explícito, opção de excluir conta, política de retenção definida

---

## 10. Enforcement de Limites do Plano

Os limites devem ser verificados em **dois pontos**:

1. **No frontend** — feedback visual antes de tentar criar
2. **No backend** — validação dura no controller (defesa em profundidade)

Exemplo: workspace Starter tentando criar 2º produto → API retorna `403` com código `plan_limit_exceeded` e mensagem "Plano Starter permite até 1 produto. Faça upgrade para Professional."

Quotas a controlar:
- `max_products` — verificado no `POST /products`
- `max_auto_prds_per_month` — contador mensal (job cron reseta dia 1)
- `max_storage_bytes` — verificado no `POST /uploads/*`
- `max_users` — verificado no convite (próximo fluxo)

---

## 11. Critérios de Aceitação (resumo)

- [ ] Usuário consegue criar conta com e-mail/senha
- [ ] Não é possível criar duas contas com mesmo e-mail
- [ ] Senha fraca é rejeitada com mensagem clara
- [ ] Logo é aceito em PNG/JPG/SVG até **[VALIDAR] 2MB**
- [ ] Slug do workspace é único e editável
- [ ] País é pré-selecionado pelo IP (best-effort)
- [ ] Os 3 planos são exibidos com limites corretos e claros
- [ ] Plano Starter cria workspace ativo direto, sem cobrança
- [ ] Plano Enterprise direciona para formulário comercial
- [ ] E-mail de boas-vindas chega em até **[ASSUMIR/VALIDAR] 60s**
- [ ] Link de confirmação funciona e expira em 7 dias
- [ ] Wizard exige pelo menos: 1 produto + 1 pilar + 1 objective + 1 key result (ou skip explícito de OKR)
- [ ] É possível voltar e editar passos anteriores do wizard sem perder dados
- [ ] Tentativa de criar 2º produto no Starter retorna erro 403 com CTA de upgrade
- [ ] Eventos de analytics são disparados conforme especificado
- [ ] Fluxo completo é navegável apenas por teclado
- [ ] Strings em pt-BR e en-US estão externalizadas

---

## 12. Stack Tecnológica Sugerida

> **[VALIDAR com o time de engenharia.]** Recomendações alinhadas com o padrão atual do mercado para SaaS B2B.

- **Frontend:** Next.js 14+ (App Router), TypeScript, Tailwind CSS, shadcn/ui, React Hook Form + Zod
- **Backend:** Node.js (NestJS) ou similar, TypeScript, PostgreSQL, Prisma
- **Auth:** JWT + refresh token httpOnly cookie. Considerar Lucia, NextAuth ou solução própria
- **Storage:** S3 / Cloudflare R2 / Supabase Storage
- **E-mail transacional:** Resend / SendGrid / AWS SES
- **Filas/Jobs:** BullMQ + Redis para envio de e-mail e contadores de quota
- **Analytics:** PostHog ou Mixpanel
- **Observabilidade:** Sentry + Datadog/OpenTelemetry

---

## 13. Telas de Referência (sugestão)

Não há protótipo fechado ainda. Como referência visual, ver:

- ProductPlan signup: https://www.productplan.com (botão "Get Started")
- Linear onboarding: https://linear.app/onboarding
- Vercel onboarding: dashboard inicial pós-signup
- Notion onboarding: criação de workspace + primeira página

Recomendado produzir wireframes em Figma **antes** de iniciar implementação.

---

## 14. Definição de Pronto

- [ ] Código revisado por pelo menos 1 par
- [ ] Cobertura de testes unitários ≥ 70% nos módulos criados
- [ ] Testes E2E (Playwright/Cypress) cobrindo o fluxo feliz dos 6 passos
- [ ] Testes de integração das APIs com banco real (test container)
- [ ] Documentação OpenAPI/Swagger gerada e versionada
- [ ] Strings em pt-BR e en-US revisadas
- [ ] Validação manual de QA em desktop e mobile
- [ ] Eventos de analytics validados em ambiente de staging
- [ ] Aprovado em ambiente de homologação por Produto + Design

---

## 15. Perguntas em aberto / pontos a validar

1. Limites exatos de armazenamento por plano
2. Período de retenção de workspaces "incomplete"
3. Templates de pilares e OKRs serão estáticos no código ou editáveis pelo admin do produto?
4. O usuário pode pertencer a mais de um workspace? (Fora do escopo, mas modelagem precisa permitir.)
5. Como será o reset de contadores mensais — UTC ou timezone do workspace?
6. Política de retenção de logs e dados pessoais (LGPD)
7. Workspace em plano `trial_enterprise` consegue usar quais limites enquanto comercial não converte?

---

## Anexo A — Glossário (alinhado ao benchmark ProductPlan)

| Termo | Definição |
|---|---|
| **Workspace** | Conta da empresa cliente. Container de tudo. (No ProductPlan = "Account") |
| **Product** | Um produto específico que o workspace gerencia. Pode ter vários no Professional/Enterprise |
| **Pillar** | Tema estratégico de longo prazo (equivalente a "Theme" ou "Strategic Pillar") |
| **Objective** | "O que queremos alcançar" — vocabulário ProductPlan / OKR clássico |
| **Key Result** | "Como saberemos que alcançamos" — métrica do Objective |
| **Roadmap** | Visualização temporal das iniciativas (fora do escopo desta PRD, mas será o próximo passo) |
| **PRD automática** | Documento de requisitos gerado pela IA da plataforma. Conta para o limite mensal do plano |
