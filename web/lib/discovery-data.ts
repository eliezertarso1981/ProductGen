import type { PainOwner } from "./dores-data";

export type HypothesisStatus = "rascunho" | "em_teste" | "validada" | "invalidada";
export type ExperimentStatus = "planejado" | "em_andamento" | "concluido" | "cancelado";
export type ExperimentResult = "valida" | "invalida" | "inconclusivo" | null;
export type RoadmapStatus = "now" | "next" | "later" | "concluido";
export type OutcomeStatus = "hipotetizado" | "medindo" | "confirmado" | "nao_confirmado" | "inconclusivo";
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
  code?: string;
  apiStatus?: string;
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
  code?: string;
  apiStatus?: string;
  apiResult?: string | null;
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
  code?: string;
  apiStatus?: string;
  title: string;
  source: string;
  type: EvidenceType;
  notes: string;
  attachments: EvidenceAttachment[];
  createdAt: string;
  updatedAt: string;
}

export interface Insight {
  id: string;
  productId: string;
  code?: string;
  title: string;
  description: string;
  confidenceScore?: number | null;
  impactScore?: number | null;
  frequencyScore?: number | null;
  evidenceIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RoadmapItem {
  id: string;
  productId: string;
  painId?: string;
  hypothesisId?: string;
  code?: string;
  apiStatus?: string;
  title: string;
  description: string;
  status: RoadmapStatus;
  owner: PainOwner;
  targetDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Outcome {
  id: string;
  productId: string;
  roadmapItemId: string;
  code?: string;
  apiStatus?: string;
  keyResultId?: string;
  painId?: string;
  hypothesizedImpact: string;
  measurementWindowDays: number;
  status: OutcomeStatus;
  baselineValue?: number | null;
  finalValue?: number | null;
  conclusion?: string | null;
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

export const outcomeStatusConfig: Record<OutcomeStatus, { label: string; dot: string }> = {
  hipotetizado: { label: "Hipotetizado", dot: "var(--fg-faint)" },
  medindo: { label: "Medindo", dot: "var(--info)" },
  confirmado: { label: "Confirmado", dot: "var(--success)" },
  nao_confirmado: { label: "Não confirmado", dot: "var(--danger)" },
  inconclusivo: { label: "Inconclusivo", dot: "var(--warn-strong)" },
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
export const outcomeStatuses: OutcomeStatus[] = [
  "hipotetizado",
  "medindo",
  "confirmado",
  "nao_confirmado",
  "inconclusivo",
];
export const evidenceTypes: EvidenceType[] = ["entrevista", "metrica", "suporte", "nps", "outro"];

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getExperimentDisplayId(experimentOrId: Pick<Experiment, "id" | "code"> | string): string | null {
  if (typeof experimentOrId === "string") {
    return UUID_PATTERN.test(experimentOrId) ? null : experimentOrId;
  }
  return experimentOrId.code ?? (UUID_PATTERN.test(experimentOrId.id) ? null : experimentOrId.id);
}

export function getHypothesisDisplayId(hypothesisOrId: Pick<Hypothesis, "id" | "code"> | string): string | null {
  if (typeof hypothesisOrId === "string") {
    return UUID_PATTERN.test(hypothesisOrId) ? null : hypothesisOrId;
  }
  return hypothesisOrId.code ?? (UUID_PATTERN.test(hypothesisOrId.id) ? null : hypothesisOrId.id);
}

export function getEvidenceDisplayId(evidenceOrId: Pick<Evidence, "id" | "code"> | string): string | null {
  if (typeof evidenceOrId === "string") {
    return UUID_PATTERN.test(evidenceOrId) ? null : evidenceOrId;
  }
  return evidenceOrId.code ?? (UUID_PATTERN.test(evidenceOrId.id) ? null : evidenceOrId.id);
}

export function getInsightDisplayId(insightOrId: Pick<Insight, "id" | "code"> | string): string | null {
  if (typeof insightOrId === "string") {
    return UUID_PATTERN.test(insightOrId) ? null : insightOrId;
  }
  return insightOrId.code ?? (UUID_PATTERN.test(insightOrId.id) ? null : insightOrId.id);
}

export function getRoadmapDisplayId(roadmapOrId: Pick<RoadmapItem, "id" | "code"> | string): string | null {
  if (typeof roadmapOrId === "string") {
    return UUID_PATTERN.test(roadmapOrId) ? null : roadmapOrId;
  }
  return roadmapOrId.code ?? (UUID_PATTERN.test(roadmapOrId.id) ? null : roadmapOrId.id);
}

export function getOutcomeDisplayId(outcomeOrId: Pick<Outcome, "id" | "code"> | string): string | null {
  if (typeof outcomeOrId === "string") {
    return UUID_PATTERN.test(outcomeOrId) ? null : outcomeOrId;
  }
  return outcomeOrId.code ?? (UUID_PATTERN.test(outcomeOrId.id) ? null : outcomeOrId.id);
}
