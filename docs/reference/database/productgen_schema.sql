-- ============================================================================
-- PRODUCTGEN - Schema Completo (sem CREATE DATABASE)
-- Plataforma de Product Intelligence (estratégia → discovery → delivery → outcomes)
-- Postgres 15+
-- ============================================================================
--
-- COMO USAR:
--   1. Conecte no banco "productgen" (já criado pelo Docker)
--   2. Confirme rodando: SELECT current_database();  -- deve retornar 'productgen'
--   3. Execute este arquivo INTEIRO como script (Alt+X no DBeaver)
--   4. Validar com queries no final do arquivo
--
-- ============================================================================


-- ============================================================================
-- SEÇÃO 1: EXTENSÕES
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;     -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;       -- email case-insensitive
CREATE EXTENSION IF NOT EXISTS pg_trgm;      -- busca fuzzy
CREATE EXTENSION IF NOT EXISTS btree_gin;    -- índices compostos GIN
CREATE EXTENSION IF NOT EXISTS ltree;        -- hierarquia roadmap


-- ============================================================================
-- SEÇÃO 2: FUNÇÕES UTILITÁRIAS
-- ============================================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION current_workspace_id()
RETURNS uuid AS $$
  SELECT COALESCE(
    NULLIF(current_setting('app.current_workspace_id', true), '')::uuid,
    NULLIF(current_setting('app.current_workspace', true), '')::uuid
  );
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION current_actor_id()
RETURNS uuid AS $$
  SELECT NULLIF(current_setting('app.current_actor', true), '')::uuid;
$$ LANGUAGE sql STABLE;


-- ============================================================================
-- SEÇÃO 3: TIPOS ENUM
-- ============================================================================

CREATE TYPE evidence_status AS ENUM (
  'new', 'triaged', 'linked', 'archived'
);

CREATE TYPE evidence_source AS ENUM (
  'interview', 'support_ticket', 'nps', 'sales_call',
  'usage_data', 'survey', 'review', 'internal', 'other'
);

CREATE TYPE pain_status AS ENUM (
  'identified', 'investigating', 'prioritized',
  'addressed', 'resolved', 'discarded', 'merged', 'split'
);

CREATE TYPE relationship_type AS ENUM (
  'related_to', 'causes', 'supports', 'blocks', 'duplicates',
  'merged_from', 'split_from', 'generated_from', 'inspired_by', 'measures', 'impacts'
);

CREATE TYPE prd_status AS ENUM (
  'draft', 'reviewing', 'approved', 'archived'
);

CREATE TYPE visibility_level AS ENUM (
  'public', 'private', 'restricted'
);

CREATE TYPE hypothesis_status AS ENUM (
  'formulated', 'validating', 'validated', 'invalidated',
  'in_execution', 'delivered', 'deprioritized', 'discarded'
);

CREATE TYPE experiment_method AS ENUM (
  'interview', 'prototype', 'ab_test', 'fake_door',
  'survey', 'beta', 'concierge', 'wizard_of_oz', 'other'
);

CREATE TYPE experiment_status AS ENUM (
  'planned', 'running', 'completed', 'analyzed'
);

CREATE TYPE experiment_result AS ENUM (
  'validated', 'invalidated', 'inconclusive'
);

CREATE TYPE delivery_type AS ENUM (
  'initiative', 'epic', 'feature'
);

CREATE TYPE delivery_status AS ENUM (
  'proposed', 'planned', 'in_development', 'in_validation',
  'delivered', 'measuring_outcome', 'cancelled', 'rolled_back'
);

CREATE TYPE objective_status AS ENUM (
  'draft', 'active', 'achieved', 'missed', 'cancelled'
);

CREATE TYPE outcome_status AS ENUM (
  'hypothesized', 'measuring', 'confirmed', 'not_confirmed', 'inconclusive'
);

CREATE TYPE workspace_role AS ENUM (
  'owner', 'admin', 'member', 'viewer', 'guest'
);

CREATE TYPE workspace_job_function AS ENUM (
  'CEO', 'CPO', 'GPM', 'PM', 'PD', 'UX', 'PO'
);

CREATE TYPE product_role AS ENUM (
  'owner', 'editor', 'viewer', 'none'
);

CREATE TYPE auth_token_purpose AS ENUM (
  'verify_email', 'reset_password', 'change_email'
);

CREATE TYPE attachable_type AS ENUM (
  'evidence', 'pain', 'hypothesis', 'experiment',
  'roadmap_item', 'outcome', 'objective', 'key_result',
  'product', 'prd', 'release', 'strategic_pillar'
);


-- ============================================================================
-- SEÇÃO 4: FUNDAÇÃO - workspaces, users, workspace_members
-- ============================================================================

CREATE TABLE workspaces (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL,
  created_by_user_id uuid,
  plan text NOT NULL DEFAULT 'free',
  logo_url text,
  company_size text,
  country_code char(2),
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX idx_workspaces_slug
  ON workspaces(slug) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_workspaces_updated_at
  BEFORE UPDATE ON workspaces
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();


CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email citext NOT NULL,
  name text NOT NULL,
  password_hash text,
  job_title text,
  email_verified_at timestamptz,
  avatar_url text,
  last_login_at timestamptz,
  mfa_enabled boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX idx_users_email
  ON users(email) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE workspaces
  ADD CONSTRAINT fk_workspaces_created_by_user
  FOREIGN KEY (created_by_user_id) REFERENCES users(id);


CREATE TABLE workspace_members (
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  user_id uuid NOT NULL REFERENCES users(id),
  role workspace_role NOT NULL DEFAULT 'member',
  job_function workspace_job_function,
  invited_by_user_id uuid REFERENCES users(id),
  joined_at timestamptz NOT NULL DEFAULT now(),
  last_accessed_at timestamptz,
  onboarded_at timestamptz,
  removed_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (workspace_id, user_id)
);

CREATE TRIGGER trg_workspace_members_updated_at
  BEFORE UPDATE ON workspace_members
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_workspace_members_user_accessed
  ON workspace_members(user_id, last_accessed_at DESC NULLS LAST)
  WHERE removed_at IS NULL;

CREATE TABLE workspace_teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE UNIQUE INDEX idx_workspace_teams_workspace_code
  ON workspace_teams(workspace_id, code) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_workspace_teams_workspace_id
  ON workspace_teams(workspace_id, id);
CREATE INDEX idx_workspace_teams_workspace
  ON workspace_teams(workspace_id) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_workspace_teams_updated_at
  BEFORE UPDATE ON workspace_teams
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE workspace_team_members (
  workspace_id uuid NOT NULL,
  team_id uuid NOT NULL,
  user_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, user_id),
  FOREIGN KEY (workspace_id, team_id)
    REFERENCES workspace_teams(workspace_id, id) ON DELETE CASCADE,
  FOREIGN KEY (workspace_id, user_id)
    REFERENCES workspace_members(workspace_id, user_id) ON DELETE CASCADE
);

