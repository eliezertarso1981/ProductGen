"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Target } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { useStrategy } from "@/lib/strategy-store";
import { formatPeriod, okrProgress, okrStatusConfig, periodKey } from "@/lib/strategy-data";

export default function OkrsPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { ready, okrsByProduct, getPillar, createOKR } = useStrategy();
  const [filter, setFilter] = useState("all");

  const okrs = useMemo(() => okrsByProduct(currentProduct.id), [okrsByProduct, currentProduct.id]);

  const periodOptions = useMemo(() => {
    const map = new Map<string, string>();
    okrs.forEach((o) => map.set(periodKey(o.period), formatPeriod(o.period)));
    return Array.from(map.entries());
  }, [okrs]);

  const filtered = useMemo(
    () => (filter === "all" ? okrs : okrs.filter((o) => periodKey(o.period) === filter)),
    [okrs, filter],
  );

  const handleCreate = () => {
    const o = createOKR(currentProduct.id);
    toast.success("OKR criado");
    router.push(`/okrs/${o.id}?new=1`);
  };

  if (!ready) return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[13px]" style={{ color: "var(--fg-faint)" }}>
            <Link href="/dashboard" className="hover:underline">Estratégia</Link>
            <span className="mx-1">›</span>
            <span style={{ color: "var(--fg-muted)" }}>OKRs</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>
            OKRs
          </h1>
          <div className="mt-1 font-mono text-[13px]" style={{ color: "var(--fg-subtle)" }}>
            {okrs.length} objetivo(s)
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-md border bg-white px-2.5 py-1.5 text-[13px] outline-none focus:border-[var(--primary)]"
            style={{ borderColor: "var(--border)" }}
          >
            <option value="all">Todos os períodos</option>
            {periodOptions.map(([k, label]) => (
              <option key={k} value={k}>{label}</option>
            ))}
          </select>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus size={14} /> Novo OKR
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2">
        {filtered.length === 0 && (
          <div
            className="col-span-full rounded-xl border border-dashed p-10 text-center text-[13px] text-[var(--fg-faint)]"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Nenhum OKR para este período.
          </div>
        )}
        {filtered.map((o) => {
          const cfg = okrStatusConfig[o.status];
          const progress = okrProgress(o);
          const pillar = o.pillarId ? getPillar(o.pillarId) : undefined;
          return (
            <Link
              key={o.id}
              href={`/okrs/${o.id}`}
              className="rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md"
                    style={{ backgroundColor: "var(--primary-soft-2)", color: "var(--primary)" }}>
                    <Target size={14} />
                  </span>
                  <span className="font-mono text-[11px] text-[var(--fg-faint)]">{o.id}</span>
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
    </div>
  );
}
