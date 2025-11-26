-- Migration: Add retain_records option to transfer requests
-- Allows users to keep a copy of sold animals and their records

-- ========================================
-- 1. ADD RETAIN_RECORDS COLUMN
-- ========================================

-- Add to sow transfer requests
ALTER TABLE sow_transfer_requests
ADD COLUMN IF NOT EXISTS retain_records BOOLEAN DEFAULT false;

COMMENT ON COLUMN sow_transfer_requests.retain_records IS 'If true, sender keeps a copy marked as sold';

-- Add to boar transfer requests
ALTER TABLE boar_transfer_requests
ADD COLUMN IF NOT EXISTS retain_records BOOLEAN DEFAULT false;

COMMENT ON COLUMN boar_transfer_requests.retain_records IS 'If true, sender keeps a copy marked as sold';

-- ========================================
-- 2. ADD SOLD STATUS TO SOWS AND BOARS
-- ========================================

-- First, check if 'sold' status exists, if not we need to update the constraint
-- Drop existing constraints
ALTER TABLE sows DROP CONSTRAINT IF EXISTS sows_status_check;
ALTER TABLE boars DROP CONSTRAINT IF EXISTS boars_status_check;

-- Add new constraints with 'sold' status
ALTER TABLE sows
ADD CONSTRAINT sows_status_check
CHECK (status IN ('active', 'culled', 'sold', 'deceased'));

ALTER TABLE boars
ADD CONSTRAINT boars_status_check
CHECK (status IN ('active', 'culled', 'sold', 'deceased'));

COMMENT ON CONSTRAINT sows_status_check ON sows IS 'Valid sow statuses including sold for transferred animals';
COMMENT ON CONSTRAINT boars_status_check ON boars IS 'Valid boar statuses including sold for transferred animals';