CREATE INDEX idx_workspace_team_members_user
  ON workspace_team_members(workspace_id, user_id);

CREATE TABLE workspace_team_products (
  workspace_id uuid NOT NULL,
  team_id uuid NOT NULL,
  product_id uuid NOT NULL,
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (team_id, product_id),
  FOREIGN KEY (workspace_id, team_id)
    REFERENCES workspace_teams(workspace_id, id) ON DELETE CASCADE
);

CREATE INDEX idx_workspace_team_products_product
  ON workspace_team_products(workspace_id, product_id);

CREATE TABLE user_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token_hash text NOT NULL,
  user_agent text,
  ip_address inet,
  expires_at timestamptz NOT NULL,
  last_used_at timestamptz NOT NULL DEFAULT now(),
  revoked_at timestamptz,
  revoked_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_user_sessions_refresh_token_hash
  ON user_sessions(refresh_token_hash);
CREATE INDEX idx_user_sessions_user_active
  ON user_sessions(user_id, expires_at DESC)
  WHERE revoked_at IS NULL;

CREATE TABLE auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  purpose auth_token_purpose NOT NULL,
  token_hash text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_auth_tokens_token_hash
  ON auth_tokens(token_hash);
CREATE INDEX idx_auth_tokens_user_purpose
  ON auth_tokens(user_id, purpose, expires_at DESC)
  WHERE used_at IS NULL;

CREATE TABLE email_verification_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token_hash text NOT NULL,
  expires_at timestamptz NOT NULL,
  used_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX idx_email_verification_tokens_hash
  ON email_verification_tokens(token_hash);
CREATE INDEX idx_email_verification_tokens_user_active
  ON email_verification_tokens(user_id, expires_at DESC)
  WHERE used_at IS NULL;

CREATE TABLE enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid REFERENCES workspaces(id) ON DELETE SET NULL,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_enterprise_leads_updated_at
  BEFORE UPDATE ON enterprise_leads
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_enterprise_leads_workspace
  ON enterprise_leads(workspace_id)
  WHERE workspace_id IS NOT NULL;


-- ============================================================================
-- SEÇÃO 4b: CONTROLE DE USO POR PLANO (workspace limits)
-- ============================================================================
-- Limites vêm de workspaces.plan + api/src/config/plans.ts.
-- Produtos e storage: totais acumulados (sem reset mensal).
-- PRDs auto: contador mensal (UTC); period_start = primeiro dia do mês.

