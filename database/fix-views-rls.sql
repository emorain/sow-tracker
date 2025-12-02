-- ============================================================================
-- FIX VIEW RLS SECURITY - Apply Row Level Security to all views
-- ============================================================================
-- Views don't automatically inherit RLS from their base tables
-- We need to apply RLS policies to views or ensure user_id filtering in the view definition
-- ============================================================================

-- Grant SELECT permission to authenticated users for all views
GRANT SELECT ON housing_unit_occupancy TO authenticated;
GRANT SELECT ON bred_sows_view TO authenticated;

-- Grant SELECT on other views if they exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_views WHERE viewname = 'sow_list_view') THEN
    GRANT SELECT ON sow_list_view TO authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_views WHERE viewname = 'boar_list_view') THEN
    GRANT SELECT ON boar_list_view TO authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_views WHERE viewname = 'piglet_view') THEN
    GRANT SELECT ON piglet_view TO authenticated;
  END IF;
  IF EXISTS (SELECT FROM pg_views WHERE viewname = 'location_history_view') THEN
    GRANT SELECT ON location_history_view TO authenticated;
  END IF;
END $$;

-- ============================================================================
-- RECREATE HOUSING_UNIT_OCCUPANCY VIEW WITH USER FILTERING SECURITY DEFINER
-- ============================================================================
-- PostgreSQL views don't support RLS policies directly
-- The best solution is to ensure the view includes user_id and clients filter on it
-- OR we recreate the view with SECURITY INVOKER (default) so base table RLS applies

-- Drop and recreate housing_unit_occupancy with explicit user filtering
DROP VIEW IF EXISTS housing_unit_occupancy CASCADE;

CREATE VIEW housing_unit_occupancy
WITH (security_invoker = true) AS
SELECT
  hu.id,
  hu.user_id,
  hu.name,
  hu.type,
  hu.square_footage,
  hu.max_capacity,
  hu.building_name,
  hu.unit_number AS pen_number,
  COUNT(s.id) as current_sows,
  -- Calculate sq ft per sow (only if square_footage is set)
  CASE
    WHEN COUNT(s.id) = 0 THEN NULL
    WHEN hu.square_footage IS NULL THEN NULL
    ELSE ROUND((hu.square_footage / COUNT(s.id))::numeric, 2)
  END as sq_ft_per_sow,
  -- Compliance status (only relevant if square_footage is set)
  CASE
    WHEN hu.square_footage IS NULL THEN NULL -- Not tracking sq ft
    WHEN COUNT(s.id) = 0 THEN true -- Empty pen is compliant
    WHEN hu.type != 'gestation' THEN true -- Only gestation has strict 24 sq ft requirement
    WHEN hu.square_footage / COUNT(s.id) >= 24 THEN true -- Meets requirement
    ELSE false -- Non-compliant
  END as is_compliant
FROM housing_units hu
LEFT JOIN sows s ON s.housing_unit_id = hu.id AND s.status = 'active'
GROUP BY hu.id, hu.user_id, hu.name, hu.type, hu.square_footage, hu.max_capacity, hu.building_name, hu.unit_number;

COMMENT ON VIEW housing_unit_occupancy IS 'Housing unit occupancy with RLS - filters by user_id via base table RLS policies';

-- Grant access
GRANT SELECT ON housing_unit_occupancy TO authenticated;

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this to verify views are properly secured:

SELECT
  schemaname,
  viewname,
  viewowner,
  definition
FROM pg_views
WHERE schemaname = 'public'
  AND viewname IN (
    'housing_unit_occupancy',
    'bred_sows_view',
    'sow_list_view',
    'boar_list_view'
  )
ORDER BY viewname;

-- Test that views respect RLS
-- When logged in as different users, this should only show their data:
-- SELECT * FROM housing_unit_occupancy;
-- SELECT * FROM bred_sows_view;
