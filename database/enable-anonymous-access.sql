-- Enable anonymous access for development (no authentication required)
-- Run this in Supabase SQL Editor to allow the app to read all tables

-- Drop existing policies if they exist (both old and new names)
-- Old authenticated policies
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON sows;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON farrowings;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON piglets;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON vaccinations;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON reminders;
DROP POLICY IF EXISTS "Enable all access for authenticated users" ON matrix_treatments;

-- New anonymous policies (in case they already exist)
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

-- Create permissive policies for all users (including anonymous)
-- SOWS
CREATE POLICY "Enable read access for all users" ON sows FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON sows FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON sows FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON sows FOR DELETE USING (true);

-- FARROWINGS
CREATE POLICY "Enable read access for all users" ON farrowings FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON farrowings FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON farrowings FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON farrowings FOR DELETE USING (true);

-- PIGLETS
CREATE POLICY "Enable read access for all users" ON piglets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON piglets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON piglets FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON piglets FOR DELETE USING (true);

-- VACCINATIONS
CREATE POLICY "Enable read access for all users" ON vaccinations FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON vaccinations FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON vaccinations FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON vaccinations FOR DELETE USING (true);

-- REMINDERS
CREATE POLICY "Enable read access for all users" ON reminders FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON reminders FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON reminders FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON reminders FOR DELETE USING (true);

-- MATRIX TREATMENTS
CREATE POLICY "Enable read access for all users" ON matrix_treatments FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON matrix_treatments FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON matrix_treatments FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON matrix_treatments FOR DELETE USING (true);

-- PIGLETS
CREATE POLICY "Enable read access for all users" ON piglets FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON piglets FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON piglets FOR UPDATE USING (true);
CREATE POLICY "Enable delete access for all users" ON piglets FOR DELETE USING (true);

-- Verify policies are applied
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
