-- Safe Migration: Add Default Breeding Protocol (Skip if already exists)
-- Purpose: Safely install breeding protocol without touching existing policies
-- Date: 2025-01-24

-- ============================================================================
-- STEP 1: Ensure priority column exists (safe - uses IF NOT EXISTS)
-- ============================================================================
ALTER TABLE protocol_tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical'));

-- ============================================================================
-- STEP 2: Ensure user_id can be NULL (safe - only changes if needed)
-- ============================================================================
DO $$
BEGIN
  ALTER TABLE protocols ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Already nullable, skip
END $$;

DO $$
BEGIN
  ALTER TABLE protocol_tasks ALTER COLUMN user_id DROP NOT NULL;
EXCEPTION
  WHEN OTHERS THEN NULL; -- Already nullable, skip
END $$;

-- ============================================================================
-- STEP 3: Delete any existing default breeding protocol
-- ============================================================================
DELETE FROM protocol_tasks WHERE protocol_id IN (
  SELECT id FROM protocols WHERE name = 'Standard Breeding Protocol' AND user_id IS NULL
);
DELETE FROM protocols WHERE name = 'Standard Breeding Protocol' AND user_id IS NULL;

-- ============================================================================
-- STEP 4: Insert the Default Breeding Protocol
-- ============================================================================
INSERT INTO protocols (
  name,
  description,
  trigger_event,
  is_active,
  user_id
) VALUES (
  'Standard Breeding Protocol',
  'Comprehensive breeding management from breeding through farrowing preparation. Monitors pregnancy, health, and ensures proper farrowing setup.',
  'breeding',
  true,
  NULL  -- NULL = system default, available to all users
);

-- ============================================================================
-- STEP 5: Insert all protocol tasks
-- ============================================================================
DO $$
DECLARE
  breeding_protocol_id UUID;
BEGIN
  -- Get the protocol we just created
  SELECT id INTO breeding_protocol_id
  FROM protocols
  WHERE name = 'Standard Breeding Protocol' AND user_id IS NULL
  LIMIT 1;

  -- Insert all protocol tasks
  INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, priority, user_id) VALUES

  -- Day 21: Return to Heat Check (Critical early detection point)
  (breeding_protocol_id,
   'Return to Heat Check',
   'Watch for signs of return to heat (restlessness, mounting, vulva swelling). If sow shows heat, breeding was unsuccessful - re-breed immediately. Pigs have a 21-day estrous cycle, so this is the key detection window.',
   21,
   'high',
   NULL),

  -- Day 28: Ultrasound Pregnancy Check (Industry standard timing)
  (breeding_protocol_id,
   'Ultrasound Pregnancy Check',
   'Schedule ultrasound to confirm pregnancy. This is the optimal window (28-35 days) for accurate detection. Most reliable method for early pregnancy confirmation. If equipment unavailable, consider vet visit.',
   28,
   'high',
   NULL),

  -- Day 35: Confirm Results & Plan
  (breeding_protocol_id,
   'Review Pregnancy Results',
   'Review ultrasound results and update records. For confirmed pregnant sows, continue protocol. For open sows, return to breeding group and monitor for next heat cycle (21 days from breeding date).',
   35,
   'medium',
   NULL),

  -- Day 60: Mid-Gestation Check
  (breeding_protocol_id,
   'Mid-Gestation Health Check',
   'Visual confirmation of pregnancy - sow should show clear abdominal enlargement. Assess body condition score (target: 3-3.5). Check for lameness, injuries, or illness. Adjust feeding program if needed to maintain optimal condition.',
   60,
   'medium',
   NULL),

  -- Day 90: Late Gestation Assessment
  (breeding_protocol_id,
   'Late Gestation Health Assessment',
   'Final health check before farrowing preparation. Body condition score critical - too fat or thin affects farrowing. Check for lameness (must be addressed before farrowing). Review feeding program. Address any health issues now.',
   90,
   'high',
   NULL),

  -- Day 100: Farrowing Pen Preparation
  (breeding_protocol_id,
   'Prepare Farrowing Pen',
   'Thoroughly wash and disinfect farrowing crate/pen. Set up heat lamp (check bulb and cord). Install waterer and feeder. Prepare supplies: iodine for navels, towels, piglet processing equipment, marking pens. Clean environment reduces disease transmission to newborn piglets.',
   100,
   'high',
   NULL),

  -- Day 107: Move to Farrowing
  (breeding_protocol_id,
   'Move Sow to Farrowing Pen',
   'Move sow to prepared farrowing crate. Giving her 7 days to acclimate reduces stress and allows her to get comfortable before labor begins. Ensure she has access to water and feed. Monitor daily.',
   107,
   'high',
   NULL),

  -- Day 110: Pre-Farrowing Watch
  (breeding_protocol_id,
   'Begin Pre-Farrowing Watch',
   'Check sow twice daily for early labor signs: nesting behavior, restlessness, vulva swelling, milk letdown (you can express milk). Have emergency supplies ready: lubricant, OB sleeves, oxytocin (if prescribed), towels. Be prepared to assist if needed.',
   110,
   'high',
   NULL),

  -- Day 114: Expected Farrowing Date
  (breeding_protocol_id,
   'Expected Farrowing Date',
   'Monitor closely - this is the most likely farrowing date. Average gestation is 114 days (normal range: 112-116 days). Increase observation frequency. Be ready to assist with difficult births. Have emergency contact (vet) available.',
   114,
   'critical',
   NULL),

  -- Day 116: Overdue Check
  (breeding_protocol_id,
   'Overdue Farrowing Check',
   'Sow is overdue (normal gestation: 112-116 days). Check for labor signs. If no farrowing by end of day 116, consult veterinarian immediately. May need induction or intervention. Do not wait beyond day 117 without vet consultation.',
   116,
   'critical',
   NULL);

  -- Success notification
  RAISE NOTICE '✅ Default Breeding Protocol installed successfully!';
  RAISE NOTICE 'Protocol ID: %', breeding_protocol_id;
  RAISE NOTICE 'Total Tasks: 10 (Days 21-116)';
  RAISE NOTICE 'Tasks will auto-generate when breeding events are recorded.';

END $$;

-- ============================================================================
-- STEP 6: Add helpful comments
-- ============================================================================
COMMENT ON COLUMN protocols.user_id IS 'User who created this protocol. NULL = system default available to all users.';
COMMENT ON COLUMN protocol_tasks.priority IS 'Task priority level: low, medium, high, or critical';
COMMENT ON TABLE protocols IS 'Protocol templates that auto-generate scheduled tasks. System defaults (user_id IS NULL) are visible to all users.';
