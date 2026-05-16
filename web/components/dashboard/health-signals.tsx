import { healthSignals } from "@/lib/mock-data";

export function HealthSignals() {
  const inv = healthSignals.invalidationRate;

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
        Sinais de saúde do discovery
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: "var(--fg-subtle)" }}>
        Métricas-chave da saúde do trabalho de produto
      </p>

      <div className="mt-6 grid gap-8 md:grid-cols-3">
        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--fg-faint)" }}
          >
            Taxa de invalidação de hipóteses
          </div>
          <div className="mt-3 text-4xl font-semibold" style={{ color: "var(--fg)" }}>
            {inv.value}%
          </div>
          <div className="mt-4">
            <div
              className="relative h-2 rounded-full overflow-hidden flex"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div style={{ width: `${inv.healthyMin}%`, backgroundColor: "var(--danger-border)" }} />
              <div
                style={{
                  width: `${inv.healthyMax - inv.healthyMin}%`,
                  backgroundColor: "var(--success-border)",
                }}
              />
              <div style={{ width: `${100 - inv.healthyMax}%`, backgroundColor: "var(--danger-border)" }} />
              <div
                className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2"
                style={{ left: `${inv.value}%`, backgroundColor: "var(--fg)" }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--fg-faint)" }}>
              <span>0%</span>
              <span>10%</span>
              <span>60%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
            {inv.note}
          </p>
        </div>

        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--fg-faint)" }}
          >
            Idade média — dores em investigação
          </div>
          <div className="mt-3 text-4xl font-semibold" style={{ color: "var(--warn)" }}>
            {healthSignals.avgPainAge.value} {healthSignals.avgPainAge.unit}
          </div>
          <div className="mt-4 text-xs font-semibold" style={{ color: "var(--success)" }}>
            ↗ {healthSignals.avgPainAge.delta}
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--warn-fg)" }}>
            {healthSignals.avgPainAge.note}
          </p>
        </div>

        <div>
          <div
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--fg-faint)" }}
          >
            Cobertura estratégica
          </div>
          <div className="mt-3 text-4xl font-semibold" style={{ color: "var(--fg)" }}>
            {healthSignals.strategicCoverage.value}%
          </div>
          <div className="mt-4">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${healthSignals.strategicCoverage.value}%`,
                  backgroundColor: "var(--primary)",
                }}
              />
            </div>
            <div className="mt-1 flex justify-between text-[10px]" style={{ color: "var(--fg-faint)" }}>
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
            {healthSignals.strategicCoverage.note}
          </p>
        </div>
      </div>
    </div>
  );
}
