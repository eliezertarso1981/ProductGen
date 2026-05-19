"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Plus, Check } from "lucide-react";
import { CancelAction, DeleteAction, FormActions, SaveAction } from "@/components/shared/crud-ui";
import { useStrategy } from "@/lib/strategy-store";
import { useDores } from "@/lib/dores-store";
import { getPainDisplayId } from "@/lib/dores-data";
import {
  formatPeriod,
  getOKRDisplayId,
  getPillarDisplayId,
  okrStatusConfig,
  pillarColors,
  type Period,
} from "@/lib/strategy-data";
import { PeriodPicker } from "@/components/strategy/period-picker";

export default function PillarDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const isNew = search.get("new") === "1";
  const { ready, getPillar, updatePillar, deletePillar, okrsByPillar, createOKR } = useStrategy();
  const { pains } = useDores();

  const pillar = getPillar(id);
  const titleRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState<{
    name: string;
    description: string;
    period: Period;
    color: string;
  }>({
    name: "",
    description: "",
    period: { type: "annual", year: new Date().getFullYear() },
    color: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!pillar) return;
    setDraft({
      name: pillar.name,
      description: pillar.description,
      period: pillar.period,
      color: pillar.color,
    });
  }, [pillar]);

  useEffect(() => {
    if (isNew && titleRef.current) {
      titleRef.current.focus();
      titleRef.current.select();
    }
  }, [isNew]);

  if (!ready) return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;
  if (!pillar) {
    return (
      <div className="px-6 py-10">
        <p className="text-[14px] text-[var(--fg-muted)]">Pilar não encontrado.</p>
        <Link href="/pilares" className="mt-3 inline-block text-[13px] text-[var(--primary)] hover:underline">
          ← Voltar para Pilares
        </Link>
      </div>
    );
  }

  const okrs = okrsByPillar(pillar.id);
  const linkedPains = pains.filter((p) => p.pillarId === pillar.id);
  const dirty =
    draft.name !== pillar.name ||
    draft.description !== pillar.description ||
    draft.period !== pillar.period ||
    draft.color !== pillar.color;
  const resetDraft = () =>
    setDraft({
      name: pillar.name,
      description: pillar.description,
      period: pillar.period,
      color: pillar.color,
    });
  const saveDraft = async () => {
    if (saving) return;
    setSaving(true);
    try {
      await updatePillar(pillar.id, {
        name: draft.name.trim() || pillar.name,
        description: draft.description,
        period: draft.period,
        color: draft.color,
      });
      toast.success("Pilar salvo com sucesso");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível salvar o pilar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-4">
        <Link href="/pilares" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]">
          <ArrowLeft size={14} /> Pilares
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {getPillarDisplayId(pillar) && (
            <div className="font-mono text-[12px] text-[var(--fg-faint)]">
              {getPillarDisplayId(pillar)}
            </div>
          )}
          <input
            ref={titleRef}
            value={draft.name}
            onChange={(e) => setDraft((current) => ({ ...current, name: e.target.value }))}
            placeholder="Nome do pilar"
            className="mt-1 w-full border-0 bg-transparent text-[28px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <Section title="Descrição">
            <textarea
              value={draft.description}
              onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
              placeholder="Por que este pilar existe? Que tipo de problema endereça?"
              rows={6}
              className="w-full rounded-md border bg-white px-3.5 py-2.5 text-[16px] leading-6 text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)" }}
            />
          </Section>

          <FormActions>
            <SaveAction disabled={!dirty || saving} onClick={saveDraft}>
              {saving ? "Salvando..." : "Salvar"}
            </SaveAction>
            <CancelAction disabled={!dirty} onClick={resetDraft} />
            <DeleteAction
              title="Excluir este pilar?"
              description="OKRs vinculados perderão a referência. Esta ação não pode ser desfeita."
              onConfirm={() => {
                deletePillar(pillar.id);
                toast.success("Pilar excluído");
                router.push("/pilares");
              }}
            />
          </FormActions>

          <Section
            title={`OKRs vinculados (${okrs.length})`}
            action={
              <button
                onClick={() => {
                  void createOKR(pillar.productId, pillar.id, draft.period)
                    .then((o) => {
                      router.push(`/okrs/${o.id}?new=1`);
                    })
                    .catch((error) => {
                      toast.error(error instanceof Error ? error.message : "Não foi possível criar o OKR");
                    });
                }}
                className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px] text-[var(--fg-muted)] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <Plus size={12} /> Novo OKR
              </button>
            }
          >
            {okrs.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhum OKR vinculado.</p>
            ) : (
              <ul className="space-y-1.5">
                {okrs.map((o) => {
                  const cfg = okrStatusConfig[o.status];
                  return (
                    <li key={o.id}>
                      <Link
                        href={`/okrs/${o.id}`}
                        className="flex items-center justify-between rounded-md border bg-white px-2.5 py-2 text-[13px] hover:bg-[var(--bg-muted)]"
                        style={{ borderColor: "var(--border)" }}
                      >
                        <span className="flex min-w-0 items-center gap-2">
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">
                            {getOKRDisplayId(o) ?? "OKR"}
                          </span>
                          <span className="truncate text-[var(--fg)]">{o.objective}</span>
                        </span>
                        <span className="inline-flex shrink-0 items-center gap-1.5 text-[12px] text-[var(--fg-muted)]">
                          <span className="rounded-full border px-1.5 py-0.5 text-[10px]"
                            style={{ borderColor: "var(--border)" }}>
                            {formatPeriod(o.period)}
                          </span>
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

          <Section title={`Dores associadas (${linkedPains.length})`}>
            {linkedPains.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhuma dor associada a este pilar.</p>
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
                        {getPainDisplayId(p) && (
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">
                            {getPainDisplayId(p)}
                          </span>
                        )}
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
          <Field label="Período">
            <PeriodPicker value={draft.period} onChange={(period) => setDraft((current) => ({ ...current, period }))} />
          </Field>
          <Field label="Cor">
            <div className="flex flex-wrap gap-1.5">
              {pillarColors.map((c) => {
                const active = c.value === draft.color;
                return (
                  <button
                    key={c.id}
                    onClick={() => setDraft((current) => ({ ...current, color: c.value }))}
                    aria-label={c.label}
                    className="flex h-7 w-7 items-center justify-center rounded-md border"
                    style={{
                      backgroundColor: c.value,
                      borderColor: active ? "var(--fg)" : "transparent",
                    }}
                  >
                    {active && <Check size={14} color="white" />}
                  </button>
                );
              })}
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
