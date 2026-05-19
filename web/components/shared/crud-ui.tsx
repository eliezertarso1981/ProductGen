"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Columns3, Download, LayoutGrid, List, Plus, Save, Search, Trash2, X } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { shadow } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

interface CrumbProps {
  parent?: { label: string; href: string };
  title: string;
}

export function PageHeader({
  crumb,
  title,
  count,
  onCreate,
  createLabel = "Novo",
}: {
  crumb: CrumbProps;
  title: string;
  count?: string;
  onCreate?: () => void;
  createLabel?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] pb-5">
      <div>
        <div className="text-[13px] text-[var(--fg-faint)]">
          {crumb.parent && (
            <>
              <Link href={crumb.parent.href} className="hover:text-[var(--fg-muted)] hover:underline">
                {crumb.parent.label}
              </Link>
              <span className="mx-1 text-[var(--fg-disabled)]">›</span>
            </>
          )}
          <span className="font-medium text-[var(--fg-muted)]">{crumb.title}</span>
        </div>
        <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
          {title}
        </h1>
        {count && <div className="mt-1 text-[13px] text-[var(--fg-subtle)]">{count}</div>}
      </div>
      <div className="flex items-center gap-2">
        <button
          className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[14px] font-medium text-[var(--fg)] transition-colors hover:bg-[var(--bg-muted)]"
          type="button"
        >
          <Download size={16} /> Exportar
        </button>
        {onCreate && (
          <button
            onClick={onCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-4 text-[14px] font-medium text-[var(--fg-on-primary)] transition-colors hover:bg-[var(--primary-hover)]"
            type="button"
          >
            <Plus size={16} /> {createLabel}
          </button>
        )}
      </div>
    </div>
  );
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-10 text-center text-[var(--fg-faint)]">
      <p className="text-[16px] font-semibold text-[var(--fg)]">{title}</p>
      {hint && <p className="mt-1 text-[14px] text-[var(--fg-subtle)]">{hint}</p>}
    </div>
  );
}

export function BackLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]"
    >
      ← {label}
    </Link>
  );
}

export function DeleteAction({
  title,
  description,
  confirmLabel = "Excluir",
  children = "Excluir",
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  children?: React.ReactNode;
  onConfirm: () => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--danger-border)] bg-[var(--bg-elevated)] px-4 text-[14px] font-medium text-[var(--danger)] shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--danger-soft)]"
        type="button"
      >
        <Trash2 size={16} /> {children}
      </button>
      <ConfirmDialog
        open={open}
        title={title}
        description={description}
        confirmLabel={confirmLabel}
        destructive
        onCancel={() => setOpen(false)}
        onConfirm={() => {
          setOpen(false);
          onConfirm();
        }}
      />
    </>
  );
}

/** Padding inferior para páginas de detalhe com FormActions fixo. */
export const detailPageClassName = "px-6 py-5 pb-28";

export function FormActions({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed bottom-4 right-4 z-[80] flex w-[calc(100%-2rem)] flex-wrap items-center justify-end gap-2 sm:bottom-6 sm:right-6 sm:w-[592px] lg:w-[672px] xl:w-[712px] [&>*]:pointer-events-auto"
      role="group"
      aria-label="Ações do formulário"
    >
      {children}
    </div>,
    document.body,
  );
}

export function SaveAction({
  children = "Salvar",
  disabled,
  onClick,
}: {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-md bg-[var(--primary)] px-5 text-[14px] font-medium text-[var(--fg-on-primary)] shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <Save size={16} /> {children}
    </button>
  );
}

export function CancelAction({
  children = "Cancelar",
  disabled,
  onClick,
}: {
  children?: React.ReactNode;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className="inline-flex h-10 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[14px] font-medium text-[var(--fg-muted)] shadow-[var(--shadow-md)] transition-colors hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-50"
    >
      <X size={15} /> {children}
    </button>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--fg-muted)]">
        {label}
      </div>
      {children}
    </div>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={
        "h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(19,200,181,0.15)] " +
        (props.className ?? "")
      }
      style={props.style}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={
        "w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 py-2 text-[14px] leading-6 text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(19,200,181,0.15)] " +
        (props.className ?? "")
      }
      style={props.style}
    />
  );
}

