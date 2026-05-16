"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Bookmark, Plus } from "lucide-react";
import { type PainStatus, statusConfig } from "@/lib/dores-data";
import { useDores } from "@/lib/dores-store";
import { DoresToolbar, type ViewMode } from "@/components/dores/dores-toolbar";
import { PainBoard } from "@/components/dores/pain-board";
import { PainList } from "@/components/dores/pain-list";
import { PainFlow } from "@/components/dores/pain-flow";

import { useProducts } from "@/lib/products-context";

export default function DoresPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { pains: allPains, moveStatus, createPain } = useDores();
  const pains = useMemo(
    () => allPains.filter((p) => p.productId === currentProduct.id),
    [allPains, currentProduct.id],
  );
  const [view, setView] = useState<ViewMode>("board");

  const counts = useMemo(() => {
    const total = pains.length;
    const ativas = pains.filter((p) => !["validada", "descartada"].includes(p.status)).length;
    const descartada = pains.filter((p) => p.status === "descartada").length;
    return { total, ativas, descartada };
  }, [pains]);

  const handleMove = (id: string, status: PainStatus) => {
    moveStatus(id, status);
    toast.success(`Movida para "${statusConfig[status].label}"`);
  };

  const handleCreate = () => {
    const created = createPain(currentProduct.id);
    toast.success("Nova dor criada");
    router.push(`/dores/${created.id}?new=1`);
  };

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[13px]" style={{ color: "var(--fg-faint)" }}>
            <Link href="/dashboard" className="hover:underline">
              Discovery
            </Link>{" "}
            <span className="mx-1">›</span> <span style={{ color: "var(--fg-muted)" }}>Dores</span>
          </div>
          <h1
            className="mt-1 text-[28px] font-semibold tracking-tight"
            style={{ color: "var(--fg)" }}
          >
            Dores
          </h1>
          <div className="mt-1 text-[13px]" style={{ color: "var(--fg-subtle)" }}>
            <span className="font-mono">{counts.total} dores</span>
            <Sep /> <span className="font-mono">{counts.ativas} ativas</span>
            <Sep /> <span className="font-mono">{counts.descartada} descartada(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <Download size={14} /> Exportar
          </button>
          <button
            className="inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <Bookmark size={14} /> Filtros salvos
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: "var(--primary)" }}
          >
            <Plus size={14} /> Nova dor
          </button>
        </div>
      </div>

      <div className="mt-5">
        <DoresToolbar view={view} onViewChange={setView} />
      </div>

      <div className="mt-5">
        {view === "board" && <PainBoard pains={pains} onMove={handleMove} />}
        {view === "list" && <PainList pains={pains} />}
        {view === "grid" && <PainList pains={pains} />}
        {view === "flow" && <PainFlow pains={pains} />}
        {view === "calendar" && (
          <div
            className="rounded-xl border p-10 text-center text-[13px]"
            style={{ borderColor: "var(--border)", color: "var(--fg-faint)" }}
          >
            Calendário em breve.
          </div>
        )}
      </div>
    </div>
  );
}

function Sep() {
  return (
    <span className="mx-1.5" style={{ color: "var(--fg-disabled)" }}>
      ·
    </span>
  );
}
