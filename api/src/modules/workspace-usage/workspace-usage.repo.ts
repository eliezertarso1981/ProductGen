import type { PoolClient } from 'pg';

/** First day of the calendar month in UTC (YYYY-MM-DD). */
export function usagePeriodStartUtc(date = new Date()): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
    .toISOString()
    .slice(0, 10);
}

export type WorkspaceProductUsageRow = {
  workspace_id: string;
  product_count: number;
  updated_at: string;
};

export type WorkspaceStorageUsageRow = {
  workspace_id: string;
  storage_bytes_used: number;
  updated_at: string;
};

export type WorkspacePrdUsageRow = {
  workspace_id: string;
  period_start: string;
  auto_prds_generated: number;
  tokens_total: number;
  cost_usd_total: string;
  created_at: string;
  updated_at: string;
};

/** Snapshot for plan checks (produto + espaço). Wire on product/asset mutations. */
export async function getWorkspaceUsageSnapshot(
  client: PoolClient,
  workspaceId: string,
): Promise<{ product_count: number; storage_bytes_used: number }> {
  const { rows } = await client.query<{
    product_count: number | null;
    storage_bytes_used: number | null;
  }>(
    `
    SELECT
      p.product_count,
      s.storage_bytes_used
    FROM (SELECT $1::uuid AS workspace_id) w
    LEFT JOIN workspace_product_usage p ON p.workspace_id = w.workspace_id
    LEFT JOIN workspace_storage_usage s ON s.workspace_id = w.workspace_id
    `,
    [workspaceId],
  );
  const row = rows[0];
  return {
    product_count: row?.product_count ?? 0,
    storage_bytes_used: row?.storage_bytes_used ?? 0,
  };
}

/** Current month auto-PRD counter (UTC). Wire on auto-PRD generation. */
export async function getCurrentMonthPrdUsage(
  client: PoolClient,
  workspaceId: string,
  periodStart = usagePeriodStartUtc(),
): Promise<WorkspacePrdUsageRow | null> {
  const { rows } = await client.query<WorkspacePrdUsageRow>(
    `
    SELECT
      workspace_id,
      period_start::text,
      auto_prds_generated,
      tokens_total,
      cost_usd_total::text,
      created_at,
      updated_at
    FROM workspace_prd_usage
    WHERE workspace_id = $1 AND period_start = $2::date
    `,
    [workspaceId, periodStart],
  );
  return rows[0] ?? null;
}
