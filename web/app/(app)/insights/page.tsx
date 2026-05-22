"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscovery } from "@/lib/discovery-store";
import { getInsightDisplayId } from "@/lib/discovery-data";
import { useProducts } from "@/lib/products-context";
import { PageHeader, EmptyState, formatDate } from "@/components/shared/crud-ui";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { normalizeDiscoverySearch } from "@/components/discovery/filter-helpers";

export default function InsightsPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { insights, createInsight, getEvidence } = useDiscovery();
  const [search, setSearch] = useState("");
  const items = useMemo(
    () => insights.filter((insight) => insight.productId === currentProduct.id),
    [insights, currentProduct.id],
  );
  const visibleItems = useMemo(() => {
    const query = normalizeDiscoverySearch(search);
    if (!query) return items;
    return items.filter((insight) =>
      [getInsightDisplayId(insight), insight.title, insight.description]
        .filter(Boolean)
        .some((value) => normalizeDiscoverySearch(value).includes(query)),
    );
  }, [items, search]);

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Insights" }}
        title="Insights"
        count={`${items.length} insights`}
        onCreate={() => {
          void createInsight(currentProduct.id)
            .then((insight) => {
              router.push(`/insights/${insight.id}?new=1`);
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar o insight");
            });
        }}
        createLabel="Novo insight"
      />

      {items.length > 0 && (
        <DiscoveryFilterBar
          search={search}
          onSearchChange={setSearch}
          resultCount={visibleItems.length}
          hasActiveFilters={search.trim() !== ""}
          onClear={() => setSearch("")}
        />
      )}

      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhum insight ainda" : "Nenhum insight encontrado"}
            hint={
              items.length === 0
                ? "Insights pertencem ao produto e podem nascer sem evidência vinculada."
                : "Ajuste a busca para ver mais resultados."
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
                  <th className="px-4 py-3 font-semibold">Insight</th>
                  <th className="px-4 py-3 font-semibold">Confiança</th>
                  <th className="px-4 py-3 font-semibold">Evidências</th>
                  <th className="px-4 py-3 font-semibold">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((insight) => (
                  <tr
                    key={insight.id}
                    className="cursor-pointer border-t transition-colors hover:bg-[var(--bg-muted)]"
                    style={{ borderColor: "var(--bg-muted-2)" }}
                    onClick={() => router.push(`/insights/${insight.id}`)}
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--fg-subtle)]">
                      {getInsightDisplayId(insight) ?? "Insight"}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[var(--fg)]">{insight.title}</div>
                      <div className="mt-0.5 line-clamp-1 text-[13px] text-[var(--fg-faint)]">
                        {insight.description}
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-[13px] text-[var(--fg-muted)]">
                      {formatScore(insight.confidenceScore)}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[var(--fg-muted)]">
                      {insight.evidenceIds.length === 0
                        ? "Sem vínculo"
                        : `${insight.evidenceIds.filter((id) => getEvidence(id)).length} vinculada(s)`}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[var(--fg-subtle)]">
                      {formatDate(insight.updatedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function formatScore(value?: number | null) {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  return `${Math.round(value * 100)}%`;
}
