import { TrendingUp, Minus, Clock } from "lucide-react";

interface MetricTileProps {
  label: string;
  value: string;
  delta: string;
  deltaTone: "up" | "flat" | "warn";
  deltaLabel: string;
}

const toneConfig = {
  up: { color: "var(--success)", icon: TrendingUp },
  flat: { color: "var(--fg-subtle)", icon: Minus },
  warn: { color: "var(--warn)", icon: Clock },
};

export function MetricTile({ label, value, delta, deltaTone, deltaLabel }: MetricTileProps) {
  const cfg = toneConfig[deltaTone];
  const Icon = cfg.icon;
  return (
    <div
      className="rounded-2xl border p-5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <div
        className="text-[11px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--fg-faint)" }}
      >
        {label}
      </div>
      <div className="mt-3 text-4xl font-semibold" style={{ color: "var(--fg)" }}>
        {value}
      </div>
      <div className="mt-4 flex items-center gap-1.5 text-xs">
        <Icon size={14} color={cfg.color} />
        {delta && (
          <span className="font-semibold" style={{ color: cfg.color }}>
            {delta}
          </span>
        )}
        <span style={{ color: "var(--fg-subtle)" }}>{deltaLabel}</span>
      </div>
    </div>
  );
}
