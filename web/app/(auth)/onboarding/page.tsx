"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { DiscoveryFlowIntro } from "@/components/onboarding/discovery-flow-intro";
import { DiscoveryFlowStrip } from "@/components/onboarding/discovery-flow-strip";
import { OnboardingCard } from "@/components/onboarding/onboarding-card";
import { OnboardingStepHeader } from "@/components/onboarding/onboarding-step-header";
import { palette, brand } from "@/lib/theme";
import type { DiscoveryStageId } from "@/lib/onboarding-discovery";
import { completeOnboardingInApi, isOnboardingApiConfigured } from "@/lib/onboarding-api";
import {
  bootstrapProductgenAuth,
  createKeyResultInApi,
  createObjectiveInApi,
  createProductInApi,
  createStrategicPillarInApi,
  isProductgenApiConfigured,
} from "@/lib/productgen-api";

const PILLAR_TEMPLATES = [
  { label: "Crescimento, Retenção, Receita", pillars: ["Crescimento", "Retenção", "Receita"] },
  {
    label: "AARRR",
    pillars: ["Aquisição", "Ativação", "Retenção", "Receita", "Recomendação"],
  },
  {
    label: "Plataforma, Core, UX",
    pillars: ["Plataforma", "Produto Core", "Experiência do Usuário"],
  },
];

type Step = "intro" | 1 | 2 | 3 | "done";

const CONFIG_STEPS = 3;

const STEP_META: Record<Exclude<Step, "intro" | "done">, { title: string; subtitle: string }> = {
  1: {
    title: "Cadastre seu primeiro produto",
    subtitle: "É o ponto de partida do seu fluxo de discovery.",
  },
  2: {
    title: "Defina seus pilares estratégicos",
    subtitle: "Organize a estratégia em torno do produto que você acabou de criar.",
  },
  3: {
    title: "Cadastre seus primeiros OKRs",
    subtitle: "Opcional — você pode configurar objetivos e resultados-chave depois.",
  },
};

function stageForConfigStep(step: 1 | 2 | 3): DiscoveryStageId {
  if (step === 1) return "product";
  return "product";
}

export default function OnboardingPage() {
  return (
    <AuthShell showTestimonial={false} showFooter={false} maxWidth="md">
      {(theme) => <OnboardingWizard theme={theme} p={palette[theme]} />}
    </AuthShell>
  );
}

