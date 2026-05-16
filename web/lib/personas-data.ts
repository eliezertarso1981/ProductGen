export type PersonaScope = "workspace" | "product" | "pain";

export type DigitalMaturity = "baixa" | "media" | "alta";

export interface Persona {
  id: string;
  name: string;
  role: string;
  age?: number;
  gender?: string;
  avatarId: string;
  scope: PersonaScope;
  productId?: string;
  painId?: string;

  segment?: string;
  companySize?: string;
  responsibilities?: string;
  dailyGoals?: string;
  pains?: string;
  buyingTriggers?: string;
  objections?: string;
  decisionCriteria?: string;
  digitalMaturity?: DigitalMaturity;
  tools?: string;
  operationalBehavior?: string;
  kpis?: string;
  buyingInfluence?: string;
  channels?: string;
  motivators?: string;
  fears?: string;
  quote?: string;
  successDefinition?: string;

  createdAt: string;
  updatedAt: string;
}

// DiceBear avatar options (renderable as <img src=...>)
export interface AvatarOption {
  id: string;
  label: string;
  url: string;
}

const seeds = [
  "Aria", "Bruno", "Camila", "Diego", "Elena", "Felipe",
  "Gabriela", "Hugo", "Isabela", "Joao", "Karina", "Lucas",
  "Mariana", "Nicolas", "Olivia", "Paulo",
];

export const avatarOptions: AvatarOption[] = seeds.map((s) => ({
  id: s.toLowerCase(),
  label: s,
  url: `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(s)}&backgroundColor=b6e3f4,c0aede,d1d4f9,ffd5dc,ffdfbf`,
}));

export function getAvatar(id?: string): AvatarOption {
  return avatarOptions.find((a) => a.id === id) ?? avatarOptions[0];
}

export const digitalMaturityLabel: Record<DigitalMaturity, string> = {
  baixa: "Baixa",
  media: "Média",
  alta: "Alta",
};

export const scopeLabel: Record<PersonaScope, string> = {
  workspace: "Workspace",
  product: "Produto",
  pain: "Dor",
};

const now = new Date().toISOString();

export const initialPersonas: Persona[] = [
  {
    id: "PR-01",
    name: "Camila Souza",
    role: "Product Manager Sr.",
    age: 32,
    gender: "Feminino",
    avatarId: "camila",
    scope: "product",
    productId: "prod-core",
    segment: "SaaS B2B — Produto",
    companySize: "Scale-up (200–800 colaboradores)",
    responsibilities:
      "Discovery, priorização do roadmap, alinhamento com stakeholders e acompanhamento de outcomes.",
    dailyGoals:
      "Tomar decisões baseadas em evidências, manter o time focado, comunicar progresso à liderança.",
    pains:
      "Feedback espalhado, tempo gasto em consolidação manual, dificuldade de defender priorização.",
    buyingTriggers:
      "Pressão da liderança por previsibilidade; nova rodada de OKRs; entrada de PMs no time.",
    objections:
      "Custo, curva de adoção do time, integração com Jira/Notion/Slack já existentes.",
    decisionCriteria:
      "Tempo de implementação, qualidade da integração, ROI mensurável em 1 trimestre.",
    digitalMaturity: "alta",
    tools: "Jira, Notion, Figma, Miro, Slack, Amplitude.",
    operationalBehavior:
      "Trabalha em ciclos quinzenais, faz weekly reviews e acompanha métricas em dashboards próprios.",
    kpis: "Activation rate, NPS, time-to-first-value, % de outcomes entregues.",
    buyingInfluence: "Influenciadora forte; decisão final é do Head of Product.",
    channels: "LinkedIn, podcasts de produto, Lenny's Newsletter, comunidades como ProductLed.",
    motivators: "Crescer profissionalmente, gerar impacto mensurável, construir times maduros.",
    fears: "Entregar o produto errado, perder credibilidade com a liderança.",
    quote:
      "Eu não preciso de mais uma ferramenta — preciso de menos tempo gasto consolidando o óbvio.",
    successDefinition:
      "Quando o time entrega o que move o ponteiro do negócio, sem retrabalho.",
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PR-02",
    name: "Eduardo Lima",
    role: "Head of Product",
    age: 41,
    gender: "Masculino",
    avatarId: "diego",
    scope: "workspace",
    segment: "SaaS B2B — Liderança",
    companySize: "Scale-up / Enterprise",
    responsibilities:
      "Definir estratégia de produto, gerir PMs, reportar para C-level, alocar investimento.",
    dailyGoals:
      "Garantir alinhamento com OKRs, desenvolver o time, comunicar valor para o board.",
    pains:
      "Falta de visão consolidada de portfolio, reports manuais, dificuldade de medir maturidade do time.",
    buyingTriggers: "Mudança de CEO, fusão, crescimento acelerado do time.",
    objections: "Resistência do time, custo total de propriedade, segurança/compliance.",
    decisionCriteria: "Visão executiva, escalabilidade, suporte enterprise.",
    digitalMaturity: "alta",
    tools: "Tableau, Notion, Productboard, Slack.",
    operationalBehavior:
      "Reuniões 1:1, revisão de OKRs trimestral, comitê executivo mensal.",
    kpis: "Revenue, retenção, NPS executivo, throughput do time.",
    buyingInfluence: "Decisor final em compras estratégicas.",
    channels: "Reforge, Mind the Product, Harvard Business Review.",
    motivators: "Construir um produto referência, formar lideranças.",
    fears: "Não bater meta anual, perder talentos-chave.",
    quote: "Quero saber se estamos construindo o que importa — e quanto isso está nos custando.",
    successDefinition: "Crescimento sustentável com time engajado.",
    createdAt: now,
    updatedAt: now,
  },
];
