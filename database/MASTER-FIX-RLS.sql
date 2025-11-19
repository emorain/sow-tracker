-- ============================================================================
-- MASTER RLS FIX SCRIPT - Complete Security Fix
-- ============================================================================
-- This script fixes the multi-tenant RLS security issue in one go
--
-- BEFORE RUNNING:
-- 1. Back up your database (Supabase Dashboard -> Database -> Backups)
-- 2. Run verify-current-state.sql to see current status
-- 3. Read RLS-FIX-GUIDE.md for detailed explanation
--
-- This script will:
-- 1. Add user_id columns to all tables (if missing)
-- 2. Backfill user_id for existing data
-- 3. Drop all permissive policies
-- 4. Create correct user-specific RLS policies
-- 5. Fix storage bucket policies
-- 6. Verify everything is working
-- ============================================================================

BEGIN;

-- ============================================================================
-- PART 1: ADD user_id COLUMNS (if not already added)
-- ============================================================================

-- Add user_id to sows table
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to boars table
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to farrowings table
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to piglets table
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id to optional tables (only if they exist)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_batches') THEN
    ALTER TABLE matrix_batches ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
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

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccinations') THEN
    ALTER TABLE vaccinations ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
    ALTER TABLE reminders ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- ============================================================================
-- PART 2: BACKFILL user_id FOR EXISTING DATA
-- ============================================================================
-- This assigns all existing data to the first user IF there's only one user
-- If you have multiple users, you'll need to manually assign ownership

DO $$
DECLARE
  first_user_id UUID;
  user_count INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;

  RAISE NOTICE 'Found % user(s) in the database', user_count;

  -- Only auto-backfill if there's exactly one user
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

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_batches') THEN
      EXECUTE 'UPDATE matrix_batches SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
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

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccinations') THEN
      EXECUTE 'UPDATE vaccinations SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
      EXECUTE 'UPDATE reminders SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    RAISE NOTICE 'Successfully backfilled user_id for all tables';
  ELSIF user_count > 1 THEN
    RAISE NOTICE 'WARNING: Multiple users detected (%). You must MANUALLY assign data ownership!', user_count;
    RAISE NOTICE 'See RLS-FIX-GUIDE.md Appendix A for instructions';
  ELSE
    RAISE NOTICE 'WARNING: No users found in database!';
  END IF;
END $$;

-- Make user_id NOT NULL (after backfill)
ALTER TABLE sows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE boars ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE farrowings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE piglets ALTER COLUMN user_id SET NOT NULL;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sows_user_id ON sows(user_id);
CREATE INDEX IF NOT EXISTS idx_boars_user_id ON boars(user_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_user_id ON farrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_piglets_user_id ON piglets(user_id);

-- ============================================================================
-- PART 3: DROP ALL PERMISSIVE POLICIES
-- ============================================================================

-- Drop schema.sql policies (too permissive)
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

-- Drop enable-authentication-rls.sql policies
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

-- Drop anonymous access policies
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

-- Drop any existing correct policies (we'll recreate them)
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
DROP POLICY IF EXISTS "Users can view own vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Users can insert own vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Users can update own vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Users can delete own vaccinations" ON vaccinations;
DROP POLICY IF EXISTS "Users can view own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can insert own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can update own reminders" ON reminders;
DROP POLICY IF EXISTS "Users can delete own reminders" ON reminders;

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

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'matrix_batches') THEN
    EXECUTE 'CREATE POLICY "Users can view own matrix batches" ON matrix_batches FOR SELECT USING (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can insert own matrix batches" ON matrix_batches FOR INSERT WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can update own matrix batches" ON matrix_batches FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
    EXECUTE 'CREATE POLICY "Users can delete own matrix batches" ON matrix_batches FOR DELETE USING (auth.uid() = user_id)';
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

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'vaccinations') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'vaccinations' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE POLICY "Users can view own vaccinations" ON vaccinations FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own vaccinations" ON vaccinations FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own vaccinations" ON vaccinations FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can delete own vaccinations" ON vaccinations FOR DELETE USING (auth.uid() = user_id)';
    END IF;
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'reminders') THEN
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'reminders' AND column_name = 'user_id') THEN
      EXECUTE 'CREATE POLICY "Users can view own reminders" ON reminders FOR SELECT USING (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can insert own reminders" ON reminders FOR INSERT WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can update own reminders" ON reminders FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id)';
      EXECUTE 'CREATE POLICY "Users can delete own reminders" ON reminders FOR DELETE USING (auth.uid() = user_id)';
    END IF;
  END IF;
END $$;

COMMIT;

-- ============================================================================
-- PART 6: FIX STORAGE BUCKET POLICIES (separate transaction)
-- ============================================================================

-- Drop overly permissive storage policies
DROP POLICY IF EXISTS "Enable all access" ON storage.objects;
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own farm assets" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view farm assets" ON storage.objects;

-- Create correct storage policies
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

-- Check RLS is enabled
SELECT
  tablename,
  CASE WHEN rowsecurity THEN '✓ ENABLED' ELSE '✗ DISABLED' END as rls_status
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN ('sows', 'boars', 'farrowings', 'piglets', 'farm_settings', 'housing_units')
ORDER BY tablename;

-- Check user_id columns exist
SELECT
  table_name,
  CASE WHEN is_nullable = 'NO' THEN '✓ NOT NULL' ELSE '⚠ NULLABLE' END as status
FROM information_schema.columns
WHERE table_schema = 'public'
  AND column_name = 'user_id'
  AND table_name IN ('sows', 'boars', 'farrowings', 'piglets', 'farm_settings', 'housing_units')
ORDER BY table_name;

-- Check policies are user-specific
SELECT
  tablename,
  policyname,
  cmd as operation
FROM pg_policies
WHERE schemaname = 'public'
  AND policyname LIKE '%own%'
ORDER BY tablename, policyname;

-- ============================================================================
-- SUCCESS!
-- ============================================================================
-- If you see:
-- - All tables with "✓ ENABLED" RLS
-- - All user_id columns "✓ NOT NULL"
-- - Policies named like "Users can view own [table]"
--
-- Then RLS is properly configured!
--
-- Next: Test with two different user accounts to verify isolation.
-- ============================================================================
