-- Ensure all users have organization membership
-- This fixes the issue where users may have an organization but no membership record

-- First, ensure every user who has data has an organization
INSERT INTO organizations (id, name, slug, created_at, updated_at)
SELECT 
  gen_random_uuid(),
  COALESCE(u.email, 'My Farm') || '''s Organization',
  LOWER(REGEXP_REPLACE(COALESCE(u.email, gen_random_uuid()::text), '[^a-zA-Z0-9]', '-', 'g')),
  NOW(),
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om WHERE om.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Now create organization memberships for all users who don't have one
-- Make them owners of their organization
INSERT INTO organization_members (organization_id, user_id, role, invited_at, joined_at, is_active, created_at, updated_at)
SELECT 
  o.id,
  u.id,
  'owner',
  NOW(),
  NOW(),
  true,
  NOW(),
  NOW()
FROM auth.users u
CROSS JOIN LATERAL (
  -- Get the first organization, or create association with any org if none exists
  SELECT id FROM organizations 
  ORDER BY created_at DESC 
  LIMIT 1
) o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_members om2 
  WHERE om2.user_id = u.id
)
ON CONFLICT DO NOTHING;

-- Update existing data to have organization_id where missing
-- This ensures sows, boars, etc. are associated with the user's organization
UPDATE sows s
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = s.user_id AND om.is_active = true
  LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

UPDATE boars b
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = b.user_id AND om.is_active = true
  LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

UPDATE farrowings f
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = f.user_id AND om.is_active = true
  LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

UPDATE piglets p
SET organization_id = (
  SELECT om.organization_id 
  FROM organization_members om 
  WHERE om.user_id = p.user_id AND om.is_active = true
  LIMIT 1
)
WHERE organization_id IS NULL AND user_id IS NOT NULL;

-- Add helpful comment
COMMENT ON TABLE organization_members IS 
  'Tracks which users belong to which organizations and their roles. Every user should have at least one organization membership.';
