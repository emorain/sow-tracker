-- Check current user's organization memberships
SELECT 
  om.*,
  o.name as org_name,
  u.email as user_email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
ORDER BY om.created_at DESC;

-- Check if the view works
SELECT * FROM organization_members_with_email LIMIT 5;

-- Check organizations
SELECT * FROM organizations ORDER BY created_at DESC;

-- If no membership exists, this will create one for all users
-- Uncomment the below if needed:
/*
INSERT INTO organization_members (organization_id, user_id, role, invited_at, joined_at, is_active)
SELECT 
  o.id,
  u.id,
  'owner',
  NOW(),
  NOW(),
  true
FROM auth.users u
CROSS JOIN organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om2 
  WHERE om2.user_id = u.id AND om2.organization_id = o.id
)
ON CONFLICT DO NOTHING;
*/
