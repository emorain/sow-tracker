-- Migration: Add Row Level Security (RLS) policies for multi-tenant data isolation
-- Run this in Supabase SQL Editor
-- This ensures each user only sees their own farm's data

-- ============================================================================
-- ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE boars ENABLE ROW LEVEL SECURITY;
ALTER TABLE farrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE piglets ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_units ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_treatments ENABLE ROW LEVEL SECURITY;
ALTER TABLE matrix_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sow_location_history ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- SOWS TABLE POLICIES
-- ============================================================================

-- Users can view their own sows
CREATE POLICY "Users can view own sows"
  ON sows FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own sows
CREATE POLICY "Users can insert own sows"
  ON sows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own sows
CREATE POLICY "Users can update own sows"
  ON sows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own sows
CREATE POLICY "Users can delete own sows"
  ON sows FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- BOARS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own boars"
  ON boars FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own boars"
  ON boars FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own boars"
  ON boars FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own boars"
  ON boars FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FARROWINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own farrowings"
  ON farrowings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farrowings"
  ON farrowings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farrowings"
  ON farrowings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own farrowings"
  ON farrowings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PIGLETS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own piglets"
  ON piglets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own piglets"
  ON piglets FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own piglets"
  ON piglets FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own piglets"
  ON piglets FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- FARM_SETTINGS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own settings"
  ON farm_settings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
  ON farm_settings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
  ON farm_settings FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own settings"
  ON farm_settings FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- HOUSING_UNITS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own housing units"
  ON housing_units FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own housing units"
  ON housing_units FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own housing units"
  ON housing_units FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own housing units"
  ON housing_units FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MATRIX_TREATMENTS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own matrix treatments"
  ON matrix_treatments FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matrix treatments"
  ON matrix_treatments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matrix treatments"
  ON matrix_treatments FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own matrix treatments"
  ON matrix_treatments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- MATRIX_BATCHES TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own matrix batches"
  ON matrix_batches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own matrix batches"
  ON matrix_batches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own matrix batches"
  ON matrix_batches FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own matrix batches"
  ON matrix_batches FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- PROTOCOLS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own protocols"
  ON protocols FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own protocols"
  ON protocols FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own protocols"
  ON protocols FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own protocols"
  ON protocols FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SCHEDULED_TASKS TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own tasks"
  ON scheduled_tasks FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tasks"
  ON scheduled_tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks"
  ON scheduled_tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own tasks"
  ON scheduled_tasks FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- SOW_LOCATION_HISTORY TABLE POLICIES
-- ============================================================================

CREATE POLICY "Users can view own location history"
  ON sow_location_history FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own location history"
  ON sow_location_history FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own location history"
  ON sow_location_history FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own location history"
  ON sow_location_history FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================================
-- VERIFY RLS IS ENABLED
-- ============================================================================

-- Check that RLS is enabled on all tables
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
    'protocols', 'scheduled_tasks', 'sow_location_history'
  )
ORDER BY tablename;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================

-- After running this migration:
-- 1. Each user can ONLY see their own data
-- 2. Users cannot access other users' farms
-- 3. All INSERT operations automatically use the authenticated user's ID
-- 4. This is the industry standard for multi-tenant SaaS applications
--
-- To test RLS is working:
-- 1. Create a test user
-- 2. Try to query data - you should only see that user's data
-- 3. Try to access another user's data by ID - should return empty/error
