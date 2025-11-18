-- Migration: Add farm settings table
-- Run this in Supabase SQL Editor

-- 1. Create farm_settings table
CREATE TABLE IF NOT EXISTS farm_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Farm information
  farm_name VARCHAR(255),

  -- Compliance settings
  prop12_compliance_enabled BOOLEAN DEFAULT false,

  -- Regional settings
  timezone VARCHAR(50) DEFAULT 'America/Los_Angeles',

  -- Unit preferences
  weight_unit VARCHAR(10) DEFAULT 'kg' CHECK (weight_unit IN ('kg', 'lbs')),
  measurement_unit VARCHAR(10) DEFAULT 'feet' CHECK (measurement_unit IN ('feet', 'meters')),

  -- Notification preferences
  email_notifications_enabled BOOLEAN DEFAULT true,
  task_reminders_enabled BOOLEAN DEFAULT true,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. One settings record per user
CREATE UNIQUE INDEX IF NOT EXISTS idx_farm_settings_user_id ON farm_settings(user_id);

-- 3. Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_farm_settings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER farm_settings_updated_at
  BEFORE UPDATE ON farm_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_farm_settings_timestamp();

-- 4. Create default settings for existing users
INSERT INTO farm_settings (user_id, farm_name)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'farm_name', 'My Farm')
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM farm_settings)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Add comments
COMMENT ON TABLE farm_settings IS 'Farm-level settings and preferences for each user';
COMMENT ON COLUMN farm_settings.prop12_compliance_enabled IS 'Enable California Prop 12 compliance features (space tracking, audit trails, etc.)';
COMMENT ON COLUMN farm_settings.weight_unit IS 'Preferred weight unit (kg or lbs)';
COMMENT ON COLUMN farm_settings.measurement_unit IS 'Preferred measurement unit for pen sizes (feet or meters)';

-- Verify the changes
SELECT * FROM farm_settings LIMIT 5;
