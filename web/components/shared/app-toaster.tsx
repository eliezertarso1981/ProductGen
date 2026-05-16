"use client";

import { Toaster } from "sonner";
import { useTheme } from "@/lib/theme-context";

export function AppToaster() {
  const { theme } = useTheme();
  return (
    <Toaster
      theme={theme}
      position="bottom-right"
      richColors
      closeButton
      toastOptions={{
        style: {
          background: "var(--bg-elevated)",
          color: "var(--fg)",
          border: "1px solid var(--border)",
        },
      }}
    />
  );
}
