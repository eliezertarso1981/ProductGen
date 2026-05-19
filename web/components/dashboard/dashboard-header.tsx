import { useState } from "react";
import { Calendar, ChevronDown } from "lucide-react";
import {
  DASHBOARD_PERIOD_OPTIONS,
  type ApiDashboardPeriod,
} from "@/lib/productgen-api";

interface DashboardHeaderProps {
  userName?: string;
  workspaceName?: string;
  productName?: string;
  generatedAt?: string;
  selectedPeriod: ApiDashboardPeriod;
  onPeriodChange: (period: ApiDashboardPeriod) => void;
}

function formatDate(value?: string) {
  if (!value) return "dados em tempo real";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function DashboardHeader({
  userName,
  workspaceName,
  productName,
  generatedAt,
  selectedPeriod,
  onPeriodChange,
}: DashboardHeaderProps) {
  const [open, setOpen] = useState(false);
  const selectedOption =
    DASHBOARD_PERIOD_OPTIONS.find((option) => option.value === selectedPeriod) ??
    DASHBOARD_PERIOD_OPTIONS[1];

  function selectPeriod(period: ApiDashboardPeriod) {
    onPeriodChange(period);
    setOpen(false);
  }

  return (
    <div className="flex items-start justify-between">
      <div>
        <h1 className="text-3xl font-semibold" style={{ color: "var(--fg)" }}>
          Dashboard de produto
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--fg-subtle)" }}>
          {workspaceName ?? "Workspace"} · {productName ?? "Todos os produtos"}
          {userName ? ` · ${userName}` : ""} · atualizado em {formatDate(generatedAt)}
        </p>
      </div>
      <div className="relative">
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          className="inline-flex items-center gap-2 rounded-lg border px-3.5 py-2 text-sm font-medium"
          style={{
            borderColor: open ? "var(--primary)" : "var(--border)",
            color: "var(--fg)",
            backgroundColor: "var(--bg-elevated)",
          }}
          onClick={() => setOpen((value) => !value)}
        >
          <Calendar size={16} color="var(--fg-subtle)" />
          {selectedOption.label}
          <ChevronDown size={14} color="var(--fg-subtle)" />
        </button>

        {open && (
          <div
            role="listbox"
            aria-label="Filtrar dashboard por período"
            className="absolute right-0 z-20 mt-2 w-48 overflow-hidden rounded-xl border p-1 shadow-lg"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
          >
            {DASHBOARD_PERIOD_OPTIONS.map((option) => {
              const selected = option.value === selectedPeriod;
              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={selected}
                  className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm"
                  style={{
                    color: selected ? "var(--primary)" : "var(--fg)",
                    backgroundColor: selected ? "var(--primary-soft)" : "transparent",
                  }}
                  onClick={() => selectPeriod(option.value)}
                >
                  {option.label}
                  {selected ? <span aria-hidden="true">✓</span> : null}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
