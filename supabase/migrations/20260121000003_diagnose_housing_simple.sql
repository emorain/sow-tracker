-- Simple diagnostic query that returns actual table results
-- This version is easier to read in Supabase SQL Editor

-- Query 1: User Information
SELECT
  'USER INFO' as section,
  u.email,
  u.id as user_id,
  u.created_at
FROM auth.users u
WHERE u.email LIKE '%emorain%' OR u.email LIKE '%oltmanjt%'
ORDER BY u.email;

-- Query 2: Organization Memberships
SELECT
  'ORGANIZATION MEMBERSHIP' as section,
  u.email,
  o.name as organization_name,
  o.id as organization_id,
  om.role,
  om.is_active,
  om.joined_at
FROM auth.users u
JOIN organization_members om ON u.id = om.user_id
JOIN organizations o ON om.organization_id = o.id
WHERE u.email LIKE '%emorain%' OR u.email LIKE '%oltmanjt%'
ORDER BY u.email, om.joined_at;

-- Query 3: Housing Units by User
SELECT
  'HOUSING UNITS' as section,
  u.email as creator_email,
  hu.name as housing_name,
  hu.organization_id,
  o.name as organization_name,
  CASE
    WHEN hu.organization_id IS NULL THEN 'NULL - VISIBLE TO ALL!'
    ELSE 'Has org_id - properly secured'
  END as security_status,
  hu.created_at
FROM housing_units hu
JOIN auth.users u ON hu.user_id = u.id
LEFT JOIN organizations o ON hu.organization_id = o.id
WHERE u.email LIKE '%emorain%' OR u.email LIKE '%oltmanjt%'
ORDER BY u.email, hu.name;

-- Query 4: Check for Shared Organizations
SELECT
  'SHARED ORGANIZATIONS' as section,
  o.name as shared_organization,
  u1.email as user1_email,
  om1.role as user1_role,
  u2.email as user2_email,
  om2.role as user2_role
FROM organization_members om1
JOIN organization_members om2 ON om1.organization_id = om2.organization_id
JOIN organizations o ON om1.organization_id = o.id
JOIN auth.users u1 ON om1.user_id = u1.id
JOIN auth.users u2 ON om2.user_id = u2.id
WHERE u1.email LIKE '%emorain%'
  AND u2.email LIKE '%oltmanjt%'
  AND om1.is_active = true
  AND om2.is_active = true;

-- Query 5: Summary Count
SELECT
  'SUMMARY' as section,
  (SELECT COUNT(*) FROM housing_units hu JOIN auth.users u ON hu.user_id = u.id WHERE u.email LIKE '%emorain%' AND hu.organization_id IS NULL) as emorain_null_housing,
  (SELECT COUNT(*) FROM housing_units hu JOIN auth.users u ON hu.user_id = u.id WHERE u.email LIKE '%oltmanjt%' AND hu.organization_id IS NULL) as oltmanjt_null_housing,
  (SELECT COUNT(*) FROM housing_units hu JOIN auth.users u ON hu.user_id = u.id WHERE u.email LIKE '%emorain%') as emorain_total_housing,
  (SELECT COUNT(*) FROM housing_units hu JOIN auth.users u ON hu.user_id = u.id WHERE u.email LIKE '%oltmanjt%') as oltmanjt_total_housing;
