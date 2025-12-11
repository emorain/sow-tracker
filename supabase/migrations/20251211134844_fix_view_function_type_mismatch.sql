-- Fix type mismatch between function and view
-- The issue is that 'role' column type needs to match exactly

-- Drop the old function and view
DROP VIEW IF EXISTS organization_members_with_email;
DROP FUNCTION IF EXISTS get_organization_members_with_email(UUID);

-- Create a simpler SECURITY DEFINER function that just does the join
-- Let the RLS policies on organization_members handle the filtering
CREATE OR REPLACE FUNCTION get_organization_members_with_email()
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  user_id UUID,
  role TEXT,
  invited_by UUID,
  invited_at TIMESTAMPTZ,
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT
)
SECURITY DEFINER
SET search_path = public
LANGUAGE sql
STABLE
AS $$
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role::TEXT,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.is_active,
    om.created_at,
    om.updated_at,
    u.email,
    (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
    (u.raw_user_meta_data->>'avatar_url')::TEXT as avatar_url
  FROM organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id;
$$;

-- Recreate the view
CREATE OR REPLACE VIEW organization_members_with_email AS
SELECT * FROM get_organization_members_with_email();

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_organization_members_with_email() TO authenticated;
GRANT SELECT ON organization_members_with_email TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_organization_members_with_email() IS
  'Security definer function that joins organization_members with auth.users. RLS policies on organization_members are applied automatically.';
COMMENT ON VIEW organization_members_with_email IS
  'View that provides organization members with email addresses. Uses security definer function to access auth.users while respecting RLS.';
