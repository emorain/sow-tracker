-- Migration: Add scheduled_time fields to calendar events
-- This allows users to schedule specific times for events via drag-and-drop in the calendar

-- Add scheduled_time to breeding_attempts
ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add scheduled_time to farrowings (for expected farrowing)
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add scheduled_time to health_records
ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add scheduled_time to matrix_treatments
ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- Add scheduled_time to sow_location_history (housing moves)
ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS scheduled_time TIME;

-- scheduled_tasks already has a time field in due_date (timestamp)
-- calendar_events already has start_time field

-- Add comment to explain the scheduled_time field purpose
COMMENT ON COLUMN breeding_attempts.scheduled_time IS 'Optional scheduled time for planning the breeding on the calendar';
COMMENT ON COLUMN farrowings.scheduled_time IS 'Optional scheduled time for expected farrowing on the calendar';
COMMENT ON COLUMN health_records.scheduled_time IS 'Optional scheduled time for health treatment on the calendar';
COMMENT ON COLUMN matrix_treatments.scheduled_time IS 'Optional scheduled time for matrix administration on the calendar';
COMMENT ON COLUMN sow_location_history.scheduled_time IS 'Optional scheduled time for housing move on the calendar';
