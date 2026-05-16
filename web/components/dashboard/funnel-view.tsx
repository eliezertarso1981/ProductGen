import { Fragment } from "react";
import { ChevronRight, AlertTriangle } from "lucide-react";
import { funnel, bottleneck } from "@/lib/mock-data";

export function FunnelView() {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
            Funil de Discovery
          </h2>
          <p className="mt-0.5 text-sm" style={{ color: "var(--fg-subtle)" }}>
            Conversão entre estágios — últimos 90 dias
          </p>
        </div>
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Ver detalhes <ChevronRight size={14} />
        </button>
      </div>

      <div className="mt-6 flex w-full items-stretch gap-1">
        {funnel.map((stage, i) => (
          <Fragment key={stage.label}>
            <div
              className="flex min-w-0 flex-1 flex-col rounded-xl p-3"
              style={{ backgroundColor: "var(--primary-soft)" }}
            >
              <div
                className="truncate text-[11px] leading-tight"
                style={{ color: "#0f766e" }}
                title={stage.label}
              >
                {stage.label}
              </div>
              <div
                className="mt-2 text-xl font-semibold sm:text-2xl"
                style={{ color: "var(--fg)" }}
              >
                {stage.value}
              </div>
              {stage.rate && (
                <div className="mt-1 text-xs font-semibold" style={{ color: "var(--primary)" }}>
                  {stage.rate}
                </div>
              )}
            </div>
            {i < funnel.length - 1 && (
              <div key={`sep-${stage.label}`} className="flex shrink-0 items-center">
                <ChevronRight size={16} color="var(--fg-faint)" />
              </div>
            )}
          </Fragment>
        ))}
      </div>

      <div
        className="mt-5 flex items-center justify-between rounded-xl p-4"
        style={{ backgroundColor: "var(--warn-soft)", border: "1px solid var(--warn-border)" }}
      >
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} color="var(--warn)" />
          <div className="text-sm" style={{ color: "var(--fg)" }}>
            <span className="font-semibold" style={{ color: "var(--warn-fg)" }}>
              Gargalo detectado
            </span>{" "}
            em &quot;{bottleneck.stage}&quot; ({bottleneck.rate} — esperado {bottleneck.expected})
          </div>
        </div>
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--warn-fg)" }}
        >
          Investigar <ChevronRight size={14} />
        </button>
      </div>
    </div>
  );
}
