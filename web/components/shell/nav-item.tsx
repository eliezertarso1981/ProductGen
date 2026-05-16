"use client";

import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";

function PendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <Loader2
      size={14}
      className="animate-spin"
      style={{ color: "var(--primary)" }}
    />
  );
}

interface NavItemProps {
  href: string;
  icon: LucideIcon;
  label: string;
  badge?: number;
  collapsed?: boolean;
}

export function NavItem({ href, icon: Icon, label, badge, collapsed }: NavItemProps) {
  const pathname = usePathname();
  const active = pathname === href;

  return (
    <Link
      href={href}
      prefetch
      title={collapsed ? label : undefined}
      className={`group relative flex items-center gap-3 rounded-lg py-2 text-sm transition-all duration-150 hover:translate-x-0.5 ${
        collapsed ? "justify-center px-2" : "px-3"
      }`}
      style={{
        backgroundColor: active ? "var(--primary-soft)" : "transparent",
        color: active ? "var(--primary)" : "var(--fg-muted)",
        fontWeight: active ? 600 : 500,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "var(--bg-muted)";
          e.currentTarget.style.color = "var(--fg)";
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "var(--fg-muted)";
        }
      }}
    >
      {active && (
        <span
          aria-hidden
          className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full"
          style={{ backgroundColor: "var(--primary)" }}
        />
      )}
      <Icon size={18} className="transition-transform group-hover:scale-110" />
      {!collapsed && (
        <>
          <span className="flex-1">{label}</span>
          <PendingDot />
          {badge !== undefined && (
            <span
              className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-md px-1.5 text-xs font-semibold"
              style={{ backgroundColor: "var(--danger-soft)", color: "var(--danger-strong)" }}
            >
              {badge}
            </span>
          )}
        </>
      )}
      {collapsed && <PendingDot />}
    </Link>
  );
}
