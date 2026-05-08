-- Migration: Fix Breeding Attempt Status After Farrowing
-- Purpose: Add 'farrowed' status and update breeding attempts when sow farrows
-- Date: 2026-03-03
-- Issue: Breeding attempts remain 'pregnant' even after farrowing, causing confusion when re-breeding

-- ============================================================================
-- 1. Add 'farrowed' to the result enum
-- ============================================================================

-- Drop the existing constraint
ALTER TABLE breeding_attempts
DROP CONSTRAINT IF EXISTS breeding_attempts_result_check;

-- Add the new constraint with 'farrowed' status
ALTER TABLE breeding_attempts
ADD CONSTRAINT breeding_attempts_result_check
CHECK (result IN ('pending', 'pregnant', 'returned_to_heat', 'aborted', 'farrowed', 'unknown'));

COMMENT ON COLUMN breeding_attempts.result IS 'Outcome of this breeding attempt: pending (not yet checked), pregnant (confirmed pregnant), farrowed (pregnancy resulted in farrowing), returned_to_heat (not pregnant), aborted (pregnancy lost), unknown';

-- ============================================================================
-- 2. Update existing breeding attempts that have farrowed
-- ============================================================================

-- Mark breeding attempts as 'farrowed' if their linked farrowing has actual_farrowing_date
UPDATE breeding_attempts ba
SET result = 'farrowed'
FROM farrowings f
WHERE ba.farrowing_id = f.id
  AND f.actual_farrowing_date IS NOT NULL
  AND ba.result = 'pregnant';

-- ============================================================================
-- 3. Create trigger to automatically update breeding attempt when sow farrows
-- ============================================================================

CREATE OR REPLACE FUNCTION update_breeding_attempt_on_farrowing()
RETURNS TRIGGER AS $$
BEGIN
  -- When a farrowing record gets an actual_farrowing_date, mark the breeding attempt as 'farrowed'
  IF NEW.actual_farrowing_date IS NOT NULL AND (OLD.actual_farrowing_date IS NULL OR OLD.actual_farrowing_date IS DISTINCT FROM NEW.actual_farrowing_date) THEN
    -- Update the breeding attempt linked to this farrowing
    UPDATE breeding_attempts
    SET result = 'farrowed'
    WHERE id = NEW.breeding_attempt_id
      AND result = 'pregnant';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop trigger if it exists
DROP TRIGGER IF EXISTS trigger_update_breeding_attempt_on_farrowing ON farrowings;

-- Create the trigger
CREATE TRIGGER trigger_update_breeding_attempt_on_farrowing
  AFTER UPDATE ON farrowings
  FOR EACH ROW
  EXECUTE FUNCTION update_breeding_attempt_on_farrowing();

COMMENT ON FUNCTION update_breeding_attempt_on_farrowing() IS 'Automatically marks breeding attempt as farrowed when farrowing is recorded';

-- ============================================================================
-- 4. Success message
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Breeding attempt farrowed status fix applied successfully!';
  RAISE NOTICE 'Breeding attempts will now be marked as "farrowed" when the sow gives birth.';
  RAISE NOTICE 'This prevents old pregnancies from showing as active when re-breeding.';
END $$;
