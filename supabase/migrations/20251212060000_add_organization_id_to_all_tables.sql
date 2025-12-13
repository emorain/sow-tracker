-- Add organization_id to all main tables
-- This migration adds organization_id to all tables that store farm data

-- Sows
ALTER TABLE sows ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sows_organization_id ON sows(organization_id);

-- Boars
ALTER TABLE boars ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_boars_organization_id ON boars(organization_id);

-- Farrowings
ALTER TABLE farrowings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_farrowings_organization_id ON farrowings(organization_id);

-- Piglets
ALTER TABLE piglets ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_piglets_organization_id ON piglets(organization_id);

-- Breeding Attempts
ALTER TABLE breeding_attempts ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_breeding_attempts_organization_id ON breeding_attempts(organization_id);

-- Health Records
ALTER TABLE health_records ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_health_records_organization_id ON health_records(organization_id);

-- Housing Units
ALTER TABLE housing_units ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_housing_units_organization_id ON housing_units(organization_id);

-- Tasks (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'tasks') THEN
    ALTER TABLE tasks ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_tasks_organization_id ON tasks(organization_id);
  END IF;
END $$;

-- Protocols (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocols') THEN
    ALTER TABLE protocols ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_protocols_organization_id ON protocols(organization_id);
  END IF;
END $$;

-- Protocol Templates (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'protocol_templates') THEN
    ALTER TABLE protocol_templates ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_protocol_templates_organization_id ON protocol_templates(organization_id);
  END IF;
END $$;

-- Calendar Events (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    ALTER TABLE calendar_events ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_calendar_events_organization_id ON calendar_events(organization_id);
  END IF;
END $$;

-- Matrix Treatments (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matrix_treatments') THEN
    ALTER TABLE matrix_treatments ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_matrix_treatments_organization_id ON matrix_treatments(organization_id);
  END IF;
END $$;

-- Matrix Treatment Batches (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matrix_treatment_batches') THEN
    ALTER TABLE matrix_treatment_batches ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_matrix_treatment_batches_organization_id ON matrix_treatment_batches(organization_id);
  END IF;
END $$;

-- AI Semen Doses (if table exists)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_semen_doses') THEN
    ALTER TABLE ai_semen_doses ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
    CREATE INDEX IF NOT EXISTS idx_ai_semen_doses_organization_id ON ai_semen_doses(organization_id);
  END IF;
END $$;

-- Sow Transfer Requests
ALTER TABLE sow_transfer_requests ADD COLUMN IF NOT EXISTS from_organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE sow_transfer_requests ADD COLUMN IF NOT EXISTS to_organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_sow_transfer_requests_from_org ON sow_transfer_requests(from_organization_id);
CREATE INDEX IF NOT EXISTS idx_sow_transfer_requests_to_org ON sow_transfer_requests(to_organization_id);

-- Boar Transfer Requests
ALTER TABLE boar_transfer_requests ADD COLUMN IF NOT EXISTS from_organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
ALTER TABLE boar_transfer_requests ADD COLUMN IF NOT EXISTS to_organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_from_org ON boar_transfer_requests(from_organization_id);
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_to_org ON boar_transfer_requests(to_organization_id);

-- Notifications
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_notifications_organization_id ON notifications(organization_id);

-- Farm Settings
ALTER TABLE farm_settings ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_farm_settings_organization_id ON farm_settings(organization_id);

-- Add comments
COMMENT ON COLUMN sows.organization_id IS 'Organization that owns this sow';
COMMENT ON COLUMN boars.organization_id IS 'Organization that owns this boar';
COMMENT ON COLUMN farrowings.organization_id IS 'Organization that owns this farrowing record';
COMMENT ON COLUMN piglets.organization_id IS 'Organization that owns this piglet';
COMMENT ON COLUMN breeding_attempts.organization_id IS 'Organization that owns this breeding attempt';
COMMENT ON COLUMN health_records.organization_id IS 'Organization that owns this health record';
COMMENT ON COLUMN housing_units.organization_id IS 'Organization that owns this housing unit';
COMMENT ON COLUMN farm_settings.organization_id IS 'Organization these settings belong to';
