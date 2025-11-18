-- Migration: Add location tracking for sows (Prop 12 compliance)
-- Run this in Supabase SQL Editor

-- 1. Add current_location field to track where sows are housed
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS current_location VARCHAR(50)
CHECK (current_location IN ('breeding', 'gestation', 'farrowing', 'hospital', 'quarantine', 'other'));

-- 2. Add last_location_change field to track when sow was moved
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS last_location_change TIMESTAMP WITH TIME ZONE;

-- 3. Set default location for existing sows based on their current status
UPDATE sows
SET current_location = 'gestation'
WHERE current_location IS NULL AND status = 'active';

-- 4. Create a location_history table for Prop 12 compliance tracking
CREATE TABLE IF NOT EXISTS sow_location_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,
  from_location VARCHAR(50),
  to_location VARCHAR(50) NOT NULL,
  moved_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  moved_by UUID REFERENCES auth.users(id),
  reason VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create index on sow_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_location_history_sow_id ON sow_location_history(sow_id);
CREATE INDEX IF NOT EXISTS idx_location_history_moved_at ON sow_location_history(moved_at);

-- 6. Create a temporary_confinement table for Prop 12 compliance
-- Tracks temporary confinement periods (max 6 hours, 24 hours per 30 days)
CREATE TABLE IF NOT EXISTS sow_temporary_confinement (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(5,2),
  reason VARCHAR(255) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create index on sow_id and start_time
CREATE INDEX IF NOT EXISTS idx_temp_confinement_sow_id ON sow_temporary_confinement(sow_id);
CREATE INDEX IF NOT EXISTS idx_temp_confinement_start_time ON sow_temporary_confinement(start_time);

-- 8. Add function to calculate total temporary confinement in last 30 days
CREATE OR REPLACE FUNCTION get_temp_confinement_hours_30days(p_sow_id UUID)
RETURNS DECIMAL AS $$
DECLARE
  total_hours DECIMAL;
BEGIN
  SELECT COALESCE(SUM(duration_hours), 0)
  INTO total_hours
  FROM sow_temporary_confinement
  WHERE sow_id = p_sow_id
    AND start_time >= NOW() - INTERVAL '30 days'
    AND end_time IS NOT NULL;

  RETURN total_hours;
END;
$$ LANGUAGE plpgsql;

-- 9. Add comments for documentation
COMMENT ON COLUMN sows.current_location IS 'Current physical location of sow for Prop 12 compliance tracking';
COMMENT ON COLUMN sows.last_location_change IS 'Timestamp of last location change for compliance tracking';
COMMENT ON TABLE sow_location_history IS 'Complete history of sow movements for Prop 12 compliance documentation';
COMMENT ON TABLE sow_temporary_confinement IS 'Tracks temporary confinement periods for Prop 12 compliance (max 6hrs, 24hrs per 30 days)';

-- Verify the changes
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'sows' AND column_name IN ('current_location', 'last_location_change')
ORDER BY ordinal_position;
