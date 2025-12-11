-- Run this directly in Supabase SQL Editor to fix the infinite recursion

-- Drop ALL existing organization_members policies
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT policyname FROM pg_policies WHERE tablename = 'organization_members'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || r.policyname || '" ON organization_members';
    END LOOP;
END $$;

-- Create helper function to check if user is member of an organization (bypasses RLS)
CREATE OR REPLACE FUNCTION is_organization_member(org_id UUID, check_user_id UUID)
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = check_user_id
      AND is_active = true
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Create helper function to check if user has specific role (bypasses RLS)
CREATE OR REPLACE FUNCTION has_organization_role(org_id UUID, check_user_id UUID, required_roles TEXT[])
RETURNS BOOLEAN
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_members
    WHERE organization_id = org_id
      AND user_id = check_user_id
      AND is_active = true
      AND role = ANY(required_roles)
  );
END;
$$ LANGUAGE plpgsql STABLE;

-- Now create simple policies using the helper functions (no recursion!)
CREATE POLICY "Users can view organization members"
  ON organization_members
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR
    is_organization_member(organization_id, auth.uid())
  );

CREATE POLICY "Owners and managers can add members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    has_organization_role(organization_id, auth.uid(), ARRAY['owner', 'manager'])
  );

CREATE POLICY "Owners can update members"
  ON organization_members
  FOR UPDATE
  USING (
    has_organization_role(organization_id, auth.uid(), ARRAY['owner'])
  )
  WITH CHECK (
    has_organization_role(organization_id, auth.uid(), ARRAY['owner'])
  );

CREATE POLICY "Owners can remove members"
  ON organization_members
  FOR DELETE
  USING (
    has_organization_role(organization_id, auth.uid(), ARRAY['owner'])
  );

-- Grant execute on helper functions
GRANT EXECUTE ON FUNCTION is_organization_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION has_organization_role(UUID, UUID, TEXT[]) TO authenticated;
