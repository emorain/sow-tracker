-- Create health_records table for tracking animal health
-- Works for sows, boars, and piglets
-- Can be expanded later with more specialized tables

CREATE TABLE IF NOT EXISTS health_records (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Animal reference (polymorphic - one of these will be set)
  animal_type VARCHAR(20) NOT NULL CHECK (animal_type IN ('sow', 'boar', 'piglet')),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  boar_id UUID REFERENCES boars(id) ON DELETE CASCADE,
  piglet_id UUID REFERENCES piglets(id) ON DELETE CASCADE,

  -- Record details
  record_type VARCHAR(50) NOT NULL, -- vaccine, treatment, vet_visit, observation, injury, procedure
  record_date DATE NOT NULL,

  -- Content
  title VARCHAR(200) NOT NULL, -- e.g., "Rabies Vaccine", "Antibiotic Treatment"
  description TEXT, -- Detailed notes

  -- Optional fields
  dosage VARCHAR(100), -- e.g., "5ml", "2 tablets"
  cost DECIMAL(10,2), -- Track expenses
  administered_by VARCHAR(100), -- Person who administered
  veterinarian VARCHAR(100), -- Vet name if applicable

  -- For recurring items (like vaccines)
  next_due_date DATE,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_health_records_user ON health_records(user_id);
CREATE INDEX idx_health_records_sow ON health_records(sow_id);
CREATE INDEX idx_health_records_boar ON health_records(boar_id);
CREATE INDEX idx_health_records_piglet ON health_records(piglet_id);
CREATE INDEX idx_health_records_type ON health_records(record_type);
CREATE INDEX idx_health_records_date ON health_records(record_date DESC);
CREATE INDEX idx_health_records_next_due ON health_records(next_due_date);

-- Row Level Security (RLS)
ALTER TABLE health_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own health records
CREATE POLICY "Users can view own health records"
  ON health_records FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own health records
CREATE POLICY "Users can insert own health records"
  ON health_records FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own health records
CREATE POLICY "Users can update own health records"
  ON health_records FOR UPDATE
  USING (auth.uid() = user_id);

-- Policy: Users can delete their own health records
CREATE POLICY "Users can delete own health records"
  ON health_records FOR DELETE
  USING (auth.uid() = user_id);

-- Add constraint: Exactly one animal reference must be set
ALTER TABLE health_records
ADD CONSTRAINT check_one_animal_reference CHECK (
  (
    (sow_id IS NOT NULL AND boar_id IS NULL AND piglet_id IS NULL) OR
    (sow_id IS NULL AND boar_id IS NOT NULL AND piglet_id IS NULL) OR
    (sow_id IS NULL AND boar_id IS NULL AND piglet_id IS NOT NULL)
  )
);

-- Comments for documentation
COMMENT ON TABLE health_records IS 'Universal health tracking for all animals (sows, boars, piglets)';
COMMENT ON COLUMN health_records.record_type IS 'Type of health record: vaccine, treatment, vet_visit, observation, injury, procedure';
COMMENT ON COLUMN health_records.next_due_date IS 'For recurring items like vaccines - when is the next dose due';
