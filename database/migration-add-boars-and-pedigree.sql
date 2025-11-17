-- Migration: Add Boars and Pedigree Tracking
-- This adds boar management and basic pedigree tracking for show pig operations

-- Create boars table (similar structure to sows)
CREATE TABLE IF NOT EXISTS boars (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ear_tag VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100),
    birth_date DATE NOT NULL,
    breed VARCHAR(100) NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'culled', 'sold')),
    notes TEXT,
    photo_url TEXT,
    registration_number VARCHAR(100),
    right_ear_notch INTEGER,
    left_ear_notch INTEGER,
    -- Pedigree fields
    sire_id UUID REFERENCES boars(id) ON DELETE SET NULL,
    dam_id UUID REFERENCES sows(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add pedigree fields to existing sows table
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS sire_id UUID REFERENCES boars(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS dam_id UUID REFERENCES sows(id) ON DELETE SET NULL;

-- Add boar reference to farrowings (breeding records)
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS boar_id UUID REFERENCES boars(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_boars_status ON boars(status);
CREATE INDEX IF NOT EXISTS idx_boars_ear_tag ON boars(ear_tag);
CREATE INDEX IF NOT EXISTS idx_boars_sire ON boars(sire_id);
CREATE INDEX IF NOT EXISTS idx_boars_dam ON boars(dam_id);
CREATE INDEX IF NOT EXISTS idx_sows_sire ON sows(sire_id);
CREATE INDEX IF NOT EXISTS idx_sows_dam ON sows(dam_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_boar ON farrowings(boar_id);

-- Create trigger for boars updated_at
CREATE TRIGGER update_boars_updated_at BEFORE UPDATE ON boars
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert some sample boars for testing (optional - remove if not needed)
INSERT INTO boars (ear_tag, name, birth_date, breed, status, notes)
VALUES
    ('BOAR-001', 'Duke', '2022-03-15', 'Yorkshire', 'active', 'Excellent breeding boar with great conformation'),
    ('BOAR-002', 'Max', '2022-06-20', 'Landrace', 'active', 'Strong genetics, proven producer'),
    ('BOAR-003', 'Chief', '2021-11-10', 'Duroc', 'active', 'Champion bloodlines')
ON CONFLICT (ear_tag) DO NOTHING;
