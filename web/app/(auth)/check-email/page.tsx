"use client";

import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { palette, brand } from "@/lib/theme";

export default function CheckEmailPage() {
  return (
    <AuthShell showFooter={false}>
      {(theme) => (
        <Suspense fallback={null}>
          <CheckEmailContent theme={theme} />
        </Suspense>
      )}
    </AuthShell>
  );
}

function CheckEmailContent({ theme }: { theme: "light" | "dark" }) {
  const p = palette[theme];
  const params = useSearchParams();
  const email = params.get("email") || "seu email";

  return (
    <>
      <div className="mb-10">
        <BrandMark theme={theme} />
      </div>

      <div
        className="mb-6 inline-flex h-14 w-14 items-center justify-center rounded-full"
        style={{ backgroundColor: brand.primarySoft }}
      >
        <CheckCircle2 size={26} color={brand.primary} />
      </div>

      <h1 className="text-3xl font-semibold tracking-tight" style={{ color: p.textPrimary }}>
        Verifique seu email
      </h1>
      <p className="mt-3 text-sm leading-relaxed" style={{ color: p.textSecondary }}>
        Enviamos um link de recuperação para{" "}
        <span className="font-semibold" style={{ color: p.textPrimary }}>
          {email}
        </span>
        . O link expira em 30 minutos.
      </p>

      <button
        type="button"
        className="mt-8 inline-flex w-full items-center justify-center rounded-xl border py-3 text-sm font-semibold transition-colors"
        style={{
          borderColor: p.border,
          backgroundColor: p.inputBg,
          color: p.textPrimary,
        }}
      >
        Reenviar email
      </button>

      <Link
        href="/login"
        className="mt-5 inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: brand.primary }}
      >
        <ArrowLeft size={14} /> Voltar para login
      </Link>

      <p className="mt-10 text-xs" style={{ color: p.textSecondary }}>
        Não recebeu? Verifique sua pasta de spam ou{" "}
        <a href="#" className="font-semibold" style={{ color: brand.primary }}>
          fale com suporte
        </a>
        .
      </p>
    </>
  );
}
