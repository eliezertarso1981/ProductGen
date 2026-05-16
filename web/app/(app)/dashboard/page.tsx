import { DashboardHeader } from "@/components/dashboard/dashboard-header";
import { MetricTile } from "@/components/dashboard/metric-tile";
import { FunnelView } from "@/components/dashboard/funnel-view";
import { RecentActivity } from "@/components/dashboard/recent-activity";
import { UpcomingMeasurements } from "@/components/dashboard/upcoming-measurements";
import { HealthSignals } from "@/components/dashboard/health-signals";
import { kpis } from "@/lib/mock-data";

export default function DashboardPage() {
  return (
    <div className="space-y-6 p-8">
      <DashboardHeader />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((k) => (
          <MetricTile key={k.label} {...k} />
        ))}
      </div>

      <FunnelView />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <RecentActivity />
        <UpcomingMeasurements />
      </div>

      <HealthSignals />
    </div>
  );
}
