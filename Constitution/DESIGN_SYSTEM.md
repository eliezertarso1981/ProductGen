# ProductGen — Design System

> Fonte canônica de referência visual. Quando houver dúvida sobre cor, tamanho, espaçamento, comportamento de componente ou padrão de UI, consulte este documento. Ele é a versão consolidada das 16 telas calibradas no Claude Design + decisões técnicas tomadas.

> **Para implementação**: este documento define o **quê** e o **como**. Não inclui código pronto — esse vai nos prompts master e nos componentes do projeto. Cite este documento ao construir telas novas.

---

## 1. Filosofia & princípios

### Tom visual

- **Profissional, técnico, refinado.** Referências: Linear, Stripe Dashboard, Vercel. **Não:** Asana, Trello, Monday.
- **Densidade média-alta.** Body text é 14px (não 16px). Padding é controlado. Whitespace existe mas não esbanja.
- **Neutro emocional.** Sem mascotes, sem ilustrações coloridas, sem confetti, sem celebrações visuais, sem emojis decorativos no produto.
- **Calado.** A interface não grita. Hierarquia tipográfica e cor primary fazem o trabalho de chamar atenção quando necessário.

### Princípios de decisão

| Decisão | Default | Exceção |
|---|---|---|
| Cor | Neutro (grafite, cinzas) | Primary turquesa apenas pra elementos acionáveis ou ativos |
| Sombra | Nenhuma (`shadow-none`) | Cards de hover/elevação (sutil), modais |
| Border-radius | 6-8px | Avatares (full), inputs grandes (8-10px) |
| Animação | Sutil, 150-200ms | Loadings com 1-1.5s |
| Peso de fonte | 400 (regular) ou 500 (medium) | 600 (semibold) apenas em headings |
| Padding | Controlado, escala 4-8-12-16-24 | Cards grandes podem ter 24-32 |
| Hierarquia | 1 elemento primary por área | Nunca 2 botões turquesa lado a lado |

---

## 2. Paleta de cores

### 2.1 Cores de marca (brand)

| Token | Hex | RGB | Uso |
|---|---|---|---|
| Primary turquesa | `#13c8b5` | rgb(19, 200, 181) | CTAs principais, links ativos, item ativo de navegação, "Gen" do wordmark, ícones primários |
| Primary hover | `#21a3a3` | rgb(33, 163, 163) | Estado pressionado de botões primary, focus ring forte |
| Accent menta | `#6cf3d5` | rgb(108, 243, 213) | Topo do logo, backgrounds sutis de success/highlight, gradient |
| Neutral grafite | `#2b364a` | rgb(43, 54, 74) | Texto principal (light mode), painel direito de telas auth, "Product" do wordmark, sidebar dark |
| Muted violeta | `#7375a5` | rgb(115, 117, 165) | Texto auxiliar, ícone de evidência, archived states |

**Regra de uso:**
- Primary turquesa **só** em elementos acionáveis ou de feedback positivo
- Nunca turquesa em texto de leitura corrida
- Nunca turquesa em fundos amplos (>200x100px) — vira agressivo

### 2.2 Escala de neutros — Light mode

| Token | Hex | Uso |
|---|---|---|
| White | `#ffffff` | Fundo de cards, inputs, form (lado esquerdo auth), main content |
| Neutral 50 | `#f7f8fa` | Fundo de sidebar light, hover em botões SSO, "almost white" |
| Neutral 100 | `#eef0f4` | Hover em items de navegação, divisor sutil |
| Neutral 200 | `#dde0e8` | Borda padrão (inputs, cards, divisórios) |
| Neutral 300 | `#c4c9d4` | Borda visível, ícones inativos com peso |
| Neutral 400 | `#9aa0b1` | Placeholder de input, ícones inativos, copyright |
| Neutral 500 | `#6b7287` | Texto secundário, subtítulos |
| Neutral 600 | `#4e5567` | Labels uppercase de form |
| Neutral 700 | `#373d4d` | Texto enfático em surfaces claros |
| Neutral 800 | `#222838` | Headings em surfaces neutros |
| Neutral 900 | `#0f1419` | Background main em dark mode, texto "preto" puro |

**Hue base:** 220 (azulado neutro, não cinza puro). Garante que neutros "conversem" com a primary turquesa sem brigar.

### 2.3 Escala de neutros — Dark mode

| Token | Hex | Uso |
|---|---|---|
| Dark bg main | `#0f1419` | Background da página inteira em dark |
| Dark surface 1 | `#1a1f2e` | Sidebar dark, cards em dark, topbar dark |
| Dark surface 2 | `#222838` | Hover em items, bg de inputs em dark, bordas mais visíveis |
| Dark border | `#222838` ou `#373d4d` | Bordas em dark mode |

**Regra de uso dark:**
- Texto principal: `#ffffff`
- Texto secundário: `rgba(255, 255, 255, 0.55)`
- Texto terciário/desabilitado: `rgba(255, 255, 255, 0.30)`
- Texto "Gen" no logo: mantém `#13c8b5` (mesma cor em qualquer modo)

### 2.4 Cores semânticas

#### Success (verde)
| Token | Hex | Uso |
|---|---|---|
| Success 500 | `#10b981` | Texto/ícone de success, delta positivo (↑12%), barra de cobertura estratégica, status `validated` |
| Success bg sutil | `rgba(16, 185, 129, 0.10)` | Fundo de chip "em XX dias" verde-água |
| Success border sutil | `rgba(16, 185, 129, 0.20)` | Borda de chip success |

#### Warning (âmbar)
| Token | Hex | Uso |
|---|---|---|
| Warning 500 | `#f59e0b` | Texto/ícone de warning, gargalo detectado, idade alta de dor, prazo próximo, status `addressed` |
| Warning bg sutil | `rgba(245, 158, 11, 0.10)` | Fundo de chip "em 4 dias" amber |
| Warning bg banner | `rgba(245, 158, 11, 0.06)` | Fundo do banner "Gargalo detectado" no funil |
| Warning border | `rgba(245, 158, 11, 0.20)` | Borda do banner de gargalo, borda de chip warning |

#### Danger (vermelho)
| Token | Hex | Uso |
|---|---|---|
| Danger 500 | `#dc2626` | Texto/ícone de erro, badge de notificação, prazo vencido, borda de input com erro, ícone de dor |
| Danger bg sutil | `rgba(220, 38, 38, 0.10)` | Fundo de chip "vencido há X dias", badge contador na sidebar |
| Danger border | `rgba(220, 38, 38, 0.20)` | Borda de chip danger |

### 2.5 Cores por entidade

Cada entidade do produto tem cor própria pra ícone, avatar, e chips de tipo. Usadas em listagens, dashboards, atividade recente.

| Entidade | Hex | Ícone Lucide | Comentário |
|---|---|---|---|
| Evidence | `#7375a5` | `Lightbulb` | Muted/violeta — sinaliza "input bruto, sem opinião" |
| Pain | `#dc2626` | `AlertCircle` | Vermelho — urgência, problema do cliente |
| Hypothesis | `#7c3aed` | `FlaskConical` | Roxo — pensamento, aposta científica |
| Experiment | `#f59e0b` | `Edit` | Âmbar — ação, teste em execução |
| Roadmap item | `#13c8b5` | `Map` | Turquesa primary — entrega, valor |
| Outcome | `#10b981` | `Target` | Verde — resultado, fechamento de loop |
| Persona | `#7375a5` | `Users` | Muted |
| Pillar | `#2b364a` | `Columns3` | Grafite — estratégia, neutro |
| Objective (OKR) | `#2b364a` | `Target` | Grafite |

