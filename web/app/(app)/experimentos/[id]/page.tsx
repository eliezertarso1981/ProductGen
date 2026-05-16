"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Plus, Check, X } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import {
  experimentStatusConfig,
  experimentStatuses,
  experimentResultConfig,
  evidenceTypeConfig,
} from "@/lib/discovery-data";
import {
  BackLink,
  Field,
  Select,
  Textarea,
  TextInput,
  formatDate,
  formatDateOnly,
} from "@/components/shared/crud-ui";

export default function ExperimentDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const {
    ready,
    getExperiment,
    updateExperiment,
    deleteExperiment,
    setExperimentResult,
    getHypothesis,
    evidencesByExperiment,
    createEvidence,
  } = useDiscovery();

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  const exp = getExperiment(id);
  if (!exp)
    return (
      <div className="px-6 py-10">
        <Link href="/experimentos" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Experimento não encontrado.</p>
      </div>
    );

  const hyp = exp.hypothesisId ? getHypothesis(exp.hypothesisId) : undefined;
  const evidences = evidencesByExperiment(exp.id);

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <BackLink href="/experimentos" label="Experimentos" />
        <button
          onClick={() => {
            if (confirm("Excluir este experimento?")) {
              deleteExperiment(exp.id);
              router.push("/experimentos");
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
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{exp.id}</div>
          <input
            ref={titleRef}
            value={exp.title}
            onChange={(e) => updateExperiment(exp.id, { title: e.target.value })}
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Descrição
            </div>
            <Textarea
              rows={3}
              value={exp.description}
              onChange={(e) => updateExperiment(exp.id, { description: e.target.value })}
              placeholder="O que vamos testar e por quê."
            />
          </div>

          <div className="mt-4">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Método
            </div>
            <Textarea
              rows={2}
              value={exp.method}
              onChange={(e) => updateExperiment(exp.id, { method: e.target.value })}
              placeholder="Concierge MVP, A/B test, fake door, entrevistas, etc."
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Resultados esperados ({exp.expectedResults.length})
              </div>
              <button
                onClick={() =>
                  updateExperiment(exp.id, {
                    expectedResults: [...exp.expectedResults, ""],
                  })
                }
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <p className="mb-2 text-[12px] text-[var(--fg-subtle)]">
              Defina critérios mensuráveis que indicam sucesso. Você pode adicionar mais de um.
            </p>
            {exp.expectedResults.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhum resultado esperado definido.</p>
            ) : (
              <ul className="space-y-1.5">
                {exp.expectedResults.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span
                      aria-hidden
                      className="mt-2 inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full"
                      style={{ backgroundColor: "var(--primary)" }}
                    />
                    <Textarea
                      rows={1}
                      value={r}
                      onChange={(e) => {
                        const next = [...exp.expectedResults];
                        next[i] = e.target.value;
                        updateExperiment(exp.id, { expectedResults: next });
                      }}
                      placeholder="Ex.: ≥ 60% dos usuários completam a ação em < 30s"
                    />
                    <button
                      onClick={() =>
                        updateExperiment(exp.id, {
                          expectedResults: exp.expectedResults.filter((_, j) => j !== i),
                        })
                      }
                      className="mt-1 inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--fg-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                      aria-label="Remover resultado esperado"
                    >
                      <X size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="mt-6 rounded-lg border p-4" style={{ borderColor: "var(--border)" }}>
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Resultado
            </div>
            <p className="mb-3 text-[12px] text-[var(--fg-subtle)]">
              Definir o resultado conclui o experimento e atualiza o status da hipótese vinculada.
            </p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setExperimentResult(exp.id, "valida")}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] hover:bg-[var(--success-soft)]"
                style={{
                  borderColor: exp.result === "valida" ? "var(--success)" : "var(--border)",
                  color: "var(--success)",
                }}
              >
                <Check size={13} /> Valida hipótese
              </button>
              <button
                onClick={() => setExperimentResult(exp.id, "invalida")}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] hover:bg-[var(--danger-soft)]"
                style={{
                  borderColor: exp.result === "invalida" ? "var(--danger)" : "var(--border)",
                  color: "var(--danger)",
                }}
              >
                <X size={13} /> Invalida hipótese
              </button>
              <button
                onClick={() => setExperimentResult(exp.id, "inconclusivo")}
                className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] text-[var(--fg-subtle)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: exp.result === "inconclusivo" ? "var(--fg-faint)" : "var(--border)" }}
              >
                Inconclusivo
              </button>
            </div>
            {exp.result && (
              <p
                className="mt-3 text-[13px] font-semibold"
                style={{ color: experimentResultConfig[exp.result].color }}
              >
                {experimentResultConfig[exp.result].label}
              </p>
            )}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Evidências geradas ({evidences.length})
              </div>
              <button
                onClick={() => {
                  const ev = createEvidence(exp.productId, exp.id);
                  router.push(`/evidencias/${ev.id}?new=1`);
                }}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Nova evidência
              </button>
            </div>
            {evidences.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Sem evidências ainda.</p>
            ) : (
              <ul className="space-y-1.5">
                {evidences.map((ev) => {
                  const t = evidenceTypeConfig[ev.type];
                  return (
                    <li key={ev.id}>
                      <Link
                        href={`/evidencias/${ev.id}`}
                        className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">{ev.id}</span>
                          <span className="truncate text-[var(--fg)]">{ev.title}</span>
                        </span>
                        <span
                          className="rounded px-1.5 py-0.5 text-[11px] font-semibold"
                          style={{ backgroundColor: `${t.color}15`, color: t.color }}
                        >
                          {t.label}
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
              value={exp.status}
              onChange={(s) => updateExperiment(exp.id, { status: s })}
              options={experimentStatuses.map((s) => ({
                value: s,
                label: experimentStatusConfig[s].label,
                dot: experimentStatusConfig[s].dot,
              }))}
            />
          </Field>

          <Field label="Hipótese">
            {hyp ? (
              <Link
                href={`/hipoteses/${hyp.id}`}
                className="block rounded-md border bg-white p-2.5 text-[13px] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="font-mono text-[11px] text-[var(--fg-faint)]">{hyp.id}</div>
                <div className="mt-0.5 text-[var(--fg)]">{hyp.title}</div>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--fg-faint)]">Sem hipótese vinculada.</p>
            )}
          </Field>

          <Field label="Início">
            <TextInput
              type="date"
              value={exp.startDate ? exp.startDate.slice(0, 10) : ""}
              onChange={(e) =>
                updateExperiment(exp.id, {
                  startDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
          </Field>
          <Field label="Fim">
            <TextInput
              type="date"
              value={exp.endDate ? exp.endDate.slice(0, 10) : ""}
              onChange={(e) =>
                updateExperiment(exp.id, {
                  endDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
            />
          </Field>
          <Field label="Atualizado">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(exp.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}
