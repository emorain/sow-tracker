-- Security fix: sow_temporary_confinement had RLS disabled entirely,
-- exposing it to any authenticated client via PostgREST.
-- Table is currently empty and unused by app code (only referenced by
-- the get_temp_confinement_hours_30days function for Prop 12 reports).
-- Scope it to the owning user, matching the sibling confinement_events table.

ALTER TABLE public.sow_temporary_confinement ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own temporary confinement" ON public.sow_temporary_confinement;

CREATE POLICY "Users can manage their own temporary confinement"
  ON public.sow_temporary_confinement
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
