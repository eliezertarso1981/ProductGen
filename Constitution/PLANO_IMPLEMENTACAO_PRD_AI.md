# Plano de Implementação — Geração de PRD com IA (MVP)

> Documento de execução pro Cursor. Cole no início de uma sessão nova, junto com `CLAUDE.md` do projeto e os documentos de regras (auth, design system).
>
> **Princípio:** sequência rigorosa, critérios de aceitação claros, sem improviso de stack. Quando este documento conflitar com palpite do Cursor, **este documento vence**.

---

## ⛔ Regras de operação (Cursor leia primeiro)

1. **Esta feature depende do banco já estar com schema completo** (incluindo a migration auth + multi-produto). Confirme isso no Passo 0 antes de qualquer coisa.
2. **Não invente stack.** Use exatamente as bibliotecas listadas em §2. Se algo já está no `package.json`, use a versão instalada. Se não está, instale conforme especificado.
3. **Não comite automaticamente.** Mostre `git diff` ao fim de cada fase pro usuário revisar.
4. **Não pule fases.** Cada fase tem critérios de aceitação. Só passa pra próxima quando os anteriores fechados.
5. **Não invente queries SQL.** Use o schema documentado em `docs/productgen_schema.sql`. Se faltar tabela, pergunte ao usuário antes de criar.
6. **Não invente prompts pro LLM.** Use os templates em `prompts/prd/` (definidos neste documento).
7. **Antes de criar arquivos**, liste em 5 bullets o que entendeu e aguarde confirmação.

---

## 1. Escopo do MVP (decisões fechadas)

| Decisão | Valor |
|---|---|
| Granularidade | Apenas `roadmap_item.type = 'feature'` |
| Editor | Embutido no ProductGen (Tiptap com extensão markdown) |
| Anexos | Apenas menciona existência (sem extrair conteúdo de PDFs) |
| Posição do botão | Só no detalhe de `roadmap_item` (drawer/page de feature) |
| Cobrança | Limite mensal por plano + cobrança por excedente |
| Modelo LLM default | `claude-sonnet-4-5-20250929` (ou versão atual disponível) |
| BYOK | Apenas plano Enterprise (v2 — fora do MVP) |
| Streaming | Sim, SSE (Server-Sent Events) |
| Versionamento | Incrementa a cada save explícito do usuário (não autosave) |
| Estilos suportados no MVP | Apenas `clássico` (enxuto e spec técnica ficam pra v2) |
| Idioma | `pt-BR` apenas no MVP |
| Audiência | `engenharia` apenas no MVP |

**Fora do escopo do MVP** (registrar como TODOs):
- Estilos `enxuto` e `spec técnica`
- Idioma `en`
- Audiência `stakeholders` e `ambos`
- Iniciativa e Épico (só Feature)
- Extração de conteúdo de anexos (PDF parsing)
- BYOK
- Templates customizados por workspace
- Push pra Jira/Notion
- Export .docx e PDF
- Regenerate com instruções extras
- Gap analyzer ("What's missing?")

---

## 2. Stack técnica (não desvie)

### Backend (assumindo Node + Fastify ou similar — confirme no Passo 0)

| Dependência | Versão | Por quê |
|---|---|---|
| `@anthropic-ai/sdk` | latest | Cliente oficial da Anthropic. Sem abstração intermediária |
| `nunjucks` ou `mustache` | latest | Renderização de templates de prompt. **Não usar Jinja2 (Python).** Nunjucks é a versão JS |
| Driver Postgres já instalado (`pg` ou similar) | — | Reusar conexão existente |

### Frontend (Next.js 15 já configurado)

| Dependência | Versão | Por quê |
|---|---|---|
| `@tiptap/react` | latest | Editor headless |
| `@tiptap/starter-kit` | latest | Conjunto básico (bold, italic, headings, lists) |
| `@tiptap/extension-link` | latest | Links no markdown |
| `marked` | latest | Parser markdown → HTML (pra inicializar editor com conteúdo gerado) |
| `turndown` | latest | HTML → markdown (pra salvar conteúdo editado) |

### Anti-padrões

- ❌ LangChain, LlamaIndex (overhead desnecessário pra esse caso)
- ❌ WebSocket (SSE basta)
- ❌ Lexical, Slate, ProseMirror direto (Tiptap é mais simples)
- ❌ Markdown editor "WYSIWYG total" (preserve markdown puro pra export)
- ❌ Salvar HTML no banco (sempre markdown como source of truth)
- ❌ Streaming via polling (use SSE de verdade)
- ❌ Gerar PRD em background job (PM espera, vê streaming)

---

## 3. Variáveis de ambiente novas

Adicionar ao `.env.local` (frontend) e `.env` (backend):

```bash
# Backend
ANTHROPIC_API_KEY=sk-ant-...          # chave do ProductGen pra modelo default
PRD_DEFAULT_MODEL=claude-sonnet-4-5-20250929
PRD_MAX_TOKENS_OUTPUT=4096
PRD_TEMPERATURE=0.4                    # baixa, pra reduzir alucinação
PRD_TIMEOUT_MS=120000                  # 2 minutos
PRD_MONTHLY_LIMIT_DEFAULT=50          # limite default por workspace por mês

# Frontend
NEXT_PUBLIC_PRD_FEATURE_ENABLED=true  # feature flag pra ligar/desligar
```

---

## 4. Fases de implementação (8 fases sequenciais)

### Fase 0 — Verificação de pré-requisitos

**Antes de tocar em código, confirme:**

```bash
# 1. Banco rodando com schema atualizado
psql -h localhost -U postgres -d productgen -c "SELECT count(*) FROM information_schema.tables WHERE table_schema='public';"

# 2. Tabelas necessárias existem
psql -d productgen -c "\dt prd_drafts"  # vai falhar — vamos criar nesta feature
psql -d productgen -c "\dt roadmap_items"  # deve existir
psql -d productgen -c "\dt hypotheses"  # deve existir
psql -d productgen -c "\dt evidences"  # deve existir

# 3. Backend rodando
curl http://localhost:3001/health  # confirmar API up

# 4. Frontend rodando
curl http://localhost:3000  # confirmar Next.js up
```

**Reporte:**
1. Banco está rodando? Quais tabelas relevantes existem?
2. Backend está em qual porta? Qual framework (Fastify, Express, Hono)?
3. Frontend está em `web/`? Versão Next.js?
4. `ANTHROPIC_API_KEY` está disponível? Se não, o usuário precisa providenciar antes de continuar.

**Aguarde confirmação do usuário antes de seguir.**

---

### Fase 1 — Schema do banco

#### Tarefa 1.1 — Migration `prd_drafts`

Crie arquivo `migrations/00X_prd_drafts.sql` (numere conforme a sequência atual do projeto):

