"use client";

import { useCallback, useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, Loader2, AlertCircle } from "lucide-react";
import { z } from "zod";
import { AuthShell } from "@/components/auth/auth-shell";
import { BrandMark } from "@/components/auth/brand-mark";
import { TextField } from "@/components/auth/text-field";
import { palette, brand } from "@/lib/theme";
import { checkEmailAvailable, isOnboardingApiConfigured, signupToProductgenApi } from "@/lib/onboarding-api";
import { bootstrapProductgenAuth } from "@/lib/productgen-api";

const schema = z
  .object({
    full_name: z
      .string()
      .trim()
      .min(2, "Informe seu nome completo (mínimo 2 caracteres).")
      .max(100, "Nome muito longo (máximo 100 caracteres)."),
    email: z
      .string()
      .trim()
      .min(1, "Informe seu e-mail.")
      .email("Informe um e-mail válido.")
      .max(255, "E-mail muito longo."),
    password: z
      .string()
      .min(8, "Senha deve ter no mínimo 8 caracteres.")
      .regex(/[A-Z]/, "Senha deve ter pelo menos 1 letra maiúscula.")
      .regex(/\d/, "Senha deve ter pelo menos 1 número.")
      .regex(/[^A-Za-z0-9]/, "Senha deve ter pelo menos 1 caractere especial."),
    confirm_password: z.string().min(1, "Confirme sua senha."),
    accept_terms: z.boolean(),
    marketing_opt_in: z.boolean().optional(),
  })
  .refine((d) => d.password === d.confirm_password, {
    message: "As senhas não conferem.",
    path: ["confirm_password"],
  })
  .refine((d) => d.accept_terms, {
    message: "Aceite os Termos de Uso e a Política de Privacidade.",
    path: ["accept_terms"],
  });

function formatSignupValidationError(error: z.ZodError) {
  const issue = error.issues[0];
  if (!issue) return "Revise os campos destacados e tente novamente.";

  const fieldLabels: Record<string, string> = {
    full_name: "Nome completo",
    email: "E-mail",
    password: "Senha",
    confirm_password: "Confirmar senha",
    accept_terms: "Termos",
  };

  const field = issue.path[0];
  const label = typeof field === "string" ? fieldLabels[field] : undefined;
  const message = issue.message?.trim();

  if (message && message !== "Invalid input" && message !== "Required") {
    return label ? `${label}: ${message}` : message;
  }

  if (issue.code === "too_small" && field === "full_name") {
    return "Nome completo: informe pelo menos 2 caracteres.";
  }
  if (issue.code === "invalid_string" && field === "email") {
    return "E-mail: informe um endereço válido.";
  }
  if (field === "password") {
    return "Senha: use 8+ caracteres, 1 maiúscula, 1 número e 1 caractere especial.";
  }
  if (field === "confirm_password") {
    return "Confirmar senha: repita a mesma senha do campo anterior.";
  }
  if (field === "accept_terms") {
    return "Aceite os Termos de Uso e a Política de Privacidade.";
  }

  return label ? `${label}: valor inválido.` : "Revise os campos e tente novamente.";
}

function passwordStrength(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/\d/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export default function SignupPage() {
  return <AuthShell>{(theme) => <SignupForm theme={theme} p={palette[theme]} />}</AuthShell>;
}

function SignupForm({
  theme,
  p,
}: {
  theme: "light" | "dark";
  p: (typeof palette)["light" | "dark"];
}) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);

  const checkEmail = useCallback(async (value: string) => {
    if (!value.includes("@") || !isOnboardingApiConfigured()) return;
    try {
      const { available } = await checkEmailAvailable(value);
      setEmailAvailable(available);
    } catch {
      setEmailAvailable(null);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (email) void checkEmail(email);
    }, 500);
    return () => clearTimeout(timer);
  }, [email, checkEmail]);

  const strength = passwordStrength(password);
  const strengthLabel = ["Fraca", "Razoável", "Boa", "Forte"][Math.max(0, strength - 1)] ?? "";

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(undefined);
    const parsed = schema.safeParse({
      full_name: fullName,
      email,
      password,
      confirm_password: confirmPassword,
      accept_terms: acceptTerms,
      marketing_opt_in: marketing,
    });
    if (!parsed.success) {
      setError(formatSignupValidationError(parsed.error));
      return;
    }
    if (emailAvailable === false) {
      setError("Este e-mail já está cadastrado.");
      return;
    }

    setLoading(true);
    try {
      if (isOnboardingApiConfigured()) {
        await signupToProductgenApi({
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          password: parsed.data.password,
          accept_terms: true,
          marketing_opt_in: marketing,
        });
        await bootstrapProductgenAuth();
      }
      router.push("/signup/workspace");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível criar a conta.");
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
        Criar minha conta
      </h1>
      <p className="mt-2 text-sm" style={{ color: p.textSecondary }}>
        Comece gratuitamente e configure seu workspace em poucos minutos.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-4">
        <TextField
          label="Nome completo"
          name="full_name"
          icon={User}
          theme={theme}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          autoComplete="name"
        />
        <TextField
          label="E-mail corporativo"
          name="email"
          type="email"
          icon={Mail}
          theme={theme}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          trailing={
            emailAvailable === false ? (
              <span className="pr-3 text-xs" style={{ color: brand.danger }}>
                Em uso
              </span>
            ) : emailAvailable === true ? (
              <span className="pr-3 text-xs" style={{ color: brand.primary }}>
                Disponível
              </span>
            ) : null
          }
        />
        <TextField
          label="Senha"
          name="password"
          type="password"
          icon={Lock}
          theme={theme}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
        />
        {password.length > 0 && (
          <p className="text-xs" style={{ color: p.textSecondary }}>
            Força: {strengthLabel} ({strength}/4)
          </p>
        )}
        <TextField
          label="Confirmar senha"
          name="confirm_password"
          type="password"
          icon={Lock}
          theme={theme}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          autoComplete="new-password"
        />

        <label className="flex items-start gap-2 text-sm" style={{ color: p.textSecondary }}>
          <input
            type="checkbox"
            checked={acceptTerms}
            onChange={(e) => setAcceptTerms(e.target.checked)}
            className="mt-1"
          />
          Li e aceito os Termos de Uso e a Política de Privacidade
        </label>
        <label className="flex items-start gap-2 text-sm" style={{ color: p.textSecondary }}>
          <input
            type="checkbox"
            checked={marketing}
            onChange={(e) => setMarketing(e.target.checked)}
            className="mt-1"
          />
          Quero receber novidades por e-mail
        </label>

        {error && (
          <div className="flex items-center gap-2 text-sm" style={{ color: brand.danger }}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

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

      <p className="mt-8 text-center text-sm" style={{ color: p.textSecondary }}>
        Já tenho conta{" "}
        <Link href="/login" className="font-medium underline" style={{ color: brand.primary }}>
          Entrar
        </Link>
      </p>
    </>
  );
}
