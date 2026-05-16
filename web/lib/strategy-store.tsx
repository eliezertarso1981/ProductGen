"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { OKR, Pillar, Period } from "./strategy-data";

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
  // pillars
  getPillar: (id: string) => Pillar | undefined;
  pillarsByProduct: (productId: string) => Pillar[];
  createPillar: (productId: string, period?: Period) => Pillar;
  updatePillar: (id: string, patch: Partial<Pillar>) => void;
  deletePillar: (id: string) => void;
  // okrs
  getOKR: (id: string) => OKR | undefined;
  okrsByProduct: (productId: string) => OKR[];
  okrsByPillar: (pillarId: string) => OKR[];
  createOKR: (productId: string, pillarId?: string, period?: Period) => OKR;
  updateOKR: (id: string, patch: Partial<OKR>) => void;
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

export function StrategyProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initialState);
  const [ready, setReady] = useState(false);

  useEffect(() => {
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
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [state, ready]);

  const value = useMemo<Ctx>(() => {
    const upd = <T extends { id: string; updatedAt: string }>(
      list: T[],
      id: string,
      patch: Partial<T>,
    ): T[] => list.map((x) => (x.id === id ? { ...x, ...patch, updatedAt: now() } : x));

    return {
      ...state,
      ready,
      getPillar: (id) => state.pillars.find((p) => p.id === id),
      pillarsByProduct: (productId) => state.pillars.filter((p) => p.productId === productId),
      createPillar: (productId, period) => {
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
        setState((s) => ({ ...s, pillars: [item, ...s.pillars] }));
        return item;
      },
      updatePillar: (id, patch) =>
        setState((s) => ({ ...s, pillars: upd(s.pillars, id, patch) })),
      deletePillar: (id) =>
        setState((s) => ({
          ...s,
          pillars: s.pillars.filter((p) => p.id !== id),
          okrs: s.okrs.map((o) => (o.pillarId === id ? { ...o, pillarId: undefined } : o)),
        })),

      getOKR: (id) => state.okrs.find((o) => o.id === id),
      okrsByProduct: (productId) => state.okrs.filter((o) => o.productId === productId),
      okrsByPillar: (pillarId) => state.okrs.filter((o) => o.pillarId === pillarId),
      createOKR: (productId, pillarId, period) => {
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
        setState((s) => ({ ...s, okrs: [item, ...s.okrs] }));
        return item;
      },
      updateOKR: (id, patch) => setState((s) => ({ ...s, okrs: upd(s.okrs, id, patch) })),
      deleteOKR: (id) =>
        setState((s) => ({ ...s, okrs: s.okrs.filter((o) => o.id !== id) })),
    };
  }, [state, ready]);

  return <StrategyCtx.Provider value={value}>{children}</StrategyCtx.Provider>;
}

export function useStrategy() {
  const ctx = useContext(StrategyCtx);
  if (!ctx) throw new Error("useStrategy precisa estar dentro de <StrategyProvider>");
  return ctx;
}
