"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
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
  currentUser: typeof owners.CM;
  getPain: (id: string) => Pain | undefined;
  createPain: (productId: string) => Pain;
  updatePain: (id: string, patch: Partial<Pain>) => void;
  deletePain: (id: string) => void;
  moveStatus: (id: string, status: PainStatus) => void;
  addComment: (id: string, text: string) => void;
  addAttachments: (id: string, files: PainAttachment[]) => void;
  removeAttachment: (id: string, attId: string) => void;
}

const DoresCtx = createContext<Ctx | null>(null);

function nextPainId(pains: Pain[]): string {
  const nums = pains
    .map((p) => parseInt(p.id.replace(/\D/g, ""), 10))
    .filter((n) => Number.isFinite(n));
  const max = nums.length ? Math.max(...nums) : 0;
  return `PN-${String(max + 1).padStart(2, "0")}`;
}

export function DoresProvider({ children }: { children: React.ReactNode }) {
  const [pains, setPains] = useState<Pain[]>(initialPains);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw)
        setPains((JSON.parse(raw) as Pain[]).map((p) => sanitize(p, "prod-core")));
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pains));
    } catch {
      // ignore
    }
  }, [pains, ready]);

  const currentUser = owners.CM;

  const getPain = useCallback((id: string) => pains.find((p) => p.id === id), [pains]);

  const updatePain = useCallback((id: string, patch: Partial<Pain>) => {
    setPains((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
      ),
    );
  }, []);

  const createPain = useCallback(
    (productId: string): Pain => {
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
      setPains((prev) => (prev.some((p) => p.id === id) ? prev : [newPain, ...prev]));
      return newPain;
    },
    [pains, currentUser],
  );


  const deletePain = useCallback((id: string) => {
    setPains((prev) => prev.filter((p) => p.id !== id));
  }, []);

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
