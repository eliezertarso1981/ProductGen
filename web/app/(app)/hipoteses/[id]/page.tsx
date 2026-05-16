"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Plus } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { useDores } from "@/lib/dores-store";
import {
  hypothesisStatusConfig,
  hypothesisStatuses,
  experimentStatusConfig,
} from "@/lib/discovery-data";
import {
  BackLink,
  Field,
  Select,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";
import { VisualEvidence } from "@/components/hipoteses/visual-evidence";

export default function HypothesisDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const {
    ready,
    getHypothesis,
    updateHypothesis,
    deleteHypothesis,
    experimentsByHypothesis,
    createExperiment,
    createRoadmap,
  } = useDiscovery();
  const { getPain } = useDores();

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  const h = getHypothesis(id);
  if (!h)
    return (
      <div className="px-6 py-10">
        <Link href="/hipoteses" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Hipótese não encontrada.</p>
      </div>
    );

  const pain = h.painId ? getPain(h.painId) : undefined;
  const experiments = experimentsByHypothesis(h.id);

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <BackLink href="/hipoteses" label="Hipóteses" />
        <button
          onClick={() => {
            if (confirm("Excluir esta hipótese?")) {
              deleteHypothesis(h.id);
              router.push("/hipoteses");
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
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{h.id}</div>
          <input
            ref={titleRef}
            value={h.title}
            onChange={(e) => updateHypothesis(h.id, { title: e.target.value })}
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Enunciado
            </div>
            <Textarea
              rows={4}
              value={h.statement}
              onChange={(e) => updateHypothesis(h.id, { statement: e.target.value })}
              placeholder="Acreditamos que [solução] para [persona] vai gerar [resultado] e saberemos disso quando [métrica]."
            />
          </div>

          <VisualEvidence
            prototypes={h.prototypes}
            images={h.images}
            onChange={(patch) => updateHypothesis(h.id, patch)}
          />

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between gap-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Experimentos ({experiments.length})
              </div>
              <div className="flex items-center gap-2">
                <button
                  disabled={!h.painId}
                  onClick={() => {
                    if (!h.painId) return;
                    const r = createRoadmap(h.productId, h.painId, h.id);
                    router.push(`/roadmap/${r.id}?new=1`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ borderColor: "var(--border)" }}
                  title={!h.painId ? "Hipótese sem dor vinculada" : "Gerar item de roadmap"}
                >
                  <Plus size={12} /> Gerar item de roadmap
                </button>
                <button
                  onClick={() => {
                    const e = createExperiment(h.productId, h.id);
                    router.push(`/experimentos/${e.id}?new=1`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Plus size={12} /> Novo experimento
                </button>
              </div>
            </div>
            {experiments.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhum experimento ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {experiments.map((e) => {
                  const cfg = experimentStatusConfig[e.status];
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/experimentos/${e.id}`}
                        className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">{e.id}</span>
                          <span className="truncate text-[var(--fg)]">{e.title}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-[12px] text-[var(--fg-muted)]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <Field label="Status">
            <Select
              value={h.status}
              onChange={(s) => updateHypothesis(h.id, { status: s })}
              options={hypothesisStatuses.map((s) => ({
                value: s,
                label: hypothesisStatusConfig[s].label,
                dot: hypothesisStatusConfig[s].dot,
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

          <Field label="Owner">
            <div className="text-[13px] text-[var(--fg-muted)]">{h.owner.name ?? h.owner.initials}</div>
          </Field>
          <Field label="Atualizada em">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(h.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}
