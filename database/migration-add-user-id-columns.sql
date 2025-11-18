-- Migration: Add user_id columns to all tables for multi-tenancy
-- Run this BEFORE the RLS policies migration
-- This adds user_id to all existing tables and backfills with current user

-- ============================================================================
-- ADD user_id COLUMNS TO ALL TABLES
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

-- Add user_id to matrix_treatments table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to matrix_batches table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matrix_batches') THEN
    ALTER TABLE matrix_batches
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to protocols table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'protocols') THEN
    ALTER TABLE protocols
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to scheduled_tasks table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scheduled_tasks') THEN
    ALTER TABLE scheduled_tasks
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Add user_id to sow_location_history table (if it exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sow_location_history') THEN
    ALTER TABLE sow_location_history
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Note: farm_settings and housing_units already have user_id from their creation migrations

-- ============================================================================
-- BACKFILL user_id FOR EXISTING DATA
-- ============================================================================
-- IMPORTANT: This assumes you currently have only ONE user in your database
-- If you have multiple users, you'll need to manually assign ownership

-- Get the first user's ID (if there's only one user, this is safe)
DO $$
DECLARE
  first_user_id UUID;
  user_count INTEGER;
BEGIN
  -- Count total users
  SELECT COUNT(*) INTO user_count FROM auth.users;

  -- Only auto-backfill if there's exactly one user
  IF user_count = 1 THEN
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;

    -- Backfill sows
    UPDATE sows SET user_id = first_user_id WHERE user_id IS NULL;

    -- Backfill boars
    UPDATE boars SET user_id = first_user_id WHERE user_id IS NULL;

    -- Backfill farrowings
    UPDATE farrowings SET user_id = first_user_id WHERE user_id IS NULL;

    -- Backfill piglets
    UPDATE piglets SET user_id = first_user_id WHERE user_id IS NULL;

    -- Backfill matrix_treatments (if exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matrix_treatments') THEN
      EXECUTE 'UPDATE matrix_treatments SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    -- Backfill matrix_batches (if exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matrix_batches') THEN
      EXECUTE 'UPDATE matrix_batches SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    -- Backfill protocols (if exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'protocols') THEN
      EXECUTE 'UPDATE protocols SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    -- Backfill scheduled_tasks (if exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scheduled_tasks') THEN
      EXECUTE 'UPDATE scheduled_tasks SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    -- Backfill sow_location_history (if exists)
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sow_location_history') THEN
      EXECUTE 'UPDATE sow_location_history SET user_id = $1 WHERE user_id IS NULL' USING first_user_id;
    END IF;

    RAISE NOTICE 'Successfully backfilled user_id for % users data', user_count;
  ELSE
    RAISE NOTICE 'Multiple users detected (%). Skipping auto-backfill. Please manually assign ownership.', user_count;
  END IF;
END $$;

-- ============================================================================
-- MAKE user_id NOT NULL (after backfill)
-- ============================================================================

-- Only make NOT NULL after backfill is complete
ALTER TABLE sows ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE boars ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE farrowings ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE piglets ALTER COLUMN user_id SET NOT NULL;

-- ============================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_sows_user_id ON sows(user_id);
CREATE INDEX IF NOT EXISTS idx_boars_user_id ON boars(user_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_user_id ON farrowings(user_id);
CREATE INDEX IF NOT EXISTS idx_piglets_user_id ON piglets(user_id);

-- Create indexes for optional tables
DO $$
BEGIN
  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'matrix_treatments') THEN
    CREATE INDEX IF NOT EXISTS idx_matrix_treatments_user_id ON matrix_treatments(user_id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'protocols') THEN
    CREATE INDEX IF NOT EXISTS idx_protocols_user_id ON protocols(user_id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'scheduled_tasks') THEN
    CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_user_id ON scheduled_tasks(user_id);
  END IF;

  IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'sow_location_history') THEN
    CREATE INDEX IF NOT EXISTS idx_sow_location_history_user_id ON sow_location_history(user_id);
  END IF;
END $$;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check that user_id columns were added
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
    'matrix_treatments', 'protocols', 'scheduled_tasks',
    'sow_location_history'
  )
ORDER BY table_name;

-- ============================================================================
-- IMPORTANT NOTES
-- ============================================================================
-- After running this migration:
-- 1. All tables now have user_id column
-- 2. If you had only 1 user, their data is now assigned to them
-- 3. If you had multiple users, you need to manually assign ownership
-- 4. Now you can run the RLS policies migration (migration-add-rls-policies.sql)
