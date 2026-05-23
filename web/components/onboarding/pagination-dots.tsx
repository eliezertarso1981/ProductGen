"use client";

import { brand } from "@/lib/theme";

type PaginationDotsProps = {
  total: number;
  activeIndex: number;
  onSelect?: (index: number) => void;
  className?: string;
};

export function PaginationDots({
  total,
  activeIndex,
  onSelect,
  className = "",
}: PaginationDotsProps) {
  return (
    <div className={`flex items-center justify-center gap-2 ${className}`} role="tablist">
      {Array.from({ length: total }, (_, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active}
            aria-label={`Slide ${i + 1} de ${total}`}
            onClick={() => onSelect?.(i)}
            className="rounded-full transition-all duration-200"
            style={{
              width: active ? 24 : 8,
              height: 8,
              backgroundColor: active ? brand.primary : "rgba(148, 163, 184, 0.35)",
            }}
          />
        );
      })}
    </div>
  );
}
