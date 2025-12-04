-- Migration: Add text fields for sire and dam names
-- Allows tracking lineage even when sire/dam are not on the farm

-- Add text fields for sire and dam names to sows table
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS sire_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS dam_name VARCHAR(100);

-- Add text fields for sire and dam names to boars table
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS sire_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS dam_name VARCHAR(100);

-- Add text fields for sire and dam names to piglets table
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS sire_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS dam_name VARCHAR(100);

-- Add comments to clarify usage
COMMENT ON COLUMN sows.sire_name IS 'Name of sire (father) - used when sire is not on farm';
COMMENT ON COLUMN sows.dam_name IS 'Name of dam (mother) - used when dam is not on farm';
COMMENT ON COLUMN boars.sire_name IS 'Name of sire (father) - used when sire is not on farm';
COMMENT ON COLUMN boars.dam_name IS 'Name of dam (mother) - used when dam is not on farm';
COMMENT ON COLUMN piglets.sire_name IS 'Name of sire (father) - used when sire is not on farm';
COMMENT ON COLUMN piglets.dam_name IS 'Name of dam (mother) - used when dam is not on farm';
