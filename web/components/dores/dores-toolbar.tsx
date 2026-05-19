"use client";

import {
  ChevronDown,
  X,
  Search,
  List,
  Columns3,
  Calendar,
  Workflow,
} from "lucide-react";
import { shadow } from "@/lib/design-tokens";
import type { PainStatus } from "@/lib/dores-data";

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
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[#dde0e8] bg-[#ffffff] py-3">
      <div className="flex flex-wrap items-center gap-2">
        <FilterSelect
          label="Persona"
          value={personaFilter}
          onChange={onPersonaFilterChange}
          onClear={() => onPersonaFilterChange("all")}
          options={[
            { value: "all", label: "Todas" },
            { value: "S", label: "S" },
            { value: "E", label: "E" },
            { value: "D", label: "D" },
          ]}
        />
        <FilterSelect
          label="Severidade"
          value={severityFilter}
          onChange={onSeverityFilterChange}
          onClear={() => onSeverityFilterChange("all")}
          options={[
            { value: "all", label: "Todas" },
            { value: "4-5", label: "4–5" },
            { value: "3-5", label: "3–5" },
            { value: "1-2", label: "1–2" },
          ]}
        />
        <FilterSelect
          label="Owner"
          value={ownerFilter}
          onChange={onOwnerFilterChange}
          onClear={() => onOwnerFilterChange("all")}
          options={[
            { value: "all", label: "Todos" },
            { value: "CM", label: "CM" },
            { value: "JC", label: "JC" },
            { value: "AS", label: "AS" },
            { value: "RP", label: "RP" },
          ]}
        />
        <FilterSelect
          label="Status"
          value={statusFilter}
          onChange={(value) => onStatusFilterChange(value as PainStatus | "active" | "all")}
          onClear={() => onStatusFilterChange("all")}
          options={[
            { value: "active", label: "Ativas" },
            { value: "all", label: "Todos" },
            { value: "backlog", label: "Backlog" },
            { value: "em_validacao", label: "Em validação" },
            { value: "validada", label: "Validada" },
            { value: "descartada", label: "Descartada" },
          ]}
        />
        <button
          onClick={onClearFilters}
          className="text-[13px] text-[#6b7287] underline-offset-2 hover:underline"
          type="button"
        >
          Limpar filtros
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <label className="flex h-10 w-60 items-center gap-2 rounded-md border border-[#dde0e8] bg-[#ffffff] px-3 focus-within:border-[#13c8b5] focus-within:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]">
          <Search size={16} className="text-[#9aa0b1]" aria-hidden />
          <span className="sr-only">Buscar nesta lista</span>
          <input
            type="text"
            placeholder="Buscar nesta lista..."
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            className="min-w-0 flex-1 bg-transparent text-[14px] text-[#2b364a] outline-none placeholder:text-[#9aa0b1]"
          />
        </label>

        <div className="flex h-10 items-center rounded-md border border-[#dde0e8] bg-[#eef0f4] p-1">
          <ViewBtn label="lista" icon={List} active={view === "list"} onClick={() => onViewChange("list")} />
          <ViewBtn
            label="board"
            icon={Columns3}
            active={view === "board"}
            onClick={() => onViewChange("board")}
          />
          <ViewBtn
            label="fluxo"
            icon={Workflow}
            active={view === "flow"}
            onClick={() => onViewChange("flow")}
          />
          <ViewBtn
            label="calendário"
            icon={Calendar}
            active={view === "calendar"}
            onClick={() => onViewChange("calendar")}
          />
        </div>
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  onClear,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== "all" && value !== "active";
  const selected = options.find((option) => option.value === value)?.label;

  return (
    <label
      className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] transition-colors"
      style={{
        borderColor: active ? "rgba(19, 200, 181, 0.30)" : "var(--border)",
        color: active ? "var(--primary)" : "var(--fg-muted)",
        backgroundColor: active ? "var(--primary-soft-2)" : "var(--bg-elevated)",
      }}
    >
      <span>{label}</span>
      <span className="text-[#c4c9d4]">·</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[150px] bg-transparent font-medium outline-none"
        aria-label={`Filtrar por ${label}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {active ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onClear();
          }}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded text-[#13c8b5] hover:bg-[rgba(19,200,181,0.10)]"
          aria-label={`Limpar filtro ${label}`}
          title={`Limpar filtro ${label}`}
        >
          <X size={12} aria-hidden />
        </button>
      ) : (
        <ChevronDown size={12} className="text-[#9aa0b1]" aria-hidden />
      )}
    </label>
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
