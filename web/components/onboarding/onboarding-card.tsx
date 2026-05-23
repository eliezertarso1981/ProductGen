"use client";

import type { ReactNode } from "react";
import type { AuthTheme } from "@/lib/theme";
import { palette } from "@/lib/theme";

type OnboardingCardProps = {
  theme: AuthTheme;
  children: ReactNode;
  className?: string;
  glow?: boolean;
};

export function OnboardingCard({
  theme,
  children,
  className = "",
  glow = true,
}: OnboardingCardProps) {
  const p = palette[theme];
  const isDark = theme === "dark";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border ${className}`}
      style={{
        borderColor: p.border,
        backgroundColor: isDark ? "#111827" : "var(--bg-elevated)",
        boxShadow: isDark
          ? "0 24px 48px -12px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(19, 200, 181, 0.08)"
          : "var(--shadow-lg)",
      }}
    >
      {glow ? (
        <div
          aria-hidden
          className="pointer-events-none absolute -inset-px rounded-2xl opacity-80"
          style={{
            background:
              isDark
                ? "linear-gradient(135deg, rgba(19, 200, 181, 0.22) 0%, rgba(115, 117, 165, 0.12) 45%, transparent 70%)"
                : "linear-gradient(135deg, rgba(19, 200, 181, 0.12) 0%, rgba(108, 243, 213, 0.08) 50%, transparent 75%)",
          }}
        />
      ) : null}
      <div className="relative p-5 md:p-6">{children}</div>
    </div>
  );
}
