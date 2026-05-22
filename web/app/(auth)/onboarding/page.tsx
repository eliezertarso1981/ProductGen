"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { palette, brand } from "@/lib/theme";
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

type Step = 1 | 2 | 3 | "done";

const STEP_TITLES: Record<Step, string> = {
  1: "Cadastre seu primeiro produto",
  2: "Defina seus pilares estratégicos",
  3: "Cadastre seus primeiros OKRs",
  done: "Tudo pronto!",
};

export default function OnboardingPage() {
  return (
    <AuthShell showFooter={false}>
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
  const [step, setStep] = useState<Step>(1);
  const [productId, setProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productDescription, setProductDescription] = useState("");
  const [pillars, setPillars] = useState<Array<{ name: string; description: string }>>([{ name: "", description: "" }]);
  const [objectiveTitle, setObjectiveTitle] = useState("");
  const [krTitle, setKrTitle] = useState("");
  const [summary, setSummary] = useState({ products: 0, pillars: 0, okrs: 0 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!isProductgenApiConfigured()) return;
    bootstrapProductgenAuth().catch(() => router.replace("/signup"));
  }, [router]);

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
    const valid = pillars.filter((p) => p.name.trim().length >= 2);
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

    setSummary((s) => ({ ...s, products: 1 }));
    if (isOnboardingApiConfigured()) {
      setLoading(true);
      setError(undefined);
      try {
        await completeOnboardingInApi();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Não foi possível concluir o onboarding.");
        setLoading(false);
        return;
      }
      setLoading(false);
    }
    setStep("done");
  };

  return (
    <>
      <div className="mb-8">
        <BrandMark theme={theme} />
      </div>
      <h1 className="text-3xl font-semibold" style={{ color: p.textPrimary }}>
        {STEP_TITLES[step]}
      </h1>
      {step !== "done" ? (
        <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
          Etapa {step} de 3
        </p>
      ) : null}

      {error ? (
        <p className="mt-4 text-sm" style={{ color: brand.danger }}>
          {error}
        </p>
      ) : null}

      {step === 1 && (
        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            placeholder="Nome do produto"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
          />
          <textarea
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            placeholder="Descrição curta (opcional)"
            rows={3}
            value={productDescription}
            onChange={(e) => setProductDescription(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void saveProduct()}
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Continuar"}
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-6 space-y-4">
          <div className="flex flex-wrap gap-2">
            {PILLAR_TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                className="rounded-lg border px-3 py-1.5 text-xs"
                style={{ borderColor: p.border, color: p.textSecondary }}
                onClick={() =>
                  setPillars(tpl.pillars.map((name) => ({ name, description: "" })))
                }
              >
                {tpl.label}
              </button>
            ))}
          </div>
          {pillars.map((pillar, index) => (
            <div key={index} className="space-y-2">
              <input
                className="w-full rounded-xl border px-3 py-2 text-sm"
                style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
                placeholder={`Pilar ${index + 1}`}
                value={pillar.name}
                onChange={(e) => {
                  const next = [...pillars];
                  next[index] = { ...next[index], name: e.target.value };
                  setPillars(next);
                }}
              />
            </div>
          ))}
          <button
            type="button"
            className="text-sm underline"
            style={{ color: brand.primary }}
            onClick={() => setPillars([...pillars, { name: "", description: "" }])}
          >
            + Adicionar pilar
          </button>
          <button
            type="button"
            onClick={() => void savePillars()}
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            {loading ? <Loader2 className="mx-auto animate-spin" size={18} /> : "Continuar"}
          </button>
        </div>
      )}

      {step === 3 && (
        <div className="mt-6 space-y-4">
          <input
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            placeholder="Título do Objective"
            value={objectiveTitle}
            onChange={(e) => setObjectiveTitle(e.target.value)}
          />
          <input
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            placeholder="Título do Key Result"
            value={krTitle}
            onChange={(e) => setKrTitle(e.target.value)}
          />
          <button
            type="button"
            onClick={() => void finishOkrs(false)}
            disabled={loading}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            Concluir OKRs
          </button>
          <button
            type="button"
            onClick={() => {
              if (window.confirm("Configurar OKRs depois? Você pode adicioná-los no dashboard.")) {
                void finishOkrs(true);
              }
            }}
            className="w-full text-sm underline"
            style={{ color: p.textSecondary }}
          >
            Configurar depois
          </button>
        </div>
      )}

      {step === "done" && (
        <div className="mt-8 space-y-4">
          <p className="text-sm" style={{ color: p.textSecondary }}>
            {summary.products} produto · {summary.pillars} pilares · {summary.okrs} OKR(s)
          </p>
          <button
            type="button"
            onClick={() => router.push("/dashboard")}
            className="w-full rounded-xl py-3 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            Ir para meu Dashboard
          </button>
        </div>
      )}
    </>
  );
}
