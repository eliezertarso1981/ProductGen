"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Columns3, ArrowRight } from "lucide-react";
import { useProducts } from "@/lib/products-context";
import { useStrategy } from "@/lib/strategy-store";
import { formatPeriod, periodKey } from "@/lib/strategy-data";

export default function PilaresPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { ready, pillarsByProduct, okrsByPillar, createPillar } = useStrategy();
  const [filter, setFilter] = useState<string>("all");

  const pillars = useMemo(
    () => pillarsByProduct(currentProduct.id),
    [pillarsByProduct, currentProduct.id],
  );

  const periodOptions = useMemo(() => {
    const set = new Map<string, string>();
    pillars.forEach((p) => set.set(periodKey(p.period), formatPeriod(p.period)));
    return Array.from(set.entries());
  }, [pillars]);

  const filtered = useMemo(
    () => (filter === "all" ? pillars : pillars.filter((p) => periodKey(p.period) === filter)),
    [pillars, filter],
  );

  const handleCreate = () => {
    const p = createPillar(currentProduct.id);
    toast.success("Pilar criado");
    router.push(`/pilares/${p.id}?new=1`);
  };

  if (!ready) return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[13px]" style={{ color: "var(--fg-faint)" }}>
            <Link href="/dashboard" className="hover:underline">Estratégia</Link>
            <span className="mx-1">›</span>
            <span style={{ color: "var(--fg-muted)" }}>Pilares</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight" style={{ color: "var(--fg)" }}>
            Pilares
          </h1>
          <div className="mt-1 font-mono text-[13px]" style={{ color: "var(--fg-subtle)" }}>
            {pillars.length} pilar(es)
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
            <Plus size={14} /> Novo pilar
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filtered.length === 0 && (
          <div
            className="col-span-full rounded-xl border border-dashed p-10 text-center text-[13px] text-[var(--fg-faint)]"
            style={{ borderColor: "var(--border-strong)" }}
          >
            Nenhum pilar para este período. Crie o primeiro para organizar sua estratégia.
          </div>
        )}
        {filtered.map((p) => {
          const okrs = okrsByPillar(p.id);
          return (
            <Link
              key={p.id}
              href={`/pilares/${p.id}`}
              className="group rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
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
                  <span className="font-mono text-[11px] text-[var(--fg-faint)]">{p.id}</span>
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
    </div>
  );
}
