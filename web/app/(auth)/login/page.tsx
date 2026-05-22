"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Mail, Lock, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { SocialButtons } from "@/components/auth/social-buttons";
import { TextField } from "@/components/auth/text-field";
import { palette, brand } from "@/lib/theme";
import { isProductgenApiConfigured, loginToProductgenApi } from "@/lib/productgen-api";

const schema = z.object({
  email: z.string().trim().email().max(255),
  password: z.string().min(12).max(128),
});

export default function LoginPage() {
  return <AuthShell>{(theme) => <LoginForm theme={theme} p={palette[theme]} />}</AuthShell>;
}

function LoginForm({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({ email, password });
    if (!parsed.success) {
      setError("Informe email e senha com no mínimo 12 caracteres.");
      return;
    }

    setLoading(true);
    try {
      if (isProductgenApiConfigured()) {
        await loginToProductgenApi(parsed.data);
      }
      const next = new URLSearchParams(window.location.search).get("next") || "/dashboard";
      router.push(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível entrar.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="mb-10">
        <BrandMark theme={theme} />
      </div>

      <h1 className="text-4xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Entrar
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Acesse sua plataforma de Product Intelligence pelo workspace da sua empresa.
      </p>

      <div className="mt-8">
        <SocialButtons theme={theme} />
      </div>

      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1" style={{ backgroundColor: p.border }} />
        <span className="text-xs" style={{ color: p.textSecondary }}>
          ou continue com email
        </span>
        <div className="h-px flex-1" style={{ backgroundColor: p.border }} />
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        <TextField
          label="Email"
          name="email"
          type="email"
          icon={Mail}
          theme={theme}
          placeholder="voce@empresa.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={Boolean(error)}
          maxLength={255}
        />

        <TextField
          label="Senha"
          name="password"
          type="password"
          icon={Lock}
          theme={theme}
          placeholder="Sua senha"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={Boolean(error)}
          maxLength={128}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm" style={{ color: brand.danger }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-80"
          style={{ backgroundColor: brand.primary }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Entrar
        </button>
      </form>

      <p className="mt-8 text-center text-sm" style={{ color: p.textSecondary }}>
        Ainda não tem conta?{" "}
        <a href="/signup" className="font-medium underline" style={{ color: brand.primary }}>
          Criar minha conta
        </a>
      </p>
    </>
  );
}
