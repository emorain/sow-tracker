-- Migration: Create bred_sows_view to eliminate N+1 query problem
-- This view aggregates breeding data from both matrix_treatments and farrowings
-- Performance improvement: 2 + (3 × N) queries → 1 query

-- ========================================
-- 1. CREATE BRED SOWS VIEW
-- ========================================

CREATE OR REPLACE VIEW bred_sows_view AS
-- Matrix-bred sows
SELECT
  mt.id,
  mt.sow_id,
  mt.breeding_date,
  mt.batch_name,
  mt.user_id,
  'matrix' as breeding_source,

  -- Sow details
  s.ear_tag,
  s.name as sow_name,
  s.photo_url,

  -- Next incomplete task
  (
    SELECT json_build_object(
      'task_name', st.task_name,
      'due_date', st.due_date
    )
    FROM scheduled_tasks st
    WHERE st.sow_id = mt.sow_id
      AND st.user_id = mt.user_id
      AND st.is_completed = false
      AND st.due_date >= CURRENT_DATE
    ORDER BY st.due_date ASC
    LIMIT 1
  ) as next_task,

  -- Check if farrowed
  EXISTS(
    SELECT 1
    FROM farrowings f
    WHERE f.sow_id = mt.sow_id
      AND f.user_id = mt.user_id
      AND f.breeding_date = mt.breeding_date
      AND f.actual_farrowing_date IS NOT NULL
  ) as has_farrowed,

  -- Check if ultrasound/pregnancy check completed
  EXISTS(
    SELECT 1
    FROM scheduled_tasks st
    WHERE st.sow_id = mt.sow_id
      AND st.user_id = mt.user_id
      AND st.is_completed = true
      AND (
        st.task_name ILIKE '%ultrasound%'
        OR st.task_name ILIKE '%pregnancy check%'
      )
  ) as pregnancy_check_completed

FROM matrix_treatments mt
JOIN sows s ON s.id = mt.sow_id AND s.user_id = mt.user_id
WHERE mt.bred = true
  AND mt.breeding_date IS NOT NULL

UNION ALL

-- Regular bred sows (from farrowings without matrix)
SELECT
  f.id,
  f.sow_id,
  f.breeding_date,
  'Regular Breeding' as batch_name,
  f.user_id,
  'regular' as breeding_source,

  -- Sow details
  s.ear_tag,
  s.name as sow_name,
  s.photo_url,

  -- Next incomplete task
  (
    SELECT json_build_object(
      'task_name', st.task_name,
      'due_date', st.due_date
    )
    FROM scheduled_tasks st
    WHERE st.sow_id = f.sow_id
      AND st.user_id = f.user_id
      AND st.is_completed = false
      AND st.due_date >= CURRENT_DATE
    ORDER BY st.due_date ASC
    LIMIT 1
  ) as next_task,

  -- Check if farrowed
  (f.actual_farrowing_date IS NOT NULL) as has_farrowed,

  -- Check if ultrasound/pregnancy check completed
  EXISTS(
    SELECT 1
    FROM scheduled_tasks st
    WHERE st.sow_id = f.sow_id
      AND st.user_id = f.user_id
      AND st.is_completed = true
      AND (
        st.task_name ILIKE '%ultrasound%'
        OR st.task_name ILIKE '%pregnancy check%'
      )
  ) as pregnancy_check_completed

FROM farrowings f
JOIN sows s ON s.id = f.sow_id AND s.user_id = f.user_id
WHERE f.breeding_date IS NOT NULL
  AND f.actual_farrowing_date IS NULL;

-- Grant access to authenticated users
GRANT SELECT ON bred_sows_view TO authenticated;

COMMENT ON VIEW bred_sows_view IS 'Optimized view for bred sows page - aggregates breeding data and tasks to eliminate N+1 queries';

-- ========================================
-- 2. CREATE SUPPORTING INDEXES
-- ========================================

-- Index for scheduled tasks lookups by sow
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_sow_incomplete
  ON scheduled_tasks(sow_id, user_id, is_completed, due_date)
  WHERE is_completed = false;

-- Index for farrowing lookups by sow and breeding date
CREATE INDEX IF NOT EXISTS idx_farrowings_breeding_lookup
  ON farrowings(sow_id, user_id, breeding_date, actual_farrowing_date);

-- Index for matrix treatments bred sows
CREATE INDEX IF NOT EXISTS idx_matrix_treatments_bred
  ON matrix_treatments(sow_id, user_id, bred, breeding_date)
  WHERE bred = true AND breeding_date IS NOT NULL;

-- ========================================
-- 3. ANALYZE TABLES
-- ========================================

-- Update query planner statistics
ANALYZE matrix_treatments;
ANALYZE farrowings;
ANALYZE scheduled_tasks;
ANALYZE sows;

-- ========================================
-- 4. USAGE NOTES
-- ========================================

-- Query the view like a regular table:
-- SELECT * FROM bred_sows_view
-- WHERE user_id = 'xxx'
-- ORDER BY breeding_date DESC;
--
-- Performance comparison:
-- Before: 2 + (3 × N) queries where N = number of bred sows
-- After: 1 query total
-- With 30 bred sows: 92 queries → 1 query (98.9% reduction)
--
-- The view returns JSON for next_task which should be parsed:
-- - next_task->>'task_name' for task name
-- - next_task->>'due_date' for due date
