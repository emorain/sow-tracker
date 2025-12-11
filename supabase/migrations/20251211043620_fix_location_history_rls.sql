-- Fix location_history tables RLS policies
-- These tables don't have user_id/organization_id directly
-- They inherit access control through their parent sow/boar relationships

-- ========================================
-- 1. Fix sow_location_history RLS policies
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON sow_location_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON sow_location_history;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON sow_location_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON sow_location_history;
DROP POLICY IF EXISTS "Authenticated users can read sow_location_history" ON sow_location_history;
DROP POLICY IF EXISTS "Authenticated users can insert sow_location_history" ON sow_location_history;

CREATE POLICY "Users can view location history for their sows"
  ON sow_location_history
  FOR SELECT
  USING (
    sow_id IN (
      SELECT id FROM sows 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert location history for their sows"
  ON sow_location_history
  FOR INSERT
  WITH CHECK (
    sow_id IN (
      SELECT id FROM sows 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update location history for their sows"
  ON sow_location_history
  FOR UPDATE
  USING (
    sow_id IN (
      SELECT id FROM sows 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    sow_id IN (
      SELECT id FROM sows 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete location history for their sows"
  ON sow_location_history
  FOR DELETE
  USING (
    sow_id IN (
      SELECT id FROM sows 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

-- ========================================
-- 2. Fix boar_location_history RLS policies
-- ========================================

DROP POLICY IF EXISTS "Enable read access for all authenticated users" ON boar_location_history;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON boar_location_history;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON boar_location_history;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON boar_location_history;
DROP POLICY IF EXISTS "Authenticated users can read boar_location_history" ON boar_location_history;
DROP POLICY IF EXISTS "Authenticated users can insert boar_location_history" ON boar_location_history;

CREATE POLICY "Users can view location history for their boars"
  ON boar_location_history
  FOR SELECT
  USING (
    boar_id IN (
      SELECT id FROM boars 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );

CREATE POLICY "Users can insert location history for their boars"
  ON boar_location_history
  FOR INSERT
  WITH CHECK (
    boar_id IN (
      SELECT id FROM boars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update location history for their boars"
  ON boar_location_history
  FOR UPDATE
  USING (
    boar_id IN (
      SELECT id FROM boars 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  )
  WITH CHECK (
    boar_id IN (
      SELECT id FROM boars 
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete location history for their boars"
  ON boar_location_history
  FOR DELETE
  USING (
    boar_id IN (
      SELECT id FROM boars 
      WHERE user_id = auth.uid()
      OR organization_id IN (
        SELECT organization_id 
        FROM organization_members 
        WHERE user_id = auth.uid() AND is_active = true
      )
    )
  );
