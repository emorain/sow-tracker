-- Add ear notch auto-tracker columns to farm_settings table
ALTER TABLE farm_settings
ADD COLUMN IF NOT EXISTS ear_notch_current_litter integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS ear_notch_last_reset_date timestamp with time zone DEFAULT now();

-- Add comment to explain the columns
COMMENT ON COLUMN farm_settings.ear_notch_current_litter IS 'Current litter number for auto ear notching (right ear notch value)';
COMMENT ON COLUMN farm_settings.ear_notch_last_reset_date IS 'Last time the ear notch tracker was reset';
