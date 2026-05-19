-- Seed local para testar login + products no frontend.
-- Rode depois de aplicar o schema em um banco local.

WITH workspace_row AS (
  INSERT INTO workspaces (name, slug)
  SELECT 'ProductGen Demo', 'demo'
  WHERE NOT EXISTS (
    SELECT 1 FROM workspaces WHERE slug = 'demo' AND deleted_at IS NULL
  )
  RETURNING id
),
selected_workspace AS (
  SELECT id FROM workspace_row
  UNION ALL
  SELECT id FROM workspaces WHERE slug = 'demo' AND deleted_at IS NULL
  LIMIT 1
),
user_row AS (
  INSERT INTO users (email, name, password_hash, email_verified_at)
  SELECT
    'fundador@productgen.local',
    'Fundador ProductGen',
    '$argon2id$v=19$m=65536,t=3,p=4$lNK15pFjwFiZfjLpVZLMhg$FGm/k7/dnpPMF2HItaZwMF1P0jN+HtRp2OUqv0QtwDc',
    now()
  WHERE NOT EXISTS (
    SELECT 1 FROM users WHERE email = 'fundador@productgen.local' AND deleted_at IS NULL
  )
  RETURNING id
),
updated_user AS (
  UPDATE users
  SET password_hash = '$argon2id$v=19$m=65536,t=3,p=4$lNK15pFjwFiZfjLpVZLMhg$FGm/k7/dnpPMF2HItaZwMF1P0jN+HtRp2OUqv0QtwDc',
      email_verified_at = COALESCE(email_verified_at, now())
  WHERE email = 'fundador@productgen.local'
    AND deleted_at IS NULL
    AND (password_hash IS NULL OR password_hash NOT LIKE '$argon2id$%')
),
selected_user AS (
  SELECT id FROM user_row
  UNION ALL
  SELECT id FROM users WHERE email = 'fundador@productgen.local' AND deleted_at IS NULL
  LIMIT 1
),
workspace_creator AS (
  UPDATE workspaces
  SET created_by_user_id = selected_user.id
  FROM selected_workspace, selected_user
  WHERE workspaces.id = selected_workspace.id
    AND workspaces.created_by_user_id IS NULL
),
membership_row AS (
  INSERT INTO workspace_members (workspace_id, user_id, role, last_accessed_at, onboarded_at)
  SELECT selected_workspace.id, selected_user.id, 'owner', now(), now()
  FROM selected_workspace, selected_user
  WHERE NOT EXISTS (
    SELECT 1
    FROM workspace_members
    WHERE workspace_id = selected_workspace.id
      AND user_id = selected_user.id
      AND removed_at IS NULL
  )
),
existing_product AS (
  UPDATE products
  SET
    slug = 'productgen-core',
    vision = COALESCE(vision, 'Centralizar discovery, strategy, delivery e outcomes em uma plataforma B2B.'),
    metadata = CASE
      WHEN metadata = '{}'::jsonb THEN '{
        "initials": "PG",
        "color": "var(--primary)",
        "description": "Produto principal de inteligência de produto.",
        "status": "active"
      }'::jsonb
      ELSE metadata
    END
  FROM selected_workspace
  WHERE products.workspace_id = selected_workspace.id
    AND products.name = 'ProductGen Core'
    AND products.deleted_at IS NULL
    AND products.slug IS NULL
  RETURNING products.id, products.workspace_id
),
product_row AS (
  INSERT INTO products (workspace_id, slug, name, vision, metadata)
  SELECT
    selected_workspace.id,
    'productgen-core',
    'ProductGen Core',
    'Centralizar discovery, strategy, delivery e outcomes em uma plataforma B2B.',
    '{
      "initials": "PG",
      "color": "var(--primary)",
      "description": "Produto principal de inteligência de produto.",
      "status": "active"
    }'::jsonb
  FROM selected_workspace
  WHERE NOT EXISTS (
    SELECT 1
    FROM products
    WHERE workspace_id = selected_workspace.id
      AND (slug = 'productgen-core' OR name = 'ProductGen Core')
      AND deleted_at IS NULL
  )
  RETURNING id, workspace_id
),
selected_product AS (
  SELECT id, workspace_id FROM existing_product
  UNION ALL
  SELECT id, workspace_id FROM product_row
  UNION ALL
  SELECT products.id, products.workspace_id
  FROM products, selected_workspace
  WHERE products.workspace_id = selected_workspace.id
    AND products.slug = 'productgen-core'
    AND products.deleted_at IS NULL
  LIMIT 1
)
INSERT INTO product_members (product_id, workspace_id, user_id, role, added_by_user_id)
SELECT
  selected_product.id,
  selected_product.workspace_id,
  selected_user.id,
  'owner',
  selected_user.id
FROM selected_product, selected_user
WHERE NOT EXISTS (
  SELECT 1
  FROM product_members
  WHERE product_id = selected_product.id
    AND user_id = selected_user.id
);
