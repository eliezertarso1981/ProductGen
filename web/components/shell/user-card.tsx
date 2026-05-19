"use client";

import { MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { useAuth } from "@/lib/auth-context";

export function UserCard({ collapsed = false }: { collapsed?: boolean }) {
  const { user } = useAuth();
  const name = user?.name ?? "Usuário";
  const email = user?.email ?? "Sessão local";
  const initials = makeInitials(name);

  if (collapsed) {
    return (
      <div className="flex justify-center p-1" title={name}>
        <Avatar initials={initials} color="var(--primary)" size={36} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <Avatar initials={initials} color="var(--primary)" size={36} />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {name}
        </div>
        <div className="truncate text-xs" style={{ color: "var(--fg-subtle)" }}>
          {email}
        </div>
      </div>
      <button className="rounded-md p-1 transition-colors hover:bg-white" aria-label="Mais opções">
        <MoreHorizontal size={16} color="var(--fg-subtle)" />
      </button>
    </div>
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
