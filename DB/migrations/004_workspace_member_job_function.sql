-- Função de produto no workspace (distinto de workspace_role = permissão RBAC).

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workspace_job_function') THEN
    CREATE TYPE workspace_job_function AS ENUM (
      'CEO',
      'CPO',
      'GPM',
      'PM',
      'PD',
      'UX',
      'PO'
    );
  END IF;
END $$;

ALTER TABLE workspace_members
  ADD COLUMN IF NOT EXISTS job_function workspace_job_function;

COMMENT ON COLUMN workspace_members.job_function IS
  'Função de produto no workspace (CEO, CPO, GPM, PM, PD, UX, PO). Distinto de role (permissões).';
