import { ChevronsUpDown } from "lucide-react";
import { workspace } from "@/lib/mock-data";

export function WorkspaceSwitcher({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <button
      className={`flex w-full items-center rounded-lg p-2 text-left transition-colors hover:bg-white ${
        collapsed ? "justify-center" : "gap-3"
      }`}
      style={{ color: "var(--fg)" }}
      title={collapsed ? workspace.name : undefined}
    >
      <div
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-sm font-semibold text-white"
        style={{ backgroundColor: "var(--fg)" }}
      >
        {workspace.initials}
      </div>
      {!collapsed && (
        <>
          <div className="flex-1 min-w-0">
            <div className="truncate text-sm font-semibold">{workspace.name}</div>
            <div className="text-xs" style={{ color: "var(--fg-subtle)" }}>
              {workspace.members} membros
            </div>
          </div>
          <ChevronsUpDown size={16} color="var(--fg-subtle)" />
        </>
      )}
    </button>
  );
}
