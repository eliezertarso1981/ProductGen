"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { isProductgenApiConfigured } from "@/lib/productgen-api";
import { useAuth } from "@/lib/auth-context";

export function AuthGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { refresh } = useAuth();
  const [allowed, setAllowed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (!isProductgenApiConfigured()) {
      setAllowed(true);
      return () => {
        cancelled = true;
      };
    }

    refresh()
      .then(() => {
        if (!cancelled) setAllowed(true);
      })
      .catch(() => {
        if (!cancelled) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      });

    return () => {
      cancelled = true;
    };
  }, [pathname, refresh, router]);

  if (!allowed) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg-muted)" }}>
        Verificando sessão...
      </div>
    );
  }

  return <>{children}</>;
}