**Regra de uso:** essas cores aparecem **apenas em ícones, chips e bordas sutis**. Nunca em backgrounds amplos. Nunca em texto de leitura.

### 2.6 Cores por usuário (avatares)

Cada usuário tem gradient próprio gerado a partir do seu ID. Não-aleatório — derivado deterministicamente pra mesma pessoa ter sempre a mesma cor.

| Usuário (seed) | From | To |
|---|---|---|
| Eliezer Silva (ES) | `#6cf3d5` | `#13c8b5` (turquesa, idêntico ao login) |
| Carlos Mendes (CM) | `#a78bfa` | `#7c3aed` (roxo) |
| Julia Costa (JC) | `#fbbf24` | `#f59e0b` (âmbar) |
| Ana Silva (AS) | `#34d399` | `#10b981` (verde) |

**Algoritmo** (pra cobrir usuários reais além dos seeds): hash do `user_id` → módulo 8 → escolhe gradient de uma paleta fixa de 8 pares pré-aprovados (turquesa, roxo, âmbar, verde, rosa, azul, laranja, ciano). Nunca permitir personalização — consistência > expressão.

### 2.7 Pattern decorativo

**Dots pattern** (usado no painel direito da tela de login):
- Cor: `rgba(19, 200, 181, 0.10)` (turquesa muito sutil)
- Tamanho: 1px de diâmetro
- Espaçamento: grid 24×24px
- Implementação: `radial-gradient(circle, rgba(19, 200, 181, 0.10) 1px, transparent 1px) / 24px 24px`

**Não usar pattern em outras telas.** É elemento de marketing/auth, não de produto.

---

## 3. Tipografia

### 3.1 Famílias

| Família | Variável CSS | Uso |
|---|---|---|
| Geist Sans | `--font-geist-sans` | Quase tudo: UI, texto, headings |
| Geist Mono | `--font-geist-mono` | IDs de entidades (PN-23), valores numéricos em audit, atalho de teclado (⌘K), código inline |

**Carregamento:** sempre via `next/font/google`. Nunca via CDN ou `@import`. Configurado no `app/layout.tsx`.

### 3.2 Pesos permitidos

| Peso | Valor | Quando usar |
|---|---|---|
| Regular | 400 | Texto de leitura, body, parágrafos |
| Medium | 500 | Labels, botões, texto enfático sem virar título |
| Semibold | 600 | Headings (h1, h2, h3), valores numéricos grandes em métricas |

**Proibido:** font-bold (700), font-extrabold (800), font-black (900). Geist em peso 700+ fica grosseira. Se algo precisa de mais ênfase, aumente o tamanho — não o peso.

### 3.3 Escala tipográfica

| Token | Size | Line height | Tracking | Weight default | Uso típico |
|---|---|---|---|---|---|
| display | 36-38px | 1.1 | -0.02em | 600 | H1 de tela auth, H1 de dashboard ("Bom dia, Eliezer") |
| title | 30px | 1.1 | -0.02em | 600 | H1 de página interna |
| heading-lg | 22-24px | 1.2 | -0.01em | 600 | H2 de seção, título de modal |
| heading | 18px | 1.3 | -0.01em | 600 | Título de card ("Funil de Discovery"), H3 |
| heading-sm | 16px | 1.4 | normal | 500-600 | Título de subcard, item destacado |
| body-lg | 16px | 1.5 | normal | 400 | Body de telas marketing/auth, subtítulo de página |
| body | 14px | 1.5 | normal | 400 | Body padrão de UI, conteúdo de card |
| body-sm | 13px | 1.5 | normal | 400 | Texto secundário, links de "ver mais", metadados |
| caption | 12px | 1.4 | normal | 400 | Metadados (timestamps, contadores), footer copyright |
| label | 11px | 1.2 | 0.04em (uppercase) | 500 | Labels de form (EMAIL, SENHA), labels de metric tile |
| micro | 10px | 1.2 | normal | 500 | Badges pequenos, indicadores numéricos minúsculos |

### 3.4 Letter-spacing (tracking)

- Headings (≥18px): **-0.02em** (levemente apertado, dá ar profissional)
- Body: normal (0)
- Labels uppercase: **0.04em a 0.06em** (compensa o uppercase)
- Botões: normal

### 3.5 Cor de texto por contexto

| Contexto | Light | Dark |
|---|---|---|
| Heading principal | `#2b364a` | `#ffffff` |
| Body principal | `#2b364a` ou `#373d4d` | `#ffffff` |
| Texto secundário | `#6b7287` | `rgba(255,255,255,0.55)` |
| Texto terciário/auxiliar | `#9aa0b1` | `rgba(255,255,255,0.30)` |
| Label de form | `#4e5567` | `rgba(255,255,255,0.55)` |
| Placeholder | `#9aa0b1` | `rgba(255,255,255,0.30)` |
| Link ativo | `#13c8b5` | `#13c8b5` |
| Texto sobre painel grafite | `#ffffff` ou `rgba(255,255,255,0.85)` | — |

### 3.6 Anti-padrões tipográficos

- ❌ Usar font-bold (700) — sempre semibold (600) no máximo
- ❌ Misturar Geist com outras fontes (Inter, Helvetica, etc)
- ❌ Texto serif em qualquer lugar (exceto a aspa decorativa `"` no painel auth, que pode usar Georgia)
- ❌ Letter-spacing positivo em texto que não é uppercase
- ❌ Headings com mais de 2 linhas em UI (quebrar é sinal de copy mal escrito)
- ❌ Texto em italics, exceto pra discard_reason de entidade descartada
- ❌ Text-transform uppercase em texto > 14px (só labels pequenos)

---

## 4. Spacing & layout

### 4.1 Escala base

Sistema de 4px. Use **apenas** valores múltiplos de 4:

```
0   2   4   8   12   16   20   24   32   40   48   64   80   96
```

**Valores 2px aceitos** apenas em ajustes finos (ex: gap entre barras do logo, offset de ícone).

**Proibido:** valores arbitrários tipo `padding: 13px`, `margin: 17px`. Sempre cair na escala.

### 4.2 Dimensões de componentes

| Componente | Altura | Padding lateral | Comentário |
|---|---|---|---|
| Input (text, email, password, search) | 40px (default) ou 48px (forms auth) | 12-14px | Auth usa 48px (mais respiro), UI densa usa 40px |
| Botão primary | 40px (default) ou 48px (auth) | 14-16px | Acompanha o input |
| Botão small | 32px | 10-12px | Toolbar, ações compactas |
| Botão icon-only | 32×32 ou 40×40 | — | Quadrado |
| Chip de filtro | 32px | 12px | Padding vertical interno menor |
| Badge contador | 20-22px (altura) | 6-8px | Numérico, redondo |
| Avatar (sidebar, topbar) | 32-40px (diâmetro) | — | 32 em listas, 36-40 em headers |
| Avatar workspace switcher | 40px (quadrado, radius 10) | — | Quadrado, não redondo |
| Tab | 40px | 16px | Padding bottom = borda 2px |
| Card padrão | conteúdo + 24px padding | — | Min-height conforme conteúdo |
| Modal | min 400px largura | 32px padding | Max 600px largura padrão |
| Drawer lateral | 480px largura desktop | 24-32px | Slide da direita |

### 4.3 Containers maiores

