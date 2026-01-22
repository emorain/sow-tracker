-- Add ownership_type to boars table to distinguish owned vs borrowed/rented boars
-- This allows proper tracking of all boars (including borrowed) in inventory

-- Step 1: Add ownership_type column
ALTER TABLE boars
ADD COLUMN IF NOT EXISTS ownership_type VARCHAR(20) DEFAULT 'owned'
CHECK (ownership_type IN ('owned', 'borrowed', 'rented'));

-- Step 2: Set default for existing records
UPDATE boars
SET ownership_type = 'owned'
WHERE ownership_type IS NULL;

-- Step 3: Create index for filtering
CREATE INDEX IF NOT EXISTS idx_boars_ownership_type ON boars(ownership_type);

-- Step 4: Add comments
COMMENT ON COLUMN boars.ownership_type IS 'Type of ownership: owned (farm owns), borrowed (temporary from another farm), rented (paid rental)';

-- Step 5: Migrate existing "boar_description" from breeding_attempts into boar records
-- This creates proper boar records for borrowed boars that were previously just text descriptions
DO $$
DECLARE
  breeding_record RECORD;
  new_boar_id UUID;
  boar_name TEXT;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATING BORROWED BOAR DESCRIPTIONS';
  RAISE NOTICE '========================================';

  FOR breeding_record IN
    SELECT DISTINCT
      ba.boar_description,
      ba.breeding_method,
      ba.user_id,
      ba.organization_id,
      COUNT(*) as usage_count
    FROM breeding_attempts ba
    WHERE ba.boar_id IS NULL
      AND ba.boar_description IS NOT NULL
      AND ba.boar_description != ''
    GROUP BY ba.boar_description, ba.breeding_method, ba.user_id, ba.organization_id
    ORDER BY usage_count DESC
  LOOP
    -- Extract a name from the description (first 50 chars)
    boar_name := SUBSTRING(breeding_record.boar_description FROM 1 FOR 50);

    -- Create a new boar record for this borrowed boar/semen
    INSERT INTO boars (
      user_id,
      organization_id,
      ear_tag,
      name,
      birth_date,
      breed,
      boar_type,
      ownership_type,
      status,
      notes,
      created_at
    ) VALUES (
      breeding_record.user_id,
      breeding_record.organization_id,
      'MIGRATED-' || LEFT(MD5(breeding_record.boar_description), 8), -- Unique ear tag
      boar_name,
      CURRENT_DATE, -- Use today's date for migrated records
      'Unknown', -- Breed is unknown for migrated records
      CASE
        WHEN breeding_record.breeding_method = 'ai' THEN 'ai_semen'
        ELSE 'live'
      END,
      'borrowed', -- Mark as borrowed
      'active',
      'Auto-migrated from breeding description: ' || breeding_record.boar_description,
      NOW()
    )
    RETURNING id INTO new_boar_id;

    -- Update all breeding attempts that used this description to reference the new boar
    UPDATE breeding_attempts
    SET boar_id = new_boar_id,
        boar_description = NULL -- Clear the description since we now have a proper boar record
    WHERE boar_id IS NULL
      AND boar_description = breeding_record.boar_description
      AND user_id = breeding_record.user_id
      AND organization_id = breeding_record.organization_id;

    RAISE NOTICE 'Created borrowed boar "%" (ID: %) for % breeding(s)',
      boar_name,
      new_boar_id,
      breeding_record.usage_count;
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'MIGRATION COMPLETE';
  RAISE NOTICE '========================================';
END $$;

-- Step 6: Report remaining breeding attempts without boar_id
DO $$
DECLARE
  remaining_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO remaining_count
  FROM breeding_attempts
  WHERE boar_id IS NULL;

  IF remaining_count > 0 THEN
    RAISE WARNING 'WARNING: % breeding attempts still have no boar_id', remaining_count;
    RAISE WARNING 'These may need manual review and assignment';
  ELSE
    RAISE NOTICE '✅ All breeding attempts now have boar_id assigned!';
  END IF;
END $$;

-- Step 7: Make boar_id NOT NULL in future (commented out for safety)
-- After verifying all breeding attempts have boar_id, uncomment this:
-- ALTER TABLE breeding_attempts ALTER COLUMN boar_id SET NOT NULL;

COMMENT ON TABLE boars IS 'All boars and AI semen inventory, including owned, borrowed, and rented';
