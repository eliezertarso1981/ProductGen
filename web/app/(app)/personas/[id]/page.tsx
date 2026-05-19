"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Check } from "lucide-react";
import { CancelAction, DeleteAction, FormActions, SaveAction } from "@/components/shared/crud-ui";
import { MultiTagInput, SingleTagInput } from "@/components/shared/single-tag-input";
import { usePersonas } from "@/lib/personas-store";
import { useProducts } from "@/lib/products-context";
import { useDores } from "@/lib/dores-store";
import { getPainDisplayId } from "@/lib/dores-data";
import {
  avatarOptions,
  digitalMaturityLabel,
  getAvatar,
  getPersonaDisplayId,
  scopeLabel,
  type DigitalMaturity,
  type Persona,
  type PersonaScope,
} from "@/lib/personas-data";

export default function PersonaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const search = useSearchParams();
  const isNew = search.get("new") === "1";
  const { ready, personas, getPersona, updatePersona, deletePersona } = usePersonas();
  const { products } = useProducts();
  const { pains } = useDores();

  const persona = getPersona(id);
  const nameRef = useRef<HTMLInputElement>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [draft, setDraft] = useState<Parameters<typeof updatePersona>[1]>({});

  useEffect(() => {
    if (!persona) return;
    setDraft({
      avatarId: persona.avatarId,
      name: persona.name,
      role: persona.role,
      age: persona.age,
      gender: persona.gender,
      segment: persona.segment,
      companySize: persona.companySize,
      quote: persona.quote,
      responsibilities: persona.responsibilities,
      dailyGoals: persona.dailyGoals,
      operationalBehavior: persona.operationalBehavior,
      kpis: persona.kpis,
      pains: persona.pains,
      buyingTriggers: persona.buyingTriggers,
      objections: persona.objections,
      decisionCriteria: persona.decisionCriteria,
      buyingInfluence: persona.buyingInfluence,
      digitalMaturity: persona.digitalMaturity,
      tools: persona.tools,
      channels: persona.channels,
      motivators: persona.motivators,
      fears: persona.fears,
      successDefinition: persona.successDefinition,
      scope: persona.scope,
      productId: persona.productId,
      painId: persona.painId,
    });
  }, [persona]);

  useEffect(() => {
    if (isNew && nameRef.current) {
      nameRef.current.focus();
      nameRef.current.select();
    }
  }, [isNew]);

  if (!ready)
    return <div className="px-6 py-10 text-[13px] text-[var(--fg-faint)]">Carregando...</div>;
  if (!persona) {
    return (
      <div className="px-6 py-10">
        <p className="text-[14px] text-[var(--fg-muted)]">Persona não encontrada.</p>
        <Link
          href="/personas"
          className="mt-3 inline-block text-[13px] text-[var(--primary)] hover:underline"
        >
          ← Voltar para Personas
        </Link>
      </div>
    );
  }

  const current = { ...persona, ...draft };
  const avatar = getAvatar(current.avatarId);
  const identityTagSuggestions = buildIdentityTagSuggestions(personas, persona);
  const toolTagSuggestions = buildToolTagSuggestions(personas, persona);
  const dirty = JSON.stringify(draft) !==
    JSON.stringify({
      avatarId: persona.avatarId,
      name: persona.name,
      role: persona.role,
      age: persona.age,
      gender: persona.gender,
      segment: persona.segment,
      companySize: persona.companySize,
      quote: persona.quote,
      responsibilities: persona.responsibilities,
      dailyGoals: persona.dailyGoals,
      operationalBehavior: persona.operationalBehavior,
      kpis: persona.kpis,
      pains: persona.pains,
      buyingTriggers: persona.buyingTriggers,
      objections: persona.objections,
      decisionCriteria: persona.decisionCriteria,
      buyingInfluence: persona.buyingInfluence,
      digitalMaturity: persona.digitalMaturity,
      tools: persona.tools,
      channels: persona.channels,
      motivators: persona.motivators,
      fears: persona.fears,
      successDefinition: persona.successDefinition,
      scope: persona.scope,
      productId: persona.productId,
      painId: persona.painId,
    });
  const resetDraft = () => setDraft({
    avatarId: persona.avatarId,
    name: persona.name,
    role: persona.role,
    age: persona.age,
    gender: persona.gender,
    segment: persona.segment,
    companySize: persona.companySize,
    quote: persona.quote,
    responsibilities: persona.responsibilities,
    dailyGoals: persona.dailyGoals,
    operationalBehavior: persona.operationalBehavior,
    kpis: persona.kpis,
    pains: persona.pains,
    buyingTriggers: persona.buyingTriggers,
    objections: persona.objections,
    decisionCriteria: persona.decisionCriteria,
    buyingInfluence: persona.buyingInfluence,
    digitalMaturity: persona.digitalMaturity,
    tools: persona.tools,
    channels: persona.channels,
    motivators: persona.motivators,
    fears: persona.fears,
    successDefinition: persona.successDefinition,
    scope: persona.scope,
    productId: persona.productId,
    painId: persona.painId,
  });
  const upd = (patch: Parameters<typeof updatePersona>[1]) => setDraft((value) => ({ ...value, ...patch }));
  const saveDraft = () => {
    updatePersona(persona.id, draft);
    toast.success("Persona salva");
  };

  return (
    <div className="px-6 py-5">
      <div className="mb-4">
        <Link
          href="/personas"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]"
        >
          <ArrowLeft size={14} /> Personas
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_400px]">
        {/* Main */}
        <div>
          <div className="flex items-start gap-4">
            <button
              type="button"
              onClick={() => setPickerOpen((v) => !v)}
              className="group relative shrink-0 rounded-full"
              title="Trocar avatar"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.url}
                alt={current.name}
                width={88}
                height={88}
                className="h-22 w-22 rounded-full border-2"
                style={{
                  borderColor: "var(--border-strong)",
                  backgroundColor: "var(--bg-muted)",
                  width: 88,
                  height: 88,
                }}
              />
              <span className="absolute inset-x-0 -bottom-2 text-center text-[10px] font-medium text-[var(--primary)] opacity-0 transition-opacity group-hover:opacity-100">
                trocar
              </span>
            </button>

            <div className="min-w-0 flex-1">
              <div className="font-mono text-[12px] text-[var(--fg-faint)]">
                {getPersonaDisplayId(persona)}
              </div>
              <input
                ref={nameRef}
                value={current.name}
                onChange={(e) => upd({ name: e.target.value })}
                placeholder="Nome da persona"
                className="mt-0.5 w-full border-0 bg-transparent text-[28px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--fg-faint)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
              />
              <input
                value={current.role}
                onChange={(e) => upd({ role: e.target.value })}
                placeholder="Cargo"
                className="mt-0.5 w-full border-0 bg-transparent text-[14px] text-[var(--fg-muted)] outline-none placeholder:text-[var(--fg-faint)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
              />
            </div>
          </div>

          {pickerOpen && (
            <div
              className="mt-3 rounded-xl border p-3"
              style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
            >
              <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
                Escolher avatar
              </div>
              <div className="grid grid-cols-6 gap-2 sm:grid-cols-8">
                {avatarOptions.map((opt) => {
                  const active = opt.id === current.avatarId;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => {
                        upd({ avatarId: opt.id });
                        setPickerOpen(false);
                      }}
                      className="relative rounded-full border-2 transition-transform hover:scale-105"
                      style={{
                        borderColor: active ? "var(--primary)" : "transparent",
                      }}
                      title={opt.label}
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={opt.url}
                        alt={opt.label}
                        width={56}
                        height={56}
                        className="h-14 w-14 rounded-full bg-white"
                      />
                      {active && (
                        <span
                          className="absolute -right-1 -bottom-1 inline-flex h-5 w-5 items-center justify-center rounded-full text-white"
                          style={{ backgroundColor: "var(--primary)" }}
                        >
                          <Check size={12} />
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Identidade */}
          <Section title="Identidade">
            <Grid2>
              <Field label="Idade">
                <SingleTagInput
                  value={current.age === undefined ? "" : String(current.age)}
                  onChange={(v) => upd({ age: parseAgeTagValue(v) })}
                  suggestions={identityTagSuggestions.ages}
                  placeholder="Ex.: 32"
                  inputMode="numeric"
                />
              </Field>
              <Field label="Sexo">
                <SingleTagInput
                  value={current.gender ?? ""}
                  onChange={(v) => upd({ gender: v })}
                  suggestions={identityTagSuggestions.genders}
                  placeholder="Ex.: Feminino / Masculino / Outro"
                />
              </Field>
              <Field label="Segmento">
                <SingleTagInput
                  value={current.segment ?? ""}
                  onChange={(v) => upd({ segment: v })}
                  suggestions={identityTagSuggestions.segments}
                  placeholder="Ex.: SaaS B2B"
                />
              </Field>
              <Field label="Porte da empresa">
                <SingleTagInput
                  value={current.companySize ?? ""}
                  onChange={(v) => upd({ companySize: v })}
                  suggestions={identityTagSuggestions.companySizes}
                  placeholder="Ex.: 200–800 colaboradores"
                />
              </Field>
            </Grid2>
          </Section>

          {/* Frase típica */}
          <Section title="Frase típica">
            <Textarea
              value={current.quote ?? ""}
              onChange={(v) => upd({ quote: v })}
              placeholder="“Eu não preciso de mais uma ferramenta...”"
              rows={2}
            />
          </Section>

          {/* Trabalho e dia a dia */}
          <Section title="Trabalho e dia a dia">
            <Field label="Responsabilidades principais">
              <Textarea
                value={current.responsibilities ?? ""}
                onChange={(v) => upd({ responsibilities: v })}
                placeholder="O que ela é responsável por entregar"
              />
            </Field>
            <Field label="Objetivos do dia a dia">
              <Textarea
                value={current.dailyGoals ?? ""}
                onChange={(v) => upd({ dailyGoals: v })}
                placeholder="O que tenta alcançar todos os dias"
              />
            </Field>
            <Field label="Comportamento operacional">
              <Textarea
                value={current.operationalBehavior ?? ""}
                onChange={(v) => upd({ operationalBehavior: v })}
                placeholder="Como organiza o trabalho, rituais, ferramentas..."
              />
            </Field>
            <Field label="Indicadores / KPIs que acompanha">
              <Textarea
                value={current.kpis ?? ""}
                onChange={(v) => upd({ kpis: v })}
                placeholder="Métricas que cobram dela"
              />
            </Field>
          </Section>

          {/* Compra e decisão */}
          <Section title="Compra e decisão">
            <Field label="Dores e frustrações">
              <Textarea
                value={current.pains ?? ""}
                onChange={(v) => upd({ pains: v })}
                placeholder="O que dói no dia a dia"
              />
            </Field>
            <Field label="Gatilhos de compra">
              <Textarea
                value={current.buyingTriggers ?? ""}
                onChange={(v) => upd({ buyingTriggers: v })}
                placeholder="O que faz ela buscar uma solução"
              />
            </Field>
            <Field label="Barreiras e objeções">
              <Textarea
                value={current.objections ?? ""}
                onChange={(v) => upd({ objections: v })}
                placeholder="O que pode impedir a compra"
              />
            </Field>
            <Field label="Critérios de decisão">
              <Textarea
                value={current.decisionCriteria ?? ""}
                onChange={(v) => upd({ decisionCriteria: v })}
                placeholder="Como avalia as opções"
              />
            </Field>
            <Field label="Influência no processo de compra">
              <Textarea
                value={current.buyingInfluence ?? ""}
                onChange={(v) => upd({ buyingInfluence: v })}
                placeholder="Decisor, influenciador, usuário, etc."
                rows={2}
              />
            </Field>
          </Section>

          {/* Maturidade e ferramentas */}
          <Section title="Maturidade e ferramentas">
            <Grid2>
              <Field label="Maturidade digital">
                <Select
                  value={current.digitalMaturity ?? ""}
                  onChange={(v) =>
                    upd({ digitalMaturity: (v || undefined) as DigitalMaturity | undefined })
                  }
                  options={[
                    { value: "", label: "—" },
                    { value: "baixa", label: digitalMaturityLabel.baixa },
                    { value: "media", label: digitalMaturityLabel.media },
                    { value: "alta", label: digitalMaturityLabel.alta },
                  ]}
                />
              </Field>
              <Field label="Ferramentas que utiliza">
                <MultiTagInput
                  values={parseTagList(current.tools)}
                  onChange={(values) => upd({ tools: serializeTagList(values) })}
                  suggestions={toolTagSuggestions}
                  placeholder="Jira, Notion, Slack..."
                />
              </Field>
            </Grid2>
            <Field label="Canais de informação e aprendizado">
              <Textarea
                value={current.channels ?? ""}
                onChange={(v) => upd({ channels: v })}
                placeholder="Onde se informa, comunidades, newsletters"
                rows={2}
              />
            </Field>
          </Section>

          {/* Motivações */}
          <Section title="Motivações e medos">
            <Field label="Motivadores profissionais">
              <Textarea
                value={current.motivators ?? ""}
                onChange={(v) => upd({ motivators: v })}
                placeholder="O que a impulsiona profissionalmente"
              />
            </Field>
            <Field label="Medos e riscos que tenta evitar">
              <Textarea
                value={current.fears ?? ""}
                onChange={(v) => upd({ fears: v })}
                placeholder="O que ela teme e quer evitar"
              />
            </Field>
            <Field label="Como define sucesso no trabalho">
              <Textarea
                value={current.successDefinition ?? ""}
                onChange={(v) => upd({ successDefinition: v })}
                placeholder="Como sabe que fez um bom trabalho"
                rows={2}
              />
            </Field>
          </Section>
        </div>

        {/* Sidebar */}
        <aside className="space-y-5">
          <Field label="Vínculo">
            <div className="grid grid-cols-3 gap-1.5">
              {(["workspace", "product", "pain"] as PersonaScope[]).map((s) => {
                const active = current.scope === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      upd({
                        scope: s,
                        productId: s === "product" ? current.productId : undefined,
                        painId: s === "pain" ? current.painId : undefined,
                      });
                    }}
                    className="rounded-md border px-2 py-1.5 text-[12px] font-medium transition-colors"
                    style={{
                      borderColor: active ? "var(--primary)" : "var(--border)",
                      backgroundColor: active ? "var(--primary-soft)" : "var(--bg)",
                      color: active ? "var(--primary)" : "var(--fg-muted)",
                    }}
                  >
                    {scopeLabel[s]}
                  </button>
                );
              })}
            </div>
          </Field>

          {current.scope === "product" && (
            <Field label="Produto">
              <Select
                value={current.productId ?? ""}
                onChange={(v) => upd({ productId: v || undefined })}
                options={[
                  { value: "", label: "Selecione um produto" },
                  ...products.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </Field>
          )}

          {current.scope === "pain" && (
            <Field label="Dor">
              <Select
                value={current.painId ?? ""}
                onChange={(v) => upd({ painId: v || undefined })}
                options={[
                  { value: "", label: "Selecione uma dor" },
                  ...pains.map((p) => ({
                    value: p.id,
                    label: getPainDisplayId(p) ? `${getPainDisplayId(p)} — ${p.title}` : p.title,
                  })),
                ]}
              />
            </Field>
          )}

          <div
            className="rounded-xl border p-3"
            style={{ borderColor: "var(--border)", backgroundColor: "var(--bg-muted)" }}
          >
            <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
              Prévia
            </div>
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={avatar.url}
                alt={current.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full border bg-white"
                style={{ borderColor: "var(--border)" }}
              />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--fg)]">
                  {current.name || "Sem nome"}
                </div>
                <div className="truncate text-[11px] text-[var(--fg-muted)]">
                  {current.role || "—"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      <FormActions>
        <SaveAction disabled={!dirty} onClick={saveDraft} />
        <CancelAction disabled={!dirty} onClick={resetDraft} />
        <DeleteAction
          title="Excluir esta persona?"
          description={`A persona "${persona.name || "sem nome"}" será removida. Esta ação não pode ser desfeita.`}
          onConfirm={() => {
            deletePersona(persona.id);
            toast.success("Persona excluída");
            router.push("/personas");
          }}
        />
      </FormActions>
    </div>
  );
}

function buildIdentityTagSuggestions(personas: Persona[], currentPersona: Persona) {
  const otherPersonas = personas.filter((item) => !isSamePersona(item, currentPersona));

  return {
    ages: uniqueTagValues(otherPersonas.map((item) => item.age)),
    genders: uniqueTagValues(otherPersonas.map((item) => item.gender)),
    segments: uniqueTagValues(otherPersonas.map((item) => item.segment)),
    companySizes: uniqueTagValues(otherPersonas.map((item) => item.companySize)),
  };
}

function buildToolTagSuggestions(personas: Persona[], currentPersona: Persona): string[] {
  return uniqueTagValues(
    personas
      .filter((item) => !isSamePersona(item, currentPersona))
      .flatMap((item) => parseTagList(item.tools)),
  );
}

function isSamePersona(item: Persona, currentPersona: Persona): boolean {
  return (
    item.id === currentPersona.id ||
    Boolean(currentPersona.apiId && item.apiId === currentPersona.apiId) ||
    Boolean(currentPersona.code && item.code === currentPersona.code)
  );
}

function uniqueTagValues(values: Array<number | string | undefined>): string[] {
  const seen = new Set<string>();

  return values.reduce<string[]>((acc, value) => {
    const tag = value === undefined ? "" : String(value).trim();
    const key = tag.toLocaleLowerCase("pt-BR");
    if (!tag || seen.has(key)) return acc;

    seen.add(key);
    acc.push(tag);
    return acc;
  }, []);
}

function parseAgeTagValue(value: string): number | undefined {
  const trimmedValue = value.trim();
  if (!trimmedValue) return undefined;

  const age = Number(trimmedValue);
  return Number.isFinite(age) ? age : undefined;
}

function parseTagList(value?: string): string[] {
  if (!value) return [];

  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function serializeTagList(values: string[]): string {
  return uniqueTagValues(values).join(", ");
}

/* ---------- UI primitives ---------- */

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mt-6">
      <div className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[var(--fg-faint)]">
        {title}
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-[11px] font-medium text-[var(--fg-subtle)]">{label}</div>
      {children}
    </div>
  );
}

function Grid2({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">{children}</div>;
}

const inputCls =
  "w-full rounded-md border bg-white px-2.5 py-1.5 text-[13px] text-[var(--fg)] outline-none focus:border-[var(--primary)]";

function TextInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={inputCls}
      style={{ borderColor: "var(--border)" }}
    />
  );
}

function Textarea({
  value,
  onChange,
  placeholder,
  rows = 3,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      rows={rows}
      className={inputCls}
      style={{ borderColor: "var(--border)" }}
    />
  );
}

function Select({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
      style={{ borderColor: "var(--border)" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
