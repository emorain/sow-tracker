-- Update RLS Policies to Require Authentication
-- Run this in Supabase SQL Editor AFTER enabling Email Auth
-- This replaces anonymous access with authenticated-only access

-- Drop existing anonymous policies
DROP POLICY IF EXISTS "Enable read access for all users" ON sows;
DROP POLICY IF EXISTS "Enable insert access for all users" ON sows;
DROP POLICY IF EXISTS "Enable update access for all users" ON sows;
DROP POLICY IF EXISTS "Enable delete access for all users" ON sows;

DROP POLICY IF EXISTS "Enable read access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable insert access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable update access for all users" ON farrowings;
DROP POLICY IF EXISTS "Enable delete access for all users" ON farrowings;

DROP POLICY IF EXISTS "Enable read access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable insert access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable update access for all users" ON piglets;
DROP POLICY IF EXISTS "Enable delete access for all users" ON piglets;

DROP POLICY IF EXISTS "Enable read access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable insert access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable update access for all users" ON vaccinations;
DROP POLICY IF EXISTS "Enable delete access for all users" ON vaccinations;

DROP POLICY IF EXISTS "Enable read access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable insert access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable update access for all users" ON reminders;
DROP POLICY IF EXISTS "Enable delete access for all users" ON reminders;

DROP POLICY IF EXISTS "Enable read access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable insert access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable update access for all users" ON matrix_treatments;
DROP POLICY IF EXISTS "Enable delete access for all users" ON matrix_treatments;

-- Create new authenticated-only policies
-- SOWS
CREATE POLICY "Authenticated users can read sows" ON sows FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert sows" ON sows FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update sows" ON sows FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete sows" ON sows FOR DELETE USING (auth.role() = 'authenticated');

-- FARROWINGS
CREATE POLICY "Authenticated users can read farrowings" ON farrowings FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert farrowings" ON farrowings FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update farrowings" ON farrowings FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete farrowings" ON farrowings FOR DELETE USING (auth.role() = 'authenticated');

-- PIGLETS
CREATE POLICY "Authenticated users can read piglets" ON piglets FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert piglets" ON piglets FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update piglets" ON piglets FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete piglets" ON piglets FOR DELETE USING (auth.role() = 'authenticated');

-- VACCINATIONS
CREATE POLICY "Authenticated users can read vaccinations" ON vaccinations FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert vaccinations" ON vaccinations FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update vaccinations" ON vaccinations FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete vaccinations" ON vaccinations FOR DELETE USING (auth.role() = 'authenticated');

-- REMINDERS
CREATE POLICY "Authenticated users can read reminders" ON reminders FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert reminders" ON reminders FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update reminders" ON reminders FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete reminders" ON reminders FOR DELETE USING (auth.role() = 'authenticated');

-- MATRIX TREATMENTS
CREATE POLICY "Authenticated users can read matrix_treatments" ON matrix_treatments FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can insert matrix_treatments" ON matrix_treatments FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update matrix_treatments" ON matrix_treatments FOR UPDATE USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can delete matrix_treatments" ON matrix_treatments FOR DELETE USING (auth.role() = 'authenticated');

-- Verify policies are applied
SELECT schemaname, tablename, policyname, cmd
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
