-- Matrix Treatment Tracking System
-- Run this in your Supabase SQL Editor

-- Create matrix_treatments table
CREATE TABLE IF NOT EXISTS matrix_treatments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,
    batch_name VARCHAR(100) NOT NULL,
    administration_date DATE NOT NULL,
    expected_heat_date DATE NOT NULL,
    actual_heat_date DATE,
    bred BOOLEAN DEFAULT FALSE,
    breeding_date DATE,
    dosage VARCHAR(50),
    lot_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_matrix_treatments_sow_id ON matrix_treatments(sow_id);
CREATE INDEX IF NOT EXISTS idx_matrix_treatments_batch_name ON matrix_treatments(batch_name);
CREATE INDEX IF NOT EXISTS idx_matrix_treatments_expected_heat_date ON matrix_treatments(expected_heat_date);
CREATE INDEX IF NOT EXISTS idx_matrix_treatments_administration_date ON matrix_treatments(administration_date);

-- Create trigger for updated_at
CREATE TRIGGER update_matrix_treatments_updated_at
BEFORE UPDATE ON matrix_treatments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically calculate expected heat date (admin date + 5 days by default)
CREATE OR REPLACE FUNCTION calculate_expected_heat_date()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.expected_heat_date IS NULL THEN
        NEW.expected_heat_date := NEW.administration_date + INTERVAL '5 days';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_expected_heat_date
BEFORE INSERT ON matrix_treatments
FOR EACH ROW EXECUTE FUNCTION calculate_expected_heat_date();

-- Enable Row Level Security
ALTER TABLE matrix_treatments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for all users (development)
CREATE POLICY "Enable read access for all users" ON matrix_treatments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON matrix_treatments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON matrix_treatments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON matrix_treatments FOR DELETE USING (true);

-- Add comments
COMMENT ON TABLE matrix_treatments IS 'Tracks Matrix hormone treatments for estrus synchronization';
COMMENT ON COLUMN matrix_treatments.batch_name IS 'Name/identifier for the synchronized batch group';
COMMENT ON COLUMN matrix_treatments.administration_date IS 'Date when Matrix was administered';
COMMENT ON COLUMN matrix_treatments.expected_heat_date IS 'Calculated expected heat date (admin date + 5-7 days)';
COMMENT ON COLUMN matrix_treatments.actual_heat_date IS 'Date when sow actually came into heat';
COMMENT ON COLUMN matrix_treatments.bred IS 'Whether the sow was bred during this cycle';
COMMENT ON COLUMN matrix_treatments.breeding_date IS 'Date when sow was bred';
