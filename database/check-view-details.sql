-- Get detailed view of first 5 records from bred_sows_view
SELECT
  id,
  sow_id,
  ear_tag,
  sow_name,
  breeding_date,
  user_id,
  has_farrowed,
  pregnancy_check_completed
FROM bred_sows_view
ORDER BY breeding_date DESC
LIMIT 5;

-- Compare with raw breeding_attempts data for those same records
SELECT
  ba.id,
  ba.sow_id,
  ba.user_id as ba_user_id,
  s.ear_tag,
  s.user_id as sow_user_id,
  ba.breeding_date
FROM breeding_attempts ba
LEFT JOIN sows s ON s.id = ba.sow_id
WHERE NOT EXISTS (
  SELECT 1 FROM farrowings f
  WHERE f.breeding_attempt_id = ba.id
  AND f.actual_farrowing_date IS NOT NULL
)
ORDER BY ba.breeding_date DESC
LIMIT 5;
