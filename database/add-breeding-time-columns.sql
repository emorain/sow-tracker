-- ============================================================================
-- ADD TIME TRACKING TO BREEDING ATTEMPTS AND AI DOSES
-- ============================================================================
-- This migration adds timestamp columns to track the exact time of breeding
-- events and AI doses for better record-keeping
-- ============================================================================

-- Add breeding_time column to breeding_attempts table
ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS breeding_time TIMESTAMP WITH TIME ZONE;

-- Add dose_time column to ai_doses table
ALTER TABLE ai_doses
ADD COLUMN IF NOT EXISTS dose_time TIMESTAMP WITH TIME ZONE;

-- Add comment to explain the columns
COMMENT ON COLUMN breeding_attempts.breeding_time IS 'Exact timestamp of when breeding occurred (date + time)';
COMMENT ON COLUMN ai_doses.dose_time IS 'Exact timestamp of when AI dose was administered (date + time)';

-- Create indexes for better query performance on time-based queries
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_breeding_time ON breeding_attempts(breeding_time);
CREATE INDEX IF NOT EXISTS idx_ai_doses_dose_time ON ai_doses(dose_time);

-- ============================================================================
-- BACKFILL EXISTING DATA (OPTIONAL)
-- ============================================================================
-- If you have existing breeding_attempts records, this will set breeding_time
-- to the breeding_date at midnight (since we don't have the exact time)
-- You can skip this if you want to leave old records without time

UPDATE breeding_attempts
SET breeding_time = breeding_date::timestamp
WHERE breeding_time IS NULL AND breeding_date IS NOT NULL;

UPDATE ai_doses
SET dose_time = dose_date::timestamp
WHERE dose_time IS NULL AND dose_date IS NOT NULL;

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- Check that the columns were added successfully
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('breeding_attempts', 'ai_doses')
  AND column_name IN ('breeding_time', 'dose_time')
ORDER BY table_name, column_name;

-- Sample query to see the data
SELECT
  id,
  breeding_date,
  breeding_time,
  breeding_method
FROM breeding_attempts
ORDER BY created_at DESC
LIMIT 5;

SELECT
  id,
  dose_number,
  dose_date,
  dose_time
FROM ai_doses
ORDER BY created_at DESC
LIMIT 5;
