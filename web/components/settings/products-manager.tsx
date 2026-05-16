"use client";

import { useMemo, useState } from "react";
import {
  Plus,
  Search,
  Archive,
  ArchiveRestore,
  Trash2,
  Edit3,
  Users,
  Target,
  AlertCircle,
  Columns3,
  ArrowRightLeft,
  Check,
  X,
  ChevronRight,
} from "lucide-react";
import { useProducts, type Product } from "@/lib/products-context";
import { useWorkspace } from "@/lib/workspace-store";
import { useDores } from "@/lib/dores-store";
import { useDiscovery } from "@/lib/discovery-store";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";

type Tab = "overview" | "pillars" | "okrs" | "dores" | "team";

export function ProductsManager() {
  const {
    products,
    activeProducts,
    addProduct,
    updateProduct,
    archiveProduct,
    restoreProduct,
    deleteProduct,
  } = useProducts();
  const workspace = useWorkspace();
  const { pains, updatePain } = useDores();
  const { hypotheses } = useDiscovery();

  const [query, setQuery] = useState("");
  const [showArchived, setShowArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<string>(activeProducts[0]?.id ?? products[0]?.id ?? "");
  const [tab, setTab] = useState<Tab>("overview");
  const [creating, setCreating] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Product | null>(null);

  const list = useMemo(() => {
    return products
      .filter((p) => (showArchived ? true : p.status === "active"))
      .filter((p) => (query ? p.name.toLowerCase().includes(query.toLowerCase()) : true));
  }, [products, query, showArchived]);

  const selected = useMemo(
    () => products.find((p) => p.id === selectedId) ?? list[0],
    [products, selectedId, list],
  );

  const productPainCount = (id: string) => pains.filter((p) => p.productId === id).length;
  const productPillarCount = (id: string) => workspace.pillarsByProduct(id).length;
  const productOkrCount = (id: string) => workspace.okrsByProduct(id).length;
  const productMemberCount = (id: string) => workspace.membersByProduct(id).length;
  const productHypothesesCount = (id: string) => hypotheses.filter((h) => h.productId === id).length;

  return (
    <div
      className="grid h-[calc(100vh-180px)] min-h-[600px] grid-cols-[320px_1fr] overflow-hidden rounded-2xl border"
      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
    >
      {/* LEFT: master list */}
      <aside
        className="flex flex-col border-r"
        style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
      >
        <div className="flex items-center justify-between gap-2 px-4 pt-4">
          <h3 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Produtos do workspace
          </h3>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-semibold"
            style={{ backgroundColor: "var(--primary)", color: "white" }}
          >
            <Plus size={12} /> Novo
          </button>
        </div>

        <div className="px-4 pt-3">
          <div
            className="flex items-center gap-2 rounded-lg border px-2.5 py-1.5"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
          >
            <Search size={14} color="var(--fg-faint)" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar produto…"
              className="w-full bg-transparent text-sm outline-none"
              style={{ color: "var(--fg)" }}
            />
          </div>
          <label className="mt-2 flex items-center gap-2 text-[11px]" style={{ color: "var(--fg-subtle)" }}>
            <input
              type="checkbox"
              checked={showArchived}
              onChange={(e) => setShowArchived(e.target.checked)}
              className="accent-[var(--primary)]"
            />
            Mostrar arquivados
          </label>
        </div>

        <div className="mt-2 flex-1 overflow-y-auto px-2 pb-3">
          {creating && (
            <NewProductRow
              onCancel={() => setCreating(false)}
              onSave={(name) => {
                const p = addProduct({ name });
                setSelectedId(p.id);
                setCreating(false);
                toast.success(`Produto "${p.name}" criado`);
              }}
            />
          )}
          {list.length === 0 && !creating ? (
            <div className="px-2 py-8 text-center text-xs" style={{ color: "var(--fg-faint)" }}>
              Nenhum produto encontrado.
            </div>
          ) : (
            list.map((p) => {
              const isActive = p.id === selected?.id;
              const archived = p.status === "archived";
              return (
                <button
                  key={p.id}
                  onClick={() => setSelectedId(p.id)}
                  className="group mt-1 flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors"
                  style={{
                    backgroundColor: isActive ? "var(--primary-soft)" : "transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "var(--bg-muted)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.backgroundColor = "transparent";
                  }}
                >
                  <div
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[11px] font-semibold text-white"
                    style={{ backgroundColor: p.color, opacity: archived ? 0.5 : 1 }}
                  >
                    {p.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="truncate text-[13px] font-semibold"
                        style={{ color: isActive ? "var(--primary)" : "var(--fg)" }}
                      >
                        {p.name}
                      </span>
                      {archived && (
                        <span
                          className="rounded px-1 py-0.5 text-[9px] font-semibold uppercase"
                          style={{ backgroundColor: "var(--bg-muted-2)", color: "var(--fg-subtle)" }}
                        >
                          Arquiv.
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 flex items-center gap-2 text-[10px]" style={{ color: "var(--fg-faint)" }}>
                      <span>{productPillarCount(p.id)} pilares</span>
                      <span>·</span>
                      <span>{productPainCount(p.id)} dores</span>
                      <span>·</span>
                      <span>{productMemberCount(p.id)} pessoas</span>
                    </div>
                  </div>
                  <ChevronRight size={14} color="var(--fg-faint)" className="opacity-0 transition-opacity group-hover:opacity-100" />
                </button>
              );
            })
          )}
        </div>
      </aside>

      {/* RIGHT: detail */}
      <section className="flex min-w-0 flex-col overflow-hidden">
        {!selected ? (
          <div className="flex h-full items-center justify-center">
            <EmptyState
              icon={Columns3}
              title="Selecione um produto"
              description="Escolha um produto à esquerda para gerenciar pilares, OKRs, dores e equipe."
            />
          </div>
        ) : (
          <>
            <ProductHeader
              product={selected}
              onUpdate={(patch) => updateProduct(selected.id, patch)}
              onArchive={() => setConfirmArchive(selected)}
              onRestore={() => {
                restoreProduct(selected.id);
                toast.success(`"${selected.name}" reativado`);
              }}
              onDelete={() => setConfirmDelete(selected)}
            />

            <div className="flex shrink-0 items-center gap-1 border-b px-6" style={{ borderColor: "var(--border)" }}>
              {(
                [
                  { id: "overview", label: "Visão geral", icon: Edit3, count: undefined },
                  { id: "pillars", label: "Pilares", icon: Columns3, count: productPillarCount(selected.id) },
                  { id: "okrs", label: "OKRs", icon: Target, count: productOkrCount(selected.id) },
                  { id: "dores", label: "Dores", icon: AlertCircle, count: productPainCount(selected.id) },
                  { id: "team", label: "Equipe", icon: Users, count: productMemberCount(selected.id) },
                ] as const
              ).map((t) => {
                const Icon = t.icon;
                const active = tab === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => setTab(t.id)}
                    className="relative flex items-center gap-2 px-3 py-3 text-sm transition-colors"
                    style={{
                      color: active ? "var(--primary)" : "var(--fg-muted)",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={14} />
                    {t.label}
                    {t.count !== undefined && (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          backgroundColor: active ? "var(--primary-soft)" : "var(--bg-muted)",
                          color: active ? "var(--primary)" : "var(--fg-subtle)",
                        }}
                      >
                        {t.count}
                      </span>
                    )}
                    {active && (
                      <span
                        className="absolute bottom-0 left-0 right-0 h-0.5"
                        style={{ backgroundColor: "var(--primary)" }}
                      />
                    )}
                  </button>
                );
              })}
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {tab === "overview" && <OverviewTab product={selected} hypothesesCount={productHypothesesCount(selected.id)} />}
              {tab === "pillars" && <PillarsTab product={selected} />}
              {tab === "okrs" && <OkrsTab product={selected} />}
              {tab === "dores" && (
                <DoresTab product={selected} pains={pains.filter((p) => p.productId === selected.id)} onMove={(painId, target) => updatePain(painId, { productId: target })} />
              )}
              {tab === "team" && <TeamTab product={selected} />}
            </div>
          </>
        )}
      </section>

      <ConfirmDialog
        open={!!confirmArchive}
        title="Arquivar produto?"
        description={`"${confirmArchive?.name}" ficará oculto da navegação principal mas pode ser restaurado.`}
        confirmLabel="Arquivar"
        onConfirm={() => {
          if (confirmArchive) {
            archiveProduct(confirmArchive.id);
            toast.success(`"${confirmArchive.name}" arquivado`);
          }
          setConfirmArchive(null);
        }}
        onCancel={() => setConfirmArchive(null)}
      />
      <ConfirmDialog
        open={!!confirmDelete}
        title="Excluir produto?"
        description={`Esta ação remove "${confirmDelete?.name}" permanentemente. Pilares, OKRs, dores e vínculos a equipes ficam órfãos.`}
        confirmLabel="Excluir"
        destructive
        onConfirm={() => {
          if (confirmDelete) {
            deleteProduct(confirmDelete.id);
            toast.success(`"${confirmDelete.name}" excluído`);
          }
          setConfirmDelete(null);
        }}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  );
}


function NewProductRow({ onCancel, onSave }: { onCancel: () => void; onSave: (name: string) => void }) {
  const [name, setName] = useState("");
  return (
    <div
      className="mt-1 flex items-center gap-2 rounded-lg border px-2 py-2"
      style={{ borderColor: "var(--primary)", backgroundColor: "var(--primary-soft)" }}
    >
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && name.trim()) onSave(name);
          if (e.key === "Escape") onCancel();
        }}
        placeholder="Nome do produto"
        className="w-full bg-transparent text-sm outline-none"
        style={{ color: "var(--fg)" }}
      />
      <button onClick={() => name.trim() && onSave(name)} className="text-[var(--primary)]">
        <Check size={14} />
      </button>
      <button onClick={onCancel} style={{ color: "var(--fg-faint)" }}>
        <X size={14} />
      </button>
    </div>
  );
}

