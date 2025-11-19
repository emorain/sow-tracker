-- ============================================================================
-- VERIFICATION SCRIPT - Check Current Database State
-- ============================================================================
-- Run this FIRST in Supabase SQL Editor to see what needs to be fixed
-- ============================================================================

-- ============================================================================
-- 1. CHECK WHICH TABLES EXIST
-- ============================================================================
SELECT
  tablename,
  'EXISTS' as status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'sows', 'boars', 'farrowings', 'piglets',
    'farm_settings', 'housing_units',
    'matrix_treatments', 'matrix_batches',
    'protocols', 'scheduled_tasks', 'sow_location_history',
    'vaccinations', 'reminders'
  )
ORDER BY tablename;

-- ============================================================================
-- 2. CHECK WHICH TABLES HAVE user_id COLUMN
-- ============================================================================
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
ORDER BY table_name;

-- ============================================================================
-- 3. CHECK IF RLS IS ENABLED ON TABLES
-- ============================================================================
SELECT
  tablename,
  CASE WHEN rowsecurity THEN 'ENABLED' ELSE 'DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- ============================================================================
-- 4. LIST ALL CURRENT RLS POLICIES
-- ============================================================================
SELECT
  tablename,
  policyname,
  cmd as operation,
  CASE
    WHEN policyname LIKE '%own%' THEN 'CORRECT (user-specific)'
    WHEN policyname LIKE '%all%authenticated%' THEN 'WRONG (too permissive)'
    WHEN policyname LIKE '%Authenticated users%' THEN 'WRONG (too permissive)'
    ELSE 'CHECK MANUALLY'
  END as policy_type,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- 5. COUNT USERS
-- ============================================================================
SELECT
  COUNT(*) as total_users,
  ARRAY_AGG(id::text) as user_ids,
  ARRAY_AGG(email) as user_emails
FROM auth.users;

-- ============================================================================
-- 6. CHECK DATA DISTRIBUTION (which user owns what)
-- ============================================================================

-- Check sows
SELECT
  'sows' as table_name,
  COALESCE(user_id::text, 'NULL') as user_id,
  COUNT(*) as record_count
FROM sows
GROUP BY user_id
ORDER BY user_id;

-- Check boars
SELECT
  'boars' as table_name,
  COALESCE(user_id::text, 'NULL') as user_id,
  COUNT(*) as record_count
FROM boars
GROUP BY user_id
ORDER BY user_id;

-- Check farrowings
SELECT
  'farrowings' as table_name,
  COALESCE(user_id::text, 'NULL') as user_id,
  COUNT(*) as record_count
FROM farrowings
GROUP BY user_id
ORDER BY user_id;

-- Check piglets
SELECT
  'piglets' as table_name,
  COALESCE(user_id::text, 'NULL') as user_id,
  COUNT(*) as record_count
FROM piglets
GROUP BY user_id
ORDER BY user_id;

-- ============================================================================
-- 7. CHECK STORAGE BUCKETS
-- ============================================================================
SELECT
  id,
  name,
  public,
  created_at
FROM storage.buckets
WHERE id = 'farm-assets';

-- ============================================================================
-- 8. CHECK STORAGE POLICIES
-- ============================================================================
SELECT
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
ORDER BY policyname;

-- ============================================================================
-- SUMMARY
-- ============================================================================
-- After running this script, you should see:
-- 1. Which tables exist and which have user_id columns
-- 2. Whether RLS is enabled on each table
-- 3. Which policies are correct (user-specific) vs wrong (too permissive)
-- 4. How many users exist and which user owns which data
-- 5. Storage bucket and policy status
--
-- Next steps will depend on what this reveals!
-- ============================================================================
