-- Workspace usage counters for plan enforcement (see api/src/config/plans.ts).
--
-- workspace_product_usage: active product total (NOT monthly). Align with
--   max_products; may be maintained by app/triggers or reconciled from products.
-- workspace_storage_usage: cumulative object-storage bytes (NOT monthly).
--   Align with max_storage_bytes; adjust on upload/delete of assets.
-- workspace_prd_usage: auto-generated PRDs per calendar month (UTC).
--   period_start is the first day of the month; a new row is created per month.
--   Align with max_auto_prds_per_month. Limits come from workspaces.plan + app config.

CREATE TABLE IF NOT EXISTS workspace_product_usage (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  product_count int NOT NULL DEFAULT 0 CHECK (product_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_workspace_product_usage_updated_at
  BEFORE UPDATE ON workspace_product_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS workspace_storage_usage (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_bytes_used bigint NOT NULL DEFAULT 0 CHECK (storage_bytes_used >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_workspace_storage_usage_updated_at
  BEFORE UPDATE ON workspace_storage_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE IF NOT EXISTS workspace_prd_usage (
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  period_start date NOT NULL,
  auto_prds_generated int NOT NULL DEFAULT 0 CHECK (auto_prds_generated >= 0),
  tokens_total bigint NOT NULL DEFAULT 0 CHECK (tokens_total >= 0),
  cost_usd_total numeric(10, 4) NOT NULL DEFAULT 0 CHECK (cost_usd_total >= 0),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, period_start),
  CONSTRAINT workspace_prd_usage_period_start_first_of_month
    CHECK (period_start = date_trunc('month', period_start::timestamptz)::date)
);

CREATE TRIGGER trg_workspace_prd_usage_updated_at
  BEFORE UPDATE ON workspace_prd_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_workspace_prd_usage_period
  ON workspace_prd_usage(period_start DESC);

ALTER TABLE workspace_product_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_product_usage FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_product_usage_workspace_isolation ON workspace_product_usage;
CREATE POLICY workspace_product_usage_workspace_isolation ON workspace_product_usage
  USING (workspace_id = current_workspace_id());

ALTER TABLE workspace_storage_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_storage_usage FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_storage_usage_workspace_isolation ON workspace_storage_usage;
CREATE POLICY workspace_storage_usage_workspace_isolation ON workspace_storage_usage
  USING (workspace_id = current_workspace_id());

ALTER TABLE workspace_prd_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_prd_usage FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS workspace_prd_usage_workspace_isolation ON workspace_prd_usage;
CREATE POLICY workspace_prd_usage_workspace_isolation ON workspace_prd_usage
  USING (workspace_id = current_workspace_id());

COMMENT ON TABLE workspace_product_usage IS
  'Contador de produtos ativos por workspace (não mensal). Limite: plans.max_products.';
COMMENT ON TABLE workspace_storage_usage IS
  'Bytes acumulados em storage por workspace (não mensal). Limite: plans.max_storage_bytes.';
COMMENT ON TABLE workspace_prd_usage IS
  'PRDs auto-gerados por mês (UTC, period_start = dia 1). Limite: plans.max_auto_prds_per_month.';
