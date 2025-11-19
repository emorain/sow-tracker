-- ============================================================================
-- FIX RLS SECURITY - Remove overly permissive policies and apply user-specific ones
-- ============================================================================
-- This script fixes the security issue where users can see all data
-- instead of only their own data
--
-- Run this in Supabase SQL Editor
-- ============================================================================

-- ============================================================================
-- STEP 1: DROP ALL EXISTING OVERLY PERMISSIVE POLICIES
-- ============================================================================

-- Drop old schema.sql policies (too permissive - allow all authenticated users)
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sows;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farrowings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON piglets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON vaccinations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON reminders;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON boars;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON matrix_batches;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON protocols;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON scheduled_tasks;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farm_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON housing_units;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sow_location_history;

-- Drop enable-authentication-rls.sql policies (also too permissive)
DROP POLICY IF EXISTS "Authenticated users can read sows" ON sows;
DROP POLICY IF EXISTS "Authenticated users can insert sows" ON sows;
DROP POLICY IF EXISTS "Authenticated users can update sows" ON sows;
DROP POLICY IF EXISTS "Authenticated users can delete sows" ON sows;

DROP POLICY IF EXISTS "Authenticated users can read farrowings" ON farrowings;
DROP POLICY IF EXISTS "Authenticated users can insert farrowings" ON farrowings;
DROP POLICY IF EXISTS "Authenticated users can update farrowings" ON farrowings;
DROP POLICY IF EXISTS "Authenticated users can delete farrowings" ON farrowings;

DROP POLICY IF EXISTS "Authenticated users can read piglets" ON piglets;
DROP POLICY IF EXISTS "Authenticated users can insert piglets" ON piglets;
DROP POLICY IF EXISTS "Authenticated users can update piglets" ON piglets;
DROP POLICY IF EXISTS "Authenticated users can delete piglets" ON piglets;

DROP POLICY IF EXISTS "Authenticated users can read vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Authenticated users can insert vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Authenticated users can update vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Authenticated users can delete vaccinations" ON vaccinations;

DROP POLICY IF EXISTS "Authenticated users can read reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can insert reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can update reminders" ON reminders;
DROP POLICY IF EXISTS "Authenticated users can delete reminders" ON reminders;

DROP POLICY IF EXISTS "Authenticated users can read matrix_treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Authenticated users can insert matrix_treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Authenticated users can update matrix_treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Authenticated users can delete matrix_treatments" ON matrix_treatments;

-- Drop anonymous access policies (if any still exist)
DROP POLICY IF EXISTS "Enable read access for all users" ON sows;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sows;
DROP POLICY IF EXISTS "Enable update access for all users" ON sows;
DROP POLICY IF EXISTS "Enable delete access for all users" ON sows;

DROP POLICY IF EXISTS "Enable read access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable insert access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable update access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable delete access for all users" ON farrowings;

DROP POLICY IF EXISTS "Enable read access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable update access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON piglets;

DROP POLICY IF EXISTS "Enable read access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable update access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON vaccinations;

DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable update access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable delete access for all users" ON reminders;

DROP POLICY IF EXISTS "Enable read access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable update access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON matrix_treatments;

