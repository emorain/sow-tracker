-- Migration: Optimized Compliance Views
-- Creates materialized views and regular views for efficient compliance queries
-- These views pre-compute complex joins and calculations for better performance

-- ========================================
-- 1. SOW COMPLIANCE STATUS VIEW
-- ========================================

-- Comprehensive view of sow compliance status with all relevant metrics
CREATE OR REPLACE VIEW sow_compliance_status AS
SELECT
  s.id as sow_id,
  s.ear_tag,
  s.name,
  s.status,
  s.user_id,

  -- Current housing info
  hu.id as housing_unit_id,
  hu.name as housing_unit_name,
  hu.type as housing_unit_type,
  hu.floor_space_sqft,

  -- Location history
  lh.moved_in_date as current_location_since,
  EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lh.moved_in_date)) / 86400 AS days_in_current_location,

  -- Confinement metrics (last 24 hours)
  COALESCE(
    (SELECT SUM(duration_hours)
     FROM confinement_events ce
     WHERE ce.sow_id = s.id
       AND ce.start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
       AND ce.end_time IS NOT NULL),
    0
  ) as confinement_hours_24h,

  -- Confinement metrics (last 30 days)
  COALESCE(
    (SELECT SUM(duration_hours)
     FROM confinement_events ce
     WHERE ce.sow_id = s.id
       AND ce.start_time >= CURRENT_DATE - INTERVAL '30 days'
       AND ce.end_time IS NOT NULL),
    0
  ) as confinement_hours_30d,

  -- Active confinement (if any)
  EXISTS(
    SELECT 1 FROM confinement_events ce
    WHERE ce.sow_id = s.id
      AND ce.end_time IS NULL
  ) as currently_confined,

  -- Compliance checks
  CASE
    WHEN hu.floor_space_sqft IS NULL THEN false
    WHEN hu.floor_space_sqft < 24 THEN false
    ELSE true
  END as space_compliant,

  -- Overall compliance status
  CASE
    WHEN s.status != 'active' THEN 'inactive'
    WHEN hu.floor_space_sqft IS NULL THEN 'unknown'
    WHEN hu.floor_space_sqft < 24 THEN 'non_compliant'
    WHEN (SELECT COALESCE(SUM(duration_hours), 0)
          FROM confinement_events ce
          WHERE ce.sow_id = s.id
            AND ce.start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
            AND ce.end_time IS NOT NULL) > 6 THEN 'non_compliant'
    WHEN (SELECT COALESCE(SUM(duration_hours), 0)
          FROM confinement_events ce
          WHERE ce.sow_id = s.id
            AND ce.start_time >= CURRENT_DATE - INTERVAL '30 days'
            AND ce.end_time IS NOT NULL) > 24 THEN 'non_compliant'
    ELSE 'compliant'
  END as compliance_status

FROM sows s
LEFT JOIN housing_units hu ON hu.id = s.housing_unit_id
LEFT JOIN location_history lh ON lh.sow_id = s.id
  AND lh.housing_unit_id = s.housing_unit_id
  AND lh.moved_out_date IS NULL;

COMMENT ON VIEW sow_compliance_status IS 'Real-time view of sow Prop 12 compliance status with housing, confinement, and location metrics';

-- ========================================
-- 2. HOUSING UNIT OCCUPANCY VIEW
-- ========================================

-- Shows current occupancy and space compliance for each housing unit
CREATE OR REPLACE VIEW housing_unit_occupancy AS
SELECT
  hu.id as housing_unit_id,
  hu.name as unit_name,
  hu.type as unit_type,
  hu.floor_space_sqft,
  hu.user_id,

  -- Occupancy metrics
  COUNT(s.id) as current_occupancy,

  -- Space per animal
  CASE
    WHEN COUNT(s.id) = 0 THEN NULL
    WHEN hu.floor_space_sqft IS NULL THEN NULL
    ELSE hu.floor_space_sqft / NULLIF(COUNT(s.id), 0)
  END as space_per_sow,

  -- Compliance
  CASE
    WHEN COUNT(s.id) = 0 THEN 'empty'
    WHEN hu.floor_space_sqft IS NULL THEN 'unknown'
    WHEN (hu.floor_space_sqft / NULLIF(COUNT(s.id), 0)) < 24 THEN 'non_compliant'
    ELSE 'compliant'
  END as compliance_status,

  -- Capacity (based on 24 sq ft minimum)
  CASE
    WHEN hu.floor_space_sqft IS NULL THEN NULL
    ELSE FLOOR(hu.floor_space_sqft / 24)::INTEGER
  END as max_compliant_capacity,

  -- List of sows in this unit
  ARRAY_AGG(s.ear_tag ORDER BY s.ear_tag) FILTER (WHERE s.id IS NOT NULL) as sow_ear_tags

FROM housing_units hu
LEFT JOIN sows s ON s.housing_unit_id = hu.id AND s.status = 'active'
GROUP BY hu.id, hu.name, hu.type, hu.floor_space_sqft, hu.user_id;

COMMENT ON VIEW housing_unit_occupancy IS 'Current housing unit occupancy with space per sow and compliance status';

