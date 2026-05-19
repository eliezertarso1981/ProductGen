"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  type ApiPersona,
  createPersonaInApi,
  deletePersonaInApi,
  isProductgenApiConfigured,
  linkPainPersonaInApi,
  listPersonasFromApi,
  unlinkPainPersonaInApi,
  updatePersonaInApi,
} from "./productgen-api";
import { initialPersonas, type Persona, type PersonaScope } from "./personas-data";

const STORAGE_KEY = "personas-store-v1";

interface Ctx {
  personas: Persona[];
  ready: boolean;
  isRemoteBacked: boolean;
  syncError?: string;
  getPersona: (id: string) => Persona | undefined;
  createPersona: (input?: Partial<Persona>) => Promise<Persona>;
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
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();

  useEffect(() => {
    let cancelled = false;

    function loadLocalPersonas() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setPersonas(JSON.parse(raw) as Persona[]);
      } catch {
        // ignore
      }
    }

    async function loadPersonas() {
      if (!isRemoteBacked) {
        loadLocalPersonas();
        if (!cancelled) setReady(true);
        return;
      }

      try {
        const remotePersonas = await listPersonasFromApi();
        if (cancelled) return;
        setPersonas(remotePersonas.map(fromApiPersona));
        setSyncError(undefined);
      } catch (error) {
        if (cancelled) return;
        setSyncError(error instanceof Error ? error.message : "Falha ao carregar personas da API.");
        loadLocalPersonas();
      } finally {
        if (!cancelled) setReady(true);
      }
    }

    void loadPersonas();

    return () => {
      cancelled = true;
    };
  }, [isRemoteBacked]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(personas));
    } catch {
      // ignore
    }
  }, [isRemoteBacked, personas, ready]);

  const getPersona = useCallback(
    (id: string) => personas.find((p) => p.id === id || p.apiId === id || p.code === id),
    [personas],
  );

  const updatePersona = useCallback((id: string, patch: Partial<Persona>) => {
    const current = personas.find((p) => p.id === id || p.apiId === id || p.code === id);
    setPersonas((prev) =>
      prev.map((p) =>
        p.id === id || p.apiId === id || p.code === id
          ? { ...p, ...patch, updatedAt: new Date().toISOString() }
          : p,
      ),
    );
    if (!isRemoteBacked || !current?.apiId) return;

    const next = { ...current, ...patch, updatedAt: new Date().toISOString() };
    void updatePersonaInApi(current.apiId, toApiPersonaPayload(next))
      .then((remotePersona) => {
        const mapped = {
          ...fromApiPersona(remotePersona),
          scope: next.scope,
          productId: next.productId,
          painId: next.painId,
        };
        setPersonas((prev) => prev.map((persona) => (persona.apiId === remotePersona.id ? mapped : persona)));
        setSyncError(undefined);
      })
      .catch((error) => {
        setSyncError(error instanceof Error ? error.message : "Falha ao atualizar persona na API.");
      });

    if (patch.scope !== undefined || patch.painId !== undefined) {
      void syncPainPersonaLink(current, next, setSyncError);
    }
  }, [isRemoteBacked, personas]);

  const createPersona = useCallback(
    async (input?: Partial<Persona>): Promise<Persona> => {
      const now = new Date().toISOString();
      const id = nextId(personas);
      const item: Persona = {
        id,
        code: id,
        name: "Nova persona",
        role: "",
        avatarId: "aria",
        scope: "workspace",
        createdAt: now,
        updatedAt: now,
        ...input,
      };

      if (isRemoteBacked) {
        try {
          const remotePersona = await createPersonaInApi({
            ...toApiPersonaPayload(item, true),
            name: item.name || "Nova persona",
          });
          const mapped = fromApiPersona(remotePersona);
          setPersonas((prev) => [mapped, ...prev]);
          if (item.scope === "pain" && item.painId) {
            await linkPainPersonaInApi(item.painId, remotePersona.id).catch(() => undefined);
          }
          setSyncError(undefined);
          return mapped;
        } catch (error) {
          setSyncError(error instanceof Error ? error.message : "Falha ao criar persona na API.");
          throw error;
        }
      }

      setPersonas((prev) => [item, ...prev]);
      return item;
    },
    [isRemoteBacked, personas],
  );

  const deletePersona = useCallback((id: string) => {
    const current = personas.find((p) => p.id === id || p.apiId === id || p.code === id);
    setPersonas((prev) => prev.filter((p) => p.id !== id && p.apiId !== id && p.code !== id));
    if (!isRemoteBacked || !current?.apiId) return;
    void deletePersonaInApi(current.apiId).catch((error) => {
      setSyncError(error instanceof Error ? error.message : "Falha ao excluir persona na API.");
    });
  }, [isRemoteBacked, personas]);

  const value = useMemo<Ctx>(
    () => ({
      personas,
      ready,
      isRemoteBacked,
      syncError,
      getPersona,
      personasByProduct: (productId) =>
        personas.filter((p) => p.scope === "product" && p.productId === productId),
      personasByPain: (painId) =>
        personas.filter((p) => p.scope === "pain" && p.painId === painId),
      personasByScope: (scope) => personas.filter((p) => p.scope === scope),
      createPersona,
      updatePersona,
      deletePersona,
    }),
    [
      personas,
      ready,
      isRemoteBacked,
      syncError,
      getPersona,
      createPersona,
      updatePersona,
      deletePersona,
    ],
  );

  return <PersonasCtx.Provider value={value}>{children}</PersonasCtx.Provider>;
}

