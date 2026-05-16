"use client";

import {
  ChevronDown,
  SlidersHorizontal,
  X,
  Search,
  LayoutGrid,
  List,
  Columns3,
  Calendar,
  Workflow,
} from "lucide-react";

export type ViewMode = "grid" | "list" | "board" | "calendar" | "flow";

interface Props {
  view: ViewMode;
  onViewChange: (v: ViewMode) => void;
}

const filters = [
  { label: "Persona", value: null },
  { label: "Severidade", value: "4–5" },
  { label: "Owner", value: null },
  { label: "Status: todos exceto descartadas", value: null },
];

export function DoresToolbar({ view, onViewChange }: Props) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {filters.map((f) => {
          const active = !!f.value;
          return (
            <button
              key={f.label}
              className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-muted)]"
              style={{
                borderColor: active ? "var(--primary)" : "var(--border)",
                color: "var(--fg)",
                backgroundColor: active ? "var(--primary-soft-2)" : "var(--bg-elevated)",
              }}
            >
              <span>{f.label}</span>
              {f.value && (
                <>
                  <span style={{ color: "var(--fg-faint)" }}>·</span>
                  <span className="font-medium" style={{ color: "var(--primary)" }}>
                    {f.value}
                  </span>
                  <X size={12} style={{ color: "var(--primary)" }} />
                </>
              )}
              {!f.value && <ChevronDown size={12} style={{ color: "var(--fg-faint)" }} />}
            </button>
          );
        })}
        <button
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[13px]"
          style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        >
          <SlidersHorizontal size={12} />
          Mais filtros
          <ChevronDown size={12} />
        </button>
        <button
          className="text-[13px] underline-offset-2 hover:underline"
          style={{ color: "var(--fg-subtle)" }}
        >
          Limpar filtros
        </button>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div
          className="flex items-center gap-2 rounded-md border px-2.5 py-1.5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
        >
          <Search size={14} color="var(--fg-faint)" />
          <input
            type="text"
            placeholder="Buscar nesta lista…"
            className="w-48 bg-transparent text-[13px] outline-none"
            style={{ color: "var(--fg)" }}
          />
        </div>

        <div
          className="flex items-center rounded-md border p-0.5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
        >
          <ViewBtn
            icon={LayoutGrid}
            active={view === "grid"}
            onClick={() => onViewChange("grid")}
          />
          <ViewBtn icon={List} active={view === "list"} onClick={() => onViewChange("list")} />
          <ViewBtn
            icon={Columns3}
            active={view === "board"}
            onClick={() => onViewChange("board")}
          />
          <ViewBtn
            icon={Workflow}
            active={view === "flow"}
            onClick={() => onViewChange("flow")}
          />
          <ViewBtn
            icon={Calendar}
            active={view === "calendar"}
            onClick={() => onViewChange("calendar")}
          />
        </div>
      </div>
    </div>
  );
}

function ViewBtn({
  icon: Icon,
  active,
  onClick,
}: {
  icon: typeof LayoutGrid;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="rounded p-1.5 transition-colors"
      style={{
        backgroundColor: active ? "var(--bg-muted-2)" : "transparent",
        color: active ? "var(--fg)" : "var(--fg-faint)",
      }}
    >
      <Icon size={14} />
    </button>
  );
}
