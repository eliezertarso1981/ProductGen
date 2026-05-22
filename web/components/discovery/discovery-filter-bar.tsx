"use client";

import { ChevronDown, Columns3, LayoutGrid, List, Search, X } from "lucide-react";
import { shadow } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";
import type { ListingView } from "@/components/shared/crud-ui";

export type DiscoveryFilterChip = {
  label: string;
  value?: string;
  active?: boolean;
  onClick?: () => void;
};

export type DiscoveryFilterSelect = {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  clearValue?: string;
  isActive?: (value: string) => boolean;
};

type DiscoveryFilterBarProps = {
  chips?: DiscoveryFilterChip[];
  selects?: DiscoveryFilterSelect[];
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  views?: { value: ListingView; label: string }[];
  activeView?: ListingView;
  onViewChange?: (view: ListingView) => void;
  resultCount?: number;
  hasActiveFilters?: boolean;
  onClear?: () => void;
};

export function DiscoveryFilterBar(props: DiscoveryFilterBarProps) {
  const {
    chips = [],
    selects = [],
    search,
    onSearchChange,
    searchPlaceholder = "Buscar nesta lista...",
    views,
    activeView,
    onViewChange,
    resultCount,
    hasActiveFilters,
    onClear,
  } = props;

  const viewIcon = {
    grid: LayoutGrid,
    list: List,
    board: Columns3,
  } satisfies Record<ListingView, typeof LayoutGrid>;

  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)]">
      <div className="flex flex-wrap items-center gap-3 py-3">
        {(chips.length > 0 || selects.length > 0) && (
          <div className="flex flex-wrap items-center gap-2">
            {chips.map((filter) => {
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
                  {filter.value ? (
                    <>
                      <span className="text-[var(--fg-disabled)]">·</span>
                      <span className="font-medium">{filter.value}</span>
                    </>
                  ) : null}
                </button>
              );
            })}
            {selects.map((select) => (
              <FilterSelect key={select.label} {...select} />
            ))}
            {onClear ? (
              <button
                type="button"
                onClick={onClear}
                disabled={hasActiveFilters === false}
                className="text-[13px] text-[var(--fg-subtle)] underline-offset-2 transition-colors hover:text-[var(--fg)] hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Limpar filtros
              </button>
            ) : null}
          </div>
        )}

        <div className="ml-auto flex flex-wrap items-center gap-2">
          {onSearchChange ? (
            <label className="flex h-10 w-60 items-center gap-2 rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 focus-within:border-[var(--primary)] focus-within:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]">
              <Search size={16} className="text-[var(--fg-faint)]" aria-hidden />
              <span className="sr-only">Buscar nesta lista</span>
              <input
                type="search"
                value={search ?? ""}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder={searchPlaceholder}
                className="min-w-0 flex-1 bg-transparent text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)]"
              />
            </label>
          ) : null}

          {views && activeView && onViewChange ? (
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
          ) : null}
        </div>
      </div>

      {resultCount !== undefined ? (
        <div className="pb-2 text-[12px] text-[var(--fg-subtle)]">
          {resultCount} resultado(s)
          {hasActiveFilters ? " com filtros aplicados" : ""}
        </div>
      ) : null}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  options,
  onChange,
  clearValue = "all",
  isActive,
}: DiscoveryFilterSelect) {
  const active = isActive ? isActive(value) : value !== clearValue;
  const selected = options.find((option) => option.value === value)?.label;

  return (
    <label
      className="inline-flex h-8 items-center gap-1.5 rounded-md border px-3 text-[13px] transition-colors"
      style={{
        borderColor: active ? "rgba(19, 200, 181, 0.30)" : "var(--border)",
        color: active ? "var(--primary)" : "var(--fg-muted)",
        backgroundColor: active ? "var(--primary-soft-2)" : "var(--bg-elevated)",
      }}
    >
      <span>{label}</span>
      <span className="text-[var(--fg-disabled)]">·</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="max-w-[180px] bg-transparent font-medium outline-none"
        aria-label={`Filtrar por ${label}`}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {active ? (
        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onChange(clearValue);
          }}
          className="-mr-1 inline-flex h-5 w-5 items-center justify-center rounded text-[var(--primary)] hover:bg-[rgba(19,200,181,0.10)]"
          aria-label={`Limpar filtro ${label}`}
          title={`Limpar filtro ${label}`}
        >
          <X size={12} aria-hidden />
        </button>
      ) : (
        <ChevronDown size={12} className="text-[var(--fg-faint)]" aria-hidden />
      )}
      <span className="sr-only">{selected}</span>
    </label>
  );
}