| Container | Dimensão | Comentário |
|---|---|---|
| Sidebar (app shell) | 280px largura | Fixa em desktop ≥1024px |
| Topbar (app shell) | 56px altura | Sticky top, full-width |
| Main content | padding 40px (`px-10 py-10`) | Em desktop |
| Form auth (lado esquerdo) | 560px largura | Padding lateral 80px |
| Search central do topbar | 480px largura, 40px altura | Centralizado |
| Drawer lateral | 480px largura | Slide da direita |
| Modal default | 480-560px largura | Centralizado, padding 32px |
| Página interna (max-width do conteúdo) | sem limite (full do main) | Conteúdo respira até 1440-1600px |

### 4.4 Gaps padrão

| Contexto | Gap |
|---|---|
| Entre tiles de métrica (grid) | 16px |
| Entre cards grandes em grid | 24px |
| Entre items de lista densa (atividade, medições) | 12-16px |
| Entre seções verticais de página | 24-32px |
| Entre form fields (vertical) | 20px |
| Entre botões inline | 8-12px |
| Entre ícone e texto (botão) | 6-8px |
| Entre label e input (vertical) | 6-8px |
| Entre items de navegação na sidebar | 2-4px |

### 4.5 Padding lateral por viewport

| Breakpoint | Padding lateral main content |
|---|---|
| Mobile (<768px) | 16-24px |
| Tablet (768-1024px) | 32px |
| Desktop (≥1024px) | 40px |
| Wide (≥1440px) | 40px (não aumenta — conteúdo respira no centro) |

---

## 5. Border-radius

### 5.1 Escala

| Token | Valor | Uso |
|---|---|---|
| radius-none | 0 | Divisórias, separators |
| radius-sm | 4px | Chips pequenos, badges minúsculos, retângulos do logo |
| radius-default | 6px | Inputs em UI densa, botões small, badges médios |
| radius-md | 8px | Inputs auth, botões grandes, cards de funil |
| radius-lg | 10-12px | Cards grandes (metric tiles, atividade, medições) |
| radius-xl | 12-14px | Modais, drawers |
| radius-2xl | 16px | Containers excepcionais (poucos casos) |
| radius-full | 9999px | Avatares, badges arredondados, dots, barras de progresso |

### 5.2 Regras

- **Consistência por contexto.** Todos cards de uma mesma página devem ter o mesmo radius.
- **Avatares são SEMPRE `rounded-full`**, exceto o avatar de workspace (quadrado com `rounded-lg`).
- **Inputs e botões na mesma linha devem ter o mesmo radius.**
- Proibido: radius > 16px (vira "pílula" — visual lúdico, errado pro produto)
- Proibido: misturar radius diferentes em elementos vizinhos sem motivo

---

## 6. Sombras (elevação)

### 6.1 Filosofia

ProductGen usa **sombras com parcimônia**. A estética é "flat com bordas". Cards usam **borda**, não sombra. Sombras só em:
- Elementos sobrepostos (dropdowns, popovers, modais)
- Hover de elementos arrastáveis (drag-and-drop)
- Focus ring (forma de "sombra colorida")

### 6.2 Escala

| Token | Valor CSS | Uso |
|---|---|---|
| shadow-none | none | Default. Cards, botões, inputs |
| shadow-xs | `0 1px 2px rgba(15, 20, 25, 0.04)` | Hover sutil de card |
| shadow-sm | `0 1px 3px rgba(15, 20, 25, 0.08), 0 1px 2px rgba(15, 20, 25, 0.04)` | Dropdown fechado, tooltip |
| shadow-md | `0 4px 6px rgba(15, 20, 25, 0.07), 0 2px 4px rgba(15, 20, 25, 0.04)` | Dropdown aberto, popover |
| shadow-lg | `0 10px 15px rgba(15, 20, 25, 0.08), 0 4px 6px rgba(15, 20, 25, 0.04)` | Modal |
| shadow-xl | `0 20px 25px rgba(15, 20, 25, 0.10), 0 8px 10px rgba(15, 20, 25, 0.04)` | Drawer lateral, card sendo arrastado |
| focus-ring | `0 0 0 3px rgba(19, 200, 181, 0.20)` | Focus em inputs e botões |

### 6.3 Sombras em dark mode

Em dark, sombras pretas não funcionam (fundo já é escuro). Use sombras com **opacity menor** OU **borda sutil** em vez de sombra:

- Light mode: card sobreposto → `shadow-md`
- Dark mode: card sobreposto → `border: 1px solid rgba(255,255,255,0.08)` (sem sombra)

### 6.4 Regras

- **Nunca** sombra em cards padrão (default). Use borda `#dde0e8` (light) ou `#222838` (dark).
- **Nunca** sombra colorida (exceto focus ring turquesa).
- **Nunca** combinar borda + sombra forte no mesmo elemento.
- Sombras animadas (hover): transição 150ms ease.

---

## 7. Iconografia

### 7.1 Biblioteca única

**Lucide React** (`lucide-react`). Nenhuma outra biblioteca é permitida — nem Heroicons, nem Feather, nem Material Icons, nem Font Awesome, nem ícones SVG inline customizados (exceto Google/Microsoft no login, que são marcas oficiais).

Razões:
- Estilo visual consistente (stroke uniforme, tamanho consistente)
- ~1400 ícones cobrem 99% das necessidades
- Tree-shaking funciona bem (só ícones usados entram no bundle)
- Comunidade ativa, manutenção contínua

### 7.2 Tamanhos canônicos

| Contexto | Size |
|---|---|
| Em texto inline (junto com texto 14px) | 14px |
| Botão (padrão) | 16px |
| Botão grande (auth) | 16-18px |
| Sidebar nav item | 16px |
| Topbar ações (Bell, etc) | 18px |
| Input com ícone à esquerda | 16px |
| Toggle de senha (Eye) | 16px |
| Card de entidade (ícone à esquerda) | 14-16px |
| Avatar de atividade (ícone dentro de círculo) | 14px |
| Banner (warning, info) | 16px |
| Empty state (ícone grande central) | 48-64px |
| Hero/landing | 24-32px |

### 7.3 Cor do ícone

| Contexto | Cor |
|---|---|
| Ícone em botão primary | `#ffffff` (branco) |
| Ícone em botão secondary/ghost | `#4e5567` (light) / `rgba(255,255,255,0.75)` (dark) |
| Ícone de input (inativo) | `#9aa0b1` (light) / `rgba(255,255,255,0.30)` (dark) |
| Ícone de input (focused) | `#13c8b5` |
| Ícone de input (erro) | `#dc2626` |
| Ícone de nav item (inativo) | `#4e5567` (light) / `rgba(255,255,255,0.75)` (dark) |
| Ícone de nav item (ativo) | `#13c8b5` |
| Ícone de entidade | cor da entidade (ver §2.5) |
| Ícone de estado (success/warning/danger) | cor semântica |

### 7.4 Stroke width

Padrão Lucide: 2px. **Não alterar.**

### 7.5 Anti-padrões

- ❌ Misturar ícones de bibliotecas diferentes
- ❌ Ícones outline + filled na mesma tela (Lucide é só outline)
- ❌ Ícones em escala > 32px exceto empty states e hero
- ❌ Ícones decorativos sem função (só pra "encher")
- ❌ Ícones em texto corrido (parágrafos)

---

## 8. Componentes

### 8.1 Botões

#### 8.1.1 Botão Primary (CTA)

- **Background:** `#13c8b5`
- **Hover:** `#21a3a3`
- **Active (pressed):** `#21a3a3` (mantém hover state)
- **Disabled:** `#13c8b5` com `opacity: 0.5`, `cursor: not-allowed`
- **Texto:** `#ffffff`, weight 500, size 14px
- **Padding:** 14-16px horizontal
- **Altura:** 40px (default) ou 48px (auth/grande)
- **Border-radius:** 8px
- **Sem borda, sem sombra**
- **Transição:** background 150ms ease

