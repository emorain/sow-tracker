-- CRITICAL SECURITY FIX: Add organization-based RLS policies for all core tables
--
-- This migration addresses a major security gap where 13 core tables have organization_id
-- columns but lack proper organization-based access control policies.
--
-- Tables fixed:
-- - sows, boars, farrowings, piglets, breeding_attempts
-- - health_records, housing_units, farm_settings
-- - calendar_events, ai_semen_doses, matrix_treatments
-- - sow_transfer_requests, boar_transfer_requests

-- ========================================
-- 1. SOWS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own sows" ON sows;
DROP POLICY IF EXISTS "Users can insert own sows" ON sows;
DROP POLICY IF EXISTS "Users can update own sows" ON sows;
DROP POLICY IF EXISTS "Users can delete own sows" ON sows;

CREATE POLICY "Users can view sows in their organizations"
  ON sows FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own sows"
  ON sows FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update sows in their organizations"
  ON sows FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete sows in their organizations"
  ON sows FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 2. BOARS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own boars" ON boars;
DROP POLICY IF EXISTS "Users can insert own boars" ON boars;
DROP POLICY IF EXISTS "Users can update own boars" ON boars;
DROP POLICY IF EXISTS "Users can delete own boars" ON boars;

CREATE POLICY "Users can view boars in their organizations"
  ON boars FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own boars"
  ON boars FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update boars in their organizations"
  ON boars FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete boars in their organizations"
  ON boars FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 3. FARROWINGS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can insert own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can update own farrowings" ON farrowings;
DROP POLICY IF EXISTS "Users can delete own farrowings" ON farrowings;

CREATE POLICY "Users can view farrowings in their organizations"
  ON farrowings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own farrowings"
  ON farrowings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update farrowings in their organizations"
  ON farrowings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete farrowings in their organizations"
  ON farrowings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 4. PIGLETS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can insert own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can update own piglets" ON piglets;
DROP POLICY IF EXISTS "Users can delete own piglets" ON piglets;

CREATE POLICY "Users can view piglets in their organizations"
  ON piglets FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own piglets"
  ON piglets FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update piglets in their organizations"
  ON piglets FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete piglets in their organizations"
  ON piglets FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 5. BREEDING_ATTEMPTS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own breeding attempts" ON breeding_attempts;
DROP POLICY IF EXISTS "Users can insert own breeding attempts" ON breeding_attempts;
DROP POLICY IF EXISTS "Users can update own breeding attempts" ON breeding_attempts;
DROP POLICY IF EXISTS "Users can delete own breeding attempts" ON breeding_attempts;

CREATE POLICY "Users can view breeding attempts in their organizations"
  ON breeding_attempts FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own breeding attempts"
  ON breeding_attempts FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update breeding attempts in their organizations"
  ON breeding_attempts FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete breeding attempts in their organizations"
  ON breeding_attempts FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 6. HEALTH_RECORDS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own health records" ON health_records;
DROP POLICY IF EXISTS "Users can insert own health records" ON health_records;
DROP POLICY IF EXISTS "Users can update own health records" ON health_records;
DROP POLICY IF EXISTS "Users can delete own health records" ON health_records;

CREATE POLICY "Users can view health records in their organizations"
  ON health_records FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own health records"
  ON health_records FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update health records in their organizations"
  ON health_records FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete health records in their organizations"
  ON health_records FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 7. HOUSING_UNITS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can insert own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can update own housing units" ON housing_units;
DROP POLICY IF EXISTS "Users can delete own housing units" ON housing_units;

CREATE POLICY "Users can view housing units in their organizations"
  ON housing_units FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own housing units"
  ON housing_units FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update housing units in their organizations"
  ON housing_units FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete housing units in their organizations"
  ON housing_units FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 8. FARM_SETTINGS TABLE
-- ========================================

DROP POLICY IF EXISTS "Users can view own farm settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can insert own farm settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can update own farm settings" ON farm_settings;
DROP POLICY IF EXISTS "Users can delete own farm settings" ON farm_settings;

CREATE POLICY "Users can view farm settings in their organizations"
  ON farm_settings FOR SELECT
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can insert their own farm settings"
  ON farm_settings FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can update farm settings in their organizations"
  ON farm_settings FOR UPDATE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

