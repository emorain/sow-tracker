-- Fix overly permissive RLS policies for protocols and protocol_tasks
-- Previously used auth.role() = 'authenticated' which allowed any user to see all protocols
-- Now properly scoped to user_id and organization_id

-- ========================================
-- Fix protocols table RLS policies
-- ========================================

DROP POLICY IF EXISTS "Authenticated users can read protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can insert protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can update protocols" ON protocols;
DROP POLICY IF EXISTS "Authenticated users can delete protocols" ON protocols;

CREATE POLICY "Users can view their own protocols"
  ON protocols
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

CREATE POLICY "Users can insert their own protocols"
  ON protocols
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

CREATE POLICY "Users can update their own protocols"
  ON protocols
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

CREATE POLICY "Users can delete their own protocols"
  ON protocols
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

-- ========================================
-- Fix protocol_tasks table RLS policies
-- ========================================

DROP POLICY IF EXISTS "Authenticated users can read protocol_tasks" ON protocol_tasks;
DROP POLICY IF EXISTS "Authenticated users can insert protocol_tasks" ON protocol_tasks;
DROP POLICY IF EXISTS "Authenticated users can update protocol_tasks" ON protocol_tasks;
DROP POLICY IF EXISTS "Authenticated users can delete protocol_tasks" ON protocol_tasks;

-- Protocol tasks inherit access from their parent protocol
CREATE POLICY "Users can view protocol tasks from their protocols"
  ON protocol_tasks
  FOR SELECT
  USING (
    protocol_id IN (
      SELECT id FROM protocols 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert protocol tasks to their protocols"
  ON protocol_tasks
  FOR INSERT
  WITH CHECK (
    protocol_id IN (
      SELECT id FROM protocols 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can update protocol tasks from their protocols"
  ON protocol_tasks
  FOR UPDATE
  USING (
    protocol_id IN (
      SELECT id FROM protocols 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    protocol_id IN (
      SELECT id FROM protocols 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can delete protocol tasks from their protocols"
  ON protocol_tasks
  FOR DELETE
  USING (
    protocol_id IN (
      SELECT id FROM protocols 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
