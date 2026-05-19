"use client";

import { ChevronsUpDown } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useWorkspace } from "@/lib/workspace-store";

export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  const { currentWorkspace } = useAuth();
  const { members } = useWorkspace();
  const name = currentWorkspace?.name ?? "Workspace local";
  const initials = makeInitials(name);

  return (
    <button
      className={`flex w-full items-center rounded-lg p-2 text-left transition-colors hover:bg-white ${
        collapsed ? "justify-center" : "gap-3"
      }`}
      style={{ color: "var(--fg)" }}
      title={collapsed ? name : undefined}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold"
        style={{ backgroundColor: "var(--primary)", color: "var(--fg-on-primary)" }}
      >
        {initials}
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold">{name}</div>
            <div className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {members.length} membros
            </div>
          </div>
          <ChevronsUpDown size={16} color="var(--fg-subtle)" />
        </>
      )}
    </button>
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
      .toUpperCase() || "WS"
  );
}
