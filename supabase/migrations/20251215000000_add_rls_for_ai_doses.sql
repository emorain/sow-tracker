-- Add RLS policies for ai_doses table
-- This table tracks follow-up AI doses for breeding attempts

-- First, ensure organization_id column exists
ALTER TABLE ai_doses ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_ai_doses_organization_id ON ai_doses(organization_id);

-- Enable RLS
ALTER TABLE ai_doses ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Users can view own ai_doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can insert own ai_doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can update own ai_doses" ON ai_doses;
DROP POLICY IF EXISTS "Users can delete own ai_doses" ON ai_doses;

-- Users can view AI doses in their organizations
CREATE POLICY "Users can view ai_doses in their organizations"
  ON ai_doses
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can insert their own AI doses
CREATE POLICY "Users can insert their own ai_doses"
  ON ai_doses
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can update AI doses in their organizations
CREATE POLICY "Users can update ai_doses in their organizations"
  ON ai_doses
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Users can delete AI doses in their organizations
CREATE POLICY "Users can delete ai_doses in their organizations"
  ON ai_doses
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

COMMENT ON TABLE ai_doses IS 'Stores follow-up AI doses for breeding attempts (2nd, 3rd doses)';
