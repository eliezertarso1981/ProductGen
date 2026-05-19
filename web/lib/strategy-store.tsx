"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { OKR, Pillar, Period } from "./strategy-data";
import { useProducts } from "./products-context";
import {
  type ApiKeyResult,
  type ApiObjective,
  type ApiObjectiveStatus,
  type ApiStrategicPillar,
  createKeyResultInApi,
  createObjectiveInApi,
  createStrategicPillarInApi,
  deleteKeyResultInApi,
  deleteObjectiveInApi,
  deleteStrategicPillarInApi,
  isProductgenApiConfigured,
  listKeyResultsFromApi,
  listObjectivesFromApi,
  listStrategicPillarsFromApi,
  transitionObjectiveStatusInApi,
  updateKeyResultInApi,
  updateObjectiveInApi,
  updateStrategicPillarInApi,
} from "./productgen-api";

const STORAGE_KEY = "strategy-store-v1";

interface State {
  pillars: Pillar[];
  okrs: OKR[];
}

const now = () => new Date().toISOString();
const currentYear = new Date().getFullYear();

const seedPillars: Pillar[] = [
  {
    id: "PL-01",
    productId: "prod-core",
    name: "Eficiência operacional do PM",
    description: "Reduzir o tempo gasto em tarefas manuais de consolidação e reporting.",
    color: "var(--primary)",
    period: { type: "annual", year: currentYear },
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "PL-02",
    productId: "prod-core",
    name: "Time-to-value para novos clientes",
    description: "Acelerar a primeira entrega de valor após o onboarding.",
    color: "var(--purple)",
    period: { type: "annual", year: currentYear },
    createdAt: now(),
    updatedAt: now(),
  },
];

