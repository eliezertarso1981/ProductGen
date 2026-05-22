"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { owners } from "./dores-data";
import { useAuth } from "./auth-context";
import {
  type ApiWorkspaceTeam,
  type ApiWorkspaceMember,
  type WorkspaceJobFunction,
  type WorkspaceRole,
  addWorkspaceTeamMemberInApi,
  addWorkspaceTeamProductInApi,
  createWorkspaceMemberInApi,
  createWorkspaceTeamInApi,
  deleteWorkspaceTeamInApi,
  isProductgenApiConfigured,
  WORKSPACE_ID_KEY,
  listWorkspaceMembersFromApi,
  listWorkspaceTeamsFromApi,
  removeWorkspaceMemberFromApi,
  removeWorkspaceTeamMemberInApi,
  removeWorkspaceTeamProductInApi,
  updateWorkspaceMemberInApi,
  updateWorkspaceTeamInApi,
} from "./productgen-api";

export interface Member {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: string;
  role?: string;
  workspaceRole?: WorkspaceRole;
  jobFunction?: WorkspaceJobFunction | null;
  joinedAt?: string;
  lastAccessedAt?: string | null;
}

export interface Team {
  id: string;
  code?: string;
  name: string;
  description?: string;
  color: string;
  memberIds: string[];
  productIds: string[];
}

export interface Pillar {
  id: string;
  productId: string;
  name: string;
  description?: string;
  color: string;
}

export interface KeyResult {
  id: string;
  text: string;
  target: number;
  current: number;
  unit?: string;
}

export interface Okr {
  id: string;
  productId: string;
  pillarId?: string;
  objective: string;
  quarter: string;
  ownerId?: string;
  keyResults: KeyResult[];
}

const STORAGE_KEY = "workspace-store-v1";

const teamColors = [
  "var(--primary)",
  "var(--purple)",
  "var(--cyan)",
  "var(--warn-strong)",
  "var(--success)",
];

const pillarColors = [
  "var(--primary)",
  "var(--purple)",
  "var(--cyan)",
  "var(--warn-strong)",
  "var(--success)",
  "var(--danger)",
];

const seedMembers: Member[] = [
  { id: "AS", name: "Ana Silva", email: "ana@acme.com", initials: "AS", color: "var(--purple)", role: "Head of Product" },
  { id: "CM", name: "Camila Moraes", email: "camila@acme.com", initials: "CM", color: "var(--primary)", role: "PM Sr." },
  { id: "JC", name: "João Costa", email: "joao@acme.com", initials: "JC", color: "var(--warn-strong)", role: "PM" },
  { id: "RP", name: "Rafael Pires", email: "rafael@acme.com", initials: "RP", color: "var(--cyan)", role: "Designer" },
  { id: "ES", name: "Eliezer Silva", email: "eliezer@acme.com", initials: "ES", color: "var(--success)", role: "PM" },
  { id: "MT", name: "Marina Teles", email: "marina@acme.com", initials: "MT", color: "var(--danger)", role: "UX Researcher" },
];

const seedTeams: Team[] = [
  {
    id: "team-core",
    code: "TM-01",
    name: "Squad Core",
    description: "Time multidisciplinar do PM Core",
    color: "var(--primary)",
    memberIds: ["AS", "CM", "RP"],
    productIds: ["prod-core"],
  },
  {
    id: "team-insights",
    code: "TM-02",
    name: "Squad Insights",
    description: "Discovery e research",
    color: "var(--purple)",
    memberIds: ["CM", "MT"],
    productIds: ["prod-insights"],
  },
  {
    id: "team-mobile",
    code: "TM-03",
    name: "Squad Mobile",
    description: "App companion",
    color: "var(--warn-strong)",
    memberIds: ["JC", "RP"],
    productIds: ["prod-mobile"],
  },
];

const seedPillars: Pillar[] = [
  { id: "pl-core-1", productId: "prod-core", name: "Ativação", description: "Reduzir tempo de primeiro valor", color: "var(--primary)" },
  { id: "pl-core-2", productId: "prod-core", name: "Retenção", description: "Aumentar uso semanal recorrente", color: "var(--purple)" },
  { id: "pl-insights-1", productId: "prod-insights", name: "Qualidade de Insights", color: "var(--cyan)" },
  { id: "pl-mobile-1", productId: "prod-mobile", name: "Adoção Mobile", color: "var(--warn-strong)" },
];

