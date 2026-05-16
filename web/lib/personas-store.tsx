"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { initialPersonas, type Persona, type PersonaScope } from "./personas-data";

const STORAGE_KEY = "personas-store-v1";

interface Ctx {
  personas: Persona[];
  ready: boolean;
  getPersona: (id: string) => Persona | undefined;
  createPersona: (input?: Partial<Persona>) => Persona;
  updatePersona: (id: string, patch: Partial<Persona>) => void;
  deletePersona: (id: string) => void;
  personasByProduct: (productId: string) => Persona[];
  personasByPain: (painId: string) => Persona[];
  personasByScope: (scope: PersonaScope) => Persona[];
}

const PersonasCtx = createContext<Ctx | null>(null);

function nextId(list: Persona[]): string {
  const nums = list
    .map((p) => parseInt(p.id.replace(/\D/g, ""), 10))
    .filter(Number.isFinite);
  const max = nums.length ? Math.max(...nums) : 0;
  return `PR-${String(max + 1).padStart(2, "0")}`;
}

export function PersonasProvider({ children }: { children: React.ReactNode }) {
  const [personas, setPersonas] = useState<Persona[]>(initialPersonas);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setPersonas(JSON.parse(raw) as Persona[]);
    } catch {}
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
    } catch {}
  }, [personas, ready]);

  const value = useMemo<Ctx>(
    () => ({
      personas,
      ready,
      getPersona: (id) => personas.find((p) => p.id === id),
      personasByProduct: (productId) =>
        personas.filter((p) => p.scope === "product" && p.productId === productId),
      personasByPain: (painId) =>
        personas.filter((p) => p.scope === "pain" && p.painId === painId),
      personasByScope: (scope) => personas.filter((p) => p.scope === scope),
      createPersona: (input) => {
        const now = new Date().toISOString();
        const id = nextId(personas);
        const item: Persona = {
          id,
          name: "Nova persona",
          role: "",
          avatarId: "aria",
          scope: "workspace",
          createdAt: now,
          updatedAt: now,
          ...input,
        };
        setPersonas((prev) => [item, ...prev]);
        return item;
      },
      updatePersona: (id, patch) => {
        setPersonas((prev) =>
          prev.map((p) =>
            p.id === id ? { ...p, ...patch, updatedAt: new Date().toISOString() } : p,
          ),
        );
      },
      deletePersona: (id) => setPersonas((prev) => prev.filter((p) => p.id !== id)),
    }),
    [personas, ready],
  );

  return <PersonasCtx.Provider value={value}>{children}</PersonasCtx.Provider>;
}

export function usePersonas() {
  const ctx = useContext(PersonasCtx);
  if (!ctx) throw new Error("usePersonas precisa estar dentro de <PersonasProvider>");
  return ctx;
}
