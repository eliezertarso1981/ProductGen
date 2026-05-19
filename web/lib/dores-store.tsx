"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useProducts } from "./products-context";
import {
  type ApiPain,
  type ApiPainStatus,
  type ApiPersona,
  createPainInApi,
  deletePainInApi,
  getPainFromApi,
  isProductgenApiConfigured,
  linkPainObjectiveInApi,
  linkPainStrategicPillarInApi,
  listPainObjectivesFromApi,
  listPainPersonasFromApi,
  listPainsFromApi,
  listPainStrategicPillarsFromApi,
  transitionPainStatusInApi,
  unlinkPainObjectiveInApi,
  unlinkPainStrategicPillarInApi,
  updatePainInApi,
} from "./productgen-api";
import {
  boardColumns,
  initialPains,
  owners,
  type Pain,
  type PainAttachment,
  type PainComment,
  type PainStatus,
} from "./dores-data";

const STORAGE_KEY = "dores-store-v3";

const STATUS_MIGRATION: Record<string, PainStatus> = {
  identificada: "backlog",
  investigando: "em_validacao",
  priorizada: "em_validacao",
  enderecada: "em_validacao",
  resolvida: "validada",
  descartada: "descartada",
};

function sanitize(p: Pain, fallbackProductId: string): Pain {
  const status = (boardColumns as string[]).includes(p.status)
    ? p.status
    : (STATUS_MIGRATION[p.status as unknown as string] ?? "backlog");
  return {
    ...p,
    status,
    productId: p.productId ?? fallbackProductId,
    responsibles: p.responsibles ?? (p.owner ? [p.owner] : []),
    attachments: p.attachments ?? [],
    comments: p.comments ?? [],
    okrIds: Array.isArray(p.okrIds) ? p.okrIds : [],
    createdAt: p.createdAt ?? new Date().toISOString(),
    updatedAt: p.updatedAt ?? new Date().toISOString(),
  };
}


interface Ctx {
  pains: Pain[];
  ready: boolean;
  isRemoteBacked: boolean;
  syncError?: string;
  currentUser: typeof owners.CM;
  getPain: (id: string) => Pain | undefined;
  createPain: (productId: string) => Promise<Pain>;
  updatePain: (id: string, patch: Partial<Pain>) => void;
  deletePain: (id: string) => void;
  moveStatus: (id: string, status: PainStatus) => void;
  addComment: (id: string, text: string) => void;
  addAttachments: (id: string, files: PainAttachment[]) => void;
  removeAttachment: (id: string, attId: string) => void;
}

const DoresCtx = createContext<Ctx | null>(null);

const API_TO_UI_STATUS: Record<ApiPainStatus, PainStatus> = {
  identified: "backlog",
  investigating: "em_validacao",
  prioritized: "em_validacao",
  addressed: "em_validacao",
  resolved: "validada",
  discarded: "descartada",
  merged: "descartada",
  split: "descartada",
};

const UI_TO_API_STATUS: Record<PainStatus, ApiPainStatus> = {
  backlog: "identified",
  em_validacao: "investigating",
  validada: "resolved",
  descartada: "discarded",
};

