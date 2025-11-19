-- ============================================================================
-- CLEANUP PERMISSIVE POLICIES - Remove all remaining overly permissive policies
-- ============================================================================
-- This removes any "Authenticated users can..." policies that allow
-- ANY authenticated user to see ALL data (instead of just their own)
-- ============================================================================

-- Drop permissive policies from scheduled_tasks
DROP POLICY IF EXISTS "Authenticated users can delete scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can read scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can update scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON scheduled_tasks;

-- Drop permissive policies from protocols
DROP POLICY IF EXISTS "Authenticated users can delete protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can insert protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can read protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can update protocols" ON protocols;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON protocols;

-- Drop permissive policies from matrix_treatments (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    DROP POLICY IF EXISTS "Authenticated users can delete matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can insert matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can read matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can update matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON matrix_treatments;
  END IF;
END $$;

-- Drop permissive policies from sow_location_history (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    DROP POLICY IF EXISTS "Authenticated users can delete location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Authenticated users can insert location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Authenticated users can read location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Authenticated users can update location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sow_location_history;
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION - Check all tables for remaining permissive policies
-- ============================================================================

-- This should return ZERO rows (no permissive policies should remain)
SELECT
  tablename,
  policyname,
  '❌ PERMISSIVE - SHOULD BE DELETED' as status
FROM pg_policies
WHERE schemaname = 'public'
  AND (
    policyname LIKE '%Authenticated users%'
    OR policyname LIKE '%Enable all access%'
    OR policyname LIKE '%all users%'
  )
ORDER BY tablename, policyname;

-- This should show ONLY user-specific policies (with "own" in the name)
SELECT
  tablename,
  COUNT(*) as correct_policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%own%'
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- After running this script:
-- - The first query should return NO rows (zero permissive policies)
-- - The second query should show 4 policies per table
-- - Users should only see their own data across ALL tables
-- ============================================================================
