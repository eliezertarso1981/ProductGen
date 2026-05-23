"use client";

import { useCallback, useState } from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import type { AuthTheme } from "@/lib/theme";
import { brand, palette } from "@/lib/theme";
import {
  DISCOVERY_STAGES,
  INTRO_CAROUSEL_SLIDES,
  type DiscoveryStageId,
} from "@/lib/onboarding-discovery";
import { OnboardingCard } from "./onboarding-card";
import { DiscoveryFlowStrip } from "./discovery-flow-strip";
import { PaginationDots } from "./pagination-dots";

type DiscoveryFlowIntroProps = {
  theme: AuthTheme;
  onContinue: () => void;
};

export function DiscoveryFlowIntro({ theme, onContinue }: DiscoveryFlowIntroProps) {
  const p = palette[theme];
  const isDark = theme === "dark";
  const [slideIndex, setSlideIndex] = useState(0);
  const [activeStage, setActiveStage] = useState<DiscoveryStageId>("product");

  const slide = INTRO_CAROUSEL_SLIDES[slideIndex];
  const isLast = slideIndex === INTRO_CAROUSEL_SLIDES.length - 1;

  const goNext = useCallback(() => {
    if (isLast) {
      onContinue();
      return;
    }
    setSlideIndex((i) => Math.min(i + 1, INTRO_CAROUSEL_SLIDES.length - 1));
  }, [isLast, onContinue]);

  const goPrev = useCallback(() => {
    setSlideIndex((i) => Math.max(i - 1, 0));
  }, []);

  const stage = DISCOVERY_STAGES.find((s) => s.id === activeStage) ?? DISCOVERY_STAGES[0];
  const StageIcon = stage.icon;

  return (
    <div className="space-y-5">
      <OnboardingCard theme={theme}>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            {slide.kind === "welcome" ? (
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  background: "linear-gradient(135deg, var(--primary) 0%, #6cf3d5 100%)",
                  boxShadow: "0 8px 24px -6px rgba(19, 200, 181, 0.45)",
                  color: "#fff",
                }}
              >
                <Sparkles size={20} />
              </span>
            ) : null}
            <div className="min-w-0 flex-1">
              <h2 className="text-xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
                {slide.title}
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: p.textSecondary }}>
                {slide.subtitle}
              </p>
            </div>
          </div>

          {(slide.kind === "welcome" || slide.kind === "pipeline") && (
            <DiscoveryFlowStrip
              theme={theme}
              activeId={slide.kind === "pipeline" ? activeStage : undefined}
              onStageClick={slide.kind === "pipeline" ? setActiveStage : undefined}
            />
          )}

          {slide.kind === "pipeline" && (
            <div
              className="rounded-xl border p-4"
              style={{
                borderColor: p.border,
                background: isDark
                  ? "linear-gradient(180deg, #1a1f2e 0%, #0f172a 100%)"
                  : "linear-gradient(180deg, #f7f8fa 0%, #ffffff 100%)",
                boxShadow: isDark
                  ? "inset 0 1px 0 rgba(255,255,255,0.04)"
                  : "var(--shadow-sm)",
              }}
            >
              <div className="flex items-start gap-3">
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                  style={{
                    backgroundColor: "rgba(19, 200, 181, 0.15)",
                    color: brand.primary,
                    boxShadow: "0 4px 12px -4px rgba(19, 200, 181, 0.35)",
                  }}
                >
                  <StageIcon size={22} strokeWidth={2} />
                </span>
                <div>
                  <p className="text-sm font-semibold" style={{ color: p.textPrimary }}>
                    {stage.label}
                  </p>
                  <p className="mt-1 text-sm leading-relaxed" style={{ color: p.textSecondary }}>
                    {stage.description}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed" style={{ color: p.textMuted }}>
                    {stage.detail}
                  </p>
                </div>
              </div>
            </div>
          )}

          {slide.kind === "setup" && (
            <ul className="space-y-2 text-sm" style={{ color: p.textSecondary }}>
              <li className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: brand.primary }}
                >
                  1
                </span>
                Cadastre seu primeiro produto
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: brand.primary }}
                >
                  2
                </span>
                Defina pilares estratégicos
              </li>
              <li className="flex items-center gap-2">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-md text-xs font-semibold text-white"
                  style={{ backgroundColor: brand.primary }}
                >
                  3
                </span>
                Opcional: primeiros OKRs
              </li>
            </ul>
          )}
        </div>
      </OnboardingCard>

      <PaginationDots
        total={INTRO_CAROUSEL_SLIDES.length}
        activeIndex={slideIndex}
        onSelect={setSlideIndex}
      />

      <div className="flex gap-3">
        {slideIndex > 0 ? (
          <button
            type="button"
            onClick={goPrev}
            className="flex-1 rounded-xl border py-3 text-sm font-medium transition-opacity hover:opacity-90"
            style={{ borderColor: p.border, color: p.textPrimary }}
          >
            Voltar
          </button>
        ) : null}
        <button
          type="button"
          onClick={goNext}
          className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95"
          style={{
            background: "linear-gradient(135deg, var(--primary) 0%, #21a3a3 100%)",
            boxShadow: "0 12px 28px -8px rgba(19, 200, 181, 0.5)",
          }}
        >
          {slide.ctaLabel ?? (isLast ? "Começar configuração" : "Continuar")}
          <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
}
