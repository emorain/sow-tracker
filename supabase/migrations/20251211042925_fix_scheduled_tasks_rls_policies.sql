-- Fix overly permissive RLS policies for scheduled_tasks
-- Previously used auth.role() = 'authenticated' which allowed any user to see all tasks
-- Now properly scoped to user_id and organization_id

-- Drop old overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can read scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can update scheduled_tasks" ON scheduled_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete scheduled_tasks" ON scheduled_tasks;

-- Create proper user-scoped policies
CREATE POLICY "Users can view their own scheduled tasks"
  ON scheduled_tasks
  FOR SELECT
  USING (
    user_id = auth.uid() 
    OR 
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own scheduled tasks"
  ON scheduled_tasks
  FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update their own scheduled tasks"
  ON scheduled_tasks
  FOR UPDATE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete their own scheduled tasks"
  ON scheduled_tasks
  FOR DELETE
  USING (
    user_id = auth.uid()
    OR
    organization_id IN (
      SELECT organization_id 
      FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
  );
