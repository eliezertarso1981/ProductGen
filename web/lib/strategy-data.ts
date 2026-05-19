export type PeriodType = "annual" | "quarterly";
export type Quarter = 1 | 2 | 3 | 4;

export interface Period {
  type: PeriodType;
  year: number;
  quarter?: Quarter;
}

export interface Pillar {
  id: string;
  productId: string;
  code?: string;
  name: string;
  description: string;
  color: string;
  period: Period;
  createdAt: string;
  updatedAt: string;
}

export type OKRStatus = "on_track" | "at_risk" | "off_track" | "concluido";

export interface KeyResult {
  id: string;
  code?: string;
  title: string;
  metric: string; // e.g. "NPS", "% conversão"
  baseline: number;
  target: number;
  current: number;
  unit?: string; // e.g. "%", "pts"
}

export interface OKR {
  id: string;
  productId: string;
  code?: string;
  pillarId?: string;
  objective: string;
  description: string;
  status: OKRStatus;
  period: Period;
  keyResults: KeyResult[];
  createdAt: string;
  updatedAt: string;
}

export const okrStatusConfig: Record<OKRStatus, { label: string; dot: string }> = {
  on_track: { label: "No ritmo", dot: "var(--success)" },
  at_risk: { label: "Em risco", dot: "var(--warn)" },
  off_track: { label: "Fora da meta", dot: "var(--danger)" },
  concluido: { label: "Concluído", dot: "var(--info)" },
};

export const okrStatuses: OKRStatus[] = ["on_track", "at_risk", "off_track", "concluido"];

export const pillarColors: { id: string; value: string; label: string }[] = [
  { id: "primary", value: "var(--primary)", label: "Azul" },
  { id: "purple", value: "var(--purple)", label: "Roxo" },
  { id: "cyan", value: "var(--cyan)", label: "Ciano" },
  { id: "success", value: "var(--success)", label: "Verde" },
  { id: "warn", value: "var(--warn-strong)", label: "Âmbar" },
  { id: "danger", value: "var(--danger)", label: "Vermelho" },
];

export function formatPeriod(p: Period): string {
  if (p.type === "annual") return `Anual ${p.year}`;
  return `Q${p.quarter} ${p.year}`;
}

export function periodKey(p: Period): string {
  return p.type === "annual" ? `${p.year}-A` : `${p.year}-Q${p.quarter}`;
}

export function krProgress(kr: KeyResult): number {
  const denom = kr.target - kr.baseline;
  if (denom === 0) return kr.current >= kr.target ? 100 : 0;
  const pct = ((kr.current - kr.baseline) / denom) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

export function okrProgress(okr: OKR): number {
  if (okr.keyResults.length === 0) return 0;
  const sum = okr.keyResults.reduce((acc, kr) => acc + krProgress(kr), 0);
  return Math.round(sum / okr.keyResults.length);
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function getPillarDisplayId(pillarOrId: Pick<Pillar, "id" | "code"> | string): string | null {
  if (typeof pillarOrId === "string") return UUID_PATTERN.test(pillarOrId) ? null : pillarOrId;
  return pillarOrId.code ?? (UUID_PATTERN.test(pillarOrId.id) ? null : pillarOrId.id);
}

export function getOKRDisplayId(okrOrId: Pick<OKR, "id" | "code"> | string): string | null {
  if (typeof okrOrId === "string") return UUID_PATTERN.test(okrOrId) ? null : okrOrId;
  return okrOrId.code ?? (UUID_PATTERN.test(okrOrId.id) ? null : okrOrId.id);
}

export function getKeyResultDisplayId(krOrId: Pick<KeyResult, "id" | "code"> | string): string | null {
  if (typeof krOrId === "string") return UUID_PATTERN.test(krOrId) ? null : krOrId;
  return krOrId.code ?? (UUID_PATTERN.test(krOrId.id) ? null : krOrId.id);
}
