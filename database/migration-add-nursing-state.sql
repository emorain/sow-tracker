-- Migration: Add nursing state and pre-weaning tracking to piglets table
-- Run this in Supabase SQL Editor

-- 1. Update status enum to include 'nursing' status
-- First, we need to handle existing data and update the constraint
ALTER TABLE piglets DROP CONSTRAINT IF EXISTS piglets_status_check;

ALTER TABLE piglets
ADD CONSTRAINT piglets_status_check
CHECK (status IN ('nursing', 'weaned', 'sold', 'died', 'culled'));

-- 2. Add fields for tracking early-life events
ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown'));

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS ear_notch_date DATE;

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS castration_date DATE;

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS culled_date DATE;

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS sold_date DATE;

-- 3. Make birth_weight nullable (can be recorded later)
-- Already nullable in schema

-- 4. Add comments to explain the fields
COMMENT ON COLUMN piglets.status IS 'Piglet lifecycle status: nursing (with sow), weaned (separated from sow), sold, died, culled';
COMMENT ON COLUMN piglets.sex IS 'Sex of the piglet (male, female, unknown)';
COMMENT ON COLUMN piglets.ear_notch_date IS 'Date when ear notching was performed (typically days 1-3)';
COMMENT ON COLUMN piglets.castration_date IS 'Date when male piglet was castrated (typically pre-weaning)';
COMMENT ON COLUMN piglets.culled_date IS 'Date when piglet was culled';
COMMENT ON COLUMN piglets.sold_date IS 'Date when piglet was sold';

-- 5. Create index on status for faster filtering
CREATE INDEX IF NOT EXISTS idx_piglets_status ON piglets(status);

-- 6. Update any existing 'alive' status to 'nursing' (since nursing is the new early state)
UPDATE piglets
SET status = 'nursing'
WHERE status = 'alive';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'piglets'
ORDER BY ordinal_position;
