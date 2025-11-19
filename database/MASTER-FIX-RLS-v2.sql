-- ============================================================================
-- MASTER RLS FIX SCRIPT v2 - Complete Security Fix (FIXED FOR MISSING TABLES)
-- ============================================================================
-- This version properly handles tables that don't exist
-- Run this instead of the first version
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD user_id COLUMNS TO CORE TABLES
-- ============================================================================

ALTER TABLE sows ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE boars ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE farrowings ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE piglets ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add to optional tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
    ALTER TABLE protocols ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
    ALTER TABLE scheduled_tasks ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    ALTER TABLE sow_location_history ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- PART 2: BACKFILL user_id FOR EXISTING DATA
-- ============================================================================

DO $$
DECLARE
  first_user_id UUID;
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count FROM auth.users;
  RAISE NOTICE 'Found % user(s) in the database', user_count;

  IF user_count = 1 THEN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    RAISE NOTICE 'Auto-assigning all data to user: %', first_user_id;

    -- Backfill core tables
    UPDATE sows SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE boars SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE farrowings SET user_id = first_user_id WHERE user_id IS NULL;
    UPDATE piglets SET user_id = first_user_id WHERE user_id IS NULL;

    -- Backfill optional tables
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
      EXECUTE 'UPDATE matrix_treatments SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
      EXECUTE 'UPDATE protocols SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
      EXECUTE 'UPDATE scheduled_tasks SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
      EXECUTE 'UPDATE sow_location_history SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    RAISE NOTICE 'Successfully backfilled user_id for all tables';
  ELSIF user_count > 1 THEN
    RAISE NOTICE 'WARNING: Multiple users detected (%). You must MANUALLY assign data ownership!', user_count;
  ELSE
    RAISE NOTICE 'WARNING: No users found!';
  END IF;
END $$;

