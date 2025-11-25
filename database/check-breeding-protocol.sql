-- Check if Breeding Protocol exists and is properly configured

-- 1. Check if protocol exists
SELECT
  id,
  name,
  trigger_event,
  is_active,
  user_id,
  created_at
FROM protocols
WHERE trigger_event = 'breeding';

-- 2. Check how many tasks are in the breeding protocol
SELECT
  p.name as protocol_name,
  COUNT(pt.id) as task_count
FROM protocols p
LEFT JOIN protocol_tasks pt ON p.id = pt.protocol_id
WHERE p.trigger_event = 'breeding'
GROUP BY p.id, p.name;

-- 3. Show all breeding protocol tasks
SELECT
  pt.task_name,
  pt.days_offset,
  pt.priority,
  pt.user_id
FROM protocol_tasks pt
JOIN protocols p ON p.id = pt.protocol_id
WHERE p.trigger_event = 'breeding'
ORDER BY pt.days_offset;
