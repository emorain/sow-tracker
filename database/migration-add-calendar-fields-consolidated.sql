-- Consolidated Migration: Add calendar scheduling fields
-- This adds both duration_minutes and scheduled_time to all calendar event tables
-- Run this if you're experiencing schema cache issues with the separate migrations

-- ========================================
-- 1. Add duration_minutes columns
-- ========================================

ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 15;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 10;

-- ========================================
-- 2. Add scheduled_time columns
-- ========================================

ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- ========================================
-- 3. Add comments
-- ========================================

COMMENT ON COLUMN breeding_attempts.duration_minutes IS 'Duration in minutes for this breeding task on the calendar (default 5 for AI, can be adjusted)';
COMMENT ON COLUMN farrowings.duration_minutes IS 'Duration in minutes for this farrowing event on the calendar';
COMMENT ON COLUMN health_records.duration_minutes IS 'Duration in minutes for this health treatment on the calendar';
COMMENT ON COLUMN matrix_treatments.duration_minutes IS 'Duration in minutes for this matrix administration on the calendar';
COMMENT ON COLUMN sow_location_history.duration_minutes IS 'Duration in minutes for this housing move on the calendar';

COMMENT ON COLUMN breeding_attempts.scheduled_time IS 'Optional scheduled time for planning the breeding on the calendar';
COMMENT ON COLUMN farrowings.scheduled_time IS 'Optional scheduled time for expected farrowing on the calendar';
COMMENT ON COLUMN health_records.scheduled_time IS 'Optional scheduled time for health treatment on the calendar';
COMMENT ON COLUMN matrix_treatments.scheduled_time IS 'Optional scheduled time for matrix administration on the calendar';
COMMENT ON COLUMN sow_location_history.scheduled_time IS 'Optional scheduled time for housing move on the calendar';

-- ========================================
-- 4. Force schema reload
-- ========================================

-- Notify PostgREST to reload its schema cache
NOTIFY pgrst, 'reload schema';

-- Verify all columns were added
SELECT
    table_name,
    column_name,
    data_type,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND (column_name = 'duration_minutes' OR column_name = 'scheduled_time')
  AND table_name IN ('breeding_attempts', 'farrowings', 'health_records', 'matrix_treatments', 'sow_location_history')
ORDER BY table_name, column_name;