-- Drop any existing correct policies (we'll recreate them to be sure)
DROP POLICY IF EXISTS "Users can view own sows" ON sows;
DROP POLICY IF EXISTS "Users can insert own sows" ON sows;
DROP POLICY IF EXISTS "Users can update own sows" ON sows;
DROP POLICY IF EXISTS "Users can delete own sows" ON sows;

DROP POLICY IF EXISTS "Users can view own boars" ON boars;
DROP POLICY IF EXISTS "Users can insert own boars" ON boars;
DROP POLICY IF EXISTS "Users can update own boars" ON boars;
DROP POLICY IF EXISTS "Users can delete own boars" ON boars;

DROP POLICY IF EXISTS "Users can view own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can insert own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can update own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can delete own farrowings" ON farrowings;

DROP POLICY IF EXISTS "Users can view own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can insert own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can update own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can delete own piglets" ON piglets;

DROP POLICY IF EXISTS "Users can view own settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can insert own settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can update own settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can delete own settings" ON farm_settings;

DROP POLICY IF EXISTS "Users can view own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can insert own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can update own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can delete own housing units" ON housing_units;

DROP POLICY IF EXISTS "Users can view own matrix treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Users can insert own matrix treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Users can update own matrix treatments" ON matrix_treatments;
DROP POLICY IF EXISTS "Users can delete own matrix treatments" ON matrix_treatments;

DROP POLICY IF EXISTS "Users can view own matrix batches" ON matrix_batches;
DROP POLICY IF EXISTS "Users can insert own matrix batches" ON matrix_batches;
DROP POLICY IF EXISTS "Users can update own matrix batches" ON matrix_batches;
DROP POLICY IF EXISTS "Users can delete own matrix batches" ON matrix_batches;

DROP POLICY IF EXISTS "Users can view own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can insert own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can update own protocols" ON protocols;
DROP POLICY IF EXISTS "Users can delete own protocols" ON protocols;

DROP POLICY IF EXISTS "Users can view own tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Users can insert own tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON scheduled_tasks;

DROP POLICY IF EXISTS "Users can view own location history" ON sow_location_history;
DROP POLICY IF EXISTS "Users can insert own location history" ON sow_location_history;
DROP POLICY IF EXISTS "Users can update own location history" ON sow_location_history;
DROP POLICY IF EXISTS "Users can delete own location history" ON sow_location_history;

-- ============================================================================
-- STEP 2: ENSURE RLS IS ENABLED ON ALL TABLES
-- ============================================================================

ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE boars ENABLE ROW LEVEL SECURITY;
ALTER TABLE farrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE piglets ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_units ENABLE ROW LEVEL SECURITY;

-- Optional tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_batches') THEN
    ALTER TABLE matrix_batches ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
    ALTER TABLE protocols ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
    ALTER TABLE scheduled_tasks ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    ALTER TABLE sow_location_history ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccinations') THEN
    ALTER TABLE vaccinations ENABLE ROW LEVEL SECURITY;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
    ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
  END IF;
END $$;

-- ============================================================================
-- STEP 3: CREATE CORRECT USER-SPECIFIC RLS POLICIES
-- ============================================================================
-- These policies use auth.uid() = user_id to ensure users only see their own data

-- SOWS TABLE POLICIES
CREATE POLICY "Users can view own sows"
  ON sows FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sows"
  ON sows FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sows"
  ON sows FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own sows"
  ON sows FOR DELETE
  USING (auth.uid() = user_id);

-- BOARS TABLE POLICIES
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

-- FARROWINGS TABLE POLICIES
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

-- PIGLETS TABLE POLICIES
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

-- FARM_SETTINGS TABLE POLICIES
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

-- HOUSING_UNITS TABLE POLICIES
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

-- MATRIX_TREATMENTS TABLE POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    EXECUTE 'CREATE POLICY "Users can view own matrix treatments" ON matrix_treatments FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own matrix treatments" ON matrix_treatments FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own matrix treatments" ON matrix_treatments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own matrix treatments" ON matrix_treatments FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- MATRIX_BATCHES TABLE POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_batches') THEN
    EXECUTE 'CREATE POLICY "Users can view own matrix batches" ON matrix_batches FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own matrix batches" ON matrix_batches FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own matrix batches" ON matrix_batches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own matrix batches" ON matrix_batches FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- PROTOCOLS TABLE POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
    EXECUTE 'CREATE POLICY "Users can view own protocols" ON protocols FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own protocols" ON protocols FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own protocols" ON protocols FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own protocols" ON protocols FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- SCHEDULED_TASKS TABLE POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
    EXECUTE 'CREATE POLICY "Users can view own tasks" ON scheduled_tasks FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own tasks" ON scheduled_tasks FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own tasks" ON scheduled_tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own tasks" ON scheduled_tasks FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- SOW_LOCATION_HISTORY TABLE POLICIES
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    EXECUTE 'CREATE POLICY "Users can view own location history" ON sow_location_history FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own location history" ON sow_location_history FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own location history" ON sow_location_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own location history" ON sow_location_history FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

-- VACCINATIONS TABLE POLICIES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccinations') THEN
    -- Check if user_id column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vaccinations' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE POLICY "Users can view own vaccinations" ON vaccinations FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own vaccinations" ON vaccinations FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own vaccinations" ON vaccinations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can delete own vaccinations" ON vaccinations FOR DELETE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END $$;

-- REMINDERS TABLE POLICIES (if exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
    -- Check if user_id column exists
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own reminders" ON reminders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can delete own reminders" ON reminders FOR DELETE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END $$;

-- ============================================================================
-- STEP 4: VERIFICATION QUERIES
-- ============================================================================

-- Verify RLS is enabled
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
    'protocols', 'scheduled_tasks', 'sow_location_history',
    'vaccinations', 'reminders'
  )
ORDER BY tablename;

-- Verify all tables have user_id column
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
  AND table_name IN (
    'sows', 'boars', 'farrowings', 'piglets',
    'farm_settings', 'housing_units',
    'matrix_treatments', 'matrix_batches',
    'protocols', 'scheduled_tasks', 'sow_location_history',
    'vaccinations', 'reminders'
  )
ORDER BY table_name;

-- List all current RLS policies
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- ============================================================================
-- COMPLETE!
-- ============================================================================
-- After running this script:
-- 1. All overly permissive policies have been removed
-- 2. User-specific RLS policies are now in place
-- 3. Users can ONLY see their own data (where user_id = auth.uid())
-- 4. Complete data isolation between farms/users is enforced
--
-- Next steps:
-- 1. Test with your two accounts - they should now only see their own data
-- 2. If a table shows no data, check if user_id is set properly on existing records
-- ============================================================================
