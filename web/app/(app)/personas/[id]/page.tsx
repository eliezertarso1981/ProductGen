"use client";

import { use, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";
import { ArrowLeft, Trash2, Check } from "lucide-react";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { usePersonas } from "@/lib/personas-store";
import { useProducts } from "@/lib/products-context";
import { useDores } from "@/lib/dores-store";
import {
  avatarOptions,
  digitalMaturityLabel,
  getAvatar,
  scopeLabel,
  type DigitalMaturity,
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
  const { ready, getPersona, updatePersona, deletePersona } = usePersonas();
  const { products } = useProducts();
  const { pains } = useDores();

  const persona = getPersona(id);
  const nameRef = useRef<HTMLInputElement>(null);
  const [confirm, setConfirm] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);

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

  const avatar = getAvatar(persona.avatarId);
  const upd = (patch: Parameters<typeof updatePersona>[1]) => updatePersona(persona.id, patch);

  return (
    <div className="px-6 py-5">
      <div className="mb-4 flex items-center justify-between">
        <Link
          href="/personas"
          className="inline-flex items-center gap-1.5 text-[13px] text-[var(--fg-subtle)] hover:text-[var(--fg)]"
        >
          <ArrowLeft size={14} /> Personas
        </Link>
        <button
          onClick={() => setConfirm(true)}
          className="inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[12px] text-[var(--danger)] transition-colors hover:bg-[var(--danger-soft)]"
          style={{ borderColor: "var(--danger-border)" }}
        >
          <Trash2 size={13} /> Excluir
        </button>
      </div>

      <ConfirmDialog
        open={confirm}
        title="Excluir esta persona?"
        description="Esta ação não pode ser desfeita."
        confirmLabel="Excluir"
        destructive
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          deletePersona(persona.id);
          toast.success("Persona excluída");
          router.push("/personas");
        }}
      />

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
                alt={persona.name}
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
              <div className="font-mono text-[12px] text-[var(--fg-faint)]">{persona.id}</div>
              <input
                ref={nameRef}
                value={persona.name}
                onChange={(e) => upd({ name: e.target.value })}
                placeholder="Nome da persona"
                className="mt-0.5 w-full border-0 bg-transparent text-[24px] font-semibold tracking-tight text-[var(--fg)] outline-none placeholder:text-[var(--border-strong)] focus:bg-[var(--bg-muted)] focus:px-2 focus:py-1"
              />
              <input
                value={persona.role}
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
                  const active = opt.id === persona.avatarId;
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
                <NumberInput
                  value={persona.age}
                  onChange={(v) => upd({ age: v })}
                  placeholder="Ex.: 32"
                />
              </Field>
              <Field label="Sexo">
                <TextInput
                  value={persona.gender ?? ""}
                  onChange={(v) => upd({ gender: v })}
                  placeholder="Ex.: Feminino / Masculino / Outro"
                />
              </Field>
              <Field label="Segmento">
                <TextInput
                  value={persona.segment ?? ""}
                  onChange={(v) => upd({ segment: v })}
                  placeholder="Ex.: SaaS B2B"
                />
              </Field>
              <Field label="Porte da empresa">
                <TextInput
                  value={persona.companySize ?? ""}
                  onChange={(v) => upd({ companySize: v })}
                  placeholder="Ex.: 200–800 colaboradores"
                />
              </Field>
            </Grid2>
          </Section>

          {/* Frase típica */}
          <Section title="Frase típica">
            <Textarea
              value={persona.quote ?? ""}
              onChange={(v) => upd({ quote: v })}
              placeholder="“Eu não preciso de mais uma ferramenta...”"
              rows={2}
            />
          </Section>

          {/* Trabalho e dia a dia */}
          <Section title="Trabalho e dia a dia">
            <Field label="Responsabilidades principais">
              <Textarea
                value={persona.responsibilities ?? ""}
                onChange={(v) => upd({ responsibilities: v })}
                placeholder="O que ela é responsável por entregar"
              />
            </Field>
            <Field label="Objetivos do dia a dia">
              <Textarea
                value={persona.dailyGoals ?? ""}
                onChange={(v) => upd({ dailyGoals: v })}
                placeholder="O que tenta alcançar todos os dias"
              />
            </Field>
            <Field label="Comportamento operacional">
              <Textarea
                value={persona.operationalBehavior ?? ""}
                onChange={(v) => upd({ operationalBehavior: v })}
                placeholder="Como organiza o trabalho, rituais, ferramentas..."
              />
            </Field>
            <Field label="Indicadores / KPIs que acompanha">
              <Textarea
                value={persona.kpis ?? ""}
                onChange={(v) => upd({ kpis: v })}
                placeholder="Métricas que cobram dela"
              />
            </Field>
          </Section>

          {/* Compra e decisão */}
          <Section title="Compra e decisão">
            <Field label="Dores e frustrações">
              <Textarea
                value={persona.pains ?? ""}
                onChange={(v) => upd({ pains: v })}
                placeholder="O que dói no dia a dia"
              />
            </Field>
            <Field label="Gatilhos de compra">
              <Textarea
                value={persona.buyingTriggers ?? ""}
                onChange={(v) => upd({ buyingTriggers: v })}
                placeholder="O que faz ela buscar uma solução"
              />
            </Field>
            <Field label="Barreiras e objeções">
              <Textarea
                value={persona.objections ?? ""}
                onChange={(v) => upd({ objections: v })}
                placeholder="O que pode impedir a compra"
              />
            </Field>
            <Field label="Critérios de decisão">
              <Textarea
                value={persona.decisionCriteria ?? ""}
                onChange={(v) => upd({ decisionCriteria: v })}
                placeholder="Como avalia as opções"
              />
            </Field>
            <Field label="Influência no processo de compra">
              <Textarea
                value={persona.buyingInfluence ?? ""}
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
                  value={persona.digitalMaturity ?? ""}
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
                <TextInput
                  value={persona.tools ?? ""}
                  onChange={(v) => upd({ tools: v })}
                  placeholder="Jira, Notion, Slack..."
                />
              </Field>
            </Grid2>
            <Field label="Canais de informação e aprendizado">
              <Textarea
                value={persona.channels ?? ""}
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
                value={persona.motivators ?? ""}
                onChange={(v) => upd({ motivators: v })}
                placeholder="O que a impulsiona profissionalmente"
              />
            </Field>
            <Field label="Medos e riscos que tenta evitar">
              <Textarea
                value={persona.fears ?? ""}
                onChange={(v) => upd({ fears: v })}
                placeholder="O que ela teme e quer evitar"
              />
            </Field>
            <Field label="Como define sucesso no trabalho">
              <Textarea
                value={persona.successDefinition ?? ""}
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
                const active = persona.scope === s;
                return (
                  <button
                    key={s}
                    onClick={() => {
                      upd({
                        scope: s,
                        productId: s === "product" ? persona.productId : undefined,
                        painId: s === "pain" ? persona.painId : undefined,
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

          {persona.scope === "product" && (
            <Field label="Produto">
              <Select
                value={persona.productId ?? ""}
                onChange={(v) => upd({ productId: v || undefined })}
                options={[
                  { value: "", label: "Selecione um produto" },
                  ...products.map((p) => ({ value: p.id, label: p.name })),
                ]}
              />
            </Field>
          )}

          {persona.scope === "pain" && (
            <Field label="Dor">
              <Select
                value={persona.painId ?? ""}
                onChange={(v) => upd({ painId: v || undefined })}
                options={[
                  { value: "", label: "Selecione uma dor" },
                  ...pains.map((p) => ({ value: p.id, label: `${p.id} — ${p.title}` })),
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
                alt={persona.name}
                width={48}
                height={48}
                className="h-12 w-12 rounded-full border bg-white"
                style={{ borderColor: "var(--border)" }}
              />
              <div className="min-w-0">
                <div className="truncate text-[13px] font-semibold text-[var(--fg)]">
                  {persona.name || "Sem nome"}
                </div>
                <div className="truncate text-[11px] text-[var(--fg-muted)]">
                  {persona.role || "—"}
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
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

function NumberInput({
  value,
  onChange,
  placeholder,
}: {
  value?: number;
  onChange: (v: number | undefined) => void;
  placeholder?: string;
}) {
  return (
    <input
      type="number"
      value={value ?? ""}
      onChange={(e) => {
        const v = e.target.value;
        onChange(v === "" ? undefined : Number(v));
      }}
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
