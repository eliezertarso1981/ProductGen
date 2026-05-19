"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const MAX_VISIBLE_MS = 6000;

export function RouteTransitionShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const routeKey = `${pathname}?${searchParams.toString()}`;
  const [pending, setPending] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const previousRouteKeyRef = useRef(routeKey);

  useEffect(() => {
    function clearTimer() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    }

    function start() {
      clearTimer();
      setPending(true);
      timeoutRef.current = setTimeout(() => setPending(false), MAX_VISIBLE_MS);
    }

    function onClick(event: MouseEvent) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
        return;
      }

      const target = event.target instanceof Element ? event.target.closest("a[href]") : null;
      if (!(target instanceof HTMLAnchorElement)) return;
      if (target.target && target.target !== "_self") return;
      if (target.hasAttribute("download")) return;

      const next = new URL(target.href, window.location.href);
      if (next.origin !== window.location.origin) return;

      const current = `${window.location.pathname}${window.location.search}`;
      const destination = `${next.pathname}${next.search}`;
      if (current !== destination) start();
    }

    function onPopState() {
      start();
    }

    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", onPopState);

    return () => {
      clearTimer();
      document.removeEventListener("click", onClick, true);
      window.removeEventListener("popstate", onPopState);
    };
  }, []);

  useEffect(() => {
    if (previousRouteKeyRef.current === routeKey) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    previousRouteKeyRef.current = routeKey;
    setPending(false);
  }, [routeKey]);

  return (
    <>
      <RouteProgressBar active={pending} />
      <RoutePendingCard active={pending} />
      <main
        className={`flex-1 overflow-x-hidden route-page-transition${pending ? " route-page-pending" : ""}`}
      >
        {children}
      </main>
    </>
  );
}

function RouteProgressBar({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed left-0 right-0 top-0 z-[100] h-0.5 overflow-hidden"
    >
      <div className="route-progress-bar h-full" />
    </div>
  );
}

function RoutePendingCard({ active }: { active: boolean }) {
  if (!active) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed right-4 top-4 z-[100] inline-flex items-center gap-2 rounded-md border border-[#dde0e8] bg-white px-3 py-2 text-[12px] font-medium text-[#4e5567]"
    >
      <span className="route-pending-dot" aria-hidden />
      Abrindo item...
    </div>
  );
}