```sql
BEGIN;

-- Status de PRD
DO $$ BEGIN
    CREATE TYPE prd_status AS ENUM (
        'draft',        -- gerada, ainda não revisada
        'in_review',    -- em revisão por PM
        'approved',     -- aprovada
        'published',    -- compartilhada com eng
        'archived'      -- não usada mais
    );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS prd_drafts (
    id                      uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id            uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    product_id              uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    roadmap_item_id         uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
    
    -- Versionamento (incrementa a cada save explícito)
    version                 int NOT NULL DEFAULT 1,
    
    -- Autoria
    generated_by_user_id    uuid NOT NULL REFERENCES users(id),
    generated_at            timestamptz NOT NULL DEFAULT now(),
    last_edited_by_user_id  uuid REFERENCES users(id),
    last_edited_at          timestamptz,
    
    -- Contexto usado na geração (snapshot pra reproducibilidade)
    context_snapshot        jsonb NOT NULL,
    -- Estrutura:
    -- {
    --   "entity_ids": {
    --     "pillars": [...],
    --     "objectives": [...],
    --     "key_results": [...],
    --     "hypotheses": [...],
    --     "experiments": [...],
    --     "pains": [...],
    --     "evidences": [...],
    --     "personas": [...]
    --   },
    --   "params": {
    --     "style": "classic",
    --     "audience": "engineering",
    --     "language": "pt-BR"
    --   }
    -- }
    
    -- Conteúdo
    content_md              text NOT NULL,         -- markdown gerado pelo LLM (imutável após geração)
    content_edited_md       text,                  -- markdown após edição do PM (nullable até primeira edição)
    
    -- Status
    status                  prd_status NOT NULL DEFAULT 'draft',
    published_at            timestamptz,
    
    -- Métricas de LLM
    llm_provider            text NOT NULL DEFAULT 'anthropic',
    llm_model               text NOT NULL,
    prompt_tokens           int,
    completion_tokens       int,
    total_tokens            int GENERATED ALWAYS AS (COALESCE(prompt_tokens, 0) + COALESCE(completion_tokens, 0)) STORED,
    llm_cost_usd            numeric(10, 6),         -- custo estimado pra esse PRD
    generation_duration_ms  int,                    -- tempo total da geração
    
    -- Soft delete
    deleted_at              timestamptz
);

CREATE INDEX idx_prd_drafts_workspace ON prd_drafts(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prd_drafts_roadmap_item ON prd_drafts(roadmap_item_id, version DESC) WHERE deleted_at IS NULL;
CREATE INDEX idx_prd_drafts_generated_by ON prd_drafts(generated_by_user_id);
CREATE INDEX idx_prd_drafts_status ON prd_drafts(status) WHERE deleted_at IS NULL;

-- RLS
ALTER TABLE prd_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE prd_drafts FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prd_drafts_scope ON prd_drafts;
CREATE POLICY prd_drafts_scope ON prd_drafts
    USING (workspace_id = current_workspace_id());

-- Trigger pra atualizar last_edited_at quando content_edited_md muda
CREATE OR REPLACE FUNCTION update_prd_last_edited()
RETURNS trigger AS $$
BEGIN
    IF NEW.content_edited_md IS DISTINCT FROM OLD.content_edited_md THEN
        NEW.last_edited_at := now();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_prd_drafts_last_edited ON prd_drafts;
CREATE TRIGGER trg_prd_drafts_last_edited
    BEFORE UPDATE ON prd_drafts
    FOR EACH ROW EXECUTE FUNCTION update_prd_last_edited();

COMMIT;
```

#### Tarefa 1.2 — Migration `workspace_prd_usage`

Pra tracking de cota mensal:

```sql
BEGIN;

CREATE TABLE IF NOT EXISTS workspace_prd_usage (
    workspace_id    uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
    month_year      text NOT NULL,  -- formato '2026-01'
    prds_generated  int NOT NULL DEFAULT 0,
    monthly_limit   int NOT NULL DEFAULT 50,
    tokens_total    bigint NOT NULL DEFAULT 0,
    cost_usd_total  numeric(10, 4) NOT NULL DEFAULT 0,
    updated_at      timestamptz NOT NULL DEFAULT now(),
    PRIMARY KEY (workspace_id, month_year)
);

ALTER TABLE workspace_prd_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_prd_usage FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS workspace_prd_usage_scope ON workspace_prd_usage;
CREATE POLICY workspace_prd_usage_scope ON workspace_prd_usage
    USING (workspace_id = current_workspace_id());

CREATE INDEX idx_workspace_prd_usage_month ON workspace_prd_usage(month_year);

COMMIT;
```

#### Critérios de aceitação Fase 1

- [ ] Migrations rodadas com sucesso (`psql -d productgen -f migrations/00X_prd_drafts.sql`)
- [ ] `\dt prd_drafts` mostra tabela criada
- [ ] `\dt workspace_prd_usage` mostra tabela criada
- [ ] RLS está `forcerowsecurity = true` em ambas (consulte `pg_tables`)
- [ ] Indexes criados (consulte `\d prd_drafts`)
- [ ] Reporte o resultado e aguarde aprovação antes da Fase 2.

---

### Fase 2 — Templates de prompt

Crie estrutura de arquivos `prompts/prd/`:

```
prompts/
└── prd/
    ├── system.md              # instruções base (system prompt)
    └── classic.md             # template do estilo clássico
```

#### Tarefa 2.1 — `prompts/prd/system.md`

```markdown
Você é um Product Manager Sênior escrevendo uma PRD (Product Requirements Document) para um time de engenharia.

# Princípios obrigatórios

1. **Use APENAS informações do contexto fornecido em JSON.** Não invente dados, números, citações, datas, nomes ou qualquer outra informação não presente no contexto.

2. **Quando uma informação estiver ausente, declare explicitamente.** Exemplos:
   - "Sem evidências formais coletadas para esta dor — recomendação: validar com [persona] antes de iniciar."
   - "Hipótese ainda não validada por experimento — esta PRD assume risco de investir antes da validação."
   - "Métricas de baseline não disponíveis — eng deve instrumentar antes do release para permitir medição."

3. **Cite IDs específicos ao referenciar entidades**, no formato:
   - Evidências: "EV-XX"
   - Dores: "PN-XX"
   - Hipóteses: "HY-XX"
   - Experimentos: "EX-XX"

4. **Tom**: profissional, direto, factual. Português brasileiro técnico-formal. Evite jargão de marketing, hype, ou linguagem vaga ("alavancar", "disruptar", "delightful").

5. **Estrutura**: siga rigorosamente o template fornecido. Não adicione seções extras. Não omita seções obrigatórias.

6. **Tamanho**: PRD clássico tem entre 800 e 1500 palavras. Mais que isso vira ilegível; menos que isso vira raso.

7. **Não inclua datas absolutas** ("release em março de 2026") a não ser que estejam no contexto explicitamente.

8. **Não invente métricas numéricas.** Se o contexto diz "retenção D7 baseline 32%", use isso. Se não diz, escreva "[baseline a ser confirmado pelo time]".

9. **Markdown puro**: use apenas markdown padrão. Não use HTML, não use emojis, não use ASCII art.
```

#### Tarefa 2.2 — `prompts/prd/classic.md`

```markdown
# Contexto estruturado

{{ context_json }}

# Parâmetros de geração

- Estilo: clássico
- Audiência: engenharia
- Idioma: português brasileiro

# Estrutura do PRD

Gere o documento em markdown seguindo EXATAMENTE esta estrutura:

```
# {{ feature.title }}

