"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Download, Plus } from "lucide-react";
import { getPainDisplayId, type Pain, type PainStatus, statusConfig } from "@/lib/dores-data";
import { useDores } from "@/lib/dores-store";
import { DoresToolbar, type ViewMode } from "@/components/dores/dores-toolbar";
import { PainBoard } from "@/components/dores/pain-board";
import { PainList } from "@/components/dores/pain-list";
import { PainFlow } from "@/components/dores/pain-flow";

import { useProducts } from "@/lib/products-context";
import { useDiscovery } from "@/lib/discovery-store";

export default function DoresPage() {
  const router = useRouter();
  const { currentProduct } = useProducts();
  const { pains: allPains, moveStatus, createPain } = useDores();
  const { hypothesesByPain, experimentsByHypothesis, evidencesByExperiment } = useDiscovery();
  const productPains = useMemo(() => {
    return allPains
      .filter((p) => p.productId === currentProduct.id)
      .map((pain) => {
        const linkedHypotheses = hypothesesByPain(pain.id);
        const linkedExperiments = linkedHypotheses.flatMap((hypothesis) => experimentsByHypothesis(hypothesis.id));
        const linkedEvidences = linkedExperiments.flatMap((experiment) => evidencesByExperiment(experiment.id));

        return {
          ...pain,
          evidences: linkedEvidences.length,
          hypotheses: linkedHypotheses.length,
        };
      });
  }, [allPains, currentProduct.id, evidencesByExperiment, experimentsByHypothesis, hypothesesByPain]);
  const [view, setView] = useState<ViewMode>("board");
  const [search, setSearch] = useState("");
  const [personaFilter, setPersonaFilter] = useState("all");
  const [severityFilter, setSeverityFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState<PainStatus | "active" | "all">("all");

  const pains = useMemo(() => {
    const query = search.trim().toLowerCase();
    return productPains.filter((pain) => {
      const matchesSearch =
        !query ||
        [
          getPainDisplayId(pain),
          pain.title,
          pain.description,
          statusConfig[pain.status].label,
          pain.owner.name,
          pain.owner.initials,
        ]
          .filter(Boolean)
          .some((value) => value!.toLowerCase().includes(query));

      const matchesPersona =
        personaFilter === "all" || pain.personas.some((persona) => persona.id === personaFilter);
      const matchesOwner = ownerFilter === "all" || pain.owner.id === ownerFilter;
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" ? pain.status !== "descartada" : pain.status === statusFilter);
      const matchesSeverity =
        severityFilter === "all" ||
        (severityFilter === "4-5" && pain.severity >= 4) ||
        (severityFilter === "3-5" && pain.severity >= 3) ||
        (severityFilter === "1-2" && pain.severity <= 2);

      return matchesSearch && matchesPersona && matchesOwner && matchesStatus && matchesSeverity;
    });
  }, [ownerFilter, personaFilter, productPains, search, severityFilter, statusFilter]);

  const counts = useMemo(() => {
    const total = productPains.length;
    const ativas = productPains.filter((p) => !["validada", "descartada"].includes(p.status)).length;
    const descartada = productPains.filter((p) => p.status === "descartada").length;
    return { total, ativas, descartada };
  }, [productPains]);

  const handleMove = (id: string, status: PainStatus) => {
    moveStatus(id, status);
    toast.success(`Movida para "${statusConfig[status].label}"`);
  };

  const handleCreate = () => {
    void createPain(currentProduct.id)
      .then((created) => {
        toast.success("Nova dor criada");
        router.push(`/dores/${created.id}?new=1`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível criar a dor");
      });
  };

  const handleExport = () => {
    const rows = pains.map((pain) => ({
      codigo: getPainDisplayId(pain) ?? "",
      titulo: pain.title,
      descricao: pain.description,
      status: statusConfig[pain.status].label,
      severidade: String(pain.severity),
      reach: String(pain.reach),
      evidencias: String(pain.evidences),
      hipoteses: String(pain.hypotheses),
      owner: pain.owner.name ?? pain.owner.initials,
      responsaveis: pain.responsibles.map((owner) => owner.name ?? owner.initials).join("; "),
      personas: pain.personas.map((persona) => persona.id).join("; "),
      criado_em: pain.createdAt,
      atualizado_em: pain.updatedAt,
    }));
    downloadCsv(`dores-${currentProduct.id}.csv`, rows);
    toast.success("Planilha de dores exportada");
  };

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dde0e8] bg-[#ffffff] pb-5">
        <div>
          <div className="text-[13px] text-[#9aa0b1]">
            <Link href="/dashboard" className="hover:text-[#4e5567] hover:underline">
              Discovery
            </Link>{" "}
            <span className="mx-1 text-[#c4c9d4]">›</span> <span className="font-medium text-[#4e5567]">Dores</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a]">
            Dores
          </h1>
          <div className="mt-1 text-[13px] text-[#6b7287]">
            <span className="font-mono">{counts.total} dores</span>
            <Sep /> <span className="font-mono">{counts.ativas} ativas</span>
            <Sep /> <span className="font-mono">{counts.descartada} descartada(s)</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex h-10 items-center gap-2 rounded-md border border-[#dde0e8] bg-[#ffffff] px-4 text-[14px] font-medium text-[#2b364a] hover:bg-[#f7f8fa]"
            type="button"
          >
            <Download size={16} /> Exportar
          </button>
          <button
            onClick={handleCreate}
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#13c8b5] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#21a3a3]"
            type="button"
          >
            <Plus size={16} /> Nova dor
          </button>
        </div>
      </div>

      <div className="mt-5">
        <DoresToolbar
          view={view}
          onViewChange={setView}
          search={search}
          onSearchChange={setSearch}
          personaFilter={personaFilter}
          onPersonaFilterChange={setPersonaFilter}
          severityFilter={severityFilter}
          onSeverityFilterChange={setSeverityFilter}
          ownerFilter={ownerFilter}
          onOwnerFilterChange={setOwnerFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onClearFilters={() => {
            setSearch("");
            setPersonaFilter("all");
            setSeverityFilter("all");
            setOwnerFilter("all");
            setStatusFilter("all");
          }}
        />
      </div>

      <div className="mt-5">
        {view === "board" && <PainBoard pains={pains} onMove={handleMove} />}
        {view === "list" && <PainList pains={pains} />}
        {view === "flow" && <PainFlow pains={pains} />}
        {view === "calendar" && <PainCalendar pains={pains} />}
      </div>
    </div>
  );
}

function Sep() {
  return (
    <span className="mx-1.5 text-[#c4c9d4]">
      ·
    </span>
  );
}

function downloadCsv(filename: string, rows: Record<string, string>[]) {
  const headers = Object.keys(rows[0] ?? {
    codigo: "",
    titulo: "",
    descricao: "",
    status: "",
    severidade: "",
    reach: "",
    evidencias: "",
    hipoteses: "",
    owner: "",
    responsaveis: "",
    personas: "",
    criado_em: "",
    atualizado_em: "",
  });
  const csv = [
    headers.join(","),
    ...rows.map((row) => headers.map((header) => csvCell(row[header] ?? "")).join(",")),
  ].join("\n");
  const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function csvCell(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function PainCalendar({ pains }: { pains: Pain[] }) {
  const days = useMemo(() => buildCalendarDays(pains), [pains]);

  return (
    <div className="overflow-hidden rounded-xl border border-[#dde0e8] bg-[#ffffff]">
      <div className="grid grid-cols-7 border-b border-[#dde0e8] bg-[#f7f8fa] text-center text-[11px] font-semibold uppercase tracking-[0.04em] text-[#6b7287]">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((day) => (
          <div key={day} className="px-2 py-3">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => (
          <div
            key={day.key}
            className="min-h-[128px] border-r border-t border-[#eef0f4] p-2 last:border-r-0"
          >
            <div className="mb-2 text-[12px] font-semibold text-[#4e5567]">{day.label}</div>
            <div className="space-y-1.5">
              {day.items.map((pain) => {
                const cfg = statusConfig[pain.status];
                return (
                  <Link
                    key={pain.id}
                    href={`/dores/${pain.id}`}
                    className="block rounded-md border border-[#dde0e8] bg-[#ffffff] px-2 py-1.5 text-left transition-colors hover:bg-[#f7f8fa] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#13c8b5]"
                  >
                    <span className="flex items-center gap-1.5 text-[11px] font-medium text-[#4e5567]">
                      <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                      <span className="font-mono">{getPainDisplayId(pain) ?? "Dor"}</span>
                    </span>
                    <span className="mt-0.5 block truncate text-[12px] font-semibold text-[#2b364a]">
                      {pain.title}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function buildCalendarDays(pains: Pain[]) {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  start.setDate(start.getDate() - start.getDay());

  return Array.from({ length: 35 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const key = date.toISOString().slice(0, 10);
    return {
      key,
      label: date.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      items: pains.filter((pain) => (pain.dueDate ?? pain.updatedAt ?? pain.createdAt).slice(0, 10) === key),
    };
  });
}
