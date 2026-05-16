"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Plus, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { useStrategy } from "@/lib/strategy-store";
import { useDores } from "@/lib/dores-store";
import { formatPeriod, okrStatusConfig, pillarColors } from "@/lib/strategy-data";
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
  const [confirm, setConfirm] = useState(false);

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

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link href="/pilares" className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]">
          <ArrowLeft size={14} /> Pilares
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
        title="Excluir este pilar?"
        description="OKRs vinculados perderão a referência. Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deletePillar(pillar.id);
          toast.success("Pilar excluído");
          router.push("/pilares");
        }}
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          <div className="font-mono text-[12px] text-[var(--fg-faint)]">{pillar.id}</div>
          <input
            ref={titleRef}
            value={pillar.name}
            onChange={(e) => updatePillar(pillar.id, { name: e.target.value })}
            placeholder="Nome do pilar"
            className="mt-1 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--border-strong)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <Section title="Descrição">
            <textarea
              value={pillar.description}
              onChange={(e) => updatePillar(pillar.id, { description: e.target.value })}
              placeholder="Por que este pilar existe? Que tipo de problema endereça?"
              rows={4}
              className="w-full rounded-md border bg-white px-3 py-2 text-[14px] text-[var(--fg)] outline-none focus:border-[var(--primary)]"
              style={{ borderColor: "var(--border)" }}
            />
          </Section>

          <Section
            title={`OKRs vinculados (${okrs.length})`}
            action={
              <button
                onClick={() => {
                  const o = createOKR(pillar.productId, pillar.id, pillar.period);
                  router.push(`/okrs/${o.id}?new=1`);
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
                          <span className="font-mono text-[11px] text-[var(--fg-faint)]">{o.id}</span>
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
          <Field label="Período">
            <PeriodPicker value={pillar.period} onChange={(period) => updatePillar(pillar.id, { period })} />
          </Field>
          <Field label="Cor">
            <div className="flex flex-wrap gap-1.5">
              {pillarColors.map((c) => {
                const active = c.value === pillar.color;
                return (
                  <button
                    key={c.id}
                    onClick={() => updatePillar(pillar.id, { color: c.value })}
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
