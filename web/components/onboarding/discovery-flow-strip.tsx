"use client";

import { ChevronRight } from "lucide-react";
import type { AuthTheme } from "@/lib/theme";
import { brand, palette } from "@/lib/theme";
import { DISCOVERY_STAGES, type DiscoveryStageId } from "@/lib/onboarding-discovery";

type DiscoveryFlowStripProps = {
  theme: AuthTheme;
  activeId?: DiscoveryStageId;
  compact?: boolean;
  onStageClick?: (id: DiscoveryStageId) => void;
};

export function DiscoveryFlowStrip({
  theme,
  activeId,
  compact = false,
  onStageClick,
}: DiscoveryFlowStripProps) {
  const p = palette[theme];
  const isDark = theme === "dark";

  return (
    <div
      className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      role="list"
      aria-label="Fluxo de discovery"
    >
      <div className="flex min-w-max items-stretch gap-1 px-0.5">
        {DISCOVERY_STAGES.map((stage, index) => {
          const active = activeId === stage.id;
          const Icon = stage.icon;
          const clickable = Boolean(onStageClick);

          return (
            <div key={stage.id} className="flex items-center" role="listitem">
              <button
                type="button"
                disabled={!clickable}
                onClick={() => onStageClick?.(stage.id)}
                className={`group flex flex-col items-center rounded-xl border px-2 py-2.5 text-center transition-all duration-200 ${
                  compact ? "min-w-[4.5rem]" : "min-w-[5.25rem]"
                } ${clickable ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"}`}
                style={{
                  borderColor: active ? brand.primary : p.border,
                  background: active
                    ? isDark
                      ? "linear-gradient(160deg, rgba(19, 200, 181, 0.2) 0%, rgba(17, 24, 39, 0.95) 100%)"
                      : "linear-gradient(160deg, rgba(19, 200, 181, 0.14) 0%, #ffffff 100%)"
                    : isDark
                      ? "#0f172a"
                      : "var(--bg-subtle)",
                  boxShadow: active
                    ? isDark
                      ? "0 8px 20px -6px rgba(19, 200, 181, 0.35)"
                      : "0 8px 20px -6px rgba(19, 200, 181, 0.2)"
                    : "0 2px 8px -2px rgba(15, 23, 42, 0.08)",
                }}
              >
                <span
                  className={`mb-1.5 flex items-center justify-center rounded-lg ${
                    compact ? "h-8 w-8" : "h-9 w-9"
                  }`}
                  style={{
                    backgroundColor: active ? "rgba(19, 200, 181, 0.2)" : isDark ? "#1e293b" : "#eef0f4",
                    color: active ? brand.primary : p.textSecondary,
                  }}
                >
                  <Icon size={compact ? 16 : 18} strokeWidth={2} />
                </span>
                <span
                  className={`font-medium leading-tight ${compact ? "text-[10px]" : "text-[11px]"}`}
                  style={{ color: active ? p.textPrimary : p.textSecondary }}
                >
                  {stage.shortLabel}
                </span>
              </button>
              {index < DISCOVERY_STAGES.length - 1 ? (
                <ChevronRight
                  size={14}
                  className="mx-0.5 shrink-0 opacity-40"
                  style={{ color: p.textSecondary }}
                  aria-hidden
                />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
