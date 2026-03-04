-- Migration: Add semen_type to boars table to distinguish fresh vs frozen semen
-- This allows tracking of semen storage type for AI breeding programs

-- Step 1: Add semen_type column
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS semen_type VARCHAR(20) DEFAULT 'fresh'
CHECK (semen_type IN ('fresh', 'frozen'));

-- Step 2: Set default for existing AI semen records
UPDATE boars
SET semen_type = 'fresh'
WHERE boar_type = 'ai_semen' AND semen_type IS NULL;

-- Step 3: Create index for filtering
CREATE INDEX IF NOT EXISTS idx_boars_semen_type ON boars(semen_type);

-- Step 4: Add comments
COMMENT ON COLUMN boars.semen_type IS 'Type of semen storage: fresh (used immediately) or frozen (cryopreserved for long-term storage). Only applicable when boar_type = ai_semen';

-- Step 5: Update boar_list_view to include semen_type
DROP VIEW IF EXISTS boar_list_view;

CREATE VIEW boar_list_view AS
SELECT
  -- All boar fields
  b.id,
  b.ear_tag,
  b.name,
  b.birth_date,
  b.breed,
  b.status,
  b.photo_url,
  b.right_ear_notch,
  b.left_ear_notch,
  b.registration_number,
  b.notes,
  b.created_at,
  b.sire_id,
  b.dam_id,
  b.boar_type,
  b.semen_straws,
  b.semen_type,
  b.supplier,
  b.collection_date,
  b.user_id,
  b.organization_id,
  b.cost_per_straw,
  b.ownership_type,
  b.housing_unit_id,

  -- Breeding count (how many breedings this boar has)
  (
    SELECT COUNT(*)
    FROM breeding_attempts ba
    WHERE ba.boar_id = b.id
      AND ba.organization_id = b.organization_id
  ) as breeding_count

FROM boars b;

-- Add comment on view
COMMENT ON VIEW boar_list_view IS 'Optimized view for boar list page - aggregates breeding counts to eliminate N+1 queries. Includes semen_type for AI semen inventory tracking.';
