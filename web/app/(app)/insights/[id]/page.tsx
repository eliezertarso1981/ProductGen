"use client";

import { use, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { X } from "lucide-react";
import { useDiscovery } from "@/lib/discovery-store";
import { getEvidenceDisplayId, getInsightDisplayId } from "@/lib/discovery-data";
import {
  BackLink,
  CancelAction,
  DeleteAction,
  Field,
  FormActions,
  SaveAction,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";

export default function InsightDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const isNew = useSearchParams().get("new") === "1";
  const {
    ready,
    getInsight,
    updateInsight,
    deleteInsight,
    evidences,
    getEvidence,
    linkInsightEvidence,
    unlinkInsightEvidence,
  } = useDiscovery();

  const titleRef = useRef<HTMLInputElement>(null);
  const insight = getInsight(id);
  const insightId = insight?.id;
  const insightTitle = insight?.title ?? "";
  const insightDescription = insight?.description ?? "";
  const insightConfidenceScore = insight?.confidenceScore;
  const insightImpactScore = insight?.impactScore;
  const insightFrequencyScore = insight?.frequencyScore;
  const [draft, setDraft] = useState({
    title: "",
    description: "",
    confidenceScore: null as number | null | undefined,
    impactScore: null as number | null | undefined,
    frequencyScore: null as number | null | undefined,
  });

  useEffect(() => {
    if (!insightId) return;
    setDraft({
      title: insightTitle,
      description: insightDescription,
      confidenceScore: insightConfidenceScore,
      impactScore: insightImpactScore,
      frequencyScore: insightFrequencyScore,
    });
  }, [
    insightConfidenceScore,
    insightDescription,
    insightFrequencyScore,
    insightId,
    insightImpactScore,
    insightTitle,
  ]);

  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  const availableEvidences = useMemo(() => {
    if (!insight) return [];
    return evidences.filter(
      (evidence) => evidence.productId === insight.productId && !insight.evidenceIds.includes(evidence.id),
    );
  }, [evidences, insight]);

  if (!ready) return <div className="px-6 py-10 text-[var(--fg-faint)]">Carregando...</div>;
  if (!insight)
    return (
      <div className="px-6 py-10">
        <Link href="/insights" className="text-[var(--primary)] hover:underline">
          ← Voltar
        </Link>
        <p className="mt-3 text-[var(--fg-muted)]">Insight não encontrado.</p>
      </div>
    );

  const displayId = getInsightDisplayId(insight);
  const linkedEvidences = insight.evidenceIds.map((evidenceId) => getEvidence(evidenceId)).filter(Boolean);
  const dirty =
    draft.title !== insight.title ||
    draft.description !== insight.description ||
    draft.confidenceScore !== insight.confidenceScore ||
    draft.impactScore !== insight.impactScore ||
    draft.frequencyScore !== insight.frequencyScore;
  const resetDraft = () =>
    setDraft({
      title: insight.title,
      description: insight.description,
      confidenceScore: insight.confidenceScore,
      impactScore: insight.impactScore,
      frequencyScore: insight.frequencyScore,
    });
  const saveDraft = () => {
    updateInsight(insight.id, {
      title: draft.title.trim() || insight.title,
      description: draft.description,
      confidenceScore: draft.confidenceScore,
      impactScore: draft.impactScore,
      frequencyScore: draft.frequencyScore,
    });
    toast.success("Insight salvo");
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-4">
        <BackLink href="/insights" label="Insights" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        <div>
          {displayId && <div className="font-mono text-[12px] text-[var(--fg-faint)]">{displayId}</div>}
          <input
            ref={titleRef}
            value={draft.title}
            onChange={(e) => setDraft((current) => ({ ...current, title: e.target.value }))}
            placeholder="Título do insight"
            className="mt-1 w-full border-0 bg-transparent text-[28px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
          />

          <div className="mt-6">
            <div className="mb-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Descrição
            </div>
            <Textarea
              rows={6}
              value={draft.description}
              onChange={(e) => setDraft((current) => ({ ...current, description: e.target.value }))}
              placeholder="Síntese do aprendizado, padrão observado ou oportunidade."
              className="text-[16px]"
            />
          </div>

          <FormActions>
            <SaveAction disabled={!dirty} onClick={saveDraft} />
            <CancelAction disabled={!dirty} onClick={resetDraft} />
            <DeleteAction
              title="Excluir este insight?"
              description={`O insight "${insight.title}" será removido e seus vínculos com evidências serão desfeitos.`}
              onConfirm={() => {
                deleteInsight(insight.id);
                toast.success("Insight excluído");
                router.push("/insights");
              }}
            />
          </FormActions>

          <div className="mt-6">
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Evidências vinculadas ({linkedEvidences.length})
            </div>
            {linkedEvidences.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">
                Sem evidência vinculada. Este insight continua associado ao produto.
              </p>
            ) : (
              <ul className="space-y-1.5">
                {linkedEvidences.map((evidence) => {
                  if (!evidence) return null;
                  return (
                    <li
                      key={evidence.id}
                      className="flex items-center justify-between gap-3 rounded-md border bg-white px-2.5 py-2 text-[13px]"
                      style={{ borderColor: "var(--border)" }}
                    >
                      <Link href={`/evidencias/${evidence.id}`} className="min-w-0 hover:underline">
                        <span className="mr-2 font-mono text-[11px] text-[var(--fg-faint)]">
                          {getEvidenceDisplayId(evidence) ?? "Evidência"}
                        </span>
                        <span className="text-[var(--fg)]">{evidence.title}</span>
                      </Link>
                      <button
                        onClick={() => unlinkInsightEvidence(insight.id, evidence.id)}
                        className="inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-md text-[var(--fg-faint)] hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
                        aria-label="Remover vínculo"
                      >
                        <X size={14} />
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>

        <aside className="space-y-5">
          <Field label="Confiança">
            <ScoreInput
              value={draft.confidenceScore}
              onChange={(confidenceScore) => setDraft((current) => ({ ...current, confidenceScore }))}
            />
          </Field>

          <Field label="Impacto">
            <ScoreInput
              value={draft.impactScore}
              onChange={(impactScore) => setDraft((current) => ({ ...current, impactScore }))}
            />
          </Field>

          <Field label="Frequência">
            <ScoreInput
              value={draft.frequencyScore}
              onChange={(frequencyScore) => setDraft((current) => ({ ...current, frequencyScore }))}
            />
          </Field>

          <Field label="Adicionar evidência opcional">
            {availableEvidences.length === 0 ? (
              <p className="text-[13px] text-[var(--fg-faint)]">Nenhuma evidência disponível para vincular.</p>
            ) : (
              <select
                value=""
                onChange={(event) => {
                  if (!event.target.value) return;
                  linkInsightEvidence(insight.id, event.target.value);
                  event.target.value = "";
                }}
                className="w-full rounded-md border bg-white px-2.5 py-1.5 text-[13px] text-[var(--fg)] outline-none focus:border-[var(--primary)]"
                style={{ borderColor: "var(--border)" }}
              >
                <option value="">Selecionar evidência...</option>
                {availableEvidences.map((evidence) => (
                  <option key={evidence.id} value={evidence.id}>
                    {getEvidenceDisplayId(evidence) ?? "EV"} - {evidence.title}
                  </option>
                ))}
              </select>
            )}
          </Field>

          <Field label="Atualizado em">
            <div className="text-[13px] text-[var(--fg-muted)]">{formatDate(insight.updatedAt)}</div>
          </Field>
        </aside>
      </div>
    </div>
  );
}

function ScoreInput({
  value,
  onChange,
}: {
  value?: number | null;
  onChange: (value: number | null) => void;
}) {
  return (
    <TextInput
      type="number"
      min={0}
      max={100}
      step={1}
      value={value === null || value === undefined || Number.isNaN(value) ? "" : Math.round(value * 100)}
      onChange={(event) => {
        const raw = event.target.value;
        onChange(raw === "" ? null : Number(raw) / 100);
      }}
      placeholder="0-100%"
    />
  );
}