-- ========================================
-- 3. CERTIFICATION ALERTS VIEW
-- ========================================

-- Shows certifications that are expiring soon or already expired
CREATE OR REPLACE VIEW certification_alerts AS
SELECT
  c.id as certification_id,
  c.certification_type,
  c.certifier_name,
  c.certifier_organization,
  c.issue_date,
  c.expiration_date,
  c.certificate_number,
  c.status,
  c.user_id,

  -- Days until expiration (negative if expired)
  (c.expiration_date - CURRENT_DATE) as days_until_expiration,

  -- Alert level
  CASE
    WHEN c.expiration_date < CURRENT_DATE THEN 'expired'
    WHEN c.expiration_date <= CURRENT_DATE + INTERVAL '30 days' THEN 'critical'
    WHEN c.expiration_date <= CURRENT_DATE + INTERVAL '60 days' THEN 'warning'
    WHEN c.expiration_date <= CURRENT_DATE + INTERVAL '90 days' THEN 'notice'
    ELSE 'ok'
  END as alert_level

FROM certifications c
WHERE c.status = 'active'
  OR (c.status = 'expired' AND c.expiration_date >= CURRENT_DATE - INTERVAL '30 days');

COMMENT ON VIEW certification_alerts IS 'Certification expiration alerts with tiered warning levels';

-- ========================================
-- 4. LOCATION AUDIT TRAIL VIEW
-- ========================================

-- Complete audit trail of sow movements with duration calculations
CREATE OR REPLACE VIEW location_audit_trail AS
SELECT
  lh.id as history_id,
  lh.sow_id,
  s.ear_tag,
  s.name as sow_name,
  lh.housing_unit_id,
  hu.name as housing_unit_name,
  hu.type as housing_unit_type,
  hu.floor_space_sqft,
  lh.moved_in_date,
  lh.moved_out_date,
  lh.reason,
  lh.notes,
  lh.user_id,

  -- Duration in this location
  CASE
    WHEN lh.moved_out_date IS NULL THEN
      EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - lh.moved_in_date)) / 86400
    ELSE
      EXTRACT(EPOCH FROM (lh.moved_out_date - lh.moved_in_date)) / 86400
  END as days_in_location,

  -- Current location flag
  CASE WHEN lh.moved_out_date IS NULL THEN true ELSE false END as is_current_location

FROM location_history lh
LEFT JOIN sows s ON s.id = lh.sow_id
LEFT JOIN housing_units hu ON hu.id = lh.housing_unit_id
ORDER BY lh.moved_in_date DESC;

COMMENT ON VIEW location_audit_trail IS 'Complete audit trail of all sow location changes with duration calculations';

-- ========================================
-- 5. CONFINEMENT SUMMARY VIEW
-- ========================================

