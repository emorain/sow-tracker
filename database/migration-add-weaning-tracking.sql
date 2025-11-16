-- Migration: Add weaning/move-out tracking to farrowings table
-- Run this in Supabase SQL Editor

-- Add moved_out_of_farrowing_date to track when sows leave the farrowing house
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS moved_out_of_farrowing_date DATE;

-- Add comment to explain the field
COMMENT ON COLUMN farrowings.moved_out_of_farrowing_date IS 'Date when sow was moved out of farrowing crate after weaning';

-- Verify the change
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'farrowings'
ORDER BY ordinal_position;
