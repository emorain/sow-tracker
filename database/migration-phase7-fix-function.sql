-- Fix the migrate_existing_users_to_orgs function
-- This replaces the buggy version with the corrected one

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
    UPDATE matrix_treatments SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;
    UPDATE protocols SET organization_id = v_org_id WHERE user_id = v_user.id AND organization_id IS NULL;

    -- Update location history tables via their parent tables
    UPDATE sow_location_history
    SET organization_id = v_org_id
    WHERE sow_id IN (SELECT id FROM sows WHERE user_id = v_user.id)
      AND organization_id IS NULL;

    UPDATE boar_location_history
    SET organization_id = v_org_id
    WHERE boar_id IN (SELECT id FROM boars WHERE user_id = v_user.id)
      AND organization_id IS NULL;
  END LOOP;
END;
$$ LANGUAGE plpgsql;
