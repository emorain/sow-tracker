-- Delete all sows and related data for a specific user
-- CAUTION: This will permanently delete all sow data for the specified user
-- Run this in Supabase SQL Editor

-- ============================================================================
-- STEP 1: Replace YOUR_USER_ID with the actual user's UUID
-- ============================================================================
-- To find your user ID, run this first:
-- SELECT id, email FROM auth.users;
-- Then copy the UUID and replace it below

DO $$
DECLARE
  target_user_id UUID := 'YOUR_USER_ID'; -- Replace with actual UUID
BEGIN
  RAISE NOTICE 'Starting deletion for user: %', target_user_id;

  -- Delete piglets (depends on farrowings)
  DELETE FROM piglets WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted piglets';

  -- Delete farrowings (depends on sows)
  DELETE FROM farrowings WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted farrowings';

  -- Delete matrix treatments (depends on sows)
  DELETE FROM matrix_treatments WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted matrix treatments';

  -- Delete sow location history (if exists)
  DELETE FROM sow_location_history WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted sow location history';

  -- Finally delete sows
  DELETE FROM sows WHERE user_id = target_user_id;
  RAISE NOTICE 'Deleted sows';

  RAISE NOTICE 'Deletion complete!';
END $$;

-- ============================================================================
-- VERIFY: Check that sows are deleted
-- ============================================================================
-- SELECT COUNT(*) FROM sows WHERE user_id = 'YOUR_USER_ID';
-- Should return 0

-- ============================================================================
-- ALTERNATIVE: One-liner for quick deletion (use carefully!)
-- ============================================================================
-- DELETE FROM piglets WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM farrowings WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM matrix_treatments WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM sow_location_history WHERE user_id = 'YOUR_USER_ID';
-- DELETE FROM sows WHERE user_id = 'YOUR_USER_ID';
