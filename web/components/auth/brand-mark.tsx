import type { AuthTheme } from "@/lib/theme";
import { LOGO_PATHS } from "@/lib/brand";

type BrandMarkProps = {
  theme?: AuthTheme;
  /** Apenas ícone (barras), sem wordmark. */
  iconOnly?: boolean;
};

export function BrandMark({ theme = "light", iconOnly = false }: BrandMarkProps) {
  const src = iconOnly
    ? LOGO_PATHS.icon
    : theme === "dark"
      ? LOGO_PATHS.wordmarkMono
      : LOGO_PATHS.wordmark;

  const invertOnDark = theme === "dark" && !iconOnly;

  return (
    <div
      className={`inline-flex items-center ${invertOnDark ? "brightness-0 invert" : ""}`}
      aria-label="ProductDiscovery"
    >
      <img
        src={src}
        alt=""
        className={iconOnly ? "h-8 w-8" : "h-8 w-auto max-w-[220px]"}
        height={32}
        decoding="async"
      />
    </div>
  );
}
