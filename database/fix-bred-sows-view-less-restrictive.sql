-- Fix bred_sows_view to be less restrictive
-- Show all breeding attempts that haven't resulted in a farrowing yet

CREATE OR REPLACE VIEW bred_sows_view AS
SELECT
  ba.id,
  ba.sow_id,
  ba.breeding_date,
  COALESCE(ba.notes, 'Breeding Attempt') as batch_name,
  ba.user_id,
  'breeding_attempt' as breeding_source,

  -- Sow details
  s.ear_tag,
  s.name as sow_name,
  s.photo_url,

  -- Next incomplete task
  (
    SELECT json_build_object(
      'task_name', st.task_name,
      'due_date', st.due_date
    )
    FROM scheduled_tasks st
    WHERE st.sow_id = ba.sow_id
      AND st.user_id = ba.user_id
      AND st.is_completed = false
      AND st.due_date >= CURRENT_DATE
    ORDER BY st.due_date ASC
    LIMIT 1
  ) as next_task,

  -- Check if farrowed
  EXISTS(
    SELECT 1
    FROM farrowings f
    WHERE f.breeding_attempt_id = ba.id
      AND f.actual_farrowing_date IS NOT NULL
  ) as has_farrowed,

  -- Check if pregnancy check completed
  (ba.pregnancy_confirmed = true OR ba.pregnancy_check_date IS NOT NULL) as pregnancy_check_completed

FROM breeding_attempts ba
INNER JOIN sows s ON s.id = ba.sow_id AND s.user_id = ba.user_id
WHERE NOT EXISTS (
  -- Only exclude if there's an actual farrowing with a date
  SELECT 1
  FROM farrowings f
  WHERE f.breeding_attempt_id = ba.id
  AND f.actual_farrowing_date IS NOT NULL
);

-- Grant access to authenticated users
GRANT SELECT ON bred_sows_view TO authenticated;

COMMENT ON VIEW bred_sows_view IS 'Optimized view for bred sows page - shows all breeding attempts that havent farrowed yet, regardless of result status';
