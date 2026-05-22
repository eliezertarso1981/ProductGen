"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { logoutFromProductgenApi } from "@/lib/productgen-api";

export function LogoutButton({ collapsed = false }: { collapsed?: boolean }) {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        title={collapsed ? "Sair" : undefined}
        className={`flex w-full items-center rounded-lg py-2 text-sm font-medium transition-colors hover:bg-white ${
          collapsed ? "justify-center px-2" : "gap-3 px-3"
        }`}
        style={{ color: "var(--fg-muted)" }}
        type="button"
      >
        <LogOut size={18} />
        {!collapsed && <span>Sair</span>}
      </button>

      <ConfirmDialog
        open={open}
        title="Sair da conta?"
        description="Você precisará fazer login novamente para acessar o workspace."
        confirmLabel="Sair"
        cancelLabel="Cancelar"
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          void logoutFromProductgenApi();
          setOpen(false);
          router.push("/login");
        }}
      />
    </>
  );
}
