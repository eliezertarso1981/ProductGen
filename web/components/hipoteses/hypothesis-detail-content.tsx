"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { VisualEvidence } from "@/components/hipoteses/visual-evidence";
import {
  CancelAction,
  DeleteAction,
  Field,
  FormActions,
  SaveAction,
  Select,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";
import { Avatar } from "@/components/shared/avatar";
import { getPainDisplayId, ownersList } from "@/lib/dores-data";
import { useDores } from "@/lib/dores-store";
import {
  experimentStatusConfig,
  getExperimentDisplayId,
  getHypothesisDisplayId,
  hypothesisStatusConfig,
  hypothesisStatuses,
} from "@/lib/discovery-data";
import { useDiscovery } from "@/lib/discovery-store";

export function HypothesisDetailContent({
  id,
  isNew = false,
  onDeleted,
}: {
  id: string;
  isNew?: boolean;
  onDeleted?: () => void;
}) {
  const router = useRouter();
  const {
    ready,
    getHypothesis,
    updateHypothesis,
    deleteHypothesis,
    experimentsByHypothesis,
    createExperiment,
    createRoadmap,
  } = useDiscovery();
  const { getPain, pains } = useDores();

  const titleRef = useRef<HTMLInputElement>(null);
  const h = getHypothesis(id);
  const hId = h?.id;
  const hTitle = h?.title ?? "";
  const hStatement = h?.statement ?? "";
  const hPainId = h?.painId ?? "";
  const hOwnerId = h?.owner.id ?? "";
  const [draft, setDraft] = useState({ title: "", statement: "", painId: "", ownerId: "" });

  useEffect(() => {
    if (!hId) return;
    setDraft({ title: hTitle, statement: hStatement, painId: hPainId, ownerId: hOwnerId });
  }, [hId, hOwnerId, hPainId, hStatement, hTitle]);

  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="py-5 text-[13px] text-[#9aa0b1]">Carregando...</div>;
  if (!h) {
    return <p className="text-[14px] text-[#6b7287]">Hipótese não encontrada.</p>;
  }

  const pain = h.painId ? getPain(h.painId) : undefined;
  const productPains = pains.filter((painItem) => painItem.productId === h.productId);
  const experiments = experimentsByHypothesis(h.id);
  const displayId = getHypothesisDisplayId(h);
  const selectedOwner = ownersList.find((owner) => owner.id === draft.ownerId) ?? h.owner;
  const dirty =
    draft.title !== h.title ||
    draft.statement !== h.statement ||
    draft.painId !== (h.painId ?? "") ||
    draft.ownerId !== h.owner.id;
  const resetDraft = () =>
    setDraft({
      title: h.title,
      statement: h.statement,
      painId: h.painId ?? "",
      ownerId: h.owner.id,
    });
  const saveDraft = () => {
    updateHypothesis(h.id, {
      title: draft.title.trim() || h.title,
      statement: draft.statement,
      painId: draft.painId || undefined,
      owner: selectedOwner,
    });
    toast.success("Hipótese salva");
  };

  return (
    <div>
      {displayId && <div className="font-mono text-[12px] text-[#9aa0b1]">{displayId}</div>}
      <input
        ref={titleRef}
        value={draft.title}
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        placeholder="Título da hipótese"
        className="mt-1 w-full border-0 bg-transparent text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a] outline-none placeholder:text-[#9aa0b1] focus:bg-[#f7f8fa] focus:px-2 focus:py-1"
      />

      <div className="mt-6">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#4e5567]">
          Enunciado
        </div>
        <Textarea
          rows={6}
          value={draft.statement}
          onChange={(event) => setDraft((current) => ({ ...current, statement: event.target.value }))}
          placeholder="Acreditamos que [solução] para [persona] vai gerar [resultado] e saberemos disso quando [métrica]."
          className="text-[16px]"
        />
      </div>

      <FormActions>
        <SaveAction disabled={!dirty} onClick={saveDraft} />
        <CancelAction disabled={!dirty} onClick={resetDraft} />
        <DeleteAction
          title="Excluir esta hipótese?"
          description={`A hipótese "${h.title}" será removida e deixará de aparecer nos experimentos e roadmap vinculados.`}
          onConfirm={() => {
            deleteHypothesis(h.id);
            toast.success("Hipótese excluída");
            onDeleted?.();
          }}
        />
      </FormActions>

      <VisualEvidence
        prototypes={h.prototypes}
        images={h.images}
        onChange={(patch) => updateHypothesis(h.id, patch)}
      />

      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between gap-3">
          <div className="text-[11px] font-medium uppercase tracking-[0.04em] text-[#4e5567]">
            Experimentos ({experiments.length})
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!h.painId}
              onClick={() => {
                if (!h.painId) return;
                void createRoadmap(h.productId, h.painId, h.id)
                  .then((roadmap) => {
                    router.push(`/roadmap/${roadmap.id}?new=1`);
                  })
                  .catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Não foi possível criar o roadmap");
                  });
              }}
              className="inline-flex items-center gap-1 rounded-md border border-[#dde0e8] px-2 py-1 text-[11px] text-[#6b7287] hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
              title={!h.painId ? "Hipótese sem dor vinculada" : "Gerar item de roadmap"}
              type="button"
            >
              <Plus size={12} /> Gerar item de roadmap
            </button>
            <button
              onClick={() => {
                void createExperiment(h.productId, h.id)
                  .then((experiment) => {
                    router.push(`/experimentos/${experiment.id}?new=1`);
                  })
                  .catch((error) => {
                    toast.error(error instanceof Error ? error.message : "Não foi possível criar o experimento");
                  });
              }}
              className="inline-flex items-center gap-1 rounded-md border border-[#dde0e8] px-2 py-1 text-[11px] text-[#6b7287] hover:bg-[#f7f8fa]"
              type="button"
            >
              <Plus size={12} /> Novo experimento
            </button>
          </div>
        </div>
        {experiments.length === 0 ? (
          <p className="text-[13px] text-[#9aa0b1]">Nenhum experimento ainda.</p>
        ) : (
          <ul className="space-y-1.5">
            {experiments.map((experiment) => {
              const cfg = experimentStatusConfig[experiment.status];
              return (
                <li key={experiment.id}>
                  <Link
                    href={`/experimentos/${experiment.id}`}
                    className="flex items-center justify-between rounded-md border border-[#dde0e8] bg-white px-2.5 py-2 text-[13px] hover:bg-[#f7f8fa]"
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="font-mono text-[11px] text-[#9aa0b1]">
                        {getExperimentDisplayId(experiment) ?? "Experimento"}
                      </span>
                      <span className="truncate text-[#2b364a]">{experiment.title}</span>
                    </span>
                    <span className="inline-flex items-center gap-1.5 text-[12px] text-[#6b7287]">
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

      <aside className="mt-6 space-y-5 border-t border-[#dde0e8] pt-5">
        <Field label="Status">
          <Select
            value={h.status}
            onChange={(status) => updateHypothesis(h.id, { status })}
            options={hypothesisStatuses.map((status) => ({
              value: status,
              label: hypothesisStatusConfig[status].label,
              dot: hypothesisStatusConfig[status].dot,
            }))}
          />
        </Field>

        <Field label="Dor de origem">
          <select
            value={draft.painId}
            onChange={(event) => setDraft((current) => ({ ...current, painId: event.target.value }))}
            className="h-10 w-full rounded-md border border-[#dde0e8] bg-[#ffffff] px-3 text-[14px] text-[#2b364a] outline-none focus:border-[#13c8b5] focus:shadow-[0_0_0_3px_rgba(19,200,181,0.15)]"
          >
            <option value="">Sem dor vinculada</option>
            {productPains.map((painItem) => (
              <option key={painItem.id} value={painItem.id}>
                {getPainDisplayId(painItem) ? `${getPainDisplayId(painItem)} · ` : ""}
                {painItem.title}
              </option>
            ))}
          </select>
          {pain && (
            <Link
              href={`/dores/${pain.id}`}
              className="mt-2 inline-flex text-[12px] font-medium text-[#13c8b5] hover:underline"
            >
              Abrir dor vinculada
            </Link>
          )}
        </Field>

        <Field label="Owner">
          <div className="flex items-center gap-3 rounded-md border border-[#dde0e8] bg-[#ffffff] px-3 py-2">
            <Avatar initials={selectedOwner.initials} color={selectedOwner.color} size={28} />
            <select
              value={draft.ownerId}
              onChange={(event) => setDraft((current) => ({ ...current, ownerId: event.target.value }))}
              className="h-8 min-w-0 flex-1 bg-transparent text-[14px] font-medium text-[#2b364a] outline-none"
              aria-label="Selecionar owner"
            >
              {ownersList.map((owner) => (
                <option key={owner.id} value={owner.id}>
                  {owner.name ?? owner.initials}
                </option>
              ))}
            </select>
          </div>
        </Field>
        <Field label="Atualizada em">
          <div className="text-[13px] text-[#6b7287]">{formatDate(h.updatedAt)}</div>
        </Field>
      </aside>
    </div>
  );
}
