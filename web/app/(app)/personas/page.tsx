"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import { usePersonas } from "@/lib/personas-store";
import { useProducts } from "@/lib/products-context";
import { useDores } from "@/lib/dores-store";
import { getAvatar, scopeLabel, type PersonaScope } from "@/lib/personas-data";

type Filter = "all" | PersonaScope;

export default function PersonasPage() {
  const router = useRouter();
  const { ready, personas, createPersona } = usePersonas();
  const { products, currentProduct } = useProducts();
  const { pains } = useDores();
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(
    () => (filter === "all" ? personas : personas.filter((p) => p.scope === filter)),
    [personas, filter],
  );

  const counts = useMemo(
    () => ({
      all: personas.length,
      workspace: personas.filter((p) => p.scope === "workspace").length,
      product: personas.filter((p) => p.scope === "product").length,
      pain: personas.filter((p) => p.scope === "pain").length,
    }),
    [personas],
  );

  const handleCreate = () => {
    const p = createPersona({ scope: "product", productId: currentProduct.id });
    toast.success("Persona criada");
    router.push(`/personas/${p.id}?new=1`);
  };

  const productName = (id?: string) => products.find((x) => x.id === id)?.name;
  const painTitle = (id?: string) => pains.find((p) => p.id === id)?.title;

  if (!ready)
    return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-[13px]" style={{ color: "var(--fg-faint)" }}>
            <Link href="/dashboard" className="hover:underline">Discovery</Link>
            <span className="mx-1">›</span>
            <span style={{ color: "var(--fg-muted)" }}>Personas</span>
          </div>
          <h1
            className="mt-1 text-[28px] font-semibold tracking-tight"
            style={{ color: "var(--fg)" }}
          >
            Personas
          </h1>
          <div className="mt-1 font-mono text-[13px]" style={{ color: "var(--fg-subtle)" }}>
            {personas.length} persona(s)
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ backgroundColor: "var(--primary)" }}
        >
          <Plus size={14} /> Nova persona
        </button>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-1.5">
        {(["all", "workspace", "product", "pain"] as const).map((k) => {
          const active = filter === k;
          const label =
            k === "all"
              ? "Todas"
              : k === "workspace"
                ? "Workspace"
                : k === "product"
                  ? "Produto"
                  : "Dor";
          return (
            <button
              key={k}
              onClick={() => setFilter(k)}
              className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] transition-colors"
              style={{
                borderColor: active ? "var(--primary)" : "var(--border)",
                backgroundColor: active ? "var(--primary-soft)" : "var(--bg)",
                color: active ? "var(--primary)" : "var(--fg-muted)",
              }}
            >
              {label}
              <span className="font-mono text-[11px] opacity-70">{counts[k]}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {filtered.length === 0 && (
          <div
            className="col-span-full flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center"
            style={{ borderColor: "var(--border-strong)", color: "var(--fg-faint)" }}
          >
            <Users size={28} className="mb-2 opacity-60" />
            <p className="text-[13px]">Nenhuma persona neste filtro.</p>
          </div>
        )}
        {filtered.map((persona) => {
          const avatar = getAvatar(persona.avatarId);
          const ctxLabel =
            persona.scope === "product"
              ? productName(persona.productId) ?? "Produto"
              : persona.scope === "pain"
                ? painTitle(persona.painId) ?? "Dor"
                : "Workspace";
          return (
            <Link
              key={persona.id}
              href={`/personas/${persona.id}`}
              className="group rounded-xl border bg-white p-4 transition-shadow hover:shadow-md"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex items-start gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={avatar.url}
                  alt={persona.name}
                  width={56}
                  height={56}
                  className="h-14 w-14 shrink-0 rounded-full border"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-[10px] text-[var(--fg-faint)]">
                      {persona.id}
                    </span>
                    <span
                      className="rounded-full px-1.5 py-0.5 text-[10px]"
                      style={{
                        backgroundColor: "var(--bg-muted)",
                        color: "var(--fg-subtle)",
                      }}
                    >
                      {scopeLabel[persona.scope]}
                    </span>
                  </div>
                  <div className="mt-0.5 truncate text-[15px] font-semibold text-[var(--fg)]">
                    {persona.name || "Sem nome"}
                  </div>
                  <div className="truncate text-[12px] text-[var(--fg-muted)]">
                    {persona.role || "—"}
                  </div>
                </div>
              </div>

              <div
                className="mt-3 truncate rounded-md border-l-2 px-2 py-1 text-[11px]"
                style={{
                  borderColor: "var(--primary)",
                  backgroundColor: "var(--bg-muted)",
                  color: "var(--fg-subtle)",
                }}
                title={ctxLabel}
              >
                {ctxLabel}
              </div>

              {persona.quote && (
                <p
                  className="mt-2 line-clamp-2 text-[12px] italic"
                  style={{ color: "var(--fg-muted)" }}
                >
                  “{persona.quote}”
                </p>
              )}

              <div className="mt-3 flex flex-wrap gap-1.5 text-[11px] text-[var(--fg-subtle)]">
                {persona.age && <Chip>{persona.age} anos</Chip>}
                {persona.gender && <Chip>{persona.gender}</Chip>}
                {persona.companySize && <Chip>{persona.companySize}</Chip>}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="rounded-full border px-2 py-0.5"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
    >
      {children}
    </span>
  );
}
