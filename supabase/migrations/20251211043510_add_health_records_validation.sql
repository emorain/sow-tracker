-- Add validation to ensure animal_type matches actual animal reference in health_records
-- This prevents data inconsistency where animal_type says 'sow' but boar_id is set

-- Drop existing constraint if it exists
ALTER TABLE health_records 
DROP CONSTRAINT IF EXISTS check_one_animal_reference;

-- Create comprehensive constraint that validates both existence and type match
ALTER TABLE health_records
ADD CONSTRAINT check_animal_reference_and_type CHECK (
  -- Exactly one animal reference must be set
  (
    (sow_id IS NOT NULL AND boar_id IS NULL AND piglet_id IS NULL AND animal_type = 'sow') OR
    (sow_id IS NULL AND boar_id IS NOT NULL AND piglet_id IS NULL AND animal_type = 'boar') OR
    (sow_id IS NULL AND boar_id IS NULL AND piglet_id IS NOT NULL AND animal_type = 'piglet')
  )
);

-- Create a trigger function to automatically set animal_type based on which ID is provided
-- This makes it easier for developers - they just set the ID and type is auto-determined
CREATE OR REPLACE FUNCTION set_health_record_animal_type()
RETURNS TRIGGER AS $$
BEGIN
  -- Auto-set animal_type based on which ID column is populated
  IF NEW.sow_id IS NOT NULL THEN
    NEW.animal_type := 'sow';
  ELSIF NEW.boar_id IS NOT NULL THEN
    NEW.animal_type := 'boar';
  ELSIF NEW.piglet_id IS NOT NULL THEN
    NEW.animal_type := 'piglet';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-set animal_type
DROP TRIGGER IF EXISTS set_animal_type_trigger ON health_records;
CREATE TRIGGER set_animal_type_trigger
  BEFORE INSERT OR UPDATE ON health_records
  FOR EACH ROW
  EXECUTE FUNCTION set_health_record_animal_type();

-- Add helpful comment
COMMENT ON CONSTRAINT check_animal_reference_and_type ON health_records IS 
  'Ensures exactly one animal reference (sow_id, boar_id, or piglet_id) is set and matches animal_type. Trigger auto-sets animal_type based on which ID is provided.';
