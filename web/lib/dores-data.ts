export type PainStatus = "backlog" | "em_validacao" | "validada" | "descartada";

export interface PersonaTag {
  id: string;
  initial: string;
  color: string;
}

export interface PainOwner {
  id: string;
  initials: string;
  color: string;
  name?: string;
}

export interface PainAttachment {
  id: string;
  name: string;
  size: number;
  type: string;
  dataUrl?: string;
  addedAt: string;
}

export interface PainComment {
  id: string;
  author: PainOwner;
  text: string;
  createdAt: string;
}

export interface Pain {
  id: string;
  productId: string;
  title: string;
  description: string;
  status: PainStatus;
  severity: 1 | 2 | 3 | 4 | 5;
  reach: number;
  evidences: number;
  hypotheses: number;
  personas: PersonaTag[];
  owner: PainOwner;
  responsibles: PainOwner[];
  attachments: PainAttachment[];
  comments: PainComment[];
  pillarId?: string;
  okrIds?: string[];
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export const personas: Record<string, PersonaTag> = {
  S: { id: "S", initial: "S", color: "var(--primary)" },
  E: { id: "E", initial: "E", color: "var(--purple)" },
  D: { id: "D", initial: "D", color: "#b45309" },
};

export const owners: Record<string, PainOwner> = {
  CM: { id: "CM", initials: "CM", color: "var(--primary)", name: "Camila Moraes" },
  JC: { id: "JC", initials: "JC", color: "var(--warn-strong)", name: "João Costa" },
  AS: { id: "AS", initials: "AS", color: "var(--purple)", name: "Ana Silva" },
  RP: { id: "RP", initials: "RP", color: "var(--cyan)", name: "Rafael Pires" },
};

export const ownersList = Object.values(owners);

export const statusConfig: Record<PainStatus, { label: string; dot: string; accent?: string }> = {
  backlog: { label: "Backlog", dot: "var(--fg-faint)" },
  em_validacao: { label: "Em validação", dot: "var(--info)", accent: "var(--info)" },
  validada: { label: "Validada", dot: "var(--success)" },
  descartada: { label: "Descartada", dot: "var(--border-strong)" },
};

export const boardColumns: PainStatus[] = ["backlog", "em_validacao", "validada", "descartada"];

export function severityColor(level: 1 | 2 | 3 | 4 | 5): string {
  if (level <= 2) return "var(--success)";
  if (level <= 4) return "var(--warn)";
  return "var(--danger)";
}

const now = new Date().toISOString();

export const initialPains: Pain[] = [
  {
    id: "PN-01",
    productId: "prod-core",
    title: "PMs perdem horas consolidando feedback de múltiplas fontes",
    description:
      "Feedback vive espalhado em Slack, email, Zendesk, Notion. PMs gastam até 4h/semana consolidando.",
    status: "validada",
    severity: 5,
    reach: 320,
    evidences: 9,
    hypotheses: 2,
    personas: [personas.S, personas.E],
    owner: owners.AS,
    responsibles: [owners.AS, owners.CM],
    attachments: [],
    comments: [
      {
        id: "c1",
        author: owners.CM,
        text: "Validei com 5 PMs em entrevistas — todos confirmaram o problema.",
        createdAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-02",
    productId: "prod-core",
    title: "Time-to-value alto pra novos clientes",
    description:
      "Novos clientes levam em média 2 semanas pra modelar estratégia inicial. Muitos abandonam antes.",
    status: "em_validacao",
    severity: 4,
    reach: 180,
    evidences: 8,
    hypotheses: 2,
    personas: [personas.S],
    owner: owners.CM,
    responsibles: [owners.CM],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-03",
    productId: "prod-core",
    title: "Falta de relatórios executivos prontos",
    description:
      "Liderança quer reports mensais, e PMs montam manualmente em PowerPoint. Esforço de 4–6h/mês por PM.",
    status: "em_validacao",
    severity: 4,
    reach: 150,
    evidences: 6,
    hypotheses: 1,
    personas: [personas.E],
    owner: owners.JC,
    responsibles: [owners.JC],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-04",
    productId: "prod-mobile",
    title: "Performance ruim no mobile gera abandono",
    description: "Timeline carrega em 8s no mobile. 78% abandonam em <30s.",
    status: "backlog",
    severity: 4,
    reach: 280,
    evidences: 4,
    hypotheses: 1,
    personas: [personas.S, personas.E],
    owner: owners.CM,
    responsibles: [owners.CM, owners.RP],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-05",
    productId: "prod-core",
    title: "Difícil rastrear quais decisões mudaram porque",
    description:
      'Mudanças de prioridade no roadmap acontecem mas o motivo se perde. Time pergunta "por que isso saiu?"',
    status: "backlog",
    severity: 3,
    reach: 110,
    evidences: 3,
    hypotheses: 0,
    personas: [personas.S, personas.E],
    owner: owners.AS,
    responsibles: [owners.AS],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-06",
    productId: "prod-insights",
    title: "Falta integração com algumas ferramentas de nicho",
    description: "Pedidos esporádicos de integrações com tools de pequena adoção.",
    status: "descartada",
    severity: 1,
    reach: 30,
    evidences: 1,
    hypotheses: 0,
    personas: [personas.E],
    owner: owners.AS,
    responsibles: [owners.AS],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
  {
    id: "PN-07",
    productId: "prod-core",
    title: "Falta exportação de roadmap para PowerPoint",
    description:
      "PMs precisam apresentar roadmap pra liderança e gastam tempo refazendo slides manualmente.",
    status: "backlog",
    severity: 2,
    reach: 95,
    evidences: 3,
    hypotheses: 0,
    personas: [personas.E],
    owner: owners.JC,
    responsibles: [owners.JC],
    attachments: [],
    comments: [],
    createdAt: now,
    updatedAt: now,
  },
];
