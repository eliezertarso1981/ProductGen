"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, BarChart3 } from "lucide-react";
import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { FunnelView } from "@/components/dashboard/funnel-view";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingMeasurements } from "@/components/dashboard/upcoming-measurements";
import { HealthSignals } from "@/components/dashboard/health-signals";
import { EmptyState } from "@/components/shared/empty-state";
import { useAuth } from "@/lib/auth-context";
import { useProducts } from "@/lib/products-context";
import {
  type ApiDashboardPeriod,
  type ApiDashboardAnalytics,
  getDashboardAnalyticsFromApi,
  isProductgenApiConfigured,
} from "@/lib/productgen-api";

export default function DashboardPage() {
  const { user, currentWorkspace } = useAuth();
  const { currentProduct, ready: productsReady, isRemoteBacked } = useProducts();
  const [selectedPeriod, setSelectedPeriod] = useState<ApiDashboardPeriod>("week");
  const [analytics, setAnalytics] = useState<ApiDashboardAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      if (!productsReady) return;
      if (!isProductgenApiConfigured() || !isRemoteBacked) {
        setLoading(false);
        setError("Dashboard Analytics exige a API real do ProductDiscovery configurada.");
        return;
      }

      try {
        setLoading(true);
        const data = await getDashboardAnalyticsFromApi(currentProduct.id, selectedPeriod);
        if (cancelled) return;
        setAnalytics(data);
        setError(null);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Falha ao carregar analytics do dashboard.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [currentProduct.id, isRemoteBacked, productsReady, selectedPeriod]);

  const kpis = useMemo(() => {
    if (!analytics) return [];
    const measuringOutcomes = countFor(analytics.outcomes_by_status, "measuring");
    const validatedHypotheses = countFor(analytics.hypotheses_by_status, "validated");
    const investigatingPains = countFor(analytics.pains_by_status, "investigating");

    return [
      {
        label: "EVIDÊNCIAS",
        value: String(analytics.totals.evidences),
        delta: "",
        deltaTone: "flat" as const,
        deltaLabel: `${countFor(analytics.evidences_by_status, "triaged")} triadas`,
      },
      {
        label: "DORES EM INVESTIGAÇÃO",
        value: String(investigatingPains),
        delta: "",
        deltaTone: investigatingPains > 0 ? ("warn" as const) : ("flat" as const),
        deltaLabel: `${analytics.totals.pains} dores totais`,
      },
      {
        label: "HIPÓTESES VALIDADAS",
        value: String(validatedHypotheses),
        delta: "",
        deltaTone: validatedHypotheses > 0 ? ("up" as const) : ("flat" as const),
        deltaLabel: `${analytics.totals.hypotheses} hipóteses totais`,
      },
      {
        label: "OUTCOMES EM MEDIÇÃO",
        value: String(measuringOutcomes),
        delta: "",
        deltaTone: measuringOutcomes > 0 ? ("warn" as const) : ("flat" as const),
        deltaLabel: `${analytics.totals.outcomes} outcomes totais`,
      },
    ];
  }, [analytics]);

  const bottleneck = useMemo(() => {
    const stages = analytics?.discovery_funnel ?? [];
    const low = stages.find((stage) => stage.conversion_rate != null && stage.conversion_rate < 50);
    if (!low) return undefined;
    return { stage: low.label, rate: low.conversion_rate ?? 0 };
  }, [analytics]);

  if (loading) {
    return (
      <div className="space-y-6 p-8">
        <DashboardHeader
          userName={user?.name}
          workspaceName={currentWorkspace?.name}
          productName={currentProduct.name}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <EmptyState
          icon={BarChart3}
          title="Carregando analytics"
          description="Buscando KPIs, funil e sinais de saúde na API do ProductDiscovery."
        />
      </div>
    );
  }

  if (error || !analytics) {
    return (
      <div className="space-y-6 p-8">
        <DashboardHeader
          userName={user?.name}
          workspaceName={currentWorkspace?.name}
          productName={currentProduct.name}
          selectedPeriod={selectedPeriod}
          onPeriodChange={setSelectedPeriod}
        />
        <EmptyState
          icon={AlertCircle}
          title="Não foi possível carregar o dashboard"
          description={error ?? "A API não retornou dados de analytics."}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-8">
      <DashboardHeader
        userName={user?.name}
        workspaceName={currentWorkspace?.name}
        productName={currentProduct.name}
        generatedAt={analytics.generated_at}
        selectedPeriod={selectedPeriod}
        onPeriodChange={setSelectedPeriod}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <MetricTile key={k.label} {...k} />
        ))}
      </div>

      <FunnelView funnel={analytics.discovery_funnel} bottleneck={bottleneck} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity activity={analytics.recent_activity} />
        <UpcomingMeasurements measurements={analytics.upcoming_measurements} />
      </div>

      <HealthSignals health={analytics.health} />
    </div>
  );
}

function countFor(rows: Array<{ status: string; count: number }>, status: string) {
  return rows.find((row) => row.status === status)?.count ?? 0;
}