## 1. Resumo executivo

[2-3 parágrafos. Deve responder: o quê está sendo proposto, para qual problema, qual outcome esperado. Mencionar a hipótese que sustenta a proposta com seu ID.]

## 2. Contexto estratégico

- **Pilar estratégico**: [nome do pilar, ou "Sem pilar vinculado — verificar alinhamento com leadership"]
- **Objective relacionado**: [nome do objective + seu KR principal]
- **Métrica-chave**: [KR específico que esta PRD pretende mover]

[1 parágrafo conectando esta entrega à estratégia: por que isso importa agora, como conecta com os outros esforços da empresa.]

## 3. Problema

### Dor principal

**PN-XX: [título da dor]**

- **Severidade**: X/5
- **Alcance estimado**: [reach number] usuários impactados
- **Personas afetadas**: [lista]

[Descrição da dor em 1-2 parágrafos. Inclua dados quantitativos se disponíveis.]

### Evidências que sustentam

[Liste as 3-5 evidências mais relevantes. Cada uma em uma linha:]

- **EV-XX** ([fonte]): [resumo curto, 1 frase]

[Se houver mais de 5, mencione: "Mais X evidências adicionais disponíveis no histórico desta dor."]

## 4. Solução proposta

### Hipótese

**HY-XX** (status: [validated/in_execution/etc])

> Se [if_clause], então [then_clause], porque [because_clause].

### Validação

[Se houve experimentos:]
**EX-XX**: [título do experimento]
- Critério de sucesso: [success_criteria]
- Resultado: [validated/invalidated/inconclusive] — [result_summary em 1 frase]

[Se NÃO houve experimentos:]
"Esta hipótese ainda não foi validada por experimento. Risco de invalidação durante ou após o desenvolvimento — equipe deve preparar plano de contingência."

## 5. Escopo

### Está no escopo

[3-5 bullets específicos e acionáveis. Use o que estiver no contexto da feature. Se não houver descrição clara, escreva:]

"Escopo detalhado a ser refinado em refinamento técnico. Componentes esperados com base no contexto:
- [inferência baseada no contexto]"

### NÃO está no escopo

[2-4 bullets do que explicitamente fica fora. Se não houver informação, escreva:]

"Limites de escopo a serem definidos em refinamento. Exemplos típicos a discutir:
- Funcionalidades adjacentes não cobertas pela hipótese validada
- Otimizações de performance além do mínimo necessário
- Integrações com sistemas não mencionados no contexto"

## 6. Critérios de aceitação

[3-7 bullets. Cada um observable e testable. Formato "Dado X, quando Y, então Z" quando aplicável.]

[Se faltar informação detalhada:]

"Critérios detalhados a definir junto com tech lead em refinamento. Critérios mínimos baseados na hipótese:
- [derivar do success_criteria do experimento]"

## 7. Métricas de sucesso (outcomes)

### Métrica primária

- **Métrica**: [nome do KR]
- **Baseline atual**: [valor atual ou "a confirmar"]
- **Target**: [valor target do KR]
- **Janela de medição**: 30 dias após release em produção

### Métricas secundárias

[Liste se houver outras métricas relevantes no contexto. Senão omita esta subseção.]

### Como será medido

[1 parágrafo: como o time de produto pretende medir. Mencione instrumentação necessária se não houver evidência de baseline.]

## 8. Considerações técnicas

[Apenas se houver informação no contexto. Cobre:]

- **Integrações externas mencionadas**: [Jira, Linear, etc do contexto]
- **Dados sensíveis envolvidos**: [se relevante]
- **Dependências de outras features/iniciativas**: [se mencionadas]

[Se não houver dado, escreva:]

"Considerações técnicas detalhadas a serem definidas pelo tech lead em refinamento. Pontos para discutir:
- Performance esperada e SLAs
- Modelos de dados afetados
- Estratégia de migration/backfill (se aplicável)
- Estratégia de feature flag/rollout"

## 9. Riscos e mitigações

[2-4 riscos identificáveis do contexto. Cada um com mitigação proposta.]

[Sempre inclua, se aplicável:]

- **Risco**: Hipótese ainda não validada por experimento.
  **Mitigação**: Lançar com feature flag controlada, instrumentação detalhada, e plano de rollback claro.

[Se não houver informação concreta:]

"Riscos detalhados a serem mapeados em refinamento. Riscos típicos a considerar:
- Inversão de tendência inesperada nos KRs
- Custo de implementação maior que o estimado
- Resistência de personas não mapeadas no discovery"

## 10. Próximos passos

- [ ] Refinamento técnico com tech lead
- [ ] Definição de critérios de aceitação detalhados
- [ ] [outras ações específicas baseadas em gaps identificados acima]

---

**Versão**: 1.0 (gerada por IA)
**Gerada em**: [data — não inventar, deixar como placeholder]
**Owner**: {{ feature.owner.name }}
```

# Lembre-se

- Mencione gaps de informação explicitamente, não preencha com suposições
- Use apenas dados do contexto
- Mantenha em ~1000-1500 palavras
- Markdown puro, sem HTML
- Português brasileiro técnico
```

#### Critérios de aceitação Fase 2

- [ ] Arquivos `prompts/prd/system.md` e `prompts/prd/classic.md` criados
- [ ] Conteúdo idêntico ao especificado acima
- [ ] Estrutura de pastas `prompts/prd/` criada
- [ ] Reporte e aguarde aprovação.

---

### Fase 3 — Coletor de contexto (backend)

Crie módulo backend `src/services/prd-context.ts` (ajuste path conforme estrutura existente).

#### Tarefa 3.1 — Interface do contexto

Definir tipos TypeScript no início do arquivo:

```ts
export interface PRDContext {
  feature: {
    id: string;
    type: 'feature';
    title: string;
    description: string | null;
    status: string;
    owner: { id: string; name: string; email: string } | null;
    external_jira_key: string | null;
    estimated_effort: string | null;
    target_quarter: string | null;
  };
  
  parent_epic: {
    id: string;
    title: string;
    description: string | null;
  } | null;
  
  parent_initiative: {
    id: string;
    title: string;
    description: string | null;
    linked_pillars: Array<{ id: string; name: string }>;
  } | null;
  
  strategic_pillars: Array<{
    id: string;
    name: string;
    description: string | null;
  }>;
  
  objectives_and_krs: Array<{
    id: string;
    scope: 'workspace' | 'product';
    objective: string;
    status: string;
    krs: Array<{
      id: string;
      name: string;
      current_value: number | null;
      target_value: number | null;
      unit: string | null;
    }>;
  }>;
  
  hypotheses: Array<{
    id: string;
    short_id: string;          // ex: "HY-12"
    if_clause: string;
    then_clause: string;
    because_clause: string;
    status: string;
    validation_date: string | null;
    linked_experiment_ids: string[];
  }>;
  
  experiments: Array<{
    id: string;
    short_id: string;          // ex: "EX-7"
    title: string;
    hypothesis_id: string;
    success_criteria: string;
    result: 'validated' | 'invalidated' | 'inconclusive' | null;
    result_summary: string | null;
    completed_at: string | null;
  }>;
  
  pains_addressed: Array<{
    id: string;
    short_id: string;          // ex: "PN-04"
    title: string;
    description: string | null;
    severity: number;
    reach: number | null;
    affected_persona_ids: string[];
    discard_reason: string | null;
  }>;
  
  evidences: Array<{
    id: string;
    short_id: string;          // ex: "EV-23"
    source: string;
    summary: string;
    captured_at: string;
    captured_by: { name: string } | null;
    attachments: Array<{
      type: string;             // 'pdf' | 'image' | 'doc' | 'link' | etc
      name: string;
      url: string | null;       // não inclua URL real, apenas filename pra MVP
    }>;
  }>;
  
  affected_personas: Array<{
    id: string;
    name: string;
    description: string | null;
    segment_size_estimate: number | null;
  }>;
}
```

