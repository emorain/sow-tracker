-- Cleanup script: Remove all piglet records
-- Run this in Supabase SQL Editor

-- Delete all existing piglet records
-- (New workflow: piglets are only created when weaning, not during nursing)
DELETE FROM piglets;

-- Verify the cleanup
SELECT COUNT(*) as piglet_count FROM piglets;

-- Check farrowings are still intact
SELECT COUNT(*) as farrowing_count FROM farrowings;
SELECT COUNT(*) as active_farrowings FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL;