export function usePersonas() {
  const ctx = useContext(PersonasCtx);
  if (!ctx) throw new Error("usePersonas precisa estar dentro de <PersonasProvider>");
  return ctx;
}

function fromApiPersona(persona: ApiPersona): Persona {
  const metadata = persona.metadata ?? {};
  const painId = persona.pain_ids[0];
  const scope = readString(metadata.scope);
  const productId = readString(metadata.productId);
  return {
    id: persona.code,
    apiId: persona.id,
    code: persona.code,
    name: persona.name,
    role: readString(metadata.role) ?? persona.description ?? "",
    age: readNumber(metadata.age),
    gender: readString(metadata.gender),
    avatarId: readString(metadata.avatarId) ?? "aria",
    scope: scope === "workspace" || scope === "product" || scope === "pain"
      ? scope
      : painId
        ? "pain"
        : productId
          ? "product"
          : "workspace",
    productId,
    painId: painId ?? readString(metadata.painId),
    segment: readString(metadata.segment),
    companySize: readString(metadata.companySize),
    responsibilities: readString(metadata.responsibilities),
    dailyGoals: readString(metadata.dailyGoals),
    pains: readString(metadata.pains),
    buyingTriggers: readString(metadata.buyingTriggers),
    objections: readString(metadata.objections),
    decisionCriteria: readString(metadata.decisionCriteria),
    digitalMaturity: readDigitalMaturity(metadata.digitalMaturity),
    tools: readString(metadata.tools),
    operationalBehavior: readString(metadata.operationalBehavior),
    kpis: readString(metadata.kpis),
    buyingInfluence: readString(metadata.buyingInfluence),
    channels: readString(metadata.channels),
    motivators: readString(metadata.motivators),
    fears: readString(metadata.fears),
    quote: readString(metadata.quote),
    successDefinition: readString(metadata.successDefinition),
    createdAt: persona.created_at,
    updatedAt: persona.updated_at,
  };
}

function toApiPersonaPayload(persona: Persona, creating = false) {
  return {
    name: persona.name || (creating ? "Nova persona" : undefined),
    description: persona.role || null,
    metadata: {
      role: persona.role,
      avatarId: persona.avatarId,
      scope: persona.scope,
      productId: persona.productId,
      painId: persona.painId,
      age: persona.age,
      gender: persona.gender,
      segment: persona.segment,
      companySize: persona.companySize,
      responsibilities: persona.responsibilities,
      dailyGoals: persona.dailyGoals,
      pains: persona.pains,
      buyingTriggers: persona.buyingTriggers,
      objections: persona.objections,
      decisionCriteria: persona.decisionCriteria,
      digitalMaturity: persona.digitalMaturity,
      tools: persona.tools,
      operationalBehavior: persona.operationalBehavior,
      kpis: persona.kpis,
      buyingInfluence: persona.buyingInfluence,
      channels: persona.channels,
      motivators: persona.motivators,
      fears: persona.fears,
      quote: persona.quote,
      successDefinition: persona.successDefinition,
    },
  };
}

async function syncPainPersonaLink(
  previous: Persona,
  next: Persona,
  setSyncError: (message?: string) => void,
) {
  try {
    if (!previous.apiId) return;
    const previousPainId = previous.scope === "pain" ? previous.painId : undefined;
    const nextPainId = next.scope === "pain" ? next.painId : undefined;
    if (previousPainId && previousPainId !== nextPainId) {
      await unlinkPainPersonaInApi(previousPainId, previous.apiId).catch(() => undefined);
    }
    if (nextPainId && nextPainId !== previousPainId) {
      await linkPainPersonaInApi(nextPainId, previous.apiId);
    }
    setSyncError(undefined);
  } catch (error) {
    setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar vínculo da persona.");
  }
}

function readString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function readNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function readDigitalMaturity(value: unknown): Persona["digitalMaturity"] {
  return value === "baixa" || value === "media" || value === "alta" ? value : undefined;
}
