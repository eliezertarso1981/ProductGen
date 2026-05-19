"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Columns3, ArrowRight } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { useStrategy } from "@/lib/strategy-store";
import { formatPeriod, getPillarDisplayId, okrProgress, okrStatusConfig, periodKey } from "@/lib/strategy-data";
import { ListingToolbar, type ListingView } from "@/components/shared/crud-ui";

export default function PilaresPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { ready, pillarsByProduct, okrsByPillar, createPillar } = useStrategy();
  const [filter, setFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ListingView>("grid");

  const pillars = useMemo(
    () => pillarsByProduct(currentProduct.id),
    [pillarsByProduct, currentProduct.id],
  );

  const periodOptions = useMemo(() => {
    const set = new Map<string, string>();
    pillars.forEach((p) => set.set(periodKey(p.period), formatPeriod(p.period)));
    return Array.from(set.entries());
  }, [pillars]);

  const filtered = useMemo(() => {
    const periodFiltered = filter === "all" ? pillars : pillars.filter((p) => periodKey(p.period) === filter);
    const query = search.trim().toLowerCase();
    if (!query) return periodFiltered;
    return periodFiltered.filter((p) =>
      [getPillarDisplayId(p), p.name, p.description, formatPeriod(p.period)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [pillars, filter, search]);

  const handleCreate = () => {
    void createPillar(currentProduct.id)
      .then((p) => {
        toast.success("Pilar criado");
        router.push(`/pilares/${p.id}?new=1`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível criar o pilar");
      });
  };

  if (!ready) return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dde0e8] bg-[#ffffff] pb-5">
        <div>
          <div className="text-[13px] text-[#9aa0b1]">
            <Link href="/dashboard" className="hover:text-[#4e5567] hover:underline">Estratégia</Link>
            <span className="mx-1 text-[#c4c9d4]">›</span>
            <span className="font-medium text-[#4e5567]">Pilares</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a]">
            Pilares
          </h1>
          <div className="mt-1 font-mono text-[13px] text-[#6b7287]">
            {pillars.length} pilar(es)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#13c8b5] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#21a3a3]"
            type="button"
          >
            <Plus size={16} /> Novo pilar
          </button>
        </div>
      </div>

      <ListingToolbar
        filters={[
          { label: "Período", value: filter === "all" ? "Todos" : periodOptions.find(([key]) => key === filter)?.[1], active: filter !== "all", onClick: () => setFilter("all") },
          ...periodOptions.map(([key, label]) => ({ label, active: filter === key, onClick: () => setFilter(key) })),
        ]}
        search={search}
        onSearchChange={setSearch}
        views={[
          { value: "grid", label: "cards" },
          { value: "list", label: "lista" },
        ]}
        activeView={view}
        onViewChange={setView}
      />

      <div className="mt-6">
        {filtered.length === 0 ? (
          <div
            className="rounded-xl border border-dashed p-10 text-center text-[13px] text-[var(--fg-faint)]"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Nenhum pilar para este período. Crie o primeiro para organizar sua estratégia.
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-xl border border-[#dde0e8] bg-white">
            <div className="min-w-[1040px]">
              <div className="grid grid-cols-[120px_minmax(260px,1fr)_170px_220px_140px] gap-3 border-b border-[#dde0e8] bg-[#f7f8fa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7287]">
                <span>Código</span>
                <span>Pilar</span>
                <span>Horizonte</span>
                <span>Objetivos / OKRs</span>
                <span>Progresso</span>
              </div>
              <div className="divide-y divide-[#dde0e8]">
                {filtered.map((p) => {
                  const okrs = okrsByPillar(p.id);
                  const progress =
                    okrs.length > 0
                      ? Math.round(okrs.reduce((acc, okr) => acc + okrProgress(okr), 0) / okrs.length)
                      : 0;
                  const health =
                    okrs.find((okr) => okr.status === "off_track") ??
                    okrs.find((okr) => okr.status === "at_risk") ??
                    okrs.find((okr) => okr.status === "on_track") ??
                    okrs.find((okr) => okr.status === "concluido");
                  const healthConfig = health ? okrStatusConfig[health.status] : undefined;
                  const firstOkr = okrs[0];

                  return (
                    <Link
                      key={p.id}
                      href={`/pilares/${p.id}`}
                      className="grid grid-cols-[120px_minmax(260px,1fr)_170px_220px_140px] gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#13c8b5]"
                    >
                      <span className="font-mono text-[12px] text-[#6b7287]">
                        {getPillarDisplayId(p) ?? "Pilar"}
                      </span>
                      <span className="min-w-0">
                        <span className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                          <span className="block truncate text-[14px] font-semibold text-[#2b364a]">{p.name}</span>
                        </span>
                        {p.description && (
                          <span className="mt-1 block truncate text-[12px] text-[#6b7287]">
                            {p.description}
                          </span>
                        )}
                      </span>
                      <span className="space-y-1">
                        <span className="block text-[13px] text-[#4e5567]">{formatPeriod(p.period)}</span>
                        {healthConfig ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde0e8] px-2 py-0.5 text-[11px] text-[#4e5567]">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: healthConfig.dot }} />
                            {healthConfig.label}
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#9aa0b1]">Sem status</span>
                        )}
                      </span>
                      <span className="min-w-0 text-[12px] text-[#4e5567]">
                        <span className="block font-mono text-[11px] text-[#6b7287]">
                          {okrs.length} OKR(s)
                        </span>
                        {firstOkr ? (
                          <span className="mt-1 block truncate">{firstOkr.objective}</span>
                        ) : (
                          <span className="mt-1 block text-[#9aa0b1]">Nenhum OKR vinculado</span>
                        )}
                      </span>
                      <span>
                        <span className="mb-1 flex items-center justify-between text-[11px] text-[#6b7287]">
                          <span>Saúde</span>
                          <span className="font-mono">{progress}%</span>
                        </span>
                        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f4]">
                          <span
                            className="block h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: healthConfig?.dot ?? "var(--border-strong)" }}
                          />
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {filtered.map((p) => {
              const okrs = okrsByPillar(p.id);
              return (
                <Link
                  key={p.id}
                  href={`/pilares/${p.id}`}
                  className="group rounded-xl border bg-white p-4 transition-colors hover:border-[#c4c9d4]"
                  style={{ borderColor: "var(--border)", borderTop: `3px solid ${p.color}` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ backgroundColor: p.color, color: "white" }}
                      >
                        <Columns3 size={14} />
                      </span>
                      <span className="font-mono text-[11px] text-[var(--fg-faint)]">
                        {getPillarDisplayId(p) ?? "Pilar"}
                      </span>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--fg-muted)]"
                      style={{ borderColor: "var(--border)" }}>
                      {formatPeriod(p.period)}
                    </span>
                  </div>
                  <div className="mt-3 text-[15px] font-semibold text-[var(--fg)]">{p.name}</div>
                  {p.description && (
                    <p className="mt-1 line-clamp-2 text-[13px] text-[var(--fg-muted)]">{p.description}</p>
                  )}
                  <div className="mt-4 flex items-center justify-between text-[12px] text-[var(--fg-subtle)]">
                    <span className="font-mono">{okrs.length} OKR(s)</span>
                    <span className="inline-flex items-center gap-1 text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100">
                      Abrir <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
