-- Diagnostic query to investigate housing visibility issue between users
-- User: emorain can't see oltmanjt's housing
-- User: oltmanjt CAN see emorain's housing

-- STEP 1: Check user information
DO $$
DECLARE
  user_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'USER INFORMATION';
  RAISE NOTICE '========================================';

  FOR user_record IN
    SELECT
      id,
      email,
      created_at
    FROM auth.users
    WHERE email LIKE '%emorain%' OR email LIKE '%oltmanjt%'
    ORDER BY email
  LOOP
    RAISE NOTICE 'User: % (ID: %)', user_record.email, user_record.id;
    RAISE NOTICE '  Created: %', user_record.created_at;
  END LOOP;

  RAISE NOTICE '';
END $$;

-- STEP 2: Check organization memberships
DO $$
DECLARE
  membership_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'ORGANIZATION MEMBERSHIPS';
  RAISE NOTICE '========================================';

  FOR membership_record IN
    SELECT
      u.email,
      o.id as org_id,
      o.name as org_name,
      om.role,
      om.is_active,
      om.joined_at
    FROM auth.users u
    JOIN organization_members om ON u.id = om.user_id
    JOIN organizations o ON om.organization_id = o.id
    WHERE u.email LIKE '%emorain%' OR u.email LIKE '%oltmanjt%'
    ORDER BY u.email, om.joined_at
  LOOP
    RAISE NOTICE 'User: %', membership_record.email;
    RAISE NOTICE '  Organization: % (ID: %)', membership_record.org_name, membership_record.org_id;
    RAISE NOTICE '  Role: %, Active: %, Joined: %',
      membership_record.role,
      membership_record.is_active,
      membership_record.joined_at;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- STEP 3: Check housing units created by each user
DO $$
DECLARE
  housing_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'HOUSING UNITS BY USER';
  RAISE NOTICE '========================================';

  FOR housing_record IN
    SELECT
      u.email as creator_email,
      hu.id as housing_id,
      hu.name as housing_name,
      hu.organization_id,
      o.name as org_name,
      hu.created_at
    FROM housing_units hu
    JOIN auth.users u ON hu.user_id = u.id
    LEFT JOIN organizations o ON hu.organization_id = o.id
    WHERE u.email LIKE '%emorain%' OR u.email LIKE '%oltmanjt%'
    ORDER BY u.email, hu.name
  LOOP
    RAISE NOTICE 'Created by: %', housing_record.creator_email;
    RAISE NOTICE '  Housing: "%"', housing_record.housing_name;
    IF housing_record.organization_id IS NULL THEN
      RAISE WARNING '  Organization: NULL (VISIBLE TO ALL USERS!)';
    ELSE
      RAISE NOTICE '  Organization: % (ID: %)', housing_record.org_name, housing_record.organization_id;
    END IF;
    RAISE NOTICE '  Created: %', housing_record.created_at;
    RAISE NOTICE '';
  END LOOP;
END $$;

-- STEP 4: Check if users share any organizations
DO $$
DECLARE
  shared_count INTEGER;
  shared_record RECORD;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'SHARED ORGANIZATIONS CHECK';
  RAISE NOTICE '========================================';

  -- Count shared organizations
  SELECT COUNT(DISTINCT om1.organization_id) INTO shared_count
  FROM organization_members om1
  JOIN organization_members om2 ON om1.organization_id = om2.organization_id
  JOIN auth.users u1 ON om1.user_id = u1.id
  JOIN auth.users u2 ON om2.user_id = u2.id
  WHERE u1.email LIKE '%emorain%'
    AND u2.email LIKE '%oltmanjt%'
    AND om1.is_active = true
    AND om2.is_active = true;

  IF shared_count > 0 THEN
    RAISE WARNING 'FOUND % SHARED ORGANIZATION(S)!', shared_count;
    RAISE WARNING 'This explains why oltmanjt can see emorain''s housing!';
    RAISE NOTICE '';

    FOR shared_record IN
      SELECT
        o.name as org_name,
        o.id as org_id,
        u1.email as user1,
        om1.role as role1,
        u2.email as user2,
        om2.role as role2
      FROM organization_members om1
      JOIN organization_members om2 ON om1.organization_id = om2.organization_id
      JOIN organizations o ON om1.organization_id = o.id
      JOIN auth.users u1 ON om1.user_id = u1.id
      JOIN auth.users u2 ON om2.user_id = u2.id
      WHERE u1.email LIKE '%emorain%'
        AND u2.email LIKE '%oltmanjt%'
        AND om1.is_active = true
        AND om2.is_active = true
    LOOP
      RAISE NOTICE 'Shared Organization: "%"', shared_record.org_name;
      RAISE NOTICE '  % (role: %)', shared_record.user1, shared_record.role1;
      RAISE NOTICE '  % (role: %)', shared_record.user2, shared_record.role2;
      RAISE NOTICE '';
    END LOOP;
  ELSE
    RAISE NOTICE 'No shared organizations found.';
    RAISE NOTICE 'Users are in separate organizations (as expected).';
  END IF;

  RAISE NOTICE '';
END $$;

-- STEP 5: Diagnosis summary
DO $$
DECLARE
  emorain_housing_null INTEGER;
  oltmanjt_housing_null INTEGER;
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE 'DIAGNOSIS SUMMARY';
  RAISE NOTICE '========================================';

  -- Count housing units with NULL organization_id for each user
  SELECT COUNT(*) INTO emorain_housing_null
  FROM housing_units hu
  JOIN auth.users u ON hu.user_id = u.id
  WHERE u.email LIKE '%emorain%'
    AND hu.organization_id IS NULL;

  SELECT COUNT(*) INTO oltmanjt_housing_null
  FROM housing_units hu
  JOIN auth.users u ON hu.user_id = u.id
  WHERE u.email LIKE '%oltmanjt%'
    AND hu.organization_id IS NULL;

  RAISE NOTICE 'Housing units with NULL organization_id:';
  RAISE NOTICE '  emorain: %', emorain_housing_null;
  RAISE NOTICE '  oltmanjt: %', oltmanjt_housing_null;
  RAISE NOTICE '';

  IF emorain_housing_null > 0 THEN
    RAISE WARNING '❌ PROBLEM: emorain has % housing units with NULL organization_id', emorain_housing_null;
    RAISE WARNING '   This is why oltmanjt can see them (NULL bypasses RLS)!';
  ELSE
    RAISE NOTICE '✓ emorain housing units have organization_id set';
  END IF;

  IF oltmanjt_housing_null > 0 THEN
    RAISE WARNING '❌ PROBLEM: oltmanjt has % housing units with NULL organization_id', oltmanjt_housing_null;
    RAISE WARNING '   This is why emorain should see them (but RLS might be blocking)';
  ELSE
    RAISE NOTICE '✓ oltmanjt housing units have organization_id set';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
