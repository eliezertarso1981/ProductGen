import { ChevronRight, Target } from "lucide-react";
import { upcomingMeasurements } from "@/lib/mock-data";

export function UpcomingMeasurements() {
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
        {upcomingMeasurements.map((m) => {
          const tone =
            m.tone === "danger"
              ? { bg: "var(--danger-soft)", color: "var(--danger-fg)" }
              : { bg: "var(--warn-soft)", color: "var(--warn-fg)" };
          return (
            <li
              key={m.id}
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
                  {m.title}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  Medindo: {m.measuring}
                </div>
              </div>
              <span
                className="inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold whitespace-nowrap"
                style={{ backgroundColor: tone.bg, color: tone.color }}
              >
                {m.status}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