function nextPainId(pains: Pain[]): string {
  const nums = pains
    .map((p) => parseInt(p.id.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `PN-${String(max + 1).padStart(2, "0")}`;
}

export function DoresProvider({ children }: { children: React.ReactNode }) {
  const { products, ready: productsReady } = useProducts();
  const [pains, setPains] = useState<Pain[]>(initialPains);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();

  useEffect(() => {
    let cancelled = false;

    function loadLocalPains() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setPains((JSON.parse(raw) as Pain[]).map((p) => sanitize(p, "prod-core")));
      } catch {
        // ignore
      }
    }

    async function loadPains() {
      if (!isRemoteBacked) {
        loadLocalPains();
        if (!cancelled) setReady(true);
        return;
      }

      if (!productsReady) return;

      try {
        const remotePainsByProduct = await Promise.all(
          products.filter((product) => product.status === "active").map((product) => listPainsFromApi(product.id)),
        );
        const remotePains = remotePainsByProduct.flat();
        const remotePainLinks = await Promise.all(
          remotePains.map(async (pain) => {
            const [pillars, objectives] = await Promise.all([
              listPainStrategicPillarsFromApi(pain.id).catch(() => []),
              listPainObjectivesFromApi(pain.id).catch(() => []),
            ]);
            const personas = await listPainPersonasFromApi(pain.id).catch(() => []);
            return {
              painId: pain.id,
              pillarIds: pillars.map((pillar) => pillar.id),
              objectiveIds: objectives.map((objective) => objective.id),
              personas,
            };
          }),
        );
        const linksByPain = new Map(remotePainLinks.map((links) => [links.painId, links]));
        if (cancelled) return;
        setPains(remotePains.map((pain) => fromApiPain(pain, linksByPain.get(pain.id))));
        setSyncError(undefined);
      } catch (error) {
        if (cancelled) return;
        setSyncError(error instanceof Error ? error.message : "Falha ao carregar dores da API.");
        loadLocalPains();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadPains();

    return () => {
      cancelled = true;
    };
  }, [isRemoteBacked, products, productsReady]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pains));
    } catch {
      // ignore
    }
  }, [isRemoteBacked, pains, ready]);

  const currentUser = owners.CM;

  const getPain = useCallback((id: string) => pains.find((p) => p.id === id), [pains]);

  const updatePain = useCallback((id: string, patch: Partial<Pain>) => {
    setPains((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    );
    if (!isRemoteBacked) return;

    const payload = toApiPainPatch(patch);
    const hasStrategyLinksPatch = patch.pillarId !== undefined || patch.okrIds !== undefined;
    if (!payload && !patch.status && !hasStrategyLinksPatch) return;

    const current = pains.find((pain) => pain.id === id);
    if (!current) return;

    const request = patch.status
      ? transitionPainThroughLifecycle(current, patch.status)
      : payload
        ? updatePainInApi(id, payload)
        : null;

    if (request) {
      void request
        .then((remotePain) => {
          setPains((prev) => prev.map((pain) => (pain.id === id ? mergeLocalPain(pain, remotePain) : pain)));
          setSyncError(undefined);
        })
        .catch((error) => {
          setSyncError(error instanceof Error ? error.message : "Falha ao atualizar dor na API.");
        });
    }

    if (hasStrategyLinksPatch) {
      void syncPainStrategyLinks(id, current, patch, setSyncError);
    }
  }, [isRemoteBacked, pains]);

  const createPain = useCallback(
    async (productId: string): Promise<Pain> => {
      const now = new Date().toISOString();
      const id = nextPainId(pains);
      const newPain: Pain = {
        id,
        productId,
        title: "Nova dor",
        description: "",
        status: "backlog",
        severity: 3,
        reach: 0,
        evidences: 0,
        hypotheses: 0,
        personas: [],
        owner: currentUser,
        responsibles: [currentUser],
        attachments: [],
        comments: [],
        okrIds: [],
        createdAt: now,
        updatedAt: now,
      };
      if (isRemoteBacked) {
        try {
          const remotePain = await createPainInApi(productId, {
            title: newPain.title,
            description: newPain.description,
            severity: newPain.severity,
            reach_estimate: newPain.reach,
          });
          const mapped = fromApiPain(remotePain);
          setPains((prev) => [mapped, ...prev]);
          setSyncError(undefined);
          return mapped;
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "Falha ao criar dor na API.");
          throw error;
        }
      }
      setPains((prev) => (prev.some((p) => p.id === id) ? prev : [newPain, ...prev]));
      return newPain;
    },
    [currentUser, isRemoteBacked, pains],
  );


  const deletePain = useCallback((id: string) => {
    setPains((prev) => prev.filter((p) => p.id !== id));
    if (!isRemoteBacked) return;
    void deletePainInApi(id).catch((error) => {
      setSyncError(error instanceof Error ? error.message : "Falha ao excluir dor na API.");
    });
  }, [isRemoteBacked]);

  const moveStatus = useCallback(
    (id: string, status: PainStatus) => updatePain(id, { status }),
    [updatePain],
  );

  const addComment = useCallback(
    (id: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;
      const comment: PainComment = {
        id: `c-${Date.now()}`,
        author: currentUser,
        text: trimmed,
        createdAt: new Date().toISOString(),
      };
      setPains((prev) =>
        prev.map((p) =>
          p.id === id
            ? {
                ...p,
                comments: [...p.comments, comment],
                updatedAt: new Date().toISOString(),
              }
            : p,
        ),
      );
    },
    [currentUser],
  );

  const addAttachments = useCallback((id: string, files: PainAttachment[]) => {
    setPains((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              attachments: [...p.attachments, ...files],
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  }, []);

  const removeAttachment = useCallback((id: string, attId: string) => {
    setPains((prev) =>
      prev.map((p) =>
        p.id === id
          ? {
              ...p,
              attachments: p.attachments.filter((a) => a.id !== attId),
              updatedAt: new Date().toISOString(),
            }
          : p,
      ),
    );
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      pains,
      ready,
      isRemoteBacked,
      syncError,
      currentUser,
      getPain,
      createPain,
      updatePain,
      deletePain,
      moveStatus,
      addComment,
      addAttachments,
      removeAttachment,
    }),
    [
      pains,
      ready,
      isRemoteBacked,
      syncError,
      currentUser,
      getPain,
      createPain,
      updatePain,
      deletePain,
      moveStatus,
      addComment,
      addAttachments,
      removeAttachment,
    ],
  );

  return <DoresCtx.Provider value={value}>{children}</DoresCtx.Provider>;
}

