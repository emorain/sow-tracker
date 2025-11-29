-- Migration: Add AI Doses Tracking
-- Description: Creates table to track follow-up AI doses (typically 2-3 doses over consecutive days)
-- Date: 2025-11-29

-- Create ai_doses table
CREATE TABLE IF NOT EXISTS ai_doses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  breeding_attempt_id UUID NOT NULL REFERENCES breeding_attempts(id) ON DELETE CASCADE,
  dose_number INTEGER NOT NULL CHECK (dose_number >= 1 AND dose_number <= 10),
  dose_date DATE NOT NULL,
  straws_used INTEGER CHECK (straws_used > 0),
  boar_id UUID REFERENCES boars(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_ai_doses_user_id ON ai_doses(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_doses_breeding_attempt_id ON ai_doses(breeding_attempt_id);
CREATE INDEX IF NOT EXISTS idx_ai_doses_boar_id ON ai_doses(boar_id);
CREATE INDEX IF NOT EXISTS idx_ai_doses_dose_date ON ai_doses(dose_date);

-- Enable RLS
ALTER TABLE ai_doses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view their own AI doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can insert their own AI doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can update their own AI doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can delete their own AI doses" ON ai_doses;

-- Create RLS policies
CREATE POLICY "Users can view their own AI doses"
  ON ai_doses FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI doses"
  ON ai_doses FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI doses"
  ON ai_doses FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI doses"
  ON ai_doses FOR DELETE
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_ai_doses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ai_doses_updated_at ON ai_doses;
CREATE TRIGGER ai_doses_updated_at
  BEFORE UPDATE ON ai_doses
  FOR EACH ROW
  EXECUTE FUNCTION update_ai_doses_updated_at();

-- Add helpful comments
COMMENT ON TABLE ai_doses IS 'Tracks follow-up AI doses for breeding attempts (typically 2-3 doses over consecutive days)';
COMMENT ON COLUMN ai_doses.dose_number IS 'Dose number (1 = first follow-up, 2 = second follow-up, etc. Initial breeding is in breeding_attempts table)';
COMMENT ON COLUMN ai_doses.dose_date IS 'Date this follow-up dose was administered';
COMMENT ON COLUMN ai_doses.straws_used IS 'Number of semen straws used for this dose';
COMMENT ON COLUMN ai_doses.boar_id IS 'Boar used for this dose (typically same as initial breeding)';
