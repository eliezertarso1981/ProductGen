"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3, Check, X, Users } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { useProducts } from "@/lib/products-context";
import { usePermissions } from "@/lib/auth-context";
import type { WorkspaceJobFunction, WorkspaceRole } from "@/lib/productgen-api";
import {
  WORKSPACE_JOB_FUNCTIONS,
  WORKSPACE_JOB_FUNCTION_LABELS,
  WORKSPACE_ROLE_LABELS,
} from "@/lib/workspace-member-meta";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

const WORKSPACE_ROLES: WorkspaceRole[] = ["owner", "admin", "member", "viewer", "guest"];

export function TeamsManager() {
  const {
    teams,
    members,
    addTeam,
    updateTeam,
    removeTeam,
    toggleTeamMember,
    toggleTeamProduct,
    addMember,
    updateMember,
    removeMember,
    isRemoteBacked,
    syncError,
  } = useWorkspace();
  const { activeProducts } = useProducts();
  const { can } = usePermissions();
  const [confirmRemoveTeam, setConfirmRemoveTeam] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingMember, setAddingMember] = useState(false);
  const canManageMembers = can("members.invite") || can("members.update_role") || can("members.remove");
  const canManageGroups = can("members.update_role");

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* Teams */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
              Squads do workspace
            </h3>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              Reutilizáveis em vários produtos. {isRemoteBacked ? "Sincronizados com a API." : ""}
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            disabled={!canManageGroups}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "white", opacity: canManageGroups ? 1 : 0.5 }}
          >
            <Plus size={12} /> Novo squad
          </button>
        </div>

        {adding && (
          <NewItemRow
            placeholder="Nome do squad"
            onCancel={() => setAdding(false)}
            onSave={(name) => {
              const t = addTeam({ name });
              toast.success(`Squad "${t.name}" criado`);
              setAdding(false);
            }}
          />
        )}

        {teams.length === 0 ? (
          <EmptyState icon={Users} title="Sem squads" description="Crie um squad para começar." />
        ) : (
          <div className="space-y-3">
            {teams.map((t) => (
              <div
                key={t.id}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
              >
                <div className="flex items-center gap-2">
                  <div className="h-7 w-1 rounded-full" style={{ backgroundColor: t.color }} />
                  {t.code && (
                    <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--bg-muted)", color: "var(--fg-subtle)" }}>
                      {t.code}
                    </span>
                  )}
                  <input
                    value={t.name}
                    onChange={(e) => canManageGroups && updateTeam(t.id, { name: e.target.value })}
                    readOnly={!canManageGroups}
                    className="flex-1 bg-transparent text-sm font-semibold outline-none"
                    style={{ color: "var(--fg)" }}
                  />
                  <button
                    onClick={() => canManageGroups && setConfirmRemoveTeam(t.id)}
                    disabled={!canManageGroups}
                    style={{ color: "var(--fg-faint)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={t.description ?? ""}
                  onChange={(e) => canManageGroups && updateTeam(t.id, { description: e.target.value })}
                  readOnly={!canManageGroups}
                  placeholder="Descrição…"
                  className="mt-1 w-full bg-transparent text-xs outline-none"
                  style={{ color: "var(--fg-subtle)" }}
                />
                <div className="mt-2 flex flex-wrap gap-1">
                  {activeProducts.map((p) => {
                    const linked = t.productIds.includes(p.id);
                    return (
                      <button
                        key={p.id}
                        onClick={() => canManageGroups && toggleTeamProduct(t.id, p.id)}
                        disabled={!canManageGroups}
                        className="rounded-full px-2 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: linked ? p.color : "var(--bg-muted)",
                          color: linked ? "white" : "var(--fg-subtle)",
                        }}
                      >
                        {p.name}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-[10px] uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
                    Membros
                  </span>
                  <span className="text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                    · {t.memberIds.length}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap gap-1">
                  {members.map((m) => {
                    const inTeam = t.memberIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        onClick={() => canManageGroups && toggleTeamMember(t.id, m.id)}
                        disabled={!canManageGroups}
                        title={m.name}
                        className="flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px]"
                        style={{
                          backgroundColor: inTeam ? "var(--primary-soft)" : "var(--bg-muted)",
                          color: inTeam ? "var(--primary)" : "var(--fg-subtle)",
                        }}
                      >
                        <span
                          className="flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-semibold text-white"
                          style={{ backgroundColor: m.color }}
                        >
                          {m.initials}
                        </span>
                        {m.name.split(" ")[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Members */}
      <div
        className="rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
      >
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold" style={{ color: "var(--fg)" }}>
              Membros
            </h3>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              Diretório central — função de produto e permissão (RBAC), vinculados a squads.
            </p>
            {syncError ? (
              <p className="mt-1 text-xs" style={{ color: "var(--danger-strong)" }}>
                {syncError}
              </p>
            ) : null}
          </div>
          <button
            onClick={() => setAddingMember(true)}
            disabled={!can("members.invite")}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "white", opacity: can("members.invite") ? 1 : 0.5 }}
          >
            <Plus size={12} /> {isRemoteBacked ? "Adicionar" : "Convidar"}
          </button>
        </div>

        {addingMember && (
          <NewMemberRow
            onCancel={() => setAddingMember(false)}
            isRemoteBacked={isRemoteBacked}
            onSave={(name, email, role, workspaceRole, jobFunction, userId) => {
              const m = addMember({
                id: userId,
                name,
                email,
                role: workspaceRole,
                workspaceRole,
                jobFunction,
              });
              toast.success(`${m.name} adicionado`);
              setAddingMember(false);
            }}
          />
        )}

        <div className="space-y-2">
          {members.map((m) => (
            <div
              key={m.id}
              className="flex items-center gap-3 rounded-lg border p-2.5"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
            >
              <div
                className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold text-white"
                style={{ backgroundColor: m.color }}
              >
                {m.initials}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  {m.name}
                </div>
                <div className="truncate text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                  {m.email}
                  {m.jobFunction ? ` · ${m.jobFunction}` : ""}
                </div>
              </div>
              <select
                value={m.jobFunction ?? ""}
                onChange={(e) =>
                  updateMember(m.id, {
                    jobFunction: (e.target.value || null) as WorkspaceJobFunction | null,
                  })
                }
                disabled={!can("members.update_role")}
                title="Função no workspace"
                className="max-w-[5.5rem] rounded-md border bg-transparent px-2 py-1 text-[11px] outline-none"
                style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
              >
                <option value="">Função…</option>
                {WORKSPACE_JOB_FUNCTIONS.map((fn) => (
                  <option key={fn} value={fn}>
                    {fn}
                  </option>
                ))}
              </select>
              <select
                value={m.workspaceRole ?? "member"}
                onChange={(e) =>
                  updateMember(m.id, {
                    workspaceRole: e.target.value as WorkspaceRole,
                    role: e.target.value,
                  })
                }
                disabled={!can("members.update_role")}
                title="Permissão (RBAC)"
                className="max-w-[6.5rem] rounded-md border bg-transparent px-2 py-1 text-[11px] outline-none"
                style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
              >
                {WORKSPACE_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {WORKSPACE_ROLE_LABELS[role]}
                  </option>
                ))}
              </select>
              <span className="text-[10px]" style={{ color: "var(--fg-faint)" }}>
                {teams.filter((t) => t.memberIds.includes(m.id)).length} squads
              </span>
              <button
                onClick={() => can("members.remove") && setConfirmRemoveMember(m.id)}
                disabled={!can("members.remove")}
                style={{ color: "var(--fg-faint)", opacity: can("members.remove") ? 1 : 0.4 }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRemoveTeam}
        title="Remover squad?"
        description="O squad será desvinculado de todos os produtos."
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemoveTeam) {
            removeTeam(confirmRemoveTeam);
            toast.success("Squad removido");
          }
          setConfirmRemoveTeam(null);
        }}
        onCancel={() => setConfirmRemoveTeam(null)}
      />
      <ConfirmDialog
        open={!!confirmRemoveMember}
        title="Remover membro?"
        description="Será removido do workspace e de todos os squads locais."
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemoveMember) {
            removeMember(confirmRemoveMember);
            toast.success("Membro removido");
          }
          setConfirmRemoveMember(null);
        }}
        onCancel={() => setConfirmRemoveMember(null)}
      />
    </div>
  );
}

function NewItemRow({ placeholder, onCancel, onSave }: { placeholder: string; onCancel: () => void; onSave: (name: string) => void }) {
  const [v, setV] = useState("");
  return (
    <div
      className="mb-3 flex items-center gap-2 rounded-lg border p-2"
      style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-soft)" }}
    >
      <input
        autoFocus
        value={v}
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && v.trim()) onSave(v);
          if (e.key === "Escape") onCancel();
        }}
        placeholder={placeholder}
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "var(--fg)" }}
      />
      <button onClick={() => v.trim() && onSave(v)} className="text-[var(--primary)]">
        <Check size={14} />
      </button>
      <button onClick={onCancel} style={{ color: "var(--fg-faint)" }}>
        <X size={14} />
      </button>
    </div>
  );
}

