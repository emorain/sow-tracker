-- Force cleanup script: Remove all piglet records
-- Run this in Supabase SQL Editor as the postgres user

-- Use TRUNCATE instead of DELETE (faster and more forceful)
TRUNCATE TABLE piglets CASCADE;

-- Verify the cleanup
SELECT COUNT(*) as piglet_count FROM piglets;

-- This should return 0

-- Optional: Check if there are any RLS issues
SELECT tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'piglets';
