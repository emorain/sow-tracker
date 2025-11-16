-- Complete cleanup script: Remove all farrowings and piglets
-- Run this in Supabase SQL Editor
-- Then re-run the comprehensive sows seed file ONCE

-- Delete all piglets first (though CASCADE should handle it)
TRUNCATE TABLE piglets CASCADE;

-- Delete all farrowings
TRUNCATE TABLE farrowings CASCADE;

-- Delete all matrix treatments (if any)
TRUNCATE TABLE matrix_treatments CASCADE;

-- Verify cleanup
SELECT 'Piglets' as table_name, COUNT(*) as row_count FROM piglets
UNION ALL
SELECT 'Farrowings', COUNT(*) FROM farrowings
UNION ALL
SELECT 'Matrix Treatments', COUNT(*) FROM matrix_treatments
UNION ALL
SELECT 'Sows (should still have 40)', COUNT(*) FROM sows;

-- After running this, go run database/sample-data-comprehensive-40-sows.sql ONCE