const seedOkrs: OKR[] = [
  {
    id: "OKR-01",
    productId: "prod-core",
    pillarId: "PL-01",
    objective: "Reduzir esforço manual de consolidação de feedback",
    description: "Centralizar canais de feedback e reduzir trabalho repetitivo de PMs.",
    status: "on_track",
    period: { type: "quarterly", year: currentYear, quarter: 2 },
    keyResults: [
      {
        id: "KR-01",
        title: "Reduzir tempo médio de consolidação",
        metric: "Horas/semana por PM",
        baseline: 4,
        target: 1,
        current: 2.5,
        unit: "h",
      },
      {
        id: "KR-02",
        title: "Aumentar uso do hub central",
        metric: "PMs ativos no hub",
        baseline: 2,
        target: 20,
        current: 8,
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
  {
    id: "OKR-02",
    productId: "prod-core",
    pillarId: "PL-02",
    objective: "Acelerar onboarding de novos clientes",
    description: "Diminuir o tempo da assinatura até a primeira estratégia modelada.",
    status: "at_risk",
    period: { type: "quarterly", year: currentYear, quarter: 2 },
    keyResults: [
      {
        id: "KR-03",
        title: "Time-to-first-value",
        metric: "Dias",
        baseline: 14,
        target: 3,
        current: 10,
        unit: "d",
      },
    ],
    createdAt: now(),
    updatedAt: now(),
  },
];

const initialState: State = { pillars: seedPillars, okrs: seedOkrs };

interface Ctx extends State {
  ready: boolean;
  isRemoteBacked: boolean;
  syncError?: string;
  // pillars
  getPillar: (id: string) => Pillar | undefined;
  pillarsByProduct: (productId: string) => Pillar[];
  createPillar: (productId: string, period?: Period) => Promise<Pillar>;
  updatePillar: (id: string, patch: Partial<Pillar>) => Promise<void>;
  deletePillar: (id: string) => void;
  // okrs
  getOKR: (id: string) => OKR | undefined;
  okrsByProduct: (productId: string) => OKR[];
  okrsByPillar: (pillarId: string) => OKR[];
  createOKR: (productId: string, pillarId?: string, period?: Period) => Promise<OKR>;
  updateOKR: (id: string, patch: Partial<OKR>) => Promise<void>;
  deleteOKR: (id: string) => void;
}

const StrategyCtx = createContext<Ctx | null>(null);

function nextId(prefix: string, list: { id: string }[]): string {
  const nums = list
    .map((x) => parseInt(x.id.replace(/\D/g, ""), 10))
    .filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `${prefix}-${String(max + 1).padStart(2, "0")}`;
}

const COLOR_TO_HEX: Record<string, string> = {
  "var(--primary)": "#2563EB",
  "var(--purple)": "#7C3AED",
  "var(--cyan)": "#0891B2",
  "var(--success)": "#16A34A",
  "var(--warn-strong)": "#D97706",
  "var(--danger)": "#DC2626",
};

const HEX_TO_COLOR: Record<string, string> = Object.fromEntries(
  Object.entries(COLOR_TO_HEX).map(([token, hex]) => [hex.toLowerCase(), token]),
);

const API_TO_UI_OKR_STATUS: Record<ApiObjectiveStatus, OKR["status"]> = {
  draft: "on_track",
  active: "on_track",
  achieved: "concluido",
  missed: "off_track",
  cancelled: "off_track",
};

const UI_TO_API_OKR_STATUS: Record<OKR["status"], ApiObjectiveStatus> = {
  on_track: "active",
  at_risk: "active",
  off_track: "missed",
  concluido: "achieved",
};

function fromApiPillar(pillar: ApiStrategicPillar): Pillar {
  return {
    id: pillar.id,
    productId: pillar.product_id,
    code: pillar.code,
    name: pillar.name,
    description: pillar.description ?? "",
    color: pillar.color ? HEX_TO_COLOR[pillar.color.toLowerCase()] ?? pillar.color : "var(--primary)",
    period: { type: "annual", year: currentYear },
    createdAt: pillar.created_at,
    updatedAt: pillar.updated_at,
  };
}

function mergeLocalPillar(localPillar: Pillar, remotePillar: ApiStrategicPillar): Pillar {
  return {
    ...localPillar,
    productId: remotePillar.product_id,
    code: remotePillar.code,
    name: remotePillar.name,
    description: remotePillar.description ?? "",
    color: remotePillar.color
      ? HEX_TO_COLOR[remotePillar.color.toLowerCase()] ?? remotePillar.color
      : localPillar.color,
    updatedAt: remotePillar.updated_at,
  };
}

function fromApiObjective(objective: ApiObjective, keyResults: ApiKeyResult[] = []): OKR {
  return {
    id: objective.id,
    productId: objective.product_id,
    code: objective.code,
    pillarId: objective.pillar_id ?? undefined,
    objective: objective.title,
    description: objective.description ?? "",
    status: API_TO_UI_OKR_STATUS[objective.status] ?? "on_track",
    period: periodFromObjective(objective),
    keyResults: keyResults.map(fromApiKeyResult),
    createdAt: objective.created_at,
    updatedAt: objective.updated_at,
  };
}

function mergeLocalOKR(localOKR: OKR, remoteObjective: ApiObjective): OKR {
  return {
    ...localOKR,
    productId: remoteObjective.product_id,
    code: remoteObjective.code,
    pillarId: remoteObjective.pillar_id ?? undefined,
    objective: remoteObjective.title,
    description: remoteObjective.description ?? "",
    status: API_TO_UI_OKR_STATUS[remoteObjective.status] ?? localOKR.status,
    period: periodFromObjective(remoteObjective),
    updatedAt: remoteObjective.updated_at,
  };
}

function fromApiKeyResult(keyResult: ApiKeyResult) {
  return {
    id: keyResult.id,
    code: keyResult.code,
    title: keyResult.title,
    metric: keyResult.metric_type ?? "",
    baseline: Number(keyResult.baseline ?? 0),
    target: Number(keyResult.target ?? 0),
    current: Number(keyResult.current_value ?? 0),
    unit: keyResult.unit ?? undefined,
  };
}

function periodFromObjective(objective: ApiObjective): Period {
  const start = objective.horizon_start ? new Date(`${objective.horizon_start}T00:00:00`) : null;
  const end = objective.horizon_end ? new Date(`${objective.horizon_end}T00:00:00`) : null;
  const year = start?.getFullYear() ?? end?.getFullYear() ?? currentYear;

  if (!start || !end) return { type: "quarterly", year, quarter: 1 };
  const month = start.getMonth();
  const quarter = (Math.floor(month / 3) + 1) as 1 | 2 | 3 | 4;
  const isAnnual = start.getMonth() === 0 && end.getMonth() === 11;
  return isAnnual ? { type: "annual", year } : { type: "quarterly", year, quarter };
}

function periodToDates(period: Period) {
  if (period.type === "annual") {
    return { horizon_start: `${period.year}-01-01`, horizon_end: `${period.year}-12-31` };
  }
  const quarter = period.quarter ?? 1;
  const startMonth = (quarter - 1) * 3 + 1;
  const endMonth = startMonth + 2;
  const endDay = endMonth === 3 ? 31 : endMonth === 6 ? 30 : endMonth === 9 ? 30 : 31;
  return {
    horizon_start: `${period.year}-${String(startMonth).padStart(2, "0")}-01`,
    horizon_end: `${period.year}-${String(endMonth).padStart(2, "0")}-${endDay}`,
  };
}

function toApiPillarPayload(pillar: Partial<Pillar>) {
  return {
    ...(pillar.name !== undefined ? { name: pillar.name } : {}),
    ...(pillar.description !== undefined ? { description: pillar.description || null } : {}),
    ...(pillar.color !== undefined ? { color: COLOR_TO_HEX[pillar.color] ?? pillar.color } : {}),
  };
}

function toApiObjectivePayload(okr: Partial<OKR>) {
  return {
    ...(okr.objective !== undefined ? { title: okr.objective } : {}),
    ...(okr.description !== undefined ? { description: okr.description || null } : {}),
    ...("pillarId" in okr ? { pillar_id: okr.pillarId ?? null } : {}),
    ...(okr.period !== undefined ? periodToDates(okr.period) : {}),
  };
}

function toApiKeyResultPayload(kr: Partial<OKR["keyResults"][number]>) {
  return {
    ...(kr.title !== undefined ? { title: kr.title.trim() } : {}),
    ...(kr.metric !== undefined ? { metric_type: kr.metric.trim() || null } : {}),
    ...(kr.baseline !== undefined ? { baseline: Number.isFinite(kr.baseline) ? kr.baseline : null } : {}),
    ...(kr.target !== undefined ? { target: Number.isFinite(kr.target) ? kr.target : null } : {}),
    ...(kr.current !== undefined ? { current_value: Number.isFinite(kr.current) ? kr.current : null } : {}),
    ...(kr.unit !== undefined ? { unit: kr.unit.trim() || null } : {}),
  };
}

async function syncKeyResults(
  objectiveId: string,
  previous: OKR["keyResults"],
  next: OKR["keyResults"],
  setState: (updater: (state: State) => State) => void,
  setSyncError: (message?: string) => void,
) {
  try {
    const previousIds = new Set(previous.map((kr) => kr.id));
    const nextIds = new Set(next.map((kr) => kr.id));
    const created = next.filter((kr) => !previousIds.has(kr.id));
    const updated = next.filter((kr) => previousIds.has(kr.id));
    const deleted = previous.filter((kr) => !nextIds.has(kr.id));

    const createdResults = await Promise.all(
      created.map(async (kr) => ({
        localId: kr.id,
        remote: await createKeyResultInApi(objectiveId, {
          ...toApiKeyResultPayload(kr),
          title: kr.title.trim(),
        }),
      })),
    );

    const updatedResults = await Promise.all(
      updated.map(async (kr) => ({
        localId: kr.id,
        remote: await updateKeyResultInApi(kr.id, toApiKeyResultPayload(kr)),
      })),
    );
    await Promise.all(deleted.map((kr) => deleteKeyResultInApi(kr.id)));

    if (createdResults.length > 0 || updatedResults.length > 0) {
      setState((state) => ({
        ...state,
        okrs: state.okrs.map((okr) =>
          okr.id === objectiveId
            ? {
                ...okr,
                keyResults: okr.keyResults.map((kr) => {
                  const createdResult = createdResults.find((result) => result.localId === kr.id);
                  const updatedResult = updatedResults.find((result) => result.localId === kr.id);
                  return createdResult
                    ? fromApiKeyResult(createdResult.remote)
                    : updatedResult
                      ? fromApiKeyResult(updatedResult.remote)
                      : kr;
                }),
              }
            : okr,
        ),
      }));
    }

    setSyncError(undefined);
  } catch (error) {
    setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar KRs na API.");
    throw error;
  }
}

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const { products, ready: productsReady } = useProducts();
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();
  const activeProductIds = useMemo(
    () => products.filter((product) => product.status === "active").map((product) => product.id),
    [products],
  );

  useEffect(() => {
    let cancelled = false;

    function loadLocalState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as State;
          parsed.pillars = parsed.pillars ?? [];
          parsed.okrs = (parsed.okrs ?? []).map((o) => ({
            ...o,
            keyResults: Array.isArray(o.keyResults) ? o.keyResults : [],
          }));
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

      if (!productsReady) return;

      try {
        const remotePillarsByProduct = await Promise.all(
          activeProductIds.map((productId) => listStrategicPillarsFromApi(productId).catch(() => [])),
        );
        const remoteObjectivesByProduct = await Promise.all(
          activeProductIds.map((productId) => listObjectivesFromApi(productId).catch(() => [])),
        );
        const remoteObjectives = remoteObjectivesByProduct.flat();
        const remoteKeyResultsByObjective = await Promise.all(
          remoteObjectives.map(async (objective) => ({
            objective,
            keyResults: await listKeyResultsFromApi(objective.id).catch(() => []),
          })),
        );

        if (cancelled) return;
        setState({
          pillars: remotePillarsByProduct.flat().map(fromApiPillar),
          okrs: remoteKeyResultsByObjective.map(({ objective, keyResults }) =>
            fromApiObjective(objective, keyResults),
          ),
        });
        setSyncError(undefined);
      } catch (error) {
        if (cancelled) return;
        setSyncError(error instanceof Error ? error.message : "Falha ao carregar estratégia da API.");
        loadLocalState();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadRemoteState();

    return () => {
      cancelled = true;
    };
  }, [activeProductIds, isRemoteBacked, productsReady]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [isRemoteBacked, state, ready]);

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
      getPillar: (id) => state.pillars.find((p) => p.id === id),
      pillarsByProduct: (productId) => state.pillars.filter((p) => p.productId === productId),
      createPillar: async (productId, period) => {
        const id = nextId("PL", state.pillars);
        const item: Pillar = {
          id,
          productId,
          name: "Novo pilar",
          description: "",
          color: "var(--primary)",
          period: period ?? { type: "annual", year: currentYear },
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remotePillar = await createStrategicPillarInApi(productId, {
              name: item.name,
              description: item.description,
              color: COLOR_TO_HEX[item.color] ?? item.color,
            });
            const mapped = { ...fromApiPillar(remotePillar), period: item.period };
            setState((s) => ({ ...s, pillars: [mapped, ...s.pillars] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar pilar na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, pillars: [item, ...s.pillars] }));
        return item;
      },
      updatePillar: async (id, patch) => {
        setState((s) => ({ ...s, pillars: upd(s.pillars, id, patch) }));
        if (!isRemoteBacked) return;
        const payload = toApiPillarPayload(patch);
        if (Object.keys(payload).length === 0) return;
        try {
          const remotePillar = await updateStrategicPillarInApi(id, payload);
          setState((s) => ({
            ...s,
            pillars: s.pillars.map((pillar) =>
              pillar.id === id ? mergeLocalPillar(pillar, remotePillar) : pillar,
            ),
          }));
          setSyncError(undefined);
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "Falha ao atualizar pilar na API.");
          throw error;
        }
      },
      deletePillar: (id) => {
        setState((s) => ({
          ...s,
          pillars: s.pillars.filter((p) => p.id !== id),
          okrs: s.okrs.map((o) => (o.pillarId === id ? { ...o, pillarId: undefined } : o)),
        }));
        if (!isRemoteBacked) return;
        void deleteStrategicPillarInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir pilar na API.");
        });
      },

      getOKR: (id) => state.okrs.find((o) => o.id === id),
      okrsByProduct: (productId) => state.okrs.filter((o) => o.productId === productId),
      okrsByPillar: (pillarId) => state.okrs.filter((o) => o.pillarId === pillarId),
      createOKR: async (productId, pillarId, period) => {
        const id = nextId("OKR", state.okrs);
        const item: OKR = {
          id,
          productId,
          pillarId,
          objective: "Novo objetivo",
          description: "",
          status: "on_track",
          period: period ?? { type: "quarterly", year: currentYear, quarter: 1 },
          keyResults: [],
          createdAt: now(),
          updatedAt: now(),
        };
        if (isRemoteBacked) {
          try {
            const remoteObjective = await createObjectiveInApi(productId, {
              title: item.objective,
              description: item.description,
              ...(pillarId ? { pillar_id: pillarId } : {}),
              ...periodToDates(item.period),
            });
            const mapped = fromApiObjective(remoteObjective);
            setState((s) => ({ ...s, okrs: [mapped, ...s.okrs] }));
            setSyncError(undefined);
            return mapped;
          } catch (error) {
            setSyncError(error instanceof Error ? error.message : "Falha ao criar OKR na API.");
            throw error;
          }
        }
        setState((s) => ({ ...s, okrs: [item, ...s.okrs] }));
        return item;
      },
      updateOKR: async (id, patch) => {
        const current = state.okrs.find((okr) => okr.id === id);
        setState((s) => ({ ...s, okrs: upd(s.okrs, id, patch) }));
        if (!isRemoteBacked || !current) return;

        const objectivePayload = toApiObjectivePayload(patch);
        try {
          if (Object.keys(objectivePayload).length > 0) {
            const remoteObjective = await updateObjectiveInApi(id, objectivePayload);
            setState((s) => ({
              ...s,
              okrs: s.okrs.map((okr) =>
                okr.id === id
                  ? {
                      ...mergeLocalOKR(okr, remoteObjective),
                      ...(patch.status ? { status: patch.status } : {}),
                    }
                  : okr,
              ),
            }));
          }

          if (patch.status && patch.status !== current.status) {
            const nextStatus = patch.status;
            const remoteObjective = await transitionObjectiveStatusInApi(
              id,
              UI_TO_API_OKR_STATUS[nextStatus],
            );
            setState((s) => ({
              ...s,
              okrs: s.okrs.map((okr) =>
                okr.id === id ? { ...mergeLocalOKR(okr, remoteObjective), status: nextStatus } : okr,
              ),
            }));
          }

          if (patch.keyResults) {
            await syncKeyResults(id, current.keyResults, patch.keyResults, setState, setSyncError);
          }

          setSyncError(undefined);
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "Falha ao atualizar OKR na API.");
          throw error;
        }
      },
      deleteOKR: (id) => {
        setState((s) => ({ ...s, okrs: s.okrs.filter((o) => o.id !== id) }));
        if (!isRemoteBacked) return;
        void deleteObjectiveInApi(id).catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao excluir OKR na API.");
        });
      },
    };
  }, [isRemoteBacked, ready, state, syncError]);

  return <StrategyCtx.Provider value={value}>{children}</StrategyCtx.Provider>;
}

export function useStrategy() {
  const ctx = useContext(StrategyCtx);
  if (!ctx) throw new Error("useStrategy precisa estar dentro de <StrategyProvider>");
  return ctx;
}
