-- Migration: Add admin policies for feedback management
-- Allows the developer to manage all feedback regardless of status

-- Admin can view all feedback
CREATE POLICY "Admin can view all feedback"
  ON feedback
  FOR SELECT
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );

-- Admin can update all feedback (status, priority, admin_notes, etc.)
CREATE POLICY "Admin can update all feedback"
  ON feedback
  FOR UPDATE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  )
  WITH CHECK (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );

-- Admin can delete feedback if needed
CREATE POLICY "Admin can delete feedback"
  ON feedback
  FOR DELETE
  USING (
    (SELECT email FROM auth.users WHERE id = auth.uid()) = 'emorain@gmail.com'
  );
