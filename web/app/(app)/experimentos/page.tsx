"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscovery } from "@/lib/discovery-store";
import { useProducts } from "@/lib/products-context";
import {
  experimentStatusConfig,
  experimentResultConfig,
  experimentStatuses,
  getExperimentDisplayId,
  getHypothesisDisplayId,
  toStatusBoardColumns,
  type Experiment,
  type ExperimentStatus,
} from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDateOnly, type ListingView } from "@/components/shared/crud-ui";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { StatusBoard } from "@/components/discovery/status-board";
import { cycleFilterValue } from "@/components/discovery/filter-helpers";
import { Avatar } from "@/components/shared/avatar";

export default function ExperimentosPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { experiments, createExperiment, updateExperiment, getHypothesis, evidencesByExperiment } =
    useDiscovery();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | ExperimentStatus>("all");
  const [view, setView] = useState<ListingView>("board");
  const items = useMemo(
    () => experiments.filter((e) => e.productId === currentProduct.id),
    [experiments, currentProduct.id],
  );
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((e) => {
      const cfg = experimentStatusConfig[e.status];
      const hyp = e.hypothesisId ? getHypothesis(e.hypothesisId) : undefined;
      const matchesSearch =
        !query ||
        [
          getExperimentDisplayId(e),
          e.title,
          e.method,
          e.description,
          cfg.label,
          hyp ? getHypothesisDisplayId(hyp) : undefined,
          hyp?.title,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || e.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [getHypothesis, items, search, statusFilter]);
  const boardColumns = toStatusBoardColumns(experimentStatuses, experimentStatusConfig);
  const handleMove = (id: string, status: ExperimentStatus) => {
    updateExperiment(id, { status });
    toast.success(`Movido para "${experimentStatusConfig[status].label}"`);
  };

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Experimentos" }}
        title="Experimentos"
        count={`${items.length} experimentos`}
        onCreate={() => {
          void createExperiment(currentProduct.id)
            .then((e) => {
              router.push(`/experimentos/${e.id}?new=1`);
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar o experimento");
            });
        }}
        createLabel="Novo experimento"
      />

      {items.length > 0 && (
        <DiscoveryFilterBar
          chips={[
            {
              label: "Status",
              value: statusFilter === "all" ? undefined : experimentStatusConfig[statusFilter].label,
              active: statusFilter !== "all",
              onClick: () => setStatusFilter(cycleFilterValue(statusFilter, experimentStatuses)),
            },
          ]}
          search={search}
          onSearchChange={setSearch}
          views={[
            { value: "list", label: "lista" },
            { value: "board", label: "kanban" },
          ]}
          activeView={view}
          onViewChange={setView}
          resultCount={visibleItems.length}
          hasActiveFilters={statusFilter !== "all" || search.trim() !== ""}
          onClear={() => {
            setSearch("");
            setStatusFilter("all");
          }}
        />
      )}

      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhum experimento ainda" : "Nenhum experimento encontrado"}
            hint={
              items.length === 0
                ? "Experimentos validam ou invalidam hipóteses."
                : "Ajuste a busca ou os filtros para ver mais resultados."
            }
          />
        ) : view === "board" ? (
          <StatusBoard<Experiment, ExperimentStatus>
            columns={boardColumns}
            items={visibleItems}
            getItemId={(e) => e.id}
            getItemStatus={(e) => e.status}
            onSelect={(e) => router.push(`/experimentos/${e.id}`)}
            onMove={handleMove}
            groupName="experiments"
            renderCard={(e) => {
              const hyp = e.hypothesisId ? getHypothesis(e.hypothesisId) : undefined;
              const result = e.result ? experimentResultConfig[e.result] : null;
              return (
                <>
                  <div className="flex items-center justify-between font-mono text-[11px] text-[var(--fg-faint)]">
                    <span>{getExperimentDisplayId(e) ?? "Experimento"}</span>
                    <span>{formatDateOnly(e.startDate)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-[var(--fg)]">{e.title}</div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-[var(--fg-subtle)]">{e.method || e.description}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    {hyp ? (
                      <span className="font-mono text-[var(--primary)]">{getHypothesisDisplayId(hyp) ?? "Hipótese"}</span>
                    ) : (
                      <span className="text-[var(--fg-faint)]">Sem hipótese</span>
                    )}
                    {result ? <span style={{ color: result.color }}>{result.label}</span> : null}
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
                  <th className="px-4 py-3 font-semibold">Experimento</th>
                  <th className="px-4 py-3 font-semibold">Hipótese</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Resultado</th>
                  <th className="px-4 py-3 font-semibold">Evidências</th>
                  <th className="px-4 py-3 font-semibold">Início</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((e) => {
                  const cfg = experimentStatusConfig[e.status];
                  const hyp = e.hypothesisId ? getHypothesis(e.hypothesisId) : undefined;
                  const evCount = evidencesByExperiment(e.id).length;
                  const result = e.result ? experimentResultConfig[e.result] : null;
                  return (
                    <tr
                      key={e.id}
                      className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--bg-muted-2)" }}
                      onClick={() => router.push(`/experimentos/${e.id}`)}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">
                        {getExperimentDisplayId(e) ?? "Experimento"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[var(--fg)]">{e.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                          {e.method || e.description}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {hyp ? (
                          <Link
                            href={`/hipoteses/${hyp.id}`}
                            onClick={(ev) => ev.stopPropagation()}
                            className="font-mono text-[12px] text-[var(--primary)] hover:underline"
                          >
                            {getHypothesisDisplayId(hyp) ?? "Hipótese"}
                          </Link>
                        ) : (
                          <span className="text-[var(--border-strong)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className="inline-flex items-center gap-2 text-[var(--fg-muted)]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {result ? (
                          <span style={{ color: result.color }}>{result.label}</span>
                        ) : (
                          <span className="text-[var(--border-strong)]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[var(--fg-muted)]">{evCount}</td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                        {formatDateOnly(e.startDate)}
                      </td>
                      <td className="px-4 py-3">
                        <Avatar initials={e.owner.initials} color={e.owner.color} size={24} />
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
