"use client";

import type { AuthTheme } from "@/lib/theme";
import { brand, palette } from "@/lib/theme";

type OnboardingStepHeaderProps = {
  theme: AuthTheme;
  title: string;
  subtitle?: string;
  stepIndex: number;
  totalSteps: number;
};

export function OnboardingStepHeader({
  theme,
  title,
  subtitle,
  stepIndex,
  totalSteps,
}: OnboardingStepHeaderProps) {
  const p = palette[theme];
  const progress = Math.min(100, Math.round((stepIndex / totalSteps) * 100));

  return (
    <header className="mb-6">
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full"
        style={{ backgroundColor: theme === "dark" ? "#1e293b" : "#eef0f4" }}
      >
        <div
          className="h-full rounded-full transition-all duration-300 ease-out"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--primary) 0%, #6cf3d5 100%)",
            boxShadow: "0 0 12px rgba(19, 200, 181, 0.4)",
          }}
        />
      </div>
      <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: brand.primary }}>
        Configuração · {stepIndex} de {totalSteps}
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl" style={{ color: p.textPrimary }}>
        {title}
      </h1>
      {subtitle ? (
        <p className="mt-2 text-sm leading-relaxed" style={{ color: p.textSecondary }}>
          {subtitle}
        </p>
      ) : null}
    </header>
  );
}