export function useDores() {
  const ctx = useContext(DoresCtx);
  if (!ctx) throw new Error("useDores precisa estar dentro de <DoresProvider>");
  return ctx;
}

function fromApiPain(
  pain: ApiPain,
  links: { pillarIds?: string[]; objectiveIds?: string[]; personas?: ApiPersona[] } = {},
): Pain {
  return {
    id: pain.id,
    productId: pain.product_id,
    code: pain.code,
    apiStatus: pain.status,
    title: pain.title,
    description: pain.description ?? "",
    status: API_TO_UI_STATUS[pain.status] ?? "backlog",
    severity: clampSeverity(pain.severity),
    reach: pain.reach_estimate ?? 0,
    evidences: 0,
    hypotheses: 0,
    personas: links.personas?.map(toPersonaTag) ?? [],
    owner: owners.CM,
    responsibles: [owners.CM],
    attachments: [],
    comments: [],
    pillarId: links.pillarIds?.[0],
    okrIds: links.objectiveIds ?? [],
    createdAt: pain.created_at,
    updatedAt: pain.updated_at,
  };
}

function toPersonaTag(persona: ApiPersona) {
  return {
    id: persona.code,
    initial: (persona.name.trim()[0] ?? "P").toUpperCase(),
    color: readPersonaColor(persona.metadata.color) ?? "var(--primary)",
  };
}

