-- Migration: Add Pedigree Tracking to Piglets
-- This enables full lineage tracking for show pig registration paperwork

-- Add pedigree fields to piglets table
-- Note: Sire comes from the farrowing record's boar_id
-- Dam is the sow from the farrowing record's sow_id
-- We'll store these directly on piglets for easier querying

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS name VARCHAR(200),
ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES boars(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES sows(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS registration_association VARCHAR(200),
ADD COLUMN IF NOT EXISTS registration_date DATE,
ADD COLUMN IF NOT EXISTS sex VARCHAR(10) CHECK (sex IN ('male', 'female', 'unknown'));

-- Add comments for documentation
COMMENT ON COLUMN piglets.name IS 'Registered or show name for the piglet (e.g., "Starlight''s Golden Boy")';
COMMENT ON COLUMN piglets.sire_id IS 'Father (boar) of this piglet - references boars table';
COMMENT ON COLUMN piglets.dam_id IS 'Mother (sow) of this piglet - references sows table';
COMMENT ON COLUMN piglets.registration_number IS 'Show pig registration number (e.g., NPPC, ABGA)';
COMMENT ON COLUMN piglets.registration_association IS 'Registration association (e.g., National Swine Registry)';
COMMENT ON COLUMN piglets.registration_date IS 'Date piglet was registered';
COMMENT ON COLUMN piglets.sex IS 'Sex of piglet: male, female, or unknown';

-- Create indexes for pedigree queries
CREATE INDEX IF NOT EXISTS idx_piglets_sire ON piglets(sire_id);
CREATE INDEX IF NOT EXISTS idx_piglets_dam ON piglets(dam_id);
CREATE INDEX IF NOT EXISTS idx_piglets_registration ON piglets(registration_number);

-- Create a function to automatically set piglet pedigree from farrowing
-- This will populate sire_id and dam_id when a piglet is created
CREATE OR REPLACE FUNCTION set_piglet_pedigree()
RETURNS TRIGGER AS $$
DECLARE
    v_sow_id UUID;
    v_boar_id UUID;
BEGIN
    -- Get the sow_id and boar_id from the farrowing record
    SELECT sow_id, boar_id INTO v_sow_id, v_boar_id
    FROM farrowings
    WHERE id = NEW.farrowing_id;

    -- Set the dam (mother) and sire (father) if not already set
    IF NEW.dam_id IS NULL THEN
        NEW.dam_id := v_sow_id;
    END IF;

    IF NEW.sire_id IS NULL THEN
        NEW.sire_id := v_boar_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically set pedigree when piglet is created
DROP TRIGGER IF EXISTS trigger_set_piglet_pedigree ON piglets;
CREATE TRIGGER trigger_set_piglet_pedigree
    BEFORE INSERT ON piglets
    FOR EACH ROW
    EXECUTE FUNCTION set_piglet_pedigree();

-- Create a view for easy pedigree lookup with names
CREATE OR REPLACE VIEW piglet_pedigree_view AS
SELECT
    p.id as piglet_id,
    p.ear_tag as piglet_ear_tag,
    p.sex,
    p.birth_weight,
    p.weaning_weight,
    p.registration_number,
    p.registration_association,
    p.registration_date,
    -- Dam (Mother) info
    s.id as dam_id,
    s.ear_tag as dam_ear_tag,
    s.name as dam_name,
    s.breed as dam_breed,
    s.registration_number as dam_registration,
    -- Dam's parents (maternal grandparents)
    s.sire_id as maternal_grandsire_id,
    s.dam_id as maternal_granddam_id,
    -- Sire (Father) info
    b.id as sire_id,
    b.ear_tag as sire_ear_tag,
    b.name as sire_name,
    b.breed as sire_breed,
    b.registration_number as sire_registration,
    -- Sire's parents (paternal grandparents)
    b.sire_id as paternal_grandsire_id,
    b.dam_id as paternal_granddam_id,
    -- Farrowing info
    f.id as farrowing_id,
    f.breeding_date,
    f.actual_farrowing_date
FROM piglets p
LEFT JOIN sows s ON p.dam_id = s.id
LEFT JOIN boars b ON p.sire_id = b.id
LEFT JOIN farrowings f ON p.farrowing_id = f.id;

-- Update existing piglets to have proper pedigree
-- This backfills sire_id and dam_id for existing records
UPDATE piglets
SET
    dam_id = f.sow_id,
    sire_id = f.boar_id
FROM farrowings f
WHERE piglets.farrowing_id = f.id
  AND piglets.dam_id IS NULL;

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'piglets'
  AND column_name IN ('name', 'sire_id', 'dam_id', 'registration_number', 'sex')
ORDER BY ordinal_position;
