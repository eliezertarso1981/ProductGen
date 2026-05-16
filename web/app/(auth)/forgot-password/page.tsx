"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Loader2, ArrowLeft, AlertCircle } from "lucide-react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { TextField } from "@/components/auth/text-field";
import { palette, brand } from "@/lib/theme";

const schema = z.object({ email: z.string().trim().email().max(255) });

export default function ForgotPasswordPage() {
  return <AuthShell>{(theme) => <ForgotForm theme={theme} />}</AuthShell>;
}

function ForgotForm({ theme }: { theme: "light" | "dark" }) {
  const p = palette[theme];
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(false);
    const r = schema.safeParse({ email });
    if (!r.success) {
      setError(true);
      return;
    }
    setLoading(true);
    setTimeout(() => router.push(`/check-email?email=${encodeURIComponent(email)}`), 500);
  };

  return (
    <>
      <div className="mb-10">
        <BrandMark theme={theme} />
      </div>

      <h1 className="text-4xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Recuperar senha
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Informe seu email e enviaremos um link para redefinir a senha.
      </p>

      <form onSubmit={onSubmit} noValidate className="mt-8 space-y-4">
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
          error={error}
          maxLength={255}
        />

        {error && (
          <div className="flex items-center gap-2 text-sm" style={{ color: brand.danger }}>
            <AlertCircle size={16} />
            Informe um email válido.
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 inline-flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-80"
          style={{ backgroundColor: brand.primary }}
        >
          {loading && <Loader2 size={16} className="animate-spin" />}
          Enviar link de recuperação
        </button>
      </form>

      <Link
        href="/login"
        className="mt-6 inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: brand.primary }}
      >
        <ArrowLeft size={14} /> Voltar para login
      </Link>
    </>
  );
}
