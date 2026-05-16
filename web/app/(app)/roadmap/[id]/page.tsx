"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2 } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import { roadmapStatuses, roadmapStatusConfig } from "@/lib/discovery-data";
import {
  BackLink,
  Field,
  Select,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";

export default function RoadmapDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const { ready, getRoadmap, updateRoadmap, deleteRoadmap } = useDiscovery();
  const { getPain } = useDores();

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  const r = getRoadmap(id);
  if (!r)
    return (
      <div className="px-6 py-10">
        <Link href="/roadmap" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Item não encontrado.</p>
      </div>
    );

  const pain = r.painId ? getPain(r.painId) : undefined;

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <BackLink href="/roadmap" label="Roadmap" />
        <button
          onClick={() => {
            if (confirm("Excluir este item?")) {
              deleteRoadmap(r.id);
              router.push("/roadmap");
            }
          }}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] text-[var(--danger)] hover:bg-[var(--danger-soft)]"
          style={{ borderColor: "var(--danger-border)" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{r.id}</div>
          <input
            ref={titleRef}
            value={r.title}
            onChange={(e) => updateRoadmap(r.id, { title: e.target.value })}
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Descrição
            </div>
            <Textarea
              rows={5}
              value={r.description}
              onChange={(e) => updateRoadmap(r.id, { description: e.target.value })}
              placeholder="Escopo, hipótese de valor e critérios de pronto."
            />
          </div>
        </div>

        <aside className="space-y-5">
          <Field label="Coluna">
            <Select
              value={r.status}
              onChange={(s) => updateRoadmap(r.id, { status: s })}
              options={roadmapStatuses.map((s) => ({
                value: s,
                label: roadmapStatusConfig[s].label,
                dot: roadmapStatusConfig[s].dot,
              }))}
            />
          </Field>

          <Field label="Dor de origem">
            {pain ? (
              <Link
                href={`/dores/${pain.id}`}
                className="block rounded-md border bg-white p-2.5 text-[13px] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="font-mono text-[11px] text-[var(--fg-faint)]">{pain.id}</div>
                <div className="mt-0.5 text-[var(--fg)]">{pain.title}</div>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--fg-faint)]">Sem dor vinculada.</p>
            )}
          </Field>

          <Field label="Data prevista">
            <TextInput
              type="date"
              value={r.targetDate ? r.targetDate.slice(0, 10) : ""}
              onChange={(e) =>
                updateRoadmap(r.id, {
                  targetDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
          </Field>

          <Field label="Atualizado">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(r.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}
