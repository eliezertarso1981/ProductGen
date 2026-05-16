"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { owners } from "./dores-data";
import type {
  Evidence,
  Experiment,
  ExperimentResult,
  Hypothesis,
  RoadmapItem,
} from "./discovery-data";

const STORAGE_KEY = "discovery-store-v1";

interface State {
  hypotheses: Hypothesis[];
  experiments: Experiment[];
  evidences: Evidence[];
  roadmap: RoadmapItem[];
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

const initialState: State = {
  hypotheses: seedHypotheses,
  experiments: seedExperiments,
  evidences: seedEvidences,
  roadmap: seedRoadmap,
};

interface Ctx extends State {
  ready: boolean;
  // hypotheses
  getHypothesis: (id: string) => Hypothesis | undefined;
  createHypothesis: (productId: string, painId?: string) => Hypothesis;
  updateHypothesis: (id: string, patch: Partial<Hypothesis>) => void;
  deleteHypothesis: (id: string) => void;
  hypothesesByPain: (painId: string) => Hypothesis[];
  // experiments
  getExperiment: (id: string) => Experiment | undefined;
  createExperiment: (productId: string, hypothesisId?: string) => Experiment;
  updateExperiment: (id: string, patch: Partial<Experiment>) => void;
  deleteExperiment: (id: string) => void;
  experimentsByHypothesis: (hypothesisId: string) => Experiment[];
  setExperimentResult: (id: string, result: ExperimentResult) => void;
  // evidences
  getEvidence: (id: string) => Evidence | undefined;
  createEvidence: (productId: string, experimentId?: string) => Evidence;
  updateEvidence: (id: string, patch: Partial<Evidence>) => void;
  deleteEvidence: (id: string) => void;
  evidencesByExperiment: (experimentId: string) => Evidence[];
  // roadmap
  getRoadmap: (id: string) => RoadmapItem | undefined;
  createRoadmap: (productId: string, painId?: string, hypothesisId?: string) => RoadmapItem;

  updateRoadmap: (id: string, patch: Partial<RoadmapItem>) => void;
  deleteRoadmap: (id: string) => void;
  roadmapByPain: (painId: string) => RoadmapItem[];
}

const DiscoveryCtx = createContext<Ctx | null>(null);

function nextId(prefix: string, list: { id: string }[]): string {
  const nums = list.map((x) => parseInt(x.id.replace(/\D/g, ""), 10)).filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

export function DiscoveryProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
        parsed.experiments = (parsed.experiments ?? []).map((e) => ({
          ...e,
          expectedResults: Array.isArray(e.expectedResults) ? e.expectedResults : [],
        }));
        parsed.evidences = (parsed.evidences ?? []).map((e) => ({
          ...e,
          attachments: Array.isArray(e.attachments) ? e.attachments : [],
        }));
        setState(parsed);
      }
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, ready]);

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
      // hypotheses
      getHypothesis: (id) => state.hypotheses.find((x) => x.id === id),
      hypothesesByPain: (painId) => state.hypotheses.filter((h) => h.painId === painId),
      createHypothesis: (productId, painId) => {
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
        setState((s) => ({ ...s, hypotheses: [item, ...s.hypotheses] }));
        return item;
      },
      updateHypothesis: (id, patch) =>
        setState((s) => ({ ...s, hypotheses: upd(s.hypotheses, id, patch) })),
      deleteHypothesis: (id) =>
        setState((s) => ({ ...s, hypotheses: s.hypotheses.filter((x) => x.id !== id) })),

      // experiments
      getExperiment: (id) => state.experiments.find((x) => x.id === id),
      experimentsByHypothesis: (hid) => state.experiments.filter((e) => e.hypothesisId === hid),
      createExperiment: (productId, hypothesisId) => {
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
        setState((s) => ({ ...s, experiments: [item, ...s.experiments] }));
        return item;
      },
      updateExperiment: (id, patch) =>
        setState((s) => ({ ...s, experiments: upd(s.experiments, id, patch) })),
      deleteExperiment: (id) =>
        setState((s) => ({ ...s, experiments: s.experiments.filter((x) => x.id !== id) })),
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
      },

      // evidences
      getEvidence: (id) => state.evidences.find((x) => x.id === id),
      evidencesByExperiment: (eid) => state.evidences.filter((e) => e.experimentId === eid),
      createEvidence: (productId, experimentId) => {
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
        setState((s) => ({ ...s, evidences: [item, ...s.evidences] }));
        return item;
      },
      updateEvidence: (id, patch) =>
        setState((s) => ({ ...s, evidences: upd(s.evidences, id, patch) })),
      deleteEvidence: (id) =>
        setState((s) => ({ ...s, evidences: s.evidences.filter((x) => x.id !== id) })),

      // roadmap
      getRoadmap: (id) => state.roadmap.find((x) => x.id === id),
      roadmapByPain: (painId) => state.roadmap.filter((r) => r.painId === painId),
      createRoadmap: (productId, painId, hypothesisId) => {
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
        setState((s) => ({ ...s, roadmap: [item, ...s.roadmap] }));
        return item;
      },

      updateRoadmap: (id, patch) =>
        setState((s) => ({ ...s, roadmap: upd(s.roadmap, id, patch) })),
      deleteRoadmap: (id) =>
        setState((s) => ({ ...s, roadmap: s.roadmap.filter((x) => x.id !== id) })),
    };
  }, [state, ready, currentUser]);

  return <DiscoveryCtx.Provider value={value}>{children}</DiscoveryCtx.Provider>;
}

export function useDiscovery() {
  const ctx = useContext(DiscoveryCtx);
  if (!ctx) throw new Error("useDiscovery precisa estar dentro de <DiscoveryProvider>");
  return ctx;
}
