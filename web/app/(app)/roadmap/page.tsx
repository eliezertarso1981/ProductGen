"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import { useProducts } from "@/lib/products-context";
import { roadmapStatuses, roadmapStatusConfig } from "@/lib/discovery-data";
import { PageHeader, EmptyState, formatDateOnly } from "@/components/shared/crud-ui";
import { Avatar } from "@/components/shared/avatar";

export default function RoadmapPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { roadmap, createRoadmap } = useDiscovery();
  const { getPain } = useDores();
  const items = useMemo(
    () => roadmap.filter((r) => r.productId === currentProduct.id),
    [roadmap, currentProduct.id],
  );

  return (
    <div className="px-6 py-5">
      <PageHeader
        crumb={{ parent: { label: "Delivery", href: "/dashboard" }, title: "Roadmap" }}
        title="Roadmap"
        count={`${items.length} itens`}
        onCreate={() => {
          const r = createRoadmap(currentProduct.id);
          router.push(`/roadmap/${r.id}?new=1`);
        }}
        createLabel="Novo item"
      />

      <div className="mt-5">
        {items.length === 0 ? (
          <EmptyState
            title="Roadmap vazio"
            hint="Itens de roadmap nascem de dores validadas."
          />
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {roadmapStatuses.map((s) => {
              const cfg = roadmapStatusConfig[s];
              const col = items.filter((i) => i.status === s);
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
                        <Link
                          key={r.id}
                          href={`/roadmap/${r.id}`}
                          className="rounded-lg border bg-white p-3 text-[13px] hover:bg-[var(--bg-muted)]"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <div className="flex items-center justify-between font-mono text-[11px] text-[var(--fg-faint)]">
                            <span>{r.id}</span>
                            <span>{formatDateOnly(r.targetDate)}</span>
                          </div>
                          <div className="mt-1 font-semibold text-[var(--fg)]">{r.title}</div>
                          <div className="mt-2 flex items-center justify-between">
                            {pain ? (
                              <span className="inline-flex items-center gap-1 rounded bg-[var(--warn-soft)] px-1.5 py-0.5 text-[11px] text-[var(--warn-strong)]">
                                Dor {pain.id}
                              </span>
                            ) : (
                              <span />
                            )}
                            <Avatar initials={r.owner.initials} color={r.owner.color} size={20} />
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