const seedOkrs: Okr[] = [
  {
    id: "okr-1",
    productId: "prod-core",
    pillarId: "pl-core-1",
    objective: "Tornar o onboarding sem fricção",
    quarter: "Q4 2025",
    ownerId: "AS",
    keyResults: [
      { id: "kr-1", text: "Time-to-first-value < 3 dias", target: 3, current: 5, unit: "dias" },
      { id: "kr-2", text: "Activation rate ≥ 60%", target: 60, current: 47, unit: "%" },
    ],
  },
  {
    id: "okr-2",
    productId: "prod-core",
    pillarId: "pl-core-2",
    objective: "Aumentar uso semanal recorrente",
    quarter: "Q4 2025",
    ownerId: "CM",
    keyResults: [
      { id: "kr-3", text: "WAU/MAU ≥ 55%", target: 55, current: 41, unit: "%" },
    ],
  },
  {
    id: "okr-3",
    productId: "prod-insights",
    pillarId: "pl-insights-1",
    objective: "Acelerar entrega de research",
    quarter: "Q4 2025",
    ownerId: "MT",
    keyResults: [
      { id: "kr-4", text: "Tempo médio de relatório < 5d", target: 5, current: 8, unit: "dias" },
    ],
  },
];

interface State {
  members: Member[];
  teams: Team[];
  pillars: Pillar[];
  okrs: Okr[];
}

const initial: State = {
  members: seedMembers,
  teams: seedTeams,
  pillars: seedPillars,
  okrs: seedOkrs,
};

interface Ctx extends State {
  ready: boolean;
  isRemoteBacked: boolean;
  syncError?: string;
  // Members
  addMember: (input: Omit<Member, "id" | "initials" | "color"> & { id?: string }) => Member;
  updateMember: (id: string, patch: Partial<Member>) => void;
  removeMember: (id: string) => void;
  // Teams
  addTeam: (input: { name: string; description?: string; productIds?: string[] }) => Team;
  updateTeam: (id: string, patch: Partial<Team>) => void;
  removeTeam: (id: string) => void;
  toggleTeamProduct: (teamId: string, productId: string) => void;
  toggleTeamMember: (teamId: string, memberId: string) => void;
  // Helpers
  teamsByProduct: (productId: string) => Team[];
  membersByProduct: (productId: string) => Member[];
  // Pillars
  addPillar: (productId: string, name: string) => Pillar;
  updatePillar: (id: string, patch: Partial<Pillar>) => void;
  movePillar: (id: string, productId: string) => void;
  removePillar: (id: string) => void;
  pillarsByProduct: (productId: string) => Pillar[];
  // OKRs
  addOkr: (productId: string, pillarId?: string) => Okr;
  updateOkr: (id: string, patch: Partial<Okr>) => void;
  moveOkr: (id: string, productId: string) => void;
  removeOkr: (id: string) => void;
  okrsByProduct: (productId: string) => Okr[];
  // KRs
  addKR: (okrId: string) => void;
  updateKR: (okrId: string, krId: string, patch: Partial<KeyResult>) => void;
  removeKR: (okrId: string, krId: string) => void;
}

const WorkspaceCtx = createContext<Ctx | null>(null);

function makeInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((w) => w[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "??"
  );
}

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>(initial);
  const [ready, setReady] = useState(false);
  const [syncError, setSyncError] = useState<string>();
  const isRemoteBacked = isProductgenApiConfigured();
  const auth = useAuth();

  useEffect(() => {
    let cancelled = false;

    function loadLocalState() {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<State>;
          setState({
            members: parsed.members ?? initial.members,
            teams: parsed.teams ?? initial.teams,
            pillars: parsed.pillars ?? initial.pillars,
            okrs: parsed.okrs ?? initial.okrs,
          });
        }
      } catch {
        // ignore
      }
    }

    async function loadState() {
      if (!isRemoteBacked) {
        loadLocalState();
        setReady(true);
        return;
      }

      if (!auth.ready) return;

      const workspaceId = auth.currentWorkspaceId;
      if (!workspaceId) {
        loadLocalState();
        setSyncError(undefined);
        if (!cancelled) setReady(true);
        return;
      }

      localStorage.setItem(WORKSPACE_ID_KEY, workspaceId);

      const errors: string[] = [];
      let members: Awaited<ReturnType<typeof listWorkspaceMembersFromApi>> = [];
      let teams: Awaited<ReturnType<typeof listWorkspaceTeamsFromApi>> = [];

      try {
        members = await listWorkspaceMembersFromApi();
      } catch (error) {
        errors.push(
          error instanceof Error ? error.message : "Falha ao carregar membros.",
        );
      }

      try {
        teams = await listWorkspaceTeamsFromApi();
      } catch (error) {
        errors.push(error instanceof Error ? error.message : "Falha ao carregar squads.");
      }

      if (cancelled) return;

      if (errors.length === 0) {
        setState((current) => ({
          ...current,
          members: members.map(fromApiWorkspaceMember),
          teams: teams.map(fromApiWorkspaceTeam),
        }));
        setSyncError(undefined);
      } else {
        setSyncError(errors.join(" "));
        if (members.length > 0 || teams.length > 0) {
          setState((current) => ({
            ...current,
            ...(members.length > 0
              ? { members: members.map(fromApiWorkspaceMember) }
              : {}),
            ...(teams.length > 0 ? { teams: teams.map(fromApiWorkspaceTeam) } : {}),
          }));
        } else {
          loadLocalState();
        }
      }

      if (!cancelled) setReady(true);
    }

    void loadState();
    return () => {
      cancelled = true;
    };
  }, [auth.ready, auth.currentWorkspaceId, isRemoteBacked]);

  useEffect(() => {
    if (!ready || isRemoteBacked) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // ignore
    }
  }, [isRemoteBacked, ready, state]);

  const value = useMemo<Ctx>(() => {
    return {
      ...state,
      ready,
      isRemoteBacked,
      syncError,
      // ---- members ----
      addMember: ({ id: requestedId, name, email, role, workspaceRole, jobFunction }) => {
        const id = requestedId ?? `mb-${Date.now()}`;
        const m: Member = {
          id,
          name: name.trim() || "Sem nome",
          email: email.trim(),
          initials: makeInitials(name),
          color: teamColors[state.members.length % teamColors.length],
          role,
          workspaceRole,
          jobFunction: jobFunction ?? null,
        };
        setState((s) => ({ ...s, members: [...s.members, m] }));
        if (isRemoteBacked) {
          void createWorkspaceMemberInApi({
            user_id: id,
            role: workspaceRole ?? "member",
            job_function: jobFunction ?? null,
          })
            .then((remoteMember) => {
              setState((s) => ({
                ...s,
                members: s.members.map((member) =>
                  member.id === id ? fromApiWorkspaceMember(remoteMember) : member,
                ),
              }));
              setSyncError(undefined);
              void auth.refresh();
            })
            .catch((error) => {
              setState((s) => ({ ...s, members: s.members.filter((member) => member.id !== id) }));
              setSyncError(error instanceof Error ? error.message : "Falha ao adicionar membro na API.");
            });
        }
        return m;
      },
      updateMember: (id, patch) => {
        setState((s) => ({
          ...s,
          members: s.members.map((m) =>
            m.id === id ? { ...m, ...patch, initials: patch.name ? makeInitials(patch.name) : m.initials } : m,
          ),
        }));
        if (
          isRemoteBacked &&
          (patch.workspaceRole !== undefined || patch.jobFunction !== undefined)
        ) {
          void updateWorkspaceMemberInApi(id, {
            ...(patch.workspaceRole !== undefined ? { role: patch.workspaceRole } : {}),
            ...(patch.jobFunction !== undefined ? { job_function: patch.jobFunction } : {}),
          })
            .then((remoteMember) => {
              setState((s) => ({
                ...s,
                members: s.members.map((member) =>
                  member.id === id ? fromApiWorkspaceMember(remoteMember) : member,
                ),
              }));
              setSyncError(undefined);
              void auth.refresh();
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao atualizar membro na API.");
            });
        }
      },
      removeMember: (id) => {
        setState((s) => ({
          ...s,
          members: s.members.filter((m) => m.id !== id),
          teams: s.teams.map((t) => ({ ...t, memberIds: t.memberIds.filter((x) => x !== id) })),
        }));
        if (isRemoteBacked) {
          void removeWorkspaceMemberFromApi(id)
            .then(() => {
              setSyncError(undefined);
              void auth.refresh();
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao remover membro na API.");
            });
        }
      },
      // ---- teams ----
      addTeam: ({ name, description, productIds }) => {
        const id = `team-${Date.now()}`;
        const t: Team = {
          id,
          name: name.trim() || "Novo time",
          description,
          color: teamColors[state.teams.length % teamColors.length],
          memberIds: [],
          productIds: productIds ?? [],
        };
        setState((s) => ({ ...s, teams: [...s.teams, t] }));
        if (isRemoteBacked) {
          void createWorkspaceTeamInApi({
            name: t.name,
            description: t.description,
            color: t.color,
            product_ids: t.productIds,
            member_ids: t.memberIds,
          })
            .then((remoteTeam) => {
              setState((s) => ({
                ...s,
                teams: s.teams.map((team) => (team.id === id ? fromApiWorkspaceTeam(remoteTeam) : team)),
              }));
              setSyncError(undefined);
            })
            .catch((error) => {
              setState((s) => ({ ...s, teams: s.teams.filter((team) => team.id !== id) }));
              setSyncError(error instanceof Error ? error.message : "Falha ao criar grupo na API.");
            });
        }
        return t;
      },
      updateTeam: (id, patch) => {
        setState((s) => ({
          ...s,
          teams: s.teams.map((t) => (t.id === id ? { ...t, ...patch } : t)),
        }));
        if (isRemoteBacked) {
          void updateWorkspaceTeamInApi(id, {
            ...(patch.name !== undefined ? { name: patch.name } : {}),
            ...(patch.description !== undefined ? { description: patch.description ?? null } : {}),
            ...(patch.color !== undefined ? { color: patch.color } : {}),
          })
            .then((remoteTeam) => {
              setState((s) => ({
                ...s,
                teams: s.teams.map((team) => (team.id === id ? fromApiWorkspaceTeam(remoteTeam) : team)),
              }));
              setSyncError(undefined);
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao atualizar grupo na API.");
            });
        }
      },
      removeTeam: (id) => {
        setState((s) => ({ ...s, teams: s.teams.filter((t) => t.id !== id) }));
        if (isRemoteBacked) {
          void deleteWorkspaceTeamInApi(id)
            .then(() => setSyncError(undefined))
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao remover grupo na API.");
            });
        }
      },
      toggleTeamProduct: (teamId, productId) => {
        const currentlyLinked = state.teams.find((t) => t.id === teamId)?.productIds.includes(productId) ?? false;
        setState((s) => ({
          ...s,
          teams: s.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  productIds: t.productIds.includes(productId)
                    ? t.productIds.filter((x) => x !== productId)
                    : [...t.productIds, productId],
                }
              : t,
          ),
        }));
        if (isRemoteBacked) {
          const request = currentlyLinked
            ? removeWorkspaceTeamProductInApi(teamId, productId)
            : addWorkspaceTeamProductInApi(teamId, productId);
          void request
            .then((remoteTeam) => {
              setState((s) => ({
                ...s,
                teams: s.teams.map((team) => (team.id === teamId ? fromApiWorkspaceTeam(remoteTeam) : team)),
              }));
              setSyncError(undefined);
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar produto do grupo.");
            });
        }
      },
      toggleTeamMember: (teamId, memberId) => {
        const currentlyLinked = state.teams.find((t) => t.id === teamId)?.memberIds.includes(memberId) ?? false;
        setState((s) => ({
          ...s,
          teams: s.teams.map((t) =>
            t.id === teamId
              ? {
                  ...t,
                  memberIds: t.memberIds.includes(memberId)
                    ? t.memberIds.filter((x) => x !== memberId)
                    : [...t.memberIds, memberId],
                }
              : t,
          ),
        }));
        if (isRemoteBacked) {
          const request = currentlyLinked
            ? removeWorkspaceTeamMemberInApi(teamId, memberId)
            : addWorkspaceTeamMemberInApi(teamId, memberId);
          void request
            .then((remoteTeam) => {
              setState((s) => ({
                ...s,
                teams: s.teams.map((team) => (team.id === teamId ? fromApiWorkspaceTeam(remoteTeam) : team)),
              }));
              setSyncError(undefined);
            })
            .catch((error) => {
              setSyncError(error instanceof Error ? error.message : "Falha ao sincronizar membro do grupo.");
            });
        }
      },
      teamsByProduct: (productId) => state.teams.filter((t) => t.productIds.includes(productId)),
      membersByProduct: (productId) => {
        const teams = state.teams.filter((t) => t.productIds.includes(productId));
        const ids = new Set<string>();
        teams.forEach((t) => t.memberIds.forEach((id) => ids.add(id)));
        return state.members.filter((m) => ids.has(m.id));
      },
      // ---- pillars ----
      addPillar: (productId, name) => {
        const id = `pl-${Date.now()}`;
        const p: Pillar = {
          id,
          productId,
          name: name.trim() || "Novo pilar",
          color: pillarColors[state.pillars.length % pillarColors.length],
        };
        setState((s) => ({ ...s, pillars: [...s.pillars, p] }));
        return p;
      },
      updatePillar: (id, patch) => {
        setState((s) => ({
          ...s,
          pillars: s.pillars.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        }));
      },
      movePillar: (id, productId) => {
        setState((s) => ({
          ...s,
          pillars: s.pillars.map((p) => (p.id === id ? { ...p, productId } : p)),
          okrs: s.okrs.map((o) => (o.pillarId === id ? { ...o, productId } : o)),
        }));
      },
      removePillar: (id) => {
        setState((s) => ({
          ...s,
          pillars: s.pillars.filter((p) => p.id !== id),
          okrs: s.okrs.map((o) => (o.pillarId === id ? { ...o, pillarId: undefined } : o)),
        }));
      },
      pillarsByProduct: (productId) => state.pillars.filter((p) => p.productId === productId),
      // ---- okrs ----
      addOkr: (productId, pillarId) => {
        const id = `okr-${Date.now()}`;
        const o: Okr = {
          id,
          productId,
          pillarId,
          objective: "Novo objetivo",
          quarter: `Q${Math.floor(new Date().getMonth() / 3) + 1} ${new Date().getFullYear()}`,
          keyResults: [],
        };
        setState((s) => ({ ...s, okrs: [...s.okrs, o] }));
        return o;
      },
      updateOkr: (id, patch) => {
        setState((s) => ({
          ...s,
          okrs: s.okrs.map((o) => (o.id === id ? { ...o, ...patch } : o)),
        }));
      },
      moveOkr: (id, productId) => {
        setState((s) => ({
          ...s,
          okrs: s.okrs.map((o) => (o.id === id ? { ...o, productId, pillarId: undefined } : o)),
        }));
      },
      removeOkr: (id) => {
        setState((s) => ({ ...s, okrs: s.okrs.filter((o) => o.id !== id) }));
      },
      okrsByProduct: (productId) => state.okrs.filter((o) => o.productId === productId),
      addKR: (okrId) => {
        const kr: KeyResult = {
          id: `kr-${Date.now()}`,
          text: "Novo Key Result",
          target: 100,
          current: 0,
          unit: "%",
        };
        setState((s) => ({
          ...s,
          okrs: s.okrs.map((o) => (o.id === okrId ? { ...o, keyResults: [...o.keyResults, kr] } : o)),
        }));
      },
      updateKR: (okrId, krId, patch) => {
        setState((s) => ({
          ...s,
          okrs: s.okrs.map((o) =>
            o.id === okrId
              ? { ...o, keyResults: o.keyResults.map((k) => (k.id === krId ? { ...k, ...patch } : k)) }
              : o,
          ),
        }));
      },
      removeKR: (okrId, krId) => {
        setState((s) => ({
          ...s,
          okrs: s.okrs.map((o) =>
            o.id === okrId ? { ...o, keyResults: o.keyResults.filter((k) => k.id !== krId) } : o,
          ),
        }));
      },
    };
  }, [auth, isRemoteBacked, ready, state, syncError]);

  return <WorkspaceCtx.Provider value={value}>{children}</WorkspaceCtx.Provider>;
}

export function useWorkspace() {
  const ctx = useContext(WorkspaceCtx);
  if (!ctx) throw new Error("useWorkspace precisa estar dentro de <WorkspaceProvider>");
  return ctx;
}

// Avoid unused warning for owners (kept for future role mapping)
void owners;

function fromApiWorkspaceMember(member: ApiWorkspaceMember): Member {
  return {
    id: member.user_id,
    name: member.name,
    email: member.email,
    initials: makeInitials(member.name),
    color: teamColors[Math.abs(hashString(member.user_id)) % teamColors.length],
    role: member.role,
    workspaceRole: member.role,
    jobFunction: member.job_function,
    joinedAt: member.joined_at,
    lastAccessedAt: member.last_accessed_at,
  };
}

function fromApiWorkspaceTeam(team: ApiWorkspaceTeam): Team {
  return {
    id: team.id,
    code: team.code,
    name: team.name,
    description: team.description ?? undefined,
    color: team.color ?? teamColors[Math.abs(hashString(team.id)) % teamColors.length],
    memberIds: team.member_ids,
    productIds: team.product_ids,
  };
}

function hashString(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return hash;
}
