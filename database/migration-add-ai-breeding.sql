-- Migration: Add AI Breeding Support
-- Adds ability to track AI (artificial insemination) breeding and semen inventory

-- Add AI breeding fields to boars table
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS boar_type VARCHAR(20) DEFAULT 'live' CHECK (boar_type IN ('live', 'ai_semen')),
ADD COLUMN IF NOT EXISTS semen_straws INTEGER,
ADD COLUMN IF NOT EXISTS supplier VARCHAR(200),
ADD COLUMN IF NOT EXISTS collection_date DATE,
ADD COLUMN IF NOT EXISTS cost_per_straw DECIMAL(10,2);

-- Add breeding method to farrowings table
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS breeding_method VARCHAR(20) DEFAULT 'natural' CHECK (breeding_method IN ('natural', 'ai'));

-- Create index for filtering by boar type
CREATE INDEX IF NOT EXISTS idx_boars_type ON boars(boar_type);

-- Create a view for available AI semen (has straws remaining)
CREATE OR REPLACE VIEW available_ai_semen AS
SELECT
    id,
    ear_tag,
    name,
    breed,
    semen_straws,
    supplier,
    collection_date,
    cost_per_straw,
    registration_number
FROM boars
WHERE boar_type = 'ai_semen'
  AND status = 'active'
  AND (semen_straws IS NULL OR semen_straws > 0)
ORDER BY name, ear_tag;

-- Function to decrement semen inventory when used for breeding
CREATE OR REPLACE FUNCTION decrement_semen_inventory()
RETURNS TRIGGER AS $$
BEGIN
    -- Only decrement if this is an AI breeding and boar is AI semen type
    IF NEW.breeding_method = 'ai' AND NEW.boar_id IS NOT NULL THEN
        UPDATE boars
        SET semen_straws = GREATEST(0, COALESCE(semen_straws, 0) - 1)
        WHERE id = NEW.boar_id
          AND boar_type = 'ai_semen'
          AND semen_straws > 0;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically decrement semen when breeding is recorded
DROP TRIGGER IF EXISTS trigger_decrement_semen ON farrowings;
CREATE TRIGGER trigger_decrement_semen
    AFTER INSERT ON farrowings
    FOR EACH ROW
    WHEN (NEW.boar_id IS NOT NULL AND NEW.breeding_method = 'ai')
    EXECUTE FUNCTION decrement_semen_inventory();

-- Sample AI semen records for testing
INSERT INTO boars (ear_tag, name, birth_date, breed, boar_type, semen_straws, supplier, collection_date, status, notes)
VALUES
    ('AI-DUKE-001', 'Champion Duke', '2020-05-15', 'Yorkshire', 'ai_semen', 15, 'Premium Genetics Inc', '2024-01-15', 'active', 'Grand Champion - National Show 2023. Excellent muscling and structure.'),
    ('AI-MAX-002', 'Maximus Prime', '2021-03-20', 'Duroc', 'ai_semen', 8, 'Elite Swine Genetics', '2024-02-10', 'active', 'Reserve Champion - State Fair. Known for producing show-quality offspring.'),
    ('AI-CHIEF-003', 'Chief Commander', '2020-11-08', 'Hampshire', 'ai_semen', 12, 'Superior Genetics Co', '2024-01-20', 'active', 'Multiple show wins. Exceptional conformation and temperament.')
ON CONFLICT (ear_tag) DO NOTHING;

-- Update existing farrowings to have natural breeding method (for existing data)
UPDATE farrowings
SET breeding_method = 'natural'
WHERE breeding_method IS NULL;

-- Comments for documentation
COMMENT ON COLUMN boars.boar_type IS 'Type of boar: live (physical boar) or ai_semen (artificial insemination)';
COMMENT ON COLUMN boars.semen_straws IS 'Number of semen straws remaining in inventory (for AI semen only)';
COMMENT ON COLUMN boars.supplier IS 'Supplier/vendor where AI semen was purchased from';
COMMENT ON COLUMN boars.collection_date IS 'Date when semen was collected (for AI semen)';
COMMENT ON COLUMN farrowings.breeding_method IS 'Method of breeding: natural (live breeding) or ai (artificial insemination)';
