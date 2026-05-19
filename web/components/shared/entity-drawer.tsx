"use client";

import { useEffect, useId, useRef } from "react";
import { X } from "lucide-react";

type EntityDrawerProps = {
  open: boolean;
  title: string;
  subtitle?: string;
  status?: React.ReactNode;
  entityIcon?: React.ReactNode;
  onClose: () => void;
  children: React.ReactNode;
};

export function EntityDrawer({
  open,
  title,
  subtitle,
  status,
  entityIcon,
  onClose,
  children,
}: EntityDrawerProps) {
  const titleId = useId();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [onClose, open]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" aria-hidden={!open}>
      <button
        type="button"
        aria-label="Fechar detalhe"
        className="absolute inset-0 cursor-default bg-[rgba(15,20,25,0.50)]"
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="absolute right-0 top-0 flex h-full w-full flex-col border-l border-[#dde0e8] bg-[#ffffff] shadow-xl outline-none transition-transform duration-150 ease-out sm:w-[640px] lg:w-[720px] xl:w-[760px]"
        style={{ boxShadow: "0 20px 25px rgba(15, 20, 25, 0.10), 0 8px 10px rgba(15, 20, 25, 0.04)" }}
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[#dde0e8] px-6 py-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {entityIcon && (
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#dde0e8] bg-[#ffffff]">
                  {entityIcon}
                </span>
              )}
              <div className="min-w-0">
                {subtitle && <div className="font-mono text-[11px] text-[#9aa0b1]">{subtitle}</div>}
                <h2 id={titleId} className="truncate text-[18px] font-semibold tracking-[-0.01em] text-[#2b364a]">
                  {title}
                </h2>
              </div>
            </div>
            {status && <div className="mt-3">{status}</div>}
          </div>
          <button
            ref={closeRef}
            type="button"
            aria-label="Fechar detalhe"
            title="Fechar detalhe"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#4e5567] transition-colors hover:bg-[#eef0f4] hover:text-[#2b364a] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13c8b5]"
            onClick={onClose}
          >
            <X size={16} aria-hidden />
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto px-6 pb-28 pt-5">{children}</div>
      </aside>
    </div>
  );
}