function NewMemberRow({
  isRemoteBacked,
  onCancel,
  onSave,
}: {
  isRemoteBacked: boolean;
  onCancel: () => void;
  onSave: (
    name: string,
    email: string,
    role: string,
    workspaceRole: WorkspaceRole,
    jobFunction: WorkspaceJobFunction | null,
    userId?: string,
  ) => void;
}) {
  const [userId, setUserId] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [workspaceRole, setWorkspaceRole] = useState<WorkspaceRole>("member");
  const [jobFunction, setJobFunction] = useState<WorkspaceJobFunction | "">("PM");
  return (
    <div
      className="mb-3 grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-3"
      style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-soft)" }}
    >
      {isRemoteBacked && (
        <input
          autoFocus
          value={userId}
          onChange={(e) => setUserId(e.target.value)}
          placeholder="ID do usuário existente"
          className="col-span-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        />
      )}
      <input
        autoFocus={!isRemoteBacked}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome"
        disabled={isRemoteBacked}
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        disabled={isRemoteBacked}
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <select
        value={jobFunction}
        onChange={(e) => setJobFunction(e.target.value as WorkspaceJobFunction | "")}
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      >
        <option value="">Função…</option>
        {WORKSPACE_JOB_FUNCTIONS.map((fn) => (
          <option key={fn} value={fn}>
            {WORKSPACE_JOB_FUNCTION_LABELS[fn]}
          </option>
        ))}
      </select>
      <select
        value={workspaceRole}
        onChange={(e) => setWorkspaceRole(e.target.value as WorkspaceRole)}
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      >
        {WORKSPACE_ROLES.map((role) => (
          <option key={role} value={role}>
            {WORKSPACE_ROLE_LABELS[role]}
          </option>
        ))}
      </select>
      {isRemoteBacked && (
        <p className="col-span-full text-[11px]" style={{ color: "var(--fg-subtle)" }}>
          Convite por email ainda depende do fluxo de invites. Por enquanto, adicione um usuário já existente pelo ID.
        </p>
      )}
      <div className="col-span-full flex justify-end gap-2">
        <button onClick={onCancel} className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          Cancelar
        </button>
        <button
          onClick={() => {
            if (isRemoteBacked && userId.trim()) {
              onSave(
                userId,
                `${userId}@pending.local`,
                workspaceRole,
                workspaceRole,
                jobFunction || null,
                userId.trim(),
              );
              return;
            }
            if (name.trim() && email.trim()) {
              onSave(name, email, workspaceRole, workspaceRole, jobFunction || null);
            }
          }}
          className="rounded-md px-2 py-1 text-xs font-semibold"
          style={{ backgroundColor: "var(--primary)", color: "white" }}
        >
          Adicionar
        </button>
      </div>
    </div>
  );
}

void Edit3;
