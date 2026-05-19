"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Target } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { useStrategy } from "@/lib/strategy-store";
import { formatPeriod, getOKRDisplayId, okrProgress, okrStatusConfig, periodKey } from "@/lib/strategy-data";
import { ListingToolbar, type ListingView } from "@/components/shared/crud-ui";

export default function OkrsPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { ready, okrsByProduct, getPillar, createOKR } = useStrategy();
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [view, setView] = useState<ListingView>("grid");

  const okrs = useMemo(() => okrsByProduct(currentProduct.id), [okrsByProduct, currentProduct.id]);

  const periodOptions = useMemo(() => {
    const map = new Map<string, string>();
    okrs.forEach((o) => map.set(periodKey(o.period), formatPeriod(o.period)));
    return Array.from(map.entries());
  }, [okrs]);

  const filtered = useMemo(() => {
    const periodFiltered = filter === "all" ? okrs : okrs.filter((o) => periodKey(o.period) === filter);
    const query = search.trim().toLowerCase();
    if (!query) return periodFiltered;
    return periodFiltered.filter((o) => {
      const pillar = o.pillarId ? getPillar(o.pillarId) : undefined;
      return [getOKRDisplayId(o), o.objective, formatPeriod(o.period), okrStatusConfig[o.status].label, pillar?.name]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query));
    });
  }, [okrs, filter, search, getPillar]);

  const handleCreate = () => {
    void createOKR(currentProduct.id)
      .then((o) => {
        toast.success("OKR criado");
        router.push(`/okrs/${o.id}?new=1`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível criar o OKR");
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
            <span className="font-medium text-[#4e5567]">OKRs</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a]">
            OKRs
          </h1>
          <div className="mt-1 font-mono text-[13px] text-[#6b7287]">
            {okrs.length} objetivo(s)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#13c8b5] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#21a3a3]"
            type="button"
          >
            <Plus size={16} /> Novo OKR
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
            Nenhum OKR para este período.
          </div>
        ) : view === "list" ? (
          <div className="overflow-x-auto rounded-xl border border-[#dde0e8] bg-white">
            <div className="min-w-[960px]">
              <div className="grid grid-cols-[120px_minmax(240px,1fr)_160px_160px_130px_180px] gap-3 border-b border-[#dde0e8] bg-[#f7f8fa] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7287]">
                <span>Código</span>
                <span>Objetivo</span>
                <span>Período / status</span>
                <span>Pilar</span>
                <span>Progresso</span>
                <span>Key results</span>
              </div>
              <div className="divide-y divide-[#dde0e8]">
                {filtered.map((o) => {
                  const cfg = okrStatusConfig[o.status];
                  const progress = okrProgress(o);
                  const pillar = o.pillarId ? getPillar(o.pillarId) : undefined;
                  const firstKr = o.keyResults[0];

                  return (
                    <Link
                      key={o.id}
                      href={`/okrs/${o.id}`}
                      className="grid grid-cols-[120px_minmax(240px,1fr)_160px_160px_130px_180px] gap-3 px-4 py-3 text-left transition-colors hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#13c8b5]"
                    >
                      <span className="font-mono text-[12px] text-[#6b7287]">
                        {getOKRDisplayId(o) ?? "OKR"}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-[14px] font-semibold text-[#2b364a]">
                          {o.objective}
                        </span>
                        {o.description && (
                          <span className="mt-1 block truncate text-[12px] text-[#6b7287]">
                            {o.description}
                          </span>
                        )}
                      </span>
                      <span className="space-y-1">
                        <span className="block text-[13px] text-[#4e5567]">{formatPeriod(o.period)}</span>
                        <span className="inline-flex items-center gap-1.5 rounded-full border border-[#dde0e8] px-2 py-0.5 text-[11px] text-[#4e5567]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </span>
                      <span className="min-w-0">
                        {pillar ? (
                          <span className="inline-flex max-w-full items-center gap-1.5 text-[12px] text-[#4e5567]">
                            <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: pillar.color }} />
                            <span className="truncate">{pillar.name}</span>
                          </span>
                        ) : (
                          <span className="text-[12px] text-[#9aa0b1]">Sem pilar</span>
                        )}
                      </span>
                      <span>
                        <span className="mb-1 flex items-center justify-between text-[11px] text-[#6b7287]">
                          <span>Resultado</span>
                          <span className="font-mono">{progress}%</span>
                        </span>
                        <span className="block h-1.5 w-full overflow-hidden rounded-full bg-[#eef0f4]">
                          <span
                            className="block h-full rounded-full transition-all"
                            style={{ width: `${progress}%`, backgroundColor: cfg.dot }}
                          />
                        </span>
                      </span>
                      <span className="min-w-0 text-[12px] text-[#4e5567]">
                        <span className="block font-mono text-[11px] text-[#6b7287]">
                          {o.keyResults.length} key result(s)
                        </span>
                        {firstKr && <span className="mt-1 block truncate">{firstKr.title}</span>}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {filtered.map((o) => {
              const cfg = okrStatusConfig[o.status];
              const progress = okrProgress(o);
              const pillar = o.pillarId ? getPillar(o.pillarId) : undefined;
              return (
                <Link
                  key={o.id}
                  href={`/okrs/${o.id}`}
                  className="rounded-xl border border-[#dde0e8] bg-white p-4 transition-colors hover:border-[#c4c9d4]"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                        style={{ backgroundColor: "var(--primary-soft-2)", color: "var(--primary)" }}>
                        <Target size={14} />
                      </span>
                      <span className="font-mono text-[11px] text-[var(--fg-faint)]">
                        {getOKRDisplayId(o) ?? "OKR"}
                      </span>
                    </div>
                    <span className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--fg-muted)]"
                      style={{ borderColor: "var(--border)" }}>
                      {formatPeriod(o.period)}
                    </span>
                  </div>
                  <div className="mt-3 text-[15px] font-semibold text-[var(--fg)]">{o.objective}</div>
                  {pillar && (
                    <div className="mt-1 inline-flex items-center gap-1.5 text-[11px] text-[var(--fg-subtle)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
                      {pillar.name}
                    </div>
                  )}
                  <div className="mt-4">
                    <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--fg-faint)]">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        {cfg.label}
                      </span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted-2)" }}>
                      <div className="h-full rounded-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: cfg.dot }} />
                    </div>
                  </div>
                  <div className="mt-3 font-mono text-[11px] text-[var(--fg-subtle)]">
                    {o.keyResults.length} key result(s)
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
