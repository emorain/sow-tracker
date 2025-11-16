-- Fix historical farrowings: Mark old farrowings as weaned/moved out
-- Run this AFTER running the comprehensive seed file

-- Update all farrowings that happened before November 2025
-- Set moved_out_of_farrowing_date to 21 days after actual_farrowing_date
UPDATE farrowings
SET moved_out_of_farrowing_date = actual_farrowing_date + INTERVAL '21 days'
WHERE actual_farrowing_date IS NOT NULL
AND actual_farrowing_date < '2025-11-01'
AND moved_out_of_farrowing_date IS NULL;

-- Verify the fix
SELECT
    'Total farrowings' as description,
    COUNT(*) as count
FROM farrowings
UNION ALL
SELECT
    'Currently nursing (should be ~10)',
    COUNT(*)
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL
UNION ALL
SELECT
    'Completed/weaned farrowings',
    COUNT(*)
FROM farrowings
WHERE moved_out_of_farrowing_date IS NOT NULL;

-- Show sum of nursing piglets (should be ~114)
SELECT SUM(live_piglets) as total_nursing_piglets
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL;
