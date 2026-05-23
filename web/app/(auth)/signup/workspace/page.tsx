"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { TextField } from "@/components/auth/text-field";
import { palette, brand } from "@/lib/theme";
import {
  checkSlugAvailable,
  createWorkspaceInApi,
  isOnboardingApiConfigured,
} from "@/lib/onboarding-api";
import { bootstrapProductgenAuth, isProductgenApiConfigured } from "@/lib/productgen-api";

const COMPANY_SIZES = [
  { value: "1-10", label: "1–10 (Solo / Startup)" },
  { value: "11-50", label: "11–50 (Small)" },
  { value: "51-200", label: "51–200 (Medium)" },
  { value: "201-1000", label: "201–1000 (Large)" },
  { value: "1000+", label: "1000+ (Enterprise)" },
];

const COUNTRIES = [
  { code: "BR", name: "Brasil" },
  { code: "US", name: "Estados Unidos" },
  { code: "PT", name: "Portugal" },
  { code: "ES", name: "Espanha" },
  { code: "MX", name: "México" },
  { code: "AR", name: "Argentina" },
];

function slugifyPreview(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export default function SignupWorkspacePage() {
  return (
    <AuthShell showTestimonial={false}>
      {(theme) => <WorkspaceForm theme={theme} p={palette[theme]} />}
    </AuthShell>
  );
}

function WorkspaceForm({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);
  const [logoUrl, setLogoUrl] = useState("");
  const [companySize, setCompanySize] = useState("11-50");
  const [countryCode, setCountryCode] = useState("BR");
  const [slugAvailable, setSlugAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const previewSlug = useMemo(() => slug || slugifyPreview(name), [name, slug]);

  useEffect(() => {
    if (!isProductgenApiConfigured()) return;
    bootstrapProductgenAuth().catch(() => router.replace("/signup"));
  }, [router]);

  useEffect(() => {
    if (!slugEdited && name) setSlug(slugifyPreview(name));
  }, [name, slugEdited]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!previewSlug || !isOnboardingApiConfigured()) return;
      try {
        const { available } = await checkSlugAvailable(previewSlug);
        setSlugAvailable(available);
      } catch {
        setSlugAvailable(null);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [previewSlug]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    if (!name.trim() || name.trim().length < 2) {
      setError("Informe o nome do workspace.");
      return;
    }
    if (slugAvailable === false) {
      setError("Este slug já está em uso.");
      return;
    }

    setLoading(true);
    try {
      if (isOnboardingApiConfigured()) {
        await createWorkspaceInApi({
          name: name.trim(),
          slug: previewSlug,
          logo_url: logoUrl.trim() || null,
          company_size: companySize,
          country_code: countryCode,
        });
        await bootstrapProductgenAuth();
      }
      router.push("/signup/admin");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar o workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <BrandMark theme={theme} />
      </div>
      <h1 className="text-3xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Cadastrar workspace
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Passo 2 de 4 — dados da sua empresa
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <TextField
          label="Nome do workspace"
          name="name"
          icon={Building2}
          theme={theme}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <TextField
          label="Slug (URL)"
          name="slug"
          icon={Building2}
          theme={theme}
          value={slug}
          onChange={(e) => {
            setSlugEdited(true);
            setSlug(e.target.value);
          }}
          trailing={
            slugAvailable === false ? (
              <span className="pr-3 text-xs" style={{ color: brand.danger }}>
                Em uso
              </span>
            ) : slugAvailable === true ? (
              <span className="pr-3 text-xs" style={{ color: brand.primary }}>
                OK
              </span>
            ) : null
          }
        />
        <TextField
          label="URL do logo (opcional)"
          name="logo_url"
          icon={Building2}
          theme={theme}
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://..."
        />

        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: p.textSecondary }}>
            Tamanho da empresa
          </label>
          <select
            value={companySize}
            onChange={(e) => setCompanySize(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
          >
            {COMPANY_SIZES.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-1.5">
          <label className="block text-[11px] font-semibold uppercase tracking-wider" style={{ color: p.textSecondary }}>
            País
          </label>
          <select
            value={countryCode}
            onChange={(e) => setCountryCode(e.target.value)}
            className="w-full rounded-xl border px-3 py-2.5 text-sm"
            style={{ borderColor: p.border, backgroundColor: p.inputBg, color: p.textPrimary }}
          >
            {COUNTRIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {error ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: brand.danger }}>
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70"
          style={{ backgroundColor: brand.primary }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Continuar
        </button>
      </form>
    </>
  );
}