function readPersonaColor(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function mergeLocalPain(localPain: Pain, remotePain: ApiPain): Pain {
  return {
    ...localPain,
    productId: remotePain.product_id,
    code: remotePain.code,
    apiStatus: remotePain.status,
    title: remotePain.title,
    description: remotePain.description ?? "",
    status: API_TO_UI_STATUS[remotePain.status] ?? localPain.status,
    severity: clampSeverity(remotePain.severity),
    reach: remotePain.reach_estimate ?? 0,
    updatedAt: remotePain.updated_at,
  };
}

function clampSeverity(value: number | null | undefined): 1 | 2 | 3 | 4 | 5 {
  if (value === 1 || value === 2 || value === 3 || value === 4 || value === 5) return value;
  return 3;
}

function toApiPainPatch(patch: Partial<Pain>) {
  const payload: {
    title?: string;
    product_id?: string;
    description?: string | null;
    severity?: number | null;
    reach_estimate?: number | null;
  } = {};

  if (patch.title !== undefined) payload.title = patch.title;
  if (patch.productId !== undefined) payload.product_id = patch.productId;
  if (patch.description !== undefined) payload.description = patch.description;
  if (patch.severity !== undefined) payload.severity = patch.severity;
  if (patch.reach !== undefined) payload.reach_estimate = patch.reach;

  return Object.keys(payload).length > 0 ? payload : null;
}

async function syncPainStrategyLinks(
  painId: string,
  current: Pain,
  patch: Partial<Pain>,
  setSyncError: (message?: string) => void,
) {
  try {
    if (patch.pillarId !== undefined && patch.pillarId !== current.pillarId) {
      if (current.pillarId) {
        await unlinkPainStrategicPillarInApi(painId, current.pillarId);
      }
      if (patch.pillarId) {
        await linkPainStrategicPillarInApi(painId, patch.pillarId);
      }
    }

    if (patch.okrIds !== undefined) {
      const previousIds = new Set(current.okrIds ?? []);
      const nextIds = new Set(patch.okrIds);
      await Promise.all(
        [...previousIds]
          .filter((objectiveId) => !nextIds.has(objectiveId))
          .map((objectiveId) => unlinkPainObjectiveInApi(painId, objectiveId)),
      );
      await Promise.all(
        [...nextIds]
          .filter((objectiveId) => !previousIds.has(objectiveId))
          .map((objectiveId) => linkPainObjectiveInApi(painId, objectiveId)),
      );
    }

    setSyncError(undefined);
  } catch (error) {
    setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar vínculos da dor na API.");
  }
}

async function transitionPainThroughLifecycle(pain: Pain, targetStatus: PainStatus) {
  const currentStatus = (pain.apiStatus as ApiPainStatus | undefined) ?? UI_TO_API_STATUS[pain.status];
  const targetApiStatus = UI_TO_API_STATUS[targetStatus];
  const path = getPainTransitionPath(currentStatus, targetApiStatus);
  let remotePain: ApiPain | null = null;

  for (const status of path) {
    remotePain = await transitionPainStatusInApi(
      pain.id,
      status,
      status === "discarded" ? "Descartada pela interface" : undefined,
    );
  }

  return remotePain ?? getPainFromApi(pain.id);
}

function getPainTransitionPath(from: ApiPainStatus, to: ApiPainStatus): ApiPainStatus[] {
  if (from === to) return [];

  const paths: Partial<Record<ApiPainStatus, Partial<Record<ApiPainStatus, ApiPainStatus[]>>>> = {
    identified: {
      investigating: ["investigating"],
      resolved: ["investigating", "prioritized", "addressed", "resolved"],
      discarded: ["discarded"],
    },
    investigating: {
      identified: ["identified"],
      resolved: ["prioritized", "addressed", "resolved"],
      discarded: ["discarded"],
    },
    prioritized: {
      identified: ["investigating", "identified"],
      investigating: ["investigating"],
      resolved: ["addressed", "resolved"],
      discarded: ["discarded"],
    },
    addressed: {
      identified: ["investigating", "identified"],
      investigating: ["investigating"],
      resolved: ["resolved"],
      discarded: ["investigating", "discarded"],
    },
    resolved: {
      identified: ["identified"],
      investigating: ["identified", "investigating"],
      discarded: ["identified", "discarded"],
    },
    discarded: {
      identified: ["identified"],
      investigating: ["identified", "investigating"],
      resolved: ["identified", "investigating", "prioritized", "addressed", "resolved"],
    },
  };

  return paths[from]?.[to] ?? [to];
}
