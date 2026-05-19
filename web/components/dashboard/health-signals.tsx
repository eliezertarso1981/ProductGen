import type { ApiDashboardAnalytics } from "@/lib/productgen-api";

interface HealthSignalsProps {
  health: ApiDashboardAnalytics["health"];
}

function percent(value: number | null) {
  return value ?? 0;
}

export function HealthSignals({ health }: HealthSignalsProps) {
  const invalidationRate = percent(health.hypothesis_invalidation_rate);
  const avgPainAge = health.avg_investigating_pain_age_days ?? 0;
  const strategicCoverage = percent(health.roadmap_strategic_coverage_rate);

  return (
    <div
      className="rounded-2xl border p-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
        Sinais de saúde do discovery
      </h2>
      <p className="mt-0.5 text-sm" style={{ color: "var(--fg-subtle)" }}>
        Métricas-chave calculadas a partir do fluxo real de produto
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
            {invalidationRate}%
          </div>
          <div className="mt-4">
            <div
              className="relative h-2 rounded-full overflow-hidden flex"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div style={{ width: "10%", backgroundColor: "var(--danger-border)" }} />
              <div
                style={{
                  width: "50%",
                  backgroundColor: "var(--success-border)",
                }}
              />
              <div style={{ width: "40%", backgroundColor: "var(--danger-border)" }} />
              <div
                className="absolute top-1/2 h-3.5 w-0.5 -translate-y-1/2"
                style={{ left: `${invalidationRate}%`, backgroundColor: "var(--fg)" }}
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
            Faixa saudável de referência: entre 10% e 60% de hipóteses decididas.
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
            {avgPainAge} dias
          </div>
          <div className="mt-4 text-xs font-semibold" style={{ color: "var(--success)" }}>
            Dores atualmente em investigação
          </div>
          <p className="mt-3 text-xs" style={{ color: "var(--warn-fg)" }}>
            Acima de 14 dias pode indicar gargalo de triagem ou decisão.
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
            {strategicCoverage}%
          </div>
          <div className="mt-4">
            <div
              className="h-2 rounded-full overflow-hidden"
              style={{ backgroundColor: "var(--border)" }}
            >
              <div
                className="h-full"
                style={{
                  width: `${strategicCoverage}%`,
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
            Itens de roadmap com vínculo estratégico ou hipótese relacionada.
          </p>
        </div>
      </div>
    </div>
  );
}
