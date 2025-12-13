-- Populate organization_id for all existing data
-- This assigns existing data to the user's first/primary organization

-- Helper function to get user's primary organization
CREATE OR REPLACE FUNCTION get_user_primary_organization(p_user_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM organization_members
  WHERE user_id = p_user_id
    AND is_active = true
  ORDER BY created_at ASC
  LIMIT 1;

  RETURN v_org_id;
END;
$$;

-- Update sows
UPDATE sows
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update boars
UPDATE boars
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update farrowings
UPDATE farrowings
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update piglets
UPDATE piglets
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update breeding_attempts
UPDATE breeding_attempts
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update health_records
UPDATE health_records
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update housing_units
UPDATE housing_units
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update tasks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    UPDATE tasks SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update protocols (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocols') THEN
    UPDATE protocols SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update protocol_templates (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocol_templates') THEN
    UPDATE protocol_templates SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update calendar_events (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    UPDATE calendar_events SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update matrix_treatments (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matrix_treatments') THEN
    UPDATE matrix_treatments SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update matrix_treatment_batches (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matrix_treatment_batches') THEN
    UPDATE matrix_treatment_batches SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update ai_semen_doses (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_semen_doses') THEN
    UPDATE ai_semen_doses SET organization_id = get_user_primary_organization(user_id) WHERE organization_id IS NULL;
  END IF;
END $$;

-- Update notifications
UPDATE notifications
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update farm_settings
UPDATE farm_settings
SET organization_id = get_user_primary_organization(user_id)
WHERE organization_id IS NULL;

-- Update transfer requests (these are trickier)
UPDATE sow_transfer_requests
SET from_organization_id = get_user_primary_organization(from_user_id),
    to_organization_id = get_user_primary_organization(to_user_id)
WHERE from_organization_id IS NULL OR to_organization_id IS NULL;

UPDATE boar_transfer_requests
SET from_organization_id = get_user_primary_organization(from_user_id),
    to_organization_id = get_user_primary_organization(to_user_id)
WHERE from_organization_id IS NULL OR to_organization_id IS NULL;

-- Delete any rows that still have NULL organization_id (orphaned data)
DELETE FROM sows WHERE organization_id IS NULL;
DELETE FROM boars WHERE organization_id IS NULL;
DELETE FROM farrowings WHERE organization_id IS NULL;
DELETE FROM piglets WHERE organization_id IS NULL;
DELETE FROM breeding_attempts WHERE organization_id IS NULL;
DELETE FROM health_records WHERE organization_id IS NULL;
DELETE FROM housing_units WHERE organization_id IS NULL;
DELETE FROM farm_settings WHERE organization_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocols') THEN
    DELETE FROM protocols WHERE organization_id IS NULL;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    DELETE FROM tasks WHERE organization_id IS NULL;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    DELETE FROM calendar_events WHERE organization_id IS NULL;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notifications') THEN
    DELETE FROM notifications WHERE organization_id IS NULL;
  END IF;
END $$;

-- Make organization_id NOT NULL after population (for data integrity)
ALTER TABLE sows ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE boars ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE farrowings ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE piglets ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE breeding_attempts ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE health_records ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE housing_units ALTER COLUMN organization_id SET NOT NULL;
ALTER TABLE farm_settings ALTER COLUMN organization_id SET NOT NULL;

-- Make NOT NULL for tables that exist
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks ALTER COLUMN organization_id SET NOT NULL;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocols') THEN
    ALTER TABLE protocols ALTER COLUMN organization_id SET NOT NULL;
  END IF;
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    ALTER TABLE calendar_events ALTER COLUMN organization_id SET NOT NULL;
  END IF;
END $$;
