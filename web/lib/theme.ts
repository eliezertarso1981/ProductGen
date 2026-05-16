"use client";

import { useEffect, useState } from "react";

const KEY = "auth-theme";

export type AuthTheme = "light" | "dark";

export function useAuthTheme(): [AuthTheme, (t: AuthTheme) => void, boolean] {
  const [theme, setThemeState] = useState<AuthTheme>("light");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const saved =
      (typeof window !== "undefined" && (localStorage.getItem(KEY) as AuthTheme)) || "light";
    setThemeState(saved === "dark" ? "dark" : "light");
    setReady(true);
  }, []);

  const setTheme = (t: AuthTheme) => {
    setThemeState(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      /* noop */
    }
  };

  return [theme, setTheme, ready];
}

export const palette = {
  light: {
    canvas: "var(--bg-elevated)",
    textPrimary: "var(--fg)",
    textSecondary: "var(--fg-subtle)",
    textMuted: "var(--fg-faint)",
    border: "var(--border)",
    inputBg: "var(--bg-elevated)",
    socialBg: "var(--bg-elevated)",
    hover: "var(--bg-muted)",
    errorBg: "var(--bg-elevated)",
  },
  dark: {
    canvas: "#0a0f1c",
    textPrimary: "var(--bg-elevated)",
    textSecondary: "var(--fg-faint)",
    textMuted: "#64748b",
    border: "#1e293b",
    inputBg: "#111827",
    socialBg: "#0f172a",
    hover: "#0f172a",
    errorBg: "#0a0f1c",
  },
} as const;

export const brand = {
  primary: "var(--primary)",
  primaryHover: "#0fb3a1",
  primarySoft: "var(--primary-soft)",
  danger: "var(--danger)",
  dangerSoft: "var(--danger-soft)",
  panelDark: "#0f172a",
};
