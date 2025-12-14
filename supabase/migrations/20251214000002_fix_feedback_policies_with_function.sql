-- Migration: Fix feedback policies using a helper function instead of direct auth.users access

-- Create a helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN auth.email() = 'emorain@gmail.com';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old policies
DROP POLICY IF EXISTS "Users and admin can view feedback" ON feedback;
DROP POLICY IF EXISTS "Users and admin can update feedback" ON feedback;
DROP POLICY IF EXISTS "Admin can delete feedback" ON feedback;

-- Create comprehensive SELECT policy (users see their own, admin sees all)
CREATE POLICY "Users and admin can view feedback"
  ON feedback
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR is_admin()
  );

-- Create comprehensive UPDATE policy (users can update their own open feedback, admin can update all)
CREATE POLICY "Users and admin can update feedback"
  ON feedback
  FOR UPDATE
  USING (
    (user_id = auth.uid() AND status = 'open')
    OR is_admin()
  )
  WITH CHECK (
    (user_id = auth.uid() AND status = 'open')
    OR is_admin()
  );

-- Admin can delete feedback
CREATE POLICY "Admin can delete feedback"
  ON feedback
  FOR DELETE
  USING (is_admin());
