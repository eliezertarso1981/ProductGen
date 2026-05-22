"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscovery } from "@/lib/discovery-store";
import {
  getOutcomeDisplayId,
  getRoadmapDisplayId,
  outcomeStatusConfig,
  outcomeStatuses,
  type OutcomeStatus,
} from "@/lib/discovery-data";
import { useProducts } from "@/lib/products-context";
import { EmptyState, PageHeader, formatDate } from "@/components/shared/crud-ui";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { cycleFilterValue, normalizeDiscoverySearch } from "@/components/discovery/filter-helpers";

export default function OutcomesPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { ready, roadmap, outcomes, createOutcome } = useDiscovery();
  const productRoadmap = useMemo(
    () => roadmap.filter((item) => item.productId === currentProduct.id),
    [currentProduct.id, roadmap],
  );
  const roadmapById = useMemo(
    () => new Map(productRoadmap.map((item) => [item.id, item])),
    [productRoadmap],
  );
  const items = useMemo(
    () => outcomes.filter((outcome) => outcome.productId === currentProduct.id),
    [currentProduct.id, outcomes],
  );
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OutcomeStatus>("all");
  const visibleItems = useMemo(() => {
    const query = normalizeDiscoverySearch(search);
    return items.filter((outcome) => {
      const roadmapItem = roadmapById.get(outcome.roadmapItemId);
      const status = outcomeStatusConfig[outcome.status];
      const matchesSearch =
        !query ||
        [
          getOutcomeDisplayId(outcome),
          outcome.hypothesizedImpact,
          outcome.conclusion,
          status.label,
          roadmapItem ? getRoadmapDisplayId(roadmapItem) : undefined,
          roadmapItem?.title,
        ]
          .filter(Boolean)
          .some((value) => normalizeDiscoverySearch(value).includes(query));
      const matchesStatus = statusFilter === "all" || outcome.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [items, roadmapById, search, statusFilter]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Delivery", href: "/roadmap" }, title: "Outcomes" }}
        title="Outcomes"
        count={`${items.length} medições`}
        onCreate={() => {
          const roadmapItem = productRoadmap[0];
          if (!roadmapItem) {
            toast.error("Crie um item de roadmap antes de medir outcomes.");
            return;
          }

          void createOutcome(roadmapItem.id)
            .then((outcome) => router.push(`/outcomes/${outcome.id}?new=1`))
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar o outcome");
            });
        }}
        createLabel="Novo outcome"
      />

      {items.length > 0 && (
        <DiscoveryFilterBar
          chips={[
            {
              label: "Status",
              value: statusFilter === "all" ? undefined : outcomeStatusConfig[statusFilter].label,
              active: statusFilter !== "all",
              onClick: () => setStatusFilter(cycleFilterValue(statusFilter, outcomeStatuses)),
            },
          ]}
          search={search}
          onSearchChange={setSearch}
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
            title={items.length === 0 ? "Nenhum outcome ainda" : "Nenhum outcome encontrado"}
            hint={
              items.length === 0
                ? "Outcomes medem o impacto pós-entrega de itens do roadmap."
                : "Ajuste a busca ou os filtros para ver mais resultados."
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
                  <th className="px-4 py-3 font-semibold">Outcome</th>
                  <th className="px-4 py-3 font-semibold">Roadmap</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Janela</th>
                  <th className="px-4 py-3 font-semibold">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((outcome) => {
                  const roadmapItem = roadmapById.get(outcome.roadmapItemId);
                  const status = outcomeStatusConfig[outcome.status];
                  return (
                    <tr
                      key={outcome.id}
                      className="border-t transition-colors hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--bg-muted-2)" }}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">
                        {getOutcomeDisplayId(outcome) ?? "Outcome"}
                      </td>
                      <td className="px-4 py-3">
                        <Link href={`/outcomes/${outcome.id}`} className="font-semibold text-[var(--fg)] hover:underline">
                          {outcome.hypothesizedImpact}
                        </Link>
                        {outcome.conclusion && (
                          <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                            {outcome.conclusion}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">
                        {roadmapItem ? (
                          <Link href={`/roadmap/${roadmapItem.id}`} className="hover:underline">
                            <span className="font-mono text-[11px] text-[var(--fg-faint)]">
                              {getRoadmapDisplayId(roadmapItem) ?? "RM"}
                            </span>{" "}
                            {roadmapItem.title}
                          </Link>
                        ) : (
                          "Roadmap não encontrado"
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">
                        <span className="inline-flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: status.dot }} />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[var(--fg-muted)]">
                        {outcome.measurementWindowDays}d
                      </td>
                      <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                        {formatDate(outcome.updatedAt)}
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