#### Tarefa 3.2 — Função `gatherPRDContext`

```ts
export async function gatherPRDContext(
  db: DatabaseClient,  // ajuste conforme cliente Postgres do projeto
  roadmapItemId: string
): Promise<PRDContext> {
  // 1. Validar que é feature
  const feature = await db.query(`
    SELECT 
      r.id, r.type, r.title, r.description, r.status,
      r.external_jira_key, r.estimated_effort, r.target_quarter,
      r.parent_id, r.product_id, r.workspace_id,
      u.id as owner_id, u.name as owner_name, u.email as owner_email
    FROM roadmap_items r
    LEFT JOIN users u ON u.id = r.owner_user_id
    WHERE r.id = $1 AND r.deleted_at IS NULL
  `, [roadmapItemId]);
  
  if (!feature.rows[0]) {
    throw new Error(`Roadmap item ${roadmapItemId} not found`);
  }
  
  if (feature.rows[0].type !== 'feature') {
    throw new Error(
      `PRD generation supported only for features in MVP. Got type: ${feature.rows[0].type}`
    );
  }
  
  const featureRow = feature.rows[0];
  
  // 2. Queries paralelas pra performance
  const [
    parentEpic,
    parentInitiative,
    hypotheses,
    experiments,
    pains,
    evidences,
    objectives,
    pillars,
    personas
  ] = await Promise.all([
    fetchParentEpic(db, featureRow.parent_id),
    fetchParentInitiative(db, featureRow.parent_id),  // sobe a árvore via ltree
    fetchLinkedHypotheses(db, roadmapItemId),
    fetchLinkedExperiments(db, roadmapItemId),
    fetchAddressedPains(db, roadmapItemId),
    fetchEvidences(db, roadmapItemId),
    fetchLinkedObjectivesAndKRs(db, roadmapItemId),
    fetchLinkedPillars(db, roadmapItemId),
    fetchAffectedPersonas(db, roadmapItemId)
  ]);
  
  return {
    feature: { /* mapping ... */ },
    parent_epic: parentEpic,
    parent_initiative: parentInitiative,
    strategic_pillars: pillars,
    objectives_and_krs: objectives,
    hypotheses,
    experiments,
    pains_addressed: pains,
    evidences,
    affected_personas: personas
  };
}
```

#### Tarefa 3.3 — Implementar as funções de fetch

**Importante**: cada função usa queries SQL específicas seguindo o schema do projeto. Use os JOINs e tabelas N:M existentes:

- `fetchLinkedHypotheses`: JOIN com `hypothesis_roadmap_links`
- `fetchLinkedExperiments`: JOIN com `hypothesis_roadmap_links` → `experiments` (via hipóteses ligadas)
- `fetchAddressedPains`: JOIN com `pain_hypothesis_links` → `pains` (via hipóteses ligadas à feature)
- `fetchEvidences`: JOIN com `pain_hypothesis_links` → `pains` → `evidence_pain_links` → `evidences`
- `fetchLinkedObjectivesAndKRs`: JOIN com `roadmap_key_result_links` → `key_results` → `objectives`
- `fetchLinkedPillars`: JOIN com `roadmap_pillar_links` → `strategic_pillars`
- `fetchAffectedPersonas`: JOIN com pains acima → `pain_persona_links` → `personas`

**Limites**:
- Máximo 5 evidências por dor (ordenadas por `captured_at DESC`)
- Máximo 10 dores
- Máximo 5 hipóteses
- Máximo 5 experimentos
- Máximo 5 personas

Se exceder os limites, ordene por relevância (severidade pra dores, status pra hipóteses, date pra evidências) e trunque, mas inclua no JSON um campo `_truncated: true` pra o LLM saber.

#### Critérios de aceitação Fase 3

- [ ] Arquivo `prd-context.ts` criado com tipos + função principal + 9 fetchers
- [ ] Executar `gatherPRDContext(db, 'feature-id-seed')` com feature de teste retorna JSON válido
- [ ] Validar manualmente: feature retornada tem campos preenchidos quando esperado, ou null quando faltam dados
- [ ] Teste unitário simples (ao menos 1): "gathering context for feature with no hypotheses returns empty array, not null"
- [ ] Reporte e aguarde aprovação.

---

### Fase 4 — Gerador de PRD (backend, integração com Anthropic)

Crie módulo `src/services/prd-generator.ts`.

#### Tarefa 4.1 — Setup do cliente Anthropic

```ts
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

const DEFAULT_MODEL = process.env.PRD_DEFAULT_MODEL ?? 'claude-sonnet-4-5-20250929';
const MAX_TOKENS = parseInt(process.env.PRD_MAX_TOKENS_OUTPUT ?? '4096');
const TEMPERATURE = parseFloat(process.env.PRD_TEMPERATURE ?? '0.4');
```

#### Tarefa 4.2 — Função `generatePRD` com streaming

```ts
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import nunjucks from 'nunjucks';

interface GeneratePRDParams {
  context: PRDContext;
  style: 'classic';        // MVP só suporta 'classic'
  audience: 'engineering'; // MVP só suporta 'engineering'
  language: 'pt-BR';       // MVP só suporta 'pt-BR'
}

interface GenerationResult {
  content_md: string;
  prompt_tokens: number;
  completion_tokens: number;
  model: string;
  duration_ms: number;
}

// Streaming callback type
type OnChunkCallback = (chunk: string) => void;

export async function generatePRD(
  params: GeneratePRDParams,
  onChunk: OnChunkCallback
): Promise<GenerationResult> {
  const startTime = Date.now();
  
  // 1. Carregar templates
  const systemPrompt = await readFile(
    path.resolve('prompts/prd/system.md'),
    'utf-8'
  );
  
  const templatePath = path.resolve(`prompts/prd/${params.style}.md`);
  const templateRaw = await readFile(templatePath, 'utf-8');
  
  // 2. Renderizar template com contexto (substitui {{ context_json }} etc)
  const userPrompt = nunjucks.renderString(templateRaw, {
    context_json: JSON.stringify(params.context, null, 2),
    feature: params.context.feature,
  });
  
  // 3. Chamar Anthropic com streaming
  let fullContent = '';
  let promptTokens = 0;
  let completionTokens = 0;
  
  const stream = await client.messages.stream({
    model: DEFAULT_MODEL,
    max_tokens: MAX_TOKENS,
    temperature: TEMPERATURE,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });
  
  // 4. Acumular chunks e chamar callback
  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
      const text = chunk.delta.text;
      fullContent += text;
      onChunk(text);
    }
  }
  
  // 5. Pegar usage final
  const finalMessage = await stream.finalMessage();
  promptTokens = finalMessage.usage.input_tokens;
  completionTokens = finalMessage.usage.output_tokens;
  
  return {
    content_md: fullContent,
    prompt_tokens: promptTokens,
    completion_tokens: completionTokens,
    model: DEFAULT_MODEL,
    duration_ms: Date.now() - startTime,
  };
}

// Helper pra calcular custo estimado em USD
export function estimateCostUSD(
  model: string,
  promptTokens: number,
  completionTokens: number
): number {
  // Tabela de preços por 1M tokens (Anthropic) — atualizar conforme tabela vigente
  const pricing: Record<string, { input: number; output: number }> = {
    'claude-sonnet-4-5-20250929': { input: 3.00, output: 15.00 },
    'claude-opus-4-5-20250101':   { input: 15.00, output: 75.00 },
  };
  
  const p = pricing[model] ?? pricing['claude-sonnet-4-5-20250929'];
  return (promptTokens * p.input + completionTokens * p.output) / 1_000_000;
}
```

