"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Sortable from "sortablejs";
import { Plus, MoreHorizontal } from "lucide-react";
import { boardColumns, statusConfig, type Pain, type PainStatus } from "@/lib/dores-data";
import { PainCard } from "./pain-card";

interface Props {
  pains: Pain[];
  onMove: (id: string, status: PainStatus) => void;
}

export function PainBoard({ pains, onMove }: Props) {
  const router = useRouter();
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    const instances: Sortable[] = [];
    boardColumns.forEach((status) => {
      const el = listRefs.current[status];
      if (!el) return;
      instances.push(
        Sortable.create(el, {
          group: "pains",
          animation: 180,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          ghostClass: "pain-ghost",
          chosenClass: "pain-chosen",
          dragClass: "pain-drag",
          forceFallback: true,
          fallbackOnBody: true,
          fallbackTolerance: 4,
          onEnd: (evt) => {
            const id = evt.item.dataset.painId;
            const target = (evt.to as HTMLElement).dataset.status as PainStatus | undefined;
            // Revert Sortable's DOM mutation so React can reconcile cleanly.
            if (evt.from !== evt.to || evt.oldIndex !== evt.newIndex) {
              const fromChildren = evt.from.children;
              const reference = fromChildren[evt.oldIndex ?? 0] ?? null;
              evt.from.insertBefore(evt.item, reference);
            }
            if (id && target) onMoveRef.current(id, target);
          },
        }),
      );
    });
    return () => instances.forEach((i) => i.destroy());
  }, []);

  return (
    <div className="flex w-full gap-4 pb-4">
      {boardColumns.map((status) => {
        const cfg = statusConfig[status];
        const items = pains.filter((p) => p.status === status);

        return (
          <div key={status} className="flex min-w-0 flex-1 flex-col rounded-xl">
            <div
              className="relative flex items-center justify-between rounded-t-xl px-2 py-2"
              style={{ backgroundColor: status === "em_validacao" ? "var(--info-soft)" : "var(--bg-muted)" }}
            >
              {cfg.accent && (
                <span
                  className="absolute left-0 right-0 top-0 h-[2px] rounded-t-xl"
                  style={{ backgroundColor: cfg.accent }}
                />
              )}
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: cfg.dot }} />
                <span className="text-[14px] font-semibold" style={{ color: "var(--fg)" }}>
                  {cfg.label}
                </span>
                <span className="text-[13px]" style={{ color: "var(--fg-faint)" }}>
                  ({items.length})
                </span>
              </div>
              <div className="flex items-center gap-1" style={{ color: "var(--fg-faint)" }}>
                <button className="rounded p-1 hover:bg-white" aria-label="Adicionar dor">
                  <Plus size={14} />
                </button>
                <button className="rounded p-1 hover:bg-white" aria-label="Mais opções">
                  <MoreHorizontal size={14} />
                </button>
              </div>
            </div>

            <div
              ref={(el) => {
                listRefs.current[status] = el;
              }}
              data-status={status}
              className="flex min-h-[120px] flex-col gap-2 rounded-b-xl p-2 transition-colors"
            >
              {items.map((p) => (
                <div key={p.id} data-pain-id={p.id}>
                  <PainCard pain={p} onSelect={() => router.push(`/dores/${p.id}`)} />
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
