"use client";

import Link from "next/link";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { AlertCircle, CalendarDays, Check, Columns3, Edit3, Target, Users, X } from "lucide-react";
import { EmptyState } from "@/components/shared/empty-state";
import { usePermissions } from "@/lib/auth-context";
import { getAvatar, getPersonaDisplayId } from "@/lib/personas-data";
import { usePersonas } from "@/lib/personas-store";
import { useProducts, type ProductStatus } from "@/lib/products-context";
import {
  formatPeriod,
  getKeyResultDisplayId,
  getOKRDisplayId,
  getPillarDisplayId,
  krProgress,
  okrProgress,
  okrStatusConfig,
  type OKR,
  type Pillar,
} from "@/lib/strategy-data";
import { useStrategy } from "@/lib/strategy-store";
import { useWorkspace, type Member, type Team } from "@/lib/workspace-store";
import { toast } from "sonner";

interface ProductDraft {
  name: string;
  description: string;
  status: ProductStatus;
}

export default function ProdutoPage() {
  const {
    currentProduct,
    updateProduct,
    ready: productsReady,
    isRemoteBacked: productsRemoteBacked,
    syncError: productsSyncError,
  } = useProducts();
  const { can } = usePermissions();
  const { ready: personasReady, personasByProduct } = usePersonas();
  const { ready: strategyReady, pillarsByProduct, okrsByProduct } = useStrategy();
  const {
    ready: workspaceReady,
    members,
    teamsByProduct,
    membersByProduct,
    syncError: workspaceSyncError,
  } = useWorkspace();
  const [editingProduct, setEditingProduct] = useState(false);
  const [productDraft, setProductDraft] = useState<ProductDraft>({
    name: currentProduct.name,
    description: currentProduct.description ?? "",
    status: currentProduct.status,
  });

  const productPersonas = useMemo(
    () => personasByProduct(currentProduct.id),
    [currentProduct.id, personasByProduct],
  );
  const pillars = useMemo(
    () => pillarsByProduct(currentProduct.id),
    [currentProduct.id, pillarsByProduct],
  );
  const okrs = useMemo(
    () => okrsByProduct(currentProduct.id),
    [currentProduct.id, okrsByProduct],
  );
  const teams = useMemo(
    () => teamsByProduct(currentProduct.id),
    [currentProduct.id, teamsByProduct],
  );
  const productMembers = useMemo(
    () => membersByProduct(currentProduct.id),
    [currentProduct.id, membersByProduct],
  );

  const owner = currentProduct.ownerId
    ? members.find((member) => member.id === currentProduct.ownerId)
    : undefined;
  const canEditProduct = can("product.update", { productId: currentProduct.id });
  const canEditProductStatus = can("product.archive", { productId: currentProduct.id });

  useEffect(() => {
    setProductDraft({
      name: currentProduct.name,
      description: currentProduct.description ?? "",
      status: currentProduct.status,
    });
    setEditingProduct(false);
  }, [currentProduct.id, currentProduct.name, currentProduct.description, currentProduct.status]);

  const okrsByPillar = useMemo(() => {
    const grouped = pillars.map((pillar) => ({
      pillar,
      okrs: okrs.filter((okr) => okr.pillarId === pillar.id),
    }));
    const withoutPillar = okrs.filter((okr) => !okr.pillarId || !pillars.some((pillar) => pillar.id === okr.pillarId));
    return { grouped, withoutPillar };
  }, [okrs, pillars]);

  const loading = !productsReady || !personasReady || !strategyReady || !workspaceReady;
  const teamMembers = productMembers.length > 0 ? productMembers : owner ? [owner] : [];
  const totalKeyResults = okrs.reduce((sum, okr) => sum + okr.keyResults.length, 0);
  const averageProgress = okrs.length > 0
    ? Math.round(okrs.reduce((sum, okr) => sum + okrProgress(okr), 0) / okrs.length)
    : 0;

  function startProductEdit() {
    setProductDraft({
      name: currentProduct.name,
      description: currentProduct.description ?? "",
      status: currentProduct.status,
    });
    setEditingProduct(true);
  }

  function cancelProductEdit() {
    setProductDraft({
      name: currentProduct.name,
      description: currentProduct.description ?? "",
      status: currentProduct.status,
    });
    setEditingProduct(false);
  }

  function saveProductEdit() {
    const name = productDraft.name.trim();
    if (!name) {
      toast.error("Informe um nome para salvar o produto.");
      return;
    }

    updateProduct(currentProduct.id, {
      name,
      description: productDraft.description.trim(),
      ...(canEditProductStatus ? { status: productDraft.status } : {}),
    });
    setEditingProduct(false);
    toast.success("Produto salvo");
  }

  if (loading) {
    return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;
  }

  return (
    <div className="px-6 py-5">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-elevated)] pb-5">
        <div>
          <div className="text-[13px] text-[var(--fg-faint)]">
            <Link href="/dashboard" className="hover:text-[var(--fg-muted)] hover:underline">
              Home
            </Link>
            <span className="mx-1 text-[var(--fg-disabled)]">›</span>
            <span className="font-medium text-[var(--fg-muted)]">Produto</span>
          </div>
          <h1 className="mt-1 text-[28px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
            Produto
          </h1>
          <div className="mt-1 font-mono text-[13px] text-[var(--fg-subtle)]">
            Síntese de {currentProduct.name}
          </div>
          <div
            className="mt-0.5 text-[11px]"
            style={{ color: productsSyncError || workspaceSyncError ? "var(--danger-strong)" : "var(--fg-faint)" }}
          >
            {productsSyncError ?? workspaceSyncError ?? (productsRemoteBacked ? "Sincronizado com a API" : "Dados locais")}
          </div>
        </div>
      </div>

      <section className="mt-5 overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)]">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 flex-1 gap-4">
            <div
              className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-lg font-semibold text-white shadow-sm"
              style={{ backgroundColor: currentProduct.color }}
            >
              {currentProduct.initials}
            </div>
            <div className="min-w-0 flex-1">
              {editingProduct ? (
                <div className="space-y-3">
                  <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                        Nome
                      </span>
                      <input
                        autoFocus
                        value={productDraft.name}
                        onChange={(event) => setProductDraft((draft) => ({ ...draft, name: event.target.value }))}
                        className="mt-1 w-full rounded-lg border bg-[var(--bg)] px-3 py-2 text-[15px] font-semibold outline-none transition-colors placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)]"
                        style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                      />
                    </label>
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                        Status
                      </span>
                      {canEditProductStatus ? (
                        <select
                          value={productDraft.status}
                          onChange={(event) =>
                            setProductDraft((draft) => ({ ...draft, status: event.target.value as ProductStatus }))
                          }
                          className="mt-1 w-full rounded-lg border bg-[var(--bg)] px-3 py-2 text-[13px] outline-none transition-colors focus:border-[var(--primary)]"
                          style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                        >
                          <option value="active">Ativo</option>
                          <option value="archived">Arquivado</option>
                        </select>
                      ) : (
                        <span
                          className="mt-1 inline-flex w-full rounded-lg border px-3 py-2 text-[13px]"
                          style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                        >
                          {currentProduct.status === "active" ? "Ativo" : "Arquivado"}
                        </span>
                      )}
                    </label>
                  </div>
                  <label className="block">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                      Descrição
                    </span>
                    <textarea
                      value={productDraft.description}
                      onChange={(event) =>
                        setProductDraft((draft) => ({ ...draft, description: event.target.value }))
                      }
                      rows={3}
                      placeholder="Descreva o propósito deste produto."
                      className="mt-1 w-full rounded-lg border bg-[var(--bg)] px-3 py-2 text-[14px] leading-6 outline-none transition-colors placeholder:text-[var(--fg-faint)] focus:border-[var(--primary)]"
                      style={{ borderColor: "var(--border)", color: "var(--fg)" }}
                    />
                  </label>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--fg)]">
                      {currentProduct.name}
                    </h2>
                    <span
                      className="rounded-full px-2 py-0.5 text-[11px] font-medium"
                      style={{ backgroundColor: "var(--bg-muted)", color: "var(--fg-subtle)" }}
                    >
                      {currentProduct.status === "active" ? "Ativo" : "Arquivado"}
                    </span>
                  </div>
                  <p className="mt-2 max-w-3xl text-[14px] leading-6 text-[var(--fg-muted)]">
                    {currentProduct.description || "Sem descrição cadastrada para este produto."}
                  </p>
                </>
              )}
            </div>
          </div>
          <div className="flex min-w-[260px] flex-col gap-3">
            <div className="flex flex-wrap justify-end gap-2">
              {editingProduct ? (
                <>
                  <button
                    type="button"
                    onClick={saveProductEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[12px] font-semibold"
                    style={{ backgroundColor: "var(--primary)", color: "var(--fg-on-primary)" }}
                  >
                    <Check size={14} /> Salvar
                  </button>
                  <button
                    type="button"
                    onClick={cancelProductEdit}
                    className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold"
                    style={{ borderColor: "var(--border)", color: "var(--fg-muted)" }}
                  >
                    <X size={14} /> Cancelar
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={startProductEdit}
                  disabled={!canEditProduct}
                  className="inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-semibold"
                  style={{
                    borderColor: "var(--border)",
                    color: "var(--fg-muted)",
                    opacity: canEditProduct ? 1 : 0.5,
                  }}
                >
                  <Edit3 size={14} /> Editar
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Personas" value={productPersonas.length} />
              <Metric label="Pilares" value={pillars.length} />
              <Metric label="OKRs" value={okrs.length} />
              <Metric label="KRs" value={totalKeyResults} />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 border-t border-[var(--border-soft)] md:grid-cols-3">
          <ProductMeta label="Criado em" value={formatDate(currentProduct.createdAt)} icon={<CalendarDays size={14} />} />
          <ProductMeta label="Responsável" value={owner?.name ?? "Não definido"} />
          <ProductMeta label="Progresso OKRs" value={okrs.length > 0 ? `${averageProgress}%` : "Sem OKRs"} />
        </div>
      </section>

      <div className="mt-6 grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(360px,0.65fr)]">
        <div className="space-y-5">
          <SectionCard
            icon={<Users size={16} />}
            title="Personas relacionadas"
            description="Personas vinculadas diretamente ao produto atual."
          >
            {productPersonas.length === 0 ? (
              <EmptyPanel
                icon={Users}
                title="Nenhuma persona de produto"
                description="Crie ou vincule personas com escopo Produto para enriquecer esta síntese."
              />
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {productPersonas.map((persona) => {
                  const avatar = getAvatar(persona.avatarId);
                  return (
                    <Link
                      key={persona.id}
                      href={`/personas/${persona.id}`}
                      className="rounded-xl border p-4 transition-colors hover:border-[var(--border-strong)]"
                      style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}
                    >
                      <div className="flex items-start gap-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={avatar.url}
                          alt={persona.name}
                          width={48}
                          height={48}
                          className="h-12 w-12 rounded-full border"
                          style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
                        />
                        <div className="min-w-0">
                          <div className="font-mono text-[10px] text-[var(--fg-faint)]">
                            {getPersonaDisplayId(persona)}
                          </div>
                          <div className="truncate text-[15px] font-semibold text-[var(--fg)]">
                            {persona.name || "Sem nome"}
                          </div>
                          <div className="truncate text-[12px] text-[var(--fg-muted)]">
                            {persona.role || persona.segment || "Sem papel definido"}
                          </div>
                        </div>
                      </div>
                      {persona.pains && (
                        <p className="mt-3 line-clamp-2 text-[12px] text-[var(--fg-subtle)]">{persona.pains}</p>
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={<Target size={16} />}
            title="OKRs e Key Results"
            description="Objetivos agrupados por pilar estratégico quando houver vínculo."
          >
            {okrs.length === 0 ? (
              <EmptyPanel
                icon={Target}
                title="Nenhum OKR cadastrado"
                description="Crie objetivos para acompanhar a estratégia deste produto."
              />
            ) : (
              <div className="space-y-4">
                {okrsByPillar.grouped.map(({ pillar, okrs: pillarOkrs }) => (
                  <PillarOkrGroup key={pillar.id} pillar={pillar} okrs={pillarOkrs} />
                ))}
                {okrsByPillar.withoutPillar.length > 0 && (
                  <PillarOkrGroup title="Sem pilar vinculado" okrs={okrsByPillar.withoutPillar} />
                )}
              </div>
            )}
          </SectionCard>
        </div>

        <div className="space-y-5">
          <SectionCard
            icon={<Columns3 size={16} />}
            title="Pilares estratégicos"
            description="Eixos estratégicos cadastrados para o produto."
          >
            {pillars.length === 0 ? (
              <EmptyPanel
                icon={Columns3}
                title="Nenhum pilar cadastrado"
                description="Use pilares para organizar objetivos e decisões estratégicas."
              />
            ) : (
              <div className="space-y-3">
                {pillars.map((pillar) => (
                  <Link
                    key={pillar.id}
                    href={`/pilares/${pillar.id}`}
                    className="block rounded-xl border bg-[var(--bg)] p-4 transition-colors hover:border-[var(--border-strong)]"
                    style={{ borderColor: "var(--border)", borderLeft: `4px solid ${pillar.color}` }}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[10px] text-[var(--fg-faint)]">
                        {getPillarDisplayId(pillar) ?? "Pilar"}
                      </span>
                      <span className="rounded-full border px-2 py-0.5 text-[11px] text-[var(--fg-muted)]" style={{ borderColor: "var(--border)" }}>
                        {formatPeriod(pillar.period)}
                      </span>
                    </div>
                    <div className="mt-2 text-[14px] font-semibold text-[var(--fg)]">{pillar.name}</div>
                    {pillar.description && (
                      <p className="mt-1 line-clamp-2 text-[12px] text-[var(--fg-muted)]">{pillar.description}</p>
                    )}
                  </Link>
                ))}
              </div>
            )}
          </SectionCard>

          <SectionCard
            icon={<Users size={16} />}
            title="Time responsável"
            description="Fonte atual: grupos do workspace vinculados ao produto e owner do produto."
          >
            {teams.length === 0 && teamMembers.length === 0 ? (
              <EmptyPanel
                icon={AlertCircle}
                title="Time não definido"
                description="Vincule um grupo ao produto em Settings para preencher esta seção."
              />
            ) : (
              <div className="space-y-4">
                {owner && (
                  <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
                    <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                      Responsável direto
                    </div>
                    <MemberRow member={owner} />
                  </div>
                )}
                {teams.map((team) => (
                  <TeamCard key={team.id} team={team} members={members.filter((member) => team.memberIds.includes(member.id))} />
                ))}
                {teams.length === 0 && teamMembers.map((member) => <MemberRow key={member.id} member={member} />)}
              </div>
            )}
          </SectionCard>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border px-3 py-2" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">{label}</div>
      <div className="mt-1 font-mono text-[20px] font-semibold text-[var(--fg)]">{value}</div>
    </div>
  );
}

function ProductMeta({ label, value, icon }: { label: string; value: string; icon?: ReactNode }) {
  return (
    <div className="border-b border-[var(--border-soft)] px-5 py-4 md:border-b-0 md:border-r last:md:border-r-0">
      <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
        {icon}
        {label}
      </div>
      <div className="mt-1 truncate text-[13px] font-medium text-[var(--fg-muted)]" title={value}>
        {value}
      </div>
    </div>
  );
}

function SectionCard({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5">
      <div className="mb-4 flex items-start gap-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: "var(--primary-soft-2)", color: "var(--primary)" }}
        >
          {icon}
        </div>
        <div>
          <h2 className="text-[16px] font-semibold text-[var(--fg)]">{title}</h2>
          <p className="mt-0.5 text-[12px] text-[var(--fg-subtle)]">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function EmptyPanel({
  icon,
  title,
  description,
}: {
  icon: Parameters<typeof EmptyState>[0]["icon"];
  title: string;
  description: string;
}) {
  return <EmptyState icon={icon} title={title} description={description} />;
}

function PillarOkrGroup({ pillar, title, okrs }: { pillar?: Pillar; title?: string; okrs: OKR[] }) {
  if (okrs.length === 0) return null;

  return (
    <div className="rounded-xl border p-4" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="mb-3 flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: pillar?.color ?? "var(--fg-faint)" }} />
        <div className="text-[13px] font-semibold text-[var(--fg)]">
          {pillar ? pillar.name : title}
        </div>
        {pillar && (
          <span className="font-mono text-[10px] text-[var(--fg-faint)]">
            {getPillarDisplayId(pillar) ?? "Pilar"}
          </span>
        )}
      </div>
      <div className="space-y-3">
        {okrs.map((okr) => {
          const progress = okrProgress(okr);
          const status = okrStatusConfig[okr.status];
          return (
            <Link
              key={okr.id}
              href={`/okrs/${okr.id}`}
              className="block rounded-lg border bg-[var(--bg-elevated)] p-3 transition-colors hover:border-[var(--border-strong)]"
              style={{ borderColor: "var(--border)" }}
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-[10px] text-[var(--fg-faint)]">
                    {getOKRDisplayId(okr) ?? "OKR"} · {formatPeriod(okr.period)}
                  </div>
                  <div className="mt-1 text-[14px] font-semibold text-[var(--fg)]">{okr.objective}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono text-[13px] text-[var(--fg)]">{progress}%</div>
                  <div className="flex items-center gap-1 text-[11px] text-[var(--fg-subtle)]">
                    <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: status.dot }} />
                    {status.label}
                  </div>
                </div>
              </div>
              {okr.keyResults.length > 0 && (
                <div className="mt-3 space-y-2">
                  {okr.keyResults.map((kr) => (
                    <div key={kr.id}>
                      <div className="mb-1 flex items-center justify-between gap-2 text-[11px]">
                        <span className="min-w-0 truncate text-[var(--fg-muted)]">
                          <span className="font-mono text-[var(--fg-faint)]">{getKeyResultDisplayId(kr) ?? "KR"}</span>{" "}
                          {kr.title}
                        </span>
                        <span className="shrink-0 font-mono text-[var(--fg-subtle)]">
                          {formatKrValue(kr.current, kr.unit)} / {formatKrValue(kr.target, kr.unit)}
                        </span>
                      </div>
                      <div className="h-1.5 overflow-hidden rounded-full" style={{ backgroundColor: "var(--bg-muted-2)" }}>
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${krProgress(kr)}%`, backgroundColor: status.dot }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

function TeamCard({ team, members }: { team: Team; members: Member[] }) {
  return (
    <div className="rounded-xl border p-3" style={{ borderColor: "var(--border)", backgroundColor: "var(--bg)" }}>
      <div className="flex items-start gap-2">
        <div className="mt-0.5 h-8 w-1 rounded-full" style={{ backgroundColor: team.color }} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {team.code && (
              <span className="rounded-full px-1.5 py-0.5 text-[10px] font-semibold" style={{ backgroundColor: "var(--bg-muted)", color: "var(--fg-subtle)" }}>
                {team.code}
              </span>
            )}
            <div className="text-[14px] font-semibold text-[var(--fg)]">{team.name}</div>
          </div>
          {team.description && <p className="mt-1 text-[12px] text-[var(--fg-muted)]">{team.description}</p>}
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {members.length === 0 ? (
          <div className="text-[12px] text-[var(--fg-faint)]">Sem membros vinculados.</div>
        ) : (
          members.map((member) => <MemberRow key={member.id} member={member} />)
        )}
      </div>
    </div>
  );
}

function MemberRow({ member }: { member: Member }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold text-white"
        style={{ backgroundColor: member.color }}
      >
        {member.initials}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold text-[var(--fg)]">{member.name}</span>
        <span className="block truncate text-[11px] text-[var(--fg-subtle)]">
          {member.role ?? member.workspaceRole ?? member.email}
        </span>
      </span>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", { day: "2-digit", month: "short", year: "numeric" }).format(date);
}

function formatKrValue(value: number, unit?: string) {
  return `${value}${unit ?? ""}`;
}
