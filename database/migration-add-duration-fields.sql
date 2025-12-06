-- Migration: Add duration_minutes fields to calendar event tables
-- This allows users to specify how long each task/event takes

-- Add duration_minutes to breeding_attempts (default 5 minutes for AI)
ALTER TABLE breeding_attempts
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

-- Add duration_minutes to farrowings
ALTER TABLE farrowings
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 30;

-- Add duration_minutes to health_records
ALTER TABLE health_records
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 15;

-- Add duration_minutes to matrix_treatments
ALTER TABLE matrix_treatments
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 5;

-- Add duration_minutes to sow_location_history (housing moves)
ALTER TABLE sow_location_history
ADD COLUMN IF NOT EXISTS duration_minutes INTEGER DEFAULT 10;

-- Add comments to explain the duration_minutes field purpose
COMMENT ON COLUMN breeding_attempts.duration_minutes IS 'Duration in minutes for this breeding task on the calendar (default 5 for AI, can be adjusted)';
COMMENT ON COLUMN farrowings.duration_minutes IS 'Duration in minutes for this farrowing event on the calendar';
COMMENT ON COLUMN health_records.duration_minutes IS 'Duration in minutes for this health treatment on the calendar';
COMMENT ON COLUMN matrix_treatments.duration_minutes IS 'Duration in minutes for this matrix administration on the calendar';
COMMENT ON COLUMN sow_location_history.duration_minutes IS 'Duration in minutes for this housing move on the calendar';
