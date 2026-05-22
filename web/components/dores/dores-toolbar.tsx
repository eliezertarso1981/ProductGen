"use client";

import { Calendar, Columns3, List, Workflow } from "lucide-react";
import { shadow } from "@/lib/design-tokens";
import type { PainStatus } from "@/lib/dores-data";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";

export type ViewMode = "grid" | "list" | "board" | "calendar" | "flow";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
  search: string;
  onSearchChange: (value: string) => void;
  personaFilter: string;
  onPersonaFilterChange: (value: string) => void;
  severityFilter: string;
  onSeverityFilterChange: (value: string) => void;
  ownerFilter: string;
  onOwnerFilterChange: (value: string) => void;
  statusFilter: PainStatus | "active" | "all";
  onStatusFilterChange: (value: PainStatus | "active" | "all") => void;
  onClearFilters: () => void;
}

export function DoresToolbar({
  view,
  onViewChange,
  search,
  onSearchChange,
  personaFilter,
  onPersonaFilterChange,
  severityFilter,
  onSeverityFilterChange,
  ownerFilter,
  onOwnerFilterChange,
  statusFilter,
  onStatusFilterChange,
  onClearFilters,
}: Props) {
  const hasActiveFilters =
    search.trim() !== "" ||
    personaFilter !== "all" ||
    severityFilter !== "all" ||
    ownerFilter !== "all" ||
    statusFilter !== "all";

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div className="min-w-0 flex-1">
        <DiscoveryFilterBar
          selects={[
            {
              label: "Persona",
              value: personaFilter,
              onChange: onPersonaFilterChange,
              options: [
                { value: "all", label: "Todas" },
                { value: "S", label: "S" },
                { value: "E", label: "E" },
                { value: "D", label: "D" },
              ],
            },
            {
              label: "Severidade",
              value: severityFilter,
              onChange: onSeverityFilterChange,
              isActive: (value) => value !== "all",
              options: [
                { value: "all", label: "Todas" },
                { value: "4-5", label: "4–5" },
                { value: "3-5", label: "3–5" },
                { value: "1-2", label: "1–2" },
              ],
            },
            {
              label: "Owner",
              value: ownerFilter,
              onChange: onOwnerFilterChange,
              options: [
                { value: "all", label: "Todos" },
                { value: "CM", label: "CM" },
                { value: "JC", label: "JC" },
                { value: "AS", label: "AS" },
                { value: "RP", label: "RP" },
              ],
            },
            {
              label: "Status",
              value: statusFilter,
              onChange: (value) => onStatusFilterChange(value as PainStatus | "active" | "all"),
              isActive: (value) => value !== "all",
              options: [
                { value: "active", label: "Ativas" },
                { value: "all", label: "Todos" },
                { value: "backlog", label: "Backlog" },
                { value: "em_validacao", label: "Em validação" },
                { value: "validada", label: "Validada" },
                { value: "descartada", label: "Descartada" },
              ],
            },
          ]}
          search={search}
          onSearchChange={onSearchChange}
          hasActiveFilters={hasActiveFilters}
          onClear={onClearFilters}
        />
      </div>
      <div className="flex h-10 items-center rounded-md border border-[var(--border)] bg-[var(--bg-muted)] p-1">
        <ViewBtn label="lista" icon={List} active={view === "list"} onClick={() => onViewChange("list")} />
        <ViewBtn label="board" icon={Columns3} active={view === "board"} onClick={() => onViewChange("board")} />
        <ViewBtn label="fluxo" icon={Workflow} active={view === "flow"} onClick={() => onViewChange("flow")} />
        <ViewBtn
          label="calendário"
          icon={Calendar}
          active={view === "calendar"}
          onClick={() => onViewChange("calendar")}
        />
      </div>
    </div>
  );
}

function ViewBtn({
  label,
  icon: Icon,
  active,
  onClick,
}: {
  label: string;
  icon: typeof List;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={`Visualizar como ${label}`}
      title={`Visualizar como ${label}`}
      className="inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors"
      type="button"
      style={{
        backgroundColor: active ? "var(--bg-elevated)" : "transparent",
        color: active ? "var(--fg)" : "var(--fg-subtle)",
        boxShadow: active ? shadow.sm : shadow.none,
      }}
    >
      <Icon size={16} aria-hidden />
    </button>
  );
}
