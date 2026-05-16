import Link from "next/link";
import { ChevronRight } from "lucide-react";

export interface Crumb {
  label: string;
  href?: string;
}

interface Props {
  items: Crumb[];
}

export function Breadcrumbs({ items }: Props) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-1 text-[13px]"
      style={{ color: "var(--fg-faint)" }}
    >
      {items.map((c, i) => {
        const isLast = i === items.length - 1;
        return (
          <span key={i} className="inline-flex items-center gap-1">
            {c.href && !isLast ? (
              <Link
                href={c.href}
                className="hover:underline transition-colors hover:text-[var(--fg-muted)]"
              >
                {c.label}
              </Link>
            ) : (
              <span style={{ color: isLast ? "var(--fg-muted)" : undefined }}>{c.label}</span>
            )}
            {!isLast && <ChevronRight size={12} style={{ color: "var(--fg-disabled)" }} />}
          </span>
        );
      })}
    </nav>
  );
}
