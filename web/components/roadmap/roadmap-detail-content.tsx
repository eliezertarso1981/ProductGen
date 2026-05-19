"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import {
  CancelAction,
  DeleteAction,
  Field,
  FormActions,
  SaveAction,
  Select,
  TextInput,
  Textarea,
  formatDate,
} from "@/components/shared/crud-ui";
import { getPainDisplayId } from "@/lib/dores-data";
import { useDores } from "@/lib/dores-store";
import { getRoadmapDisplayId, roadmapStatusConfig, roadmapStatuses } from "@/lib/discovery-data";
import { useDiscovery } from "@/lib/discovery-store";

export function RoadmapDetailContent({
  id,
  isNew = false,
  onDeleted,
}: {
  id: string;
  isNew?: boolean;
  onDeleted?: () => void;
}) {
  const { ready, getRoadmap, updateRoadmap, deleteRoadmap } = useDiscovery();
  const { getPain } = useDores();

  const titleRef = useRef<HTMLInputElement>(null);
  const roadmap = getRoadmap(id);
  const roadmapId = roadmap?.id;
  const roadmapTitle = roadmap?.title ?? "";
  const roadmapDescription = roadmap?.description ?? "";
  const roadmapTargetDate = roadmap?.targetDate ? roadmap.targetDate.slice(0, 10) : "";
  const [draft, setDraft] = useState({ title: "", description: "", targetDate: "" });

  useEffect(() => {
    if (!roadmapId) return;
    setDraft({
      title: roadmapTitle,
      description: roadmapDescription,
      targetDate: roadmapTargetDate,
    });
  }, [roadmapDescription, roadmapId, roadmapTargetDate, roadmapTitle]);

  useEffect(() => {
    if (isNew) {
      titleRef.current?.focus();
      titleRef.current?.select();
    }
  }, [isNew]);

  if (!ready) return <div className="py-5 text-[13px] text-[#9aa0b1]">Carregando...</div>;
  if (!roadmap) {
    return <p className="text-[14px] text-[#6b7287]">Item não encontrado.</p>;
  }

  const pain = roadmap.painId ? getPain(roadmap.painId) : undefined;
  const displayId = getRoadmapDisplayId(roadmap);
  const dirty =
    draft.title !== roadmap.title ||
    draft.description !== roadmap.description ||
    draft.targetDate !== (roadmap.targetDate ? roadmap.targetDate.slice(0, 10) : "");
  const resetDraft = () =>
    setDraft({
      title: roadmap.title,
      description: roadmap.description,
      targetDate: roadmap.targetDate ? roadmap.targetDate.slice(0, 10) : "",
    });
  const saveDraft = () => {
    updateRoadmap(roadmap.id, {
      title: draft.title.trim() || roadmap.title,
      description: draft.description,
      targetDate: draft.targetDate ? new Date(draft.targetDate).toISOString() : undefined,
    });
    toast.success("Roadmap salvo");
  };

  return (
    <div>
      {displayId && <div className="font-mono text-[12px] text-[#9aa0b1]">{displayId}</div>}
      <input
        ref={titleRef}
        value={draft.title}
        onChange={(event) => setDraft((current) => ({ ...current, title: event.target.value }))}
        placeholder="Título do item"
        className="mt-1 w-full border-0 bg-transparent text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a] outline-none placeholder:text-[#9aa0b1] focus:bg-[#f7f8fa] focus:px-2 focus:py-1"
      />

      <div className="mt-6">
        <div className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.04em] text-[#4e5567]">
          Descrição
        </div>
        <Textarea
          rows={6}
          value={draft.description}
          onChange={(event) => setDraft((current) => ({ ...current, description: event.target.value }))}
          placeholder="Escopo, hipótese de valor e critérios de pronto."
          className="text-[16px]"
        />
      </div>

      <FormActions>
        <SaveAction disabled={!dirty} onClick={saveDraft} />
        <CancelAction disabled={!dirty} onClick={resetDraft} />
        <DeleteAction
          title="Excluir este item de roadmap?"
          description={`O item "${roadmap.title}" será removido do roadmap. Outcomes vinculados perdem esta referência.`}
          onConfirm={() => {
            deleteRoadmap(roadmap.id);
            toast.success("Item de roadmap excluído");
            onDeleted?.();
          }}
        />
      </FormActions>

      <aside className="mt-6 space-y-5 border-t border-[#dde0e8] pt-5">
        <Field label="Coluna">
          <Select
            value={roadmap.status}
            onChange={(status) => updateRoadmap(roadmap.id, { status })}
            options={roadmapStatuses.map((status) => ({
              value: status,
              label: roadmapStatusConfig[status].label,
              dot: roadmapStatusConfig[status].dot,
            }))}
          />
        </Field>

        <Field label="Dor de origem">
          {pain ? (
            <Link
              href={`/dores/${pain.id}`}
              className="block rounded-md border border-[#dde0e8] bg-white p-2.5 text-[13px] hover:bg-[#f7f8fa]"
            >
              {getPainDisplayId(pain) && (
                <div className="font-mono text-[11px] text-[#9aa0b1]">{getPainDisplayId(pain)}</div>
              )}
              <div className="mt-0.5 text-[#2b364a]">{pain.title}</div>
            </Link>
          ) : (
            <p className="text-[13px] text-[#9aa0b1]">Sem dor vinculada.</p>
          )}
        </Field>

        <Field label="Data prevista">
          <TextInput
            type="date"
            value={draft.targetDate}
            onChange={(event) => setDraft((current) => ({ ...current, targetDate: event.target.value }))}
          />
        </Field>

        <Field label="Atualizado">
          <div className="text-[13px] text-[#6b7287]">{formatDate(roadmap.updatedAt)}</div>
        </Field>
      </aside>
    </div>
  );
}
