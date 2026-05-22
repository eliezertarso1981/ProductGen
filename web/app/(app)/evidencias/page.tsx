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
  evidenceStatusConfig,
  evidenceStatuses,
  getEvidenceDisplayId,
  getEvidenceStatus,
  getExperimentDisplayId,
  toStatusBoardColumns,
  type Evidence,
  type EvidenceStatus,
  type EvidenceType,
} from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDate, type ListingView } from "@/components/shared/crud-ui";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { StatusBoard } from "@/components/discovery/status-board";
import { cycleFilterValue, normalizeDiscoverySearch } from "@/components/discovery/filter-helpers";

type EvidenceTypeFilter = "all" | EvidenceType;
type EvidenceStatusFilter = "all" | EvidenceStatus;

export default function EvidenciasPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { evidences, createEvidence, updateEvidence, getExperiment } = useDiscovery();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<EvidenceTypeFilter>("all");
  const [statusFilter, setStatusFilter] = useState<EvidenceStatusFilter>("all");
  const [sourceFilter, setSourceFilter] = useState("all");
  const [experimentFilter, setExperimentFilter] = useState("all");
  const [view, setView] = useState<ListingView>("board");
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
    const query = normalizeDiscoverySearch(search);

    return items.filter((evidence) => {
      const experiment = evidence.experimentId ? getExperiment(evidence.experimentId) : undefined;
      const experimentDisplayId = experiment ? getExperimentDisplayId(experiment) : undefined;
      const evidenceStatus = getEvidenceStatus(evidence);
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
          evidenceStatusConfig[evidenceStatus].label,
          evidence.experimentId,
          experimentDisplayId,
          experiment?.title,
          experiment?.method,
        ]
          .filter(Boolean)
          .some((value) => normalizeDiscoverySearch(value).includes(query));
      const matchesType = typeFilter === "all" || evidence.type === typeFilter;
      const matchesStatus = statusFilter === "all" || evidenceStatus === statusFilter;
      const matchesSource = sourceFilter === "all" || evidence.source.trim() === sourceFilter;
      const matchesExperiment =
        experimentFilter === "all" ||
        (experimentFilter === "none" ? !experiment : evidence.experimentId === experimentFilter);

      return matchesSearch && matchesType && matchesStatus && matchesSource && matchesExperiment;
    });
  }, [experimentFilter, getExperiment, items, search, sourceFilter, statusFilter, typeFilter]);
  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    statusFilter !== "all" ||
    sourceFilter !== "all" ||
    experimentFilter !== "all";
  const clearFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setStatusFilter("all");
    setSourceFilter("all");
    setExperimentFilter("all");
  };
  const boardColumns = toStatusBoardColumns(evidenceStatuses, evidenceStatusConfig);
  const handleMove = (id: string, status: EvidenceStatus) => {
    updateEvidence(id, { apiStatus: status });
    toast.success(`Movida para "${evidenceStatusConfig[status].label}"`);
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
        <DiscoveryFilterBar
          chips={[
            {
              label: "Status",
              value: statusFilter === "all" ? undefined : evidenceStatusConfig[statusFilter].label,
              active: statusFilter !== "all",
              onClick: () => setStatusFilter(cycleFilterValue(statusFilter, evidenceStatuses)),
            },
          ]}
          selects={[
            {
              label: "Tipo",
              value: typeFilter,
              onChange: (value) => setTypeFilter(value as EvidenceTypeFilter),
              options: [
                { value: "all", label: "Todos os tipos" },
                ...evidenceTypes.map((type) => ({ value: type, label: evidenceTypeConfig[type].label })),
              ],
            },
            ...(sourceOptions.length > 0
              ? [
                  {
                    label: "Origem",
                    value: sourceFilter,
                    onChange: setSourceFilter,
                    options: [
                      { value: "all", label: "Todas as origens" },
                      ...sourceOptions.map((source) => ({ value: source, label: source })),
                    ],
                  },
                ]
              : []),
            ...(experimentOptions.length > 0 || hasUnlinkedEvidences
              ? [
                  {
                    label: "Experimento",
                    value: experimentFilter,
                    onChange: setExperimentFilter,
                    options: [
                      { value: "all", label: "Todos os experimentos" },
                      ...experimentOptions.map((experiment) => ({
                        value: experiment.id,
                        label: `${experiment.label} · ${experiment.title}`,
                      })),
                      ...(hasUnlinkedEvidences ? [{ value: "none", label: "Sem experimento" }] : []),
                    ],
                  },
                ]
              : []),
          ]}
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Código, título, notas, origem ou experimento..."
          views={[
            { value: "list", label: "lista" },
            { value: "board", label: "kanban" },
          ]}
          activeView={view}
          onViewChange={setView}
          resultCount={visibleItems.length}
          hasActiveFilters={hasActiveFilters}
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
        ) : view === "board" ? (
          <StatusBoard<Evidence, EvidenceStatus>
            columns={boardColumns}
            items={visibleItems}
            getItemId={(ev) => ev.id}
            getItemStatus={(ev) => getEvidenceStatus(ev)}
            onSelect={(ev) => router.push(`/evidencias/${ev.id}`)}
            onMove={handleMove}
            groupName="evidences"
            renderCard={(ev) => {
              const t = evidenceTypeConfig[ev.type];
              const exp = ev.experimentId ? getExperiment(ev.experimentId) : undefined;
              return (
                <>
                  <div className="flex items-center justify-between font-mono text-[11px] text-[var(--fg-faint)]">
                    <span>{getEvidenceDisplayId(ev) ?? "Evidência"}</span>
                    <span>{formatDate(ev.updatedAt)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-[var(--fg)]">{ev.title}</div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-[var(--fg-subtle)]">{ev.notes}</p>
                  <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                    <span
                      className="rounded px-1.5 py-0.5 font-semibold"
                      style={{ backgroundColor: `${t.color}15`, color: t.color }}
                    >
                      {t.label}
                    </span>
                    {exp ? (
                      <span className="font-mono text-[var(--primary)]">
                        {getExperimentDisplayId(exp) ?? "Experimento"}
                      </span>
                    ) : (
                      <span className="text-[var(--fg-faint)]">{ev.source || "Sem experimento"}</span>
                    )}
                  </div>
                </>
              );
            }}
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
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Origem</th>
                  <th className="px-4 py-3 font-semibold">Experimento</th>
                  <th className="px-4 py-3 font-semibold">Atualizada</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((ev) => {
                  const t = evidenceTypeConfig[ev.type];
                  const status = evidenceStatusConfig[getEvidenceStatus(ev)];
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
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">{ev.notes}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: `${t.color}15`, color: t.color }}
                        >
                          {t.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.dot }} />
                          {status.label}
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
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">{formatDate(ev.updatedAt)}</td>
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
