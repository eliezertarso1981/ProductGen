export const colors = {
  primary: "#13c8b5",
  primaryHover: "#21a3a3",
  accent: "#6cf3d5",
  neutralDark: "#2b364a",
  muted: "#7375a5",

  neutral: {
    0: "#ffffff",
    50: "#f7f8fa",
    100: "#eef0f4",
    200: "#dde0e8",
    300: "#c4c9d4",
    400: "#9aa0b1",
    500: "#6b7287",
    600: "#4e5567",
    700: "#373d4d",
    800: "#222838",
    900: "#0f1419",
  },

  semantic: {
    success: "#10b981",
    successBg: "rgba(16, 185, 129, 0.10)",
    successBorder: "rgba(16, 185, 129, 0.20)",
    warning: "#f59e0b",
    warningBg: "rgba(245, 158, 11, 0.10)",
    warningBorder: "rgba(245, 158, 11, 0.20)",
    danger: "#dc2626",
    dangerBg: "rgba(220, 38, 38, 0.10)",
    dangerBorder: "rgba(220, 38, 38, 0.20)",
  },

  entity: {
    evidence: "#7375a5",
    pain: "#dc2626",
    hypothesis: "#7c3aed",
    experiment: "#f59e0b",
    roadmap: "#13c8b5",
    outcome: "#10b981",
    persona: "#7375a5",
    pillar: "#2b364a",
    okr: "#2b364a",
  },
} as const;

export const shadow = {
  none: "none",
  xs: "0 1px 2px rgba(15, 20, 25, 0.04)",
  sm: "0 1px 3px rgba(15, 20, 25, 0.08), 0 1px 2px rgba(15, 20, 25, 0.04)",
  md: "0 4px 6px rgba(15, 20, 25, 0.07), 0 2px 4px rgba(15, 20, 25, 0.04)",
  lg: "0 10px 15px rgba(15, 20, 25, 0.08), 0 4px 6px rgba(15, 20, 25, 0.04)",
  focusRing: "0 0 0 3px rgba(19, 200, 181, 0.20)",
  focusRingDanger: "0 0 0 3px rgba(220, 38, 38, 0.20)",
} as const;
