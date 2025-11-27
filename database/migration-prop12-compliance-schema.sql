-- Migration: Prop 12 Compliance Schema
-- Adds tables and columns needed for California Proposition 12 compliance
-- Including location history, confinement tracking, transactions, and certifications

-- ========================================
-- 1. ADD FLOOR SPACE TO HOUSING UNITS
-- ========================================

-- Add floor space column to housing_units table
ALTER TABLE housing_units
ADD COLUMN IF NOT EXISTS floor_space_sqft DECIMAL(10,2);

COMMENT ON COLUMN housing_units.floor_space_sqft IS 'Usable floor space in square feet - required for Prop 12 compliance (24 sq ft minimum per breeding sow)';

-- ========================================
-- 2. CREATE LOCATION HISTORY TABLE
-- ========================================

-- Automatic audit trail of all housing transfers
CREATE TABLE IF NOT EXISTS location_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  housing_unit_id UUID REFERENCES housing_units(id),
  moved_in_date TIMESTAMP WITH TIME ZONE NOT NULL,
  moved_out_date TIMESTAMP WITH TIME ZONE,
  reason TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_location_history_sow
  ON location_history(sow_id, moved_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_location_history_housing
  ON location_history(housing_unit_id, moved_in_date DESC);
CREATE INDEX IF NOT EXISTS idx_location_history_dates
  ON location_history(moved_in_date, moved_out_date);

-- Enable RLS
ALTER TABLE location_history ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own location history"
  ON location_history
  FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE location_history IS 'Audit trail of all sow housing transfers - critical for Prop 12 compliance documentation';

-- ========================================
-- 3. CREATE CONFINEMENT EVENTS TABLE
-- ========================================

-- Track individual confinement events for 6hr/24hr and 24hr/30day limits
CREATE TABLE IF NOT EXISTS confinement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sow_id UUID REFERENCES sows(id) ON DELETE CASCADE,
  housing_unit_id UUID REFERENCES housing_units(id),
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  duration_hours DECIMAL(10,2),
  reason TEXT NOT NULL, -- 'breeding', 'medical', 'farrowing', 'other'
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for compliance calculations
CREATE INDEX IF NOT EXISTS idx_confinement_events_sow_time
  ON confinement_events(sow_id, start_time DESC);
CREATE INDEX IF NOT EXISTS idx_confinement_events_reason
  ON confinement_events(reason, start_time DESC);

-- Enable RLS
ALTER TABLE confinement_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own confinement events"
  ON confinement_events
  FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE confinement_events IS 'Individual confinement event tracking for Prop 12 limits: max 6 hours per 24 hours, max 24 hours per 30 days';

-- ========================================
-- 4. CREATE TRANSACTIONS TABLE
-- ========================================

-- Purchase and sale records for 2-year audit trail
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_date DATE NOT NULL,
  transaction_type TEXT NOT NULL, -- 'purchase', 'sale'
  animal_ids UUID[] NOT NULL, -- Array of sow IDs
  quantity INTEGER NOT NULL,
  party_name TEXT NOT NULL, -- Buyer or seller name
  party_address TEXT,
  transfer_location TEXT,
  compliance_status TEXT, -- 'compliant', 'non-compliant', 'pending'
  invoice_number TEXT,
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_transactions_date
  ON transactions(transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type
  ON transactions(transaction_type, transaction_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_animals
  ON transactions USING GIN(animal_ids);

-- Enable RLS
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own transactions"
  ON transactions
  FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE transactions IS 'Purchase and sale records - required for Prop 12 2-year audit trail';

-- ========================================
-- 5. CREATE CERTIFICATIONS TABLE
-- ========================================

-- Prop 12 certification document management
CREATE TABLE IF NOT EXISTS certifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certification_type TEXT NOT NULL, -- 'prop_12', 'other'
  certifier_name TEXT NOT NULL,
  certifier_organization TEXT,
  issue_date DATE NOT NULL,
  expiration_date DATE NOT NULL,
  certificate_number TEXT,
  document_url TEXT,
  status TEXT DEFAULT 'active', -- 'active', 'expired', 'pending_renewal'
  notes TEXT,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_certifications_expiration
  ON certifications(expiration_date ASC);
CREATE INDEX IF NOT EXISTS idx_certifications_type
  ON certifications(certification_type, status);

-- Enable RLS
ALTER TABLE certifications ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can manage their own certifications"
  ON certifications
  FOR ALL
  USING (user_id = auth.uid());

COMMENT ON TABLE certifications IS 'Prop 12 and other compliance certifications with expiration tracking';

-- ========================================
-- 6. CREATE AUTOMATIC LOCATION HISTORY TRIGGER
-- ========================================

-- Function to log location changes automatically
CREATE OR REPLACE FUNCTION log_sow_location_change()
RETURNS TRIGGER AS $$
BEGIN
  -- If housing_unit_id changed, close old location and create new
  IF OLD.housing_unit_id IS DISTINCT FROM NEW.housing_unit_id THEN
    -- Close previous location if exists
    IF OLD.housing_unit_id IS NOT NULL THEN
      UPDATE location_history
      SET moved_out_date = CURRENT_TIMESTAMP
      WHERE sow_id = OLD.id
        AND housing_unit_id = OLD.housing_unit_id
        AND moved_out_date IS NULL;
    END IF;

    -- Create new location entry if new housing unit assigned
    IF NEW.housing_unit_id IS NOT NULL THEN
      INSERT INTO location_history (
        sow_id,
        housing_unit_id,
        moved_in_date,
        user_id
      ) VALUES (
        NEW.id,
        NEW.housing_unit_id,
        CURRENT_TIMESTAMP,
        NEW.user_id
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on sows table
DROP TRIGGER IF EXISTS sow_location_change_trigger ON sows;
CREATE TRIGGER sow_location_change_trigger
  AFTER UPDATE OF housing_unit_id ON sows
  FOR EACH ROW
  EXECUTE FUNCTION log_sow_location_change();

-- ========================================
-- 7. BACKFILL EXISTING LOCATION HISTORY
-- ========================================

-- Create initial location_history entries for all sows with current housing
INSERT INTO location_history (sow_id, housing_unit_id, moved_in_date, user_id)
SELECT
  id,
  housing_unit_id,
  created_at, -- Use sow creation date as initial move-in
  user_id
FROM sows
WHERE housing_unit_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM location_history lh
    WHERE lh.sow_id = sows.id
    AND lh.housing_unit_id = sows.housing_unit_id
    AND lh.moved_out_date IS NULL
  );

-- ========================================
-- 8. CREATE COMPLIANCE HELPER FUNCTIONS
-- ========================================

-- Function to calculate confinement hours in last 24 hours
CREATE OR REPLACE FUNCTION get_confinement_hours_24h(p_sow_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_hours), 0)
    FROM confinement_events
    WHERE sow_id = p_sow_id
      AND start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
      AND end_time IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to calculate confinement hours in last 30 days
CREATE OR REPLACE FUNCTION get_confinement_hours_30d(p_sow_id UUID)
RETURNS DECIMAL AS $$
BEGIN
  RETURN (
    SELECT COALESCE(SUM(duration_hours), 0)
    FROM confinement_events
    WHERE sow_id = p_sow_id
      AND start_time >= CURRENT_DATE - INTERVAL '30 days'
      AND end_time IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if sow is Prop 12 compliant
CREATE OR REPLACE FUNCTION is_sow_compliant(p_sow_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_hours_24h DECIMAL;
  v_hours_30d DECIMAL;
  v_has_space BOOLEAN;
BEGIN
  -- Check confinement limits
  v_hours_24h := get_confinement_hours_24h(p_sow_id);
  v_hours_30d := get_confinement_hours_30d(p_sow_id);

  -- Check if current housing has adequate space
  -- (This is a simplified check - real implementation needs to count pigs per pen)
  v_has_space := EXISTS(
    SELECT 1
    FROM sows s
    JOIN housing_units hu ON hu.id = s.housing_unit_id
    WHERE s.id = p_sow_id
      AND hu.floor_space_sqft >= 24
  );

  -- Compliant if: under confinement limits AND has adequate space
  RETURN (v_hours_24h <= 6 AND v_hours_30d <= 24 AND v_has_space);
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION get_confinement_hours_24h TO authenticated;
GRANT EXECUTE ON FUNCTION get_confinement_hours_30d TO authenticated;
GRANT EXECUTE ON FUNCTION is_sow_compliant TO authenticated;

-- ========================================
-- 9. ANALYZE TABLES
-- ========================================

ANALYZE housing_units;
ANALYZE location_history;
ANALYZE confinement_events;
ANALYZE transactions;
ANALYZE certifications;

-- ========================================
-- 10. USAGE NOTES
-- ========================================

-- Location History:
-- Automatically logged when sow's housing_unit_id changes
-- Query sow's complete location history:
--   SELECT * FROM location_history WHERE sow_id = 'xxx' ORDER BY moved_in_date;
--
-- Confinement Events:
-- Manually log confinement events (breeding, medical, etc.)
-- Check compliance:
--   SELECT get_confinement_hours_24h('sow-id'); -- Must be <= 6
--   SELECT get_confinement_hours_30d('sow-id'); -- Must be <= 24
--
-- Transactions:
-- Log all purchases and sales with party details
-- Query 2-year history:
--   SELECT * FROM transactions
--   WHERE transaction_date >= CURRENT_DATE - INTERVAL '2 years';
--
-- Compliance Check:
--   SELECT is_sow_compliant('sow-id'); -- Returns true/false
