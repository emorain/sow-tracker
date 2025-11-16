-- Diagnostic script: Check for duplicate farrowings
-- Run this in Supabase SQL Editor

-- Check total farrowings
SELECT COUNT(*) as total_farrowings FROM farrowings;

-- Check active farrowings (not weaned)
SELECT COUNT(*) as active_farrowings
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL;

-- Sum of live piglets from active farrowings (this is what the dashboard shows)
SELECT SUM(live_piglets) as total_nursing_piglets
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL;

-- Check for duplicate farrowings (same sow with multiple active farrowings)
SELECT sow_id, COUNT(*) as farrowing_count, SUM(live_piglets) as total_piglets
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL
GROUP BY sow_id
ORDER BY farrowing_count DESC;

-- Check total unique sows with active farrowings
SELECT COUNT(DISTINCT sow_id) as unique_sows_farrowing
FROM farrowings
WHERE actual_farrowing_date IS NOT NULL
AND moved_out_of_farrowing_date IS NULL;
