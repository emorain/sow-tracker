-- Migration: Add Default Breeding Protocol
-- This creates a breeding protocol that auto-applies when sows are marked as bred
-- to track pregnancy checks and breeding success

-- Insert default "Breeding Management Protocol"
INSERT INTO protocols (name, description, trigger_event, is_active)
VALUES (
  'Breeding Management Protocol',
  'Standard pregnancy monitoring tasks after breeding including heat detection, ultrasound checks, and farrowing preparation',
  'breeding',
  true
)
ON CONFLICT DO NOTHING;

-- Get the protocol ID for default tasks
DO $$
DECLARE
  breeding_protocol_id UUID;
BEGIN
  SELECT id INTO breeding_protocol_id FROM protocols WHERE name = 'Breeding Management Protocol' LIMIT 1;

  IF breeding_protocol_id IS NOT NULL THEN
    -- Insert default breeding protocol tasks
    INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, is_required, task_order)
    VALUES
      (breeding_protocol_id, 'Heat Detection Check', 'Check if sow returns to heat - if yes, breeding failed and needs re-breeding', 21, true, 1),
      (breeding_protocol_id, 'Ultrasound Pregnancy Check', 'Perform ultrasound to confirm pregnancy', 28, true, 2),
      (breeding_protocol_id, 'Visual Pregnancy Confirmation', 'Visual check for pregnancy development', 60, false, 3),
      (breeding_protocol_id, 'Prepare Farrowing Pen', 'Move pregnant sow to farrowing pen and prepare for delivery', 107, true, 4),
      (breeding_protocol_id, 'Expected Farrowing Date', 'Monitor for signs of farrowing - gestation is typically 114 days', 114, true, 5)
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- Verification
SELECT
  p.name as protocol_name,
  p.trigger_event,
  COUNT(pt.id) as task_count
FROM protocols p
LEFT JOIN protocol_tasks pt ON p.id = pt.protocol_id
WHERE p.trigger_event = 'breeding'
GROUP BY p.id, p.name, p.trigger_event;