**Importante**: confirmar nomes exatos dos modelos disponíveis na Anthropic ao implementar — usar o que estiver vigente no momento.

#### Tarefa 4.3 — Validação de cota mensal

Criar função `checkAndIncrementQuota`:

```ts
export async function checkAndIncrementQuota(
  db: DatabaseClient,
  workspaceId: string
): Promise<{ allowed: boolean; current: number; limit: number; month: string }> {
  const month = new Date().toISOString().slice(0, 7);  // '2026-01'
  
  // Upsert: cria row se não existe, retorna current
  const result = await db.query(`
    INSERT INTO workspace_prd_usage (workspace_id, month_year, prds_generated, monthly_limit)
    VALUES ($1, $2, 0, $3)
    ON CONFLICT (workspace_id, month_year) DO NOTHING
    RETURNING prds_generated, monthly_limit;
  `, [workspaceId, month, parseInt(process.env.PRD_MONTHLY_LIMIT_DEFAULT ?? '50')]);
  
  // Se não retornou (row já existia), busca
  const existing = result.rows[0] ?? (await db.query(`
    SELECT prds_generated, monthly_limit
    FROM workspace_prd_usage
    WHERE workspace_id = $1 AND month_year = $2
  `, [workspaceId, month])).rows[0];
  
  if (existing.prds_generated >= existing.monthly_limit) {
    return {
      allowed: false,
      current: existing.prds_generated,
      limit: existing.monthly_limit,
      month
    };
  }
  
  // Incrementa contador
  await db.query(`
    UPDATE workspace_prd_usage
    SET prds_generated = prds_generated + 1, updated_at = now()
    WHERE workspace_id = $1 AND month_year = $2
  `, [workspaceId, month]);
  
  return {
    allowed: true,
    current: existing.prds_generated + 1,
    limit: existing.monthly_limit,
    month
  };
}
```

#### Critérios de aceitação Fase 4

- [ ] Arquivo `prd-generator.ts` criado com 3 funções principais
- [ ] Teste manual: chamar `generatePRD()` com contexto de seed, ver stream funcionar no console
- [ ] Validar que custo retornado bate com cálculo manual (token count * pricing)
- [ ] Validar que `checkAndIncrementQuota` retorna allowed=false após atingir limite
- [ ] Reporte e aguarde aprovação.

---

### Fase 5 — Endpoints da API

Criar 4 endpoints no backend.

#### Tarefa 5.1 — `POST /api/roadmap-items/:id/generate-prd`

Endpoint principal. Recebe parâmetros, valida cota, gera com streaming SSE.

