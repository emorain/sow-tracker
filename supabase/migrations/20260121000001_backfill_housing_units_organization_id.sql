-- Backfill organization_id for housing_units that don't have it set
-- This fixes housing units created before organization support was added

-- STEP 1: Preview what will be updated
-- This shows you which housing units will be assigned to which organizations
DO $$
DECLARE
  null_count INTEGER;
  preview_record RECORD;
BEGIN
  SELECT COUNT(*) INTO null_count
  FROM housing_units
  WHERE organization_id IS NULL;

  RAISE NOTICE '========================================';
  RAISE NOTICE 'PREVIEW: Housing Units to be Updated';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Found % housing units with NULL organization_id', null_count;
  RAISE NOTICE '';

  IF null_count > 0 THEN
    RAISE NOTICE 'Housing units that will be updated:';
    RAISE NOTICE '';

    FOR preview_record IN
      SELECT
        hu.id,
        hu.name,
        hu.user_id,
        om.organization_id,
        o.name as org_name,
        u.email as user_email
      FROM housing_units hu
      LEFT JOIN organization_members om ON hu.user_id = om.user_id AND om.is_active = true
      LEFT JOIN organizations o ON om.organization_id = o.id
      LEFT JOIN auth.users u ON hu.user_id = u.id
      WHERE hu.organization_id IS NULL
      ORDER BY hu.name
    LOOP
      IF preview_record.organization_id IS NOT NULL THEN
        RAISE NOTICE '  ✓ Housing Unit: "%" will be assigned to organization: "%" (user: %)',
          preview_record.name,
          preview_record.org_name,
          preview_record.user_email;
      ELSE
        RAISE WARNING '  ✗ Housing Unit: "%" has no organization to assign (user: % not in any organization)',
          preview_record.name,
          preview_record.user_email;
      END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Review the above list before proceeding';
    RAISE NOTICE '========================================';
  ELSE
    RAISE NOTICE 'No housing units need updating - all have organization_id set!';
  END IF;
END $$;

-- STEP 2: Perform the update
-- This assigns each housing unit to the creator's first organization
UPDATE housing_units hu
SET organization_id = om.organization_id
FROM organization_members om
WHERE hu.user_id = om.user_id
  AND hu.organization_id IS NULL
  AND om.is_active = true
  -- Get the user's first active organization
  AND om.organization_id = (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = hu.user_id AND is_active = true
    ORDER BY joined_at ASC
    LIMIT 1
  );

-- STEP 3: Report results
DO $$
DECLARE
  updated_count INTEGER;
  remaining_null INTEGER;
  result_record RECORD;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;

  SELECT COUNT(*) INTO remaining_null
  FROM housing_units
  WHERE organization_id IS NULL;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'UPDATE COMPLETE';
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Updated % housing units with organization_id', updated_count;
  RAISE NOTICE 'Remaining housing units with NULL organization_id: %', remaining_null;
  RAISE NOTICE '';

  IF updated_count > 0 THEN
    RAISE NOTICE 'Successfully updated housing units:';
    FOR result_record IN
      SELECT
        hu.name,
        o.name as org_name,
        u.email as user_email
      FROM housing_units hu
      JOIN organizations o ON hu.organization_id = o.id
      JOIN auth.users u ON hu.user_id = u.id
      WHERE hu.organization_id IS NOT NULL
      ORDER BY hu.name
    LOOP
      RAISE NOTICE '  ✓ "%" → % (%)',
        result_record.name,
        result_record.org_name,
        result_record.user_email;
    END LOOP;
  END IF;

  IF remaining_null > 0 THEN
    RAISE WARNING '';
    RAISE WARNING 'WARNING: % housing units still have NULL organization_id', remaining_null;
    RAISE WARNING 'These may be orphaned records (user not in any organization)';
    RAISE WARNING 'You may want to delete these manually or assign them to an organization';
  ELSE
    RAISE NOTICE '';
    RAISE NOTICE '✅ All housing units now have organization_id assigned!';
  END IF;

  RAISE NOTICE '========================================';
END $$;

-- STEP 4: Clean up orphaned records (optional - commented out for safety)
-- Uncomment if you want to delete housing units for users not in any organization
-- DELETE FROM housing_units
-- WHERE organization_id IS NULL
--   AND (
--     user_id NOT IN (SELECT user_id FROM organization_members WHERE is_active = true)
--     OR user_id IS NULL
--   );
