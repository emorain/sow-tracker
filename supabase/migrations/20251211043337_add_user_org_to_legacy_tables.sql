-- Add user_id and organization_id to legacy tables (vaccinations, reminders)
-- This brings them in line with the multi-tenancy model used in other tables

-- ========================================
-- 1. Add columns to vaccinations table
-- ========================================

-- Add user_id column (nullable initially for backfill)
ALTER TABLE vaccinations 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id column (nullable initially)
ALTER TABLE vaccinations 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill user_id from sow_id or piglet_id
UPDATE vaccinations v
SET user_id = COALESCE(
  (SELECT user_id FROM sows WHERE id = v.sow_id),
  (SELECT user_id FROM piglets WHERE id = v.piglet_id)
)
WHERE user_id IS NULL;

-- Backfill organization_id from sow_id or piglet_id  
UPDATE vaccinations v
SET organization_id = COALESCE(
  (SELECT organization_id FROM sows WHERE id = v.sow_id),
  (SELECT organization_id FROM piglets WHERE id = v.piglet_id)
)
WHERE organization_id IS NULL;

-- Make user_id NOT NULL after backfill
ALTER TABLE vaccinations 
ALTER COLUMN user_id SET NOT NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_vaccinations_user_id ON vaccinations(user_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_org_id ON vaccinations(organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON vaccinations;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON vaccinations;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON vaccinations;

CREATE POLICY "Users can view their own vaccinations"
  ON vaccinations
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own vaccinations"
  ON vaccinations
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own vaccinations"
  ON vaccinations
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own vaccinations"
  ON vaccinations
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 2. Add columns to reminders table
-- ========================================

-- Add user_id column (nullable initially for backfill)
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add organization_id column (nullable initially)
ALTER TABLE reminders 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- Backfill user_id from sow_id
UPDATE reminders r
SET user_id = (SELECT user_id FROM sows WHERE id = r.sow_id)
WHERE user_id IS NULL AND sow_id IS NOT NULL;

-- Backfill organization_id from sow_id  
UPDATE reminders r
SET organization_id = (SELECT organization_id FROM sows WHERE id = r.sow_id)
WHERE organization_id IS NULL AND sow_id IS NOT NULL;

-- Make user_id NOT NULL after backfill (only if there's data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM reminders LIMIT 1) THEN
    ALTER TABLE reminders ALTER COLUMN user_id SET NOT NULL;
  END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON reminders(user_id);
CREATE INDEX IF NOT EXISTS idx_reminders_org_id ON reminders(organization_id);

-- Update RLS policies
DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON reminders;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON reminders;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON reminders;

CREATE POLICY "Users can view their own reminders"
  ON reminders
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own reminders"
  ON reminders
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own reminders"
  ON reminders
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own reminders"
  ON reminders
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
