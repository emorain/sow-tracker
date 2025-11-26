-- Migration: Create sow_list_view to eliminate N+1 query problem
-- This view aggregates all data needed for the sow list page in a single query
-- Performance improvement: 151 queries → 1 query for 50 sows

-- ========================================
-- 1. CREATE SOW LIST VIEW
-- ========================================

CREATE OR REPLACE VIEW sow_list_view AS
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

  -- Housing unit info (efficient join)
  hu.name as housing_unit_name,
  hu.type as housing_unit_type,

  -- Farrowing count (subquery - more efficient than N queries)
  (
    SELECT COUNT(*)
    FROM farrowings f
    WHERE f.sow_id = s.id
      AND f.user_id = s.user_id
  ) as farrowing_count,

  -- Active farrowing status (EXISTS is very efficient)
  EXISTS(
    SELECT 1
    FROM farrowings f
    WHERE f.sow_id = s.id
      AND f.user_id = s.user_id
      AND f.actual_farrowing_date IS NOT NULL
      AND f.moved_out_of_farrowing_date IS NULL
  ) as has_active_farrowing,

  -- Latest active breeding attempt - breeding date
  (
    SELECT ba.breeding_date
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.user_id = s.user_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as current_breeding_date,

  -- Latest active breeding attempt - pregnancy confirmed status
  (
    SELECT ba.pregnancy_confirmed
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.user_id = s.user_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as pregnancy_confirmed,

  -- Latest active breeding attempt - result
  (
    SELECT ba.result
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.user_id = s.user_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as breeding_result,

  -- Latest active breeding attempt - pregnancy check date
  (
    SELECT ba.pregnancy_check_date
    FROM breeding_attempts ba
    WHERE ba.sow_id = s.id
      AND ba.user_id = s.user_id
      AND ba.result IN ('pending', 'pregnant')
    ORDER BY ba.breeding_date DESC
    LIMIT 1
  ) as pregnancy_check_date

FROM sows s
LEFT JOIN housing_units hu ON s.housing_unit_id = hu.id;

-- Grant access to authenticated users
GRANT SELECT ON sow_list_view TO authenticated;

COMMENT ON VIEW sow_list_view IS 'Optimized view for sow list page - aggregates farrowing counts and breeding status to eliminate N+1 queries';

-- ========================================
-- 2. CREATE SUPPORTING INDEXES
-- ========================================

-- Index for breeding attempts lookup by sow with result filter
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_sow_result
  ON breeding_attempts(sow_id, user_id, result, breeding_date DESC)
  WHERE result IN ('pending', 'pregnant');

-- Index for farrowing count queries
CREATE INDEX IF NOT EXISTS idx_farrowings_sow_count
  ON farrowings(sow_id, user_id);

-- Index for active farrowing lookups
CREATE INDEX IF NOT EXISTS idx_farrowings_active_status
  ON farrowings(sow_id, user_id, actual_farrowing_date, moved_out_of_farrowing_date)
  WHERE actual_farrowing_date IS NOT NULL AND moved_out_of_farrowing_date IS NULL;

-- ========================================
-- 3. ANALYZE TABLES
-- ========================================

-- Update query planner statistics
ANALYZE sows;
ANALYZE farrowings;
ANALYZE breeding_attempts;
ANALYZE housing_units;

-- ========================================
-- 4. USAGE NOTES
-- ========================================

-- Query the view like a regular table:
-- SELECT * FROM sow_list_view WHERE user_id = 'xxx' ORDER BY created_at DESC;
--
-- Performance comparison:
-- Before: 1 + (3 × N) queries where N = number of sows
-- After: 1 query total
-- With 50 sows: 151 queries → 1 query (99.3% reduction)
--
-- Expected load time improvement:
-- Before: 12-30 seconds
-- After: <2 seconds