-- Make NOT NULL on core tables
ALTER TABLE sows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE boars ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE farrowings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE piglets ALTER COLUMN user_id SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sows_user_id ON sows(user_id);
CREATE INDEX IF NOT EXISTS idx_boars_user_id ON boars(user_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_user_id ON farrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_piglets_user_id ON piglets(user_id);

-- ============================================================================
-- PART 3: DROP ALL PERMISSIVE POLICIES (CORE TABLES ONLY)
-- ============================================================================

-- Drop permissive policies on CORE tables
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sows;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON boars;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farrowings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON piglets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farm_settings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON housing_units;

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

-- Drop existing correct policies (we'll recreate)
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

-- Drop policies on OPTIONAL tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can read matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can insert matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can update matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Authenticated users can delete matrix_treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable read access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable update access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can view own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can insert own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can update own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can delete own matrix treatments" ON matrix_treatments;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON protocols;
    DROP POLICY IF EXISTS "Users can view own protocols" ON protocols;
    DROP POLICY IF EXISTS "Users can insert own protocols" ON protocols;
    DROP POLICY IF EXISTS "Users can update own protocols" ON protocols;
    DROP POLICY IF EXISTS "Users can delete own protocols" ON protocols;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON scheduled_tasks;
    DROP POLICY IF EXISTS "Users can view own tasks" ON scheduled_tasks;
    DROP POLICY IF EXISTS "Users can insert own tasks" ON scheduled_tasks;
    DROP POLICY IF EXISTS "Users can update own tasks" ON scheduled_tasks;
    DROP POLICY IF EXISTS "Users can delete own tasks" ON scheduled_tasks;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sow_location_history;
    DROP POLICY IF EXISTS "Users can view own location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Users can insert own location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Users can update own location history" ON sow_location_history;
    DROP POLICY IF EXISTS "Users can delete own location history" ON sow_location_history;
  END IF;
END $$;

-- ============================================================================
-- PART 4: ENABLE RLS ON ALL TABLES
-- ============================================================================

ALTER TABLE sows ENABLE ROW LEVEL SECURITY;
ALTER TABLE boars ENABLE ROW LEVEL SECURITY;
ALTER TABLE farrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE piglets ENABLE ROW LEVEL SECURITY;
ALTER TABLE farm_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE housing_units ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments ENABLE ROW LEVEL SECURITY;
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
END $$;

-- ============================================================================
-- PART 5: CREATE CORRECT USER-SPECIFIC RLS POLICIES
-- ============================================================================

-- SOWS
CREATE POLICY "Users can view own sows" ON sows FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sows" ON sows FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sows" ON sows FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own sows" ON sows FOR DELETE USING (auth.uid() = user_id);

-- BOARS
CREATE POLICY "Users can view own boars" ON boars FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own boars" ON boars FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own boars" ON boars FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own boars" ON boars FOR DELETE USING (auth.uid() = user_id);

-- FARROWINGS
CREATE POLICY "Users can view own farrowings" ON farrowings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own farrowings" ON farrowings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farrowings" ON farrowings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own farrowings" ON farrowings FOR DELETE USING (auth.uid() = user_id);

-- PIGLETS
CREATE POLICY "Users can view own piglets" ON piglets FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own piglets" ON piglets FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own piglets" ON piglets FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own piglets" ON piglets FOR DELETE USING (auth.uid() = user_id);

-- FARM_SETTINGS
CREATE POLICY "Users can view own settings" ON farm_settings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON farm_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON farm_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own settings" ON farm_settings FOR DELETE USING (auth.uid() = user_id);

-- HOUSING_UNITS
CREATE POLICY "Users can view own housing units" ON housing_units FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own housing units" ON housing_units FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own housing units" ON housing_units FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own housing units" ON housing_units FOR DELETE USING (auth.uid() = user_id);

-- Optional tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    EXECUTE 'CREATE POLICY "Users can view own matrix treatments" ON matrix_treatments FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own matrix treatments" ON matrix_treatments FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own matrix treatments" ON matrix_treatments FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own matrix treatments" ON matrix_treatments FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'protocols') THEN
    EXECUTE 'CREATE POLICY "Users can view own protocols" ON protocols FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own protocols" ON protocols FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own protocols" ON protocols FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own protocols" ON protocols FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'scheduled_tasks') THEN
    EXECUTE 'CREATE POLICY "Users can view own tasks" ON scheduled_tasks FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own tasks" ON scheduled_tasks FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own tasks" ON scheduled_tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own tasks" ON scheduled_tasks FOR DELETE USING (auth.uid() = user_id)';
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'sow_location_history') THEN
    EXECUTE 'CREATE POLICY "Users can view own location history" ON sow_location_history FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own location history" ON sow_location_history FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own location history" ON sow_location_history FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own location history" ON sow_location_history FOR DELETE USING (auth.uid() = user_id)';
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- PART 6: FIX STORAGE BUCKET POLICIES (separate transaction)
-- ============================================================================

DROP POLICY IF EXISTS "Enable all access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view farm assets" ON storage.objects;

CREATE POLICY "Users can upload own farm assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own farm assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own farm assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view farm assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'farm-assets');

-- ============================================================================
-- PART 7: VERIFICATION
-- ============================================================================

SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sows', 'boars', 'farrowings', 'piglets', 'farm_settings', 'housing_units')
ORDER BY tablename;

SELECT
  table_name,
  CASE WHEN is_nullable = 'NO' THEN '✓ NOT NULL' ELSE '⚠ NULLABLE' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
  AND table_name IN ('sows', 'boars', 'farrowings', 'piglets', 'farm_settings', 'housing_units')
ORDER BY table_name;

SELECT
  tablename,
  COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%own%'
  AND tablename IN ('sows', 'boars', 'farrowings', 'piglets', 'farm_settings', 'housing_units')
GROUP BY tablename
ORDER BY tablename;

-- ============================================================================
-- SUCCESS! RLS is now properly configured.
-- Next: Test with two different user accounts to verify isolation.
-- ============================================================================
