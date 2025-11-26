-- Migration: Update Matrix Treatment to support 30-day oral treatment cycle
-- Matrix is given orally with feed for ~30 days, then sows come into heat 3-5 days after stopping

-- ========================================
-- 1. ADD NEW COLUMNS
-- ========================================

-- Add treatment duration and end date tracking
ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS treatment_start_date DATE;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS treatment_end_date DATE;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS treatment_duration_days INT DEFAULT 30;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS treatment_completed BOOLEAN DEFAULT false;

-- ========================================
-- 2. MIGRATE EXISTING DATA
-- ========================================

-- Migrate existing administration_date to treatment_start_date
UPDATE matrix_treatments
SET treatment_start_date = administration_date
WHERE treatment_start_date IS NULL AND administration_date IS NOT NULL;

-- Calculate treatment_end_date for existing records (start + 30 days)
UPDATE matrix_treatments
SET treatment_end_date = treatment_start_date + INTERVAL '30 days'
WHERE treatment_end_date IS NULL AND treatment_start_date IS NOT NULL;

-- Update expected_heat_date to be end_date + 4 days (middle of 3-5 day range)
UPDATE matrix_treatments
SET expected_heat_date = treatment_end_date + INTERVAL '4 days'
WHERE treatment_end_date IS NOT NULL;

-- Mark treatments as completed if they have a breeding date or actual heat date
UPDATE matrix_treatments
SET treatment_completed = true
WHERE bred = true OR actual_heat_date IS NOT NULL;

-- ========================================
-- 3. DROP OLD TRIGGER AND CREATE NEW ONE
-- ========================================

-- Drop old trigger
DROP TRIGGER IF EXISTS set_expected_heat_date ON matrix_treatments;
DROP FUNCTION IF EXISTS calculate_expected_heat_date();

-- Create new function to calculate dates
CREATE OR REPLACE FUNCTION calculate_matrix_treatment_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- If treatment_start_date is provided but not end_date, calculate it
    IF NEW.treatment_start_date IS NOT NULL AND NEW.treatment_end_date IS NULL THEN
        -- Use treatment_duration_days if provided, otherwise default to 30
        NEW.treatment_end_date := NEW.treatment_start_date + (COALESCE(NEW.treatment_duration_days, 30) || ' days')::INTERVAL;
    END IF;

    -- Calculate expected heat date (end date + 4 days, middle of 3-5 range)
    IF NEW.treatment_end_date IS NOT NULL AND NEW.expected_heat_date IS NULL THEN
        NEW.expected_heat_date := NEW.treatment_end_date + INTERVAL '4 days';
    END IF;

    -- Auto-mark as completed if treatment end date has passed
    IF NEW.treatment_end_date IS NOT NULL AND NEW.treatment_end_date <= CURRENT_DATE THEN
        NEW.treatment_completed := true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create new trigger
CREATE TRIGGER calculate_matrix_dates
BEFORE INSERT OR UPDATE ON matrix_treatments
FOR EACH ROW EXECUTE FUNCTION calculate_matrix_treatment_dates();

-- ========================================
-- 4. UPDATE COMMENTS
-- ========================================

COMMENT ON COLUMN matrix_treatments.treatment_start_date IS 'Date when daily Matrix oral treatment began';
COMMENT ON COLUMN matrix_treatments.treatment_end_date IS 'Date when daily Matrix treatment ended';
COMMENT ON COLUMN matrix_treatments.treatment_duration_days IS 'Number of days of treatment (typically 30 days)';
COMMENT ON COLUMN matrix_treatments.treatment_completed IS 'Whether the treatment cycle has been completed';
COMMENT ON COLUMN matrix_treatments.expected_heat_date IS 'Expected heat date (treatment_end_date + 3-5 days, default +4)';
COMMENT ON COLUMN matrix_treatments.administration_date IS 'DEPRECATED: Use treatment_start_date instead';

-- ========================================
-- 5. CREATE HELPER VIEW
-- ========================================

CREATE OR REPLACE VIEW matrix_treatment_status AS
SELECT
    mt.id,
    mt.sow_id,
    mt.batch_name,
    mt.treatment_start_date,
    mt.treatment_end_date,
    mt.treatment_duration_days,
    mt.expected_heat_date,
    mt.actual_heat_date,
    mt.bred,
    mt.breeding_date,
    mt.treatment_completed,
    CURRENT_DATE - mt.treatment_start_date as days_since_start,
    CASE
        WHEN mt.treatment_end_date > CURRENT_DATE THEN mt.treatment_end_date - CURRENT_DATE
        ELSE 0
    END as days_remaining,
    CASE
        WHEN mt.bred THEN 'bred'
        WHEN mt.actual_heat_date IS NOT NULL THEN 'in_heat'
        WHEN mt.treatment_end_date > CURRENT_DATE THEN 'in_treatment'
        WHEN mt.expected_heat_date >= CURRENT_DATE THEN 'awaiting_heat'
        ELSE 'heat_window_passed'
    END as status,
    s.ear_tag,
    s.name as sow_name
FROM matrix_treatments mt
JOIN sows s ON s.id = mt.sow_id;

COMMENT ON VIEW matrix_treatment_status IS 'Current status of all Matrix treatments with calculated fields';
