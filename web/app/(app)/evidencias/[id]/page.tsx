"use client";

import { use, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Trash2, Plus, X, Link as LinkIcon, ExternalLink } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { evidenceTypeConfig, evidenceTypes, type EvidenceType } from "@/lib/discovery-data";
import { BackLink, Field, TextInput, Textarea, formatDate } from "@/components/shared/crud-ui";

export default function EvidenceDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const { ready, getEvidence, updateEvidence, deleteEvidence, getExperiment } = useDiscovery();

  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  const ev = getEvidence(id);
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

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <BackLink href="/evidencias" label="Evidências" />
        <button
          onClick={() => {
            if (confirm("Excluir esta evidência?")) {
              deleteEvidence(ev.id);
              router.push("/evidencias");
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
          <div className="flex items-center gap-2">
            <div className="font-mono text-[12px] text-[var(--fg-faint)]">{ev.id}</div>
            {(() => {
              const cfg = evidenceTypeConfig[ev.type];
              return (
                <span
                  className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold"
                  style={{ backgroundColor: `${cfg.color}15`, color: cfg.color }}
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
            value={ev.title}
            onChange={(e) => updateEvidence(ev.id, { title: e.target.value })}
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Notas
            </div>
            <Textarea
              rows={6}
              value={ev.notes}
              onChange={(e) => updateEvidence(ev.id, { notes: e.target.value })}
              placeholder="Trecho da entrevista, dado coletado, observação..."
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Anexos e links ({ev.attachments.length})
              </div>
              <button
                onClick={() =>
                  updateEvidence(ev.id, {
                    attachments: [
                      ...ev.attachments,
                      { id: `att-${Date.now()}`, label: "", url: "" },
                    ],
                  })
                }
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Adicionar
              </button>
            </div>
            <p className="mb-2 text-[12px] text-[var(--fg-subtle)]">
              Cole URLs de arquivos (Drive, Notion, Figma, gravações) ou links de referência.
            </p>
            {ev.attachments.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhum anexo ainda.</p>
            ) : (
              <ul className="space-y-2">
                {ev.attachments.map((a, i) => (
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
                            const next = [...ev.attachments];
                            next[i] = { ...a, label: e.target.value };
                            updateEvidence(ev.id, { attachments: next });
                          }}
                          placeholder="Rótulo (ex.: Transcrição entrevista PM-1)"
                        />
                        <div className="flex items-center gap-1.5">
                          <TextInput
                            value={a.url}
                            onChange={(e) => {
                              const next = [...ev.attachments];
                              next[i] = { ...a, url: e.target.value };
                              updateEvidence(ev.id, { attachments: next });
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
                          updateEvidence(ev.id, {
                            attachments: ev.attachments.filter((_, j) => j !== i),
                          })
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
                    onClick={() => updateEvidence(ev.id, { type: t as EvidenceType })}
                    className="rounded-md border px-2.5 py-1 text-[12px]"
                    style={{
                      borderColor: active ? cfg.color : "var(--border)",
                      color: active ? cfg.color : "var(--fg-subtle)",
                      backgroundColor: active ? `${cfg.color}10` : "white",
                    }}
                  >
                    {cfg.label}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Origem">
            <TextInput
              value={ev.source}
              onChange={(e) => updateEvidence(ev.id, { source: e.target.value })}
              placeholder="Entrevista 12/05, ticket #123, NPS Q1..."
            />
          </Field>

          <Field label="Experimento">
            {exp ? (
              <Link
                href={`/experimentos/${exp.id}`}
                className="block rounded-md border bg-white p-2.5 text-[13px] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="font-mono text-[11px] text-[var(--fg-faint)]">{exp.id}</div>
                <div className="mt-0.5 text-[var(--fg)]">{exp.title}</div>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--fg-faint)]">Sem experimento vinculado.</p>
            )}
          </Field>

          <Field label="Atualizada">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(ev.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}
