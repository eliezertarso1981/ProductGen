"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { User, Mail, Loader2, AlertCircle } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { TextField } from "@/components/auth/text-field";
import { palette, brand } from "@/lib/theme";
import { isOnboardingApiConfigured, updateMeInApi } from "@/lib/onboarding-api";
import { bootstrapProductgenAuth, isProductgenApiConfigured } from "@/lib/productgen-api";

export default function SignupAdminPage() {
  return (
    <AuthShell showTestimonial={false}>
      {(theme) => <AdminForm theme={theme} p={palette[theme]} />}
    </AuthShell>
  );
}

function AdminForm({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isProductgenApiConfigured()) return;
    bootstrapProductgenAuth()
      .then((data) => {
        setName(data.user.name);
        setEmail(data.user.email);
      })
      .catch(() => router.replace("/signup"));
  }, [router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    setLoading(true);
    try {
      if (isOnboardingApiConfigured()) {
        await updateMeInApi({
          name: name.trim(),
          job_title: jobTitle.trim() || null,
          avatar_url: avatarUrl.trim() || null,
        });
      }
      router.push("/signup/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar seus dados.");
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
        Seu perfil de admin
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Passo 3 de 4 — confirme seus dados
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <TextField label="Nome completo" name="name" icon={User} theme={theme} value={name} onChange={(e) => setName(e.target.value)} />
        <TextField label="Cargo / função" name="job_title" icon={User} theme={theme} value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} placeholder="Head de Produto" />
        <TextField label="URL da foto (opcional)" name="avatar_url" icon={User} theme={theme} value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} />
        <TextField label="E-mail" name="email" icon={Mail} theme={theme} value={email} readOnly disabled />

        {error ? (
          <div className="flex items-center gap-2 text-sm" style={{ color: brand.danger }}>
            <AlertCircle size={16} />
            {error}
          </div>
        ) : null}

        <button type="submit" disabled={loading} className="inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white disabled:opacity-70" style={{ backgroundColor: brand.primary }}>
          {loading && <Loader2 size={16} className="animate-spin" />}
          Continuar
        </button>
      </form>
    </>
  );
}
