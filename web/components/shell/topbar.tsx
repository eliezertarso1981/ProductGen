"use client";

import { Search, Bell } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { useAuth } from "@/lib/auth-context";
import { ProductSwitcher } from "./product-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
  const { user } = useAuth();
  const name = user?.name ?? "Usuário";

  return (
    <header
      className="flex h-14 items-center gap-4 border-b px-6"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      <ProductSwitcher />
      <div className="flex-1 flex justify-center">
        <div
          className="flex w-full max-w-xl items-center gap-2 rounded-lg border px-3 py-1.5"
          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
        >
          <Search size={16} color="var(--fg-faint)" />
          <input
            type="text"
            placeholder="Buscar ou usar comando…"
            className="flex-1 bg-transparent text-sm outline-none"
            style={{ color: "var(--fg)" }}
          />
        </div>
      </div>

      <button
        className="relative rounded-lg p-2 transition-colors hover:bg-[var(--bg-muted)]"
        aria-label="Notificações"
      >
        <Bell size={18} color="var(--fg-muted)" />
        <span
          className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full"
          style={{ backgroundColor: "var(--danger)" }}
        />
      </button>

      <ThemeToggle />

      <Avatar initials={makeInitials(name)} color="var(--primary)" size={32} />
    </header>
  );
}

function makeInitials(name: string) {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "US"
  );
}
