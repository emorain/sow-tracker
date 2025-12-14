-- Migration: Fix feedback policies to allow both user and admin access
-- Drop the conflicting policies and create comprehensive ones

-- Drop old policies
DROP POLICY IF EXISTS "Users can view their own feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can view all feedback" ON feedback;
DROP POLICY IF EXISTS "Users can update their own open feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can update all feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can delete feedback" ON feedback;

-- Create comprehensive SELECT policy (users see their own, admin sees all)
CREATE POLICY "Users and admin can view feedback"
  ON feedback
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );

-- Create comprehensive UPDATE policy (users can update their own open feedback, admin can update all)
CREATE POLICY "Users and admin can update feedback"
  ON feedback
  FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'open')
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  )
  WITH CHECK (
    (user_id = auth.uid() AND status = 'open')
    OR (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );

-- Admin can delete feedback
CREATE POLICY "Admin can delete feedback"
  ON feedback
  FOR DELETE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );
