import type { PlanCatalogItem } from "@/lib/onboarding-api";

export function formatPlanLimit(value: number | null, singular: string, plural: string): string {
  if (value === null) return "Ilimitado";
  return value === 1 ? `1 ${singular}` : `${value} ${plural}`;
}

export function formatStorageBytes(bytes: number | null): string {
  if (bytes === null) return "Ilimitado";
  const gb = bytes / 1_073_741_824;
  if (gb >= 1) {
    const rounded = gb >= 10 ? Math.round(gb) : Math.round(gb * 10) / 10;
    return `${rounded} GB`;
  }
  const mb = Math.round(bytes / 1_048_576);
  return `${mb} MB`;
}

export function formatPrdsPerMonth(value: number | null): string {
  if (value === null) return "Ilimitados";
  return value === 1 ? "1 PRD automático/mês" : `${value} PRDs automáticos/mês`;
}

export function planLimitRows(plan: PlanCatalogItem) {
  return [
    { label: "Produtos", value: formatPlanLimit(plan.max_products, "produto", "produtos") },
    { label: "PRDs com IA", value: formatPrdsPerMonth(plan.max_auto_prds_per_month) },
    { label: "Armazenamento", value: formatStorageBytes(plan.max_storage_bytes) },
    { label: "Usuários", value: formatPlanLimit(plan.max_users, "usuário", "usuários") },
  ];
}
