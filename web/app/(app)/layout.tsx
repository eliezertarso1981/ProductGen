import { Sidebar } from "@/components/shell/sidebar";
import { Topbar } from "@/components/shell/topbar";
import { RouteTransitionShell } from "@/components/shell/route-transition-shell";
import { AuthGate } from "@/components/auth/auth-gate";
import { OnboardingGate } from "@/components/auth/onboarding-gate";
import { ProductsProvider } from "@/lib/products-context";
import { DoresProvider } from "@/lib/dores-store";
import { DiscoveryProvider } from "@/lib/discovery-store";
import { StrategyProvider } from "@/lib/strategy-store";
import { PersonasProvider } from "@/lib/personas-store";
import { WorkspaceProvider } from "@/lib/workspace-store";
import { ThemeProvider } from "@/lib/theme-context";
import { AuthProvider } from "@/lib/auth-context";
import { AppToaster } from "@/components/shared/app-toaster";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AuthGate>
          <OnboardingGate>
          <ProductsProvider>
            <WorkspaceProvider>
              <StrategyProvider>
                <DoresProvider>
                  <PersonasProvider>
                    <DiscoveryProvider>
                      <div className="flex min-h-screen" style={{ backgroundColor: "var(--bg-elevated)" }}>
                        <Sidebar />
                        <div className="flex min-w-0 flex-1 flex-col">
                          <Topbar />
                          <RouteTransitionShell>{children}</RouteTransitionShell>
                        </div>
                      </div>
                      <AppToaster />
                    </DiscoveryProvider>
                  </PersonasProvider>
                </DoresProvider>
              </StrategyProvider>
            </WorkspaceProvider>
          </ProductsProvider>
          </OnboardingGate>
        </AuthGate>
      </AuthProvider>
    </ThemeProvider>
  );
}
