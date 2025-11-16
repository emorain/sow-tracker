-- Add fields to track farrowing house movement
-- Run this in your Supabase SQL Editor

ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS moved_to_farrowing_date DATE,
ADD COLUMN IF NOT EXISTS farrowing_crate VARCHAR(50);

-- Add comment to explain the fields
COMMENT ON COLUMN farrowings.moved_to_farrowing_date IS 'Date when the sow was moved to the farrowing house';
COMMENT ON COLUMN farrowings.farrowing_crate IS 'Crate number where the sow is housed for farrowing';
