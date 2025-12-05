-- Migration: Add Default Matrix Synchronization Protocol
-- Purpose: Create a protocol for Matrix (altrenogest) estrus synchronization management
-- Date: 2025-01-24

-- ============================================================================
-- STEP 1: Delete any existing default matrix protocol
-- ============================================================================
DELETE FROM protocol_tasks WHERE protocol_id IN (
  SELECT id FROM protocols WHERE name = 'Standard Matrix Synchronization Protocol' AND user_id IS NULL
);
DELETE FROM protocols WHERE name = 'Standard Matrix Synchronization Protocol' AND user_id IS NULL;

-- ============================================================================
-- STEP 2: Insert the Default Matrix Synchronization Protocol
-- ============================================================================
INSERT INTO protocols (
  name,
  description,
  trigger_event,
  is_active,
  user_id
) VALUES (
  'Standard Matrix Synchronization Protocol',
  'Complete management protocol for Matrix (altrenogest) estrus synchronization. Tracks daily administration, monitors for heat onset, and coordinates batch breeding.',
  'matrix',
  true,
  NULL  -- NULL = system default, available to all users
);

-- ============================================================================
-- STEP 3: Insert all protocol tasks
-- ============================================================================
DO $$
DECLARE
  matrix_protocol_id UUID;
BEGIN
  -- Get the protocol we just created
  SELECT id INTO matrix_protocol_id
  FROM protocols
  WHERE name = 'Standard Matrix Synchronization Protocol' AND user_id IS NULL
  LIMIT 1;

  -- Insert all protocol tasks
  INSERT INTO protocol_tasks (protocol_id, task_name, description, days_offset, priority, user_id) VALUES

  -- Day 0: Treatment Initiation
  (matrix_protocol_id,
   'Matrix Treatment Day 1',
   'Begin Matrix (altrenogest) treatment. Standard protocol: 6.8ml per sow daily for 14-18 days. Administer as top-dress on feed - ensure complete consumption. Record all treated sows in batch. Keep sows grouped separately during treatment. Mark calendar for daily administration.',
   0,
   'critical',
   NULL),

  -- Day 7: Mid-Treatment Check
  (matrix_protocol_id,
   'Mid-Treatment Compliance Check',
   'Verify treatment compliance at midpoint. Confirm all sows consuming daily Matrix dose. Check for any sows showing heat (indicates treatment failure). Review batch records. Ensure adequate Matrix supply for remaining treatment days. Address any sows with poor appetite.',
   7,
   'high',
   NULL),

  -- Day 13: Final Dose Preparation
  (matrix_protocol_id,
   'Final Dose Preparation',
   'Last day of Matrix treatment (Day 14) approaching. Verify all equipment for heat detection is ready: heat detection aids, marking crayons/spray, boar access. Prepare breeding schedule. Alert breeding staff. Most sows will show heat 4-7 days after last dose.',
   13,
   'high',
   NULL),

  -- Day 14: Last Matrix Dose
  (matrix_protocol_id,
   'Final Matrix Dose',
   'Administer final Matrix dose. This is Day 14-18 depending on protocol length (most use 14 days). Mark this date clearly - expected heat begins 4-7 days from today (Days 18-21). Begin twice-daily heat detection starting Day 17. Prepare breeding facilities and supplies.',
   14,
   'critical',
   NULL),

  -- Day 17: Heat Detection Begins
  (matrix_protocol_id,
   'Begin Intensive Heat Detection',
   'Start twice-daily heat detection. Sows may begin showing heat as early as 3-4 days post-treatment. Use boar exposure for best results. Check for: restlessness, mounting, vulva swelling, standing reflex. Record any early-onset heat. Breed sows as they come into heat.',
   17,
   'high',
   NULL),

  -- Day 19: Peak Heat Expected (Day 5 post-treatment)
  (matrix_protocol_id,
   'Peak Synchronization Window',
   'Peak heat synchronization window (Days 4-6 post-treatment). Most sows (70-90%) should show heat during this 3-day window. Intensify detection - check morning and evening with boar. Breed sows at first standing heat. Track synchronization rate for batch evaluation.',
   19,
   'critical',
   NULL),

  -- Day 21: Extended Detection
  (matrix_protocol_id,
   'Extended Heat Detection',
   'Late synchronization window (Day 7 post-treatment). Some sows naturally cycle later. Continue twice-daily detection. Any sows not in heat by Day 21 need evaluation. Check for: poor body condition, illness, treatment compliance issues. Most batches achieve 85-95% synchronization.',
   21,
   'high',
   NULL),

  -- Day 24: Final Batch Assessment
  (matrix_protocol_id,
   'Batch Synchronization Review',
   'Final assessment of Matrix batch (Day 10 post-treatment). Calculate synchronization rate: (sows bred / sows treated) × 100. Target: ≥85%. Evaluate any non-responding sows - may need vet exam or re-treatment. Document batch results for program evaluation.',
   24,
   'medium',
   NULL),

  -- Day 28: Breeding Confirmation Start
  (matrix_protocol_id,
   'Post-Breeding Monitoring Begins',
   'Two weeks post-breeding for early-responding sows. Begin monitoring for return to heat (21-day cycle). Any sow returning to heat was not successfully bred - re-breed immediately. Continue monitoring all batch sows through their return-to-heat window.',
   28,
   'medium',
   NULL);

  -- Success notification
  RAISE NOTICE '✅ Default Matrix Synchronization Protocol installed successfully!';
  RAISE NOTICE 'Protocol ID: %', matrix_protocol_id;
  RAISE NOTICE 'Total Tasks: 9 (Days 0-28)';
  RAISE NOTICE 'Tasks will auto-generate when Matrix treatments are recorded.';

END $$;

-- ============================================================================
-- STEP 4: Add helpful comments
-- ============================================================================
COMMENT ON TABLE protocols IS 'Protocol templates that auto-generate scheduled tasks. System defaults (user_id IS NULL) are visible to all users. Trigger events: breeding, farrowing, weaning, matrix, health.';
