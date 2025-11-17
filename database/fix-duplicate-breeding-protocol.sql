-- Fix: Remove duplicate breeding protocol
-- This script identifies and removes the empty duplicate

-- First, let's see what we have
SELECT
  p.id,
  p.name,
  p.trigger_event,
  p.is_active,
  COUNT(pt.id) as task_count
FROM protocols p
LEFT JOIN protocol_tasks pt ON p.id = pt.protocol_id
WHERE p.trigger_event = 'breeding'
GROUP BY p.id, p.name, p.trigger_event, p.is_active
ORDER BY task_count DESC;

-- Delete the breeding protocol with 0 tasks (the empty duplicate)
DELETE FROM protocols
WHERE trigger_event = 'breeding'
AND id NOT IN (
  -- Keep the one with tasks
  SELECT p.id
  FROM protocols p
  INNER JOIN protocol_tasks pt ON p.id = pt.protocol_id
  WHERE p.trigger_event = 'breeding'
  GROUP BY p.id
  HAVING COUNT(pt.id) > 0
  LIMIT 1
);

-- Verify we now have only one breeding protocol with tasks
SELECT
  p.id,
  p.name,
  p.trigger_event,
  p.is_active,
  COUNT(pt.id) as task_count
FROM protocols p
LEFT JOIN protocol_tasks pt ON p.id = pt.protocol_id
WHERE p.trigger_event = 'breeding'
GROUP BY p.id, p.name, p.trigger_event, p.is_active;
