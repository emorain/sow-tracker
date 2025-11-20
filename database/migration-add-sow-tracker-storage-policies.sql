-- Migration: Add RLS policies for sow-tracker storage bucket
-- Run this in Supabase SQL Editor

-- 1. Create storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('sow-tracker', 'sow-tracker', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Drop existing policies if any
DROP POLICY IF EXISTS "Users can upload own sow files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own sow files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own sow files" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view sow files" ON storage.objects;

-- 3. Create RLS policies for sow-tracker bucket
-- Users can only upload files to their own user_id folder
CREATE POLICY "Users can upload own sow files"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'sow-tracker' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update own sow files"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'sow-tracker' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own sow files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'sow-tracker' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Anyone can view (since bucket is public)
CREATE POLICY "Anyone can view sow files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'sow-tracker');

-- 4. Verify policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%sow%';
