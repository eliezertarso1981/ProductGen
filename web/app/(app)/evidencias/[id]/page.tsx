"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { Plus, X, Link as LinkIcon, ExternalLink, Sparkles } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import {
  evidenceTypeConfig,
  evidenceTypes,
  getEvidenceDisplayId,
  getExperimentDisplayId,
  type EvidenceType,
} from "@/lib/discovery-data";
import {
  BackLink,
  CancelAction,
  DeleteAction,
  detailPageClassName,
  Field,
  FormActions,
  SaveAction,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";
import { cn } from "@/lib/utils";

export default function EvidenceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const {
    ready,
    getEvidence,
    updateEvidence,
    deleteEvidence,
    getExperiment,
    createInsight,
    insightsByEvidence,
  } = useDiscovery();

  const titleRef = useRef<HTMLInputElement>(null);
  const ev = getEvidence(id);
  const evId = ev?.id;
  const evTitle = ev?.title ?? "";
  const evNotes = ev?.notes ?? "";
  const evSource = ev?.source ?? "";
  const evAttachments = ev?.attachments;
  const [draft, setDraft] = useState({
    title: "",
    notes: "",
    source: "",
    attachments: [] as { id: string; label: string; url: string }[],
  });

  useEffect(() => {
    if (!evId) return;
    setDraft({
      title: evTitle,
      notes: evNotes,
      source: evSource,
      attachments: evAttachments ?? [],
    });
  }, [evAttachments, evId, evNotes, evSource, evTitle]);

  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  if (!ev)
    return (
      <div className="px-6 py-10">
        <Link href="/evidencias" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Evidência não encontrada.</p>
      </div>
    );

  const exp = ev.experimentId ? getExperiment(ev.experimentId) : undefined;
  const displayId = getEvidenceDisplayId(ev);
  const insights = insightsByEvidence(ev.id);
  const dirty =
    draft.title !== ev.title ||
    draft.notes !== ev.notes ||
    draft.source !== ev.source ||
    JSON.stringify(draft.attachments) !== JSON.stringify(ev.attachments);
  const resetDraft = () =>
    setDraft({
      title: ev.title,
      notes: ev.notes,
      source: ev.source,
      attachments: ev.attachments,
    });
  const saveDraft = () => {
    updateEvidence(ev.id, {
      title: draft.title.trim() || ev.title,
      notes: draft.notes,
      source: draft.source,
      attachments: draft.attachments,
    });
    toast.success("Evidência salva");
  };

  return (
    <div className={detailPageClassName}>
      <div className="mb-4">
        <BackLink href="/evidencias" label="Evidências" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="flex items-center gap-2">
            {displayId && <div className="font-mono text-[12px] text-[var(--fg-faint)]">{displayId}</div>}
            {(() => {
              const cfg = evidenceTypeConfig[ev.type];
              return (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{
                    backgroundColor: `color-mix(in srgb, ${cfg.color} 14%, var(--bg-elevated))`,
                    color: cfg.color,
                  }}
                >
                  <span
                    aria-hidden
                    className="inline-block h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: cfg.color }}
                  />
                  {cfg.label}
                </span>
              );
            })()}
          </div>
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
            placeholder="Título da evidência"
            className="mt-1 w-full border-0 bg-transparent text-[28px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Notas
            </div>
            <Textarea
              rows={6}
              value={draft.notes}
              onChange={(e) => setDraft((current) => ({ ...current, notes: e.target.value }))}
              placeholder="Trecho da entrevista, dado coletado, observação..."
              className="text-[16px]"
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Anexos e links ({ev.attachments.length})
              </div>
              <button
                onClick={() =>
                  setDraft((current) => ({
                    ...current,
                    attachments: [
                      ...current.attachments,
                      { id: `att-${Date.now()}`, label: "", url: "" },
                    ],
                  }))
                }
                className="inline-flex min-h-9 items-center gap-1 rounded-md border px-3 py-1.5 text-[12px] font-semibold text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <p className="mb-2 text-[12px] text-[var(--fg-subtle)]">
              Cole URLs de arquivos (Drive, Notion, Figma, gravações) ou links de referência.
            </p>
            {draft.attachments.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhum anexo ainda.</p>
            ) : (
              <ul className="space-y-2">
                {draft.attachments.map((a, i) => (
                  <li
                    key={a.id}
                    className="rounded-md border p-2.5"
                    style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
                  >
                    <div className="flex items-start gap-2">
                      <LinkIcon size={14} className="mt-2 flex-shrink-0 text-[var(--fg-faint)]" />
                      <div className="flex-1 space-y-1.5">
                        <TextInput
                          value={a.label}
                          onChange={(e) => {
                            const next = [...draft.attachments];
                            next[i] = { ...a, label: e.target.value };
                            setDraft((current) => ({ ...current, attachments: next }));
                          }}
                          placeholder="Rótulo (ex.: Transcrição entrevista PM-1)"
                        />
                        <div className="flex items-center gap-1.5">
                          <TextInput
                            value={a.url}
                            onChange={(e) => {
                              const next = [...draft.attachments];
                              next[i] = { ...a, url: e.target.value };
                              setDraft((current) => ({ ...current, attachments: next }));
                            }}
                            placeholder="https://..."
                          />
                          {a.url && (
                            <a
                              href={a.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-md text-[var(--fg-muted)] hover:bg-[var(--bg-muted)] hover:text-[var(--primary)]"
                              aria-label="Abrir link"
                            >
                              <ExternalLink size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() =>
                          setDraft((current) => ({
                            ...current,
                            attachments: current.attachments.filter((_, j) => j !== i),
                          }))
                        }
                        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--fg-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        aria-label="Remover anexo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <FormActions>
            <SaveAction disabled={!dirty} onClick={saveDraft} />
            <CancelAction disabled={!dirty} onClick={resetDraft} />
            <DeleteAction
              title="Excluir esta evidência?"
              description={`A evidência "${ev.title}" será removida e deixará de alimentar insights vinculados.`}
              onConfirm={() => {
                deleteEvidence(ev.id);
                toast.success("Evidência excluída");
                router.push("/evidencias");
              }}
            />
          </FormActions>
        </div>

        <aside className="space-y-5">
          <Field label="Tipo">
            <div className="flex flex-wrap gap-1.5">
              {evidenceTypes.map((t) => {
                const cfg = evidenceTypeConfig[t];
                const active = t === ev.type;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => updateEvidence(ev.id, { type: t as EvidenceType })}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-[12px] font-medium transition-colors",
                      active
                        ? ""
                        : "border-[var(--border)] bg-[var(--bg-elevated)] text-[var(--fg-muted)] hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]",
                    )}
                    style={
                      active
                        ? {
                            borderColor: cfg.color,
                            color: cfg.color,
                            backgroundColor: `color-mix(in srgb, ${cfg.color} 14%, var(--bg-elevated))`,
                          }
                        : undefined
                    }
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Origem">
            <TextInput
              value={draft.source}
              onChange={(e) => setDraft((current) => ({ ...current, source: e.target.value }))}
              placeholder="Entrevista 12/05, ticket #123, NPS Q1..."
            />
          </Field>

          <Field label="Experimento">
            {exp ? (
              <Link
                href={`/experimentos/${exp.id}`}
                className="block rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 text-[13px] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]"
              >
                <div className="font-mono text-[11px] text-[var(--fg-faint)]">
                  {getExperimentDisplayId(exp) ?? "Experimento"}
                </div>
                <div className="mt-0.5 text-[var(--fg)]">{exp.title}</div>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--fg-faint)]">Sem experimento vinculado.</p>
            )}
          </Field>

          <Field label="Insights derivados">
            <div className="space-y-2">
              {insights.length === 0 ? (
                <p className="text-[13px] text-[var(--fg-faint)]">Nenhum insight vinculado.</p>
              ) : (
                <ul className="space-y-1.5">
                  {insights.map((insight) => (
                    <li key={insight.id}>
                      <Link
                        href={`/insights/${insight.id}`}
                        className="block rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] p-2.5 text-[13px] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)]"
                      >
                        <div className="font-mono text-[11px] text-[var(--fg-faint)]">
                          {insight.code ?? "Insight"}
                        </div>
                        <div className="mt-0.5 text-[var(--fg)]">{insight.title}</div>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
              <button
                type="button"
                onClick={() => {
                  void createInsight(ev.productId, ev.id)
                    .then((insight) => {
                      router.push(`/insights/${insight.id}?new=1`);
                    })
                    .catch((error) => {
                      toast.error(error instanceof Error ? error.message : "Não foi possível criar o insight");
                    });
                }}
                className="inline-flex items-center gap-1 rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-2 py-1 text-[11px] font-medium text-[var(--fg-muted)] transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] hover:text-[var(--fg)]"
              >
                <Sparkles size={12} /> Criar insight desta evidência
              </button>
            </div>
          </Field>

          <Field label="Atualizada">
            <div className="rounded-md border border-[var(--border)] bg-[var(--bg-elevated)] px-3 py-2 text-[13px] text-[var(--fg-muted)]">
              {formatDate(ev.updatedAt)}
            </div>
          </Field>
        </aside>
      </div>
    </div>
  );
}
