-- Migration: Update database views to use organization_id instead of user_id
-- This ensures views work correctly with the multi-organization feature

-- ========================================
-- 1. UPDATE SOW_LIST_VIEW
-- ========================================

-- Drop and recreate the view to add organization_id column
DROP VIEW IF EXISTS sow_list_view;

CREATE VIEW sow_list_view AS
SELECT
  -- All sow fields
  s.id,
  s.ear_tag,
  s.name,
  s.birth_date,
  s.breed,
  s.status,
  s.photo_url,
  s.right_ear_notch,
  s.left_ear_notch,
  s.registration_number,
  s.notes,
  s.current_location,
  s.housing_unit_id,
  s.sire_id,
  s.dam_id,
  s.created_at,
  s.user_id,
  s.organization_id,

  -- Housing unit info (efficient join)
  hu.name as housing_unit_name,
  hu.type as housing_unit_type,

  -- Farrowing count (subquery - more efficient than N queries)
  (
    SELECT COUNT(*)
    FROM farrowings f
    WHERE f.sow_id = s.id
      AND f.organization_id = s.organization_id
  ) as farrowing_count,

  -- Active farrowing status (EXISTS is very efficient)
  EXISTS(
    SELECT 1
    FROM farrowings f
    WHERE f.sow_id = s.id
      AND f.organization_id = s.organization_id
      AND f.actual_farrowing_date IS NOT NULL
      AND f.moved_out_of_farrowing_date IS NULL
  ) as has_active_farrowing,

  -- Latest active breeding attempt - breeding date
  (
    SELECT ba.breeding_date
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as current_breeding_date,

  -- Latest active breeding attempt - pregnancy confirmed status
  (
    SELECT ba.pregnancy_confirmed
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as pregnancy_confirmed,

  -- Latest active breeding attempt - result
  (
    SELECT ba.result
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as breeding_result,

  -- Latest active breeding attempt - pregnancy check date
  (
    SELECT ba.pregnancy_check_date
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as pregnancy_check_date

FROM sows s
LEFT JOIN housing_units hu ON s.housing_unit_id = hu.id;

COMMENT ON VIEW sow_list_view IS 'Optimized view for sow list page - aggregates farrowing counts and breeding status to eliminate N+1 queries. Now uses organization_id for multi-organization support.';

-- ========================================
-- 2. UPDATE BOAR_LIST_VIEW
-- ========================================

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
  b.supplier,
  b.collection_date,
  b.user_id,
  b.organization_id,

  -- Breeding count (how many farrowings this boar has sired)
  (
    SELECT COUNT(*)
    FROM farrowings f
    WHERE f.boar_id = b.id
      AND f.organization_id = b.organization_id
  ) as breeding_count

FROM boars b;

COMMENT ON VIEW boar_list_view IS 'Optimized view for boar list page - aggregates breeding counts to eliminate N+1 queries. Now uses organization_id for multi-organization support.';

-- ========================================
-- 3. UPDATE HOUSING_UNIT_OCCUPANCY VIEW
-- ========================================

DROP VIEW IF EXISTS housing_unit_occupancy;

CREATE VIEW housing_unit_occupancy AS
SELECT
  hu.id,
  hu.name,
  hu.pen_number,
  hu.type,
  hu.length_feet,
  hu.width_feet,
  hu.square_footage,
  hu.max_capacity,
  hu.building_name,
  hu.notes,
  hu.measurement_date,
  hu.measured_by,
  hu.measurement_notes,
  hu.user_id,
  hu.organization_id,

  -- Current occupancy by animal type
  (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') as current_sows,
  (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active') as current_boars,
  (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned')) as current_piglets,

  -- Total animals
  (
    (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') +
    (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active') +
    (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned'))
  ) as total_animals,

  -- Prop 12 compliance metrics (only for gestation units with sows)
  CASE
    WHEN hu.type = 'gestation' AND hu.square_footage IS NOT NULL
      AND (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') > 0
    THEN hu.square_footage / NULLIF((SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active'), 0)
    ELSE NULL
  END as sq_ft_per_sow,

  -- Square footage per animal (all types)
  CASE
    WHEN hu.square_footage IS NOT NULL AND (
      (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') +
      (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active') +
      (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned'))
    ) > 0
    THEN hu.square_footage / NULLIF((
      (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') +
      (SELECT COUNT(*) FROM boars WHERE housing_unit_id = hu.id AND status = 'active') +
      (SELECT COUNT(*) FROM piglets WHERE housing_unit_id = hu.id AND status IN ('nursing', 'weaned'))
    ), 0)
    ELSE NULL
  END as sq_ft_per_animal,

  -- Prop 12 compliance status (for gestation units)
  CASE
    WHEN hu.type = 'gestation' AND hu.square_footage IS NOT NULL
      AND (SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active') > 0
    THEN (hu.square_footage / NULLIF((SELECT COUNT(*) FROM sows WHERE housing_unit_id = hu.id AND status = 'active'), 0)) >= 24
    ELSE NULL
  END as is_compliant

FROM housing_units hu;

COMMENT ON VIEW housing_unit_occupancy IS 'Housing unit occupancy with current counts by animal type and Prop 12 compliance metrics. Now uses organization_id for multi-organization support.';

-- ========================================
-- 4. UPDATE INDEXES
-- ========================================

-- Drop old indexes that used user_id
DROP INDEX IF EXISTS idx_breeding_attempts_sow_result;
DROP INDEX IF EXISTS idx_farrowings_sow_count;
DROP INDEX IF EXISTS idx_farrowings_boar_count;

-- Create new indexes using organization_id
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_sow_org_result
  ON breeding_attempts(sow_id, organization_id, result, breeding_date DESC)
  WHERE result IN ('pending', 'pregnant');

CREATE INDEX IF NOT EXISTS idx_farrowings_sow_org_count
  ON farrowings(sow_id, organization_id);

CREATE INDEX IF NOT EXISTS idx_farrowings_boar_org_count
  ON farrowings(boar_id, organization_id);

-- ========================================
-- 5. ANALYZE TABLES
-- ========================================

ANALYZE sows;
ANALYZE boars;
ANALYZE farrowings;
ANALYZE breeding_attempts;
ANALYZE housing_units;
ANALYZE piglets;