CREATE TABLE workspace_product_usage (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  product_count int NOT NULL DEFAULT 0 CHECK (product_count >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_workspace_product_usage_updated_at
  BEFORE UPDATE ON workspace_product_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE workspace_storage_usage (
  workspace_id uuid PRIMARY KEY REFERENCES workspaces(id) ON DELETE CASCADE,
  storage_bytes_used bigint NOT NULL DEFAULT 0 CHECK (storage_bytes_used >= 0),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_workspace_storage_usage_updated_at
  BEFORE UPDATE ON workspace_storage_usage
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TABLE workspace_prd_usage (
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

CREATE INDEX idx_workspace_prd_usage_period
  ON workspace_prd_usage(period_start DESC);


-- ============================================================================
-- SEÇÃO 5: SISTEMA DE EVENTOS (auditoria/log derivado, particionado por mês)
-- ============================================================================

CREATE TABLE entity_events (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  event_type text NOT NULL,
  from_status text,
  to_status text,
  reason text,
  changed_fields text[],
  payload jsonb,
  actor_id uuid,
  actor_type text DEFAULT 'user',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (id, occurred_at)
) PARTITION BY RANGE (occurred_at);

CREATE INDEX idx_events_entity
  ON entity_events(entity_type, entity_id, occurred_at DESC);

CREATE INDEX idx_events_workspace_time
  ON entity_events(workspace_id, occurred_at DESC);

CREATE INDEX idx_events_type
  ON entity_events(workspace_id, event_type, occurred_at DESC);

REVOKE UPDATE, DELETE ON entity_events FROM PUBLIC;

-- 12 partições mensais a partir do mês corrente
DO $$
DECLARE
  start_date date := date_trunc('month', current_date)::date;
  partition_date date;
  partition_name text;
  next_date date;
BEGIN
  FOR i IN 0..11 LOOP
    partition_date := start_date + (i || ' months')::interval;
    next_date := partition_date + interval '1 month';
    partition_name := 'entity_events_' || to_char(partition_date, 'YYYY_MM');
    EXECUTE format(
      'CREATE TABLE %I PARTITION OF entity_events FOR VALUES FROM (%L) TO (%L)',
      partition_name, partition_date, next_date
    );
  END LOOP;
END $$;

CREATE TABLE entity_events_default PARTITION OF entity_events DEFAULT;


-- ============================================================================
-- SEÇÃO 6: COLABORAÇÃO / GOVERNANÇA TRANSVERSAL
-- ============================================================================

CREATE TABLE comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  parent_comment_id uuid REFERENCES comments(id),
  content text NOT NULL,
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_comments_entity
  ON comments(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_comments_workspace
  ON comments(workspace_id) WHERE deleted_at IS NULL;

CREATE TABLE entity_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  user_id uuid REFERENCES users(id),
  squad_id uuid,
  assignment_role text NOT NULL,
  assigned_by uuid REFERENCES users(id),
  assigned_at timestamptz NOT NULL DEFAULT now(),
  unassigned_at timestamptz,
  is_primary boolean NOT NULL DEFAULT false,
  metadata jsonb NOT NULL DEFAULT '{}',
  CONSTRAINT entity_assignments_user_or_squad_check CHECK (
    user_id IS NOT NULL OR squad_id IS NOT NULL
  )
);

CREATE INDEX idx_entity_assignments_entity
  ON entity_assignments(entity_type, entity_id) WHERE unassigned_at IS NULL;
CREATE INDEX idx_entity_assignments_user
  ON entity_assignments(user_id) WHERE unassigned_at IS NULL;
CREATE INDEX idx_entity_assignments_workspace
  ON entity_assignments(workspace_id) WHERE unassigned_at IS NULL;
CREATE UNIQUE INDEX idx_entity_assignments_unique_primary
  ON entity_assignments(entity_type, entity_id, assignment_role)
  WHERE is_primary = true AND unassigned_at IS NULL;

CREATE TABLE decision_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  decision_type text NOT NULL,
  title text NOT NULL,
  rationale text NOT NULL,
  impact_analysis text,
  decided_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_decision_logs_entity
  ON decision_logs(entity_type, entity_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_decision_logs_workspace
  ON decision_logs(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_decision_logs_type
  ON decision_logs(decision_type) WHERE deleted_at IS NULL;

-- ============================================================================
-- SEÇÃO 7: TRIGGER GENÉRICO DE AUDITORIA
-- ============================================================================

CREATE OR REPLACE FUNCTION audit_entity_changes()
RETURNS trigger AS $$
DECLARE
  v_event_type text;
  v_changed_fields text[];
  v_from_status text;
  v_to_status text;
  v_actor_id uuid;
  v_old_jsonb jsonb;
  v_new_jsonb jsonb;
  v_has_status boolean;
  v_has_deleted_at boolean;
BEGIN
  v_actor_id := current_actor_id();
  
  IF (TG_OP = 'INSERT') THEN
    v_new_jsonb := to_jsonb(NEW);
    v_to_status := v_new_jsonb->>'status';
    
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      to_status, payload, actor_id
    ) VALUES (
      NEW.workspace_id, TG_TABLE_NAME, NEW.id, 'created',
      v_to_status, v_new_jsonb, v_actor_id
    );
    RETURN NEW;
    
  ELSIF (TG_OP = 'UPDATE') THEN
    v_old_jsonb := to_jsonb(OLD);
    v_new_jsonb := to_jsonb(NEW);
    
    v_has_deleted_at := v_old_jsonb ? 'deleted_at';
    v_has_status := v_old_jsonb ? 'status';
    
    SELECT array_agg(key) INTO v_changed_fields
    FROM jsonb_each(v_new_jsonb)
    WHERE v_old_jsonb->key IS DISTINCT FROM v_new_jsonb->key
      AND key != 'updated_at';
    
    IF v_changed_fields IS NULL OR array_length(v_changed_fields, 1) = 0 THEN
      RETURN NEW;
    END IF;
    
    IF v_has_deleted_at 
       AND v_old_jsonb->>'deleted_at' IS NULL 
       AND v_new_jsonb->>'deleted_at' IS NOT NULL THEN
      v_event_type := 'soft_deleted';
    ELSIF v_has_deleted_at 
          AND v_old_jsonb->>'deleted_at' IS NOT NULL 
          AND v_new_jsonb->>'deleted_at' IS NULL THEN
      v_event_type := 'restored';
    ELSIF v_has_status
          AND v_old_jsonb->>'status' IS DISTINCT FROM v_new_jsonb->>'status' THEN
      v_event_type := 'status_changed';
      v_from_status := v_old_jsonb->>'status';
      v_to_status := v_new_jsonb->>'status';
    ELSE
      v_event_type := 'updated';
    END IF;
    
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      from_status, to_status, changed_fields, payload, actor_id
    ) VALUES (
      NEW.workspace_id, TG_TABLE_NAME, NEW.id, v_event_type,
      v_from_status, v_to_status, v_changed_fields,
      jsonb_build_object('before', v_old_jsonb, 'after', v_new_jsonb),
      v_actor_id
    );
    RETURN NEW;
  END IF;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_comments_audit
  AFTER INSERT OR UPDATE ON comments
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

CREATE TRIGGER trg_entity_assignments_audit
  AFTER INSERT OR UPDATE ON entity_assignments
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

CREATE TRIGGER trg_decision_logs_audit
  AFTER INSERT OR UPDATE ON decision_logs
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

CREATE TRIGGER trg_workspace_teams_audit
  AFTER INSERT OR UPDATE ON workspace_teams
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

COMMENT ON FUNCTION audit_entity_changes() IS
  'Trigger de auditoria genérico. Pré-requisito: tabela tem coluna workspace_id.
   Detecta colunas status e deleted_at via jsonb. Skip de UPDATEs idempotentes.';


-- ============================================================================
-- SEÇÃO 7: ESTRATÉGIA - products, strategic_pillars, objectives, key_results
-- ============================================================================

CREATE TABLE products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  slug text,
  name text NOT NULL,
  vision text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  archived_at timestamptz,
  deleted_at timestamptz
);

CREATE INDEX idx_products_workspace
  ON products(workspace_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_products_workspace_id
  ON products(workspace_id, id);
CREATE UNIQUE INDEX idx_products_workspace_slug
  ON products(workspace_id, slug) WHERE slug IS NOT NULL AND deleted_at IS NULL;

ALTER TABLE workspace_team_products
  ADD CONSTRAINT fk_workspace_team_products_product
  FOREIGN KEY (workspace_id, product_id) REFERENCES products(workspace_id, id) ON DELETE CASCADE;

CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_products_audit
  AFTER INSERT OR UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

CREATE TABLE product_members (
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role product_role NOT NULL,
  added_by_user_id uuid REFERENCES users(id),
  added_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (product_id, user_id),
  CONSTRAINT product_members_role_check CHECK (role IN ('owner', 'editor', 'viewer', 'none'))
);

CREATE INDEX idx_product_members_user
  ON product_members(user_id, workspace_id);
CREATE INDEX idx_product_members_workspace
  ON product_members(workspace_id);
CREATE UNIQUE INDEX idx_product_members_owner
  ON product_members(product_id, user_id)
  WHERE role = 'owner';


CREATE TABLE strategic_pillars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  color text,
  position int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_pillars_product
  ON strategic_pillars(product_id, position) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_pillars_product_code
  ON strategic_pillars(product_id, code);

CREATE TRIGGER trg_pillars_updated_at
  BEFORE UPDATE ON strategic_pillars
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pillars_audit
  AFTER INSERT OR UPDATE ON strategic_pillars
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE objectives (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  title text NOT NULL,
  description text,
  status objective_status NOT NULL DEFAULT 'draft',
  horizon_start date,
  horizon_end date,
  pillar_id uuid REFERENCES strategic_pillars(id),
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_objectives_workspace_status
  ON objectives(workspace_id, status) WHERE deleted_at IS NULL;

CREATE INDEX idx_objectives_product
  ON objectives(product_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_objectives_product_code
  ON objectives(product_id, code);

CREATE TRIGGER trg_objectives_updated_at
  BEFORE UPDATE ON objectives
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_objectives_audit
  AFTER INSERT OR UPDATE ON objectives
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE key_results (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  objective_id uuid NOT NULL REFERENCES objectives(id),
  code text NOT NULL,
  title text NOT NULL,
  metric_type text,
  baseline numeric,
  target numeric,
  current_value numeric,
  unit text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_kr_objective
  ON key_results(objective_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_kr_objective_code
  ON key_results(objective_id, code);

CREATE TRIGGER trg_kr_updated_at
  BEFORE UPDATE ON key_results
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_kr_audit
  AFTER INSERT OR UPDATE ON key_results
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


-- ============================================================================
-- SEÇÃO 8: PERSONAS
-- ============================================================================

CREATE TABLE personas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  code text NOT NULL,
  name text NOT NULL,
  description text,
  segment_size_estimate int,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_personas_workspace
  ON personas(workspace_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_personas_workspace_code
  ON personas(workspace_id, code);

CREATE TRIGGER trg_personas_updated_at
  BEFORE UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_personas_audit
  AFTER INSERT OR UPDATE ON personas
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


-- ============================================================================
-- SEÇÃO 9: DISCOVERY - evidences, pains, hypotheses, experiments
-- ============================================================================

CREATE TABLE evidences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid REFERENCES products(id),
  code text NOT NULL,
  title text NOT NULL,
  content text NOT NULL,
  source evidence_source NOT NULL,
  source_url text,
  customer_identifier text,
  status evidence_status NOT NULL DEFAULT 'new',
  collected_at timestamptz NOT NULL,
  created_by uuid REFERENCES users(id),
  metadata jsonb NOT NULL DEFAULT '{}',
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_evidences_search ON evidences USING gin(search_vector);
CREATE INDEX idx_evidences_workspace_status
  ON evidences(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_evidences_collected
  ON evidences(workspace_id, collected_at DESC) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_evidences_product_code
  ON evidences(product_id, code);

CREATE TRIGGER trg_evidences_updated_at
  BEFORE UPDATE ON evidences
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_evidences_search
  BEFORE INSERT OR UPDATE ON evidences
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.portuguese', title, content);

CREATE TRIGGER trg_evidences_audit
  AFTER INSERT OR UPDATE ON evidences
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE insights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  confidence_score numeric,
  impact_score numeric,
  frequency_score numeric,
  evidence_count int NOT NULL DEFAULT 0,
  owner_id uuid REFERENCES users(id),
  metadata jsonb NOT NULL DEFAULT '{}',
  search_vector tsvector,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_insights_workspace ON insights(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insights_product ON insights(product_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_insights_search ON insights USING gin(search_vector);
CREATE UNIQUE INDEX idx_insights_product_code
  ON insights(product_id, code);

CREATE TRIGGER trg_insights_updated_at
  BEFORE UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_insights_search
  BEFORE INSERT OR UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(search_vector, 'pg_catalog.portuguese', title, description);

CREATE TRIGGER trg_insights_audit
  AFTER INSERT OR UPDATE ON insights
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();

ALTER TABLE insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY insights_workspace_isolation ON insights
  USING (workspace_id = current_workspace_id());


CREATE TABLE pains (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  parent_pain_id uuid REFERENCES pains(id),
  root_pain_id uuid REFERENCES pains(id),
  title text NOT NULL,
  description text,
  status pain_status NOT NULL DEFAULT 'identified',
  severity int CHECK (severity BETWEEN 1 AND 5),
  reach_estimate int,
  priority_score numeric,
  scoring_method text,
  scoring_payload jsonb NOT NULL DEFAULT '{}',
  discard_reason text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT pain_discard_requires_reason CHECK (
    status != 'discarded' OR discard_reason IS NOT NULL
  )
);

CREATE INDEX idx_pains_workspace_status
  ON pains(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_pains_product
  ON pains(product_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_pains_product_code
  ON pains(product_id, code);

CREATE TRIGGER trg_pains_updated_at
  BEFORE UPDATE ON pains
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_pains_audit
  AFTER INSERT OR UPDATE ON pains
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE pain_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  source_pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  target_pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  relationship_type relationship_type NOT NULL,
  reason text,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT pain_relationships_no_self CHECK (source_pain_id != target_pain_id)
);

CREATE INDEX idx_pain_relationships_source ON pain_relationships(source_pain_id);
CREATE INDEX idx_pain_relationships_target ON pain_relationships(target_pain_id);


CREATE TABLE hypotheses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  title text NOT NULL,
  if_clause text NOT NULL,
  then_clause text NOT NULL,
  because_clause text NOT NULL,
  assumptions jsonb NOT NULL DEFAULT '[]',
  status hypothesis_status NOT NULL DEFAULT 'formulated',
  confidence int CHECK (confidence BETWEEN 1 AND 5),
  priority_score numeric,
  scoring_method text,
  scoring_payload jsonb NOT NULL DEFAULT '{}',
  outcome_summary text,
  cloned_from_id uuid REFERENCES hypotheses(id),
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_hypotheses_workspace_status
  ON hypotheses(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_hypotheses_product
  ON hypotheses(product_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_hypotheses_product_code
  ON hypotheses(product_id, code);
CREATE INDEX idx_hypotheses_clone
  ON hypotheses(cloned_from_id) WHERE cloned_from_id IS NOT NULL;

CREATE TRIGGER trg_hypotheses_updated_at
  BEFORE UPDATE ON hypotheses
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_hypotheses_audit
  AFTER INSERT OR UPDATE ON hypotheses
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE experiments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id),
  code text NOT NULL,
  title text NOT NULL,
  method experiment_method NOT NULL,
  success_criteria text NOT NULL,
  sample_target int,
  sample_actual int,
  status experiment_status NOT NULL DEFAULT 'planned',
  result experiment_result,
  learnings text,
  started_at timestamptz,
  ended_at timestamptz,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  CONSTRAINT experiment_analyzed_requires_result CHECK (
    status != 'analyzed' OR result IS NOT NULL
  )
);

CREATE INDEX idx_experiments_hypothesis
  ON experiments(hypothesis_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_experiments_product_code
  ON experiments(product_id, code);
CREATE INDEX idx_experiments_workspace_status
  ON experiments(workspace_id, status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_experiments_updated_at
  BEFORE UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_experiments_audit
  AFTER INSERT OR UPDATE ON experiments
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


-- ============================================================================
-- SEÇÃO 10: DELIVERY - roadmap_items
-- ============================================================================

CREATE TABLE roadmap_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  code text NOT NULL,
  parent_id uuid REFERENCES roadmap_items(id),
  path ltree,
  type delivery_type NOT NULL,
  title text NOT NULL,
  description text,
  status delivery_status NOT NULL DEFAULT 'proposed',
  
  planned_start date,
  planned_end date,
  actual_start date,
  actual_end date,
  effort_estimate text,
  
  priority_score numeric,
  priority_breakdown jsonb,
  scoring_method text,
  scoring_payload jsonb NOT NULL DEFAULT '{}',
  
  external_system text,
  external_id text,
  external_url text,
  external_status text,
  external_synced_at timestamptz,
  
  pillar_id uuid REFERENCES strategic_pillars(id),
  
  cancel_reason text,
  rollback_reason text,
  owner_id uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  
  CONSTRAINT roadmap_cancel_requires_reason CHECK (
    status != 'cancelled' OR cancel_reason IS NOT NULL
  ),
  CONSTRAINT roadmap_rollback_requires_reason CHECK (
    status != 'rolled_back' OR rollback_reason IS NOT NULL
  )
);

CREATE INDEX idx_roadmap_items_path ON roadmap_items USING gist(path);
CREATE INDEX idx_roadmap_items_workspace_status
  ON roadmap_items(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_roadmap_items_product
  ON roadmap_items(product_id) WHERE deleted_at IS NULL;
CREATE UNIQUE INDEX idx_roadmap_items_product_code
  ON roadmap_items(product_id, code);
CREATE INDEX idx_roadmap_items_parent
  ON roadmap_items(parent_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_roadmap_items_external
  ON roadmap_items(external_system, external_id)
  WHERE external_id IS NOT NULL AND deleted_at IS NULL;

CREATE TRIGGER trg_roadmap_items_updated_at
  BEFORE UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_roadmap_items_audit
  AFTER INSERT OR UPDATE ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


-- ============================================================================
-- SEÇÃO 11: OUTCOMES
-- ============================================================================

CREATE TABLE outcomes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id),
  code text NOT NULL,
  key_result_id uuid REFERENCES key_results(id),
  pain_id uuid REFERENCES pains(id),
  hypothesized_impact text NOT NULL,
  measurement_window_days int NOT NULL DEFAULT 30,
  status outcome_status NOT NULL DEFAULT 'hypothesized',
  measurement_started_at timestamptz,
  measurement_ended_at timestamptz,
  baseline_value numeric,
  final_value numeric,
  conclusion text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_outcomes_workspace_status
  ON outcomes(workspace_id, status) WHERE deleted_at IS NULL;
CREATE INDEX idx_outcomes_roadmap_item
  ON outcomes(roadmap_item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_outcomes_code
  ON outcomes(code) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_outcomes_updated_at
  BEFORE UPDATE ON outcomes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_outcomes_audit
  AFTER INSERT OR UPDATE ON outcomes
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE prds (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  version int NOT NULL DEFAULT 1,
  status prd_status NOT NULL DEFAULT 'draft',
  title text NOT NULL,
  content text NOT NULL,
  assumptions text,
  business_rules text,
  non_functional_requirements text,
  analytics_requirements text,
  rollout_strategy text,
  rollback_strategy text,
  approved_by uuid REFERENCES users(id),
  approved_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz,
  UNIQUE (roadmap_item_id, version),
  CONSTRAINT prd_approval_requires_approver CHECK (
    approved_at IS NULL OR approved_by IS NOT NULL
  )
);

CREATE INDEX idx_prds_roadmap_item ON prds(roadmap_item_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_prds_status ON prds(status) WHERE deleted_at IS NULL;

CREATE TRIGGER trg_prds_updated_at
  BEFORE UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_prds_audit
  AFTER INSERT OR UPDATE ON prds
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE releases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  product_id uuid NOT NULL REFERENCES products(id),
  version text NOT NULL,
  title text,
  description text,
  planned_release_date date,
  actual_release_date date,
  changelog text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (product_id, version)
);

CREATE INDEX idx_releases_product ON releases(product_id);


CREATE TABLE engineering_handoffs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  external_provider text,
  external_project text,
  external_ticket_id text,
  external_ticket_url text,
  engineering_owner text,
  handoff_notes text,
  approved_for_delivery boolean NOT NULL DEFAULT false,
  synced_at timestamptz,
  created_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_engineering_handoffs_roadmap_item ON engineering_handoffs(roadmap_item_id);


-- ============================================================================
-- SEÇÃO 12: RELAÇÕES N:M
-- ============================================================================

CREATE TABLE evidence_pain_links (
  evidence_id uuid NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  PRIMARY KEY (evidence_id, pain_id)
);
CREATE INDEX idx_evidence_pain_pain ON evidence_pain_links(pain_id);


CREATE TABLE evidence_insight_links (
  evidence_id uuid NOT NULL REFERENCES evidences(id) ON DELETE CASCADE,
  insight_id uuid NOT NULL REFERENCES insights(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES users(id),
  PRIMARY KEY (evidence_id, insight_id)
);
CREATE INDEX idx_evidence_insight_insight ON evidence_insight_links(insight_id);


CREATE TABLE pain_persona_links (
  pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  persona_id uuid NOT NULL REFERENCES personas(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pain_id, persona_id)
);
CREATE INDEX idx_pain_persona_persona ON pain_persona_links(persona_id);


CREATE TABLE pain_hypothesis_links (
  pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pain_id, hypothesis_id)
);
CREATE INDEX idx_pain_hyp_hyp ON pain_hypothesis_links(hypothesis_id);


CREATE TABLE pain_strategic_pillar_links (
  pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  pillar_id uuid NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pain_id, pillar_id)
);
CREATE INDEX idx_pain_pillar_pillar ON pain_strategic_pillar_links(pillar_id);


CREATE TABLE pain_objective_links (
  pain_id uuid NOT NULL REFERENCES pains(id) ON DELETE CASCADE,
  objective_id uuid NOT NULL REFERENCES objectives(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (pain_id, objective_id)
);
CREATE INDEX idx_pain_objective_objective ON pain_objective_links(objective_id);


CREATE TABLE hypothesis_roadmap_links (
  hypothesis_id uuid NOT NULL REFERENCES hypotheses(id) ON DELETE CASCADE,
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (hypothesis_id, roadmap_item_id)
);
CREATE INDEX idx_hyp_roadmap_roadmap ON hypothesis_roadmap_links(roadmap_item_id);


CREATE TABLE roadmap_pillar_links (
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  pillar_id uuid NOT NULL REFERENCES strategic_pillars(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (roadmap_item_id, pillar_id)
);
CREATE INDEX idx_roadmap_pillar_pillar ON roadmap_pillar_links(pillar_id);


CREATE TABLE roadmap_key_result_links (
  roadmap_item_id uuid NOT NULL REFERENCES roadmap_items(id) ON DELETE CASCADE,
  key_result_id uuid NOT NULL REFERENCES key_results(id) ON DELETE CASCADE,
  workspace_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (roadmap_item_id, key_result_id)
);
CREATE INDEX idx_roadmap_kr_kr ON roadmap_key_result_links(key_result_id);


-- ============================================================================
-- SEÇÃO 13: ASSETS
-- ============================================================================

CREATE TABLE assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id uuid NOT NULL REFERENCES workspaces(id),
  filename text NOT NULL,
  mime_type text NOT NULL,
  size_bytes bigint NOT NULL,
  checksum_sha256 text,
  storage_provider text NOT NULL,
  storage_bucket text NOT NULL,
  storage_key text NOT NULL,
  asset_type text,
  thumbnail_key text,
  transcript text,
  transcript_search tsvector,
  metadata jsonb NOT NULL DEFAULT '{}',
  uploaded_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);

CREATE INDEX idx_assets_workspace
  ON assets(workspace_id) WHERE deleted_at IS NULL;
CREATE INDEX idx_assets_checksum
  ON assets(workspace_id, checksum_sha256)
  WHERE checksum_sha256 IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX idx_assets_transcript ON assets USING gin(transcript_search);

CREATE TRIGGER trg_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assets_transcript_search
  BEFORE INSERT OR UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION
  tsvector_update_trigger(transcript_search, 'pg_catalog.portuguese', transcript);

CREATE TRIGGER trg_assets_audit
  AFTER INSERT OR UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION audit_entity_changes();


CREATE TABLE asset_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  asset_id uuid NOT NULL REFERENCES assets(id) ON DELETE CASCADE,
  attachable_type attachable_type NOT NULL,
  attachable_id uuid NOT NULL,
  workspace_id uuid NOT NULL,
  role text DEFAULT 'attachment',
  position int NOT NULL DEFAULT 0,
  attached_by uuid REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (asset_id, attachable_type, attachable_id, role)
);

CREATE INDEX idx_attachments_attachable
  ON asset_attachments(attachable_type, attachable_id);
CREATE INDEX idx_attachments_asset
  ON asset_attachments(asset_id);
CREATE INDEX idx_attachments_workspace
  ON asset_attachments(workspace_id);


-- ============================================================================
-- SEÇÃO 14: VALIDAÇÃO CROSS-WORKSPACE EM LINKS
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_link_same_workspace()
RETURNS trigger AS $$
DECLARE
  v_left_workspace uuid;
  v_right_workspace uuid;
  v_left_table text;
  v_right_table text;
  v_left_id_col text;
  v_right_id_col text;
BEGIN
  v_left_table := TG_ARGV[0];
  v_left_id_col := TG_ARGV[1];
  v_right_table := TG_ARGV[2];
  v_right_id_col := TG_ARGV[3];
  
  EXECUTE format(
    'SELECT workspace_id FROM %I WHERE id = ($1->>%L)::uuid',
    v_left_table, v_left_id_col
  ) INTO v_left_workspace USING to_jsonb(NEW);
  
  EXECUTE format(
    'SELECT workspace_id FROM %I WHERE id = ($1->>%L)::uuid',
    v_right_table, v_right_id_col
  ) INTO v_right_workspace USING to_jsonb(NEW);
  
  IF v_left_workspace IS NULL OR v_right_workspace IS NULL THEN
    RAISE EXCEPTION 'Link references non-existent entity';
  END IF;
  
  IF v_left_workspace != v_right_workspace THEN
    RAISE EXCEPTION 'Cross-workspace link not allowed: % (workspace %) <> % (workspace %)',
      v_left_table, v_left_workspace, v_right_table, v_right_workspace;
  END IF;
  
  IF NEW.workspace_id != v_left_workspace THEN
    RAISE EXCEPTION 'Link workspace_id (%) does not match entities workspace (%)',
      NEW.workspace_id, v_left_workspace;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_validate_evidence_pain_links
  BEFORE INSERT ON evidence_pain_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'evidences', 'evidence_id', 'pains', 'pain_id'
  );

CREATE TRIGGER trg_validate_evidence_insight_links
  BEFORE INSERT ON evidence_insight_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'evidences', 'evidence_id', 'insights', 'insight_id'
  );

CREATE TRIGGER trg_validate_pain_persona_links
  BEFORE INSERT ON pain_persona_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'pains', 'pain_id', 'personas', 'persona_id'
  );

CREATE TRIGGER trg_validate_pain_hypothesis_links
  BEFORE INSERT ON pain_hypothesis_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'pains', 'pain_id', 'hypotheses', 'hypothesis_id'
  );

CREATE TRIGGER trg_validate_pain_strategic_pillar_links
  BEFORE INSERT ON pain_strategic_pillar_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'pains', 'pain_id', 'strategic_pillars', 'pillar_id'
  );

CREATE TRIGGER trg_validate_pain_objective_links
  BEFORE INSERT ON pain_objective_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'pains', 'pain_id', 'objectives', 'objective_id'
  );

CREATE TRIGGER trg_validate_hypothesis_roadmap_links
  BEFORE INSERT ON hypothesis_roadmap_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'hypotheses', 'hypothesis_id', 'roadmap_items', 'roadmap_item_id'
  );

CREATE TRIGGER trg_validate_roadmap_pillar_links
  BEFORE INSERT ON roadmap_pillar_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'roadmap_items', 'roadmap_item_id', 'strategic_pillars', 'pillar_id'
  );

CREATE TRIGGER trg_validate_roadmap_kr_links
  BEFORE INSERT ON roadmap_key_result_links
  FOR EACH ROW EXECUTE FUNCTION validate_link_same_workspace(
    'roadmap_items', 'roadmap_item_id', 'key_results', 'key_result_id'
  );


-- ============================================================================
-- SEÇÃO 15: STATE MACHINE - TABELA DE TRANSIÇÕES VÁLIDAS
-- ============================================================================

CREATE TABLE lifecycle_transitions (
  entity_type text NOT NULL,
  from_status text NOT NULL,
  to_status text NOT NULL,
  requires_reason boolean NOT NULL DEFAULT false,
  reason_field text,
  is_terminal boolean NOT NULL DEFAULT false,
  description text,
  PRIMARY KEY (entity_type, from_status, to_status)
);

COMMENT ON TABLE lifecycle_transitions IS
  'Define transições de status válidas por entidade. Consultada pelo trigger
   validate_lifecycle_transition. Mudar regra é UPDATE aqui, sem migration de código.';

-- EVIDENCES
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status) VALUES
  ('evidences', 'new', 'triaged'),
  ('evidences', 'new', 'archived'),
  ('evidences', 'triaged', 'linked'),
  ('evidences', 'triaged', 'archived'),
  ('evidences', 'linked', 'archived'),
  ('evidences', 'archived', 'triaged'),
  ('evidences', 'archived', 'linked');

-- PAINS
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status, requires_reason, reason_field, is_terminal) VALUES
  ('pains', 'identified', 'investigating', false, null, false),
  ('pains', 'identified', 'discarded', true, 'discard_reason', true),
  ('pains', 'investigating', 'prioritized', false, null, false),
  ('pains', 'investigating', 'discarded', true, 'discard_reason', true),
  ('pains', 'investigating', 'identified', false, null, false),
  ('pains', 'prioritized', 'addressed', false, null, false),
  ('pains', 'prioritized', 'investigating', false, null, false),
  ('pains', 'prioritized', 'discarded', true, 'discard_reason', true),
  ('pains', 'addressed', 'resolved', false, null, false),
  ('pains', 'addressed', 'investigating', false, null, false),
  ('pains', 'resolved', 'identified', false, null, false),
  ('pains', 'discarded', 'identified', false, null, false),
  ('pains', 'identified', 'merged', true, null, true),
  ('pains', 'investigating', 'merged', true, null, true),
  ('pains', 'prioritized', 'merged', true, null, true),
  ('pains', 'addressed', 'merged', true, null, true),
  ('pains', 'identified', 'split', true, null, true),
  ('pains', 'investigating', 'split', true, null, true),
  ('pains', 'prioritized', 'split', true, null, true),
  ('pains', 'addressed', 'split', true, null, true);

-- HYPOTHESES
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status, requires_reason, reason_field, is_terminal) VALUES
  ('hypotheses', 'formulated', 'validating', false, null, false),
  ('hypotheses', 'formulated', 'discarded', true, 'outcome_summary', true),
  ('hypotheses', 'validating', 'validated', false, null, false),
  ('hypotheses', 'validating', 'invalidated', true, 'outcome_summary', true),
  ('hypotheses', 'validating', 'formulated', false, null, false),
  ('hypotheses', 'validated', 'in_execution', false, null, false),
  ('hypotheses', 'validated', 'deprioritized', false, null, false),
  ('hypotheses', 'validated', 'validating', false, null, false),
  ('hypotheses', 'in_execution', 'delivered', false, null, false),
  ('hypotheses', 'in_execution', 'deprioritized', false, null, false),
  ('hypotheses', 'deprioritized', 'validated', false, null, false),
  ('hypotheses', 'deprioritized', 'in_execution', false, null, false),
  ('hypotheses', 'invalidated', 'formulated', false, null, false),
  ('hypotheses', 'discarded', 'formulated', false, null, false);

-- EXPERIMENTS
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status) VALUES
  ('experiments', 'planned', 'running'),
  ('experiments', 'planned', 'completed'),
  ('experiments', 'running', 'completed'),
  ('experiments', 'completed', 'analyzed'),
  ('experiments', 'analyzed', 'completed');

-- ROADMAP ITEMS
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status, requires_reason, reason_field, is_terminal) VALUES
  ('roadmap_items', 'proposed', 'planned', false, null, false),
  ('roadmap_items', 'proposed', 'cancelled', true, 'cancel_reason', true),
  ('roadmap_items', 'planned', 'in_development', false, null, false),
  ('roadmap_items', 'planned', 'proposed', false, null, false),
  ('roadmap_items', 'planned', 'cancelled', true, 'cancel_reason', true),
  ('roadmap_items', 'in_development', 'in_validation', false, null, false),
  ('roadmap_items', 'in_development', 'planned', false, null, false),
  ('roadmap_items', 'in_development', 'cancelled', true, 'cancel_reason', true),
  ('roadmap_items', 'in_validation', 'delivered', false, null, false),
  ('roadmap_items', 'in_validation', 'in_development', false, null, false),
  ('roadmap_items', 'in_validation', 'rolled_back', true, 'rollback_reason', false),
  ('roadmap_items', 'delivered', 'measuring_outcome', false, null, false),
  ('roadmap_items', 'delivered', 'rolled_back', true, 'rollback_reason', false),
  ('roadmap_items', 'measuring_outcome', 'delivered', false, null, false),
  ('roadmap_items', 'measuring_outcome', 'rolled_back', true, 'rollback_reason', false),
  ('roadmap_items', 'rolled_back', 'planned', false, null, false);

-- OBJECTIVES
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status, is_terminal) VALUES
  ('objectives', 'draft', 'active', false),
  ('objectives', 'draft', 'cancelled', true),
  ('objectives', 'active', 'achieved', true),
  ('objectives', 'active', 'missed', true),
  ('objectives', 'active', 'cancelled', true),
  ('objectives', 'active', 'draft', false),
  ('objectives', 'achieved', 'active', false),
  ('objectives', 'missed', 'active', false);

-- OUTCOMES
INSERT INTO lifecycle_transitions (entity_type, from_status, to_status) VALUES
  ('outcomes', 'hypothesized', 'measuring'),
  ('outcomes', 'measuring', 'confirmed'),
  ('outcomes', 'measuring', 'not_confirmed'),
  ('outcomes', 'measuring', 'inconclusive'),
  ('outcomes', 'confirmed', 'measuring'),
  ('outcomes', 'not_confirmed', 'measuring'),
  ('outcomes', 'inconclusive', 'measuring');


-- ============================================================================
-- SEÇÃO 16: TRIGGER GENÉRICO DE VALIDAÇÃO DE LIFECYCLE
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_lifecycle_transition()
RETURNS trigger AS $$
DECLARE
  v_from text;
  v_to text;
  v_transition record;
  v_reason_value text;
  v_old_jsonb jsonb;
  v_new_jsonb jsonb;
BEGIN
  v_old_jsonb := to_jsonb(OLD);
  v_new_jsonb := to_jsonb(NEW);
  
  v_from := v_old_jsonb->>'status';
  v_to := v_new_jsonb->>'status';
  
  IF v_from = v_to THEN
    RETURN NEW;
  END IF;
  
  SELECT * INTO v_transition
  FROM lifecycle_transitions
  WHERE entity_type = TG_TABLE_NAME
    AND from_status = v_from
    AND to_status = v_to;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid lifecycle transition for %: % -> % is not allowed',
      TG_TABLE_NAME, v_from, v_to
      USING HINT = 'Check lifecycle_transitions table for allowed transitions';
  END IF;
  
  IF v_transition.requires_reason AND v_transition.reason_field IS NOT NULL THEN
    v_reason_value := v_new_jsonb->>v_transition.reason_field;
    IF v_reason_value IS NULL OR length(trim(v_reason_value)) = 0 THEN
      RAISE EXCEPTION 'Transition % -> % on % requires a reason in field "%"',
        v_from, v_to, TG_TABLE_NAME, v_transition.reason_field
        USING HINT = 'Provide a non-empty value for the reason field';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_evidences_lifecycle
  BEFORE UPDATE OF status ON evidences
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_pains_lifecycle
  BEFORE UPDATE OF status ON pains
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_hypotheses_lifecycle
  BEFORE UPDATE OF status ON hypotheses
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_experiments_lifecycle
  BEFORE UPDATE OF status ON experiments
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_roadmap_items_lifecycle
  BEFORE UPDATE OF status ON roadmap_items
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_objectives_lifecycle
  BEFORE UPDATE OF status ON objectives
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();

CREATE TRIGGER trg_outcomes_lifecycle
  BEFORE UPDATE OF status ON outcomes
  FOR EACH ROW EXECUTE FUNCTION validate_lifecycle_transition();


-- ============================================================================
-- SEÇÃO 17: VALIDAÇÕES ESPECÍFICAS (regras complexas além da tabela)
-- ============================================================================

CREATE OR REPLACE FUNCTION validate_hypothesis_to_validated()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'validated' AND OLD.status != 'validated' THEN
    IF NOT EXISTS (
      SELECT 1 FROM experiments
      WHERE hypothesis_id = NEW.id
        AND status = 'analyzed'
        AND result = 'validated'
        AND deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot transition hypothesis to validated without at least one analyzed experiment with result=validated'
        USING HINT = 'Create and analyze an experiment first, or use status=in_execution if proceeding without formal validation';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_hypotheses_validate_to_validated
  BEFORE UPDATE OF status ON hypotheses
  FOR EACH ROW 
  WHEN (NEW.status = 'validated' AND OLD.status IS DISTINCT FROM 'validated')
  EXECUTE FUNCTION validate_hypothesis_to_validated();


CREATE OR REPLACE FUNCTION validate_roadmap_proposed_to_planned()
RETURNS trigger AS $$
BEGIN
  IF NEW.type IN ('initiative', 'epic') THEN
    IF NOT EXISTS (
      SELECT 1 
      FROM hypothesis_roadmap_links hrl
      JOIN hypotheses h ON h.id = hrl.hypothesis_id
      WHERE hrl.roadmap_item_id = NEW.id
        AND h.status IN ('validated', 'in_execution', 'delivered')
        AND h.deleted_at IS NULL
    ) THEN
      RAISE EXCEPTION 'Cannot plan a % without at least one validated hypothesis linked',
        NEW.type
        USING HINT = 'Link a hypothesis with status validated/in_execution before planning, or set status=proposed';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_roadmap_validate_to_planned
  BEFORE UPDATE OF status ON roadmap_items
  FOR EACH ROW
  WHEN (NEW.status = 'planned' AND OLD.status = 'proposed')
  EXECUTE FUNCTION validate_roadmap_proposed_to_planned();


CREATE OR REPLACE FUNCTION validate_experiment_to_running()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'running' AND OLD.status = 'planned' THEN
    IF NEW.success_criteria IS NULL OR length(trim(NEW.success_criteria)) < 10 THEN
      RAISE EXCEPTION 'Experiment success_criteria must be defined (min 10 chars) before running'
        USING HINT = 'Define a clear, measurable success criterion';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_experiments_validate_to_running
  BEFORE UPDATE OF status ON experiments
  FOR EACH ROW
  WHEN (NEW.status = 'running' AND OLD.status = 'planned')
  EXECUTE FUNCTION validate_experiment_to_running();


CREATE OR REPLACE FUNCTION suggest_hypothesis_transition()
RETURNS trigger AS $$
BEGIN
  IF NEW.status = 'analyzed' AND NEW.result IS NOT NULL THEN
    INSERT INTO entity_events (
      workspace_id, entity_type, entity_id, event_type,
      payload, actor_id
    ) VALUES (
      NEW.workspace_id, 'hypotheses', NEW.hypothesis_id, 'transition_suggested',
      jsonb_build_object(
        'reason', 'experiment_analyzed',
        'experiment_id', NEW.id,
        'experiment_result', NEW.result,
        'suggested_status', CASE 
          WHEN NEW.result = 'validated' THEN 'validated'
          WHEN NEW.result = 'invalidated' THEN 'invalidated'
          ELSE null
        END
      ),
      current_actor_id()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_experiments_suggest_hypothesis
  AFTER UPDATE OF status ON experiments
  FOR EACH ROW
  WHEN (NEW.status = 'analyzed' AND OLD.status IS DISTINCT FROM 'analyzed')
  EXECUTE FUNCTION suggest_hypothesis_transition();


-- ============================================================================
-- SEÇÃO 18: ROW-LEVEL SECURITY (RLS)
-- ============================================================================
-- Antes de qualquer query/transação, a aplicação deve setar:
--   SET LOCAL app.current_workspace = '<uuid-do-workspace>';
--   SET LOCAL app.current_actor = '<uuid-do-user>';

DO $$
DECLARE
  t text;
  policy_name text;
  domain_tables text[] := ARRAY[
    'workspace_teams', 'workspace_team_members', 'workspace_team_products',
    'products', 'strategic_pillars', 'objectives', 'key_results',
    'personas', 'evidences', 'pains', 'hypotheses', 'experiments',
    'roadmap_items', 'outcomes', 'assets',
    'evidence_pain_links', 'evidence_insight_links', 'pain_persona_links', 'pain_hypothesis_links',
    'pain_strategic_pillar_links', 'pain_objective_links',
    'hypothesis_roadmap_links', 'roadmap_pillar_links',
    'roadmap_key_result_links', 'asset_attachments'
  ];
BEGIN
  FOREACH t IN ARRAY domain_tables LOOP
    policy_name := t || '_workspace_isolation';
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('ALTER TABLE %I FORCE ROW LEVEL SECURITY', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', policy_name, t);
    EXECUTE format(
      'CREATE POLICY %I ON %I USING (workspace_id = current_workspace_id())',
      policy_name, t
    );
  END LOOP;
END $$;

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

ALTER TABLE entity_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_events FORCE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS entity_events_workspace_isolation ON entity_events;
CREATE POLICY entity_events_workspace_isolation ON entity_events
  USING (workspace_id = current_workspace_id());


-- ============================================================================
-- SEÇÃO 19: COMENTÁRIOS DE DOCUMENTAÇÃO
-- ============================================================================

COMMENT ON TABLE workspaces IS 
  'Tenants do sistema. Isolamento garantido via RLS nas tabelas de domínio.';

COMMENT ON TABLE workspace_product_usage IS
  'Contador de produtos ativos por workspace (não mensal). Limite: plans.max_products.';

COMMENT ON TABLE workspace_storage_usage IS
  'Bytes acumulados em storage por workspace (não mensal). Limite: plans.max_storage_bytes.';

COMMENT ON TABLE workspace_prd_usage IS
  'PRDs auto-gerados por mês (UTC, period_start = dia 1). Limite: plans.max_auto_prds_per_month.';

COMMENT ON TABLE entity_events IS
  'Log de auditoria/histórico (event sourcing leve, log derivado). 
   Particionado por mês. Imutável (UPDATE/DELETE revogados).';

COMMENT ON TABLE evidences IS
  'Camada 1 do discovery: input bruto (entrevistas, tickets, NPS, etc).
   Lifecycle: new -> triaged -> linked -> archived.';

COMMENT ON TABLE pains IS
  'Camada 2 do discovery: dores identificadas a partir de evidências.
   Lifecycle: identified -> investigating -> prioritized -> addressed -> resolved.
   Estado terminal "discarded" exige discard_reason.';

COMMENT ON TABLE hypotheses IS
  'Camada 3 do discovery: apostas de solução (Se/Então/Porque).
   Lifecycle: formulated -> validating -> validated/invalidated -> in_execution -> delivered.';

COMMENT ON TABLE experiments IS
  'Validações de hipótese. success_criteria obrigatório antes de rodar.
   Estado "analyzed" exige preencher result.';

COMMENT ON TABLE roadmap_items IS
  'Camada de delivery: initiative > epic > feature (hierarquia via path/ltree).
   Único ponto de sincronização bidirecional com Jira/Linear (external_*).';

COMMENT ON TABLE outcomes IS
  'Fechamento do loop: medição pós-entrega. Vincula roadmap_item a KR e/ou pain.';

COMMENT ON TABLE assets IS
  'Arquivos anexáveis a qualquer entidade via asset_attachments.
   Dedup via checksum_sha256. Binário fica no storage (S3/R2/GCS), não no DB.';

COMMENT ON TABLE lifecycle_transitions IS
  'Define transições de status válidas por entidade. Mudar regra é UPDATE,
   sem migration de código.';


-- ============================================================================
-- FIM DO SCHEMA
-- ============================================================================
-- VERIFICAÇÕES (execute uma de cada vez no DBeaver):
--
--   SELECT current_database();
--   -- Esperado: productgen
--
--   SELECT count(*) FROM information_schema.tables WHERE table_schema = 'public';
--   -- Esperado: ~28-30 tabelas
--
--   SELECT entity_type, count(*) FROM lifecycle_transitions GROUP BY 1 ORDER BY 1;
--   -- Esperado: 7 tipos de entidade com transições
--
--   SELECT inhrelid::regclass FROM pg_inherits WHERE inhparent = 'entity_events'::regclass;
--   -- Esperado: 13 partições (12 mensais + default)
--
-- ============================================================================
