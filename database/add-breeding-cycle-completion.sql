-- Migration: Add Breeding Cycle Completion Tracking
-- Purpose: Track when AI breeding cycles are complete to properly schedule pregnancy checks
-- Date: 2025-12-02

-- ============================================================================
-- Add breeding_cycle_complete and last_dose_date to breeding_attempts
-- ============================================================================

ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS breeding_cycle_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS breeding_cycle_completed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_dose_date DATE;

COMMENT ON COLUMN breeding_attempts.breeding_cycle_complete IS 'TRUE when all AI doses are complete and ready for pregnancy check countdown';
COMMENT ON COLUMN breeding_attempts.breeding_cycle_completed_at IS 'Timestamp when breeding cycle was marked complete (manual or auto)';
COMMENT ON COLUMN breeding_attempts.last_dose_date IS 'Date of the last AI dose (for pregnancy check scheduling)';

-- ============================================================================
-- Set existing natural breedings as complete (they don't need doses)
-- ============================================================================

UPDATE breeding_attempts
SET
  breeding_cycle_complete = TRUE,
  breeding_cycle_completed_at = breeding_date::timestamp,
  last_dose_date = breeding_date
WHERE breeding_method = 'natural'
  AND breeding_cycle_complete IS NOT TRUE;

-- ============================================================================
-- For existing AI breedings without follow-up doses, mark as complete
-- ============================================================================

-- Find AI breeding attempts that have no follow-up doses and their last dose was >2 days ago
UPDATE breeding_attempts ba
SET
  breeding_cycle_complete = TRUE,
  breeding_cycle_completed_at = NOW(),
  last_dose_date = breeding_date
WHERE ba.breeding_method = 'ai'
  AND ba.breeding_cycle_complete IS NOT TRUE
  AND ba.breeding_date < CURRENT_DATE - INTERVAL '2 days'
  AND NOT EXISTS (
    SELECT 1 FROM ai_doses ad
    WHERE ad.breeding_attempt_id = ba.id
  );

-- ============================================================================
-- For AI breedings WITH follow-up doses, set last_dose_date and complete if >2 days
-- ============================================================================

WITH last_doses AS (
  SELECT
    ad.breeding_attempt_id,
    MAX(ad.dose_date) as last_dose_date
  FROM ai_doses ad
  GROUP BY ad.breeding_attempt_id
)
UPDATE breeding_attempts ba
SET
  last_dose_date = ld.last_dose_date,
  breeding_cycle_complete = CASE
    WHEN ld.last_dose_date < CURRENT_DATE - INTERVAL '2 days' THEN TRUE
    ELSE ba.breeding_cycle_complete
  END,
  breeding_cycle_completed_at = CASE
    WHEN ld.last_dose_date < CURRENT_DATE - INTERVAL '2 days'
         AND ba.breeding_cycle_complete IS NOT TRUE
    THEN NOW()
    ELSE ba.breeding_cycle_completed_at
  END
FROM last_doses ld
WHERE ba.id = ld.breeding_attempt_id
  AND ba.breeding_method = 'ai';

-- ============================================================================
-- Create index for querying incomplete breeding cycles
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_breeding_attempts_cycle_complete
ON breeding_attempts(breeding_cycle_complete, breeding_method, last_dose_date)
WHERE breeding_cycle_complete = FALSE;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Breeding cycle completion tracking added successfully!';
  RAISE NOTICE 'Natural breedings are marked complete automatically.';
  RAISE NOTICE 'AI breedings auto-complete after 2 days of no new doses.';
  RAISE NOTICE 'Users can also manually mark breeding cycles complete.';
END $$;
