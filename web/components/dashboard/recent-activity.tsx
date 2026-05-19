import { ChevronRight } from "lucide-react";
import { entityConfig } from "@/lib/entity-config";
import { Avatar } from "@/components/shared/avatar";
import type { ApiDashboardAnalytics } from "@/lib/productgen-api";

type Activity = ApiDashboardAnalytics["recent_activity"][number];

const entityTypeMap: Record<string, keyof typeof entityConfig> = {
  pains: "pain",
  hypotheses: "hypothesis",
  experiments: "experiment",
  evidences: "evidence",
  roadmap_items: "roadmap",
};

function initials(name?: string | null) {
  if (!name) return "PG";
  return name
    .split(/\s+/)
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function formatWhen(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function describeActivity(item: Activity) {
  const title = item.title ? `"${item.title}"` : "um item";
  if (item.event_type === "status_changed" && item.to_status) {
    return `moveu ${title} para ${item.to_status}`;
  }
  if (item.event_type === "created") return `criou ${title}`;
  if (item.event_type === "updated") return `atualizou ${title}`;
  return `${item.event_type.replace(/_/g, " ")} em ${title}`;
}

export function RecentActivity({ activity }: { activity: Activity[] }) {
  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
          Atividade recente
        </h2>
        <button
          className="inline-flex items-center gap-1 text-sm font-semibold"
          style={{ color: "var(--primary)" }}
        >
          Ver tudo <ChevronRight size={14} />
        </button>
      </div>

      <ul className="mt-4 space-y-1">
        {activity.map((item, index) => {
          const mappedType = entityTypeMap[item.entity_type] ?? "roadmap";
          const cfg = entityConfig[mappedType];
          const Icon = cfg.icon;
          const actor = item.actor_name ?? "ProductGen";
          return (
            <li
              key={`${item.entity_type}-${item.code ?? index}-${item.occurred_at}`}
              className="flex items-start gap-3 rounded-xl p-3 transition-colors hover:bg-[var(--bg-muted)]"
            >
              <div
                className="flex h-9 w-9 flex-none items-center justify-center rounded-lg"
                style={{ backgroundColor: cfg.bg }}
              >
                <Icon size={16} color={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm" style={{ color: "var(--fg)" }}>
                  <span className="font-semibold">{actor}</span> {describeActivity(item)}
                </div>
                <div className="mt-0.5 text-xs" style={{ color: "var(--fg-subtle)" }}>
                  {item.code ?? item.entity_type} · {formatWhen(item.occurred_at)}
                </div>
              </div>
              <Avatar initials={initials(actor)} color={cfg.color} size={28} />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
