-- Migration: Add logo_url to farm_settings and create storage bucket
-- Run this in Supabase SQL Editor

-- 1. Add logo_url column to farm_settings
ALTER TABLE farm_settings
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- 2. Add comment
COMMENT ON COLUMN farm_settings.logo_url IS 'URL to custom farm logo image (stored in Supabase Storage)';

-- 3. Create storage bucket for farm assets
-- NOTE: This part must be done in Supabase Dashboard -> Storage
-- Create a PUBLIC bucket called 'farm-assets'
-- Or run this if you have permissions:
INSERT INTO storage.buckets (id, name, public)
VALUES ('farm-assets', 'farm-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 4. Set up RLS policies for storage (users can upload/delete their own files)
CREATE POLICY "Users can upload own farm assets"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own farm assets"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own farm assets"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'farm-assets' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Anyone can view farm assets"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'farm-assets');

-- 5. Verify
SELECT id, farm_name, logo_url FROM farm_settings LIMIT 5;
