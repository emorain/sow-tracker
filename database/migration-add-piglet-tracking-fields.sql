-- Migration: Add weaning weight and identification fields to piglets table
-- Run this in Supabase SQL Editor

-- Add weaning_weight to track weight at weaning time
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS weaning_weight DECIMAL(5,2);

-- Add ear_tag for piglet identification
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS ear_tag VARCHAR(50);

-- Add ear notch fields (similar to sows table)
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS right_ear_notch INTEGER;

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS left_ear_notch INTEGER;

-- Add comments to explain the fields
COMMENT ON COLUMN piglets.weaning_weight IS 'Weight of piglet at weaning time (kg)';
COMMENT ON COLUMN piglets.ear_tag IS 'Unique ear tag identifier for the piglet';
COMMENT ON COLUMN piglets.right_ear_notch IS 'Right ear notch number for identification';
COMMENT ON COLUMN piglets.left_ear_notch IS 'Left ear notch number for identification';

-- Create index on ear_tag for faster lookups
CREATE INDEX IF NOT EXISTS idx_piglets_ear_tag ON piglets(ear_tag);

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'piglets'
ORDER BY ordinal_position;
