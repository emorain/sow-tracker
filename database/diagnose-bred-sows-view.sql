-- Diagnostic query to find why bred_sows_view shows 0 results
-- This will show which breeding_attempts have missing or mismatched sows

SELECT
  ba.id as breeding_attempt_id,
  ba.sow_id,
  ba.breeding_date,
  ba.result,
  s.ear_tag,
  s.user_id as sow_user_id,
  ba.user_id as ba_user_id,
  CASE
    WHEN s.id IS NULL THEN 'SOW MISSING - breeding_attempt references non-existent sow'
    WHEN s.user_id != ba.user_id THEN 'USER_ID MISMATCH - sow and breeding_attempt have different user_ids'
    ELSE 'OK - should appear in view'
  END as status,
  -- Check if there's a farrowing
  EXISTS(
    SELECT 1
    FROM farrowings f
    WHERE f.breeding_attempt_id = ba.id
    AND f.actual_farrowing_date IS NOT NULL
  ) as has_farrowed
FROM breeding_attempts ba
LEFT JOIN sows s ON s.id = ba.sow_id
ORDER BY status, ba.created_at DESC;