export function Select<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string; dot?: string }[];
}) {
  return (
    <div className="flex flex-col gap-1">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="flex h-10 items-center justify-between rounded-md border px-3 text-[13px] font-medium text-[var(--fg)] hover:bg-[var(--bg-muted)]"
            type="button"
            style={{
              borderColor: active ? (o.dot ?? "var(--primary)") : "var(--border)",
              backgroundColor: active && o.dot
                ? `color-mix(in srgb, ${o.dot} 14%, var(--bg-elevated))`
                : active
                  ? "var(--primary-soft-2)"
                  : "var(--bg-elevated)",
            }}
          >
            <span className="inline-flex items-center gap-2">
              {o.dot && (
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: o.dot }} />
              )}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export type ListingView = "grid" | "list" | "board";

export function ListingToolbar({
  filters = [],
  search,
  onSearchChange,
  views,
  activeView,
  onViewChange,
}: {
  filters?: { label: string; value?: string; active?: boolean; onClick?: () => void }[];
  search?: string;
  onSearchChange?: (value: string) => void;
  views?: { value: ListingView; label: string }[];
  activeView?: ListingView;
  onViewChange?: (view: ListingView) => void;
}) {
  const viewIcon = {
    grid: LayoutGrid,
    list: List,
    board: Columns3,
  } satisfies Record<ListingView, typeof LayoutGrid>;

  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-[var(--border)] bg-[var(--bg-elevated)] py-3">
      {filters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filters.map((filter) => {
            const active = filter.active ?? Boolean(filter.value);
            return (
              <button
                key={filter.label}
                onClick={filter.onClick}
                type="button"
                className={cn(
                  "inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] transition-colors",
                  active
                    ? "border-[rgba(19,200,181,0.30)] bg-[var(--primary-soft-2)] text-[var(--primary)]"
                    : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
                )}
              >
                <span>{filter.label}</span>
                {filter.value && (
                  <>
                    <span className="text-[var(--fg-disabled)]">·</span>
                    <span className="font-medium">{filter.value}</span>
                  </>
                )}
              </button>
            );
          })}
        </div>
      )}

      <div className="ml-auto flex flex-wrap items-center gap-2">
        {onSearchChange && (
          <label className="flex h-10 w-60 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]">
            <Search size={16} className="text-[var(--fg-faint)]" aria-hidden />
            <span className="sr-only">Buscar nesta lista</span>
            <input
              type="search"
              value={search ?? ""}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Buscar nesta lista..."
              className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)]"
            />
          </label>
        )}

        {views && activeView && onViewChange && (
          <div className="flex h-10 items-center rounded-md border border-[var(--border)] bg-[var(--bg-muted)] p-1">
            {views.map((view) => {
              const Icon = viewIcon[view.value];
              const active = view.value === activeView;
              return (
                <button
                  key={view.value}
                  type="button"
                  onClick={() => onViewChange(view.value)}
                  aria-label={`Visualizar como ${view.label}`}
                  title={`Visualizar como ${view.label}`}
                  className={cn(
                    "inline-flex h-8 w-8 items-center justify-center rounded-md transition-colors",
                    active
                      ? "bg-[var(--bg-elevated)] text-[var(--fg)]"
                      : "text-[var(--fg-subtle)] hover:bg-[var(--bg-elevated)] hover:text-[var(--fg)]",
                  )}
                  style={{ boxShadow: active ? shadow.sm : shadow.none }}
                >
                  <Icon size={16} aria-hidden />
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function useCrudRouter() {
  return useRouter();
}

export function formatDate(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateOnly(iso?: string): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR");
}
