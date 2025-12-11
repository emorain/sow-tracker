-- Create a view that joins organization_members with auth.users to get email addresses
-- This allows the frontend to fetch member emails without needing admin access
-- The view inherits RLS from the organization_members table

CREATE OR REPLACE VIEW organization_members_with_email 
WITH (security_invoker = true)
AS
SELECT 
  om.id,
  om.organization_id,
  om.user_id,
  om.role,
  om.invited_by,
  om.invited_at,
  om.joined_at,
  om.is_active,
  om.created_at,
  om.updated_at,
  u.email,
  u.raw_user_meta_data->>'full_name' as full_name,
  u.raw_user_meta_data->>'avatar_url' as avatar_url
FROM organization_members om
LEFT JOIN auth.users u ON u.id = om.user_id;

-- Grant access to authenticated users
GRANT SELECT ON organization_members_with_email TO authenticated;

-- Add helpful comment
COMMENT ON VIEW organization_members_with_email IS 
  'View that joins organization_members with auth.users to provide email addresses for team member display. Security is enforced through security_invoker=true which applies the RLS policies of the underlying organization_members table.';