-- Summary of confinement events with compliance metrics
CREATE OR REPLACE VIEW confinement_summary AS
SELECT
  ce.sow_id,
  s.ear_tag,
  s.name as sow_name,
  s.user_id,

  -- Recent confinement metrics
  COUNT(*) FILTER (WHERE ce.start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours') as events_last_24h,
  COUNT(*) FILTER (WHERE ce.start_time >= CURRENT_DATE - INTERVAL '30 days') as events_last_30d,

  COALESCE(SUM(ce.duration_hours) FILTER (WHERE ce.start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'), 0) as hours_last_24h,
  COALESCE(SUM(ce.duration_hours) FILTER (WHERE ce.start_time >= CURRENT_DATE - INTERVAL '30 days'), 0) as hours_last_30d,

  -- Compliance checks
  CASE
    WHEN COALESCE(SUM(ce.duration_hours) FILTER (WHERE ce.start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours'), 0) > 6 THEN false
    ELSE true
  END as compliant_24h,

  CASE
    WHEN COALESCE(SUM(ce.duration_hours) FILTER (WHERE ce.start_time >= CURRENT_DATE - INTERVAL '30 days'), 0) > 24 THEN false
    ELSE true
  END as compliant_30d,

  -- Most recent confinement
  MAX(ce.start_time) as last_confinement_date,

  -- Active confinement
  MAX(ce.id) FILTER (WHERE ce.end_time IS NULL) as active_confinement_id

FROM confinement_events ce
LEFT JOIN sows s ON s.id = ce.sow_id
GROUP BY ce.sow_id, s.ear_tag, s.name, s.user_id;

COMMENT ON VIEW confinement_summary IS 'Summary of confinement events per sow with compliance status';

-- ========================================
-- 6. TRANSACTION AUDIT TRAIL VIEW
-- ========================================

-- Enhanced transaction view with linked animal details
CREATE OR REPLACE VIEW transaction_audit_trail AS
SELECT
  t.id as transaction_id,
  t.transaction_date,
  t.transaction_type,
  t.quantity,
  t.party_name,
  t.party_address,
  t.transfer_location,
  t.compliance_status,
  t.invoice_number,
  t.notes,
  t.user_id,
  t.created_at,

  -- Time since transaction
  CURRENT_DATE - t.transaction_date as days_since_transaction,

  -- Within 2-year audit window
  CASE
    WHEN t.transaction_date >= CURRENT_DATE - INTERVAL '2 years' THEN true
    ELSE false
  END as within_audit_window,

  -- Animal IDs (from array)
  t.animal_ids,

  -- Count of animals in transaction
  array_length(t.animal_ids, 1) as animal_count

FROM transactions t
ORDER BY t.transaction_date DESC;

COMMENT ON VIEW transaction_audit_trail IS 'Transaction history with audit window compliance for 2-year Prop 12 requirement';

-- ========================================
-- 7. COMPLIANCE DASHBOARD SUMMARY
-- ========================================

-- High-level compliance metrics for dashboard
CREATE OR REPLACE VIEW compliance_dashboard_summary AS
SELECT
  user_id,

  -- Sow compliance
  COUNT(*) FILTER (WHERE status = 'active') as active_sows,
  COUNT(*) FILTER (WHERE compliance_status = 'compliant' AND status = 'active') as compliant_sows,
  COUNT(*) FILTER (WHERE compliance_status = 'non_compliant' AND status = 'active') as non_compliant_sows,
  COUNT(*) FILTER (WHERE compliance_status = 'unknown' AND status = 'active') as unknown_compliance_sows,

  -- Confinement issues
  COUNT(*) FILTER (WHERE confinement_hours_24h > 6 AND status = 'active') as exceeds_6h_limit,
  COUNT(*) FILTER (WHERE confinement_hours_30d > 24 AND status = 'active') as exceeds_24h_limit,

  -- Space issues
  COUNT(*) FILTER (WHERE space_compliant = false AND status = 'active') as insufficient_space_sows,

  -- Currently confined
  COUNT(*) FILTER (WHERE currently_confined = true AND status = 'active') as currently_confined_sows

FROM sow_compliance_status
GROUP BY user_id;

COMMENT ON VIEW compliance_dashboard_summary IS 'High-level compliance metrics aggregated per user for dashboard display';

-- ========================================
-- 8. GRANT PERMISSIONS
-- ========================================

-- Grant SELECT permissions to authenticated users on all views
GRANT SELECT ON sow_compliance_status TO authenticated;
GRANT SELECT ON housing_unit_occupancy TO authenticated;
GRANT SELECT ON certification_alerts TO authenticated;
GRANT SELECT ON location_audit_trail TO authenticated;
GRANT SELECT ON confinement_summary TO authenticated;
GRANT SELECT ON transaction_audit_trail TO authenticated;
GRANT SELECT ON compliance_dashboard_summary TO authenticated;

-- ========================================
-- 9. CREATE INDEXES FOR PERFORMANCE
-- ========================================

-- These indexes support the views and improve query performance
CREATE INDEX IF NOT EXISTS idx_confinement_events_24h
  ON confinement_events(sow_id, start_time)
  WHERE start_time >= CURRENT_TIMESTAMP - INTERVAL '24 hours';

CREATE INDEX IF NOT EXISTS idx_confinement_events_30d
  ON confinement_events(sow_id, start_time)
  WHERE start_time >= CURRENT_DATE - INTERVAL '30 days';

CREATE INDEX IF NOT EXISTS idx_location_history_current
  ON location_history(sow_id, housing_unit_id)
  WHERE moved_out_date IS NULL;

CREATE INDEX IF NOT EXISTS idx_certifications_expiring
  ON certifications(expiration_date, status)
  WHERE status = 'active';

CREATE INDEX IF NOT EXISTS idx_transactions_audit_window
  ON transactions(transaction_date, user_id)
  WHERE transaction_date >= CURRENT_DATE - INTERVAL '2 years';

-- ========================================
-- 10. ANALYZE TABLES
-- ========================================

ANALYZE sows;
ANALYZE housing_units;
ANALYZE location_history;
ANALYZE confinement_events;
ANALYZE certifications;
ANALYZE transactions;

-- ========================================
-- 11. USAGE EXAMPLES
-- ========================================

/*
-- Get all non-compliant sows for a user
SELECT * FROM sow_compliance_status
WHERE user_id = auth.uid()
  AND status = 'active'
  AND compliance_status = 'non_compliant';

-- Get housing units at or over capacity
SELECT * FROM housing_unit_occupancy
WHERE user_id = auth.uid()
  AND compliance_status = 'non_compliant';

-- Get expiring certifications
SELECT * FROM certification_alerts
WHERE user_id = auth.uid()
  AND alert_level IN ('expired', 'critical', 'warning')
ORDER BY days_until_expiration;

-- Get location history for a specific sow
SELECT * FROM location_audit_trail
WHERE sow_id = 'xxx'
  AND user_id = auth.uid()
ORDER BY moved_in_date DESC;

-- Get compliance dashboard metrics
SELECT * FROM compliance_dashboard_summary
WHERE user_id = auth.uid();

-- Get sows exceeding confinement limits
SELECT * FROM confinement_summary
WHERE user_id = auth.uid()
  AND (compliant_24h = false OR compliant_30d = false);

-- Get transactions within audit window
SELECT * FROM transaction_audit_trail
WHERE user_id = auth.uid()
  AND within_audit_window = true
ORDER BY transaction_date DESC;
*/
