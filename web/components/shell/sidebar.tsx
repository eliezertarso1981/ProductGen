"use client";

import { useEffect, useState } from "react";
import { ChevronsLeft, ChevronsRight, Menu, X } from "lucide-react";
import { SidebarMenu } from "./sidebar-menu";
import { WorkspaceSwitcher } from "./workspace-switcher";
import { UserCard } from "./user-card";
import { LogoutButton } from "./logout-button";

const STORAGE_KEY = "sidebar:collapsed";

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Persist collapsed state + auto-collapse on small screens
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) setCollapsed(stored === "1");

    const check = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (window.innerWidth < 1280 && window.innerWidth >= 768 && stored === null) {
        setCollapsed(true);
      }
    };
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const toggle = () => {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  const width = collapsed ? 76 : 280;

  // Mobile: render as overlay
  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="Abrir menu"
          className="fixed left-3 top-3 z-30 inline-flex h-10 w-10 items-center justify-center rounded-lg border shadow-sm md:hidden"
          style={{
            backgroundColor: "var(--bg-elevated)",
            borderColor: "var(--border)",
            color: "var(--fg-muted)",
          }}
        >
          <Menu size={18} />
        </button>
        {mobileOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 animate-fade-in md:hidden"
            onClick={() => setMobileOpen(false)}
          />
        )}
        <aside
          className={`fixed inset-y-0 left-0 z-50 flex w-[280px] flex-col border-r shadow-xl transition-transform duration-300 md:hidden ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)" }}
        >
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
            className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-[var(--bg-muted)]"
            style={{ color: "var(--fg-muted)" }}
          >
            <X size={16} />
          </button>
          <div className="p-3 pt-2">
            <WorkspaceSwitcher collapsed={false} />
          </div>
          <SidebarMenu collapsed={false} />
          <div className="border-t p-3 space-y-1" style={{ borderColor: "var(--border)" }}>
            <LogoutButton collapsed={false} />
            <UserCard collapsed={false} />
          </div>
        </aside>
      </>
    );
  }

  return (
    <aside
      className="sticky top-0 hidden h-screen shrink-0 flex-col self-start border-r transition-[width] duration-200 md:flex"
      style={{ backgroundColor: "var(--bg-subtle)", borderColor: "var(--border)", width }}
    >
      <button
        onClick={toggle}
        aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        className="absolute -right-3 top-6 z-10 flex h-6 w-6 items-center justify-center rounded-full border shadow-sm transition-all hover:scale-110 hover:bg-[var(--bg-muted)]"
        style={{
          backgroundColor: "var(--bg-elevated)",
          borderColor: "var(--border)",
          color: "var(--fg-subtle)",
        }}
      >
        {collapsed ? <ChevronsRight size={14} /> : <ChevronsLeft size={14} />}
      </button>

      <div className="p-3">
        <WorkspaceSwitcher collapsed={collapsed} />
      </div>

      <SidebarMenu collapsed={collapsed} />

      <div className="border-t p-3 space-y-1" style={{ borderColor: "var(--border)" }}>
        <LogoutButton collapsed={collapsed} />
        <UserCard collapsed={collapsed} />
      </div>
    </aside>
  );
}
