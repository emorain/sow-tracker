-- Migration: Add housing units/pens (CORE FEATURE - available to all users)
-- Run this in Supabase SQL Editor

-- 1. Create housing_units table
CREATE TABLE IF NOT EXISTS housing_units (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Basic info (required for all users)
  name VARCHAR(100) NOT NULL,
  unit_number VARCHAR(50), -- Optional internal ID
  type VARCHAR(50) NOT NULL CHECK (type IN ('gestation', 'farrowing', 'breeding', 'hospital', 'quarantine', 'other')),

  -- Prop 12 compliance fields (optional for non-Prop 12 users)
  length_feet DECIMAL(10,2), -- Optional for basic users
  width_feet DECIMAL(10,2), -- Optional for basic users
  square_footage DECIMAL(10,2), -- Required only for Prop 12, optional otherwise

  -- Capacity
  max_capacity INTEGER, -- Optional: user-defined max or auto-calculated for Prop 12

  -- Location/facility info
  building_name VARCHAR(100),
  notes TEXT,

  -- Prop 12 measurement documentation
  measurement_date DATE,
  measured_by VARCHAR(100),
  measurement_notes TEXT,

  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_housing_units_user_id ON housing_units(user_id);
CREATE INDEX IF NOT EXISTS idx_housing_units_type ON housing_units(type);

-- 3. Add housing_unit_id to sows table (for pen assignment)
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_sows_housing_unit_id ON sows(housing_unit_id);

-- 4. Add housing_unit_id to location_history (track which pen they moved to)
ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS housing_unit_id UUID REFERENCES housing_units(id) ON DELETE SET NULL;

-- 5. Create view for housing unit occupancy (useful for all users)
CREATE OR REPLACE VIEW housing_unit_occupancy AS
SELECT
  hu.id,
  hu.user_id,
  hu.name,
  hu.type,
  hu.square_footage,
  hu.max_capacity,
  COUNT(s.id) as current_sows,
  -- Calculate sq ft per sow (only if square_footage is set)
  CASE
    WHEN COUNT(s.id) = 0 THEN NULL
    WHEN hu.square_footage IS NULL THEN NULL
    ELSE ROUND((hu.square_footage / COUNT(s.id))::numeric, 2)
  END as sq_ft_per_sow,
  -- Compliance status (only relevant if square_footage is set)
  CASE
    WHEN hu.square_footage IS NULL THEN NULL -- Not tracking sq ft
    WHEN COUNT(s.id) = 0 THEN true -- Empty pen is compliant
    WHEN hu.type != 'gestation' THEN true -- Only gestation has strict 24 sq ft requirement
    WHEN hu.square_footage / COUNT(s.id) >= 24 THEN true -- Meets requirement
    ELSE false -- Non-compliant
  END as is_compliant
FROM housing_units hu
LEFT JOIN sows s ON s.housing_unit_id = hu.id AND s.status = 'active'
GROUP BY hu.id, hu.user_id, hu.name, hu.type, hu.square_footage, hu.max_capacity;

-- 6. Add function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_housing_unit_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER housing_units_updated_at
  BEFORE UPDATE ON housing_units
  FOR EACH ROW
  EXECUTE FUNCTION update_housing_unit_timestamp();

-- 7. Add comments
COMMENT ON TABLE housing_units IS 'Housing pens/units for tracking sow locations. Square footage optional unless Prop 12 compliance enabled.';
COMMENT ON COLUMN housing_units.square_footage IS 'Total usable floor space in square feet (required for Prop 12, optional otherwise)';
COMMENT ON COLUMN housing_units.max_capacity IS 'Maximum sows (user-defined or auto-calculated from sq_ft ÷ 24 for Prop 12)';
COMMENT ON VIEW housing_unit_occupancy IS 'Real-time view of housing unit occupancy and compliance status';

-- Verify the changes
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'housing_units'
ORDER BY ordinal_position;
