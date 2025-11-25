-- Migration: Add Default Post-Weaning Protocol
-- Purpose: Create a protocol for sow care and breeding readiness after weaning
-- Date: 2025-01-24

-- ============================================================================
-- STEP 1: Delete any existing default post-weaning protocol
-- ============================================================================
DELETE FROM protocol_tasks WHERE protocol_id IN (
  SELECT id FROM protocols WHERE name = 'Standard Post-Weaning Protocol' AND user_id IS NULL
);
DELETE FROM protocols WHERE name = 'Standard Post-Weaning Protocol' AND user_id IS NULL;

-- ============================================================================
-- STEP 2: Insert the Default Post-Weaning Protocol
-- ============================================================================
INSERT INTO protocols (
  name,
  description,
  trigger_event,
  is_active,
  user_id
) VALUES (
  'Standard Post-Weaning Protocol',
  'Sow recovery and breeding readiness monitoring after weaning. Ensures proper return to heat and optimal condition for re-breeding.',
  'weaning',
  true,
  NULL  -- NULL = system default, available to all users
);

-- ============================================================================
-- STEP 3: Insert all protocol tasks
-- ============================================================================
DO $$
DECLARE
  weaning_protocol_id UUID;
BEGIN
  -- Get the protocol we just created
  SELECT id INTO weaning_protocol_id
  FROM protocols
  WHERE name = 'Standard Post-Weaning Protocol' AND user_id IS NULL
  LIMIT 1;

  -- Insert all protocol tasks
  INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, priority, user_id) VALUES

  -- Day 0: Weaning Day Care
  (weaning_protocol_id,
   'Post-Weaning Sow Care',
   'Weaning day: Move sow to breeding group. Reduce feed to 4-5 lbs for 24 hours to help dry up milk production and reduce mastitis risk. Monitor udder for heat, swelling, or hardness. Ensure access to fresh water. Check body condition score (target: 3.0-3.5).',
   0,
   'high',
   NULL),

  -- Day 1: Feed Adjustment
  (weaning_protocol_id,
   'Resume Full Feeding',
   'Begin increasing feed back to full ration (5-7 lbs per day depending on body condition). Gradual increase prevents digestive upset. Continue monitoring udder - most mastitis occurs in first 3 days post-weaning. Check for signs of illness or injury.',
   1,
   'medium',
   NULL),

  -- Day 3: Udder Check
  (weaning_protocol_id,
   'Final Mastitis Check',
   'Critical window for mastitis has passed. Perform final udder examination. Treat any hot, swollen, or hard quarters immediately. Sow should be on full feed now. Normal estrus should occur 3-10 days post-weaning. Watch for early heat signs.',
   3,
   'medium',
   NULL),

  -- Day 5: Heat Detection Begins
  (weaning_protocol_id,
   'Begin Heat Detection',
   'Most sows return to heat 4-7 days after weaning. Check twice daily for heat signs: restlessness, mounting behavior, vulva swelling/redness, standing reflex when pressed on back. Use boar for heat detection if available. Record any observed heat activity.',
   5,
   'high',
   NULL),

  -- Day 7: Breeding Readiness Assessment
  (weaning_protocol_id,
   'Breeding Readiness Check',
   'Peak window for return to heat. Intensify heat detection - check twice daily with boar exposure. Body condition should be optimal (3.0-3.5). If in heat, breed immediately. If no heat observed, continue daily monitoring. Most sows (80-90%) return to heat by Day 10.',
   7,
   'high',
   NULL),

  -- Day 10: Late Heat Monitor
  (weaning_protocol_id,
   'Extended Heat Monitoring',
   'If no heat observed by Day 10, investigate potential issues: poor body condition, illness, lactation stress, seasonal infertility. Consult breeding records - some sows naturally take longer. Continue monitoring daily. Consider veterinary consultation if no heat by Day 14.',
   10,
   'medium',
   NULL),

  -- Day 14: Health Investigation
  (weaning_protocol_id,
   'No Heat Investigation',
   'If sow has not shown heat by Day 14, action required. Check for: anestrus (not cycling), cystic ovaries, infection, poor nutrition. Veterinary examination recommended. May need hormone treatment. Review lactation length and weaning weight - extended lactation can delay return.',
   14,
   'high',
   NULL),

  -- Day 21: Final Assessment
  (weaning_protocol_id,
   'Final Breeding Status Review',
   'Three weeks post-weaning. If sow still not bred: complete health workup required. Consider culling if persistent anestrus without treatable cause. If bred, discontinue this protocol and begin breeding protocol. Document outcome to inform future management.',
   21,
   'medium',
   NULL);

  -- Success notification
  RAISE NOTICE '✅ Default Post-Weaning Protocol installed successfully!';
  RAISE NOTICE 'Protocol ID: %', weaning_protocol_id;
  RAISE NOTICE 'Total Tasks: 8 (Days 0-21)';
  RAISE NOTICE 'Tasks will auto-generate when weaning events are recorded.';

END $$;

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================
COMMENT ON TABLE protocols IS 'Protocol templates that auto-generate scheduled tasks. System defaults (user_id IS NULL) are visible to all users. Trigger events: breeding, farrowing, weaning, matrix, health.';
