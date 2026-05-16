"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  function confirm() {
    setOpen(false);
    router.push("/login");
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={collapsed ? "Sair" : undefined}
        className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors hover:bg-white ${
          collapsed ? "justify-center px-2" : "gap-3 px-3"
        }`}
        style={{ color: "var(--fg-muted)" }}
      >
        <LogOut size={18} />
        {!collapsed && <span>Sair</span>}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: "rgba(15, 23, 42, 0.5)" }}
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-xl p-6 shadow-xl"
            style={{ backgroundColor: "var(--bg-elevated)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-lg font-semibold" style={{ color: "var(--fg)" }}>
              Sair da conta?
            </h2>
            <p className="mt-2 text-sm" style={{ color: "var(--fg-subtle)" }}>
              Você precisará fazer login novamente para acessar o workspace.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
              >
                Cancelar
              </button>
              <button
                onClick={confirm}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90"
                style={{ backgroundColor: "var(--danger)" }}
              >
                Sair
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
