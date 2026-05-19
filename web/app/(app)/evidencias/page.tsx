"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscovery } from "@/lib/discovery-store";
import { useProducts } from "@/lib/products-context";
import {
  evidenceTypeConfig,
  evidenceTypes,
  getEvidenceDisplayId,
  getExperimentDisplayId,
  type EvidenceType,
} from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDate } from "@/components/shared/crud-ui";

type EvidenceTypeFilter = "all" | EvidenceType;

export default function EvidenciasPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { evidences, createEvidence, getExperiment } = useDiscovery();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceTypeFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const items = useMemo(
    () => evidences.filter((e) => e.productId === currentProduct.id),
    [evidences, currentProduct.id],
  );
  const sourceOptions = useMemo(
    () =>
      Array.from(new Set(items.map((evidence) => evidence.source.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, "pt-BR"),
      ),
    [items],
  );
  const experimentOptions = useMemo(
    () =>
      Array.from(
        new Map(
          items
            .map((evidence) => (evidence.experimentId ? getExperiment(evidence.experimentId) : undefined))
            .filter(Boolean)
            .map((experiment) => [
              experiment!.id,
              {
                id: experiment!.id,
                label: getExperimentDisplayId(experiment!) ?? experiment!.title,
                title: experiment!.title,
              },
            ]),
        ).values(),
      ).sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
    [getExperiment, items],
  );
  const hasUnlinkedEvidences = useMemo(
    () => items.some((evidence) => !evidence.experimentId || !getExperiment(evidence.experimentId)),
    [getExperiment, items],
  );
  const visibleItems = useMemo(() => {
    const query = normalize(search);

    return items.filter((evidence) => {
      const experiment = evidence.experimentId ? getExperiment(evidence.experimentId) : undefined;
      const experimentDisplayId = experiment ? getExperimentDisplayId(experiment) : undefined;
      const matchesSearch =
        !query ||
        [
          getEvidenceDisplayId(evidence),
          evidence.code,
          evidence.id,
          evidence.title,
          evidence.notes,
          evidence.source,
          evidenceTypeConfig[evidence.type].label,
          evidence.experimentId,
          experimentDisplayId,
          experiment?.title,
          experiment?.method,
        ]
          .filter(Boolean)
          .some((value) => normalize(value).includes(query));
      const matchesType = typeFilter === "all" || evidence.type === typeFilter;
      const matchesSource = sourceFilter === "all" || evidence.source.trim() === sourceFilter;
      const matchesExperiment =
        experimentFilter === "all" ||
        (experimentFilter === "none" ? !experiment : evidence.experimentId === experimentFilter);

      return matchesSearch && matchesType && matchesSource && matchesExperiment;
    });
  }, [experimentFilter, getExperiment, items, search, sourceFilter, typeFilter]);
  const hasActiveFilters =
    search.trim() !== "" || typeFilter !== "all" || sourceFilter !== "all" || experimentFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setSourceFilter("all");
    setExperimentFilter("all");
  };

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Evidências" }}
        title="Evidências"
        count={`${items.length} evidências`}
        onCreate={() => {
          void createEvidence(currentProduct.id)
            .then((ev) => {
              router.push(`/evidencias/${ev.id}?new=1`);
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar a evidência");
            });
        }}
        createLabel="Nova evidência"
      />

      {items.length > 0 && (
        <EvidenceFilters
          search={search}
          onSearchChange={setSearch}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          sourceFilter={sourceFilter}
          onSourceFilterChange={setSourceFilter}
          sourceOptions={sourceOptions}
          experimentFilter={experimentFilter}
          onExperimentFilterChange={setExperimentFilter}
          experimentOptions={experimentOptions}
          hasUnlinkedEvidences={hasUnlinkedEvidences}
          hasActiveFilters={hasActiveFilters}
          resultCount={visibleItems.length}
          onClear={clearFilters}
        />
      )}

      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhuma evidência ainda" : "Nenhuma evidência encontrada"}
            hint={
              items.length === 0
                ? "Evidências nascem dos experimentos."
                : "Ajuste ou limpe os filtros para ver mais resultados."
            }
          />
        ) : (
          <div className="overflow-x-auto rounded-xl border" style={{ borderColor: "var(--border)" }}>
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="text-[11px] uppercase tracking-wider"
                  style={{ color: "var(--fg-faint)", backgroundColor: "var(--bg-muted)" }}
                >
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Evidência</th>
                  <th className="px-4 py-3 font-semibold">Tipo</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Experimento</th>
                  <th className="px-4 py-3 font-semibold">Atualizada</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((ev) => {
                  const t = evidenceTypeConfig[ev.type];
                  const exp = ev.experimentId ? getExperiment(ev.experimentId) : undefined;
                  return (
                    <tr
                      key={ev.id}
                      className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--bg-muted-2)" }}
                      onClick={() => router.push(`/evidencias/${ev.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">
                        {getEvidenceDisplayId(ev) ?? "Evidência"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--fg)]">{ev.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                          {ev.notes}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: `${t.color}15`, color: t.color }}
                        >
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">{ev.source || "—"}</td>
                      <td className="px-4 py-3 text-[13px]">
                        {exp ? (
                          <Link
                            href={`/experimentos/${exp.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[12px] text-[var(--primary)] hover:underline"
                          >
                            {getExperimentDisplayId(exp) ?? "Experimento"}
                          </Link>
                        ) : (
                          <span className="text-[var(--border-strong)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                        {formatDate(ev.updatedAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function EvidenceFilters({
  search,
  onSearchChange,
  typeFilter,
  onTypeFilterChange,
  sourceFilter,
  onSourceFilterChange,
  sourceOptions,
  experimentFilter,
  onExperimentFilterChange,
  experimentOptions,
  hasUnlinkedEvidences,
  hasActiveFilters,
  resultCount,
  onClear,
}: {
  search: string;
  onSearchChange: (value: string) => void;
  typeFilter: EvidenceTypeFilter;
  onTypeFilterChange: (value: EvidenceTypeFilter) => void;
  sourceFilter: string;
  onSourceFilterChange: (value: string) => void;
  sourceOptions: string[];
  experimentFilter: string;
  onExperimentFilterChange: (value: string) => void;
  experimentOptions: { id: string; label: string; title: string }[];
  hasUnlinkedEvidences: boolean;
  hasActiveFilters: boolean;
  resultCount: number;
  onClear: () => void;
}) {
  return (
    <div className="border-b border-[var(--border)] bg-[var(--bg-elevated)] py-3">
      <div className="flex flex-wrap items-end gap-3">
        <label className="min-w-[240px] flex-1">
          <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--fg-muted)]">
            Buscar
          </span>
          <input
            type="search"
            value={search}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Código, título, notas, origem ou experimento..."
            className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[14px] text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]"
          />
        </label>

        <FilterSelect
          label="Tipo"
          value={typeFilter}
          onChange={(value) => onTypeFilterChange(value as EvidenceTypeFilter)}
        >
          <option value="all">Todos os tipos</option>
          {evidenceTypes.map((type) => (
            <option key={type} value={type}>
              {evidenceTypeConfig[type].label}
            </option>
          ))}
        </FilterSelect>

        {sourceOptions.length > 0 && (
          <FilterSelect label="Origem" value={sourceFilter} onChange={onSourceFilterChange}>
            <option value="all">Todas as origens</option>
            {sourceOptions.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </FilterSelect>
        )}

        {(experimentOptions.length > 0 || hasUnlinkedEvidences) && (
          <FilterSelect label="Experimento" value={experimentFilter} onChange={onExperimentFilterChange}>
            <option value="all">Todos os experimentos</option>
            {experimentOptions.map((experiment) => (
              <option key={experiment.id} value={experiment.id}>
                {experiment.label} · {experiment.title}
              </option>
            ))}
            {hasUnlinkedEvidences && <option value="none">Sem experimento</option>}
          </FilterSelect>
        )}

        <button
          type="button"
          onClick={onClear}
          disabled={!hasActiveFilters}
          className="inline-flex h-10 items-center rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-4 text-[14px] font-medium text-[var(--fg-muted)] transition-colors hover:bg-[var(--bg-muted)] hover:text-[var(--fg)] disabled:cursor-not-allowed disabled:opacity-50"
        >
          Limpar filtros
        </button>
      </div>

      <div className="mt-2 text-[12px] text-[var(--fg-subtle)]">
        {resultCount} resultado(s)
        {hasActiveFilters ? " com filtros aplicados" : ""}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  children,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  children: React.ReactNode;
}) {
  return (
    <label className="min-w-[180px]">
      <span className="mb-1.5 block text-[11px] font-medium uppercase tracking-[0.04em] text-[var(--fg-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-md border border-[var(--border)] bg-[var(--bg)] px-3 text-[14px] text-[var(--fg)] outline-none focus:border-[var(--primary)] focus:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]"
      >
        {children}
      </select>
    </label>
  );
}

function normalize(value: unknown) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}
