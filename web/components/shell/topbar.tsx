import { Search, Plus, Bell, ChevronDown } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";
import { currentUser } from "@/lib/mock-data";
import { ProductSwitcher } from "./product-switcher";
import { ThemeToggle } from "./theme-toggle";

export function Topbar() {
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
          <kbd
            className="rounded px-1.5 py-0.5 text-[11px] font-medium"
            style={{ backgroundColor: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--fg-subtle)" }}
          >
            ⌘K
          </kbd>
        </div>
      </div>

      <button
        className="inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
        style={{ backgroundColor: "var(--primary)" }}
      >
        <Plus size={16} />
        Novo
        <ChevronDown size={14} />
      </button>

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

      <Avatar initials={currentUser.initials} color="var(--primary)" size={32} />
    </header>
  );
}
