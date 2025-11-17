-- Setup storage buckets for sow photos
-- Run this in your Supabase SQL Editor

-- Create the sow-photos storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sow-photos', 'sow-photos', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (to avoid errors on re-run)
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete photos" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can upload photos" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can update photos" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous users can delete photos" ON storage.objects;

-- Set up storage policies for public read access
-- Allow public read access to sow photos
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sow-photos' );

-- Note: Since you have anonymous access enabled, allow anon users to upload/manage photos
-- Allow anonymous users to upload photos
CREATE POLICY "Anonymous users can upload photos"
ON storage.objects FOR INSERT
WITH CHECK ( bucket_id = 'sow-photos' );

-- Allow anonymous users to update photos
CREATE POLICY "Anonymous users can update photos"
ON storage.objects FOR UPDATE
USING ( bucket_id = 'sow-photos' )
WITH CHECK ( bucket_id = 'sow-photos' );

-- Allow anonymous users to delete photos
CREATE POLICY "Anonymous users can delete photos"
ON storage.objects FOR DELETE
USING ( bucket_id = 'sow-photos' );