function ProductHeader({
  product,
  onUpdate,
  onArchive,
  onRestore,
  onDelete,
}: {
  product: Product;
  onUpdate: (patch: Partial<Product>) => void;
  onArchive: () => void;
  onRestore: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex shrink-0 items-start justify-between gap-4 px-6 pb-4 pt-6">
      <div className="flex min-w-0 items-center gap-3">
        <div
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl text-base font-semibold text-white"
          style={{ backgroundColor: product.color }}
        >
          {product.initials}
        </div>
        <div className="min-w-0">
          <input
            value={product.name}
            onChange={(e) => onUpdate({ name: e.target.value })}
            className="w-full bg-transparent text-xl font-semibold tracking-tight outline-none"
            style={{ color: "var(--fg)" }}
          />
          <div className="mt-0.5 flex items-center gap-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            <span>Criado em {new Date(product.createdAt).toLocaleDateString("pt-BR")}</span>
            <span>·</span>
            <span className={product.status === "archived" ? "" : ""}>
              {product.status === "active" ? "Ativo" : "Arquivado"}
            </span>
          </div>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        {product.status === "active" ? (
          <button
            onClick={onArchive}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <Archive size={13} /> Arquivar
          </button>
        ) : (
          <button
            onClick={onRestore}
            className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold"
            style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
          >
            <ArchiveRestore size={13} /> Restaurar
          </button>
        )}
        <button
          onClick={onDelete}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-xs font-semibold"
          style={{ borderColor: "var(--danger-border)", color: "var(--danger-strong)" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>
    </div>
  );
}

function OverviewTab({ product, hypothesesCount }: { product: Product; hypothesesCount: number }) {
  const { updateProduct } = useProducts();
  const { pillarsByProduct, okrsByProduct, membersByProduct, teamsByProduct, members } = useWorkspace();
  const { pains } = useDores();

  const owner = members.find((m) => m.id === product.ownerId);

  const stats = [
    { label: "Pilares", value: pillarsByProduct(product.id).length, icon: Columns3 },
    { label: "OKRs", value: okrsByProduct(product.id).length, icon: Target },
    { label: "Dores", value: pains.filter((p) => p.productId === product.id).length, icon: AlertCircle },
    { label: "Hipóteses", value: hypothesesCount, icon: Edit3 },
    { label: "Pessoas", value: membersByProduct(product.id).length, icon: Users },
    { label: "Times", value: teamsByProduct(product.id).length, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
          Descrição
        </label>
        <textarea
          value={product.description ?? ""}
          onChange={(e) => updateProduct(product.id, { description: e.target.value })}
          rows={3}
          placeholder="Descreva o propósito deste produto…"
          className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none transition-colors focus:border-[var(--primary)]"
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        />
      </div>

      <div>
        <label className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
          Responsável (PM owner)
        </label>
        <select
          value={product.ownerId ?? ""}
          onChange={(e) => updateProduct(product.id, { ownerId: e.target.value || undefined })}
          className="mt-2 w-full rounded-lg border bg-transparent px-3 py-2 text-sm outline-none focus:border-[var(--primary)]"
          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
        >
          <option value="">— Sem responsável —</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name} {m.role ? `· ${m.role}` : ""}
            </option>
          ))}
        </select>
        {owner && (
          <div className="mt-2 flex items-center gap-2 text-xs" style={{ color: "var(--fg-subtle)" }}>
            <div
              className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
              style={{ backgroundColor: owner.color }}
            >
              {owner.initials}
            </div>
            {owner.email}
          </div>
        )}
      </div>

      <div>
        <div className="text-xs font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
          Visão consolidada
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          {stats.map((s) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className="rounded-lg border p-3"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
              >
                <div className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: "var(--fg-faint)" }}>
                  <Icon size={11} /> {s.label}
                </div>
                <div className="mt-1.5 text-2xl font-semibold" style={{ color: "var(--fg)" }}>
                  {s.value}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PillarsTab({ product }: { product: Product }) {
  const { pillarsByProduct, addPillar, updatePillar, removePillar, movePillar } = useWorkspace();
  const { activeProducts } = useProducts();
  const items = pillarsByProduct(product.id);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>
          Pilares estratégicos que orientam OKRs e dores deste produto.
        </p>
        <button
          onClick={() => addPillar(product.id, "Novo pilar")}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
        >
          <Plus size={13} /> Novo pilar
        </button>
      </div>
      {items.length === 0 ? (
        <EmptyState icon={Columns3} title="Sem pilares" description="Crie um pilar para começar." />
      ) : (
        <div className="space-y-2">
          {items.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-3 rounded-lg border p-3"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
            >
              <div className="h-8 w-1 rounded-full" style={{ backgroundColor: p.color }} />
              <div className="flex-1">
                <input
                  value={p.name}
                  onChange={(e) => updatePillar(p.id, { name: e.target.value })}
                  className="w-full bg-transparent text-sm font-semibold outline-none"
                  style={{ color: "var(--fg)" }}
                />
                <input
                  value={p.description ?? ""}
                  onChange={(e) => updatePillar(p.id, { description: e.target.value })}
                  placeholder="Descrição curta…"
                  className="mt-0.5 w-full bg-transparent text-xs outline-none"
                  style={{ color: "var(--fg-subtle)" }}
                />
              </div>
              <MoveMenu
                currentProductId={product.id}
                products={activeProducts}
                onMove={(target) => movePillar(p.id, target)}
              />
              <button
                onClick={() => removePillar(p.id)}
                style={{ color: "var(--fg-faint)" }}
                title="Excluir pilar"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function OkrsTab({ product }: { product: Product }) {
  const { okrsByProduct, pillarsByProduct, addOkr, updateOkr, removeOkr, moveOkr, addKR, updateKR, removeKR, members } = useWorkspace();
  const { activeProducts } = useProducts();
  const items = okrsByProduct(product.id);
  const pillars = pillarsByProduct(product.id);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm" style={{ color: "var(--fg-subtle)" }}>
          Objetivos e Key Results deste produto.
        </p>
        <button
          onClick={() => addOkr(product.id)}
          className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-semibold"
          style={{ backgroundColor: "var(--primary-soft)", color: "var(--primary)" }}
        >
          <Plus size={13} /> Novo OKR
        </button>
      </div>

      {items.length === 0 ? (
        <EmptyState icon={Target} title="Sem OKRs" description="Crie um OKR para começar." />
      ) : (
        <div className="space-y-3">
          {items.map((o) => {
            const progress =
              o.keyResults.length === 0
                ? 0
                : Math.round(
                    (o.keyResults.reduce((acc, k) => acc + Math.min(1, k.target ? k.current / k.target : 0), 0) /
                      o.keyResults.length) *
                      100,
                  );
            return (
              <div
                key={o.id}
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <input
                      value={o.objective}
                      onChange={(e) => updateOkr(o.id, { objective: e.target.value })}
                      className="w-full bg-transparent text-sm font-semibold outline-none"
                      style={{ color: "var(--fg)" }}
                    />
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                      <select
                        value={o.pillarId ?? ""}
                        onChange={(e) => updateOkr(o.id, { pillarId: e.target.value || undefined })}
                        className="rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        <option value="">— Sem pilar —</option>
                        {pillars.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                      <input
                        value={o.quarter}
                        onChange={(e) => updateOkr(o.id, { quarter: e.target.value })}
                        className="w-20 rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      />
                      <select
                        value={o.ownerId ?? ""}
                        onChange={(e) => updateOkr(o.id, { ownerId: e.target.value || undefined })}
                        className="rounded-md border bg-transparent px-2 py-1 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      >
                        <option value="">— Owner —</option>
                        {members.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <div className="flex items-center gap-2">
                      <div className="text-xs font-semibold" style={{ color: "var(--primary)" }}>
                        {progress}%
                      </div>
                      <MoveMenu currentProductId={product.id} products={activeProducts} onMove={(t) => moveOkr(o.id, t)} />
                      <button onClick={() => removeOkr(o.id)} style={{ color: "var(--fg-faint)" }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                    <div className="h-1.5 w-32 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted-2)" }}>
                      <div
                        className="h-full transition-all"
                        style={{ width: `${progress}%`, backgroundColor: "var(--primary)" }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-3 space-y-2 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                  {o.keyResults.map((k) => (
                    <div key={k.id} className="flex items-center gap-2">
                      <input
                        value={k.text}
                        onChange={(e) => updateKR(o.id, k.id, { text: e.target.value })}
                        className="flex-1 bg-transparent text-xs outline-none"
                        style={{ color: "var(--fg)" }}
                      />
                      <input
                        type="number"
                        value={k.current}
                        onChange={(e) => updateKR(o.id, k.id, { current: Number(e.target.value) })}
                        className="w-16 rounded-md border bg-transparent px-1.5 py-0.5 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                      />
                      <span className="text-xs" style={{ color: "var(--fg-faint)" }}>/</span>
                      <input
                        type="number"
                        value={k.target}
                        onChange={(e) => updateKR(o.id, k.id, { target: Number(e.target.value) })}
                        className="w-16 rounded-md border bg-transparent px-1.5 py-0.5 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                      />
                      <input
                        value={k.unit ?? ""}
                        onChange={(e) => updateKR(o.id, k.id, { unit: e.target.value })}
                        placeholder="un"
                        className="w-12 rounded-md border bg-transparent px-1.5 py-0.5 text-xs outline-none"
                        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                      />
                      <button onClick={() => removeKR(o.id, k.id)} style={{ color: "var(--fg-faint)" }}>
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <button
                    onClick={() => addKR(o.id)}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold"
                    style={{ color: "var(--primary)" }}
                  >
                    <Plus size={11} /> Adicionar KR
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function DoresTab({ product, pains, onMove }: { product: Product; pains: Array<{ id: string; title: string; status: string; severity: number }>; onMove: (id: string, target: string) => void }) {
  const { activeProducts } = useProducts();

  if (pains.length === 0) {
    return <EmptyState icon={AlertCircle} title="Sem dores" description="Este produto ainda não tem dores cadastradas." />;
  }

  return (
    <div>
      <p className="mb-3 text-sm" style={{ color: "var(--fg-subtle)" }}>
        Dores capturadas e vinculadas a este produto. Use o menu para movê-las entre produtos.
      </p>
      <div className="space-y-2">
        {pains.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-3 rounded-lg border p-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
          >
            <span className="font-mono text-[10px]" style={{ color: "var(--fg-faint)" }}>
              {p.id}
            </span>
            <div className="flex-1 text-sm" style={{ color: "var(--fg)" }}>
              {p.title}
            </div>
            <span
              className="rounded-md px-2 py-0.5 text-[10px] font-semibold"
              style={{ backgroundColor: "var(--bg-muted)", color: "var(--fg-subtle)" }}
            >
              {p.status}
            </span>
            <MoveMenu
              currentProductId={product.id}
              products={activeProducts}
              onMove={(target) => onMove(p.id, target)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function TeamTab({ product }: { product: Product }) {
  const { members, teams, teamsByProduct, toggleTeamProduct, toggleTeamMember } = useWorkspace();
  const linkedTeams = teamsByProduct(product.id);
  const linkedMemberIds = new Set<string>();
  linkedTeams.forEach((t) => t.memberIds.forEach((id) => linkedMemberIds.add(id)));

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Times do workspace vinculados
          </h4>
          <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            {linkedTeams.length} de {teams.length}
          </span>
        </div>
        <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
          {teams.map((t) => {
            const linked = t.productIds.includes(product.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleTeamProduct(t.id, product.id)}
                className="flex items-center gap-3 rounded-lg border p-3 text-left transition-colors"
                style={{
                  borderColor: linked ? "var(--primary)" : "var(--border)",
                  backgroundColor: linked ? "var(--primary-soft)" : "var(--bg)",
                }}
              >
                <div
                  className="h-8 w-1 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <div className="flex-1">
                  <div className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
                    {t.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--fg-faint)" }}>
                    {t.memberIds.length} pessoas
                  </div>
                </div>
                {linked ? (
                  <Check size={14} color="var(--primary)" />
                ) : (
                  <Plus size={14} color="var(--fg-faint)" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold" style={{ color: "var(--fg)" }}>
            Pessoas envolvidas
          </h4>
          <span className="text-xs" style={{ color: "var(--fg-subtle)" }}>
            via times vinculados
          </span>
        </div>
        {linkedMemberIds.size === 0 ? (
          <EmptyState icon={Users} title="Sem pessoas" description="Vincule um time acima para popular a equipe." />
        ) : (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {members
              .filter((m) => linkedMemberIds.has(m.id))
              .map((m) => (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-lg border p-3"
                  style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                >
                  <div
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-semibold text-white"
                    style={{ backgroundColor: m.color }}
                  >
                    {m.initials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-semibold" style={{ color: "var(--fg)" }}>
                      {m.name}
                    </div>
                    <div className="truncate text-[11px]" style={{ color: "var(--fg-subtle)" }}>
                      {m.role}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      <div>
        <h4 className="mb-2 text-sm font-semibold" style={{ color: "var(--fg)" }}>
          Adicionar membros avulsos a um time
        </h4>
        <p className="mb-3 text-xs" style={{ color: "var(--fg-subtle)" }}>
          Use os times abaixo para incluir/remover pessoas do workspace.
        </p>
        <div className="space-y-2">
          {linkedTeams.map((t) => (
            <details
              key={t.id}
              className="rounded-lg border"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
            >
              <summary className="flex cursor-pointer items-center gap-2 p-3 text-sm" style={{ color: "var(--fg)" }}>
                <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: t.color }} />
                <span className="font-semibold">{t.name}</span>
                <span className="ml-auto text-xs" style={{ color: "var(--fg-faint)" }}>
                  {t.memberIds.length} membros
                </span>
              </summary>
              <div className="grid grid-cols-2 gap-1 border-t p-3 sm:grid-cols-3" style={{ borderColor: "var(--border)" }}>
                {members.map((m) => {
                  const inTeam = t.memberIds.includes(m.id);
                  return (
                    <button
                      key={m.id}
                      onClick={() => toggleTeamMember(t.id, m.id)}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs"
                      style={{
                        backgroundColor: inTeam ? "var(--primary-soft)" : "transparent",
                        color: inTeam ? "var(--primary)" : "var(--fg-muted)",
                      }}
                    >
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full text-[9px] font-semibold text-white"
                        style={{ backgroundColor: m.color }}
                      >
                        {m.initials}
                      </div>
                      <span className="flex-1 truncate">{m.name}</span>
                      {inTeam && <Check size={10} />}
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}

function MoveMenu({
  currentProductId,
  products,
  onMove,
}: {
  currentProductId: string;
  products: Product[];
  onMove: (productId: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const targets = products.filter((p) => p.id !== currentProductId);
  if (targets.length === 0) return null;
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-[11px]"
        style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
        title="Mover para outro produto"
      >
        <ArrowRightLeft size={11} /> Mover
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div
            className="absolute right-0 z-20 mt-1 w-48 rounded-lg border p-1 shadow-lg"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-elevated)" }}
          >
            {targets.map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  onMove(p.id);
                  setOpen(false);
                  toast.success(`Movido para "${p.name}"`);
                }}
                className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs hover:bg-[var(--bg-muted)]"
                style={{ color: "var(--fg)" }}
              >
                <div
                  className="flex h-5 w-5 items-center justify-center rounded-md text-[9px] font-semibold text-white"
                  style={{ backgroundColor: p.color }}
                >
                  {p.initials}
                </div>
                {p.name}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
