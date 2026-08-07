-- Add body condition scoring to health records.
-- The UI (HealthEventModal) has been writing this field since Phase 5, but the
-- original database/migration-add-body-condition-score.sql was never applied to
-- the live database, so every insert from that modal failed with PGRST204.
-- Scale: 1-5 (1=Emaciated, 2=Thin, 3=Ideal, 4=Fat, 5=Obese)

ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS body_condition_score INTEGER
  CHECK (body_condition_score >= 1 AND body_condition_score <= 5);

COMMENT ON COLUMN health_records.body_condition_score IS 'Body condition score 1-5: 1=Emaciated, 2=Thin, 3=Ideal, 4=Fat, 5=Obese';
