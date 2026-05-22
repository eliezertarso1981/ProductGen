"use client";

import { useEffect, useRef } from "react";
import Sortable from "sortablejs";

export type StatusBoardColumn<TStatus extends string> = {
  status: TStatus;
  label: string;
  dot: string;
  accent?: string;
};

interface StatusBoardProps<TItem, TStatus extends string> {
  columns: StatusBoardColumn<TStatus>[];
  items: TItem[];
  getItemId: (item: TItem) => string;
  getItemStatus: (item: TItem) => TStatus;
  onSelect: (item: TItem) => void;
  onMove?: (id: string, status: TStatus) => void;
  renderCard: (item: TItem) => React.ReactNode;
  groupName?: string;
  emptyLabel?: string;
}

export function StatusBoard<TItem, TStatus extends string>({
  columns,
  items,
  getItemId,
  getItemStatus,
  onSelect,
  onMove,
  renderCard,
  groupName = "status-board",
  emptyLabel = "Vazio",
}: StatusBoardProps<TItem, TStatus>) {
  const listRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const onMoveRef = useRef(onMove);
  onMoveRef.current = onMove;

  useEffect(() => {
    if (!onMove) return;
    const instances: Sortable[] = [];
    columns.forEach((column) => {
      const el = listRefs.current[column.status];
      if (!el) return;
      instances.push(
        Sortable.create(el, {
          group: groupName,
          animation: 180,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          ghostClass: "pain-ghost",
          chosenClass: "pain-chosen",
          dragClass: "pain-drag",
          forceFallback: true,
          fallbackOnBody: true,
          fallbackTolerance: 4,
          onEnd: (evt) => {
            const id = evt.item.dataset.itemId;
            const target = (evt.to as HTMLElement).dataset.status as TStatus | undefined;
            if (evt.from !== evt.to || evt.oldIndex !== evt.newIndex) {
              const fromChildren = evt.from.children;
              const reference = fromChildren[evt.oldIndex ?? 0] ?? null;
              evt.from.insertBefore(evt.item, reference);
            }
            if (id && target) onMoveRef.current?.(id, target);
          },
        }),
      );
    });
    return () => instances.forEach((instance) => instance.destroy());
  }, [columns, groupName, onMove]);

  return (
    <div className="flex w-full gap-4 overflow-x-auto pb-4">
      {columns.map((column) => {
        const columnItems = items.filter((item) => getItemStatus(item) === column.status);
        return (
          <div key={column.status} className="flex min-w-[240px] flex-1 flex-col rounded-xl">
            <div
              className="relative flex items-center justify-between rounded-t-xl px-3 py-2"
              style={{ backgroundColor: column.accent ?? "var(--bg-muted)" }}
            >
              <div className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full" style={{ backgroundColor: column.dot }} />
                <span className="text-[14px] font-semibold text-[var(--fg)]">{column.label}</span>
                <span className="text-[12px] text-[var(--fg-faint)]">({columnItems.length})</span>
              </div>
            </div>
            <div
              ref={(el) => {
                listRefs.current[column.status] = el;
              }}
              data-status={column.status}
              className="flex min-h-[120px] flex-col gap-2 rounded-b-xl bg-[var(--bg-muted)] p-2"
            >
              {columnItems.length === 0 && (
                <div className="px-2 py-3 text-[12px] text-[var(--border-strong)]">{emptyLabel}</div>
              )}
              {columnItems.map((item) => (
                <div key={getItemId(item)} data-item-id={getItemId(item)}>
                  <button
                    type="button"
                    onClick={() => onSelect(item)}
                    className="w-full rounded-lg border border-[var(--border)] bg-[var(--bg-elevated)] p-3 text-left transition-colors hover:border-[var(--border-strong)] hover:bg-[var(--bg-muted)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--primary)]"
                  >
                    {renderCard(item)}
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
