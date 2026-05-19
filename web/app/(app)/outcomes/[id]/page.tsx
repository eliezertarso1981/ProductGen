"use client";

import { use, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useDiscovery } from "@/lib/discovery-store";
import {
  getOutcomeDisplayId,
  getRoadmapDisplayId,
  outcomeStatusConfig,
  outcomeStatuses,
} from "@/lib/discovery-data";
import {
  BackLink,
  CancelAction,
  DeleteAction,
  detailPageClassName,
  Field,
  FormActions,
  SaveAction,
  Select,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";

export default function OutcomeDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { ready, getOutcome, getRoadmap, updateOutcome, deleteOutcome } = useDiscovery();
  const outcome = getOutcome(id);
  const outcomeId = outcome?.id;
  const outcomeHypothesizedImpact = outcome?.hypothesizedImpact ?? "";
  const outcomeConclusion = outcome?.conclusion ?? "";
  const outcomeMeasurementWindowDays = outcome?.measurementWindowDays ?? 1;
  const outcomeBaselineValue = outcome?.baselineValue;
  const outcomeFinalValue = outcome?.finalValue;
  const [draft, setDraft] = useState({
    hypothesizedImpact: "",
    conclusion: "",
    measurementWindowDays: 1,
    baselineValue: null as number | null | undefined,
    finalValue: null as number | null | undefined,
  });

  useEffect(() => {
    if (!outcomeId) return;
    setDraft({
      hypothesizedImpact: outcomeHypothesizedImpact,
      conclusion: outcomeConclusion,
      measurementWindowDays: outcomeMeasurementWindowDays,
      baselineValue: outcomeBaselineValue,
      finalValue: outcomeFinalValue,
    });
  }, [
    outcomeBaselineValue,
    outcomeConclusion,
    outcomeFinalValue,
    outcomeHypothesizedImpact,
    outcomeId,
    outcomeMeasurementWindowDays,
  ]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;

  if (!outcome) {
    return (
      <div className="px-6 py-10">
        <Link href="/outcomes" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Outcome não encontrado.</p>
      </div>
    );
  }

  const roadmapItem = getRoadmap(outcome.roadmapItemId);
  const displayId = getOutcomeDisplayId(outcome);
  const dirty =
    draft.hypothesizedImpact !== outcome.hypothesizedImpact ||
    draft.conclusion !== (outcome.conclusion ?? "") ||
    draft.measurementWindowDays !== outcome.measurementWindowDays ||
    draft.baselineValue !== outcome.baselineValue ||
    draft.finalValue !== outcome.finalValue;
  const resetDraft = () =>
    setDraft({
      hypothesizedImpact: outcome.hypothesizedImpact,
      conclusion: outcome.conclusion ?? "",
      measurementWindowDays: outcome.measurementWindowDays,
      baselineValue: outcome.baselineValue,
      finalValue: outcome.finalValue,
    });
  const saveDraft = () => {
    updateOutcome(outcome.id, {
      hypothesizedImpact: draft.hypothesizedImpact,
      conclusion: draft.conclusion || null,
      measurementWindowDays: Math.max(1, draft.measurementWindowDays || 1),
      baselineValue: draft.baselineValue,
      finalValue: draft.finalValue,
    });
    toast.success("Outcome salvo");
  };

  return (
    <div className={detailPageClassName}>
      <div className="mb-4">
        <BackLink href="/outcomes" label="Outcomes" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {displayId && <div className="font-mono text-[12px] text-[var(--fg-faint)]">{displayId}</div>}
          <h1 className="mt-1 text-[28px] font-semibold tracking-tight text-[var(--fg)]">Medição de outcome</h1>

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Impacto hipotetizado
            </div>
            <Textarea
              rows={6}
              value={draft.hypothesizedImpact}
              onChange={(event) => setDraft((current) => ({ ...current, hypothesizedImpact: event.target.value }))}
              placeholder="Qual impacto esta entrega deve provocar?"
              className="text-[16px]"
            />
          </div>

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Conclusão
            </div>
            <Textarea
              rows={5}
              value={draft.conclusion}
              onChange={(event) => setDraft((current) => ({ ...current, conclusion: event.target.value }))}
              placeholder="Registre o aprendizado depois da janela de medição."
            />
          </div>

          <FormActions>
            <SaveAction disabled={!dirty} onClick={saveDraft} />
            <CancelAction disabled={!dirty} onClick={resetDraft} />
            <DeleteAction
              title="Excluir este outcome?"
              description="Esta medição de outcome será removida do item de roadmap. A ação não pode ser desfeita."
              onConfirm={() => {
                deleteOutcome(outcome.id);
                toast.success("Outcome excluído");
                router.push("/outcomes");
              }}
            />
          </FormActions>
        </div>

        <aside className="space-y-5">
          <Field label="Status">
            <Select
              value={outcome.status}
              onChange={(status) => updateOutcome(outcome.id, { status })}
              options={outcomeStatuses.map((status) => ({
                value: status,
                label: outcomeStatusConfig[status].label,
                dot: outcomeStatusConfig[status].dot,
              }))}
            />
          </Field>

          <Field label="Roadmap medido">
            {roadmapItem ? (
              <Link
                href={`/roadmap/${roadmapItem.id}`}
                className="block rounded-md border bg-white p-2.5 text-[13px] hover:bg-[var(--bg-muted)]"
                style={{ borderColor: "var(--border)" }}
              >
                <div className="font-mono text-[11px] text-[var(--fg-faint)]">
                  {getRoadmapDisplayId(roadmapItem) ?? "Roadmap"}
                </div>
                <div className="mt-0.5 text-[var(--fg)]">{roadmapItem.title}</div>
              </Link>
            ) : (
              <p className="text-[13px] text-[var(--fg-faint)]">Item de roadmap não encontrado.</p>
            )}
          </Field>

          <Field label="Janela de medição (dias)">
            <TextInput
              type="number"
              min={1}
              max={365}
              value={draft.measurementWindowDays}
              onChange={(event) =>
                setDraft((current) => ({
                  ...current,
                  measurementWindowDays: Math.max(1, Number(event.target.value) || 1),
                }))
              }
            />
          </Field>

          <Field label="Baseline">
            <NumberInput
              value={draft.baselineValue}
              onChange={(baselineValue) => setDraft((current) => ({ ...current, baselineValue }))}
            />
          </Field>

          <Field label="Valor final">
            <NumberInput
              value={draft.finalValue}
              onChange={(finalValue) => setDraft((current) => ({ ...current, finalValue }))}
            />
          </Field>

          <Field label="Atualizado em">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(outcome.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}

function NumberInput({
  value,
  onChange,
}: {
  value?: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <TextInput
      type="number"
      value={value === null || value === undefined || Number.isNaN(value) ? "" : value}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === "" ? null : Number(raw));
      }}
    />
  );
}
