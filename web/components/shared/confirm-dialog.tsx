"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

interface Props {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive,
  onConfirm,
  onCancel,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
      if (e.key === "Enter") onConfirm();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel, onConfirm]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-4 animate-fade-in"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm rounded-xl border p-5 shadow-xl animate-scale-in"
        style={{ backgroundColor: "var(--bg-elevated)", borderColor: "var(--border)" }}
      >
        <button
          onClick={onCancel}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-md p-1 hover:bg-[var(--bg-muted)]"
          style={{ color: "var(--fg-subtle)" }}
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: destructive ? "var(--danger-soft)" : "var(--primary-soft)",
              color: destructive ? "var(--danger)" : "var(--primary)",
            }}
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              className="text-[15px] font-semibold leading-snug"
              style={{ color: "var(--fg)" }}
            >
              {title}
            </h2>
            {description && (
              <p
                className="mt-1 text-[13px] leading-relaxed"
                style={{ color: "var(--fg-subtle)" }}
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-md border px-3 py-1.5 text-[13px] font-medium hover:bg-[var(--bg-muted)]"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{
              backgroundColor: destructive ? "var(--danger)" : "var(--primary)",
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
