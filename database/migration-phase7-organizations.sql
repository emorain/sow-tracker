-- Migration: Phase 7 - Organizations and Multi-User Collaboration
-- This creates the foundation for team collaboration and organization management

-- ========================================
-- 1. Create Organizations Table
-- ========================================

CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  logo_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 2. Create Organization Members Table
-- ========================================

CREATE TABLE IF NOT EXISTS organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'member', 'vet', 'readonly')),
  invited_by UUID REFERENCES auth.users(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure a user can only be in an org once
  UNIQUE(organization_id, user_id)
);

-- ========================================
-- 3. Add organization_id to existing tables
-- ========================================
-- Note: We'll keep user_id for backwards compatibility during transition
-- Later we can fully migrate to org-based access

ALTER TABLE sows
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE boars
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE piglets
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE housing_units
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE scheduled_tasks
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE matrix_batches
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE protocols
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

ALTER TABLE boar_location_history
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE;

-- ========================================
-- 4. Create indexes for performance
-- ========================================

CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_role ON organization_members(role);

CREATE INDEX IF NOT EXISTS idx_sows_org_id ON sows(organization_id);
CREATE INDEX IF NOT EXISTS idx_boars_org_id ON boars(organization_id);
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_org_id ON breeding_attempts(organization_id);
CREATE INDEX IF NOT EXISTS idx_farrowings_org_id ON farrowings(organization_id);
CREATE INDEX IF NOT EXISTS idx_piglets_org_id ON piglets(organization_id);
CREATE INDEX IF NOT EXISTS idx_health_records_org_id ON health_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_housing_units_org_id ON housing_units(organization_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_tasks_org_id ON scheduled_tasks(organization_id);

-- ========================================
-- 5. Create RLS Policies for Organizations
-- ========================================

-- Enable RLS on new tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Organizations: Users can only see orgs they're members of
CREATE POLICY "Users can view their organizations"
  ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organizations: Only owners can update org settings
CREATE POLICY "Owners can update organizations"
  ON organizations
  FOR UPDATE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Organizations: Only owners can delete orgs
CREATE POLICY "Owners can delete organizations"
  ON organizations
  FOR DELETE
  USING (
    id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Organization Members: Can view members of their org
CREATE POLICY "Users can view org members"
  ON organization_members
  FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Organization Members: Owners and managers can invite
CREATE POLICY "Owners and managers can invite members"
  ON organization_members
  FOR INSERT
  WITH CHECK (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid()
        AND role IN ('owner', 'manager')
        AND is_active = true
    )
  );

-- Organization Members: Owners can manage members
CREATE POLICY "Owners can update members"
  ON organization_members
  FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- Organization Members: Owners can remove members
CREATE POLICY "Owners can delete members"
  ON organization_members
  FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND role = 'owner' AND is_active = true
    )
  );

-- ========================================
-- 6. Create helper function to get user's organization
-- ========================================

CREATE OR REPLACE FUNCTION get_user_organization_id(p_user_id UUID)
RETURNS UUID AS $$
  SELECT organization_id
  FROM organization_members
  WHERE user_id = p_user_id
    AND is_active = true
  LIMIT 1;
$$ LANGUAGE SQL STABLE;

-- ========================================
-- 7. Create function to auto-create org for new users
-- ========================================

CREATE OR REPLACE FUNCTION create_organization_for_new_user()
RETURNS TRIGGER AS $$
DECLARE
  v_org_id UUID;
  v_org_name VARCHAR(255);
  v_org_slug VARCHAR(100);
BEGIN
  -- Generate org name from email
  v_org_name := SPLIT_PART(NEW.email, '@', 1) || '''s Farm';
  v_org_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '-farm';

  -- Make slug unique by appending random characters if needed
  WHILE EXISTS (SELECT 1 FROM organizations WHERE slug = v_org_slug) LOOP
    v_org_slug := v_org_slug || '-' || substr(md5(random()::text), 1, 6);
  END LOOP;

  -- Create organization
  INSERT INTO organizations (name, slug, settings)
  VALUES (v_org_name, v_org_slug, '{"farm_name": "' || v_org_name || '"}')
  RETURNING id INTO v_org_id;

  -- Add user as owner
  INSERT INTO organization_members (organization_id, user_id, role, joined_at, invited_by)
  VALUES (v_org_id, NEW.id, 'owner', NOW(), NEW.id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created_create_org ON auth.users;
CREATE TRIGGER on_auth_user_created_create_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_organization_for_new_user();

-- ========================================
-- 8. Migrate existing users to organizations
-- ========================================

-- Create a migration function to run once
CREATE OR REPLACE FUNCTION migrate_existing_users_to_orgs()
RETURNS void AS $$
DECLARE
  v_user RECORD;
  v_org_id UUID;
BEGIN
  -- For each existing user without an organization
  FOR v_user IN
    SELECT DISTINCT u.id, u.email
    FROM auth.users u
    LEFT JOIN organization_members om ON om.user_id = u.id
    WHERE om.id IS NULL
  LOOP
    -- Create organization for this user
    INSERT INTO organizations (name, slug, settings)
    VALUES (
      SPLIT_PART(v_user.email, '@', 1) || '''s Farm',
      LOWER(REGEXP_REPLACE(SPLIT_PART(v_user.email, '@', 1), '[^a-zA-Z0-9]', '', 'g')) || '-farm-' || substr(md5(random()::text), 1, 6),
      jsonb_build_object('farm_name', SPLIT_PART(v_user.email, '@', 1) || '''s Farm')
    )
    RETURNING id INTO v_org_id;

    -- Add user as owner
    INSERT INTO organization_members (organization_id, user_id, role, joined_at, invited_by)
    VALUES (v_org_id, v_user.id, 'owner', NOW(), v_user.id);

    -- Update all their existing data with org_id
    UPDATE sows SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE boars SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE breeding_attempts SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE farrowings SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE piglets SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE health_records SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE housing_units SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE scheduled_tasks SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE matrix_batches SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE matrix_treatments SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE protocols SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE sow_location_history SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE boar_location_history SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Run the migration (comment out after first run)
-- SELECT migrate_existing_users_to_orgs();

-- ========================================
-- 9. Comments for documentation
-- ========================================

COMMENT ON TABLE organizations IS 'Organizations/Farms that users belong to for multi-user collaboration';
COMMENT ON TABLE organization_members IS 'Team members within an organization with their roles and permissions';
COMMENT ON COLUMN organization_members.role IS 'User role: owner (full access), manager (edit), member (basic), vet (health only), readonly (view only)';

-- ========================================
-- 10. Grant permissions
-- ========================================

GRANT SELECT, INSERT, UPDATE, DELETE ON organizations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_members TO authenticated;
