"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Plus, Users } from "lucide-react";
import { usePersonas } from "@/lib/personas-store";
import { useProducts } from "@/lib/products-context";
import { useDores } from "@/lib/dores-store";
import { getAvatar, getPersonaDisplayId, scopeLabel, type PersonaScope } from "@/lib/personas-data";
import { ListingToolbar } from "@/components/shared/crud-ui";

type Filter = "all" | PersonaScope;

export default function PersonasPage() {
  const router = useRouter();
  const { ready, personas, createPersona, isRemoteBacked, syncError } = usePersonas();
  const { products, currentProduct } = useProducts();
  const { pains } = useDores();
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    const scoped = filter === "all" ? personas : personas.filter((p) => p.scope === filter);
    const query = search.trim().toLowerCase();
    if (!query) return scoped;
    return scoped.filter((p) =>
      [getPersonaDisplayId(p), p.name, p.role, p.quote, scopeLabel[p.scope]]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(query)),
    );
  }, [personas, filter, search]);

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
    void createPersona({ scope: "product", productId: currentProduct.id })
      .then((p) => {
        toast.success("Persona criada");
        router.push(`/personas/${p.id}?new=1`);
      })
      .catch((error) => {
        toast.error(error instanceof Error ? error.message : "Não foi possível criar a persona");
      });
  };

  const productName = (id?: string) => products.find((x) => x.id === id)?.name;
  const painTitle = (id?: string) => pains.find((p) => p.id === id)?.title;

  if (!ready)
    return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#dde0e8] bg-[#ffffff] pb-5">
        <div>
          <div className="text-[13px] text-[#9aa0b1]">
            <Link href="/dashboard" className="hover:text-[#4e5567] hover:underline">Discovery</Link>
            <span className="mx-1 text-[#c4c9d4]">›</span>
            <span className="font-medium text-[#4e5567]">Personas</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[#2b364a]">
            Personas
          </h1>
          <div className="mt-1 font-mono text-[13px] text-[#6b7287]">
            {personas.length} persona(s)
          </div>
          <div className="mt-0.5 text-[11px]" style={{ color: syncError ? "var(--danger-strong)" : "var(--fg-faint)" }}>
            {syncError ? syncError : isRemoteBacked ? "Sincronizado com a API" : "Dados locais"}
          </div>
        </div>
        <button
          onClick={handleCreate}
          className="inline-flex h-10 items-center gap-2 rounded-md bg-[#13c8b5] px-4 text-[14px] font-medium text-white transition-colors hover:bg-[#21a3a3]"
          type="button"
        >
          <Plus size={16} /> Nova persona
        </button>
      </div>

      <ListingToolbar
        filters={(["all", "workspace", "product", "pain"] as const).map((k) => ({
          label:
            k === "all"
              ? "Todas"
              : k === "workspace"
                ? "Workspace"
                : k === "product"
                  ? "Produto"
                  : "Dor",
          value: String(counts[k]),
          active: filter === k,
          onClick: () => setFilter(k),
        }))}
        search={search}
        onSearchChange={setSearch}
        views={[
          { value: "grid", label: "cards" },
          { value: "list", label: "lista" },
        ]}
        activeView="grid"
        onViewChange={() => undefined}
      />

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
              className="group rounded-xl border border-[#dde0e8] bg-white p-4 transition-colors hover:border-[#c4c9d4]"
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
                      {getPersonaDisplayId(persona)}
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
