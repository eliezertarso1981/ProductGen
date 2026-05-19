"use client";

import { useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Map } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import { getPainDisplayId } from "@/lib/dores-data";
import { useProducts } from "@/lib/products-context";
import { getRoadmapDisplayId, roadmapStatuses, roadmapStatusConfig } from "@/lib/discovery-data";
import {
  PageHeader,
  EmptyState,
  ListingToolbar,
  formatDateOnly,
  type ListingView,
} from "@/components/shared/crud-ui";
import { Avatar } from "@/components/shared/avatar";
import { EntityDrawer } from "@/components/shared/entity-drawer";
import { RoadmapDetailContent } from "@/components/roadmap/roadmap-detail-content";

export default function RoadmapPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentProduct } = useProducts();
  const { roadmap, createRoadmap } = useDiscovery();
  const { getPain } = useDores();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ListingView>("board");
  const selectedId = searchParams.get("detail");
  const items = useMemo(
    () => roadmap.filter((r) => r.productId === currentProduct.id),
    [roadmap, currentProduct.id],
  );
  const selectedRoadmap = useMemo(
    () => items.find((item) => item.id === selectedId),
    [items, selectedId],
  );
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return items;
    return items.filter((r) =>
      [getRoadmapDisplayId(r), r.title, roadmapStatusConfig[r.status].label, formatDateOnly(r.targetDate)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [items, search]);
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("detail");
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, { scroll: false });
  };
  const openDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("detail", id);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Delivery", href: "/dashboard" }, title: "Roadmap" }}
        title="Roadmap"
        count={`${items.length} itens`}
        onCreate={() => {
          void createRoadmap(currentProduct.id)
            .then((r) => {
              router.push(`/roadmap/${r.id}?new=1`);
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar o item de roadmap");
            });
        }}
        createLabel="Novo item"
      />

      <ListingToolbar
        filters={roadmapStatuses.map((status) => ({
          label: roadmapStatusConfig[status].label,
          value: String(visibleItems.filter((item) => item.status === status).length),
        }))}
        search={search}
        onSearchChange={setSearch}
        views={[
          { value: "board", label: "board" },
          { value: "list", label: "lista" },
        ]}
        activeView={view}
        onViewChange={setView}
      />

      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Roadmap vazio" : "Nenhum item encontrado"}
            hint={items.length === 0 ? "Itens de roadmap nascem de dores validadas." : "Ajuste a busca para ver mais resultados."}
          />
        ) : (
          view === "list" ? (
            <div className="overflow-hidden rounded-xl border border-[#dde0e8] bg-[#ffffff]">
              <div className="grid grid-cols-[120px_1fr_150px_140px_52px] gap-3 border-b border-[#dde0e8] bg-[#f7f8fa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7287]">
                <span>Código</span>
                <span>Item</span>
                <span>Status</span>
                <span>Data alvo</span>
                <span className="text-right">Owner</span>
              </div>
              <div className="divide-y divide-[#dde0e8]">
                {visibleItems.map((r) => {
                  const cfg = roadmapStatusConfig[r.status];
                  const pain = r.painId ? getPain(r.painId) : undefined;
                  return (
                    <button
                      key={r.id}
                      type="button"
                      onClick={() => openDetail(r.id)}
                      className="grid w-full grid-cols-[120px_1fr_150px_140px_52px] gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#13c8b5]"
                    >
                      <span className="font-mono text-[12px] text-[#6b7287]">
                        {getRoadmapDisplayId(r) ?? "Roadmap"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-[#2b364a]">
                          {r.title}
                        </span>
                        {pain && (
                          <span className="mt-1 block truncate text-[12px] text-[#6b7287]">
                            {getPainDisplayId(pain) ? `Dor ${getPainDisplayId(pain)}` : "Dor vinculada"}
                          </span>
                        )}
                      </span>
                      <span>
                        <span className="inline-flex items-center gap-2 rounded-full border border-[#dde0e8] px-2.5 py-1 text-[12px] font-medium text-[#4e5567]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </span>
                      <span className="text-[13px] text-[#4e5567]">{formatDateOnly(r.targetDate)}</span>
                      <span className="flex justify-end">
                        <Avatar initials={r.owner.initials} color={r.owner.color} size={24} />
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roadmapStatuses.map((s) => {
              const cfg = roadmapStatusConfig[s];
              const col = visibleItems.filter((i) => i.status === s);
              return (
                <div key={s} className="flex flex-col rounded-xl">
                  <div
                    className="flex items-center justify-between rounded-t-xl px-3 py-2"
                    style={{ backgroundColor: "var(--bg-muted)" }}
                  >
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <span className="text-[14px] font-semibold text-[var(--fg)]">{cfg.label}</span>
                      <span className="text-[12px] text-[var(--fg-faint)]">({col.length})</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2 rounded-b-xl p-2">
                    {col.length === 0 && (
                      <div className="px-2 py-3 text-[12px] text-[var(--border-strong)]">Vazio</div>
                    )}
                    {col.map((r) => {
                      const pain = r.painId ? getPain(r.painId) : undefined;
                      return (
                        <button
                          key={r.id}
                          type="button"
                          onClick={() => openDetail(r.id)}
                          className="rounded-lg border border-[#dde0e8] bg-white p-3 text-left text-[13px] transition-colors hover:border-[#c4c9d4] hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13c8b5]"
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] text-[var(--fg-faint)]">
                            <span>{getRoadmapDisplayId(r) ?? "Roadmap"}</span>
                            <span>{formatDateOnly(r.targetDate)}</span>
                          </div>
                          <div className="mt-1 font-semibold text-[var(--fg)]">{r.title}</div>
                          <div className="mt-2 flex items-center justify-between">
                            {pain ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[var(--warn-soft)] px-1.5 py-0.5 text-[11px] text-[var(--warn-strong)]">
                                {getPainDisplayId(pain) ? `Dor ${getPainDisplayId(pain)}` : "Dor vinculada"}
                              </span>
                            ) : (
                              <span />
                            )}
                            <Avatar initials={r.owner.initials} color={r.owner.color} size={20} />
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
          )
        )}
      </div>
      <EntityDrawer
        open={Boolean(selectedRoadmap)}
        title={selectedRoadmap?.title ?? "Detalhe do roadmap"}
        subtitle={selectedRoadmap ? getRoadmapDisplayId(selectedRoadmap) ?? "Roadmap" : undefined}
        status={
          selectedRoadmap ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dde0e8] px-2.5 py-1 text-[12px] text-[#4e5567]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: roadmapStatusConfig[selectedRoadmap.status].dot }}
              />
              {roadmapStatusConfig[selectedRoadmap.status].label}
            </span>
          ) : undefined
        }
        entityIcon={<Map size={16} color="#13c8b5" aria-hidden />}
        onClose={closeDetail}
      >
        {selectedRoadmap && (
          <RoadmapDetailContent id={selectedRoadmap.id} onDeleted={closeDetail} />
        )}
      </EntityDrawer>
    </div>
  );
}
