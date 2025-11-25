-- Migration: Add Default Farrowing Protocol
-- Purpose: Create a comprehensive farrowing protocol that auto-generates tasks after farrowing
-- Date: 2025-01-24

-- ============================================================================
-- STEP 1: Delete any existing default farrowing protocol
-- ============================================================================
DELETE FROM protocol_tasks WHERE protocol_id IN (
  SELECT id FROM protocols WHERE name = 'Standard Farrowing Protocol' AND user_id IS NULL
);
DELETE FROM protocols WHERE name = 'Standard Farrowing Protocol' AND user_id IS NULL;

-- ============================================================================
-- STEP 2: Insert the Default Farrowing Protocol
-- ============================================================================
INSERT INTO protocols (
  name,
  description,
  trigger_event,
  is_active,
  user_id
) VALUES (
  'Standard Farrowing Protocol',
  'Complete piglet care and sow monitoring from birth through weaning. Ensures proper piglet processing, health monitoring, and weaning preparation.',
  'farrowing',
  true,
  NULL  -- NULL = system default, available to all users
);

-- ============================================================================
-- STEP 3: Insert all protocol tasks
-- ============================================================================
DO $$
DECLARE
  farrowing_protocol_id UUID;
BEGIN
  -- Get the protocol we just created
  SELECT id INTO farrowing_protocol_id
  FROM protocols
  WHERE name = 'Standard Farrowing Protocol' AND user_id IS NULL
  LIMIT 1;

  -- Insert all protocol tasks
  INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, priority, user_id) VALUES

  -- Day 0: Birth Day Processing
  (farrowing_protocol_id,
   'Piglet Processing',
   'Within 24 hours of birth: ear notch/tag for identification, administer iron injection (200mg), clip needle teeth if needed, dock tails per farm policy. Ensure all piglets receive colostrum within first 6 hours. Record litter size (live, stillborn, mummies).',
   0,
   'critical',
   NULL),

  -- Day 1: Early Monitoring
  (farrowing_protocol_id,
   'Day 1 Health Check',
   'Monitor all piglets for vigor and nursing. Check sow for milk letdown - ensure all teats are functional. Watch for crushing (sow awareness). Verify iron injection sites for swelling. Ensure room temperature is 85-90°F for piglets. Check for scours (diarrhea).',
   1,
   'high',
   NULL),

  -- Day 3: Iron & Health Verification
  (farrowing_protocol_id,
   'Day 3 Iron & Health Check',
   'If iron injection not done at birth, must be completed by Day 3. Monitor piglet growth - they should be active and gaining weight. Check for signs of anemia (pale skin). Watch for leg weakness or joint infections. Ensure creep area heat lamp is working.',
   3,
   'high',
   NULL),

  -- Day 7: First Week Assessment
  (farrowing_protocol_id,
   'Week 1 Health Assessment',
   'First critical milestone. Assess individual piglet growth - weak piglets may need supplemental feeding. Check for scours and treat if present. Monitor sow body condition and feed intake. Inspect farrowing crate for safety hazards. Record any mortalities with cause if known.',
   7,
   'medium',
   NULL),

  -- Day 10: Castration Window (if applicable)
  (farrowing_protocol_id,
   'Castration (If Required)',
   'Optimal window for castration (Days 7-10). Required for male piglets not being kept for breeding. Minimize stress and infection risk. Ensure proper sanitation. Some farms defer this to weaning or eliminate based on market requirements.',
   10,
   'medium',
   NULL),

  -- Day 14: Mid-Nursing Check
  (farrowing_protocol_id,
   'Mid-Nursing Health Check',
   'Halfway to weaning. Piglets should be doubling birth weight. Introduce or encourage creep feed to prepare digestive system for solid food. Check sow body condition - she should be maintaining condition, not losing excessive weight. Monitor water intake.',
   14,
   'medium',
   NULL),

  -- Day 18: Creep Feed Push
  (farrowing_protocol_id,
   'Creep Feed Training',
   'Actively encourage piglets to eat creep feed. Use fresh, palatable starter feed. Early consumption reduces weaning stress and improves post-weaning growth. Ensure feeders are accessible and clean. Some piglets learn from observing others.',
   18,
   'medium',
   NULL),

  -- Day 21: Weaning Preparation (Early Wean Option)
  (farrowing_protocol_id,
   'Weaning Preparation',
   'Standard early weaning age. Piglets should weigh 10-12 lbs minimum. Verify all are eating creep feed. Prepare nursery facilities (clean, warm, feeders/waterers ready). Some farms wean at 21 days, others wait until Day 28. Plan based on piglet size and farm system.',
   21,
   'high',
   NULL),

  -- Day 28: Standard Weaning Day
  (farrowing_protocol_id,
   'Weaning Day',
   'Standard weaning age (28 days). Move piglets to nursery. Target weight: 12-15 lbs. Ensure smooth transition - minimize stress. Record final litter size and average weight. Move sow back to breeding group. Clean and disinfect farrowing crate. Monitor sow for mastitis risk.',
   28,
   'critical',
   NULL);

  -- Success notification
  RAISE NOTICE '✅ Default Farrowing Protocol installed successfully!';
  RAISE NOTICE 'Protocol ID: %', farrowing_protocol_id;
  RAISE NOTICE 'Total Tasks: 9 (Days 0-28)';
  RAISE NOTICE 'Tasks will auto-generate when farrowing events are recorded.';

END $$;

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================
COMMENT ON TABLE protocols IS 'Protocol templates that auto-generate scheduled tasks. System defaults (user_id IS NULL) are visible to all users. Trigger events: breeding, farrowing, weaning, matrix, health.';
