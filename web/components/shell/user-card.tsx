import { MoreHorizontal } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { currentUser } from "@/lib/mock-data";

export function UserCard({ collapsed = false }: { collapsed?: boolean }) {
  if (collapsed) {
    return (
      <div className="flex justify-center p-1" title={currentUser.name}>
        <Avatar initials={currentUser.initials} color="var(--primary)" size={36} />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-lg p-2">
      <Avatar initials={currentUser.initials} color="var(--primary)" size={36} />
      <div className="flex-1 min-w-0">
        <div className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>
          {currentUser.name}
        </div>
        <div className="truncate text-xs" style={{ color: "var(--fg-subtle)" }}>
          {currentUser.email}
        </div>
      </div>
      <button className="rounded-md p-1 transition-colors hover:bg-white" aria-label="Mais opções">
        <MoreHorizontal size={16} color="var(--fg-subtle)" />
      </button>
    </div>
  );
}
