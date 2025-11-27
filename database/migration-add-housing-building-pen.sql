-- Migration: Add Building and Pen Number to Housing Units
-- Adds building_name and pen_number fields to organize housing units
-- For example: "Farrowing House" building with pens 1-20

-- Add building_name column
ALTER TABLE housing_units
ADD COLUMN IF NOT EXISTS building_name TEXT;

-- Add pen_number column
ALTER TABLE housing_units
ADD COLUMN IF NOT EXISTS pen_number TEXT;

-- Add index for building queries
CREATE INDEX IF NOT EXISTS idx_housing_units_building
  ON housing_units(building_name, pen_number);

-- Add comments
COMMENT ON COLUMN housing_units.building_name IS 'Name of the building/barn (e.g., "Farrowing House", "Finisher Building")';
COMMENT ON COLUMN housing_units.pen_number IS 'Pen/unit number within the building (e.g., "1", "2", "A", "B1")';

-- Update the name field comment to reflect new usage
COMMENT ON COLUMN housing_units.name IS 'Full name or identifier for the housing unit. Can be auto-generated from building_name + pen_number or custom.';

-- Example: Update existing housing units to extract building and pen if they follow a pattern
-- This is optional - only run if your existing names follow "Building - Pen X" pattern
-- UPDATE housing_units
-- SET
--   building_name = SPLIT_PART(name, ' - Pen ', 1),
--   pen_number = REPLACE(SPLIT_PART(name, ' - Pen ', 2), 'Pen ', '')
-- WHERE name LIKE '% - Pen %';

-- Grant permissions
GRANT SELECT ON housing_units TO authenticated;
