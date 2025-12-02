-- ============================================================================
-- VERIFY RLS STATUS - Check if RLS is enabled and policies exist
-- ============================================================================

-- 1. Check if RLS is enabled on all tables
SELECT
  schemaname,
  tablename,
  rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'sows', 'boars', 'farrowings', 'piglets',
    'farm_settings', 'housing_units',
    'matrix_treatments', 'matrix_batches',
    'protocols', 'scheduled_tasks', 'location_history',
    'sow_location_history', 'breeding_attempts', 'ai_doses',
    'boar_transfers', 'sow_transfers', 'health_records'
  )
ORDER BY tablename;

-- 2. List all RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  CASE
    WHEN qual IS NOT NULL THEN left(qual, 100)
    ELSE 'N/A'
  END as using_clause,
  CASE
    WHEN with_check IS NOT NULL THEN left(with_check, 100)
    ELSE 'N/A'
  END as with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, cmd, policyname;

-- 3. Check which tables have user_id column
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
ORDER BY table_name;

-- 4. List all views
SELECT
  schemaname,
  viewname
FROM pg_views
WHERE schemaname = 'public'
ORDER BY viewname;

-- 5. Test query - Count records by table (as current user)
-- This should only show YOUR data if RLS is working
SELECT 'sows' as table_name, COUNT(*) as count FROM sows
UNION ALL
SELECT 'boars', COUNT(*) FROM boars
UNION ALL
SELECT 'housing_units', COUNT(*) FROM housing_units
UNION ALL
SELECT 'farrowings', COUNT(*) FROM farrowings
UNION ALL
SELECT 'piglets', COUNT(*) FROM piglets;

-- 6. Specifically check housing_units RLS
SELECT
  COUNT(*) as total_housing_units,
  COUNT(DISTINCT user_id) as distinct_users
FROM housing_units;
