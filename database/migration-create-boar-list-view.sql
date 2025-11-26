-- Migration: Create boar_list_view to eliminate N+1 query problem
-- This view aggregates breeding counts for the boar list page
-- Performance improvement: 1 + N queries → 1 query

-- ========================================
-- 1. CREATE BOAR LIST VIEW
-- ========================================

CREATE OR REPLACE VIEW boar_list_view AS
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

  -- Breeding count (how many farrowings this boar has sired)
  (
    SELECT COUNT(*)
    FROM farrowings f
    WHERE f.boar_id = b.id
      AND f.user_id = b.user_id
  ) as breeding_count

FROM boars b;

-- Grant access to authenticated users
GRANT SELECT ON boar_list_view TO authenticated;

COMMENT ON VIEW boar_list_view IS 'Optimized view for boar list page - aggregates breeding counts to eliminate N+1 queries';

-- ========================================
-- 2. CREATE SUPPORTING INDEX
-- ========================================

-- Index for farrowing count queries by boar
CREATE INDEX IF NOT EXISTS idx_farrowings_boar_count
  ON farrowings(boar_id, user_id);

-- ========================================
-- 3. ANALYZE TABLE
-- ========================================

-- Update query planner statistics
ANALYZE boars;
ANALYZE farrowings;

-- ========================================
-- 4. USAGE NOTES
-- ========================================

-- Query the view like a regular table:
-- SELECT * FROM boar_list_view WHERE user_id = 'xxx' ORDER BY created_at DESC;
--
-- Performance comparison:
-- Before: 1 + N queries where N = number of boars
-- After: 1 query total
-- With 20 boars: 21 queries → 1 query (95% reduction)
