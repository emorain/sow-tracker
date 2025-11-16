-- Migration: Add ear notches, registration, and file upload fields to sows table
-- Run this in your Supabase SQL Editor

ALTER TABLE sows
ADD COLUMN IF NOT EXISTS name VARCHAR(100),
ADD COLUMN IF NOT EXISTS right_ear_notch INTEGER CHECK (right_ear_notch >= 0),
ADD COLUMN IF NOT EXISTS left_ear_notch INTEGER CHECK (left_ear_notch >= 0),
ADD COLUMN IF NOT EXISTS registration_number VARCHAR(100),
ADD COLUMN IF NOT EXISTS photo_url TEXT,
ADD COLUMN IF NOT EXISTS registration_document_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN sows.name IS 'Optional name for the sow';
COMMENT ON COLUMN sows.right_ear_notch IS 'Numeric notch identifier on right ear (positive numbers only)';
COMMENT ON COLUMN sows.left_ear_notch IS 'Numeric notch identifier on left ear (positive numbers only)';
COMMENT ON COLUMN sows.registration_number IS 'Purebred registration number';
COMMENT ON COLUMN sows.photo_url IS 'URL to sow photo in Supabase Storage';
COMMENT ON COLUMN sows.registration_document_url IS 'URL to registration document in Supabase Storage';
