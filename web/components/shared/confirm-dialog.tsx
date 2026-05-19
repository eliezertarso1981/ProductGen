"use client";

import { useEffect, useId, useRef } from "react";
import { AlertTriangle, X } from "lucide-react";
import { colors, shadow } from "@/lib/design-tokens";

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
  const titleId = useId();
  const descriptionId = useId();
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    cancelButtonRef.current?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex animate-fade-in items-center justify-center bg-[rgba(15,20,25,0.50)] p-4"
      onClick={onCancel}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={description ? descriptionId : undefined}
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-[480px] animate-scale-in rounded-xl border border-[#dde0e8] bg-[#ffffff] p-8"
        style={{ boxShadow: shadow.lg }}
      >
        <button
          onClick={onCancel}
          aria-label="Fechar"
          title="Fechar"
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-md text-[#4e5567] transition-colors hover:bg-[#eef0f4]"
          type="button"
        >
          <X size={16} />
        </button>

        <div className="flex items-start gap-3">
          <div
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
            style={{
              backgroundColor: destructive ? colors.semantic.dangerBg : "rgba(19, 200, 181, 0.10)",
              color: destructive ? colors.semantic.danger : colors.primary,
            }}
            aria-hidden
          >
            <AlertTriangle size={18} />
          </div>
          <div className="min-w-0 flex-1">
            <h2
              id={titleId}
              className="text-[22px] font-semibold leading-tight tracking-[-0.01em] text-[#2b364a]"
            >
              {title}
            </h2>
            {description && (
              <p
                id={descriptionId}
                className="mt-2 text-[14px] leading-relaxed text-[#6b7287]"
              >
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            ref={cancelButtonRef}
            onClick={onCancel}
            className="inline-flex h-10 items-center rounded-md border border-[#dde0e8] bg-[#ffffff] px-4 text-[14px] font-medium text-[#4e5567] transition-colors hover:bg-[#f7f8fa]"
            type="button"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className="inline-flex h-10 items-center rounded-md px-4 text-[14px] font-medium text-white transition-colors"
            type="button"
            style={{
              backgroundColor: destructive ? colors.semantic.danger : colors.primary,
            }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = destructive ? "#b91c1c" : colors.primaryHover;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = destructive ? colors.semantic.danger : colors.primary;
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
