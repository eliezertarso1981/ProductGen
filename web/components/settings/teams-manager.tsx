"use client";

import { useState } from "react";
import { Plus, Trash2, Edit3, Check, X, Users } from "lucide-react";
import { useWorkspace } from "@/lib/workspace-store";
import { useProducts } from "@/lib/products-context";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

export function TeamsManager() {
  const { teams, members, addTeam, updateTeam, removeTeam, toggleTeamMember, toggleTeamProduct, addMember, removeMember } = useWorkspace();
  const { activeProducts } = useProducts();
  const [confirmRemoveTeam, setConfirmRemoveTeam] = useState<string | null>(null);
  const [confirmRemoveMember, setConfirmRemoveMember] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [addingMember, setAddingMember] = useState(false);

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
              Times do workspace
            </h3>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              Reutilizáveis em vários produtos.
            </p>
          </div>
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            <Plus size={12} /> Novo time
          </button>
        </div>

        {adding && (
          <NewItemRow
            placeholder="Nome do time"
            onCancel={() => setAdding(false)}
            onSave={(name) => {
              const t = addTeam({ name });
              toast.success(`Time "${t.name}" criado`);
              setAdding(false);
            }}
          />
        )}

        {teams.length === 0 ? (
          <EmptyState icon={Users} title="Sem times" description="Crie um time para começar." />
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
                  <input
                    value={t.name}
                    onChange={(e) => updateTeam(t.id, { name: e.target.value })}
                    className="flex-1 bg-transparent text-sm font-semibold outline-none"
                    style={{ color: "var(--fg)" }}
                  />
                  <button
                    onClick={() => setConfirmRemoveTeam(t.id)}
                    style={{ color: "var(--fg-faint)" }}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                <input
                  value={t.description ?? ""}
                  onChange={(e) => updateTeam(t.id, { description: e.target.value })}
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
                        onClick={() => toggleTeamProduct(t.id, p.id)}
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
                        onClick={() => toggleTeamMember(t.id, m.id)}
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
              Pessoas do workspace
            </h3>
            <p className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              Diretório central — atribuídas a times.
            </p>
          </div>
          <button
            onClick={() => setAddingMember(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            <Plus size={12} /> Convidar
          </button>
        </div>

        {addingMember && (
          <NewMemberRow
            onCancel={() => setAddingMember(false)}
            onSave={(name, email, role) => {
              const m = addMember({ name, email, role });
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
                  {m.email} {m.role && `· ${m.role}`}
                </div>
              </div>
              <span className="text-[10px]" style={{ color: "var(--fg-faint)" }}>
                {teams.filter((t) => t.memberIds.includes(m.id)).length} times
              </span>
              <button
                onClick={() => setConfirmRemoveMember(m.id)}
                style={{ color: "var(--fg-faint)" }}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      <ConfirmDialog
        open={!!confirmRemoveTeam}
        title="Remover time?"
        description="O time será desvinculado de todos os produtos."
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemoveTeam) {
            removeTeam(confirmRemoveTeam);
            toast.success("Time removido");
          }
          setConfirmRemoveTeam(null);
        }}
        onCancel={() => setConfirmRemoveTeam(null)}
      />
      <ConfirmDialog
        open={!!confirmRemoveMember}
        title="Remover pessoa?"
        description="Será removida de todos os times."
        confirmLabel="Remover"
        destructive
        onConfirm={() => {
          if (confirmRemoveMember) {
            removeMember(confirmRemoveMember);
            toast.success("Pessoa removida");
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

function NewMemberRow({ onCancel, onSave }: { onCancel: () => void; onSave: (name: string, email: string, role: string) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  return (
    <div
      className="mb-3 grid grid-cols-1 gap-2 rounded-lg border p-3 sm:grid-cols-3"
      style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-soft)" }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome"
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="Email"
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <input
        value={role}
        onChange={(e) => setRole(e.target.value)}
        placeholder="Cargo"
        className="rounded-md border bg-transparent px-2 py-1 text-sm outline-none"
        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
      />
      <div className="col-span-full flex justify-end gap-2">
        <button onClick={onCancel} className="text-xs" style={{ color: "var(--fg-subtle)" }}>
          Cancelar
        </button>
        <button
          onClick={() => name.trim() && email.trim() && onSave(name, email, role)}
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
