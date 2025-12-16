-- Add breeding method and attempt fields to sow_list_view
-- These fields are needed for the AI Dose button to display on sow cards

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
  ) as pregnancy_check_date,

  -- NEW: Latest active breeding attempt - breeding method (for AI Dose button)
  (
    SELECT ba.breeding_method
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as current_breeding_method,

  -- NEW: Latest active breeding attempt - ID (for AI Dose button)
  (
    SELECT ba.id
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as current_breeding_attempt_id,

  -- NEW: Latest active breeding attempt - breeding cycle complete flag
  (
    SELECT ba.breeding_cycle_complete
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.organization_id = s.organization_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as breeding_cycle_complete

FROM sows s
LEFT JOIN housing_units hu ON s.housing_unit_id = hu.id;

COMMENT ON VIEW sow_list_view IS 'Optimized view for sow list page - aggregates farrowing counts and breeding status to eliminate N+1 queries. Now includes breeding method and attempt ID for AI dose functionality.';
