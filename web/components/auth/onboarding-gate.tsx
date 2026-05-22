"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isProductgenApiConfigured } from "@/lib/productgen-api";
import { getOnboardingStatusFromApi } from "@/lib/onboarding-api";
import { useAuth } from "@/lib/auth-context";

const SKIP_PREFIXES = ["/login", "/signup", "/forgot-password", "/check-email", "/onboarding"];

function isSkippedPath(pathname: string) {
  return SKIP_PREFIXES.some((prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`));
}

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refresh } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isProductgenApiConfigured() || isSkippedPath(pathname)) {
      setAllowed(true);
      return () => {
        cancelled = true;
      };
    }

    (async () => {
      try {
        await refresh();
        const status = await getOnboardingStatusFromApi();
        if (cancelled) return;

        if (!status?.has_workspace) {
          router.replace("/signup/workspace");
          return;
        }
        if (!status.onboarded) {
          router.replace("/onboarding");
          return;
        }
        setAllowed(true);
      } catch {
        if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [pathname, refresh, router]);

  if (!allowed) {
    return <GateLoading />;
  }

  return <>{children}</>;
}

function GateLoading() {
  return (
    <div
      className="flex min-h-screen items-center justify-center"
      style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg-muted)" }}
    >
      Verificando conta...
    </div>
  );
}
