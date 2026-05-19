"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { owners } from "./dores-data";
import { useDores } from "./dores-store";
import { useProducts } from "./products-context";
import {
  type ApiEvidence,
  type ApiEvidenceSource,
  type ApiEvidenceStatus,
  type ApiExperiment,
  type ApiExperimentMethod,
  type ApiExperimentResult,
  type ApiExperimentStatus,
  type ApiHypothesis,
  type ApiHypothesisStatus,
  type ApiInsight,
  type LinkedHypothesis,
  type ApiOutcome,
  type ApiOutcomeStatus,
  type ApiRoadmapItem,
  type ApiRoadmapStatus,
  createOutcomeInApi,
  createInsightInApi,
  createExperimentInApi,
  createEvidenceInApi,
  createHypothesisInApi,
  createRoadmapInApi,
  deleteEvidenceInApi,
  deleteExperimentInApi,
  deleteHypothesisInApi,
  deleteInsightInApi,
  deleteOutcomeInApi,
  deleteRoadmapInApi,
  getExperimentFromApi,
  getHypothesisFromApi,
  getInsightFromApi,
  getOutcomeFromApi,
  getRoadmapFromApi,
  isProductgenApiConfigured,
  linkInsightEvidenceInApi,
  linkHypothesisRoadmapInApi,
  linkPainHypothesisInApi,
  listEvidencesFromApi,
  listExperimentsFromApi,
  listHypothesisRoadmapFromApi,
  listHypothesesFromApi,
  listInsightEvidencesFromApi,
  listInsightsFromApi,
  listOutcomesFromApi,
  listPainHypothesesFromApi,
  listRoadmapFromApi,
  transitionExperimentStatusInApi,
  transitionEvidenceStatusInApi,
  transitionRoadmapStatusInApi,
  transitionOutcomeStatusInApi,
  unlinkInsightEvidenceInApi,
  unlinkPainHypothesisInApi,
  updateEvidenceInApi,
  updateExperimentInApi,
  updateInsightInApi,
  updateOutcomeInApi,
  updateRoadmapInApi,
  transitionHypothesisStatusInApi,
  updateHypothesisInApi,
} from "./productgen-api";
import type {
  Evidence,
  Experiment,
  ExperimentResult,
  EvidenceAttachment,
  Hypothesis,
  Insight,
  Outcome,
  RoadmapItem,
} from "./discovery-data";

const STORAGE_KEY = "discovery-store-v1";

interface State {
  hypotheses: Hypothesis[];
  painHypothesisLinks: Record<string, string[]>;
  experiments: Experiment[];
  evidences: Evidence[];
  insights: Insight[];
  roadmap: RoadmapItem[];
  outcomes: Outcome[];
}

const now = () => new Date().toISOString();

