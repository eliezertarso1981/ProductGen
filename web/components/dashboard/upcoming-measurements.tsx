import { ChevronRight, Target } from "lucide-react";
import type { ApiDashboardAnalytics } from "@/lib/productgen-api";

type Measurement = ApiDashboardAnalytics["upcoming_measurements"][number];

function formatDue(value: string) {
  const due = new Date(value);
  const diffDays = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (diffDays < 0) return `vencido há ${Math.abs(diffDays)} dia${Math.abs(diffDays) === 1 ? "" : "s"}`;
  if (diffDays === 0) return "vence hoje";
  return `em ${diffDays} dia${diffDays === 1 ? "" : "s"}`;
}

export function UpcomingMeasurements({ measurements }: { measurements: Measurement[] }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
          Próximas medições
        </h2>
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Ver outcomes <ChevronRight size={14} />
        </button>
      </div>

      <ul className="mt-4 space-y-1">
        {measurements.map((m) => {
          const isOverdue = new Date(m.due_at).getTime() < Date.now();
          const tone = isOverdue
            ? { bg: "var(--danger-soft)", color: "var(--danger-fg)" }
            : { bg: "var(--warn-soft)", color: "var(--warn-fg)" };
          return (
            <li
              key={m.outcome_code}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--bg-muted)]"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                style={{ backgroundColor: "var(--primary-soft)" }}
              >
                <Target size={16} color="var(--primary)" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                  {m.roadmap_code} · {m.roadmap_title}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  Medindo: {m.hypothesized_impact}
                </div>
              </div>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {formatDue(m.due_at)}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
