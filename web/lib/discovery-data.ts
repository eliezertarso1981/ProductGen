import type { PainOwner } from "./dores-data";

export type HypothesisStatus = "rascunho" | "em_teste" | "validada" | "invalidada";
export type ExperimentStatus = "planejado" | "em_andamento" | "concluido" | "cancelado";
export type ExperimentResult = "valida" | "invalida" | "inconclusivo" | null;
export type RoadmapStatus = "now" | "next" | "later" | "concluido";
export type EvidenceType = "entrevista" | "metrica" | "suporte" | "nps" | "outro";

export interface HypothesisPrototype {
  id: string;
  label: string;
  url: string;
  source?: "figma" | "maze" | "invision" | "framer" | "other";
  addedAt: string;
}

export interface HypothesisImage {
  id: string;
  name: string;
  dataUrl: string;
  size: number;
  addedAt: string;
}

export interface Hypothesis {
  id: string;
  productId: string;
  painId?: string;
  title: string;
  statement: string;
  status: HypothesisStatus;
  owner: PainOwner;
  prototypes: HypothesisPrototype[];
  images: HypothesisImage[];
  createdAt: string;
  updatedAt: string;
}

export interface Experiment {
  id: string;
  productId: string;
  hypothesisId?: string;
  title: string;
  description: string;
  method: string;
  expectedResults: string[];
  status: ExperimentStatus;
  result: ExperimentResult;
  owner: PainOwner;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface EvidenceAttachment {
  id: string;
  label: string;
  url: string;
}

export interface Evidence {
  id: string;
  productId: string;
  experimentId?: string;
  title: string;
  source: string;
  type: EvidenceType;
  notes: string;
  attachments: EvidenceAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  productId: string;
  painId?: string;
  hypothesisId?: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  owner: PainOwner;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}


export const hypothesisStatusConfig: Record<HypothesisStatus, { label: string; dot: string }> = {
  rascunho: { label: "Rascunho", dot: "var(--fg-faint)" },
  em_teste: { label: "Em teste", dot: "var(--info)" },
  validada: { label: "Validada", dot: "var(--success)" },
  invalidada: { label: "Invalidada", dot: "var(--danger)" },
};

export const experimentStatusConfig: Record<ExperimentStatus, { label: string; dot: string }> = {
  planejado: { label: "Planejado", dot: "var(--fg-faint)" },
  em_andamento: { label: "Em andamento", dot: "var(--info)" },
  concluido: { label: "Concluído", dot: "var(--success)" },
  cancelado: { label: "Cancelado", dot: "var(--border-strong)" },
};

export const experimentResultConfig: Record<
  Exclude<ExperimentResult, null>,
  { label: string; color: string }
> = {
  valida: { label: "Valida hipótese", color: "var(--success)" },
  invalida: { label: "Invalida hipótese", color: "var(--danger)" },
  inconclusivo: { label: "Inconclusivo", color: "var(--fg-faint)" },
};

export const roadmapStatusConfig: Record<RoadmapStatus, { label: string; dot: string }> = {
  now: { label: "Now", dot: "var(--primary)" },
  next: { label: "Next", dot: "var(--info)" },
  later: { label: "Later", dot: "var(--fg-faint)" },
  concluido: { label: "Concluído", dot: "var(--success)" },
};

export const evidenceTypeConfig: Record<EvidenceType, { label: string; color: string }> = {
  entrevista: { label: "Entrevista", color: "var(--purple)" },
  metrica: { label: "Métrica", color: "var(--cyan)" },
  suporte: { label: "Ticket/Suporte", color: "var(--warn-strong)" },
  nps: { label: "NPS", color: "var(--success)" },
  outro: { label: "Outro", color: "var(--fg-faint)" },
};

export const hypothesisStatuses: HypothesisStatus[] = [
  "rascunho",
  "em_teste",
  "validada",
  "invalidada",
];
export const experimentStatuses: ExperimentStatus[] = [
  "planejado",
  "em_andamento",
  "concluido",
  "cancelado",
];
export const roadmapStatuses: RoadmapStatus[] = ["now", "next", "later", "concluido"];
export const evidenceTypes: EvidenceType[] = ["entrevista", "metrica", "suporte", "nps", "outro"];
