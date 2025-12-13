-- Migration: Create team invite system for token-based invitations
-- Allows inviting users who don't have accounts yet

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ========================================
-- 1. CREATE TEAM_INVITES TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS team_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL,
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  invited_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('manager', 'member', 'vet', 'readonly')),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  accepted_at timestamptz,
  accepted_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),

  -- Prevent duplicate active invites for same email to same org
  CONSTRAINT unique_active_invite UNIQUE (organization_id, email, accepted_at)
);

-- Add index for token lookups
CREATE INDEX idx_team_invites_token ON team_invites(token) WHERE accepted_at IS NULL;

-- Add index for org invites
CREATE INDEX idx_team_invites_org ON team_invites(organization_id) WHERE accepted_at IS NULL;

-- Add RLS policies
ALTER TABLE team_invites ENABLE ROW LEVEL SECURITY;

-- Users can view invites they created
CREATE POLICY "Users can view their sent invites"
  ON team_invites
  FOR SELECT
  USING (invited_by = auth.uid());

-- Users can view invites sent to their email
CREATE POLICY "Users can view invites to their email"
  ON team_invites
  FOR SELECT
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- Managers/owners can create invites
CREATE POLICY "Managers can create invites"
  ON team_invites
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM organization_members
      WHERE organization_id = team_invites.organization_id
        AND user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND is_active = true
    )
  );

-- Users can update their own invites (accept)
CREATE POLICY "Users can accept invites"
  ON team_invites
  FOR UPDATE
  USING (email = (SELECT email FROM auth.users WHERE id = auth.uid()))
  WITH CHECK (email = (SELECT email FROM auth.users WHERE id = auth.uid()));

-- ========================================
-- 2. CREATE FUNCTION TO ACCEPT INVITE
-- ========================================

CREATE OR REPLACE FUNCTION accept_team_invite(invite_token text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_invite team_invites;
  v_user_email text;
  v_result json;
BEGIN
  -- Get current user's email
  SELECT email INTO v_user_email
  FROM auth.users
  WHERE id = auth.uid();

  IF v_user_email IS NULL THEN
    RAISE EXCEPTION 'User not authenticated';
  END IF;

  -- Get the invite
  SELECT * INTO v_invite
  FROM team_invites
  WHERE token = invite_token
    AND accepted_at IS NULL
    AND expires_at > now()
    AND email = v_user_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invalid or expired invite token';
  END IF;

  -- Check if user is already a member
  IF EXISTS (
    SELECT 1 FROM organization_members
    WHERE organization_id = v_invite.organization_id
      AND user_id = auth.uid()
  ) THEN
    -- Mark invite as accepted anyway
    UPDATE team_invites
    SET accepted_at = now(),
        accepted_by = auth.uid()
    WHERE id = v_invite.id;

    RAISE EXCEPTION 'You are already a member of this organization';
  END IF;

  -- Add user to organization
  INSERT INTO organization_members (
    organization_id,
    user_id,
    role,
    invited_by,
    invited_at,
    joined_at,
    is_active
  ) VALUES (
    v_invite.organization_id,
    auth.uid(),
    v_invite.role,
    v_invite.invited_by,
    v_invite.created_at,
    now(),
    true
  );

  -- Mark invite as accepted
  UPDATE team_invites
  SET accepted_at = now(),
      accepted_by = auth.uid()
  WHERE id = v_invite.id;

  -- Return success with org info
  SELECT json_build_object(
    'organization_id', v_invite.organization_id,
    'role', v_invite.role,
    'success', true
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ========================================
-- 3. CREATE FUNCTION TO GENERATE SLUG
-- ========================================

CREATE OR REPLACE FUNCTION generate_unique_slug(org_name text)
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  v_slug text;
  v_counter int := 0;
  v_final_slug text;
BEGIN
  -- Create base slug from name
  v_slug := lower(regexp_replace(org_name, '[^a-zA-Z0-9]+', '-', 'g'));
  v_slug := regexp_replace(v_slug, '^-+|-+$', '', 'g');

  -- If slug is empty, use default
  IF length(v_slug) = 0 THEN
    v_slug := 'organization';
  END IF;

  v_final_slug := v_slug;

  -- Check for conflicts and add number if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_final_slug) LOOP
    v_counter := v_counter + 1;
    v_final_slug := v_slug || '-' || v_counter;
  END LOOP;

  RETURN v_final_slug;
END;
$$;

-- ========================================
-- 4. ADD COMMENTS
-- ========================================

COMMENT ON TABLE team_invites IS 'Stores invitation tokens for users who do not yet have accounts. Allows token-based invite acceptance.';
COMMENT ON FUNCTION accept_team_invite IS 'Accepts a team invite by token, adding the user to the organization.';
COMMENT ON FUNCTION generate_unique_slug IS 'Generates a unique slug for an organization name, handling conflicts.';
