-- Run this in Supabase SQL Editor to see what's happening

-- 1. Show all organizations
SELECT id, name, slug, created_at
FROM organizations
ORDER BY created_at;

-- 2. Show all organization memberships
SELECT
  om.id,
  om.organization_id,
  om.user_id,
  u.email,
  om.role,
  om.is_active,
  om.joined_at,
  om.created_at,
  o.name as org_name
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
ORDER BY om.user_id, om.created_at;

-- 3. Count memberships per user
SELECT
  u.email,
  COUNT(*) as membership_count,
  STRING_AGG(o.name, ', ') as organizations
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE om.is_active = true
GROUP BY u.email
HAVING COUNT(*) > 1;

-- 4. Check for users with NO organization
SELECT u.id, u.email
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om
  WHERE om.user_id = u.id AND om.is_active = true
);

-- 5. Show data distribution across organizations
SELECT
  o.name as organization,
  COUNT(DISTINCT om.user_id) as members,
  COUNT(DISTINCT s.id) as sows,
  COUNT(DISTINCT b.id) as boars
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id AND om.is_active = true
LEFT JOIN sows s ON s.organization_id = o.id
LEFT JOIN boars b ON b.organization_id = o.id
GROUP BY o.id, o.name
ORDER BY o.created_at;