**Uso:** UMA por área principal. "Entrar", "Salvar", "Criar dor", "+ Novo". Sempre representa a ação primária.

#### 8.1.2 Botão Secondary (outline)

- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Hover:** `#f7f8fa` (light) / `#222838` (dark)
- **Border:** 1px `#dde0e8` (light) / `#222838` (dark)
- **Texto:** `#2b364a` (light) / `#ffffff` (dark), weight 500, size 14px
- **Padding:** mesma do primary
- **Altura:** mesma do primary

**Uso:** ações secundárias ao lado do primary ("Cancelar", "Voltar"). Também usado pros botões SSO (Google/Microsoft).

#### 8.1.3 Botão Ghost (text-only)

- **Background:** transparent
- **Hover:** `#eef0f4` (light) / `rgba(255,255,255,0.04)` (dark)
- **Border:** none
- **Texto:** `#4e5567` (light) / `rgba(255,255,255,0.75)` (dark)
- **Padding:** 8-12px horizontal
- **Altura:** 32-36px

**Uso:** ações terciárias, ícones de ação na topbar/toolbar ("Filtros", "Exportar").

#### 8.1.4 Botão Danger

- **Background:** `#dc2626`
- **Hover:** darken 10%
- **Texto:** `#ffffff`
- **Mesmo dimensionamento do primary**

**Uso:** ações destrutivas com confirmação ("Deletar", "Descartar").

#### 8.1.5 Botão Icon-only

- **Background:** transparent
- **Hover:** `#eef0f4` (light) / `rgba(255,255,255,0.04)` (dark)
- **Dimensão:** 32×32 ou 40×40 quadrado
- **Border-radius:** 6px ou 8px
- **Ícone:** 16-18px, cor neutral
- **Tooltip obrigatório** (descreve a ação)

**Uso:** Bell, search, settings, mais opções (kebab).

#### 8.1.6 Botão com ícone + texto

- Ícone à esquerda do texto
- Gap 6-8px entre ícone e texto
- Ícone tem mesma cor do texto

#### 8.1.7 Botão com dropdown

- Mesma estrutura do botão correspondente (primary, secondary)
- ChevronDown 14px à direita do label, gap 4-6px
- "+ Novo" no topbar é exemplo: Plus 16px + "Novo" + ChevronDown 14px

#### 8.1.8 Botão loading

- Texto muda pra "Entrando..." ou "Salvando..." (ou similar)
- Ícone `Loader2` 16px com `animate-spin` à esquerda do texto
- `cursor: not-allowed`
- `pointer-events: none` (não clica de novo)
- Mantém cor de fundo, opacity 0.9-1.0 (não escurece muito)

#### 8.1.9 Hierarquia em uma área

| Quantidade | Composição |
|---|---|
| 1 ação | 1 primary |
| 2 ações | 1 primary + 1 ghost ("Cancelar" à esquerda do primary OU à direita) |
| 3 ações | 1 primary + 1 secondary + 1 ghost |
| 4+ ações | Considerar dropdown "Mais ações" com kebab |

**Nunca 2 primary lado a lado.** Cria competição visual.

### 8.2 Inputs

#### 8.2.1 Text input (default)

- **Altura:** 40px (UI densa) ou 48px (auth)
- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Border:** 1px `#dde0e8` (light) / `#222838` (dark)
- **Border-radius:** 6-8px
- **Padding:** 8-12px horizontal
- **Texto:** 14px, `#2b364a` (light) / `#ffffff` (dark)
- **Placeholder:** `#9aa0b1` (light) / `rgba(255,255,255,0.30)` (dark)

**Estados:**

| Estado | Border | Box-shadow extra |
|---|---|---|
| Default | `#dde0e8` | nenhuma |
| Hover | `#c4c9d4` | nenhuma |
| Focus | `#13c8b5` | `0 0 0 3px rgba(19, 200, 181, 0.15)` |
| Error | `#dc2626` | `0 0 0 3px rgba(220, 38, 38, 0.15)` (no focus) |
| Disabled | `#dde0e8` | bg `#f7f8fa`, cursor not-allowed, text muted |

#### 8.2.2 Input com ícone à esquerda

- Padding-left aumenta pra 36-40px (ícone fica em `left: 12px`)
- Ícone 16px, cor `#9aa0b1`
- Ícone muda cor em focus pra `#13c8b5`
- Ícone muda cor em error pra `#dc2626`

#### 8.2.3 Input com ação à direita

- Padding-right aumenta pra 36-40px
- Ação (botão icon-only) em `right: 8px`
- Exemplo: toggle de senha (Eye), botão de limpar (X)

#### 8.2.4 Input de busca

- Mesmo estilo + ícone Search à esquerda
- Pode ter atalho `⌘K` à direita (badge mono)
- Background pode ser `#f7f8fa` (mais sutil que branco) no topbar

#### 8.2.5 Mensagem de erro

- Aparece **abaixo** do input quando `error=true`
- Layout: ícone `AlertCircle` 14px à esquerda + texto à direita
- Cor: `#dc2626`
- Tamanho: 13px
- Margin-top: 6-8px do input

### 8.3 Cards

#### 8.3.1 Card padrão

- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Border:** 1px `#dde0e8` (light) / `#222838` (dark)
- **Border-radius:** 12px
- **Padding:** 24px (cards grandes), 16px (cards densos)
- **Sem sombra**

#### 8.3.2 Card com header

- Header tem título + ações alinhadas à direita
- Título: 18px semibold
- Subtítulo abaixo (opcional): 13px regular `#6b7287`
- Link de ação ("Ver tudo →"): 13px medium `#13c8b5` com ChevronRight 14px
- Gap entre header e conteúdo: 16-24px

#### 8.3.3 Card clicável (hover)

- Border muda pra `#c4c9d4` no hover
- `shadow-xs` aparece sutilmente
- Transição: 150ms
- Cursor: pointer

#### 8.3.4 Card de entidade (PainCard, HypothesisCard, etc)

Padrão reusável:
- Padding: 12px
- Cursor: grab (se arrastável) ou pointer
- Estrutura vertical:
  1. **Linha meta** (topo): ícone da entidade + ID mono + spacer + severidade dots
  2. **Título** (max 2 linhas, line-clamp-2)
  3. **Descrição** (max 2 linhas, line-clamp-2, opcional)
  4. **Personas afetadas** (linha "Afeta: AS · CM" com mini-avatares)
  5. **Footer** (métricas inline + avatar do owner)

### 8.4 Badges

#### 8.4.1 Badge contador

- Forma: arredondada (radius-full)
- Altura: 20-22px
- Padding: 0 8px
- Tamanho do texto: 11-12px medium
- Min-width: 22px (pra números single-digit centralizarem)

**Variantes:**

| Variante | Bg | Texto |
|---|---|---|
| Default | `#eef0f4` | `#4e5567` |
| Danger (notificação) | `rgba(220, 38, 38, 0.10)` | `#dc2626` |
| Primary | `rgba(19, 200, 181, 0.10)` | `#13c8b5` |

#### 8.4.2 Badge de status

- Forma: pill (radius-full)
- Padding: 4px 10px
- Texto: 12px medium
- Background: cor semântica com alpha 10-15%
- Texto: cor semântica sólida
- Sem borda (ou borda sutil com alpha 20%)

