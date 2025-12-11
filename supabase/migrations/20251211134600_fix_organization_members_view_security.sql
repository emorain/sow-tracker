-- Fix organization_members_with_email view to use security_definer
-- This allows the view to read from auth.users while still respecting RLS on organization_members

-- Drop the old view
DROP VIEW IF EXISTS organization_members_with_email;

-- Create a SECURITY DEFINER function that returns the joined data
CREATE OR REPLACE FUNCTION get_organization_members_with_email(org_id UUID DEFAULT NULL)
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
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
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
    u.raw_user_meta_data->>'full_name' as full_name,
    u.raw_user_meta_data->>'avatar_url' as avatar_url
  FROM organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  WHERE
    -- Apply RLS-like filtering: user must be member of the org or viewing their own record
    (om.user_id = auth.uid() OR is_organization_member(om.organization_id, auth.uid()))
    AND (org_id IS NULL OR om.organization_id = org_id);
END;
$$;

-- Recreate the view using the function for backwards compatibility
CREATE OR REPLACE VIEW organization_members_with_email AS
SELECT * FROM get_organization_members_with_email();

-- Grant access to authenticated users
GRANT EXECUTE ON FUNCTION get_organization_members_with_email(UUID) TO authenticated;
GRANT SELECT ON organization_members_with_email TO authenticated;

-- Add comments
COMMENT ON FUNCTION get_organization_members_with_email(UUID) IS
  'Security definer function that joins organization_members with auth.users. Applies RLS-like filtering using is_organization_member helper.';
COMMENT ON VIEW organization_members_with_email IS
  'View that provides organization members with email addresses. Uses security definer function to access auth.users.';
