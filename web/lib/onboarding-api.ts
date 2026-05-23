"use client";

import { isProductgenApiConfigured } from "./productgen-api";

const API_URL = process.env.NEXT_PUBLIC_PRODUCTGEN_API_URL?.replace(/\/$/, "") ?? "";
const WORKSPACE_ID_KEY = "productgen-api-workspace-id-v1";

function requireApi() {
  if (!API_URL) throw new Error("API do ProductDiscovery não configurada.");
}

async function onboardingRequest<T>(
  path: string,
  init: RequestInit = {},
  workspaceId?: string | null,
): Promise<T> {
  requireApi();
  const wsId = workspaceId ?? localStorage.getItem(WORKSPACE_ID_KEY);
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(wsId ? { "X-Workspace-Id": wsId } : {}),
      ...init.headers,
    },
  });

  if (!response.ok) {
    let message = "Erro ao chamar a API.";
    try {
      const body = (await response.json()) as { error?: { message?: string; code?: string } };
      message = body.error?.message ?? message;
      if (response.status === 503 && body.error?.code === "SCHEMA_OUTDATED") {
        message = body.error.message;
      } else if (response.status >= 500 && message === "Erro interno do servidor") {
        message =
          "Erro interno na API. Confira se as migrações foram aplicadas (npm run db:migrate na pasta api).";
      }
    } catch {
      if (response.status >= 500) {
        message =
          "Erro interno na API. Confira os logs do servidor e se rodou npm run db:migrate na pasta api.";
      }
    }
    throw new Error(message);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}

export interface PlanDisplayInfo {
  description: string;
  highlights?: string[];
}

export interface PlanCatalogItem {
  code: string;
  name: string;
  max_products: number | null;
  max_auto_prds_per_month: number | null;
  max_storage_bytes: number | null;
  max_users: number | null;
  api_access: boolean;
  support: string;
  display: PlanDisplayInfo;
}

export interface OnboardingStatus {
  has_workspace: boolean;
  onboarded: boolean;
  plan: string | null;
  workspace_status: string | null;
  email_verified: boolean;
  workspace_id: string | null;
}

export async function signupToProductgenApi(input: {
  full_name: string;
  email: string;
  password: string;
  accept_terms: boolean;
  marketing_opt_in?: boolean;
}) {
  const data = await onboardingRequest<{
    token: string;
    user: { id: string; name: string; email: string };
  }>("/auth/signup", { method: "POST", body: JSON.stringify(input) });
  return data;
}

export async function checkEmailAvailable(email: string) {
  const params = new URLSearchParams({ email });
  return onboardingRequest<{ available: boolean }>(`/auth/email-available?${params}`, { method: "GET" });
}

export async function checkSlugAvailable(slug: string) {
  const params = new URLSearchParams({ slug });
  return onboardingRequest<{ available: boolean }>(`/workspaces/slug-available?${params}`, {
    method: "GET",
  });
}

export async function createWorkspaceInApi(input: {
  name: string;
  slug?: string;
  logo_url?: string | null;
  company_size: string;
  country_code: string;
}) {
  const data = await onboardingRequest<{ workspace: { id: string; slug: string; name: string } }>(
    "/workspaces",
    { method: "POST", body: JSON.stringify(input) },
  );
  localStorage.setItem(WORKSPACE_ID_KEY, data.workspace.id);
  return data.workspace;
}

export async function updateMeInApi(input: {
  name?: string;
  job_title?: string | null;
  avatar_url?: string | null;
}) {
  return onboardingRequest<{ user: { id: string; name: string; email: string; job_title: string | null } }>(
    "/users/me",
    { method: "PATCH", body: JSON.stringify(input) },
  );
}

export async function listPlansFromApi() {
  return onboardingRequest<{ plans: PlanCatalogItem[] }>("/plans", { method: "GET" });
}

export async function setWorkspacePlanInApi(
  workspaceId: string,
  input: {
    plan: string;
    enterprise_lead?: {
      contact_name: string;
      contact_email: string;
      contact_phone?: string;
      message?: string;
    };
  },
) {
  return onboardingRequest<{ workspace: { id: string; plan: string; status: string } }>(
    `/workspaces/${workspaceId}/plan`,
    { method: "PATCH", body: JSON.stringify(input) },
    workspaceId,
  );
}

export async function submitEnterpriseLead(input: {
  workspace_id?: string;
  contact_name: string;
  contact_email: string;
  contact_phone?: string;
  message?: string;
}) {
  return onboardingRequest<{ lead: { id: string } }>("/leads/enterprise", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function completeOnboardingInApi() {
  const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  if (!workspaceId) {
    throw new Error("Workspace não encontrado. Volte ao cadastro do workspace e tente novamente.");
  }
  return onboardingRequest<{ onboarded_at: string }>(
    "/onboarding/complete",
    { method: "POST" },
    workspaceId,
  );
}

export async function getOnboardingStatusFromApi(): Promise<OnboardingStatus | null> {
  if (!isProductgenApiConfigured()) return null;
  return onboardingRequest<OnboardingStatus>("/auth/onboarding-status", { method: "GET" });
}

export function isOnboardingApiConfigured() {
  return Boolean(API_URL);
}
