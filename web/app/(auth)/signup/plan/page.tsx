"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { palette, brand } from "@/lib/theme";
import {
  isOnboardingApiConfigured,
  listPlansFromApi,
  setWorkspacePlanInApi,
  type PlanCatalogItem,
} from "@/lib/onboarding-api";
import { bootstrapProductgenAuth, isProductgenApiConfigured } from "@/lib/productgen-api";
import { planLimitRows } from "@/lib/plan-display";

const WORKSPACE_KEY = "productgen-api-workspace-id-v1";

export default function SignupPlanPage() {
  return <AuthShell>{(theme) => <PlanForm theme={theme} p={palette[theme]} />}</AuthShell>;
}

function PlanForm({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [plans, setPlans] = useState<PlanCatalogItem[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const [showEnterprise, setShowEnterprise] = useState(false);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadMessage, setLeadMessage] = useState("");

  useEffect(() => {
    if (!isProductgenApiConfigured()) return;
    bootstrapProductgenAuth()
      .then((data) => {
        setLeadName(data.user.name);
        setLeadEmail(data.user.email);
        setWorkspaceId(data.current_workspace_id ?? localStorage.getItem(WORKSPACE_KEY));
      })
      .catch(() => router.replace("/signup/workspace"));

    listPlansFromApi()
      .then((res) => setPlans(res.plans.filter((plan) => plan.code !== "free")))
      .catch(() => undefined);
  }, [router]);

  const selectPlan = async (code: string) => {
    if (!workspaceId) return;
    setLoadingPlan(code);
    try {
      if (code === "enterprise") {
        setShowEnterprise(true);
        return;
      }
      if (isOnboardingApiConfigured()) {
        await setWorkspacePlanInApi(workspaceId, { plan: code });
      }
      router.push("/onboarding");
    } finally {
      setLoadingPlan(null);
    }
  };

  const submitEnterprise = async () => {
    if (!workspaceId) return;
    setLoadingPlan("enterprise");
    try {
      await setWorkspacePlanInApi(workspaceId, {
        plan: "enterprise",
        enterprise_lead: {
          contact_name: leadName,
          contact_email: leadEmail,
          contact_phone: leadPhone || undefined,
          message: leadMessage || undefined,
        },
      });
      router.push("/onboarding");
    } finally {
      setLoadingPlan(null);
    }
  };

  return (
    <>
      <div className="mb-10">
        <BrandMark theme={theme} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Escolha seu plano
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Passo 4 de 4 — sem cobrança nesta versão
      </p>

      <div className="mt-8 grid gap-4">
        {plans.map((plan) => (
          <div
            key={plan.code}
            className="rounded-2xl border p-5"
            style={{ borderColor: p.border, backgroundColor: p.inputBg }}
          >
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold" style={{ color: p.textPrimary }}>
                  {plan.name}
                </h2>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: p.textSecondary }}>
                  {plan.display.description}
                </p>
                <ul className="mt-4 space-y-2">
                  {planLimitRows(plan).map((row) => (
                    <li
                      key={row.label}
                      className="flex items-baseline justify-between gap-4 text-sm"
                      style={{ color: p.textPrimary }}
                    >
                      <span style={{ color: p.textSecondary }}>{row.label}</span>
                      <span className="font-medium tabular-nums">{row.value}</span>
                    </li>
                  ))}
                </ul>
                {plan.display.highlights && plan.display.highlights.length > 0 ? (
                  <ul className="mt-3 space-y-1 border-t pt-3 text-xs" style={{ borderColor: p.border }}>
                    {plan.display.highlights.map((item) => (
                      <li key={item} style={{ color: p.textSecondary }}>
                        · {item}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              <button
                type="button"
                disabled={Boolean(loadingPlan)}
                onClick={() => void selectPlan(plan.code)}
                className="shrink-0 rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-70"
                style={{ backgroundColor: brand.primary }}
              >
                {loadingPlan === plan.code ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : plan.code === "enterprise" ? (
                  "Falar com vendas"
                ) : (
                  "Começar"
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {showEnterprise && (
        <div className="mt-6 space-y-3 rounded-2xl border p-4" style={{ borderColor: p.border }}>
          <p className="text-sm font-medium" style={{ color: p.textPrimary }}>
            Falar com vendas (Enterprise)
          </p>
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            value={leadName}
            onChange={(e) => setLeadName(e.target.value)}
            placeholder="Nome"
          />
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            value={leadEmail}
            onChange={(e) => setLeadEmail(e.target.value)}
            placeholder="E-mail"
          />
          <input
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            value={leadPhone}
            onChange={(e) => setLeadPhone(e.target.value)}
            placeholder="Telefone"
          />
          <textarea
            className="w-full rounded-xl border px-3 py-2 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
            value={leadMessage}
            onChange={(e) => setLeadMessage(e.target.value)}
            placeholder="Mensagem"
            rows={3}
          />
          <button
            type="button"
            onClick={() => void submitEnterprise()}
            disabled={loadingPlan === "enterprise"}
            className="w-full rounded-xl py-2.5 text-sm font-semibold text-white"
            style={{ backgroundColor: brand.primary }}
          >
            {loadingPlan === "enterprise" ? "Enviando..." : "Enviar e continuar"}
          </button>
        </div>
      )}
    </>
  );
}