**Exemplos** (status de roadmap):
- `planned` → bg `rgba(19, 200, 181, 0.10)`, texto `#13c8b5`
- `in_development` → bg `rgba(245, 158, 11, 0.10)`, texto `#f59e0b`
- `delivered` → bg `rgba(16, 185, 129, 0.10)`, texto `#10b981`
- `cancelled` → bg `#eef0f4`, texto `#6b7287`

#### 8.4.3 Badge de prazo

- Mesma estrutura do badge de status
- Conteúdo: "em 4 dias", "vencido há 3 dias", "em 11 dias"
- Cor varia conforme proximidade:
  - **Vencido:** danger (vermelho)
  - **≤7 dias:** warning (âmbar)
  - **>7 dias:** success (verde)

#### 8.4.4 Badge de severidade (dots)

- 5 dots horizontais inline
- Cada dot: 5-6px diâmetro, gap 2-3px
- Dots cheios = nível de severidade
- Cor dos dots cheios:
  - Severidade 1-2: `#9aa0b1` (cinza)
  - Severidade 3: `#f59e0b` (âmbar)
  - Severidade 4-5: `#dc2626` (vermelho)
- Dots vazios: `#dde0e8`
- Tooltip obrigatório: "Severidade 4/5"

### 8.5 Avatares

#### 8.5.1 Avatar de usuário

- **Forma:** circular (radius-full)
- **Tamanhos:** 24, 28, 32, 36, 40px
- **Background:** gradient determinístico (ver §2.6)
- **Conteúdo:** iniciais (2 letras) em branco, weight 500
- **Tamanho de fonte:** 36% do tamanho do avatar (ex: 32px avatar → 12px texto)
- **Sempre flex-shrink-0** (nunca encolhe em flex)

#### 8.5.2 Avatar de workspace

- **Forma:** quadrado com radius-lg (10px)
- **Tamanho:** 40px
- **Background:** gradient turquesa idêntico ao do usuário Eliezer
- **Conteúdo:** iniciais do workspace (ex: "AC" pra Acme Corp)

#### 8.5.3 Stack de avatares (sobreposição)

- Multiple avatares lado a lado com overlap
- Overlap: -8px (cada avatar fica sobre o anterior)
- Border: 2px solid `#ffffff` (light) / `#1a1f2e` (dark) — cria "halo" branco
- Direção: z-index decresce da esquerda pra direita (primeiro fica em cima)

### 8.6 Chips de filtro

- **Altura:** 32px
- **Padding:** 6px 12px
- **Border:** 1px `#dde0e8` (light) / `#222838` (dark)
- **Border-radius:** 6px
- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Texto:** 13px regular `#4e5567`

**Estados:**

| Estado | Border | Bg | Texto |
|---|---|---|---|
| Default | `#dde0e8` | `#ffffff` | `#4e5567` |
| Hover | `#c4c9d4` | `#f7f8fa` | `#2b364a` |
| Ativo (com filtro selecionado) | `rgba(19, 200, 181, 0.30)` | `rgba(19, 200, 181, 0.05)` | `#13c8b5` |
| Aberto (dropdown aberto) | `#13c8b5` | `#ffffff` | `#13c8b5` |

**Composição:**
- Label simples: "Persona" + `ChevronDown` 12px
- Label + valor: "Severidade · 4-5" + `X` 12px (pra limpar) ou ChevronDown
- Quando ativo, separador "·" entre label e valor, valor em weight 500

### 8.7 Dropdowns

- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Border:** 1px `#dde0e8` (light) / `#222838` (dark)
- **Border-radius:** 8px
- **Shadow:** `shadow-md`
- **Padding:** 4px (apenas separação dos items, items têm padding próprio)
- **Min-width:** mesmo do trigger
- **Max-height:** 320px com scroll vertical se necessário

**Item de dropdown:**
- Altura: 36px
- Padding: 0 12px
- Texto: 14px regular `#2b364a` (light)
- Hover: bg `#f7f8fa`
- Selected: bg `rgba(19, 200, 181, 0.08)`, texto `#13c8b5`, check à direita

**Separadores:**
- Border-top: 1px `#eef0f4`
- Margin: 4px vertical

### 8.8 Modais

- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Border-radius:** 12px
- **Padding:** 32px
- **Shadow:** `shadow-lg`
- **Max-width:** 480-560px default
- **Overlay:** `rgba(15, 20, 25, 0.50)` cobrindo a tela toda

**Estrutura:**
- Header: título 22px semibold + botão close (X) à direita
- Body: conteúdo
- Footer: ações alinhadas à direita (Cancelar ghost + Salvar primary)

### 8.9 Drawers laterais

- Slide da direita pra esquerda
- **Largura:** 480px desktop, full em mobile
- **Background:** `#ffffff` (light) / `#1a1f2e` (dark)
- **Border-left:** 1px `#dde0e8`
- **Shadow:** `shadow-xl` no border esquerdo
- **Padding:** 24-32px

**Uso:** detalhe de entidade (Pain Detail, Hypothesis Detail), filtros avançados.

### 8.10 Tooltips

- **Background:** `#2b364a` (light) / `#0f1419` (dark)
- **Texto:** `#ffffff`, 12px regular
- **Padding:** 6-8px 10px
- **Border-radius:** 6px
- **Max-width:** 240px
- **Shadow:** `shadow-sm`
- **Delay:** 500ms antes de aparecer
- **Animação:** fade-in 100ms

**Posição:** automática baseada em viewport (top default, vira bottom se não couber).

### 8.11 Toasts (notificações)

- **Posição:** bottom-right, stack vertical
- **Largura:** 360px
- **Padding:** 12px 16px
- **Border-radius:** 8px
- **Shadow:** `shadow-md`
- **Animação entrada:** slide-up 200ms

**Variantes:**
- Success: bg `#ffffff`, border-left 3px `#10b981`, ícone CheckCircle2
- Error: bg `#ffffff`, border-left 3px `#dc2626`, ícone XCircle
- Warning: bg `#ffffff`, border-left 3px `#f59e0b`, ícone AlertTriangle
- Info: bg `#ffffff`, border-left 3px `#13c8b5`, ícone Info

**Duração:** 4 segundos default, 8 segundos pra erros, dismissable manualmente.

### 8.12 Tabs

- **Bar height:** 40-44px
- **Border-bottom:** 1px `#dde0e8` (linha que conecta abaixo)
- **Item padding:** 0 16px
- **Texto:** 14px medium `#6b7287`

**Item ativo:**
- Border-bottom: 2px solid `#13c8b5` (subindo da linha base)
- Texto: `#2b364a` weight 600

**Hover:**
- Texto: `#2b364a`
- Sem outras mudanças

---

## 9. Estados

### 9.1 Hover

- Transição: 150ms ease (background, border, shadow)
- Aplicar a: botões, cards clicáveis, items de navegação, links

### 9.2 Focus

- Sempre visível (acessibilidade)
- Para elementos interativos: anel turquesa (focus ring)
  - `outline: 2px solid #13c8b5`
  - `outline-offset: 2px`
- Para inputs/botões: combinação border + box-shadow descrita em §8.1 e §8.2
- `focus-visible` em vez de `focus` quando possível (não mostra focus em mouse clicks)

### 9.3 Active (pressed)

- Botão primary: bg = hover state (não escurece mais)
- Botão secondary: bg = hover, leve scale (0.98) opcional

### 9.4 Disabled

- Opacity: 0.5
- Cursor: not-allowed
- Pointer-events: none
- Sem hover, sem focus

### 9.5 Loading

