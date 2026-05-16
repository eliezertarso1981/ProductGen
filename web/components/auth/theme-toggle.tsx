"use client";

import { Sun, Moon } from "lucide-react";
import type { AuthTheme } from "@/lib/theme";
import { palette } from "@/lib/theme";

export function ThemeToggle({ theme, onToggle }: { theme: AuthTheme; onToggle: () => void }) {
  const p = palette[theme];
  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === "dark" ? "Modo claro" : "Modo escuro"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-lg border transition-colors"
      style={{
        borderColor: p.border,
        backgroundColor: p.inputBg,
        color: p.textSecondary,
      }}
    >
      <Icon size={16} />
    </button>
  );
}
