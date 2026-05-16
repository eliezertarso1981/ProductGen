import type { AuthTheme } from "@/lib/theme";
import { palette } from "@/lib/theme";

export function BrandMark({ theme = "light" }: { theme?: AuthTheme }) {
  const p = palette[theme];
  return (
    <div className="inline-flex items-center gap-2.5">
      <svg width="36" height="32" viewBox="0 0 36 32" fill="none" aria-hidden>
        <rect x="0" y="2" width="22" height="6" rx="3" fill="#5eead4" />
        <rect x="0" y="12" width="32" height="6" rx="3" fill="var(--primary)" />
        <rect x="0" y="22" width="26" height="6" rx="3" fill="#0d9488" />
      </svg>
      <span className="text-[20px] font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Product<span style={{ color: "var(--primary)" }}>Gen</span>
      </span>
    </div>
  );
}