#### Loading inline (em botão)
- Ícone `Loader2` 16px com `animate-spin`
- Texto muda pra ação em gerúndio ("Salvando...", "Entrando...")

#### Loading de página
- Skeleton screens preferidos a spinners gigantes
- Skeleton: placeholders com `#eef0f4` (light) / `#222838` (dark)
- Animação shimmer opcional (linear-gradient deslizando)

#### Loading de seção
- Spinner centralizado: `Loader2` 24px em `#13c8b5` com spin
- Texto auxiliar abaixo: "Carregando..." 14px `#6b7287`

### 9.6 Empty state

Estrutura:
- Ícone Lucide grande (48-64px) em `#c4c9d4`
- Heading 16-18px semibold `#2b364a`: "Nenhuma dor ainda"
- Texto 14px regular `#6b7287`, max-width 280px, line-height 1.5
- CTA opcional abaixo: botão primary

Centralizado verticalmente na área (`flex items-center justify-center`).

### 9.7 Error state

#### Error em campo
Ver §8.2 — mensagem de erro abaixo do input.

#### Error de página (ex: 404, 500)
- Mesma estrutura do empty state
- Ícone vermelho ou cinza grande
- Heading: "Algo deu errado" ou "Página não encontrada"
- Texto: explicação curta + sugestão
- Botão "Tentar novamente" ou "Voltar pra home"

#### Error de operação
- Toast vermelho (§8.11) com mensagem clara
- Para erros graves: modal com retry + opção de copiar detalhes do erro

---

## 10. Padrões de UI

### 10.1 App Shell (Sidebar + Topbar)

Estrutura macro de toda tela autenticada:

```
┌──────────────┬──────────────────────────────────────────┐
│              │  TOPBAR (56px, sticky)                   │
│   SIDEBAR    ├──────────────────────────────────────────┤
│   (280px)    │                                          │
│              │                                          │
│              │            MAIN CONTENT                  │
│              │            (padding 40px)                │
│              │                                          │
└──────────────┴──────────────────────────────────────────┘
```

#### Sidebar
- Largura fixa 280px em desktop ≥1024px
- Background: `#f7f8fa` (light) / `#1a1f2e` (dark)
- Borda direita: 1px `#dde0e8` (light) / `#222838` (dark)
- Sticky em altura total da viewport
- Conteúdo (top-to-bottom): Workspace Switcher → Nav Items (agrupados) → Divisor → Items secundários → User Card

#### Topbar
- Altura 56px, sticky top
- Background: `#ffffff` (light) / `#1a1f2e` (dark)
- Borda inferior: 1px `#dde0e8` (light) / `#222838` (dark)
- Layout: Search central (480px) à esquerda, ações à direita ("+ Novo" + Bell + Avatar)

#### Mobile (<768px)
- Sidebar vira drawer (escondida por default, abre via hamburger)
- Topbar simplificada: hamburger + logo + search icon + bell
- Conteúdo full-width

### 10.2 Página interna (estrutura padrão)

```
┌──────────────────────────────────────────────────────────┐
│  SUB-HEADER (sticky, 64-80px)                            │
│  Breadcrumb + Título + Métricas + Ações                  │
├──────────────────────────────────────────────────────────┤
│  TOOLBAR (48px, sticky abaixo do sub-header)             │
│  Chips de filtro + Busca + View toggle                   │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  CONTEÚDO (variável: lista, board, timeline, detalhe)    │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

Aplica a todas as telas de listagem (Dores, Hipóteses, Evidências, Experimentos, Roadmap).

### 10.3 Sub-header

Estrutura horizontal:

**Esquerda (vertical stack):**
- Breadcrumb (text-xs `#9aa0b1`): "Discovery › Dores", separador "›" em `#c4c9d4`, último em font-medium `#4e5567`
- Espaço 4px
- Título (24-30px semibold `#2b364a`, tracking -0.02em)
- Subtítulo abaixo (text-sm `#6b7287`): contagens e timestamps ("12 dores · 8 ativas · 1 descartada · atualizado há 2 min"), separadores "·" em `#c4c9d4`

**Direita:**
- Botões alinhados, gap 8px
- Ordem padrão: ações ghost → ações outline → ação primary (+ Novo)

### 10.4 Toolbar

Estrutura horizontal:

**Esquerda — chips de filtro:**
- Sequência de chips (§8.6), gap 8px
- "Limpar filtros" como link text-only à direita dos chips quando há filtros ativos

**Direita — busca + view toggle:**
- Busca local (240px, ícone search, placeholder "Buscar nesta lista...")
- View toggle: container com 4 botões agrupados (Cards/List/Board/Timeline), botão ativo bg `#ffffff` + shadow-sm

### 10.5 Card de entidade (PainCard pattern)

Padrão reusável pra Hypothesis, Evidence, Experiment etc:

**Estrutura vertical (top-to-bottom):**

1. **Linha meta** (entre 12-16px altura)
   - Esquerda: ícone da entidade 14px (cor da entidade) + ID mono 11px `#9aa0b1` (ex: "PN-23")
   - Direita: indicador secundário (severidade dots, status, etc)

2. **Título** (font-medium 14px `#2b364a`)
   - Max 2 linhas, line-clamp-2
   - Espaço acima 8px, abaixo 6px

3. **Descrição** (opcional, font-regular 12px `#6b7287`)
   - Max 2 linhas, line-clamp-2
   - Espaço abaixo 12px

4. **Personas afetadas** (linha curta)
   - Label "Afeta:" em text-xs `#9aa0b1`
   - Avatares 18px com overlap -4px (max 3 visíveis + "+2" se houver mais)

5. **Footer** (justify-between, font-size 11px)
   - Esquerda: métricas inline com ícones (Users + número, Lightbulb + número, FlaskConical + número)
   - Direita: avatar do owner (20-24px)

**Casos especiais visuais:**
- Item "em execução": borda esquerda 3px sólida em amber
- Item "resolvido": ícone CheckCircle2 verde substitui ícone de entidade
- Item "descartado": opacity 60% + discard_reason abaixo em italic 12px `#9aa0b1`

### 10.6 Board Kanban

- Container: scroll horizontal
- Colunas: largura fixa 320px, gap 16px
- Background da coluna: `#f7f8fa` com border-radius 8px
- Header da coluna (sticky):
  - Padding 12px
  - Layout: dot colorido 8px (cor do status) + label semibold 14px + contador entre parênteses `#9aa0b1`
  - Direita: ícones de ação (Plus + MoreHorizontal)
- Cards dentro: PainCard padrão, gap 8px

### 10.7 Listagem (List view)

- Linhas horizontais densas, altura 56-72px por linha
- Borda inferior 1px `#eef0f4` entre linhas (a última sem borda)
- Hover: bg `#f7f8fa`
- Layout colunas: ID mono + ícone entidade + título + personas + métricas + owner + status badge + ações
- Cabeçalho da tabela: bg `#f7f8fa`, texto uppercase 11px `#6b7287`, padding 12px

### 10.8 Detalhe de entidade (Drawer)

Drawer da direita, 480px largura:

- Header: ícone + ID + status badge + close X
- Título grande
- Tabs internas: Visão geral / Linhagem / Atividade / Discussão
- Conteúdo: campos editáveis inline (click pra editar)
- Footer sticky: ações primárias + secundárias

### 10.9 Form (criação/edição)

Estrutura vertical padrão:

- Label uppercase 11px medium `#4e5567` acima do campo
- Campo com altura 40-48px
- Helper text 12px `#9aa0b1` abaixo (opcional)
- Mensagem de erro 13px `#dc2626` abaixo quando inválido
- Gap entre campos: 20px
- Footer sticky com 2 botões (Cancelar ghost + Salvar primary), alinhados à direita

