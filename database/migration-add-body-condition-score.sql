-- Migration: Add body condition scoring to health records
-- Body condition score (BCS) is a visual assessment of animal body fat
-- Scale: 1-5 (1=Emaciated, 2=Thin, 3=Ideal, 4=Fat, 5=Obese)

-- Add body_condition_score column to health_records
ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS body_condition_score INTEGER CHECK (body_condition_score >= 1 AND body_condition_score <= 5);

-- Add comment explaining the scoring system
COMMENT ON COLUMN health_records.body_condition_score IS 'Body condition score 1-5: 1=Emaciated, 2=Thin, 3=Ideal, 4=Fat, 5=Obese';

-- Verify the column was added
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'health_records'
  AND column_name = 'body_condition_score';
