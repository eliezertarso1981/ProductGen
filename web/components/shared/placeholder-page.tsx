import { Construction } from "lucide-react";

export function PlaceholderPage({ title }: { title: string }) {
  return (
    <div className="flex min-h-[calc(100vh-56px)] flex-col items-center justify-center px-8 text-center">
      <div
        className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-2xl"
        style={{ backgroundColor: "var(--bg-muted-2)" }}
      >
        <Construction size={28} color="var(--fg-subtle)" />
      </div>
      <h1 className="text-2xl font-semibold" style={{ color: "var(--fg)" }}>
        {title}
      </h1>
      <p className="mt-2 text-sm" style={{ color: "var(--fg-subtle)" }}>
        Em breve. Esta seção ainda está sendo desenhada.
      </p>
    </div>
  );
}
