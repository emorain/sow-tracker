-- Migration: Add Breeding Attempts Tracking
-- Separates breeding attempts from confirmed pregnancies/farrowings
-- Tracks complete breeding history including failed attempts

-- ========================================
-- 1. CREATE BREEDING ATTEMPTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS breeding_attempts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id),
    sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,

    -- Breeding details
    breeding_date DATE NOT NULL,
    breeding_method VARCHAR(20) NOT NULL CHECK (breeding_method IN ('natural', 'ai')),
    boar_id UUID REFERENCES boars(id),
    boar_description TEXT, -- For non-system boars

    -- Pregnancy check tracking
    pregnancy_check_date DATE,
    pregnancy_confirmed BOOLEAN, -- NULL = not checked yet, TRUE = pregnant, FALSE = returned to heat

    -- Result tracking
    result VARCHAR(30) CHECK (result IN ('pending', 'pregnant', 'returned_to_heat', 'aborted', 'unknown')),

    -- Link to successful farrowing (if pregnant)
    farrowing_id UUID REFERENCES farrowings(id),

    -- Additional info
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE breeding_attempts IS 'Tracks all breeding attempts including successful and unsuccessful ones';
COMMENT ON COLUMN breeding_attempts.pregnancy_confirmed IS 'NULL = not yet checked, TRUE = pregnant, FALSE = returned to heat';
COMMENT ON COLUMN breeding_attempts.result IS 'Outcome of this breeding attempt';
COMMENT ON COLUMN breeding_attempts.farrowing_id IS 'Links to farrowing record if pregnancy was confirmed';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_sow ON breeding_attempts(sow_id);
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_user ON breeding_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_boar ON breeding_attempts(boar_id);
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_date ON breeding_attempts(breeding_date);
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_result ON breeding_attempts(result);

-- ========================================
-- 2. ADD BREEDING ATTEMPT REFERENCE TO FARROWINGS
-- ========================================

-- Add column to link farrowing back to the breeding attempt
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS breeding_attempt_id UUID REFERENCES breeding_attempts(id);

COMMENT ON COLUMN farrowings.breeding_attempt_id IS 'The breeding attempt that resulted in this farrowing';

-- ========================================
-- 3. MIGRATE EXISTING DATA
-- ========================================

-- Create breeding attempts from existing farrowings
-- This assumes existing farrowings are successful breedings
INSERT INTO breeding_attempts (
    user_id,
    sow_id,
    breeding_date,
    breeding_method,
    boar_id,
    pregnancy_confirmed,
    result,
    notes,
    created_at
)
SELECT
    f.user_id,
    f.sow_id,
    f.breeding_date,
    COALESCE(f.breeding_method, 'natural'),
    f.boar_id,
    TRUE, -- Existing farrowings are confirmed pregnancies
    'pregnant',
    f.notes,
    f.created_at
FROM farrowings f
WHERE NOT EXISTS (
    -- Don't duplicate if already migrated
    SELECT 1 FROM breeding_attempts ba
    WHERE ba.sow_id = f.sow_id
    AND ba.breeding_date = f.breeding_date
);

-- Link farrowings to their breeding attempts
UPDATE farrowings f
SET breeding_attempt_id = ba.id
FROM breeding_attempts ba
WHERE ba.sow_id = f.sow_id
  AND ba.breeding_date = f.breeding_date
  AND f.breeding_attempt_id IS NULL;

-- Link breeding attempts to their farrowings
UPDATE breeding_attempts ba
SET farrowing_id = f.id
FROM farrowings f
WHERE f.sow_id = ba.sow_id
  AND f.breeding_date = ba.breeding_date
  AND ba.farrowing_id IS NULL
  AND ba.pregnancy_confirmed = TRUE;

-- ========================================
-- 4. RLS POLICIES
-- ========================================

ALTER TABLE breeding_attempts ENABLE ROW LEVEL SECURITY;

-- Users can view their own breeding attempts
CREATE POLICY "Users can view their own breeding attempts"
    ON breeding_attempts FOR SELECT
    USING (auth.uid() = user_id);

-- Users can insert their own breeding attempts
CREATE POLICY "Users can create breeding attempts"
    ON breeding_attempts FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can update their own breeding attempts
CREATE POLICY "Users can update their own breeding attempts"
    ON breeding_attempts FOR UPDATE
    USING (auth.uid() = user_id);

-- Users can delete their own breeding attempts
CREATE POLICY "Users can delete their own breeding attempts"
    ON breeding_attempts FOR DELETE
    USING (auth.uid() = user_id);

-- ========================================
-- 5. HELPER VIEW: Active Breeding Status
-- ========================================

-- View to easily get current breeding status for each sow
CREATE OR REPLACE VIEW sow_breeding_status AS
SELECT
    s.id as sow_id,
    s.user_id,
    ba.id as latest_breeding_attempt_id,
    ba.breeding_date,
    ba.breeding_method,
    ba.boar_id,
    ba.pregnancy_check_date,
    ba.pregnancy_confirmed,
    ba.result,
    ba.farrowing_id,
    CURRENT_DATE - ba.breeding_date as days_since_breeding,
    CASE
        WHEN ba.pregnancy_confirmed = TRUE THEN 'pregnant'
        WHEN ba.pregnancy_confirmed = FALSE THEN 'open'
        WHEN ba.pregnancy_confirmed IS NULL AND (CURRENT_DATE - ba.breeding_date) >= 18 THEN 'needs_check'
        WHEN ba.pregnancy_confirmed IS NULL THEN 'bred'
        ELSE 'open'
    END as status,
    CASE
        WHEN ba.pregnancy_confirmed = TRUE THEN 'Pregnant'
        WHEN ba.pregnancy_confirmed = FALSE THEN 'Returned to Heat'
        WHEN ba.pregnancy_confirmed IS NULL AND (CURRENT_DATE - ba.breeding_date) >= 18 THEN 'Ready for Pregnancy Check'
        WHEN ba.pregnancy_confirmed IS NULL THEN format('Bred - Day %s', CURRENT_DATE - ba.breeding_date)
        ELSE 'Open'
    END as status_label
FROM sows s
LEFT JOIN LATERAL (
    -- Get the most recent breeding attempt for this sow
    SELECT * FROM breeding_attempts
    WHERE sow_id = s.id
    AND result IN ('pending', 'pregnant') -- Only active attempts
    ORDER BY breeding_date DESC
    LIMIT 1
) ba ON true
WHERE s.status = 'active';

COMMENT ON VIEW sow_breeding_status IS 'Current breeding status for all active sows';

-- ========================================
-- 6. TRIGGER FOR UPDATED_AT
-- ========================================

CREATE TRIGGER update_breeding_attempts_updated_at
    BEFORE UPDATE ON breeding_attempts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
