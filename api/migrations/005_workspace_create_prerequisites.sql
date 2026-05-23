-- Columns and enum values required by POST /workspaces (onboarding step 2).
-- Safe on DBs that already ran productgen_schema.sql (IF NOT EXISTS / idempotent enum adds).

ALTER TABLE workspaces
  ADD COLUMN IF NOT EXISTS created_by_user_id uuid,
  ADD COLUMN IF NOT EXISTS plan text;

UPDATE workspaces SET plan = 'free' WHERE plan IS NULL;

ALTER TABLE workspaces
  ALTER COLUMN plan SET DEFAULT 'free';

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'workspaces'
      AND column_name = 'plan'
      AND is_nullable = 'YES'
  ) THEN
    ALTER TABLE workspaces ALTER COLUMN plan SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'fk_workspaces_created_by_user'
  ) THEN
    ALTER TABLE workspaces
      ADD CONSTRAINT fk_workspaces_created_by_user
      FOREIGN KEY (created_by_user_id) REFERENCES users(id);
  END IF;
END $$;

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS last_accessed_at timestamptz,
  ADD COLUMN IF NOT EXISTS onboarded_at timestamptz,
  ADD COLUMN IF NOT EXISTS removed_at timestamptz,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

DO $$
DECLARE
  role_label text;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_role') THEN
    RETURN;
  END IF;

  FOREACH role_label IN ARRAY ARRAY['owner', 'admin', 'member', 'viewer', 'guest'] LOOP
    IF NOT EXISTS (
      SELECT 1
      FROM pg_enum e
      JOIN pg_type t ON e.enumtypid = t.oid
      WHERE t.typname = 'workspace_role'
        AND e.enumlabel = role_label
    ) THEN
      EXECUTE format('ALTER TYPE workspace_role ADD VALUE %L', role_label);
    END IF;
  END LOOP;
END $$;