```ts
app.post('/api/roadmap-items/:id/generate-prd', async (req, res) => {
  const userId = req.user.id;
  const workspaceId = req.workspace.id;
  const roadmapItemId = req.params.id;
  
  // 1. Validar permissão (user pode escrever na feature)
  const canWrite = await canUserAccessProduct(
    userId, 
    /* product_id from roadmap_item */ ..., 
    'write'
  );
  if (!canWrite) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  
  // 2. Validar cota
  const quota = await checkAndIncrementQuota(db, workspaceId);
  if (!quota.allowed) {
    return res.status(429).json({
      error: 'MONTHLY_QUOTA_EXCEEDED',
      current: quota.current,
      limit: quota.limit,
      month: quota.month,
      message: `Limite mensal de ${quota.limit} PRDs atingido para ${quota.month}. Aguarde o próximo mês ou contate billing.`
    });
  }
  
  // 3. Coletar contexto
  let context;
  try {
    context = await gatherPRDContext(db, roadmapItemId);
  } catch (err) {
    // Rollback do contador (decrementa)
    await rollbackQuota(db, workspaceId, quota.month);
    return res.status(400).json({ error: 'CONTEXT_GATHER_FAILED', message: err.message });
  }
  
  // 4. Setup SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  
  // 5. Stream da geração
  let fullContent = '';
  try {
    const result = await generatePRD(
      {
        context,
        style: 'classic',
        audience: 'engineering',
        language: 'pt-BR'
      },
      (chunk) => {
        fullContent += chunk;
        res.write(`data: ${JSON.stringify({ type: 'chunk', text: chunk })}\n\n`);
      }
    );
    
    // 6. Persistir resultado
    const draftId = crypto.randomUUID();
    const cost = estimateCostUSD(result.model, result.prompt_tokens, result.completion_tokens);
    
    await db.query(`
      INSERT INTO prd_drafts (
        id, workspace_id, product_id, roadmap_item_id,
        version, generated_by_user_id,
        context_snapshot, content_md,
        llm_provider, llm_model,
        prompt_tokens, completion_tokens, llm_cost_usd, generation_duration_ms
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
    `, [
      draftId, workspaceId, /* product_id */, roadmapItemId,
      1, userId,
      JSON.stringify({ entity_ids: extractIds(context), params: { style: 'classic', audience: 'engineering', language: 'pt-BR' }}),
      result.content_md,
      'anthropic', result.model,
      result.prompt_tokens, result.completion_tokens, cost, result.duration_ms
    ]);
    
    // Atualizar usage com tokens e custo
    await db.query(`
      UPDATE workspace_prd_usage
      SET tokens_total = tokens_total + $1, cost_usd_total = cost_usd_total + $2
      WHERE workspace_id = $3 AND month_year = $4
    `, [result.prompt_tokens + result.completion_tokens, cost, workspaceId, quota.month]);
    
    // 7. Sinalizar conclusão via SSE
    res.write(`data: ${JSON.stringify({ type: 'done', draftId, content: result.content_md })}\n\n`);
    res.end();
    
    // 8. Audit log
    await logEvent(db, {
      workspace_id: workspaceId,
      event_type: 'prd_generated',
      actor_user_id: userId,
      target_id: draftId,
      target_type: 'prd_draft',
      metadata: { roadmap_item_id: roadmapItemId, model: result.model, cost_usd: cost }
    });
    
  } catch (err) {
    res.write(`data: ${JSON.stringify({ type: 'error', message: err.message })}\n\n`);
    res.end();
    
    // Rollback quota
    await rollbackQuota(db, workspaceId, quota.month);
  }
});
```

#### Tarefa 5.2 — `GET /api/roadmap-items/:id/prds`

Lista PRDs de uma feature, ordenadas por versão decrescente.

```ts
app.get('/api/roadmap-items/:id/prds', async (req, res) => {
  // Permissão de leitura
  const canRead = await canUserAccessProduct(req.user.id, /* product_id */, 'read');
  if (!canRead) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  
  const result = await db.query(`
    SELECT 
      id, version, status, generated_by_user_id, generated_at,
      last_edited_by_user_id, last_edited_at, published_at,
      llm_model, total_tokens
    FROM prd_drafts
    WHERE roadmap_item_id = $1 AND deleted_at IS NULL
    ORDER BY version DESC
  `, [req.params.id]);
  
  res.json({ prds: result.rows });
});
```

#### Tarefa 5.3 — `GET /api/prds/:id`

Retorna conteúdo completo de um PRD específico.

```ts
app.get('/api/prds/:id', async (req, res) => {
  const result = await db.query(`
    SELECT * FROM prd_drafts WHERE id = $1 AND deleted_at IS NULL
  `, [req.params.id]);
  
  if (!result.rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  
  // Permissão
  const draft = result.rows[0];
  const canRead = await canUserAccessProduct(req.user.id, draft.product_id, 'read');
  if (!canRead) return res.status(403).json({ error: 'PERMISSION_DENIED' });
  
  res.json(draft);
});
```

#### Tarefa 5.4 — `PATCH /api/prds/:id`

Atualizar `content_edited_md` ou `status`. Cria nova versão se conteúdo mudou significativamente (>50% diff) OU se for save explícito via flag `new_version=true`.

```ts
app.patch('/api/prds/:id', async (req, res) => {
  const { content_edited_md, status, new_version } = req.body;
  
  // Permissão de escrita
  // ... validação
  
  const existing = await db.query(`SELECT * FROM prd_drafts WHERE id = $1`, [req.params.id]);
  if (!existing.rows[0]) return res.status(404).json({ error: 'NOT_FOUND' });
  
  const draft = existing.rows[0];
  
  if (new_version === true) {
    // Cria nova versão (insert) ao invés de update
    const newId = crypto.randomUUID();
    await db.query(`
      INSERT INTO prd_drafts (
        id, workspace_id, product_id, roadmap_item_id, version,
        generated_by_user_id, context_snapshot, content_md, content_edited_md, status,
        llm_provider, llm_model
      )
      SELECT $1, workspace_id, product_id, roadmap_item_id, version + 1,
             generated_by_user_id, context_snapshot, content_md, $2, $3,
             llm_provider, llm_model
      FROM prd_drafts WHERE id = $4
    `, [newId, content_edited_md, status, req.params.id]);
    return res.json({ id: newId });
  }
  
  // Update simples
  await db.query(`
    UPDATE prd_drafts
    SET content_edited_md = COALESCE($1, content_edited_md),
        status = COALESCE($2, status),
        last_edited_by_user_id = $3
    WHERE id = $4
  `, [content_edited_md, status, req.user.id, req.params.id]);
  
  res.json({ ok: true });
});
```

#### Critérios de aceitação Fase 5

- [ ] 4 endpoints criados e acessíveis
- [ ] Teste com cURL: `POST /api/roadmap-items/SEED_ID/generate-prd` retorna SSE stream
- [ ] PRD persistido em `prd_drafts` após geração
- [ ] `GET /api/roadmap-items/:id/prds` retorna lista
- [ ] `GET /api/prds/:id` retorna conteúdo completo
- [ ] `PATCH /api/prds/:id` atualiza ou cria versão nova
- [ ] Cota mensal validada (testar atingindo 50)
- [ ] Reporte e aguarde aprovação.

---

### Fase 6 — UI: Botão e Modal de geração

Frontend Next.js. Criar componentes em `web/components/prd/`.

#### Tarefa 6.1 — Botão "Gerar PRD" no detalhe da feature

Adicionar no detalhe de `roadmap_item` quando `type === 'feature'`:

```tsx
// web/components/roadmap/feature-detail-actions.tsx
import { FileText } from 'lucide-react';

export function FeatureDetailActions({ feature }: { feature: RoadmapItem }) {
  const [generateModalOpen, setGenerateModalOpen] = useState(false);
  const { can } = usePermissions();
  
  if (feature.type !== 'feature') return null;
  
  return (
    <>
      {can('roadmap_item.update') && (
        <button
          onClick={() => setGenerateModalOpen(true)}
          className="flex items-center gap-2 h-10 px-4 rounded-lg"
          style={{
            backgroundColor: '#ffffff',
            border: '1px solid #dde0e8',
            color: '#2b364a',
            fontSize: 14,
            fontWeight: 500,
          }}
        >
          <FileText size={16} style={{ color: '#13c8b5' }} />
          Gerar PRD
        </button>
      )}
      
      <GeneratePRDModal
        open={generateModalOpen}
        onClose={() => setGenerateModalOpen(false)}
        feature={feature}
      />
    </>
  );
}
```

#### Tarefa 6.2 — Modal de preview de contexto

Antes de gerar, mostra o que vai ser usado. Permite ao PM ver, mas no MVP **não permite desmarcar** (mantém simples).

```tsx
// web/components/prd/generate-prd-modal.tsx
export function GeneratePRDModal({ open, onClose, feature }) {
  const { data: contextPreview, isLoading } = useQuery({
    queryKey: ['prd-context-preview', feature.id],
    queryFn: () => api.get(`/api/roadmap-items/${feature.id}/prd-context-preview`),
    enabled: open,
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  
  if (!open) return null;
  
  return (
    <Modal title="Gerar PRD com IA" onClose={onClose}>
      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: '#2b364a' }}>
          Contexto que será usado
        </h3>
        <p className="text-sm mb-4" style={{ color: '#6b7287' }}>
          A IA vai usar todo o histórico vinculado a esta feature para gerar o PRD.
        </p>
        
        {/* Chips com contagens */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <ContextChip icon={Lightbulb} label="Evidências" count={contextPreview?.evidence_count} />
          <ContextChip icon={AlertCircle} label="Dores" count={contextPreview?.pain_count} />
          <ContextChip icon={FlaskConical} label="Hipóteses" count={contextPreview?.hypothesis_count} />
          <ContextChip icon={Edit} label="Experimentos" count={contextPreview?.experiment_count} />
          <ContextChip icon={Target} label="OKRs" count={contextPreview?.okr_count} />
          <ContextChip icon={Columns3} label="Pilares" count={contextPreview?.pillar_count} />
        </div>
        
        {contextPreview && contextPreview.warnings?.length > 0 && (
          <div
            className="rounded-md p-4 mb-4"
            style={{
              backgroundColor: 'rgba(245, 158, 11, 0.06)',
              border: '1px solid rgba(245, 158, 11, 0.20)',
            }}
          >
            <div className="flex items-start gap-2">
              <AlertTriangle size={16} style={{ color: '#f59e0b', marginTop: 2 }} />
              <div className="text-sm" style={{ color: '#f59e0b' }}>
                <strong>Atenção:</strong>
                <ul className="mt-1 list-disc list-inside">
                  {contextPreview.warnings.map(w => <li key={w}>{w}</li>)}
                </ul>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="...ghost button">Cancelar</button>
          <button
            onClick={() => {
              setIsGenerating(true);
              onClose();
              // navega pra tela de generation com streaming
              router.push(`/products/${feature.product_id}/roadmap/${feature.id}/prd/new`);
            }}
            className="...primary button"
            disabled={isLoading}
          >
            Gerar PRD
          </button>
        </div>
      </div>
    </Modal>
  );
}
```

**Endpoint adicional necessário** (incluir na Fase 5):

```ts
// GET /api/roadmap-items/:id/prd-context-preview
// Retorna contagens e warnings sem chamar LLM
{
  evidence_count: 8,
  pain_count: 2,
  hypothesis_count: 1,
  experiment_count: 1,
  okr_count: 1,
  pillar_count: 1,
  warnings: [
    "Hipótese ainda não validada — PRD será gerado mas com aviso de risco",
    "Sem experimentos registrados — sem dados de validação para incluir"
  ]
}
```

#### Tarefa 6.3 — Página de geração com streaming

Nova rota `/products/[productId]/roadmap/[featureId]/prd/new`:

```tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function GeneratePRDPage() {
  const { featureId, productId } = useParams();
  const router = useRouter();
  const [content, setContent] = useState('');
  const [status, setStatus] = useState<'connecting' | 'streaming' | 'done' | 'error'>('connecting');
  const [draftId, setDraftId] = useState<string | null>(null);
  
  useEffect(() => {
    const url = `/api/roadmap-items/${featureId}/generate-prd`;
    
    // POST com SSE — usar fetch streaming
    const controller = new AbortController();
    
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      signal: controller.signal,
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json();
        setStatus('error');
        return;
      }
      
      const reader = response.body!.getReader();
      const decoder = new TextDecoder();
      setStatus('streaming');
      
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        
        buffer += decoder.decode(value, { stream: true });
        
        // Parse SSE events
        const events = buffer.split('\n\n');
        buffer = events.pop() ?? '';
        
        for (const event of events) {
          if (!event.startsWith('data: ')) continue;
          const data = JSON.parse(event.slice(6));
          
          if (data.type === 'chunk') {
            setContent(prev => prev + data.text);
          } else if (data.type === 'done') {
            setDraftId(data.draftId);
            setStatus('done');
          } else if (data.type === 'error') {
            setStatus('error');
          }
        }
      }
    });
    
    return () => controller.abort();
  }, [featureId]);
  
  // Quando terminar, redireciona pro editor
  useEffect(() => {
    if (status === 'done' && draftId) {
      router.replace(`/products/${productId}/roadmap/${featureId}/prd/${draftId}`);
    }
  }, [status, draftId]);
  
  return (
    <div className="max-w-4xl mx-auto py-12">
      <div className="mb-6">
        <h1
          className="text-2xl font-semibold mb-2"
          style={{ color: '#2b364a', letterSpacing: '-0.02em' }}
        >
          Gerando PRD com IA...
        </h1>
        <p className="text-sm" style={{ color: '#6b7287' }}>
          A IA está analisando todo o histórico vinculado e escrevendo o documento.
          Isso pode levar 30-60 segundos.
        </p>
      </div>
      
      {/* Indicador de progresso */}
      {status === 'streaming' && (
        <div className="flex items-center gap-2 mb-4 text-sm" style={{ color: '#13c8b5' }}>
          <Loader2 size={14} className="animate-spin" />
          <span>Escrevendo...</span>
        </div>
      )}
      
      {/* Preview do markdown em streaming */}
      <div
        className="rounded-xl p-8 prose prose-sm max-w-none"
        style={{
          backgroundColor: '#ffffff',
          border: '1px solid #dde0e8',
          minHeight: 400,
        }}
      >
        <pre className="whitespace-pre-wrap font-sans text-sm" style={{ color: '#2b364a' }}>
          {content || (status === 'connecting' ? 'Conectando...' : '')}
        </pre>
      </div>
      
      {status === 'error' && (
        <div
          className="mt-4 rounded-md p-4 text-sm"
          style={{
            backgroundColor: 'rgba(220, 38, 38, 0.06)',
            border: '1px solid rgba(220, 38, 38, 0.20)',
            color: '#dc2626',
          }}
        >
          Erro ao gerar PRD. Tente novamente em alguns minutos.
        </div>
      )}
    </div>
  );
}
```

#### Critérios de aceitação Fase 6

- [ ] Botão "Gerar PRD" aparece no detalhe de feature
- [ ] Modal abre mostrando contagens corretas do contexto
- [ ] Warnings aparecem quando hipótese não validada
- [ ] Clicar "Gerar" navega pra tela de streaming
- [ ] Tela de streaming mostra texto sendo escrito em tempo real
- [ ] Após `done`, navega automaticamente pro editor
- [ ] Reporte e aguarde aprovação.

---

### Fase 7 — Editor inline com Tiptap

Página `/products/[productId]/roadmap/[featureId]/prd/[draftId]`.

#### Tarefa 7.1 — Setup do Tiptap

```bash
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-link marked turndown
```

#### Tarefa 7.2 — Componente PRDEditor

```tsx
'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import { marked } from 'marked';
import TurndownService from 'turndown';

const turndown = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
});

export function PRDEditor({
  initialMarkdown,
  onSave,
}: {
  initialMarkdown: string;
  onSave: (markdown: string, newVersion: boolean) => Promise<void>;
}) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Link.configure({ openOnClick: false }),
    ],
    content: marked.parse(initialMarkdown),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none',
      },
    },
  });
  
  const handleSave = async (newVersion: boolean) => {
    if (!editor) return;
    const html = editor.getHTML();
    const markdown = turndown.turndown(html);
    await onSave(markdown, newVersion);
  };
  
  return (
    <div>
      {/* Toolbar simples */}
      <EditorToolbar editor={editor} />
      
      {/* Editor */}
      <div
        className="rounded-xl p-8"
        style={{ backgroundColor: '#ffffff', border: '1px solid #dde0e8' }}
      >
        <EditorContent editor={editor} />
      </div>
      
      {/* Actions */}
      <div className="flex justify-end gap-3 mt-4">
        <button
          onClick={() => handleSave(false)}
          className="ghost"
        >
          Salvar
        </button>
        <button
          onClick={() => handleSave(true)}
          className="primary"
        >
          Salvar como nova versão
        </button>
      </div>
    </div>
  );
}
```

#### Tarefa 7.3 — Tela completa de visualização/edição

Junta header + editor + sidebar com versões + actions.

Estrutura:

```
┌─────────────────────────────────────────────────────────────────┐
│ Header: breadcrumb + título PRD + status + actions               │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────┬───────────────┐   │
│  │  Editor Tiptap (markdown)                │  Sidebar:     │   │
│  │                                          │  - Versões    │   │
│  │  # Feature Title                          │  - Contexto   │   │
│  │  ## Resumo Executivo                      │    usado      │   │
│  │  ...                                      │  - Métricas   │   │
│  │                                          │    (tokens,   │   │
│  │                                          │     custo)    │   │
│  └──────────────────────────────────────────┴───────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

#### Critérios de aceitação Fase 7

- [ ] Editor abre com conteúdo do `content_md` (ou `content_edited_md` se existe)
- [ ] Edição inline funciona (negrito, itálico, headings, lists, links)
- [ ] "Salvar" persiste em `content_edited_md` da versão atual
- [ ] "Salvar como nova versão" cria entry novo em `prd_drafts` com `version + 1`
- [ ] Sidebar de versões funciona (clica em v1, v2, v3, troca conteúdo)
- [ ] Sidebar de contexto lista entidades usadas com links pra elas
- [ ] Botão "Copiar markdown" copia conteúdo pra clipboard
- [ ] Reporte e aguarde aprovação.

---

### Fase 8 — Testes e polish

#### Tarefa 8.1 — Testes manuais (checklist)

Crie em `docs/PRD_QA_CHECKLIST.md`:

```markdown
# QA — Geração de PRD com IA

## Fluxo feliz
- [ ] Feature com hipótese validada + experimento + 5 evidências + 1 dor + 1 OKR
- [ ] Clicar "Gerar PRD" → modal mostra contagens corretas
- [ ] Confirmar → tela de streaming aparece, texto flui
- [ ] PRD gerado tem ~1000-1500 palavras
- [ ] Todas as 10 seções estão presentes
- [ ] IDs citados (PN-XX, HY-XX, EX-XX, EV-XX) batem com entidades reais
- [ ] Sem invenção de números

## Fluxos com gaps
- [ ] Feature sem hipótese → PRD gera com aviso "Sem hipótese validada"
- [ ] Feature sem evidências → PRD gera com aviso "Sem evidências formais"
- [ ] Feature sem OKR → seção 2 menciona "Sem objetivo vinculado"

## Edge cases
- [ ] Feature com type=epic → endpoint retorna 400 "PRD only supported for features"
- [ ] User sem permissão de escrita → 403
- [ ] Workspace com cota esgotada → 429 com mensagem clara

## Editor
- [ ] Editar texto, salvar → conteúdo persiste
- [ ] Recarregar página → conteúdo editado aparece
- [ ] Salvar como nova versão → v2 criada, v1 mantida
- [ ] Trocar entre v1, v2, v3 na sidebar → conteúdo certo aparece

## Performance
- [ ] Geração total < 90 segundos pra feature com contexto médio
- [ ] Streaming começa em < 3 segundos
- [ ] Sem timeout durante streaming
```

#### Tarefa 8.2 — Logging e métricas

Adicionar logs estruturados em pontos-chave:

```ts
logger.info('prd.generation.started', { workspace_id, user_id, roadmap_item_id });
logger.info('prd.generation.completed', { draft_id, tokens, cost_usd, duration_ms });
logger.warn('prd.quota.exceeded', { workspace_id, current, limit });
logger.error('prd.generation.failed', { error, roadmap_item_id });
```

#### Tarefa 8.3 — Documentação

Criar `docs/PRD_FEATURE.md` com:
- Como funciona (visão usuário)
- Arquitetura técnica (visão dev)
- Como adicionar template novo
- Como adicionar provider novo de LLM
- Troubleshooting comum

#### Critérios de aceitação Fase 8

- [ ] QA checklist passa 100%
- [ ] Logs aparecem em console/logger configurado
- [ ] Documentação criada
- [ ] PR final aberto pro usuário revisar
- [ ] Reporte e aguarde aprovação final.

---

## 5. Resumo executivo do plano

| Fase | Objetivo | Tempo estimado | Bloqueia próxima? |
|---|---|---|---|
| 0 | Verificação de pré-requisitos | 15 min | Sim |
| 1 | Schema `prd_drafts` + `workspace_prd_usage` | 30 min | Sim |
| 2 | Templates de prompt em arquivos | 20 min | Sim |
| 3 | Coletor de contexto (backend) | 2-3h | Sim |
| 4 | Gerador com Anthropic SDK + streaming | 2h | Sim |
| 5 | 4 endpoints da API | 2-3h | Sim |
| 6 | UI: botão + modal + tela de streaming | 2-3h | Sim |
| 7 | Editor Tiptap com versionamento | 3-4h | Sim |
| 8 | Testes + logging + docs | 2h | — |

**Total estimado**: 15-20 horas de implementação, distribuídas em 3-5 dias.

## 6. Anti-padrões (NÃO FAZER)

- ❌ Implementar fora da ordem das fases
- ❌ Pular Fase 0 (verificação de pré-requisitos)
- ❌ Hardcodar prompts no código (sempre via arquivos `prompts/prd/*.md`)
- ❌ Usar LangChain ou abstração intermediária no Anthropic SDK
- ❌ Salvar HTML em vez de markdown no banco
- ❌ Implementar BYOK no MVP
- ❌ Implementar estilos `enxuto` ou `spec técnica` no MVP
- ❌ Suportar idiomas além de pt-BR no MVP
- ❌ Suportar tipos além de `feature` no MVP
- ❌ Gerar PRD sem checar cota mensal
- ❌ Permitir geração sem permissão `roadmap_item.update`
- ❌ Esquecer de adicionar audit event `prd_generated`
- ❌ Confiar em alucinação do LLM (sempre revisar prompts com "use apenas dados do contexto")
- ❌ Implementar autosave por keystroke (apenas save explícito)

## 7. Decisões em aberto (registrar como TODO no código)

- Pricing exato por excedente quando workspace passa do limite mensal
- Quando exatamente incrementar versão vs apenas atualizar `content_edited_md` (regra de "diff significativo")
- Política de retenção (deletar PRDs antigos após X meses?)
- Como expor "custo gasto este mês" pro PM (em settings? Em billing?)
- BYOK exato (v2): qual UX de configurar chave própria, como criptografar storage da chave

## 8. Quando terminar

Depois da Fase 8, o entregável é:

1. **Botão "Gerar PRD"** funcional no detalhe de qualquer feature
2. **Streaming visual** mostrando IA escrevendo o documento
3. **Editor inline** permitindo edição livre do conteúdo
4. **Versionamento** preservando histórico de edições
5. **Cota mensal** validada antes de cada geração
6. **Audit log** registrando todas gerações
7. **Documentação** pra próximo dev entender

PM consegue, da Feature até o handoff pra eng, **economizar 60-90 minutos** de trabalho manual por PRD, com contexto factualmente correto e rastreabilidade preservada.

Esse é o diferencial competitivo do ProductGen vs. ProductPlan/Productboard/Aha.

---

**Próximo passo após MVP**:
- v2: estilos `enxuto` + `spec técnica`, suporte a Iniciativa/Épico, regenerate com instruções, BYOK Enterprise.

**Quando estiver pronto pra começar**: cole esse documento no Cursor + `CLAUDE.md` do projeto + documento de regras de auth + design system. Aguarde Cursor listar entendimento (5 bullets) e iniciar pela Fase 0.