---

## 11. Acessibilidade

### 11.1 Contraste

Todos os textos respeitam **WCAG AA mínimo**:
- Texto regular: contraste ≥ 4.5:1
- Texto grande (≥18px ou ≥14px bold): contraste ≥ 3:1

Pares validados:
- `#2b364a` em `#ffffff` → 12.6:1 ✓
- `#6b7287` em `#ffffff` → 5.4:1 ✓
- `#9aa0b1` em `#ffffff` → 3.0:1 ✓ (apenas pra texto grande ou auxiliar)
- `#13c8b5` em `#ffffff` → 3.1:1 ⚠ (uso em texto pequeno requer cuidado — pra links está OK por convenção, mas evite parágrafos)

**Anti-padrão:** texto cinza claro em fundo cinza claro. Sempre testar com ferramentas (axe DevTools, WAVE).

### 11.2 Focus visible

- Todo elemento interativo (botão, input, link) tem focus ring visível
- Focus ring turquesa (3px alpha 20%) em inputs/botões
- `focus-visible` evita mostrar ring em mouse clicks (só em teclado)

### 11.3 Tamanho mínimo de alvo touch

- 32×32px mínimo absoluto
- 40×40px recomendado (alinhado com altura padrão de botões)
- Em mobile, considere 44×44px (Apple HIG)

### 11.4 ARIA labels

- Botões icon-only **sempre** têm `aria-label` descritivo
- Inputs sem label visível têm `aria-label`
- Estados (loading, disabled, expanded) usam atributos ARIA apropriados
- Tabelas usam `<th scope="col">`, modais têm `role="dialog"` + `aria-labelledby`

### 11.5 Navegação por teclado

- Tab order lógico (sem `tabindex` positivo)
- Esc fecha modais/drawers
- Enter ativa botões/links
- Setas navegam dentro de menus/dropdowns
- Atalhos globais (⌘K pra busca) documentados visualmente

### 11.6 Movimento e animação

- Respeitar `prefers-reduced-motion` — desliga transições > 200ms quando ativo
- Não usar animações em loop infinito (exceto loadings discretos)
- Não usar autoplay de vídeo/áudio

---

## 12. Anti-padrões — NÃO FAZER

### Cores
- ❌ Usar `var(--background)`, `var(--foreground)`, `bg-primary`, `text-foreground` ou similares do shadcn theme — sempre hex literal
- ❌ Inventar cores fora da paleta (ex: rosa, azul-marinho)
- ❌ Texto turquesa em parágrafos longos (vira ilegível)
- ❌ Background turquesa em áreas amplas (>200x100px)
- ❌ Mais de 2 cores semânticas (success/warning/danger) na mesma tela competindo por atenção
- ❌ Gradientes em fundos brancos (só no logo e em avatares)

### Tipografia
- ❌ Fontes serif (exceto aspa decorativa `"` no painel auth)
- ❌ Misturar Geist com outras fontes
- ❌ font-bold (700) ou superior — máximo semibold (600)
- ❌ Letter-spacing positivo em texto que não é uppercase
- ❌ Text-transform uppercase em texto >14px

### Espaçamento
- ❌ Valores arbitrários fora da escala 4px (não usar `13px`, `17px`, etc)
- ❌ Padding < 8px em containers interativos
- ❌ Padding > 40px em cards (vira desperdício)

### Border-radius e sombras
- ❌ Border-radius > 16px (vira pílula)
- ❌ Sombras pretas em dark mode
- ❌ Sombras coloridas (exceto focus ring turquesa)
- ❌ Combinar borda forte + sombra forte
- ❌ Cards padrão com sombra (use borda)

### Componentes
- ❌ Mais de 1 botão primary por área visual
- ❌ Botão primary lado a lado com outro primary
- ❌ Botão sem label nem tooltip (icon-only sem aria-label)
- ❌ Inputs sem focus ring visível
- ❌ Cards clicáveis sem indicação visual de clicabilidade
- ❌ Modais com mais de 1 ação destrutiva (forçar confirmação)

### Ícones
- ❌ Misturar Lucide com outras bibliotecas
- ❌ SVGs inline customizados (exceto Google/Microsoft no auth, marcas oficiais)
- ❌ Ícones decorativos sem função
- ❌ Ícones em parágrafos de leitura

### Estados
- ❌ Empty state sem ícone e copy explicativo
- ❌ Loading sem feedback (botão clicado sem indicar processamento)
- ❌ Error genérico ("Algo deu errado") sem detalhe acionável
- ❌ Esconder estados disabled sem explicar por quê

### Padrões de UI
- ❌ Sidebar > 320px ou < 240px
- ❌ Topbar > 64px
- ❌ Modais > 720px largura (use drawer ou tela inteira)
- ❌ Mais de 4 abas em uma tab bar (use dropdown ou nav alternativa)
- ❌ Listagem sem view toggle quando há > 20 items (usuário precisa de opção)
- ❌ Detalhe de entidade em página separada quando drawer faz o trabalho

### Acessibilidade
- ❌ Cor única como sinalizador de estado (use ícone + cor + texto)
- ❌ Contraste < 4.5:1 em texto regular
- ❌ Botões touch < 32×32px
- ❌ Tabs sem indicação visual de qual está ativa
- ❌ Animações sem respeitar `prefers-reduced-motion`

---

## 13. Tokens em código (TypeScript)

Quando implementar, use esta estrutura. Os tokens **podem** virar variáveis CSS depois, mas começam aqui como constants:

