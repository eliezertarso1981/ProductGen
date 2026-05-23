-- Human-readable codes for strategy entities (onboarding step 3 + strategy API).
-- Safe on DBs that already ran productgen_schema.sql (IF NOT EXISTS / backfill).

ALTER TABLE strategic_pillars
  ADD COLUMN IF NOT EXISTS code text;

WITH numbered AS (
  SELECT
    id,
    'PL-' || LPAD(
      (ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at NULLS LAST, id))::text,
      2,
      '0'
    ) AS new_code
  FROM strategic_pillars
  WHERE code IS NULL OR btrim(code) = ''
)
UPDATE strategic_pillars sp
SET code = n.new_code
FROM numbered n
WHERE sp.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM strategic_pillars WHERE code IS NULL OR btrim(code) = ''
  ) THEN
    ALTER TABLE strategic_pillars ALTER COLUMN code SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_strategic_pillars_product_code
  ON strategic_pillars(product_id, code);


ALTER TABLE objectives
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS pillar_id uuid;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'objectives_pillar_id_fkey'
  ) THEN
    ALTER TABLE objectives
      ADD CONSTRAINT objectives_pillar_id_fkey
      FOREIGN KEY (pillar_id) REFERENCES strategic_pillars(id);
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

WITH numbered AS (
  SELECT
    id,
    'OKR-' || LPAD(
      (ROW_NUMBER() OVER (PARTITION BY product_id ORDER BY created_at NULLS LAST, id))::text,
      2,
      '0'
    ) AS new_code
  FROM objectives
  WHERE code IS NULL OR btrim(code) = ''
)
UPDATE objectives o
SET code = n.new_code
FROM numbered n
WHERE o.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM objectives WHERE code IS NULL OR btrim(code) = ''
  ) THEN
    ALTER TABLE objectives ALTER COLUMN code SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_objectives_product_code
  ON objectives(product_id, code);


ALTER TABLE key_results
  ADD COLUMN IF NOT EXISTS code text;

WITH numbered AS (
  SELECT
    id,
    'KR-' || LPAD(
      (ROW_NUMBER() OVER (PARTITION BY objective_id ORDER BY created_at NULLS LAST, id))::text,
      2,
      '0'
    ) AS new_code
  FROM key_results
  WHERE code IS NULL OR btrim(code) = ''
)
UPDATE key_results kr
SET code = n.new_code
FROM numbered n
WHERE kr.id = n.id;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM key_results WHERE code IS NULL OR btrim(code) = ''
  ) THEN
    ALTER TABLE key_results ALTER COLUMN code SET NOT NULL;
  END IF;
EXCEPTION
  WHEN others THEN
    NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_kr_objective_code
  ON key_results(objective_id, code);
