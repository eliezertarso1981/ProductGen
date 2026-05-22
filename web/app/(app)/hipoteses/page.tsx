"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { FlaskConical } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import { getPainDisplayId } from "@/lib/dores-data";
import { useProducts } from "@/lib/products-context";
import {
  getHypothesisDisplayId,
  hypothesisStatusConfig,
  hypothesisStatuses,
  toStatusBoardColumns,
  type Hypothesis,
  type HypothesisStatus,
} from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDate, type ListingView } from "@/components/shared/crud-ui";
import { DiscoveryFilterBar } from "@/components/discovery/discovery-filter-bar";
import { StatusBoard } from "@/components/discovery/status-board";
import { cycleFilterValue } from "@/components/discovery/filter-helpers";
import { Avatar } from "@/components/shared/avatar";
import { EntityDrawer } from "@/components/shared/entity-drawer";
import { HypothesisDetailContent } from "@/components/hipoteses/hypothesis-detail-content";

export default function HipotesesPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { currentProduct } = useProducts();
  const { hypotheses, createHypothesis, updateHypothesis, experimentsByHypothesis } = useDiscovery();
  const { getPain } = useDores();
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ListingView>("board");
  const [statusFilter, setStatusFilter] = useState<"all" | HypothesisStatus>("all");
  const [originFilter, setOriginFilter] = useState<"all" | "linked" | "unlinked">("all");
  const selectedId = searchParams.get("detail");
  const items = useMemo(
    () => hypotheses.filter((h) => h.productId === currentProduct.id),
    [hypotheses, currentProduct.id],
  );
  const selectedHypothesis = useMemo(
    () => items.find((hypothesis) => hypothesis.id === selectedId),
    [items, selectedId],
  );
  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    return items.filter((h) => {
      const matchesSearch =
        !query ||
        [getHypothesisDisplayId(h), h.title, h.statement, hypothesisStatusConfig[h.status].label]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));
      const matchesStatus = statusFilter === "all" || h.status === statusFilter;
      const matchesOrigin =
        originFilter === "all" || (originFilter === "linked" ? Boolean(h.painId) : !h.painId);

      return matchesSearch && matchesStatus && matchesOrigin;
    });
  }, [items, originFilter, search, statusFilter]);
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
  const handleMove = (id: string, status: HypothesisStatus) => {
    updateHypothesis(id, { status });
    toast.success(`Movida para "${hypothesisStatusConfig[status].label}"`);
  };
  const boardColumns = toStatusBoardColumns(hypothesisStatuses, hypothesisStatusConfig);

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Discovery", href: "/dashboard" }, title: "Hipóteses" }}
        title="Hipóteses"
        count={`${items.length} hipóteses`}
        onCreate={() => {
          void createHypothesis(currentProduct.id)
            .then((h) => {
              router.push(`/hipoteses/${h.id}?new=1`);
            })
            .catch((error) => {
              toast.error(error instanceof Error ? error.message : "Não foi possível criar a hipótese");
            });
        }}
        createLabel="Nova hipótese"
      />

      <DiscoveryFilterBar
        chips={[
          {
            label: "Status",
            value:
              statusFilter === "all" ? undefined : hypothesisStatusConfig[statusFilter].label,
            active: statusFilter !== "all",
            onClick: () =>
              setStatusFilter(cycleFilterValue(statusFilter, hypothesisStatuses)),
          },
          {
            label: "Origem",
            value:
              originFilter === "all"
                ? undefined
                : originFilter === "linked"
                  ? "Com dor"
                  : "Sem dor",
            active: originFilter !== "all",
            onClick: () =>
              setOriginFilter(
                originFilter === "all" ? "linked" : originFilter === "linked" ? "unlinked" : "all",
              ),
          },
        ]}
        search={search}
        onSearchChange={setSearch}
        views={[
          { value: "list", label: "lista" },
          { value: "grid", label: "cards" },
          { value: "board", label: "kanban" },
        ]}
        activeView={view}
        onViewChange={setView}
        resultCount={visibleItems.length}
        hasActiveFilters={statusFilter !== "all" || originFilter !== "all" || search.trim() !== ""}
        onClear={() => {
          setSearch("");
          setStatusFilter("all");
          setOriginFilter("all");
        }}
      />

      <div className="mt-5">
        {visibleItems.length === 0 ? (
          <EmptyState
            title={items.length === 0 ? "Nenhuma hipótese ainda" : "Nenhuma hipótese encontrada"}
            hint={items.length === 0 ? "Hipóteses nascem a partir de uma dor. Comece criando uma." : "Ajuste a busca para ver mais resultados."}
          />
        ) : view === "board" ? (
          <StatusBoard<Hypothesis, HypothesisStatus>
            columns={boardColumns}
            items={visibleItems}
            getItemId={(h) => h.id}
            getItemStatus={(h) => h.status}
            onSelect={(h) => openDetail(h.id)}
            onMove={handleMove}
            groupName="hypotheses"
            renderCard={(h) => {
              const pain = h.painId ? getPain(h.painId) : undefined;
              const expCount = experimentsByHypothesis(h.id).length;
              return (
                <>
                  <div className="flex items-center justify-between font-mono text-[11px] text-[var(--fg-faint)]">
                    <span>{getHypothesisDisplayId(h) ?? "Hipótese"}</span>
                    <span>{formatDate(h.updatedAt)}</span>
                  </div>
                  <div className="mt-1 font-semibold text-[var(--fg)]">{h.title}</div>
                  <p className="mt-1 line-clamp-2 text-[12px] text-[var(--fg-subtle)]">{h.statement}</p>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-[var(--fg-muted)]">
                    <span className="font-mono">{expCount} exp.</span>
                    {pain ? (
                      <span className="font-mono text-[var(--primary)]">{getPainDisplayId(pain) ?? "Dor"}</span>
                    ) : (
                      <span>Sem dor</span>
                    )}
                  </div>
                </>
              );
            }}
          />
        ) : (
          view === "grid" ? (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {visibleItems.map((h) => {
                const cfg = hypothesisStatusConfig[h.status];
                const pain = h.painId ? getPain(h.painId) : undefined;
                const expCount = experimentsByHypothesis(h.id).length;
                return (
                  <button
                    key={h.id}
                    type="button"
                    onClick={() => openDetail(h.id)}
                    className="rounded-xl border border-[#dde0e8] bg-[#ffffff] p-4 text-left transition-colors hover:border-[#c4c9d4] hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13c8b5]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[12px] text-[#6b7287]">
                        {getHypothesisDisplayId(h) ?? "Hipótese"}
                      </span>
                      <span className="inline-flex items-center gap-2 rounded-full border border-[#dde0e8] px-2 py-0.5 text-[12px] text-[#4e5567]">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        {cfg.label}
                      </span>
                    </div>
                    <div className="mt-3 text-[15px] font-semibold text-[#2b364a]">{h.title}</div>
                    <p className="mt-1 line-clamp-3 text-[13px] leading-5 text-[#6b7287]">{h.statement}</p>
                    <div className="mt-4 flex items-center justify-between gap-3 text-[12px] text-[#6b7287]">
                      <span className="font-mono">{expCount} experimento(s)</span>
                      {pain ? (
                        <span className="font-mono text-[#13c8b5]">{getPainDisplayId(pain) ?? "Dor"}</span>
                      ) : (
                        <span>Sem dor</span>
                      )}
                      <Avatar initials={h.owner.initials} color={h.owner.color} size={24} />
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
          <div className="overflow-x-auto rounded-xl border border-[#dde0e8] bg-[#ffffff]">
            <table className="w-full text-left text-sm">
              <thead>
                <tr
                  className="bg-[#f7f8fa] text-[11px] uppercase tracking-[0.04em] text-[#6b7287]"
                >
                  <th className="px-4 py-3 font-semibold">ID</th>
                  <th className="px-4 py-3 font-semibold">Hipótese</th>
                  <th className="px-4 py-3 font-semibold">Dor de origem</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Experimentos</th>
                  <th className="px-4 py-3 font-semibold">Atualizada</th>
                  <th className="px-4 py-3 font-semibold">Owner</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.map((h) => {
                  const cfg = hypothesisStatusConfig[h.status];
                  const pain = h.painId ? getPain(h.painId) : undefined;
                  const expCount = experimentsByHypothesis(h.id).length;
                  return (
                    <tr
                      key={h.id}
                      tabIndex={0}
                      className="cursor-pointer border-t border-[#eef0f4] transition-colors hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#13c8b5]"
                      onClick={() => openDetail(h.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          openDetail(h.id);
                        }
                      }}
                    >
                      <td className="px-4 py-3 font-mono text-[12px] text-[#6b7287]">
                        {getHypothesisDisplayId(h) ?? "Hipótese"}
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-semibold text-[#2b364a]">{h.title}</div>
                        <div className="mt-0.5 line-clamp-1 text-[13px] text-[#9aa0b1]">
                          {h.statement}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        {pain ? (
                          <Link
                            href={`/dores/${pain.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-mono text-[12px] text-[#13c8b5] hover:underline"
                          >
                            {getPainDisplayId(pain) ?? "Dor"}
                          </Link>
                        ) : (
                          <span className="text-[#c4c9d4]">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-[13px]">
                        <span className="inline-flex items-center gap-2 text-[#4e5567]">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-mono text-[13px] text-[#4e5567]">{expCount}</td>
                      <td className="px-4 py-3 text-[13px] text-[#6b7287]">
                        {formatDate(h.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <Avatar initials={h.owner.initials} color={h.owner.color} size={24} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          )
        )}
      </div>
      <EntityDrawer
        open={Boolean(selectedHypothesis)}
        title={selectedHypothesis?.title ?? "Detalhe da hipótese"}
        subtitle={selectedHypothesis ? getHypothesisDisplayId(selectedHypothesis) ?? "Hipótese" : undefined}
        status={
          selectedHypothesis ? (
            <span className="inline-flex items-center gap-2 rounded-full border border-[#dde0e8] px-2.5 py-1 text-[12px] text-[#4e5567]">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: hypothesisStatusConfig[selectedHypothesis.status].dot }}
              />
              {hypothesisStatusConfig[selectedHypothesis.status].label}
            </span>
          ) : undefined
        }
        entityIcon={<FlaskConical size={16} color="#7c3aed" aria-hidden />}
        onClose={closeDetail}
      >
        {selectedHypothesis && (
          <HypothesisDetailContent id={selectedHypothesis.id} onDeleted={closeDetail} />
        )}
      </EntityDrawer>
    </div>
  );
}

