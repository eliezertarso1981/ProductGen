-- Zera contadores de uso (produtos, storage, PRD mensal) dos workspaces
-- em que o usuário com o e-mail informado é membro ativo.
--
-- Uso:
--   1) Edite target_emails no DO abaixo (ou use a variável no psql).
--   2) Rode este arquivo inteiro: apaga e mostra o que restou (deve ser vazio).
--
-- Requer role com BYPASSRLS (ex.: postgres) em ambientes com RLS ativo.

BEGIN;

CREATE TEMP TABLE IF NOT EXISTS _target_emails (email citext PRIMARY KEY);
TRUNCATE _target_emails;
INSERT INTO _target_emails (email) VALUES
  ('eliezertarso@gmail.com'),
  ('eliezertarso@outlook.com');

CREATE TEMP TABLE IF NOT EXISTS _target_workspaces (workspace_id uuid PRIMARY KEY);
TRUNCATE _target_workspaces;
INSERT INTO _target_workspaces (workspace_id)
SELECT DISTINCT wm.workspace_id
FROM workspace_members wm
JOIN users u ON u.id = wm.user_id
JOIN _target_emails te ON te.email = u.email
WHERE wm.removed_at IS NULL
  AND u.deleted_at IS NULL;

-- Pré-visualização (antes do DELETE)
SELECT 'antes — workspaces' AS etapa, tw.workspace_id, w.name, w.slug, w.plan
FROM _target_workspaces tw
JOIN workspaces w ON w.id = tw.workspace_id
ORDER BY w.name;

SELECT 'antes — product_usage' AS etapa, p.*
FROM workspace_product_usage p
JOIN _target_workspaces tw ON tw.workspace_id = p.workspace_id;

SELECT 'antes — storage_usage' AS etapa, s.*
FROM workspace_storage_usage s
JOIN _target_workspaces tw ON tw.workspace_id = s.workspace_id;

SELECT 'antes — prd_usage' AS etapa, pr.*
FROM workspace_prd_usage pr
JOIN _target_workspaces tw ON tw.workspace_id = pr.workspace_id
ORDER BY pr.period_start DESC;

DELETE FROM workspace_prd_usage pr
USING _target_workspaces tw
WHERE pr.workspace_id = tw.workspace_id;

DELETE FROM workspace_storage_usage s
USING _target_workspaces tw
WHERE s.workspace_id = tw.workspace_id;

DELETE FROM workspace_product_usage p
USING _target_workspaces tw
WHERE p.workspace_id = tw.workspace_id;

-- Confirmação (deve retornar 0 linhas)
SELECT 'depois — product_usage' AS etapa, p.*
FROM workspace_product_usage p
JOIN _target_workspaces tw ON tw.workspace_id = p.workspace_id;

SELECT 'depois — storage_usage' AS etapa, s.*
FROM workspace_storage_usage s
JOIN _target_workspaces tw ON tw.workspace_id = s.workspace_id;

SELECT 'depois — prd_usage' AS etapa, pr.*
FROM workspace_prd_usage pr
JOIN _target_workspaces tw ON tw.workspace_id = pr.workspace_id;

COMMIT;
