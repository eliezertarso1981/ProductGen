"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import {
  ArrowLeft,
  Trash2,
  Paperclip,
  X,
  Send,
  Check,
  ChevronDown,
} from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import {
  ownersList,
  severityColor,
  statusConfig,
  type PainAttachment,
  type PainOwner,
  type PainStatus,
  boardColumns,
} from "@/lib/dores-data";
import { useDores } from "@/lib/dores-store";
import { useDiscovery } from "@/lib/discovery-store";
import { useStrategy } from "@/lib/strategy-store";
import {
  hypothesisStatusConfig,
  roadmapStatusConfig,
} from "@/lib/discovery-data";
import { formatPeriod, okrStatusConfig, type OKR, type Pillar } from "@/lib/strategy-data";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/shared/avatar";

export default function PainDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const isNew = searchParams.get("new") === "1";
  const { ready, getPain, updatePain, deletePain, addComment, addAttachments, removeAttachment } =
    useDores();
  const {
    hypothesesByPain,
    roadmapByPain,
    createHypothesis,
    createRoadmap,
  } = useDiscovery();
  const { pillarsByProduct, okrsByProduct, getPillar, getOKR } = useStrategy();

  const pain = getPain(id);
  const linkedHypotheses = pain ? hypothesesByPain(pain.id) : [];
  const linkedRoadmap = pain ? roadmapByPain(pain.id) : [];
  const productPillars = pain ? pillarsByProduct(pain.productId) : [];
  const productOkrs = pain ? okrsByProduct(pain.productId) : [];

  const titleInputRef = useRef<HTMLInputElement>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  useEffect(() => {
    if (isNew && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [isNew]);

  if (!ready) {
    return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;
  }
  if (!pain) {
    return (
      <div className="px-6 py-10">
        <p className="text-[14px] text-[var(--fg-muted)]">Dor não encontrada.</p>
        <Link href="/dores" className="mt-3 inline-block text-[13px] text-[var(--primary)] hover:underline">
          ← Voltar para Dores
        </Link>
      </div>
    );
  }

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/dores"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]"
        >
          <ArrowLeft size={14} /> Dores
        </Link>
        <button
          onClick={() => setConfirmDelete(true)}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
          style={{ borderColor: "var(--danger-border)" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir esta dor?"
        description="Esta ação remove a dor e suas referências locais. Não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          deletePain(pain.id);
          setConfirmDelete(false);
          toast.success("Dor excluída");
          router.push("/dores");
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{pain.id}</div>
          <input
            ref={titleInputRef}
            value={pain.title}
            onChange={(e) => updatePain(pain.id, { title: e.target.value })}
            placeholder="Título da dor"
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--border-strong)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <Section title="Descrição">
            <textarea
              value={pain.description}
              onChange={(e) => updatePain(pain.id, { description: e.target.value })}
              placeholder="Descreva o problema, contexto e impacto..."
              rows={5}
              className="w-full rounded-md border bg-white px-3 py-2 text-[14px] text-[var(--fg)] outline-none transition-colors placeholder:text-[var(--border-strong)] focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)" }}
            />
          </Section>

          <Section
            title={`Hipóteses geradas (${linkedHypotheses.length})`}
            action={
              <button
                onClick={() => {
                  const h = createHypothesis(pain.productId, pain.id);
                  router.push(`/hipoteses/${h.id}?new=1`);
                }}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Nova hipótese
              </button>
            }
          >
            {linkedHypotheses.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Ainda não há hipóteses derivadas desta dor.</p>
            ) : (
              <ul className="space-y-1.5">
                {linkedHypotheses.map((h) => {
                  const cfg = hypothesisStatusConfig[h.status];
                  return (
                    <li key={h.id}>
                      <Link
                        href={`/hipoteses/${h.id}`}
                        className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">{h.id}</span>
                          <span className="truncate text-[var(--fg)]">{h.title}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--fg-muted)]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {cfg.label}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          {pain.status === "validada" && (
            <Section
              title={`Itens de roadmap (${linkedRoadmap.length})`}
              action={
                <button
                  onClick={() => {
                    const r = createRoadmap(pain.productId, pain.id);
                    router.push(`/roadmap/${r.id}?new=1`);
                  }}
                  className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                  style={{ borderColor: "var(--border)" }}
                >
                  <Plus size={12} /> Novo item
                </button>
              }
            >
              {linkedRoadmap.length === 0 ? (
                <p className="text-[13px] text-[var(--fg-faint)]">Nenhum item de roadmap ainda.</p>
              ) : (
                <ul className="space-y-1.5">
                  {linkedRoadmap.map((r) => {
                    const cfg = roadmapStatusConfig[r.status];
                    return (
                      <li key={r.id}>
                        <Link
                          href={`/roadmap/${r.id}`}
                          className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                          style={{ borderColor: "var(--border)" }}
                        >
                          <span className="flex min-w-0 items-center gap-2">
                            <span className="font-mono text-[11px] text-[var(--fg-faint)]">{r.id}</span>
                            <span className="truncate text-[var(--fg)]">{r.title}</span>
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--fg-muted)]">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                            {cfg.label}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </Section>
          )}

          <Section title="Anexos">
            <Attachments
              attachments={pain.attachments}
              onAdd={(files) => addAttachments(pain.id, files)}
              onRemove={(attId) => removeAttachment(pain.id, attId)}
            />
          </Section>

          <Section title={`Comentários (${pain.comments.length})`}>
            <Comments
              comments={pain.comments}
              onAdd={(text) => addComment(pain.id, text)}
            />
          </Section>
        </div>

        <aside className="space-y-5">
          <Field label="Status">
            <StatusSelect
              value={pain.status}
              onChange={(s) => updatePain(pain.id, { status: s })}
            />
          </Field>

          <Field label="Severidade">
            <SeveritySelect
              value={pain.severity}
              onChange={(v) => updatePain(pain.id, { severity: v })}
            />
          </Field>

          <Field label="Responsáveis">
            <ResponsiblesSelect
              selected={pain.responsibles}
              onChange={(list) => updatePain(pain.id, { responsibles: list })}
            />
          </Field>

          <Field label="Pilar estratégico">
            <PillarSelect
              value={pain.pillarId}
              pillars={productPillars}
              onChange={(pillarId) => updatePain(pain.id, { pillarId })}
            />
            {pain.pillarId && getPillar(pain.pillarId) && (
              <Link
                href={`/pilares/${pain.pillarId}`}
                className="mt-1 inline-block text-[11px] text-[var(--primary)] hover:underline"
              >
                Abrir pilar →
              </Link>
            )}
          </Field>

          <Field label="OKRs vinculados">
            <OkrMultiSelect
              selected={pain.okrIds ?? []}
              okrs={productOkrs}
              onChange={(ids) => updatePain(pain.id, { okrIds: ids })}
            />
            {(pain.okrIds ?? []).length > 0 && (
              <ul className="mt-2 space-y-1">
                {(pain.okrIds ?? []).map((oid) => {
                  const o = getOKR(oid);
                  if (!o) return null;
                  const cfg = okrStatusConfig[o.status];
                  return (
                    <li key={oid}>
                      <Link
                        href={`/okrs/${oid}`}
                        className="flex items-center justify-between rounded-md border bg-white px-2 py-1.5 text-[12px] hover:bg-[var(--bg-muted)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex min-w-0 items-center gap-1.5">
                          <span className="font-mono text-[10px] text-[var(--fg-faint)]">{o.id}</span>
                          <span className="truncate text-[var(--fg)]">{o.objective}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-[var(--fg-muted)]">
                          <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                          {formatPeriod(o.period)}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Field>

          <Field label="Data prevista de validação">
            <input
              type="date"
              value={pain.dueDate ? pain.dueDate.slice(0, 10) : ""}
              onChange={(e) =>
                updatePain(pain.id, {
                  dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined,
                })
              }
              className="w-full rounded-md border bg-white px-2.5 py-1.5 text-[13px] text-[var(--fg)] outline-none focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)" }}
            />
          </Field>

          <Field label="Criado em">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(pain.createdAt)}</div>
          </Field>
          <Field label="Última atualização">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(pain.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center justify-between">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
          {title}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
        {label}
      </div>
      {children}
    </div>
  );
}

function StatusSelect({
  value,
  onChange,
}: {
  value: PainStatus;
  onChange: (s: PainStatus) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      {boardColumns.map((s) => {
        const cfg = statusConfig[s];
        const active = s === value;
        return (
          <button
            key={s}
            onClick={() => onChange(s)}
            className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[13px] transition-colors hover:bg-[var(--bg-muted)]"
            style={{
              borderColor: active ? "var(--primary)" : "var(--border)",
              backgroundColor: active ? "var(--primary-soft-2)" : "white",
            }}
          >
            <span className="inline-flex items-center gap-2 text-[var(--fg)]">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
              {cfg.label}
            </span>
            {active && <Check size={14} color="var(--primary)" />}
          </button>
        );
      })}
    </div>
  );
}

function SeveritySelect({
  value,
  onChange,
}: {
  value: 1 | 2 | 3 | 4 | 5;
  onChange: (v: 1 | 2 | 3 | 4 | 5) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {([1, 2, 3, 4, 5] as const).map((i) => {
        const filled = i <= value;
        const color = severityColor(value);
        return (
          <button
            key={i}
            onClick={() => onChange(i)}
            aria-label={`Severidade ${i}`}
            className="h-4 w-4 rounded-full border transition-transform hover:scale-110"
            style={{
              backgroundColor: filled ? color : "transparent",
              borderColor: filled ? color : "var(--fg-disabled)",
            }}
          />
        );
      })}
      <span className="ml-2 text-[12px] text-[var(--fg-subtle)]">{value}/5</span>
    </div>
  );
}

function ResponsiblesSelect({
  selected,
  onChange,
}: {
  selected: PainOwner[];
  onChange: (list: PainOwner[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedIds = useMemo(() => new Set(selected.map((s) => s.id)), [selected]);

  const toggle = (o: PainOwner) => {
    if (selectedIds.has(o.id)) onChange(selected.filter((s) => s.id !== o.id));
    else onChange([...selected, o]);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
        style={{ borderColor: "var(--border)" }}
      >
        <div className="flex flex-wrap items-center gap-1.5">
          {selected.length === 0 && <span className="text-[var(--fg-faint)]">Ninguém</span>}
          {selected.map((o) => (
            <span key={o.id} className="inline-flex items-center gap-1">
              <Avatar initials={o.initials} color={o.color} size={20} />
              <span className="text-[12px] text-[var(--fg-muted)]">{o.name ?? o.initials}</span>
            </span>
          ))}
        </div>
        <ChevronDown size={14} color="var(--fg-faint)" />
      </button>
      {open && (
        <div
          className="absolute z-10 mt-1 w-full rounded-md border bg-white py-1 shadow-lg"
          style={{ borderColor: "var(--border)" }}
        >
          {ownersList.map((o) => {
            const isSel = selectedIds.has(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o)}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
              >
                <span className="inline-flex items-center gap-2">
                  <Avatar initials={o.initials} color={o.color} size={22} />
                  <span className="text-[var(--fg)]">{o.name ?? o.initials}</span>
                </span>
                {isSel && <Check size={14} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Attachments({
  attachments,
  onAdd,
  onRemove,
}: {
  attachments: PainAttachment[];
  onAdd: (files: PainAttachment[]) => void;
  onRemove: (attId: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const list: PainAttachment[] = [];
    for (const f of Array.from(files)) {
      const dataUrl = await new Promise<string | undefined>((resolve) => {
        if (f.size > 2 * 1024 * 1024) {
          resolve(undefined);
          return;
        }
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(f);
      });
      list.push({
        id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        name: f.name,
        size: f.size,
        type: f.type,
        dataUrl,
        addedAt: new Date().toISOString(),
      });
    }
    onAdd(list);
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="inline-flex items-center gap-1.5 rounded-md border border-dashed px-3 py-2 text-[13px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
        style={{ borderColor: "var(--border-strong)" }}
      >
        <Paperclip size={14} /> Adicionar anexos
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {attachments.length > 0 && (
        <ul className="mt-3 space-y-1.5">
          {attachments.map((a) => (
            <li
              key={a.id}
              className="flex items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-[13px]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex min-w-0 items-center gap-2">
                <Paperclip size={13} color="var(--fg-faint)" />
                {a.dataUrl ? (
                  <a
                    href={a.dataUrl}
                    download={a.name}
                    className="truncate text-[var(--fg)] hover:underline"
                  >
                    {a.name}
                  </a>
                ) : (
                  <span className="truncate text-[var(--fg)]">{a.name}</span>
                )}
                <span className="shrink-0 text-[11px] text-[var(--fg-faint)]">
                  {formatSize(a.size)}
                </span>
              </div>
              <button
                onClick={() => onRemove(a.id)}
                aria-label="Remover anexo"
                className="rounded p-1 text-[var(--fg-faint)] hover:bg-[var(--bg-muted)] hover:text-[var(--danger)]"
              >
                <X size={13} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function Comments({
  comments,
  onAdd,
}: {
  comments: { id: string; author: PainOwner; text: string; createdAt: string }[];
  onAdd: (text: string) => void;
}) {
  const [text, setText] = useState("");
  const submit = () => {
    if (!text.trim()) return;
    onAdd(text);
    setText("");
  };
  return (
    <div className="space-y-3">
      <ul className="space-y-3">
        {comments.length === 0 && (
          <li className="text-[13px] text-[var(--fg-faint)]">Nenhum comentário ainda.</li>
        )}
        {comments.map((c) => (
          <li key={c.id} className="flex gap-2.5">
            <Avatar initials={c.author.initials} color={c.author.color} size={28} />
            <div className="flex-1 rounded-md border bg-white px-3 py-2" style={{ borderColor: "var(--border)" }}>
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-[var(--fg)]">
                  {c.author.name ?? c.author.initials}
                </span>
                <span className="text-[11px] text-[var(--fg-faint)]">{formatDate(c.createdAt)}</span>
              </div>
              <p className="mt-1 whitespace-pre-wrap text-[13px] text-[var(--fg-muted)]">{c.text}</p>
            </div>
          </li>
        ))}
      </ul>
      <div
        className="relative rounded-md border bg-white transition-colors focus-within:border-[var(--primary)]"
        style={{ borderColor: "var(--border)" }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
              e.preventDefault();
              submit();
            }
          }}
          rows={2}
          placeholder="Escreva um comentário... (⌘+Enter para enviar)"
          className="w-full resize-none rounded-md bg-transparent px-3 py-2 pr-24 text-[13px] outline-none placeholder:text-[var(--border-strong)]"
        />
        <button
          onClick={submit}
          disabled={!text.trim()}
          className="absolute bottom-2 right-2 inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Send size={12} /> Enviar
        </button>
      </div>
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function PillarSelect({
  value,
  pillars,
  onChange,
}: {
  value?: string;
  pillars: Pillar[];
  onChange: (id: string | undefined) => void;
}) {
  const [open, setOpen] = useState(false);
  const selected = pillars.find((p) => p.id === value);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="inline-flex min-w-0 items-center gap-2">
          {selected ? (
            <>
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: selected.color }} />
              <span className="truncate text-[var(--fg)]">{selected.name}</span>
            </>
          ) : (
            <span className="text-[var(--fg-faint)]">Sem pilar</span>
          )}
        </span>
        <ChevronDown size={14} color="var(--fg-faint)" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 w-full rounded-md border bg-white py-1 shadow-lg" style={{ borderColor: "var(--border)" }}>
          <button
            onClick={() => { onChange(undefined); setOpen(false); }}
            className="flex w-full items-center justify-between px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
          >
            <span className="text-[var(--fg-faint)]">Sem pilar</span>
            {!value && <Check size={14} color="var(--primary)" />}
          </button>
          {pillars.length === 0 && (
            <div className="px-2.5 py-2 text-[12px] text-[var(--fg-faint)]">Nenhum pilar criado.</div>
          )}
          {pillars.map((p) => {
            const sel = p.id === value;
            return (
              <button
                key={p.id}
                onClick={() => { onChange(p.id); setOpen(false); }}
                className="flex w-full items-center justify-between px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
              >
                <span className="inline-flex min-w-0 items-center gap-2">
                  <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: p.color }} />
                  <span className="truncate text-[var(--fg)]">{p.name}</span>
                </span>
                {sel && <Check size={14} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function OkrMultiSelect({
  selected,
  okrs,
  onChange,
}: {
  selected: string[];
  okrs: OKR[];
  onChange: (ids: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const set = new Set(selected);
  const toggle = (id: string) => {
    if (set.has(id)) onChange(selected.filter((x) => x !== id));
    else onChange([...selected, id]);
  };
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
        style={{ borderColor: "var(--border)" }}
      >
        <span className="text-[var(--fg)]">
          {selected.length === 0 ? (
            <span className="text-[var(--fg-faint)]">Nenhum</span>
          ) : (
            `${selected.length} selecionado(s)`
          )}
        </span>
        <ChevronDown size={14} color="var(--fg-faint)" />
      </button>
      {open && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-y-auto rounded-md border bg-white py-1 shadow-lg" style={{ borderColor: "var(--border)" }}>
          {okrs.length === 0 && (
            <div className="px-2.5 py-2 text-[12px] text-[var(--fg-faint)]">Nenhum OKR criado.</div>
          )}
          {okrs.map((o) => {
            const isSel = set.has(o.id);
            return (
              <button
                key={o.id}
                onClick={() => toggle(o.id)}
                className="flex w-full items-start justify-between gap-2 px-2.5 py-1.5 text-left text-[13px] hover:bg-[var(--bg-muted)]"
              >
                <span className="flex min-w-0 flex-col">
                  <span className="inline-flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[var(--fg-faint)]">{o.id}</span>
                    <span className="rounded-full border px-1.5 text-[10px] text-[var(--fg-muted)]" style={{ borderColor: "var(--border)" }}>
                      {formatPeriod(o.period)}
                    </span>
                  </span>
                  <span className="truncate text-[var(--fg)]">{o.objective}</span>
                </span>
                {isSel && <Check size={14} color="var(--primary)" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
