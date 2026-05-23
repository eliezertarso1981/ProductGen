"use client";

const API_URL = process.env.NEXT_PUBLIC_PRODUCTGEN_API_URL?.replace(/\/$/, "") ?? "";

export const WORKSPACE_ID_KEY = "productgen-api-workspace-id-v1";
const USER_KEY = "productgen-api-user-v1";

interface AuthSession {
  workspaceId: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    email: string;
  };
  workspace: {
    id: string;
    slug: string;
    name: string;
    role: string;
  } | null;
  workspaces: AuthWorkspace[];
}

export interface AuthWorkspace {
  id: string;
  slug: string;
  name: string;
  role: string;
  onboarded_at?: string | null;
  plan?: string;
  permissions?: string[];
  products?: Array<{
    id: string;
    slug: string | null;
    name: string;
    role: string;
    permissions?: string[];
  }>;
}

export interface AuthBootstrap {
  user: {
    id: string;
    name: string;
    email: string;
    email_verified_at?: string | null;
    avatar_url?: string | null;
  };
  workspaces: AuthWorkspace[];
  current_workspace_id: string | null;
  current_product_id: string | null;
}

export interface ApiProduct {
  id: string;
  workspace_id: string;
  name: string;
  vision: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export type WorkspaceRole = "owner" | "admin" | "member" | "viewer" | "guest";

export type WorkspaceJobFunction = "CEO" | "CPO" | "GPM" | "PM" | "PD" | "UX" | "PO";

export interface ApiWorkspaceMember {
  workspace_id: string;
  user_id: string;
  name: string;
  email: string;
  role: WorkspaceRole;
  job_function: WorkspaceJobFunction | null;
  joined_at: string;
  last_accessed_at: string | null;
  onboarded_at: string | null;
  removed_at: string | null;
  updated_at: string;
}

export interface ApiWorkspaceTeam {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  member_ids: string[];
  product_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface WorkspaceTeamPayload {
  name?: string;
  description?: string | null;
  color?: string | null;
  product_ids?: string[];
  member_ids?: string[];
}

export interface ProductPayload {
  name?: string;
  vision?: string | null;
  metadata?: Record<string, unknown>;
}

export type ApiPainStatus =
  | "identified"
  | "investigating"
  | "prioritized"
  | "addressed"
  | "resolved"
  | "discarded"
  | "merged"
  | "split";

export interface ApiPain {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  parent_pain_id: string | null;
  root_pain_id: string | null;
  title: string;
  description: string | null;
  status: ApiPainStatus;
  severity: number | null;
  reach_estimate: number | null;
  priority_score: number | null;
  scoring_method: string | null;
  scoring_payload: unknown;
  discard_reason: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PainPayload {
  title?: string;
  product_id?: string;
  description?: string | null;
  severity?: number | null;
  reach_estimate?: number | null;
  owner_id?: string | null;
}

export interface ApiPersona {
  id: string;
  workspace_id: string;
  code: string;
  name: string;
  description: string | null;
  segment_size_estimate: number | null;
  metadata: Record<string, unknown>;
  pain_ids: string[];
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface PersonaPayload {
  name?: string;
  description?: string | null;
  segment_size_estimate?: number | null;
  metadata?: Record<string, unknown>;
}

export type ApiHypothesisStatus =
  | "formulated"
  | "validating"
  | "validated"
  | "invalidated"
  | "in_execution"
  | "delivered"
  | "deprioritized"
  | "discarded";

export interface ApiHypothesis {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  title: string;
  if_clause: string;
  then_clause: string;
  because_clause: string;
  assumptions: unknown[];
  status: ApiHypothesisStatus;
  confidence: number | null;
  outcome_summary: string | null;
  cloned_from_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LinkedHypothesis {
  id: string;
  code?: string;
  title: string;
  status: ApiHypothesisStatus;
  linked_at: string;
}

export interface LinkedStrategicPillar {
  id: string;
  code?: string;
  name: string;
  color: string | null;
  linked_at: string;
}

export interface LinkedObjective {
  id: string;
  code?: string;
  title: string;
  status: ApiObjectiveStatus;
  linked_at: string;
}

export interface HypothesisPayload {
  title?: string;
  if_clause?: string;
  then_clause?: string;
  because_clause?: string;
  assumptions?: unknown[];
  confidence?: number | null;
  outcome_summary?: string | null;
  owner_id?: string | null;
}

export type ApiExperimentMethod =
  | "interview"
  | "prototype"
  | "ab_test"
  | "fake_door"
  | "survey"
  | "beta"
  | "concierge"
  | "wizard_of_oz"
  | "other";

export type ApiExperimentStatus = "planned" | "running" | "completed" | "analyzed";
export type ApiExperimentResult = "validated" | "invalidated" | "inconclusive";

export interface ApiExperiment {
  id: string;
  workspace_id: string;
  product_id: string;
  hypothesis_id: string;
  code: string;
  title: string;
  method: ApiExperimentMethod;
  success_criteria: string;
  sample_target: number | null;
  sample_actual: number | null;
  status: ApiExperimentStatus;
  result: ApiExperimentResult | null;
  learnings: string | null;
  started_at: string | null;
  ended_at: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ExperimentPayload {
  title?: string;
  method?: ApiExperimentMethod;
  success_criteria?: string;
  sample_target?: number | null;
  sample_actual?: number | null;
  learnings?: string | null;
  owner_id?: string | null;
}

export type ApiEvidenceStatus = "new" | "triaged" | "linked" | "archived";

export type ApiEvidenceSource =
  | "interview"
  | "support_ticket"
  | "nps"
  | "sales_call"
  | "usage_data"
  | "survey"
  | "review"
  | "internal"
  | "other";

export interface ApiEvidence {
  id: string;
  workspace_id: string;
  product_id: string | null;
  code: string;
  title: string;
  content: string;
  source: ApiEvidenceSource;
  source_url: string | null;
  customer_identifier: string | null;
  status: ApiEvidenceStatus;
  collected_at: string;
  created_by: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ApiInsight {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  title: string;
  description: string;
  confidence_score: number | string | null;
  impact_score: number | string | null;
  frequency_score: number | string | null;
  evidence_count: number;
  owner_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface InsightPayload {
  title?: string;
  description?: string;
  confidence_score?: number | null;
  impact_score?: number | null;
  frequency_score?: number | null;
  owner_id?: string | null;
  metadata?: Record<string, unknown>;
}

export interface LinkedEvidence {
  id: string;
  code?: string;
  title: string;
  source: ApiEvidenceSource;
  status: ApiEvidenceStatus;
  collected_at: string;
  linked_at: string;
}

export interface EvidencePayload {
  title?: string;
  content?: string;
  source?: ApiEvidenceSource;
  source_url?: string | null;
  customer_identifier?: string | null;
  collected_at?: string;
  metadata?: Record<string, unknown>;
}

export type ApiRoadmapType = "initiative" | "epic" | "feature";

export type ApiRoadmapStatus =
  | "proposed"
  | "planned"
  | "in_development"
  | "in_validation"
  | "delivered"
  | "measuring_outcome"
  | "cancelled"
  | "rolled_back";

export interface ApiRoadmapItem {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  parent_id: string | null;
  path: string | null;
  type: ApiRoadmapType;
  title: string;
  description: string | null;
  status: ApiRoadmapStatus;
  planned_start: string | null;
  planned_end: string | null;
  actual_start: string | null;
  actual_end: string | null;
  effort_estimate: string | null;
  priority_score: number | null;
  priority_breakdown: Record<string, unknown> | null;
  external_system: string | null;
  external_id: string | null;
  external_url: string | null;
  external_status: string | null;
  external_synced_at: string | null;
  pillar_id: string | null;
  cancel_reason: string | null;
  rollback_reason: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface LinkedRoadmapItem {
  id: string;
  title: string;
  type: ApiRoadmapType;
  status: ApiRoadmapStatus;
  linked_at: string;
}

export interface RoadmapPayload {
  parent_id?: string;
  type?: ApiRoadmapType;
  title?: string;
  description?: string | null;
  planned_start?: string | null;
  planned_end?: string | null;
  actual_start?: string | null;
  actual_end?: string | null;
  effort_estimate?: string | null;
  priority_score?: number | null;
  pillar_id?: string | null;
  owner_id?: string | null;
  external_system?: string | null;
  external_id?: string | null;
  external_url?: string | null;
  external_status?: string | null;
}

export type ApiOutcomeStatus =
  | "hypothesized"
  | "measuring"
  | "confirmed"
  | "not_confirmed"
  | "inconclusive";

export interface ApiOutcome {
  id: string;
  workspace_id: string;
  roadmap_item_id: string;
  code: string;
  key_result_id: string | null;
  pain_id: string | null;
  hypothesized_impact: string;
  measurement_window_days: number;
  status: ApiOutcomeStatus;
  measurement_started_at: string | null;
  measurement_ended_at: string | null;
  baseline_value: number | string | null;
  final_value: number | string | null;
  conclusion: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface OutcomePayload {
  hypothesized_impact?: string;
  key_result_id?: string | null;
  pain_id?: string | null;
  measurement_window_days?: number;
  baseline_value?: number | null;
  final_value?: number | null;
  conclusion?: string | null;
}

export type ApiObjectiveStatus = "draft" | "active" | "achieved" | "missed" | "cancelled";

export interface ApiStrategicPillar {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  name: string;
  description: string | null;
  color: string | null;
  position: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface StrategicPillarPayload {
  name?: string;
  description?: string | null;
  color?: string | null;
  position?: number;
}

export interface ApiObjective {
  id: string;
  workspace_id: string;
  product_id: string;
  code: string;
  title: string;
  description: string | null;
  status: ApiObjectiveStatus;
  horizon_start: string | null;
  horizon_end: string | null;
  pillar_id: string | null;
  owner_id: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface ObjectivePayload {
  title?: string;
  description?: string | null;
  horizon_start?: string | null;
  horizon_end?: string | null;
  pillar_id?: string | null;
  owner_id?: string | null;
}

export interface ApiKeyResult {
  id: string;
  workspace_id: string;
  objective_id: string;
  code: string;
  title: string;
  metric_type: string | null;
  baseline: number | string | null;
  target: number | string | null;
  current_value: number | string | null;
  unit: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface KeyResultPayload {
  title?: string;
  metric_type?: string | null;
  baseline?: number | null;
  target?: number | null;
  current_value?: number | null;
  unit?: string | null;
}

export interface ApiAnalyticsStatusCount {
  status: string;
  count: number;
}

export const DASHBOARD_PERIOD_OPTIONS = [
  { value: "today", label: "Hoje" },
  { value: "week", label: "Esta semana" },
  { value: "month", label: "Este mês" },
  { value: "quarter", label: "Este trimestre" },
  { value: "year", label: "Este ano" },
] as const;

export type ApiDashboardPeriod = (typeof DASHBOARD_PERIOD_OPTIONS)[number]["value"];

export interface ApiDashboardAnalytics {
  product_id: string | null;
  generated_at: string;
  totals: {
    evidences: number;
    pains: number;
    hypotheses: number;
    experiments: number;
    roadmap_items: number;
    insights: number;
    outcomes: number;
    objectives: number;
    key_results: number;
  };
  evidences_by_status: ApiAnalyticsStatusCount[];
  pains_by_status: ApiAnalyticsStatusCount[];
  hypotheses_by_status: ApiAnalyticsStatusCount[];
  experiments_by_status: ApiAnalyticsStatusCount[];
  experiment_results: ApiAnalyticsStatusCount[];
  roadmap_by_status: ApiAnalyticsStatusCount[];
  outcomes_by_status: ApiAnalyticsStatusCount[];
  objectives_by_status: ApiAnalyticsStatusCount[];
  discovery_funnel: Array<{
    key: string;
    label: string;
    count: number;
    conversion_rate: number | null;
  }>;
  health: {
    hypothesis_invalidation_rate: number | null;
    avg_investigating_pain_age_days: number | null;
    roadmap_strategic_coverage_rate: number | null;
  };
  upcoming_measurements: Array<{
    outcome_code: string;
    roadmap_code: string;
    roadmap_title: string;
    hypothesized_impact: string;
    status: ApiOutcomeStatus;
    due_at: string;
  }>;
  recent_activity: Array<{
    entity_type: string;
    event_type: string;
    code: string | null;
    title: string | null;
    actor_name: string | null;
    to_status: string | null;
    occurred_at: string;
  }>;
}

export function isProductgenApiConfigured() {
  return Boolean(API_URL);
}

export function hasStoredAuthSession() {
  return Boolean(localStorage.getItem(WORKSPACE_ID_KEY));
}

export function clearAuthSession() {
  localStorage.removeItem(WORKSPACE_ID_KEY);
  localStorage.removeItem(USER_KEY);
}

export async function logoutFromProductgenApi() {
  clearAuthSession();
  if (!isProductgenApiConfigured()) return;

  await fetch(`${API_URL}/auth/logout`, {
    method: "POST",
    credentials: "include",
  }).catch(() => undefined);
}

export async function loginToProductgenApi(input: {
  email: string;
  password: string;
}): Promise<LoginResponse> {
  if (!isProductgenApiConfigured()) {
    throw new Error("API do ProductDiscovery não configurada.");
  }

  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: input.email,
      password: input.password,
    }),
  });

  if (!response.ok) {
    let message = "Não foi possível autenticar na API do ProductDiscovery.";
    try {
      const body = (await response.json()) as { error?: { message?: string } };
      message = body.error?.message ?? message;
    } catch {
      // Mantem a mensagem padrão se a resposta não for JSON.
    }
    throw new Error(message);
  }

  const data = (await response.json()) as LoginResponse;
  if (data.workspace) {
    localStorage.setItem(WORKSPACE_ID_KEY, data.workspace.id);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));

  return data;
}

export async function bootstrapProductgenAuth(): Promise<AuthBootstrap> {
  if (!isProductgenApiConfigured()) {
    throw new Error("API do ProductDiscovery não configurada.");
  }

  const storedWorkspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  const response = await fetch(`${API_URL}/auth/me`, {
    method: "GET",
    credentials: "include",
    headers: storedWorkspaceId ? { "X-Workspace-Id": storedWorkspaceId } : undefined,
  });

  if (response.status === 401) {
    const refreshed = await refreshSession();
    if (refreshed) return bootstrapProductgenAuth();
  }

  if (!response.ok) {
    clearAuthSession();
    throw new Error("Sessão não encontrada. Faça login novamente.");
  }

  const data = (await response.json()) as AuthBootstrap;
  const resolvedWorkspaceId =
    data.current_workspace_id ?? data.workspaces[0]?.id ?? storedWorkspaceId ?? null;
  if (resolvedWorkspaceId) {
    localStorage.setItem(WORKSPACE_ID_KEY, resolvedWorkspaceId);
  } else {
    localStorage.removeItem(WORKSPACE_ID_KEY);
  }
  localStorage.setItem(USER_KEY, JSON.stringify(data.user));
  return data;
}

async function getSession(): Promise<AuthSession> {
  if (!isProductgenApiConfigured()) {
    throw new Error("API do ProductDiscovery não configurada.");
  }

  const workspaceId = localStorage.getItem(WORKSPACE_ID_KEY);
  if (workspaceId) {
    return { workspaceId };
  }

  const bootstrap = await bootstrapProductgenAuth();
  if (!bootstrap.current_workspace_id) {
    throw new Error("Workspace não configurado. Conclua o cadastro do workspace.");
  }
  localStorage.setItem(WORKSPACE_ID_KEY, bootstrap.current_workspace_id);
  return { workspaceId: bootstrap.current_workspace_id };
}

async function apiRequest<T>(path: string, init: RequestInit = {}, retry = true): Promise<T> {
  const session = await getSession();
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      "X-Workspace-Id": session.workspaceId,
      ...init.headers,
    },
  });

  if (response.status === 401 && retry) {
    const refreshed = await refreshSession();
    if (refreshed) return apiRequest<T>(path, init, false);
    clearAuthSession();
    throw new Error("Sessão expirada. Faça login novamente.");
  }

  if (!response.ok) {
    let message = "Erro ao chamar a API do ProductDiscovery.";
    try {
      const body = (await response.json()) as { error?: { message?: string; code?: string } };
      message = body.error?.message ?? message;
      if (response.status === 503 && body.error?.code === "SCHEMA_OUTDATED") {
        message = body.error.message ?? message;
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
  return response.json() as Promise<T>;
}

async function refreshSession() {
  if (!isProductgenApiConfigured()) return false;

  const response = await fetch(`${API_URL}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  });

  return response.ok;
}

export async function listProductsFromApi() {
  const session = await getSession();
  return apiRequest<ApiProduct[]>(`/workspaces/${session.workspaceId}/products`);
}

export async function listWorkspaceMembersFromApi() {
  const session = await getSession();
  return apiRequest<ApiWorkspaceMember[]>(`/workspaces/${session.workspaceId}/members`);
}

export async function createWorkspaceMemberInApi(input: {
  user_id: string;
  role: WorkspaceRole;
  job_function?: WorkspaceJobFunction | null;
}) {
  const session = await getSession();
  return apiRequest<ApiWorkspaceMember>(`/workspaces/${session.workspaceId}/members`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateWorkspaceMemberInApi(
  userId: string,
  patch: { role?: WorkspaceRole; job_function?: WorkspaceJobFunction | null },
) {
  const session = await getSession();
  return apiRequest<ApiWorkspaceMember>(`/workspaces/${session.workspaceId}/members/${userId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
}

export async function removeWorkspaceMemberFromApi(userId: string) {
  const session = await getSession();
  return apiRequest<void>(`/workspaces/${session.workspaceId}/members/${userId}`, {
    method: "DELETE",
  });
}

export async function listWorkspaceTeamsFromApi() {
  const session = await getSession();
  return apiRequest<ApiWorkspaceTeam[]>(`/workspaces/${session.workspaceId}/teams`);
}

export async function createWorkspaceTeamInApi(
  payload: Required<Pick<WorkspaceTeamPayload, "name">> & WorkspaceTeamPayload,
) {
  const session = await getSession();
  return apiRequest<ApiWorkspaceTeam>(`/workspaces/${session.workspaceId}/teams`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateWorkspaceTeamInApi(id: string, payload: WorkspaceTeamPayload) {
  return apiRequest<ApiWorkspaceTeam>(`/teams/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteWorkspaceTeamInApi(id: string) {
  return apiRequest<void>(`/teams/${id}`, { method: "DELETE" });
}

export async function addWorkspaceTeamMemberInApi(teamId: string, userId: string) {
  return apiRequest<ApiWorkspaceTeam>(`/teams/${teamId}/members/${userId}`, { method: "POST" });
}

export async function removeWorkspaceTeamMemberInApi(teamId: string, userId: string) {
  return apiRequest<ApiWorkspaceTeam>(`/teams/${teamId}/members/${userId}`, { method: "DELETE" });
}

export async function addWorkspaceTeamProductInApi(teamId: string, productId: string) {
  return apiRequest<ApiWorkspaceTeam>(`/teams/${teamId}/products/${productId}`, { method: "POST" });
}

export async function removeWorkspaceTeamProductInApi(teamId: string, productId: string) {
  return apiRequest<ApiWorkspaceTeam>(`/teams/${teamId}/products/${productId}`, { method: "DELETE" });
}

export async function createProductInApi(payload: Required<Pick<ProductPayload, "name">> & ProductPayload) {
  const session = await getSession();
  return apiRequest<ApiProduct>(`/workspaces/${session.workspaceId}/products`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateProductInApi(id: string, payload: ProductPayload) {
  return apiRequest<ApiProduct>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteProductInApi(id: string) {
  return apiRequest<void>(`/products/${id}`, { method: "DELETE" });
}

export async function listPainsFromApi(productId: string) {
  return apiRequest<ApiPain[]>(`/products/${productId}/pains`);
}

export async function createPainInApi(productId: string, payload: Required<Pick<PainPayload, "title">> & PainPayload) {
  return apiRequest<ApiPain>(`/products/${productId}/pains`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPainFromApi(id: string) {
  return apiRequest<ApiPain>(`/pains/${id}`);
}

export async function updatePainInApi(id: string, payload: PainPayload) {
  return apiRequest<ApiPain>(`/pains/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionPainStatusInApi(
  id: string,
  status: ApiPainStatus,
  discardReason?: string,
) {
  return apiRequest<ApiPain>(`/pains/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(discardReason ? { discard_reason: discardReason } : {}),
    }),
  });
}

export async function deletePainInApi(id: string) {
  return apiRequest<void>(`/pains/${id}`, { method: "DELETE" });
}

export async function listPersonasFromApi() {
  const session = await getSession();
  return apiRequest<ApiPersona[]>(`/workspaces/${session.workspaceId}/personas`);
}

export async function createPersonaInApi(
  payload: Required<Pick<PersonaPayload, "name">> & PersonaPayload,
) {
  const session = await getSession();
  return apiRequest<ApiPersona>(`/workspaces/${session.workspaceId}/personas`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getPersonaFromApi(id: string) {
  return apiRequest<ApiPersona>(`/personas/${id}`);
}

export async function updatePersonaInApi(id: string, payload: PersonaPayload) {
  return apiRequest<ApiPersona>(`/personas/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deletePersonaInApi(id: string) {
  return apiRequest<void>(`/personas/${id}`, { method: "DELETE" });
}

export async function listPainPersonasFromApi(painId: string) {
  return apiRequest<ApiPersona[]>(`/pains/${painId}/personas`);
}

export async function linkPainPersonaInApi(painId: string, personaId: string) {
  return apiRequest<{ pain_id: string; persona_id: string }>(
    `/pains/${painId}/personas/${personaId}`,
    { method: "POST" },
  );
}

export async function unlinkPainPersonaInApi(painId: string, personaId: string) {
  return apiRequest<void>(`/pains/${painId}/personas/${personaId}`, {
    method: "DELETE",
  });
}

export async function listHypothesesFromApi(productId: string) {
  return apiRequest<ApiHypothesis[]>(`/products/${productId}/hypotheses`);
}

export async function createHypothesisInApi(
  productId: string,
  payload: Required<Pick<HypothesisPayload, "title" | "if_clause" | "then_clause" | "because_clause">> & HypothesisPayload,
) {
  return apiRequest<ApiHypothesis>(`/products/${productId}/hypotheses`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getHypothesisFromApi(id: string) {
  return apiRequest<ApiHypothesis>(`/hypotheses/${id}`);
}

export async function updateHypothesisInApi(id: string, payload: HypothesisPayload) {
  return apiRequest<ApiHypothesis>(`/hypotheses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionHypothesisStatusInApi(
  id: string,
  status: ApiHypothesisStatus,
  outcomeSummary?: string,
) {
  return apiRequest<ApiHypothesis>(`/hypotheses/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(outcomeSummary ? { outcome_summary: outcomeSummary } : {}),
    }),
  });
}

export async function deleteHypothesisInApi(id: string) {
  return apiRequest<void>(`/hypotheses/${id}`, { method: "DELETE" });
}

export async function listPainHypothesesFromApi(painId: string) {
  return apiRequest<LinkedHypothesis[]>(`/pains/${painId}/hypotheses`);
}

export async function linkPainHypothesisInApi(painId: string, hypothesisId: string) {
  return apiRequest<{ pain_id: string; hypothesis_id: string }>(
    `/pains/${painId}/hypotheses/${hypothesisId}`,
    { method: "POST" },
  );
}

export async function unlinkPainHypothesisInApi(painId: string, hypothesisId: string) {
  return apiRequest<void>(`/pains/${painId}/hypotheses/${hypothesisId}`, {
    method: "DELETE",
  });
}

export async function listPainStrategicPillarsFromApi(painId: string) {
  return apiRequest<LinkedStrategicPillar[]>(`/pains/${painId}/strategic-pillars`);
}

export async function linkPainStrategicPillarInApi(painId: string, pillarId: string) {
  return apiRequest<{ pain_id: string; pillar_id: string }>(
    `/pains/${painId}/strategic-pillars/${pillarId}`,
    { method: "POST" },
  );
}

export async function unlinkPainStrategicPillarInApi(painId: string, pillarId: string) {
  return apiRequest<void>(`/pains/${painId}/strategic-pillars/${pillarId}`, {
    method: "DELETE",
  });
}

export async function listPainObjectivesFromApi(painId: string) {
  return apiRequest<LinkedObjective[]>(`/pains/${painId}/objectives`);
}

export async function linkPainObjectiveInApi(painId: string, objectiveId: string) {
  return apiRequest<{ pain_id: string; objective_id: string }>(
    `/pains/${painId}/objectives/${objectiveId}`,
    { method: "POST" },
  );
}

export async function unlinkPainObjectiveInApi(painId: string, objectiveId: string) {
  return apiRequest<void>(`/pains/${painId}/objectives/${objectiveId}`, {
    method: "DELETE",
  });
}

export async function listExperimentsFromApi(hypothesisId: string) {
  return apiRequest<ApiExperiment[]>(`/hypotheses/${hypothesisId}/experiments`);
}

export async function createExperimentInApi(
  hypothesisId: string,
  payload: Required<Pick<ExperimentPayload, "title" | "method" | "success_criteria">> & ExperimentPayload,
) {
  return apiRequest<ApiExperiment>(`/hypotheses/${hypothesisId}/experiments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getExperimentFromApi(id: string) {
  return apiRequest<ApiExperiment>(`/experiments/${id}`);
}

export async function updateExperimentInApi(id: string, payload: ExperimentPayload) {
  return apiRequest<ApiExperiment>(`/experiments/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionExperimentStatusInApi(
  id: string,
  status: ApiExperimentStatus,
  result?: ApiExperimentResult,
  learnings?: string,
) {
  return apiRequest<ApiExperiment>(`/experiments/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(result ? { result } : {}),
      ...(learnings ? { learnings } : {}),
    }),
  });
}

export async function deleteExperimentInApi(id: string) {
  return apiRequest<void>(`/experiments/${id}`, { method: "DELETE" });
}

export async function listEvidencesFromApi(productId: string) {
  return apiRequest<ApiEvidence[]>(`/products/${productId}/evidences`);
}

export async function createEvidenceInApi(
  productId: string,
  payload: Required<Pick<EvidencePayload, "title" | "content" | "source" | "collected_at">> & EvidencePayload,
) {
  return apiRequest<ApiEvidence>(`/products/${productId}/evidences`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getEvidenceFromApi(id: string) {
  return apiRequest<ApiEvidence>(`/evidences/${id}`);
}

export async function updateEvidenceInApi(id: string, payload: EvidencePayload) {
  return apiRequest<ApiEvidence>(`/evidences/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionEvidenceStatusInApi(id: string, status: ApiEvidenceStatus) {
  return apiRequest<ApiEvidence>(`/evidences/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteEvidenceInApi(id: string) {
  return apiRequest<void>(`/evidences/${id}`, { method: "DELETE" });
}

export async function listInsightsFromApi(productId: string) {
  return apiRequest<ApiInsight[]>(`/products/${productId}/insights`);
}

export async function createInsightInApi(
  productId: string,
  payload: Required<Pick<InsightPayload, "title" | "description">> & InsightPayload,
) {
  return apiRequest<ApiInsight>(`/products/${productId}/insights`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getInsightFromApi(id: string) {
  return apiRequest<ApiInsight>(`/insights/${id}`);
}

export async function updateInsightInApi(id: string, payload: InsightPayload) {
  return apiRequest<ApiInsight>(`/insights/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteInsightInApi(id: string) {
  return apiRequest<void>(`/insights/${id}`, { method: "DELETE" });
}

export async function listInsightEvidencesFromApi(id: string) {
  return apiRequest<LinkedEvidence[]>(`/insights/${id}/evidences`);
}

export async function linkInsightEvidenceInApi(insightId: string, evidenceId: string) {
  return apiRequest<{ insight_id: string; evidence_id: string }>(
    `/insights/${insightId}/evidences/${evidenceId}`,
    { method: "POST" },
  );
}

export async function unlinkInsightEvidenceInApi(insightId: string, evidenceId: string) {
  return apiRequest<void>(`/insights/${insightId}/evidences/${evidenceId}`, {
    method: "DELETE",
  });
}

export async function listRoadmapFromApi(productId: string) {
  return apiRequest<ApiRoadmapItem[]>(`/products/${productId}/roadmap`);
}

export async function createRoadmapInApi(
  productId: string,
  payload: Required<Pick<RoadmapPayload, "type" | "title">> & RoadmapPayload,
) {
  return apiRequest<ApiRoadmapItem>(`/products/${productId}/roadmap`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getRoadmapFromApi(id: string) {
  return apiRequest<ApiRoadmapItem>(`/roadmap/${id}`);
}

export async function updateRoadmapInApi(id: string, payload: RoadmapPayload) {
  return apiRequest<ApiRoadmapItem>(`/roadmap/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionRoadmapStatusInApi(
  id: string,
  status: ApiRoadmapStatus,
  reason?: string,
) {
  return apiRequest<ApiRoadmapItem>(`/roadmap/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({
      status,
      ...(status === "cancelled" && reason ? { cancel_reason: reason } : {}),
      ...(status === "rolled_back" && reason ? { rollback_reason: reason } : {}),
    }),
  });
}

export async function deleteRoadmapInApi(id: string) {
  return apiRequest<void>(`/roadmap/${id}`, { method: "DELETE" });
}

export async function listOutcomesFromApi(roadmapItemId: string) {
  return apiRequest<ApiOutcome[]>(`/roadmap/${roadmapItemId}/outcomes`);
}

export async function createOutcomeInApi(
  roadmapItemId: string,
  payload: Required<Pick<OutcomePayload, "hypothesized_impact">> & OutcomePayload,
) {
  return apiRequest<ApiOutcome>(`/roadmap/${roadmapItemId}/outcomes`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function getOutcomeFromApi(id: string) {
  return apiRequest<ApiOutcome>(`/outcomes/${id}`);
}

export async function updateOutcomeInApi(id: string, payload: OutcomePayload) {
  return apiRequest<ApiOutcome>(`/outcomes/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionOutcomeStatusInApi(id: string, status: ApiOutcomeStatus) {
  return apiRequest<ApiOutcome>(`/outcomes/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteOutcomeInApi(id: string) {
  return apiRequest<void>(`/outcomes/${id}`, { method: "DELETE" });
}

export async function linkHypothesisRoadmapInApi(hypothesisId: string, roadmapItemId: string) {
  return apiRequest<{ hypothesis_id: string; roadmap_item_id: string }>(
    `/hypotheses/${hypothesisId}/roadmap/${roadmapItemId}`,
    { method: "POST" },
  );
}

export async function listHypothesisRoadmapFromApi(hypothesisId: string) {
  return apiRequest<LinkedRoadmapItem[]>(`/hypotheses/${hypothesisId}/roadmap`);
}

export async function listStrategicPillarsFromApi(productId: string) {
  return apiRequest<ApiStrategicPillar[]>(`/products/${productId}/strategic-pillars`);
}

export async function createStrategicPillarInApi(
  productId: string,
  payload: Required<Pick<StrategicPillarPayload, "name">> & StrategicPillarPayload,
) {
  return apiRequest<ApiStrategicPillar>(`/products/${productId}/strategic-pillars`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateStrategicPillarInApi(id: string, payload: StrategicPillarPayload) {
  return apiRequest<ApiStrategicPillar>(`/strategic-pillars/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteStrategicPillarInApi(id: string) {
  return apiRequest<void>(`/strategic-pillars/${id}`, { method: "DELETE" });
}

export async function listObjectivesFromApi(productId: string) {
  return apiRequest<ApiObjective[]>(`/products/${productId}/objectives`);
}

export async function createObjectiveInApi(
  productId: string,
  payload: Required<Pick<ObjectivePayload, "title">> & ObjectivePayload,
) {
  return apiRequest<ApiObjective>(`/products/${productId}/objectives`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateObjectiveInApi(id: string, payload: ObjectivePayload) {
  return apiRequest<ApiObjective>(`/objectives/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function transitionObjectiveStatusInApi(id: string, status: ApiObjectiveStatus) {
  return apiRequest<ApiObjective>(`/objectives/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function deleteObjectiveInApi(id: string) {
  return apiRequest<void>(`/objectives/${id}`, { method: "DELETE" });
}

export async function listKeyResultsFromApi(objectiveId: string) {
  return apiRequest<ApiKeyResult[]>(`/objectives/${objectiveId}/key-results`);
}

export async function getDashboardAnalyticsFromApi(productId?: string, period?: ApiDashboardPeriod) {
  const params = new URLSearchParams();
  if (productId) params.set("product_id", productId);
  if (period) params.set("period", period);
  const queryString = params.toString();
  const query = queryString ? `?${queryString}` : "";
  return apiRequest<ApiDashboardAnalytics>(`/analytics/dashboard${query}`);
}

export async function createKeyResultInApi(
  objectiveId: string,
  payload: Required<Pick<KeyResultPayload, "title">> & KeyResultPayload,
) {
  return apiRequest<ApiKeyResult>(`/objectives/${objectiveId}/key-results`, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateKeyResultInApi(id: string, payload: KeyResultPayload) {
  return apiRequest<ApiKeyResult>(`/key-results/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteKeyResultInApi(id: string) {
  return apiRequest<void>(`/key-results/${id}`, { method: "DELETE" });
}