```ts
// lib/design-tokens.ts

export const colors = {
  primary: '#13c8b5',
  primaryHover: '#21a3a3',
  accent: '#6cf3d5',
  neutralDark: '#2b364a',
  muted: '#7375a5',

  neutral: {
    0: '#ffffff',
    50: '#f7f8fa',
    100: '#eef0f4',
    200: '#dde0e8',
    300: '#c4c9d4',
    400: '#9aa0b1',
    500: '#6b7287',
    600: '#4e5567',
    700: '#373d4d',
    800: '#222838',
    900: '#0f1419',
  },

  dark: {
    bg: '#0f1419',
    surface1: '#1a1f2e',
    surface2: '#222838',
    border: '#222838',
    borderStrong: '#373d4d',
  },

  semantic: {
    success: '#10b981',
    successBg: 'rgba(16, 185, 129, 0.10)',
    successBorder: 'rgba(16, 185, 129, 0.20)',

    warning: '#f59e0b',
    warningBg: 'rgba(245, 158, 11, 0.10)',
    warningBgBanner: 'rgba(245, 158, 11, 0.06)',
    warningBorder: 'rgba(245, 158, 11, 0.20)',

    danger: '#dc2626',
    dangerBg: 'rgba(220, 38, 38, 0.10)',
    dangerBorder: 'rgba(220, 38, 38, 0.20)',
  },

  entity: {
    evidence: '#7375a5',
    pain: '#dc2626',
    hypothesis: '#7c3aed',
    experiment: '#f59e0b',
    roadmap: '#13c8b5',
    outcome: '#10b981',
    persona: '#7375a5',
    pillar: '#2b364a',
    okr: '#2b364a',
  },

  onDark: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.55)',
    tertiary: 'rgba(255, 255, 255, 0.30)',
    emphatic: 'rgba(255, 255, 255, 0.85)',
  },
} as const;

export const typography = {
  fontFamily: {
    sans: 'var(--font-geist-sans), system-ui, sans-serif',
    mono: 'var(--font-geist-mono), monospace',
  },
  size: {
    display: '36px',
    title: '30px',
    headingLg: '22px',
    heading: '18px',
    headingSm: '16px',
    bodyLg: '16px',
    body: '14px',
    bodySm: '13px',
    caption: '12px',
    label: '11px',
    micro: '10px',
  },
  weight: {
    regular: 400,
    medium: 500,
    semibold: 600,
  },
  tracking: {
    tight: '-0.02em',
    tightSm: '-0.01em',
    normal: '0',
    label: '0.04em',
    labelWide: '0.06em',
  },
  lineHeight: {
    tight: 1.1,
    snug: 1.3,
    normal: 1.5,
  },
} as const;

export const spacing = {
  0: '0',
  px: '1px',
  '0.5': '2px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

export const radius = {
  none: '0',
  sm: '4px',
  default: '6px',
  md: '8px',
  lg: '10px',
  xl: '12px',
  '2xl': '16px',
  full: '9999px',
} as const;

export const shadow = {
  none: 'none',
  xs: '0 1px 2px rgba(15, 20, 25, 0.04)',
  sm: '0 1px 3px rgba(15, 20, 25, 0.08), 0 1px 2px rgba(15, 20, 25, 0.04)',
  md: '0 4px 6px rgba(15, 20, 25, 0.07), 0 2px 4px rgba(15, 20, 25, 0.04)',
  lg: '0 10px 15px rgba(15, 20, 25, 0.08), 0 4px 6px rgba(15, 20, 25, 0.04)',
  xl: '0 20px 25px rgba(15, 20, 25, 0.10), 0 8px 10px rgba(15, 20, 25, 0.04)',
  focusRing: '0 0 0 3px rgba(19, 200, 181, 0.20)',
  focusRingDanger: '0 0 0 3px rgba(220, 38, 38, 0.20)',
} as const;

export const dimensions = {
  sidebar: 280,
  topbar: 56,
  input: { default: 40, auth: 48 },
  button: { default: 40, auth: 48, small: 32 },
  avatar: { sm: 24, md: 28, lg: 32, xl: 36, xxl: 40 },
  drawer: 480,
  modal: { default: 480, lg: 560, xl: 720 },
  searchBar: 480,
} as const;

export const transition = {
  fast: '100ms ease',
  default: '150ms ease',
  slow: '200ms ease',
  spring: '200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;
```

---

## 14. Checklist de revisão de tela nova

Antes de considerar uma tela pronta, valide:

### Cores
- [ ] Hex literais em todos os lugares (sem `var()`, sem `bg-background`)
- [ ] Primary turquesa apenas em elementos acionáveis ou ativos
- [ ] Texto principal em `#2b364a` (light) ou `#ffffff` (dark)
- [ ] Texto secundário em `#6b7287` (light) ou `rgba(255,255,255,0.55)` (dark)
- [ ] Cores semânticas usadas com semântica correta (não decorativa)

### Tipografia
- [ ] Geist Sans em quase tudo, mono apenas em IDs e atalhos
- [ ] Sem font-bold (700) — máximo semibold (600)
- [ ] Letter-spacing negativo em headings
- [ ] Labels uppercase com tracking ≥ 0.04em

### Spacing
- [ ] Valores múltiplos de 4 (sem `13px`, `17px`)
- [ ] Padding adequado por componente (botão 14-16px, card 16-24px)
- [ ] Gap entre seções respeitando hierarquia (24-32px entre seções, 12-16px dentro)

### Componentes
- [ ] Apenas 1 botão primary por área
- [ ] Botões icon-only têm aria-label e tooltip
- [ ] Inputs com focus ring visível
- [ ] Cards usando borda (não sombra) por default
- [ ] Avatares circulares (radius-full), exceto workspace (quadrado)

### Ícones
- [ ] Só Lucide React
- [ ] Tamanhos canônicos (14, 16, 18, 24)
- [ ] Cor do ícone alinhada com contexto

### Estados
- [ ] Hover visível em elementos interativos
- [ ] Focus ring (acessibilidade)
- [ ] Loading com feedback (Loader2 ou skeleton)
- [ ] Empty state com ícone + copy
- [ ] Error com mensagem clara + ação

### Padrões
- [ ] App Shell consistente com outras telas
- [ ] Sub-header com breadcrumb + título + métricas + ações
- [ ] Toolbar com filtros + busca + view toggle (quando aplicável)
- [ ] Mobile testado (sidebar vira drawer, conteúdo full-width)

### Acessibilidade
- [ ] Contraste WCAG AA em todos os textos
- [ ] Tab order lógico
- [ ] Esc fecha modais/drawers
- [ ] aria-labels em ícones sem texto
- [ ] `prefers-reduced-motion` respeitado

### Anti-padrões
- [ ] Sem var() do shadcn theme
- [ ] Sem fontes diferentes de Geist
- [ ] Sem ícones fora do Lucide
- [ ] Sem cores fora da paleta
- [ ] Sem valores de spacing fora da escala

---

## 15. Como usar este documento

### Pra novo membro do time
1. Leia §1 (Filosofia) pra calibrar o tom
2. Leia §2 (Paleta) e §3 (Tipografia) pra absorver o vocabulário visual
3. Pule pra §10 (Padrões de UI) pra ver como tela típica é montada
4. Use §12 (Anti-padrões) e §14 (Checklist) como guarda-fou em PRs

### Pra construir tela nova
1. Identifique o padrão (auth, app shell + listagem, app shell + detalhe)
2. Use §10 (Padrões de UI) como blueprint estrutural
3. Compose com componentes documentados em §8
4. Aplique estados e variações de §9
5. Valide com checklist §14 antes de mandar PR

### Pra resolver dúvida pontual
- **"Qual cor usar?"** → §2
- **"Qual tamanho de fonte?"** → §3.3
- **"Quanto de padding?"** → §4
- **"Qual border-radius?"** → §5
- **"Quando usar sombra?"** → §6
- **"Que ícone?"** → Lucide search + §7.2 pra tamanho
- **"Como esse componente se comporta?"** → §8
- **"Como deve ser empty state?"** → §9.6
- **"Por que não posso fazer X?"** → §12

### Pra evolução do documento
- Adicionar componente novo: documentar em §8 com mesma estrutura dos existentes (variantes, estados, exemplos)
- Mudar token: justificar no PR, atualizar §13 também
- Adicionar padrão de UI: documentar em §10 com diagrama ASCII e regras
- **Não remover tokens sem migration plan.**

---

## 16. Evolução prevista

### v1 (atual) — cobertura
- Auth (login, signup, forgot password)
- App Shell (sidebar + topbar)
- Dashboard
- Listagem (kanban, list)
- Detalhe (drawer)

### v2 — extensões previstas
- Roadmap timeline (visualização específica, regras adicionais)
- Editor de hipóteses estruturado (campos Se/Então/Porque)
- Settings completo (workspace, produto, integrações)
- Notificações (dropdown + página)
- Comments threads (em entidades)

### v3 — futuro distante
- Dark mode toggle (hoje apenas mock)
- Multi-idioma (EN + PT-BR)
- Acessibilidade nível AAA (atual: AA)
- Custom branding (cor primary por workspace)
- Componentes editáveis (drag-and-drop avançado)

---

**Última atualização:** baseado nas 16 telas calibradas no Claude Design (Sessões 1, 2 e 3a) + decisões técnicas tomadas até o momento da implementação do login + app shell + dashboard.

**Manutenção:** este documento é vivo. Toda decisão visual nova deve refletir aqui antes de virar código.
