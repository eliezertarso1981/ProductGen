"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, X, Check, ChevronDown } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useStrategy } from "@/lib/strategy-store";
import { useDores } from "@/lib/dores-store";
import {
  formatPeriod,
  krProgress,
  okrProgress,
  okrStatusConfig,
  okrStatuses,
  type KeyResult,
  type OKRStatus,
} from "@/lib/strategy-data";
import { PeriodPicker } from "@/components/strategy/period-picker";

export default function OkrDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const isNew = search.get("new") === "1";
  const { ready, getOKR, updateOKR, deleteOKR, pillarsByProduct, getPillar } = useStrategy();
  const { pains } = useDores();

  const okr = getOKR(id);
  const titleRef = useRef<HTMLTextAreaElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [pillarOpen, setPillarOpen] = useState(false);

  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;
  if (!okr) {
    return (
      <div className="px-6 py-10">
        <p className="text-[14px] text-[var(--fg-muted)]">OKR não encontrado.</p>
        <Link href="/okrs" className="mt-3 inline-block text-[13px] text-[var(--primary)] hover:underline">
          ← Voltar para OKRs
        </Link>
      </div>
    );
  }

  const pillars = pillarsByProduct(okr.productId);
  const pillar = okr.pillarId ? getPillar(okr.pillarId) : undefined;
  const linkedPains = pains.filter((p) => p.okrIds?.includes(okr.id));
  const progress = okrProgress(okr);
  const cfg = okrStatusConfig[okr.status];

  const updateKR = (krId: string, patch: Partial<KeyResult>) => {
    updateOKR(okr.id, {
      keyResults: okr.keyResults.map((kr) => (kr.id === krId ? { ...kr, ...patch } : kr)),
    });
  };
  const addKR = () => {
    const nums = okr.keyResults
      .map((k) => parseInt(k.id.replace(/\D/g, ""), 10))
      .filter(Number.isFinite);
    const next = (nums.length ? Math.max(...nums) : 0) + 1;
    const kr: KeyResult = {
      id: `KR-${String(next).padStart(2, "0")}-${Date.now().toString(36).slice(-3)}`,
      title: "Novo key result",
      metric: "",
      baseline: 0,
      target: 100,
      current: 0,
    };
    updateOKR(okr.id, { keyResults: [...okr.keyResults, kr] });
  };
  const removeKR = (krId: string) =>
    updateOKR(okr.id, { keyResults: okr.keyResults.filter((k) => k.id !== krId) });

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/okrs" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]">
          <ArrowLeft size={14} /> OKRs
        </Link>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
          style={{ borderColor: "var(--danger-border)" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Excluir este OKR?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deleteOKR(okr.id);
          toast.success("OKR excluído");
          router.push("/okrs");
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{okr.id}</div>
          <textarea
            ref={titleRef}
            value={okr.objective}
            onChange={(e) => updateOKR(okr.id, { objective: e.target.value })}
            placeholder="Objetivo"
            rows={2}
            className="mt-1 w-full resize-none border-0 bg-transparent text-[22px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--border-strong)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <Section title="Descrição">
            <textarea
              value={okr.description}
              onChange={(e) => updateOKR(okr.id, { description: e.target.value })}
              placeholder="Por que este objetivo importa? Que mudança ele provoca?"
              rows={3}
              className="w-full rounded-md border bg-white px-3 py-2 text-[14px] text-[var(--fg)] outline-none focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)" }}
            />
          </Section>

          <Section title="Progresso geral">
            <div className="rounded-lg border bg-white p-4" style={{ borderColor: "var(--border)" }}>
              <div className="mb-2 flex items-center justify-between text-[12px] text-[var(--fg-muted)]">
                <span className="inline-flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                  {cfg.label}
                </span>
                <span className="font-mono text-[13px] text-[var(--fg)]">{progress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted-2)" }}>
                <div className="h-full rounded-full transition-all"
                  style={{ width: `${progress}%`, backgroundColor: cfg.dot }} />
              </div>
            </div>
          </Section>

          <Section
            title={`Key Results (${okr.keyResults.length})`}
            action={
              <button
                onClick={addKR}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Novo KR
              </button>
            }
          >
            {okr.keyResults.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Adicione key results mensuráveis para acompanhar o progresso.</p>
            ) : (
              <ul className="space-y-2">
                {okr.keyResults.map((kr) => {
                  const pct = krProgress(kr);
                  return (
                    <li key={kr.id} className="rounded-lg border bg-white p-3" style={{ borderColor: "var(--border)" }}>
                      <div className="flex items-start justify-between gap-2">
                        <input
                          value={kr.title}
                          onChange={(e) => updateKR(kr.id, { title: e.target.value })}
                          placeholder="Título do KR"
                          className="flex-1 border-0 bg-transparent text-[14px] font-medium text-[var(--fg)] outline-none placeholder:text-[var(--border-strong)]"
                        />
                        <button
                          onClick={() => removeKR(kr.id)}
                          aria-label="Remover KR"
                          className="rounded p-1 text-[var(--fg-faint)] hover:bg-[var(--bg-muted)] hover:text-[var(--danger)]"
                        >
                          <X size={13} />
                        </button>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                        <NumField label="Métrica" full>
                          <input
                            value={kr.metric}
                            onChange={(e) => updateKR(kr.id, { metric: e.target.value })}
                            placeholder="ex: NPS, %, h/sem"
                            className="w-full rounded-md border bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--primary)]"
                            style={{ borderColor: "var(--border)" }}
                          />
                        </NumField>
                        <NumField label="Baseline">
                          <input
                            type="number"
                            value={kr.baseline}
                            onChange={(e) => updateKR(kr.id, { baseline: Number(e.target.value) })}
                            className="w-full rounded-md border bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--primary)]"
                            style={{ borderColor: "var(--border)" }}
                          />
                        </NumField>
                        <NumField label="Atual">
                          <input
                            type="number"
                            value={kr.current}
                            onChange={(e) => updateKR(kr.id, { current: Number(e.target.value) })}
                            className="w-full rounded-md border bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--primary)]"
                            style={{ borderColor: "var(--border)" }}
                          />
                        </NumField>
                        <NumField label="Meta">
                          <input
                            type="number"
                            value={kr.target}
                            onChange={(e) => updateKR(kr.id, { target: Number(e.target.value) })}
                            className="w-full rounded-md border bg-white px-2 py-1 text-[12px] outline-none focus:border-[var(--primary)]"
                            style={{ borderColor: "var(--border)" }}
                          />
                        </NumField>
                      </div>
                      <div className="mt-2.5">
                        <div className="mb-1 flex items-center justify-between text-[11px] text-[var(--fg-faint)]">
                          <span>Progresso</span>
                          <span className="font-mono">{pct}%</span>
                        </div>
                        <div className="h-1.5 w-full overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted-2)" }}>
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${pct}%`, backgroundColor: "var(--primary)" }} />
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Section>

          <Section title={`Dores associadas (${linkedPains.length})`}>
            {linkedPains.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhuma dor associada a este OKR.</p>
            ) : (
              <ul className="space-y-1.5">
                {linkedPains.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/dores/${p.id}`}
                      className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <span className="font-mono text-[11px] text-[var(--fg-faint)]">{p.id}</span>
                        <span className="truncate text-[var(--fg)]">{p.title}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>
        </div>

        <aside className="space-y-5">
          <Field label="Status">
            <div className="flex flex-col gap-1">
              {okrStatuses.map((s) => {
                const c = okrStatusConfig[s];
                const active = s === okr.status;
                return (
                  <button
                    key={s}
                    onClick={() => updateOKR(okr.id, { status: s as OKRStatus })}
                    className="flex items-center justify-between rounded-md border px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
                    style={{
                      borderColor: active ? "var(--primary)" : "var(--border)",
                      backgroundColor: active ? "var(--primary-soft-2)" : "white",
                    }}
                  >
                    <span className="inline-flex items-center gap-2 text-[var(--fg)]">
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: c.dot }} />
                      {c.label}
                    </span>
                    {active && <Check size={14} color="var(--primary)" />}
                  </button>
                );
              })}
            </div>
          </Field>

          <Field label="Período">
            <PeriodPicker value={okr.period} onChange={(period) => updateOKR(okr.id, { period })} />
          </Field>

          <Field label="Pilar">
            <div className="relative">
              <button
                onClick={() => setPillarOpen((v) => !v)}
                className="flex w-full items-center justify-between rounded-md border bg-white px-2.5 py-1.5 text-[13px]"
                style={{ borderColor: "var(--border)" }}
              >
                <span className="inline-flex items-center gap-2">
                  {pillar ? (
                    <>
                      <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pillar.color }} />
                      <span className="text-[var(--fg)]">{pillar.name}</span>
                    </>
                  ) : (
                    <span className="text-[var(--fg-faint)]">Sem pilar</span>
                  )}
                </span>
                <ChevronDown size={14} color="var(--fg-faint)" />
              </button>
              {pillarOpen && (
                <div className="absolute z-10 mt-1 w-full rounded-md border bg-white py-1 shadow-lg" style={{ borderColor: "var(--border)" }}>
                  <button
                    onClick={() => { updateOKR(okr.id, { pillarId: undefined }); setPillarOpen(false); }}
                    className="flex w-full items-center justify-between px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
                  >
                    <span className="text-[var(--fg-faint)]">Sem pilar</span>
                    {!okr.pillarId && <Check size={14} color="var(--primary)" />}
                  </button>
                  {pillars.map((pl) => {
                    const sel = pl.id === okr.pillarId;
                    return (
                      <button
                        key={pl.id}
                        onClick={() => { updateOKR(okr.id, { pillarId: pl.id }); setPillarOpen(false); }}
                        className="flex w-full items-center justify-between px-2.5 py-1.5 text-[13px] hover:bg-[var(--bg-muted)]"
                      >
                        <span className="inline-flex items-center gap-2">
                          <span className="h-2 w-2 rounded-full" style={{ backgroundColor: pl.color }} />
                          <span className="text-[var(--fg)]">{pl.name}</span>
                        </span>
                        {sel && <Check size={14} color="var(--primary)" />}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </Field>

          <Field label="Resumo">
            <div className="rounded-md border bg-white px-2.5 py-2 text-[12px] text-[var(--fg-muted)]" style={{ borderColor: "var(--border)" }}>
              {formatPeriod(okr.period)} · {okr.keyResults.length} KR(s) · {progress}%
            </div>
          </Field>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
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

function NumField({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? "col-span-2 sm:col-span-1" : ""}>
      <div className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">{label}</div>
      {children}
    </div>
  );
}