const seedHypotheses: Hypothesis[] = [
  {
    id: "HP-01",
    productId: "prod-core",
    painId: "PN-01",
    title: "Hub central de feedback reduz tempo de consolidação",
    statement:
      "Acreditamos que se PMs tiverem um hub que conecta Slack/Zendesk/email, reduziremos o tempo de consolidação em 70%.",
    status: "em_teste",
    owner: owners.AS,
    prototypes: [],
    images: [],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "HP-02",
    productId: "prod-core",
    painId: "PN-02",
    title: "Templates de modelagem aceleram onboarding",
    statement:
      "Acreditamos que templates por vertical reduzirão o time-to-value de 2 semanas para 3 dias.",
    status: "rascunho",
    owner: owners.CM,
    prototypes: [],
    images: [],
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedExperiments: Experiment[] = [
  {
    id: "EX-01",
    productId: "prod-core",
    hypothesisId: "HP-01",
    title: "Piloto com 5 PMs usando integração Slack",
    description: "MVP de integração unidirecional Slack → hub. 2 semanas.",
    method: "Concierge MVP + entrevistas semanais",
    expectedResults: [
      "≥ 3 dos 5 PMs reduzem ≥ 2h/semana em consolidação manual",
      "NPS qualitativo positivo em pelo menos 4 entrevistas",
    ],
    status: "em_andamento",
    result: null,
    owner: owners.AS,
    startDate: now(),
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedEvidences: Evidence[] = [
  {
    id: "EV-01",
    productId: "prod-core",
    experimentId: "EX-01",
    title: "PM-1 reduziu 3h/semana após 1 semana de uso",
    source: "Entrevista 12/05",
    type: "entrevista",
    notes: "Antes consolidava manualmente. Hub eliminou cópia/cola entre 4 ferramentas.",
    attachments: [
      { id: "att-1", label: "Transcrição da entrevista", url: "https://docs.google.com/document/d/exemplo" },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedInsights: Insight[] = [
  {
    id: "IN-01",
    productId: "prod-core",
    title: "Exportação concentra atrito recorrente",
    description: "Tickets e entrevistas apontam a exportação CSV como gargalo frequente no fluxo de análise.",
    confidenceScore: 0.7,
    impactScore: 0.8,
    frequencyScore: 0.6,
    evidenceIds: ["EV-01"],
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedRoadmap: RoadmapItem[] = [
  {
    id: "RM-01",
    productId: "prod-core",
    painId: "PN-01",
    title: "Hub de feedback v1",
    description: "Integrações com Slack, Zendesk e email + visão consolidada.",
    status: "now",
    owner: owners.AS,
    targetDate: now(),
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedOutcomes: Outcome[] = [
  {
    id: "OC-01",
    productId: "prod-core",
    roadmapItemId: "RM-01",
    hypothesizedImpact: "Reduzir o tempo de consolidação de feedback após entregar o hub v1.",
    measurementWindowDays: 30,
    status: "hipotetizado",
    baselineValue: 4,
    finalValue: null,
    conclusion: null,
    createdAt: now(),
    updatedAt: now(),
  },
];

const initialState: State = {
  hypotheses: seedHypotheses,
  painHypothesisLinks: buildPainHypothesisLinks(seedHypotheses),
  experiments: seedExperiments,
  evidences: seedEvidences,
  insights: seedInsights,
  roadmap: seedRoadmap,
  outcomes: seedOutcomes,
};

interface Ctx extends State {
  ready: boolean;
  isRemoteBacked: boolean;
  syncError?: string;
  // hypotheses
  getHypothesis: (id: string) => Hypothesis | undefined;
  createHypothesis: (productId: string, painId?: string) => Promise<Hypothesis>;
  updateHypothesis: (id: string, patch: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  hypothesesByPain: (painId: string) => Hypothesis[];
  // experiments
  getExperiment: (id: string) => Experiment | undefined;
  createExperiment: (productId: string, hypothesisId?: string) => Promise<Experiment>;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  experimentsByHypothesis: (hypothesisId: string) => Experiment[];
  setExperimentResult: (id: string, result: ExperimentResult) => void;
  // evidences
  getEvidence: (id: string) => Evidence | undefined;
  createEvidence: (productId: string, experimentId?: string) => Promise<Evidence>;
  updateEvidence: (id: string, patch: Partial<Evidence>) => void;
  deleteEvidence: (id: string) => void;
  evidencesByExperiment: (experimentId: string) => Evidence[];
  // insights
  getInsight: (id: string) => Insight | undefined;
  createInsight: (productId: string, evidenceId?: string) => Promise<Insight>;
  updateInsight: (id: string, patch: Partial<Insight>) => void;
  deleteInsight: (id: string) => void;
  insightsByEvidence: (evidenceId: string) => Insight[];
  linkInsightEvidence: (insightId: string, evidenceId: string) => void;
  unlinkInsightEvidence: (insightId: string, evidenceId: string) => void;
  // roadmap
  getRoadmap: (id: string) => RoadmapItem | undefined;
  createRoadmap: (productId: string, painId?: string, hypothesisId?: string) => Promise<RoadmapItem>;

  updateRoadmap: (id: string, patch: Partial<RoadmapItem>) => void;
  deleteRoadmap: (id: string) => void;
  roadmapByPain: (painId: string) => RoadmapItem[];
  // outcomes
  getOutcome: (id: string) => Outcome | undefined;
  createOutcome: (roadmapItemId: string) => Promise<Outcome>;
  updateOutcome: (id: string, patch: Partial<Outcome>) => void;
  deleteOutcome: (id: string) => void;
  outcomesByRoadmap: (roadmapItemId: string) => Outcome[];
}

const DiscoveryCtx = createContext<Ctx | null>(null);

const API_TO_UI_HYPOTHESIS_STATUS: Record<ApiHypothesisStatus, Hypothesis["status"]> = {
  formulated: "rascunho",
  validating: "em_teste",
  validated: "validada",
  invalidated: "invalidada",
  in_execution: "validada",
  delivered: "validada",
  deprioritized: "validada",
  discarded: "invalidada",
};

const UI_TO_API_HYPOTHESIS_STATUS: Record<Hypothesis["status"], ApiHypothesisStatus> = {
  rascunho: "formulated",
  em_teste: "validating",
  validada: "validated",
  invalidada: "invalidated",
};

const API_TO_UI_EXPERIMENT_STATUS: Record<ApiExperimentStatus, Experiment["status"]> = {
  planned: "planejado",
  running: "em_andamento",
  completed: "concluido",
  analyzed: "concluido",
};

const UI_TO_API_EXPERIMENT_STATUS: Record<Experiment["status"], ApiExperimentStatus> = {
  planejado: "planned",
  em_andamento: "running",
  concluido: "completed",
  cancelado: "completed",
};

const API_TO_UI_EXPERIMENT_RESULT: Record<ApiExperimentResult, NonNullable<ExperimentResult>> = {
  validated: "valida",
  invalidated: "invalida",
  inconclusive: "inconclusivo",
};

const UI_TO_API_EXPERIMENT_RESULT: Record<NonNullable<ExperimentResult>, ApiExperimentResult> = {
  valida: "validated",
  invalida: "invalidated",
  inconclusivo: "inconclusive",
};

const UI_TO_API_EXPERIMENT_METHOD: Record<string, ApiExperimentMethod> = {
  entrevista: "interview",
  interview: "interview",
  prototipo: "prototype",
  prototype: "prototype",
  "a/b": "ab_test",
  "ab test": "ab_test",
  "a/b test": "ab_test",
  "fake door": "fake_door",
  survey: "survey",
  beta: "beta",
  concierge: "concierge",
  "wizard of oz": "wizard_of_oz",
};

const UI_TO_API_EVIDENCE_SOURCE: Record<string, ApiEvidenceSource> = {
  entrevista: "interview",
  metrica: "usage_data",
  suporte: "support_ticket",
  nps: "nps",
  outro: "other",
};

const API_TO_UI_EVIDENCE_TYPE: Record<ApiEvidenceSource, Evidence["type"]> = {
  interview: "entrevista",
  support_ticket: "suporte",
  nps: "nps",
  sales_call: "entrevista",
  usage_data: "metrica",
  survey: "entrevista",
  review: "outro",
  internal: "outro",
  other: "outro",
};

const API_TO_UI_ROADMAP_STATUS: Record<ApiRoadmapStatus, RoadmapItem["status"]> = {
  proposed: "later",
  planned: "next",
  in_development: "now",
  in_validation: "now",
  delivered: "concluido",
  measuring_outcome: "concluido",
  cancelled: "later",
  rolled_back: "later",
};

const UI_TO_API_ROADMAP_STATUS: Record<RoadmapItem["status"], ApiRoadmapStatus> = {
  later: "proposed",
  next: "planned",
  now: "in_development",
  concluido: "delivered",
};

const API_TO_UI_OUTCOME_STATUS: Record<ApiOutcomeStatus, Outcome["status"]> = {
  hypothesized: "hipotetizado",
  measuring: "medindo",
  confirmed: "confirmado",
  not_confirmed: "nao_confirmado",
  inconclusive: "inconclusivo",
};

const UI_TO_API_OUTCOME_STATUS: Record<Outcome["status"], ApiOutcomeStatus> = {
  hipotetizado: "hypothesized",
  medindo: "measuring",
  confirmado: "confirmed",
  nao_confirmado: "not_confirmed",
  inconclusivo: "inconclusive",
};

function nextId(prefix: string, list: { id: string }[]): string {
  const nums = list.map((x) => parseInt(x.id.replace(/\D/g, ""), 10)).filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

function buildPainHypothesisLinks(hypotheses: Hypothesis[]): Record<string, string[]> {
  return hypotheses.reduce<Record<string, string[]>>((links, hypothesis) => {
    if (!hypothesis.painId) return links;
    links[hypothesis.painId] = [...(links[hypothesis.painId] ?? []), hypothesis.id];
    return links;
  }, {});
}

function setPainHypothesisLink(
  links: Record<string, string[]>,
  hypothesisId: string,
  previousPainId: string | undefined,
  nextPainId: string | undefined,
): Record<string, string[]> {
  const nextLinks = Object.fromEntries(
    Object.entries(links).map(([painId, hypothesisIds]) => [
      painId,
      previousPainId === painId ? hypothesisIds.filter((id) => id !== hypothesisId) : hypothesisIds,
    ]),
  );

  if (nextPainId) {
    nextLinks[nextPainId] = Array.from(new Set([...(nextLinks[nextPainId] ?? []), hypothesisId]));
  }

  return nextLinks;
}

function removeHypothesisFromPainLinks(
  links: Record<string, string[]>,
  hypothesisId: string,
): Record<string, string[]> {
  return Object.fromEntries(
    Object.entries(links).map(([painId, hypothesisIds]) => [
      painId,
      hypothesisIds.filter((id) => id !== hypothesisId),
    ]),
  );
}

function fromApiHypothesis(hypothesis: ApiHypothesis, painId?: string): Hypothesis {
  return {
    id: hypothesis.id,
    productId: hypothesis.product_id,
    painId,
    code: hypothesis.code,
    apiStatus: hypothesis.status,
    title: hypothesis.title,
    statement: formatHypothesisStatement(hypothesis),
    status: API_TO_UI_HYPOTHESIS_STATUS[hypothesis.status] ?? "rascunho",
    owner: owners.CM,
    prototypes: [],
    images: [],
    createdAt: hypothesis.created_at,
    updatedAt: hypothesis.updated_at,
  };
}

function fromLinkedHypothesis(hypothesis: LinkedHypothesis, painId: string, productId: string): Hypothesis {
  return {
    id: hypothesis.id,
    productId,
    painId,
    code: hypothesis.code,
    apiStatus: hypothesis.status,
    title: hypothesis.title,
    statement: "Acreditamos que ...",
    status: API_TO_UI_HYPOTHESIS_STATUS[hypothesis.status] ?? "rascunho",
    owner: owners.CM,
    prototypes: [],
    images: [],
    createdAt: hypothesis.linked_at,
    updatedAt: hypothesis.linked_at,
  };
}

function mergeLocalHypothesis(localHypothesis: Hypothesis, remoteHypothesis: ApiHypothesis): Hypothesis {
  return {
    ...localHypothesis,
    productId: remoteHypothesis.product_id,
    code: remoteHypothesis.code,
    apiStatus: remoteHypothesis.status,
    title: remoteHypothesis.title,
    statement: localHypothesis.statement,
    status: API_TO_UI_HYPOTHESIS_STATUS[remoteHypothesis.status] ?? localHypothesis.status,
    updatedAt: remoteHypothesis.updated_at,
  };
}

function formatHypothesisStatement(hypothesis: ApiHypothesis): string {
  const ifClause = hypothesis.if_clause.trim();
  const thenClause = hypothesis.then_clause.trim();
  const becauseClause = hypothesis.because_clause.trim();

  if (!thenClause && !becauseClause) return ifClause;
  return `Acreditamos que se ${ifClause}, então ${thenClause}, porque ${becauseClause}.`;
}

function splitHypothesisStatement(statement: string) {
  const trimmed = statement.trim();
  const match = trimmed.match(/^Acreditamos que se (.*), ent[aã]o (.*), porque (.*)\.?$/i);

  if (!match) {
    return {
      if_clause: trimmed || "Acreditamos que ...",
      then_clause: "validaremos a hipótese",
      because_clause: "há evidência relevante para investigar",
    };
  }

  return {
    if_clause: match[1].trim(),
    then_clause: match[2].trim(),
    because_clause: match[3].replace(/\.$/, "").trim(),
  };
}

function toApiHypothesisCreatePayload(hypothesis: Hypothesis) {
  return {
    title: hypothesis.title,
    ...splitHypothesisStatement(hypothesis.statement),
    assumptions: [],
  };
}

function toApiHypothesisPatchPayload(patch: Partial<Hypothesis>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.statement !== undefined ? splitHypothesisStatement(patch.statement) : {}),
  };
}

async function transitionHypothesisThroughLifecycle(
  hypothesis: Hypothesis,
  targetStatus: Hypothesis["status"],
) {
  const currentStatus =
    (hypothesis.apiStatus as ApiHypothesisStatus | undefined) ?? UI_TO_API_HYPOTHESIS_STATUS[hypothesis.status];
  const targetApiStatus = UI_TO_API_HYPOTHESIS_STATUS[targetStatus];
  const path = getHypothesisTransitionPath(currentStatus, targetApiStatus);
  let remoteHypothesis: ApiHypothesis | null = null;

  for (const status of path) {
    remoteHypothesis = await transitionHypothesisStatusInApi(
      hypothesis.id,
      status,
      status === "invalidated" || status === "discarded" ? "Marcada pela interface" : undefined,
    );
  }

  return remoteHypothesis ?? getHypothesisFromApi(hypothesis.id);
}

async function syncHypothesisPainLink(
  hypothesisId: string,
  previousPainId: string | undefined,
  nextPainId: string | undefined,
) {
  if (previousPainId) {
    await unlinkPainHypothesisInApi(previousPainId, hypothesisId);
  }
  if (nextPainId) {
    await linkPainHypothesisInApi(nextPainId, hypothesisId);
  }
}

function getHypothesisTransitionPath(
  currentStatus: ApiHypothesisStatus,
  targetStatus: ApiHypothesisStatus,
): ApiHypothesisStatus[] {
  if (currentStatus === targetStatus) return [];

  const directTransitions: Partial<Record<ApiHypothesisStatus, ApiHypothesisStatus[]>> = {
    formulated: ["validating", "discarded"],
    validating: ["validated", "invalidated", "formulated"],
    validated: ["in_execution", "deprioritized", "validating"],
    in_execution: ["delivered", "deprioritized"],
    deprioritized: ["validated", "in_execution"],
    invalidated: ["formulated"],
    discarded: ["formulated"],
  };

  if (directTransitions[currentStatus]?.includes(targetStatus)) return [targetStatus];

  if (targetStatus === "validated" && currentStatus === "formulated") return ["validating", "validated"];
  if (targetStatus === "invalidated" && currentStatus === "formulated") return ["validating", "invalidated"];
  if (targetStatus === "validating" && (currentStatus === "invalidated" || currentStatus === "discarded")) {
    return ["formulated", "validating"];
  }
  if (targetStatus === "formulated" && currentStatus === "validated") return ["validating", "formulated"];

  return [targetStatus];
}

function fromApiExperiment(experiment: ApiExperiment): Experiment {
  return {
    id: experiment.id,
    productId: experiment.product_id,
    hypothesisId: experiment.hypothesis_id,
    code: experiment.code,
    apiStatus: experiment.status,
    apiResult: experiment.result,
    title: experiment.title,
    description: experiment.learnings ?? "",
    method: experiment.method,
    expectedResults: experiment.success_criteria ? [experiment.success_criteria] : [],
    status: API_TO_UI_EXPERIMENT_STATUS[experiment.status] ?? "planejado",
    result: experiment.result ? API_TO_UI_EXPERIMENT_RESULT[experiment.result] : null,
    owner: owners.CM,
    startDate: experiment.started_at ?? undefined,
    endDate: experiment.ended_at ?? undefined,
    createdAt: experiment.created_at,
    updatedAt: experiment.updated_at,
  };
}

function mergeLocalExperiment(localExperiment: Experiment, remoteExperiment: ApiExperiment): Experiment {
  return {
    ...localExperiment,
    productId: remoteExperiment.product_id,
    hypothesisId: remoteExperiment.hypothesis_id,
    code: remoteExperiment.code,
    apiStatus: remoteExperiment.status,
    apiResult: remoteExperiment.result,
    title: remoteExperiment.title,
    method: remoteExperiment.method,
    expectedResults: remoteExperiment.success_criteria
      ? [remoteExperiment.success_criteria]
      : localExperiment.expectedResults,
    status: API_TO_UI_EXPERIMENT_STATUS[remoteExperiment.status] ?? localExperiment.status,
    result: remoteExperiment.result
      ? API_TO_UI_EXPERIMENT_RESULT[remoteExperiment.result]
      : localExperiment.result,
    startDate: remoteExperiment.started_at ?? localExperiment.startDate,
    endDate: remoteExperiment.ended_at ?? localExperiment.endDate,
    updatedAt: remoteExperiment.updated_at,
  };
}

function toApiExperimentMethod(method: string): ApiExperimentMethod {
  const normalized = method.trim().toLowerCase();
  return UI_TO_API_EXPERIMENT_METHOD[normalized] ?? "other";
}

function toApiExperimentSuccessCriteria(experiment: Pick<Experiment, "expectedResults" | "description">) {
  const criteria = experiment.expectedResults.map((item) => item.trim()).filter(Boolean).join("\n");
  const fallback = experiment.description.trim();
  return criteria || fallback || "Critério de sucesso a definir";
}

function toApiExperimentCreatePayload(experiment: Experiment) {
  return {
    title: experiment.title,
    method: toApiExperimentMethod(experiment.method),
    success_criteria: toApiExperimentSuccessCriteria(experiment),
  };
}

function toApiExperimentPatchPayload(patch: Partial<Experiment>, current: Experiment) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.method !== undefined ? { method: toApiExperimentMethod(patch.method) } : {}),
    ...(patch.expectedResults !== undefined || patch.description !== undefined
      ? {
          success_criteria: toApiExperimentSuccessCriteria({
            expectedResults: patch.expectedResults ?? current.expectedResults,
            description: patch.description ?? current.description,
          }),
        }
      : {}),
  };
}

async function transitionExperimentThroughLifecycle(
  experiment: Experiment,
  targetStatus: Experiment["status"],
) {
  const currentStatus =
    (experiment.apiStatus as ApiExperimentStatus | undefined) ?? UI_TO_API_EXPERIMENT_STATUS[experiment.status];
  const targetApiStatus = UI_TO_API_EXPERIMENT_STATUS[targetStatus];
  const path = getExperimentTransitionPath(currentStatus, targetApiStatus);
  let remoteExperiment: ApiExperiment | null = null;

  for (const status of path) {
    remoteExperiment = await transitionExperimentStatusInApi(experiment.id, status);
  }

  return remoteExperiment ?? getExperimentFromApi(experiment.id);
}

function getExperimentTransitionPath(
  currentStatus: ApiExperimentStatus,
  targetStatus: ApiExperimentStatus,
): ApiExperimentStatus[] {
  if (currentStatus === targetStatus) return [];
  if (currentStatus === "planned" && targetStatus === "completed") return ["completed"];
  if (currentStatus === "planned" && targetStatus === "analyzed") return ["completed", "analyzed"];
  if (currentStatus === "running" && targetStatus === "analyzed") return ["completed", "analyzed"];
  if (currentStatus === "analyzed" && targetStatus === "completed") return ["completed"];
  return [targetStatus];
}

function fromApiEvidence(evidence: ApiEvidence): Evidence {
  const metadata = evidence.metadata ?? {};
  return {
    id: evidence.id,
    productId: evidence.product_id ?? "",
    experimentId: typeof metadata.experiment_id === "string" ? metadata.experiment_id : undefined,
    code: evidence.code,
    apiStatus: evidence.status,
    title: evidence.title,
    source: evidence.customer_identifier ?? evidence.source,
    type: API_TO_UI_EVIDENCE_TYPE[evidence.source] ?? "outro",
    notes: evidence.content,
    attachments: getEvidenceAttachments(metadata),
    createdAt: evidence.created_at,
    updatedAt: evidence.updated_at,
  };
}

function mergeLocalEvidence(localEvidence: Evidence, remoteEvidence: ApiEvidence): Evidence {
  const metadata = remoteEvidence.metadata ?? {};
  return {
    ...localEvidence,
    productId: remoteEvidence.product_id ?? localEvidence.productId,
    experimentId:
      typeof metadata.experiment_id === "string" ? metadata.experiment_id : localEvidence.experimentId,
    code: remoteEvidence.code,
    apiStatus: remoteEvidence.status,
    title: remoteEvidence.title,
    source: remoteEvidence.customer_identifier ?? remoteEvidence.source,
    type: API_TO_UI_EVIDENCE_TYPE[remoteEvidence.source] ?? localEvidence.type,
    notes: remoteEvidence.content,
    attachments: getEvidenceAttachments(metadata),
    updatedAt: remoteEvidence.updated_at,
  };
}

function getEvidenceAttachments(metadata: Record<string, unknown>): EvidenceAttachment[] {
  return Array.isArray(metadata.attachments) ? (metadata.attachments as EvidenceAttachment[]) : [];
}

function toApiEvidenceSource(type: Evidence["type"]): ApiEvidenceSource {
  return UI_TO_API_EVIDENCE_SOURCE[type] ?? "other";
}

function toApiEvidenceCreatePayload(evidence: Evidence) {
  return {
    title: evidence.title,
    content: evidence.notes || "Conteúdo da evidência a preencher",
    source: toApiEvidenceSource(evidence.type),
    customer_identifier: evidence.source || null,
    collected_at: evidence.createdAt,
    metadata: toApiEvidenceMetadata(evidence),
  };
}

function toApiEvidencePatchPayload(patch: Partial<Evidence>, current: Evidence) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.notes !== undefined ? { content: patch.notes || "Conteúdo da evidência a preencher" } : {}),
    ...(patch.type !== undefined ? { source: toApiEvidenceSource(patch.type) } : {}),
    ...(patch.source !== undefined ? { customer_identifier: patch.source || null } : {}),
    ...(patch.attachments !== undefined || patch.experimentId !== undefined
      ? { metadata: toApiEvidenceMetadata({ ...current, ...patch }) }
      : {}),
  };
}

function toApiEvidenceMetadata(evidence: Pick<Evidence, "attachments" | "experimentId">) {
  return {
    attachments: evidence.attachments,
    ...(evidence.experimentId ? { experiment_id: evidence.experimentId } : {}),
  };
}

function fromApiInsight(insight: ApiInsight, evidenceIds: string[] = []): Insight {
  return {
    id: insight.id,
    productId: insight.product_id,
    code: insight.code,
    title: insight.title,
    description: insight.description,
    confidenceScore: toNumberOrNull(insight.confidence_score),
    impactScore: toNumberOrNull(insight.impact_score),
    frequencyScore: toNumberOrNull(insight.frequency_score),
    evidenceIds,
    createdAt: insight.created_at,
    updatedAt: insight.updated_at,
  };
}

function mergeLocalInsight(localInsight: Insight, remoteInsight: ApiInsight): Insight {
  return {
    ...localInsight,
    productId: remoteInsight.product_id,
    code: remoteInsight.code,
    title: remoteInsight.title,
    description: remoteInsight.description,
    confidenceScore: toNumberOrNull(remoteInsight.confidence_score),
    impactScore: toNumberOrNull(remoteInsight.impact_score),
    frequencyScore: toNumberOrNull(remoteInsight.frequency_score),
    updatedAt: remoteInsight.updated_at,
  };
}

function toNumberOrNull(value: number | string | null): number | null {
  if (value === null) return null;
  return typeof value === "number" ? value : Number(value);
}

function toApiInsightCreatePayload(insight: Insight) {
  return {
    title: insight.title,
    description: insight.description || "Descrição do insight a preencher",
    ...(insight.confidenceScore !== undefined ? { confidence_score: insight.confidenceScore } : {}),
    ...(insight.impactScore !== undefined ? { impact_score: insight.impactScore } : {}),
    ...(insight.frequencyScore !== undefined ? { frequency_score: insight.frequencyScore } : {}),
  };
}

function toApiInsightPatchPayload(patch: Partial<Insight>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description || "Descrição do insight a preencher" } : {}),
    ...(patch.confidenceScore !== undefined ? { confidence_score: patch.confidenceScore } : {}),
    ...(patch.impactScore !== undefined ? { impact_score: patch.impactScore } : {}),
    ...(patch.frequencyScore !== undefined ? { frequency_score: patch.frequencyScore } : {}),
  };
}

function fromApiRoadmapItem(item: ApiRoadmapItem, hypothesisId?: string): RoadmapItem {
  return {
    id: item.id,
    productId: item.product_id,
    hypothesisId,
    code: item.code,
    apiStatus: item.status,
    title: item.title,
    description: item.description ?? "",
    status: API_TO_UI_ROADMAP_STATUS[item.status] ?? "later",
    owner: owners.CM,
    targetDate: item.planned_end ?? item.planned_start ?? undefined,
    createdAt: item.created_at,
    updatedAt: item.updated_at,
  };
}

function mergeLocalRoadmapItem(localItem: RoadmapItem, remoteItem: ApiRoadmapItem): RoadmapItem {
  return {
    ...localItem,
    productId: remoteItem.product_id,
    code: remoteItem.code,
    apiStatus: remoteItem.status,
    title: remoteItem.title,
    description: remoteItem.description ?? "",
    status: API_TO_UI_ROADMAP_STATUS[remoteItem.status] ?? localItem.status,
    targetDate: remoteItem.planned_end ?? remoteItem.planned_start ?? localItem.targetDate,
    updatedAt: remoteItem.updated_at,
  };
}

function toApiRoadmapCreatePayload(item: RoadmapItem) {
  return {
    type: "feature" as const,
    title: item.title,
    description: item.description || undefined,
    planned_end: item.targetDate ? item.targetDate.slice(0, 10) : undefined,
  };
}

function toApiRoadmapPatchPayload(patch: Partial<RoadmapItem>) {
  return {
    ...(patch.title !== undefined ? { title: patch.title } : {}),
    ...(patch.description !== undefined ? { description: patch.description || null } : {}),
    ...(patch.targetDate !== undefined
      ? { planned_end: patch.targetDate ? patch.targetDate.slice(0, 10) : null }
      : {}),
  };
}

async function transitionRoadmapThroughLifecycle(item: RoadmapItem, targetStatus: RoadmapItem["status"]) {
  const currentStatus =
    (item.apiStatus as ApiRoadmapStatus | undefined) ?? UI_TO_API_ROADMAP_STATUS[item.status];
  const targetApiStatus = UI_TO_API_ROADMAP_STATUS[targetStatus];
  const path = getRoadmapTransitionPath(currentStatus, targetApiStatus);
  let remoteItem: ApiRoadmapItem | null = null;

  for (const status of path) {
    remoteItem = await transitionRoadmapStatusInApi(
      item.id,
      status,
      status === "cancelled" || status === "rolled_back" ? "Marcado pela interface" : undefined,
    );
  }

  return remoteItem ?? getRoadmapFromApi(item.id);
}

function getRoadmapTransitionPath(
  currentStatus: ApiRoadmapStatus,
  targetStatus: ApiRoadmapStatus,
): ApiRoadmapStatus[] {
  if (currentStatus === targetStatus) return [];
  if (targetStatus === "planned" && currentStatus === "proposed") return ["planned"];
  if (targetStatus === "in_development" && currentStatus === "proposed") return ["planned", "in_development"];
  if (targetStatus === "in_development" && currentStatus === "planned") return ["in_development"];
  if (targetStatus === "delivered" && currentStatus === "proposed") return ["planned", "in_development", "delivered"];
  if (targetStatus === "delivered" && currentStatus === "planned") return ["in_development", "delivered"];
  if (targetStatus === "delivered" && currentStatus === "in_development") return ["delivered"];
  return [targetStatus];
}

function fromApiOutcome(outcome: ApiOutcome, roadmapItem?: RoadmapItem): Outcome {
  return {
    id: outcome.id,
    productId: roadmapItem?.productId ?? "",
    roadmapItemId: outcome.roadmap_item_id,
    code: outcome.code,
    apiStatus: outcome.status,
    keyResultId: outcome.key_result_id ?? undefined,
    painId: outcome.pain_id ?? roadmapItem?.painId,
    hypothesizedImpact: outcome.hypothesized_impact,
    measurementWindowDays: outcome.measurement_window_days,
    status: API_TO_UI_OUTCOME_STATUS[outcome.status] ?? "hipotetizado",
    baselineValue: toNumberOrNull(outcome.baseline_value),
    finalValue: toNumberOrNull(outcome.final_value),
    conclusion: outcome.conclusion,
    createdAt: outcome.created_at,
    updatedAt: outcome.updated_at,
  };
}

function mergeLocalOutcome(localOutcome: Outcome, remoteOutcome: ApiOutcome): Outcome {
  return {
    ...localOutcome,
    code: remoteOutcome.code,
    apiStatus: remoteOutcome.status,
    keyResultId: remoteOutcome.key_result_id ?? undefined,
    painId: remoteOutcome.pain_id ?? localOutcome.painId,
    hypothesizedImpact: remoteOutcome.hypothesized_impact,
    measurementWindowDays: remoteOutcome.measurement_window_days,
    status: API_TO_UI_OUTCOME_STATUS[remoteOutcome.status] ?? localOutcome.status,
    baselineValue: toNumberOrNull(remoteOutcome.baseline_value),
    finalValue: toNumberOrNull(remoteOutcome.final_value),
    conclusion: remoteOutcome.conclusion,
    updatedAt: remoteOutcome.updated_at,
  };
}

function toApiOutcomeCreatePayload(outcome: Outcome) {
  return {
    hypothesized_impact: outcome.hypothesizedImpact || "Impacto esperado a definir",
    measurement_window_days: outcome.measurementWindowDays,
    baseline_value: outcome.baselineValue ?? undefined,
    pain_id: outcome.painId ?? undefined,
  };
}

function toApiOutcomePatchPayload(patch: Partial<Outcome>) {
  return {
    ...(patch.hypothesizedImpact !== undefined
      ? { hypothesized_impact: patch.hypothesizedImpact || "Impacto esperado a definir" }
      : {}),
    ...(patch.measurementWindowDays !== undefined ? { measurement_window_days: patch.measurementWindowDays } : {}),
    ...(patch.baselineValue !== undefined ? { baseline_value: patch.baselineValue } : {}),
    ...(patch.finalValue !== undefined ? { final_value: patch.finalValue } : {}),
    ...(patch.conclusion !== undefined ? { conclusion: patch.conclusion || null } : {}),
    ...(patch.keyResultId !== undefined ? { key_result_id: patch.keyResultId ?? null } : {}),
    ...(patch.painId !== undefined ? { pain_id: patch.painId ?? null } : {}),
  };
}

async function transitionOutcomeThroughLifecycle(outcome: Outcome, targetStatus: Outcome["status"]) {
  const currentStatus =
    (outcome.apiStatus as ApiOutcomeStatus | undefined) ?? UI_TO_API_OUTCOME_STATUS[outcome.status];
  const targetApiStatus = UI_TO_API_OUTCOME_STATUS[targetStatus];
  const path = getOutcomeTransitionPath(currentStatus, targetApiStatus);
  let remoteOutcome: ApiOutcome | null = null;

  for (const status of path) {
    remoteOutcome = await transitionOutcomeStatusInApi(outcome.id, status);
  }

  return remoteOutcome ?? getOutcomeFromApi(outcome.id);
}

function getOutcomeTransitionPath(
  currentStatus: ApiOutcomeStatus,
  targetStatus: ApiOutcomeStatus,
): ApiOutcomeStatus[] {
  if (currentStatus === targetStatus) return [];
  if (targetStatus === "hypothesized") return [];
  if (targetStatus === "confirmed" && currentStatus === "hypothesized") return ["measuring", "confirmed"];
  if (targetStatus === "not_confirmed" && currentStatus === "hypothesized") {
    return ["measuring", "not_confirmed"];
  }
  if (targetStatus === "inconclusive" && currentStatus === "hypothesized") {
    return ["measuring", "inconclusive"];
  }
  if (targetStatus === "measuring" && currentStatus === "hypothesized") return ["measuring"];
  if (targetStatus !== "measuring" && currentStatus !== "measuring") return ["measuring", targetStatus];
  return [targetStatus];
}

export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const { products, ready: productsReady } = useProducts();
  const { pains, ready: painsReady } = useDores();
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();
  const activeProductIds = useMemo(
    () => products.filter((product) => product.status === "active").map((product) => product.id),
    [products],
  );
  const painProductIdById = useMemo(() => new Map(pains.map((pain) => [pain.id, pain.productId])), [pains]);
  const painIds = useMemo(() => Array.from(painProductIdById.keys()), [painProductIdById]);

  useEffect(() => {
    let cancelled = false;

    function loadLocalState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as State;
          // migrate older shapes
          parsed.hypotheses = (parsed.hypotheses ?? []).map((h) => ({
            ...h,
            prototypes: Array.isArray(h.prototypes) ? h.prototypes : [],
            images: Array.isArray(h.images) ? h.images : [],
          }));
          parsed.painHypothesisLinks =
            parsed.painHypothesisLinks ?? buildPainHypothesisLinks(parsed.hypotheses);
          parsed.experiments = (parsed.experiments ?? []).map((e) => ({
            ...e,
            expectedResults: Array.isArray(e.expectedResults) ? e.expectedResults : [],
          }));
          parsed.evidences = (parsed.evidences ?? []).map((e) => ({
            ...e,
            attachments: Array.isArray(e.attachments) ? e.attachments : [],
          }));
          parsed.insights = (parsed.insights ?? initialState.insights).map((insight) => ({
            ...insight,
            evidenceIds: Array.isArray(insight.evidenceIds) ? insight.evidenceIds : [],
          }));
          parsed.outcomes = parsed.outcomes ?? initialState.outcomes;
          setState(parsed);
        }
      } catch {
        // ignore
      }
    }

    async function loadRemoteState() {
      if (!isRemoteBacked) {
        loadLocalState();
        if (!cancelled) setReady(true);
        return;
      }

      if (!productsReady || !painsReady) return;

      try {
        const remoteHypothesesByProduct = await Promise.all(
          activeProductIds.map((productId) => listHypothesesFromApi(productId)),
        );
        const remoteHypotheses = remoteHypothesesByProduct.flat();
        const remoteExperimentsByHypothesis = await Promise.all(
          remoteHypotheses.map((hypothesis) => listExperimentsFromApi(hypothesis.id).catch(() => [])),
        );
        const remoteEvidencesByProduct = await Promise.all(
          activeProductIds.map((productId) => listEvidencesFromApi(productId).catch(() => [])),
        );
        const remoteInsightsByProduct = await Promise.all(
          activeProductIds.map((productId) => listInsightsFromApi(productId).catch(() => [])),
        );
        const remoteInsights = remoteInsightsByProduct.flat();
        const remoteInsightEvidenceLinks = await Promise.all(
          remoteInsights.map(async (insight) => ({
            insightId: insight.id,
            evidences: await listInsightEvidencesFromApi(insight.id).catch(() => []),
          })),
        );
        const remoteRoadmapByProduct = await Promise.all(
          activeProductIds.map((productId) => listRoadmapFromApi(productId).catch(() => [])),
        );
        const remoteRoadmapItems = remoteRoadmapByProduct.flat();
        const remoteOutcomesByRoadmap = await Promise.all(
          remoteRoadmapItems.map((item) => listOutcomesFromApi(item.id).catch(() => [])),
        );
        const roadmapLinks = await Promise.all(
          remoteHypotheses.map(async (hypothesis) => ({
            hypothesisId: hypothesis.id,
            roadmap: await listHypothesisRoadmapFromApi(hypothesis.id).catch(() => []),
          })),
        );
        const painLinks = await Promise.all(
          painIds.map(async (painId) => ({
            painId,
            hypotheses: await listPainHypothesesFromApi(painId).catch(() => []),
          })),
        );
        if (cancelled) return;

        const painHypothesisLinks = Object.fromEntries(
          painLinks.map(({ painId, hypotheses }) => [painId, hypotheses.map((hypothesis) => hypothesis.id)]),
        );
        const painByHypothesisId = new Map<string, string>();
        painLinks.forEach(({ painId, hypotheses }) => {
          hypotheses.forEach((hypothesis) => painByHypothesisId.set(hypothesis.id, painId));
        });
        const remoteHypothesisIds = new Set(remoteHypotheses.map((hypothesis) => hypothesis.id));
        const linkedOnlyHypotheses = new Map<string, Hypothesis>();
        painLinks.forEach(({ painId, hypotheses }) => {
          const productId = painProductIdById.get(painId);
          if (!productId) return;
          hypotheses.forEach((hypothesis) => {
            if (remoteHypothesisIds.has(hypothesis.id) || linkedOnlyHypotheses.has(hypothesis.id)) return;
            linkedOnlyHypotheses.set(hypothesis.id, fromLinkedHypothesis(hypothesis, painId, productId));
          });
        });
        const hypothesisByRoadmapId = new Map<string, string>();
        roadmapLinks.forEach(({ hypothesisId, roadmap }) => {
          roadmap.forEach((item) => hypothesisByRoadmapId.set(item.id, hypothesisId));
        });
        const evidenceIdsByInsightId = new Map<string, string[]>();
        remoteInsightEvidenceLinks.forEach(({ insightId, evidences }) => {
          evidenceIdsByInsightId.set(
            insightId,
            evidences.map((evidence) => evidence.id),
          );
        });
        const roadmapById = new Map(
          remoteRoadmapItems.map((item) => [item.id, fromApiRoadmapItem(item, hypothesisByRoadmapId.get(item.id))]),
        );

        setState((current) => ({
          ...current,
          hypotheses: remoteHypotheses.map((hypothesis) =>
            fromApiHypothesis(hypothesis, painByHypothesisId.get(hypothesis.id)),
          ).concat(Array.from(linkedOnlyHypotheses.values())),
          painHypothesisLinks,
          experiments: remoteExperimentsByHypothesis.flat().map(fromApiExperiment),
          evidences: remoteEvidencesByProduct.flat().map(fromApiEvidence),
          insights: remoteInsights.map((insight) =>
            fromApiInsight(insight, evidenceIdsByInsightId.get(insight.id) ?? []),
          ),
          roadmap: Array.from(roadmapById.values()),
          outcomes: remoteOutcomesByRoadmap
            .flat()
            .map((outcome) => fromApiOutcome(outcome, roadmapById.get(outcome.roadmap_item_id))),
        }));
        setSyncError(undefined);
      } catch (error) {
        if (cancelled) return;
        setSyncError(error instanceof Error ? error.message : "Falha ao carregar hipóteses da API.");
        loadLocalState();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [activeProductIds, isRemoteBacked, painIds, painProductIdById, painsReady, productsReady]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [isRemoteBacked, state, ready]);

  const currentUser = owners.CM;

  const value = useMemo<Ctx>(() => {
    const upd = <T extends { id: string; updatedAt: string }>(
      list: T[],
      id: string,
      patch: Partial<T>,
    ): T[] => list.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x));

    return {
      ...state,
      ready,
      isRemoteBacked,
      syncError,
      // hypotheses
      getHypothesis: (id) => state.hypotheses.find((x) => x.id === id),
      hypothesesByPain: (painId) => {
        const linkedHypothesisIds = new Set(state.painHypothesisLinks[painId] ?? []);
        return state.hypotheses.filter((hypothesis) =>
          hypothesis.painId === painId || linkedHypothesisIds.has(hypothesis.id),
        );
      },
      createHypothesis: async (productId, painId) => {
        const id = nextId("HP", state.hypotheses);
        const item: Hypothesis = {
          id,
          productId,
          painId,
          title: "Nova hipótese",
          statement: "Acreditamos que ...",
          status: "rascunho",
          owner: currentUser,
          prototypes: [],
          images: [],
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remoteHypothesis = await createHypothesisInApi(
              productId,
              toApiHypothesisCreatePayload(item),
            );
            if (painId) {
              await linkPainHypothesisInApi(painId, remoteHypothesis.id);
            }
            const mapped = fromApiHypothesis(remoteHypothesis, painId);
            setState((s) => ({
              ...s,
              hypotheses: [mapped, ...s.hypotheses],
              painHypothesisLinks: painId
                ? setPainHypothesisLink(s.painHypothesisLinks, mapped.id, undefined, painId)
                : s.painHypothesisLinks,
            }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar hipótese na API.");
            throw error;
          }
        }
        setState((s) => ({
          ...s,
          hypotheses: [item, ...s.hypotheses],
          painHypothesisLinks: painId
            ? setPainHypothesisLink(s.painHypothesisLinks, item.id, undefined, painId)
            : s.painHypothesisLinks,
        }));
        return item;
      },
      updateHypothesis: (id, patch) => {
        setState((s) => {
          const current = s.hypotheses.find((hypothesis) => hypothesis.id === id);
          return {
            ...s,
            hypotheses: upd(s.hypotheses, id, patch),
            painHypothesisLinks:
              patch.painId !== undefined && patch.painId !== current?.painId
                ? setPainHypothesisLink(s.painHypothesisLinks, id, current?.painId, patch.painId)
                : s.painHypothesisLinks,
          };
        });
        if (!isRemoteBacked) return;

        const current = state.hypotheses.find((hypothesis) => hypothesis.id === id);
        if (!current) return;

        if (patch.painId !== undefined && patch.painId !== current.painId) {
          void syncHypothesisPainLink(id, current.painId, patch.painId)
            .then(() => setSyncError(undefined))
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao atualizar vínculo da dor.");
            });
        }

        const payload = toApiHypothesisPatchPayload(patch);
        const request = patch.status
          ? transitionHypothesisThroughLifecycle(current, patch.status)
          : Object.keys(payload).length > 0
            ? updateHypothesisInApi(id, payload)
            : null;

        if (!request) return;

        void request
          .then((remoteHypothesis) => {
            setState((s) => ({
              ...s,
              hypotheses: s.hypotheses.map((hypothesis) =>
                hypothesis.id === id ? mergeLocalHypothesis(hypothesis, remoteHypothesis) : hypothesis,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar hipótese na API.");
          });
      },
      deleteHypothesis: (id) => {
        setState((s) => ({
          ...s,
          hypotheses: s.hypotheses.filter((x) => x.id !== id),
          painHypothesisLinks: removeHypothesisFromPainLinks(s.painHypothesisLinks, id),
        }));
        if (!isRemoteBacked) return;
        void deleteHypothesisInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir hipótese na API.");
        });
      },

      // experiments
      getExperiment: (id) => state.experiments.find((x) => x.id === id),
      experimentsByHypothesis: (hid) => state.experiments.filter((e) => e.hypothesisId === hid),
      createExperiment: async (productId, hypothesisId) => {
        const id = nextId("EX", state.experiments);
        const item: Experiment = {
          id,
          productId,
          hypothesisId,
          title: "Novo experimento",
          description: "",
          method: "",
          expectedResults: [],
          status: "planejado",
          result: null,
          owner: currentUser,
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked && hypothesisId) {
          try {
            const remoteExperiment = await createExperimentInApi(
              hypothesisId,
              toApiExperimentCreatePayload(item),
            );
            const mapped = fromApiExperiment(remoteExperiment);
            setState((s) => ({ ...s, experiments: [mapped, ...s.experiments] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar experimento na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, experiments: [item, ...s.experiments] }));
        return item;
      },
      updateExperiment: (id, patch) => {
        setState((s) => ({ ...s, experiments: upd(s.experiments, id, patch) }));
        if (!isRemoteBacked) return;

        const current = state.experiments.find((experiment) => experiment.id === id);
        if (!current) return;

        const payload = toApiExperimentPatchPayload(patch, current);
        const request = patch.status
          ? transitionExperimentThroughLifecycle(current, patch.status)
          : Object.keys(payload).length > 0
            ? updateExperimentInApi(id, payload)
            : null;

        if (!request) return;

        void request
          .then((remoteExperiment) => {
            setState((s) => ({
              ...s,
              experiments: s.experiments.map((experiment) =>
                experiment.id === id ? mergeLocalExperiment(experiment, remoteExperiment) : experiment,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar experimento na API.");
          });
      },
      deleteExperiment: (id) => {
        setState((s) => ({ ...s, experiments: s.experiments.filter((x) => x.id !== id) }));
        if (!isRemoteBacked) return;
        void deleteExperimentInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir experimento na API.");
        });
      },
      setExperimentResult: (id, result) => {
        setState((s) => {
          const experiments = upd(s.experiments, id, { result, status: "concluido" });
          // propagate to hypothesis
          let hypotheses = s.hypotheses;
          const exp = experiments.find((e) => e.id === id);
          if (exp?.hypothesisId && (result === "valida" || result === "invalida")) {
            hypotheses = upd(s.hypotheses, exp.hypothesisId, {
              status: result === "valida" ? "validada" : "invalidada",
            });
          }
          return { ...s, experiments, hypotheses };
        });
        if (!isRemoteBacked || !result) return;
        const current = state.experiments.find((experiment) => experiment.id === id);
        const currentStatus =
          (current?.apiStatus as ApiExperimentStatus | undefined) ??
          (current ? UI_TO_API_EXPERIMENT_STATUS[current.status] : "completed");

        const request =
          currentStatus === "completed"
            ? transitionExperimentStatusInApi(
                id,
                "analyzed",
                UI_TO_API_EXPERIMENT_RESULT[result],
                "Resultado definido pela interface",
              )
            : transitionExperimentStatusInApi(id, "completed").then(() =>
                transitionExperimentStatusInApi(
                  id,
                  "analyzed",
                  UI_TO_API_EXPERIMENT_RESULT[result],
                  "Resultado definido pela interface",
                ),
              );

        void request
          .then((remoteExperiment) => {
            setState((s) => ({
              ...s,
              experiments: s.experiments.map((experiment) =>
                experiment.id === id ? mergeLocalExperiment(experiment, remoteExperiment) : experiment,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao registrar resultado na API.");
          });
      },

      // evidences
      getEvidence: (id) => state.evidences.find((x) => x.id === id),
      evidencesByExperiment: (eid) => state.evidences.filter((e) => e.experimentId === eid),
      createEvidence: async (productId, experimentId) => {
        const id = nextId("EV", state.evidences);
        const item: Evidence = {
          id,
          productId,
          experimentId,
          title: "Nova evidência",
          source: "",
          type: "entrevista",
          notes: "",
          attachments: [],
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remoteEvidence = await createEvidenceInApi(productId, toApiEvidenceCreatePayload(item));
            const mapped = fromApiEvidence(remoteEvidence);
            setState((s) => ({ ...s, evidences: [mapped, ...s.evidences] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar evidência na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, evidences: [item, ...s.evidences] }));
        return item;
      },
      updateEvidence: (id, patch) => {
        setState((s) => ({ ...s, evidences: upd(s.evidences, id, patch) }));
        if (!isRemoteBacked) return;

        const current = state.evidences.find((evidence) => evidence.id === id);
        if (!current) return;

        const statusRequest = patch.apiStatus
          ? transitionEvidenceStatusInApi(id, patch.apiStatus as ApiEvidenceStatus)
          : null;
        const payload = toApiEvidencePatchPayload(patch, current);
        const request = statusRequest ?? (Object.keys(payload).length > 0 ? updateEvidenceInApi(id, payload) : null);

        if (!request) return;

        void request
          .then((remoteEvidence) => {
            setState((s) => ({
              ...s,
              evidences: s.evidences.map((evidence) =>
                evidence.id === id ? mergeLocalEvidence(evidence, remoteEvidence) : evidence,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar evidência na API.");
          });
      },
      deleteEvidence: (id) => {
        setState((s) => ({ ...s, evidences: s.evidences.filter((x) => x.id !== id) }));
        if (!isRemoteBacked) return;
        void deleteEvidenceInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir evidência na API.");
        });
      },

      // insights
      getInsight: (id) => state.insights.find((x) => x.id === id),
      insightsByEvidence: (evidenceId) => state.insights.filter((insight) => insight.evidenceIds.includes(evidenceId)),
      createInsight: async (productId, evidenceId) => {
        const id = nextId("IN", state.insights);
        const item: Insight = {
          id,
          productId,
          title: "Novo insight",
          description: "",
          confidenceScore: null,
          impactScore: null,
          frequencyScore: null,
          evidenceIds: evidenceId ? [evidenceId] : [],
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remoteInsight = await createInsightInApi(productId, toApiInsightCreatePayload(item));
            if (evidenceId) {
              await linkInsightEvidenceInApi(remoteInsight.id, evidenceId);
            }
            const mapped = fromApiInsight(remoteInsight, evidenceId ? [evidenceId] : []);
            setState((s) => ({ ...s, insights: [mapped, ...s.insights] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar insight na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, insights: [item, ...s.insights] }));
        return item;
      },
      updateInsight: (id, patch) => {
        setState((s) => ({ ...s, insights: upd(s.insights, id, patch) }));
        if (!isRemoteBacked) return;

        const payload = toApiInsightPatchPayload(patch);
        if (Object.keys(payload).length === 0) return;

        void updateInsightInApi(id, payload)
          .then((remoteInsight) => {
            setState((s) => ({
              ...s,
              insights: s.insights.map((insight) =>
                insight.id === id ? mergeLocalInsight(insight, remoteInsight) : insight,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar insight na API.");
          });
      },
      deleteInsight: (id) => {
        setState((s) => ({ ...s, insights: s.insights.filter((x) => x.id !== id) }));
        if (!isRemoteBacked) return;
        void deleteInsightInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir insight na API.");
        });
      },
      linkInsightEvidence: (insightId, evidenceId) => {
        setState((s) => ({
          ...s,
          insights: s.insights.map((insight) =>
            insight.id === insightId && !insight.evidenceIds.includes(evidenceId)
              ? { ...insight, evidenceIds: [...insight.evidenceIds, evidenceId], updatedAt: now() }
              : insight,
          ),
        }));
        if (!isRemoteBacked) return;
        void linkInsightEvidenceInApi(insightId, evidenceId)
          .then(() => getInsightFromApi(insightId))
          .then((remoteInsight) => {
            setState((s) => ({
              ...s,
              insights: s.insights.map((insight) =>
                insight.id === insightId ? mergeLocalInsight(insight, remoteInsight) : insight,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao vincular evidência ao insight.");
          });
      },
      unlinkInsightEvidence: (insightId, evidenceId) => {
        setState((s) => ({
          ...s,
          insights: s.insights.map((insight) =>
            insight.id === insightId
              ? {
                  ...insight,
                  evidenceIds: insight.evidenceIds.filter((id) => id !== evidenceId),
                  updatedAt: now(),
                }
              : insight,
          ),
        }));
        if (!isRemoteBacked) return;
        void unlinkInsightEvidenceInApi(insightId, evidenceId)
          .then(() => getInsightFromApi(insightId))
          .then((remoteInsight) => {
            setState((s) => ({
              ...s,
              insights: s.insights.map((insight) =>
                insight.id === insightId ? mergeLocalInsight(insight, remoteInsight) : insight,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao remover vínculo do insight.");
          });
      },

      // roadmap
      getRoadmap: (id) => state.roadmap.find((x) => x.id === id),
      roadmapByPain: (painId) => state.roadmap.filter((r) => r.painId === painId),
      createRoadmap: async (productId, painId, hypothesisId) => {
        const id = nextId("RM", state.roadmap);
        const item: RoadmapItem = {
          id,
          productId,
          painId,
          hypothesisId,
          title: "Novo item de roadmap",
          description: "",
          status: "next",
          owner: currentUser,
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remoteItem = await createRoadmapInApi(productId, toApiRoadmapCreatePayload(item));
            if (hypothesisId) {
              await linkHypothesisRoadmapInApi(hypothesisId, remoteItem.id);
            }
            const mapped = {
              ...fromApiRoadmapItem(remoteItem, hypothesisId),
              painId,
            };
            setState((s) => ({ ...s, roadmap: [mapped, ...s.roadmap] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar item de roadmap na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, roadmap: [item, ...s.roadmap] }));
        return item;
      },

      updateRoadmap: (id, patch) => {
        setState((s) => ({ ...s, roadmap: upd(s.roadmap, id, patch) }));
        if (!isRemoteBacked) return;

        const current = state.roadmap.find((item) => item.id === id);
        if (!current) return;

        const payload = toApiRoadmapPatchPayload(patch);
        const request = patch.status
          ? transitionRoadmapThroughLifecycle(current, patch.status)
          : Object.keys(payload).length > 0
            ? updateRoadmapInApi(id, payload)
            : null;

        if (!request) return;

        void request
          .then((remoteItem) => {
            setState((s) => ({
              ...s,
              roadmap: s.roadmap.map((item) =>
                item.id === id ? mergeLocalRoadmapItem(item, remoteItem) : item,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar roadmap na API.");
          });
      },
      deleteRoadmap: (id) => {
        setState((s) => ({
          ...s,
          roadmap: s.roadmap.filter((x) => x.id !== id),
          outcomes: s.outcomes.filter((outcome) => outcome.roadmapItemId !== id),
        }));
        if (!isRemoteBacked) return;
        void deleteRoadmapInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir item de roadmap na API.");
        });
      },
      // outcomes
      getOutcome: (id) => state.outcomes.find((outcome) => outcome.id === id),
      outcomesByRoadmap: (roadmapItemId) =>
        state.outcomes.filter((outcome) => outcome.roadmapItemId === roadmapItemId),
      createOutcome: async (roadmapItemId) => {
        const roadmapItem = state.roadmap.find((item) => item.id === roadmapItemId);
        const id = nextId("OC", state.outcomes);
        const item: Outcome = {
          id,
          productId: roadmapItem?.productId ?? "",
          roadmapItemId,
          painId: roadmapItem?.painId,
          hypothesizedImpact: "Impacto esperado a definir",
          measurementWindowDays: 30,
          status: "hipotetizado",
          baselineValue: null,
          finalValue: null,
          conclusion: null,
          createdAt: now(),
          updatedAt: now(),
        };

        if (isRemoteBacked) {
          try {
            const remoteOutcome = await createOutcomeInApi(roadmapItemId, toApiOutcomeCreatePayload(item));
            const mapped = fromApiOutcome(remoteOutcome, roadmapItem);
            setState((s) => ({ ...s, outcomes: [mapped, ...s.outcomes] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar outcome na API.");
            throw error;
          }
        }

        setState((s) => ({ ...s, outcomes: [item, ...s.outcomes] }));
        return item;
      },
      updateOutcome: (id, patch) => {
        setState((s) => ({ ...s, outcomes: upd(s.outcomes, id, patch) }));
        if (!isRemoteBacked) return;

        const current = state.outcomes.find((outcome) => outcome.id === id);
        if (!current) return;

        const payload = toApiOutcomePatchPayload(patch);
        const request = patch.status
          ? transitionOutcomeThroughLifecycle(current, patch.status)
          : Object.keys(payload).length > 0
            ? updateOutcomeInApi(id, payload)
            : null;

        if (!request) return;

        void request
          .then((remoteOutcome) => {
            setState((s) => ({
              ...s,
              outcomes: s.outcomes.map((outcome) =>
                outcome.id === id ? mergeLocalOutcome(outcome, remoteOutcome) : outcome,
              ),
            }));
            setSyncError(undefined);
          })
          .catch((error) => {
            setSyncError(error instanceof Error ? error.message : "Falha ao atualizar outcome na API.");
          });
      },
      deleteOutcome: (id) => {
        setState((s) => ({ ...s, outcomes: s.outcomes.filter((outcome) => outcome.id !== id) }));
        if (!isRemoteBacked) return;
        void deleteOutcomeInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir outcome na API.");
        });
      },
    };
  }, [currentUser, isRemoteBacked, ready, state, syncError]);

  return <DiscoveryCtx.Provider value={value}>{children}</DiscoveryCtx.Provider>;
}

export function useDiscovery() {
  const ctx = useContext(DiscoveryCtx);
  if (!ctx) throw new Error("useDiscovery precisa estar dentro de <DiscoveryProvider>");
  return ctx;
}
