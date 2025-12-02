-- Test the bred_sows_view to see if it returns results
-- This should show all records from the view without user filtering

SELECT
  id,
  sow_id,
  ear_tag,
  sow_name,
  breeding_date,
  batch_name,
  user_id,
  has_farrowed,
  pregnancy_check_completed
FROM bred_sows_view
ORDER BY breeding_date DESC;

-- Count by user_id to see the distribution
SELECT
  user_id,
  COUNT(*) as bred_sow_count
FROM bred_sows_view
GROUP BY user_id;