CREATE POLICY "Users can delete farm settings in their organizations"
  ON farm_settings FOR DELETE
  USING (
    organization_id IN (
      SELECT organization_id
      FROM organization_members
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- ========================================
-- 9. CALENDAR_EVENTS TABLE (if exists)
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'calendar_events') THEN
    DROP POLICY IF EXISTS "Users can view own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can insert own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can update own calendar events" ON calendar_events;
    DROP POLICY IF EXISTS "Users can delete own calendar events" ON calendar_events;

    EXECUTE 'CREATE POLICY "Users can view calendar events in their organizations"
      ON calendar_events FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert their own calendar events"
      ON calendar_events FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update calendar events in their organizations"
      ON calendar_events FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete calendar events in their organizations"
      ON calendar_events FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';
  END IF;
END $$;

-- ========================================
-- 10. AI_SEMEN_DOSES TABLE (if exists)
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ai_semen_doses') THEN
    DROP POLICY IF EXISTS "Users can view own ai semen doses" ON ai_semen_doses;
    DROP POLICY IF EXISTS "Users can insert own ai semen doses" ON ai_semen_doses;
    DROP POLICY IF EXISTS "Users can update own ai semen doses" ON ai_semen_doses;
    DROP POLICY IF EXISTS "Users can delete own ai semen doses" ON ai_semen_doses;

    EXECUTE 'CREATE POLICY "Users can view ai semen doses in their organizations"
      ON ai_semen_doses FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert their own ai semen doses"
      ON ai_semen_doses FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update ai semen doses in their organizations"
      ON ai_semen_doses FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete ai semen doses in their organizations"
      ON ai_semen_doses FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';
  END IF;
END $$;

-- ========================================
-- 11. MATRIX_TREATMENTS TABLE (CRITICAL - PERMISSIVE POLICIES)
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'matrix_treatments') THEN
    -- Drop DANGEROUS permissive policies
    DROP POLICY IF EXISTS "Enable read access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable insert access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable update access for all users" ON matrix_treatments;
    DROP POLICY IF EXISTS "Enable delete access for all users" ON matrix_treatments;

    -- Drop potential old user_id-only policies
    DROP POLICY IF EXISTS "Users can view own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can insert own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can update own matrix treatments" ON matrix_treatments;
    DROP POLICY IF EXISTS "Users can delete own matrix treatments" ON matrix_treatments;

    EXECUTE 'CREATE POLICY "Users can view matrix treatments in their organizations"
      ON matrix_treatments FOR SELECT
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert their own matrix treatments"
      ON matrix_treatments FOR INSERT
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update matrix treatments in their organizations"
      ON matrix_treatments FOR UPDATE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )
      WITH CHECK (
        user_id = auth.uid()
        AND organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete matrix treatments in their organizations"
      ON matrix_treatments FOR DELETE
      USING (
        organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';
  END IF;
END $$;

-- ========================================
-- 12. SOW_TRANSFER_REQUESTS TABLE
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'sow_transfer_requests') THEN
    DROP POLICY IF EXISTS "Users can view own sow transfer requests" ON sow_transfer_requests;
    DROP POLICY IF EXISTS "Users can insert own sow transfer requests" ON sow_transfer_requests;
    DROP POLICY IF EXISTS "Users can update own sow transfer requests" ON sow_transfer_requests;
    DROP POLICY IF EXISTS "Users can delete own sow transfer requests" ON sow_transfer_requests;

    -- Transfer requests are visible if user is in either from or to organization
    EXECUTE 'CREATE POLICY "Users can view sow transfer requests for their organizations"
      ON sow_transfer_requests FOR SELECT
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR to_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert sow transfer requests from their organizations"
      ON sow_transfer_requests FOR INSERT
      WITH CHECK (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update sow transfer requests for their organizations"
      ON sow_transfer_requests FOR UPDATE
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR to_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete sow transfer requests from their organizations"
      ON sow_transfer_requests FOR DELETE
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';
  END IF;
END $$;

-- ========================================
-- 13. BOAR_TRANSFER_REQUESTS TABLE
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'boar_transfer_requests') THEN
    DROP POLICY IF EXISTS "Users can view own boar transfer requests" ON boar_transfer_requests;
    DROP POLICY IF EXISTS "Users can insert own boar transfer requests" ON boar_transfer_requests;
    DROP POLICY IF EXISTS "Users can update own boar transfer requests" ON boar_transfer_requests;
    DROP POLICY IF EXISTS "Users can delete own boar transfer requests" ON boar_transfer_requests;

    EXECUTE 'CREATE POLICY "Users can view boar transfer requests for their organizations"
      ON boar_transfer_requests FOR SELECT
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR to_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can insert boar transfer requests from their organizations"
      ON boar_transfer_requests FOR INSERT
      WITH CHECK (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can update boar transfer requests for their organizations"
      ON boar_transfer_requests FOR UPDATE
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
        OR to_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';

    EXECUTE 'CREATE POLICY "Users can delete boar transfer requests from their organizations"
      ON boar_transfer_requests FOR DELETE
      USING (
        from_organization_id IN (
          SELECT organization_id
          FROM organization_members
          WHERE user_id = auth.uid() AND is_active = true
        )
      )';
  END IF;
END $$;

-- Add comments
COMMENT ON POLICY "Users can view sows in their organizations" ON sows IS 'Users can only see sows for organizations they belong to';
COMMENT ON POLICY "Users can view boars in their organizations" ON boars IS 'Users can only see boars for organizations they belong to';
COMMENT ON POLICY "Users can view housing units in their organizations" ON housing_units IS 'Users can only see housing units for organizations they belong to';
COMMENT ON POLICY "Users can view farm settings in their organizations" ON farm_settings IS 'Users can only see farm settings for organizations they belong to';
