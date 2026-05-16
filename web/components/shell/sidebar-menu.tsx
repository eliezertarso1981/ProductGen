"use client";

import { useEffect, useState } from "react";
import {
  LayoutGrid,
  Columns3,
  Target,
  Lightbulb,
  AlertCircle,
  FlaskConical,
  Beaker,
  Map,
  Users,
  Settings,
  ChevronDown,
} from "lucide-react";
import { NavItem } from "./nav-item";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";

export function SidebarMenu({ collapsed = false }: { collapsed?: boolean }) {
  const { hypotheses, experiments } = useDiscovery();
  const { pains } = useDores();
  return (
    <nav className="flex-1 overflow-y-auto px-3 pb-4">
      <div className="space-y-1">
        <NavItem href="/dashboard" icon={LayoutGrid} label="Home" collapsed={collapsed} />
      </div>

      <Group id="estrategia" title="Estratégia" collapsed={collapsed}>
        <NavItem href="/pilares" icon={Columns3} label="Pilares" collapsed={collapsed} />
        <NavItem href="/okrs" icon={Target} label="OKRs" collapsed={collapsed} />
      </Group>

      <Group id="discovery" title="Discovery" collapsed={collapsed}>
        <NavItem href="/dores" icon={AlertCircle} label="Dores" badge={pains.length} collapsed={collapsed} />
        <NavItem href="/hipoteses" icon={FlaskConical} label="Hipóteses" badge={hypotheses.length} collapsed={collapsed} />
        <NavItem href="/experimentos" icon={Beaker} label="Experimentos" badge={experiments.length} collapsed={collapsed} />
        <NavItem href="/evidencias" icon={Lightbulb} label="Evidências" collapsed={collapsed} />
      </Group>

      <Group id="delivery" title="Delivery" collapsed={collapsed}>
        <NavItem href="/roadmap" icon={Map} label="Roadmap" collapsed={collapsed} />
        <NavItem href="/outcomes" icon={Target} label="Outcomes" collapsed={collapsed} />
      </Group>

      <div className="my-4 h-px" style={{ backgroundColor: "var(--border)" }} />
      <div className="space-y-1">
        <NavItem href="/personas" icon={Users} label="Personas" collapsed={collapsed} />
        <NavItem href="/settings" icon={Settings} label="Settings" collapsed={collapsed} />
      </div>
    </nav>
  );
}

function Group({
  id,
  title,
  children,
  collapsed,
}: {
  id: string;
  title: string;
  children: React.ReactNode;
  collapsed?: boolean;
}) {
  const storageKey = `sidebar-group:${id}`;
  const [open, setOpen] = useState(true);

  useEffect(() => {
    try {
      const v = localStorage.getItem(storageKey);
      if (v !== null) setOpen(v === "1");
    } catch {}
  }, [storageKey]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(storageKey, next ? "1" : "0");
      } catch {}
      return next;
    });
  };

  if (collapsed) {
    return (
      <div className="mt-6">
        <div className="mx-2 mb-2 h-px" style={{ backgroundColor: "var(--border)" }} />
        <div className="space-y-1">{children}</div>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="mb-2 flex w-full items-center justify-between px-3 text-[11px] font-semibold uppercase tracking-wider transition-colors hover:text-[var(--fg-muted)]"
        style={{ color: "var(--fg-faint)" }}
      >
        <span>{title}</span>
        <ChevronDown
          size={14}
          className="transition-transform duration-200"
          style={{ transform: open ? "rotate(0deg)" : "rotate(-90deg)" }}
        />
      </button>
      <div
        className="overflow-hidden transition-all duration-200"
        style={{
          maxHeight: open ? 1000 : 0,
          opacity: open ? 1 : 0,
        }}
      >
        <div className="space-y-1">{children}</div>
      </div>
    </div>
  );
}
