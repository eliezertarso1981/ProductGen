import type { LucideIcon } from "lucide-react";

interface Props {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon: Icon, title, description, action }: Props) {
  return (
    <div
      className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center animate-fade-in"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
    >
      <div
        className="mb-3 flex h-12 w-12 items-center justify-center rounded-full"
        style={{ backgroundColor: "var(--bg-elevated)", color: "var(--fg-faint)" }}
      >
        <Icon size={22} />
      </div>
      <h3 className="text-[15px] font-semibold" style={{ color: "var(--fg)" }}>
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-[13px]" style={{ color: "var(--fg-subtle)" }}>
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
