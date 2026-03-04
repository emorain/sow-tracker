-- Migration: Add 'nursery' as a valid housing type
-- This adds 'nursery' to the allowed housing unit types

-- Drop the existing constraint
ALTER TABLE housing_units
DROP CONSTRAINT IF EXISTS housing_units_type_check;

-- Add the new constraint with 'nursery' included
ALTER TABLE housing_units
ADD CONSTRAINT housing_units_type_check
CHECK (type IN ('gestation', 'farrowing', 'breeding', 'hospital', 'quarantine', 'nursery', 'other'));