function OnboardingWizard({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [pillars, setPillars] = useState<Array<{ name: string; description: string }>>([
    { name: "", description: "" },
  ]);
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [krTitle, setKrTitle] = useState("");
  const [summary, setSummary] = useState({ products: 0, pillars: 0, okrs: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isProductgenApiConfigured()) return;
    bootstrapProductgenAuth().catch(() => router.replace("/signup"));
  }, [router]);

  const persistOnboardingComplete = async (): Promise<boolean> => {
    if (!isOnboardingApiConfigured()) return true;
    try {
      await completeOnboardingInApi();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível concluir o onboarding.");
      return false;
    }
  };

  const skipFullOnboarding = async () => {
    if (loading) return;
    setLoading(true);
    setError(undefined);
    const ok = await persistOnboardingComplete();
    setLoading(false);
    if (ok) router.push("/dashboard");
  };

  const skipCurrentStep = () => {
    if (loading) return;
    setError(undefined);
    if (step === 1) setStep(2);
    else if (step === 2) setStep(3);
    else if (step === 3) void finishOkrs(true);
  };

  const saveProduct = async () => {
    if (!productName.trim()) {
      setError("Informe o nome do produto.");
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      if (isOnboardingApiConfigured()) {
        const description = productDescription.trim();
        const product = await createProductInApi({
          name: productName.trim(),
          ...(description ? { vision: description } : {}),
        });
        setProductId(product.id);
      }
      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar produto.");
    } finally {
      setLoading(false);
    }
  };

  const savePillars = async () => {
    const valid = pillars.filter((pl) => pl.name.trim().length >= 2);
    if (valid.length < 1) {
      setError("Adicione pelo menos um pilar.");
      return;
    }
    if (!productId) {
      setStep(1);
      return;
    }
    setLoading(true);
    setError(undefined);
    try {
      if (isOnboardingApiConfigured()) {
        for (const pillar of valid) {
          await createStrategicPillarInApi(productId, {
            name: pillar.name.trim(),
            description: pillar.description.trim() || undefined,
          });
        }
      }
      setSummary((s) => ({ ...s, pillars: valid.length }));
      setStep(3);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao criar pilares.");
    } finally {
      setLoading(false);
    }
  };

  const finishOkrs = async (skipped: boolean) => {
    if (!skipped) {
      if (!objectiveTitle.trim() || !krTitle.trim()) {
        setError("Informe 1 objective e 1 key result, ou pule esta etapa.");
        return;
      }
      if (!productId) return;
      setLoading(true);
      setError(undefined);
      try {
        if (isOnboardingApiConfigured()) {
          const objective = await createObjectiveInApi(productId, { title: objectiveTitle.trim() });
          await createKeyResultInApi(objective.id, { title: krTitle.trim() });
        }
        setSummary((s) => ({ ...s, okrs: 1 }));
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao criar OKRs.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }

    setSummary((s) => ({ ...s, products: productId ? 1 : s.products }));
    setLoading(true);
    setError(undefined);
    const ok = await persistOnboardingComplete();
    setLoading(false);
    if (ok) setStep("done");
  };

  const inputClass =
    "w-full rounded-xl border px-3 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/30";
  const inputStyle = {
    borderColor: p.border,
    backgroundColor: p.inputBg,
    color: p.textPrimary,
    boxShadow: "var(--shadow-sm)",
  };

  return (
    <>
      <div className="mb-6 flex items-start justify-between gap-4">
        <BrandMark theme={theme} />
        {step !== "done" ? (
          <button
            type="button"
            disabled={loading}
            onClick={() => void skipFullOnboarding()}
            className="shrink-0 text-sm underline disabled:opacity-60"
            style={{ color: p.textSecondary }}
          >
            Ir para o dashboard
          </button>
        ) : null}
      </div>

      {step === "intro" && (
        <DiscoveryFlowIntro
          theme={theme}
          onContinue={() => setStep(1)}
          onSkipFull={() => void skipFullOnboarding()}
          skipDisabled={loading}
        />
      )}

      {step !== "intro" && step !== "done" && (
        <>
          <OnboardingStepHeader
            theme={theme}
            title={STEP_META[step].title}
            subtitle={STEP_META[step].subtitle}
            stepIndex={step}
            totalSteps={CONFIG_STEPS}
          />

          <OnboardingCard theme={theme} className="mb-4">
            <p className="mb-3 text-xs font-medium uppercase tracking-wider" style={{ color: p.textSecondary }}>
              Seu fluxo de discovery
            </p>
            <DiscoveryFlowStrip theme={theme} activeId={stageForConfigStep(step)} compact />
          </OnboardingCard>

          {error ? (
            <p className="mb-4 text-sm" style={{ color: brand.danger }}>
              {error}
            </p>
          ) : null}

          {step === 1 && (
            <OnboardingCard theme={theme}>
              <div className="space-y-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Nome do produto"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
                <textarea
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Descrição curta (opcional)"
                  rows={3}
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                />
                <PrimaryButton loading={loading} onClick={() => void saveProduct()}>
                  Continuar
                </PrimaryButton>
                <StepSkipLink
                  label="Pular esta etapa"
                  hint="Você pode cadastrar produtos no dashboard depois."
                  disabled={loading}
                  onClick={skipCurrentStep}
                  color={p.textSecondary}
                />
              </div>
            </OnboardingCard>
          )}

          {step === 2 && (
            <OnboardingCard theme={theme}>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  {PILLAR_TEMPLATES.map((tpl) => (
                    <button
                      key={tpl.label}
                      type="button"
                      className="rounded-lg border px-3 py-1.5 text-xs transition-shadow hover:shadow-sm"
                      style={{ borderColor: p.border, color: p.textSecondary, boxShadow: "var(--shadow-sm)" }}
                      onClick={() =>
                        setPillars(tpl.pillars.map((name) => ({ name, description: "" })))
                      }
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>
                {pillars.map((pillar, index) => (
                  <input
                    key={index}
                    className={inputClass}
                    style={inputStyle}
                    placeholder={`Pilar ${index + 1}`}
                    value={pillar.name}
                    onChange={(e) => {
                      const next = [...pillars];
                      next[index] = { ...next[index], name: e.target.value };
                      setPillars(next);
                    }}
                  />
                ))}
                <button
                  type="button"
                  className="text-sm underline"
                  style={{ color: brand.primary }}
                  onClick={() => setPillars([...pillars, { name: "", description: "" }])}
                >
                  + Adicionar pilar
                </button>
                <PrimaryButton loading={loading} onClick={() => void savePillars()}>
                  Continuar
                </PrimaryButton>
                <StepSkipLink
                  label="Pular esta etapa"
                  hint="Você pode definir pilares estratégicos no dashboard depois."
                  disabled={loading}
                  onClick={skipCurrentStep}
                  color={p.textSecondary}
                />
              </div>
            </OnboardingCard>
          )}

          {step === 3 && (
            <OnboardingCard theme={theme}>
              <div className="space-y-4">
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Título do Objective"
                  value={objectiveTitle}
                  onChange={(e) => setObjectiveTitle(e.target.value)}
                />
                <input
                  className={inputClass}
                  style={inputStyle}
                  placeholder="Título do Key Result"
                  value={krTitle}
                  onChange={(e) => setKrTitle(e.target.value)}
                />
                <PrimaryButton loading={loading} onClick={() => void finishOkrs(false)}>
                  Concluir OKRs
                </PrimaryButton>
                <StepSkipLink
                  label="Configurar depois"
                  hint="Você pode adicionar OKRs no dashboard a qualquer momento."
                  disabled={loading}
                  onClick={skipCurrentStep}
                  color={p.textSecondary}
                />
              </div>
            </OnboardingCard>
          )}
        </>
      )}

      {step === "done" && (
        <>
          <OnboardingStepHeader
            theme={theme}
            title="Tudo pronto!"
            subtitle="Seu workspace está configurado. Explore o discovery no dashboard."
            stepIndex={CONFIG_STEPS}
            totalSteps={CONFIG_STEPS}
          />
          <OnboardingCard theme={theme}>
            <DiscoveryFlowStrip theme={theme} compact />
            <p className="mt-4 text-sm" style={{ color: p.textSecondary }}>
              {summary.products} produto · {summary.pillars} pilares · {summary.okrs} OKR(s)
            </p>
            <div className="mt-6">
              <PrimaryButton onClick={() => router.push("/dashboard")}>
                Ir para meu Dashboard
              </PrimaryButton>
            </div>
          </OnboardingCard>
        </>
      )}
    </>
  );
}

function StepSkipLink({
  label,
  hint,
  disabled,
  onClick,
  color,
}: {
  label: string;
  hint?: string;
  disabled?: boolean;
  onClick: () => void;
  color: string;
}) {
  return (
    <div className="space-y-1 pt-1 text-center">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="text-sm underline disabled:opacity-60"
        style={{ color }}
      >
        {label}
      </button>
      {hint ? (
        <p className="text-xs" style={{ color }}>
          {hint}
        </p>
      ) : null}
    </div>
  );
}

function PrimaryButton({
  children,
  loading,
  onClick,
}: {
  children: React.ReactNode;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={loading}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
      style={{
        background: "linear-gradient(135deg, var(--primary) 0%, #21a3a3 100%)",
        boxShadow: "0 12px 28px -8px rgba(19, 200, 181, 0.45)",
      }}
    >
      {loading ? <Loader2 className="animate-spin" size={18} /> : children}
    </button>
  );
}
