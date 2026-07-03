-- Daily dose log for estrus-synchronization (Matrix/altrenogest) cycles.
--
-- Matrix is top-dressed on feed once a day for the whole treatment window, and a
-- single missed day breaks the sync. The app previously stored only the
-- start->end span, so there was no way to record "fed today" or to catch a
-- missed dose. This table logs one row per sow per day dosed; the Estrus Sync
-- page's "Dose all" button writes a row for every in-treatment sow in a batch.

CREATE TABLE IF NOT EXISTS public.matrix_doses (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  matrix_treatment_id uuid NOT NULL REFERENCES public.matrix_treatments(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  user_id uuid NOT NULL,
  dose_date date NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  UNIQUE (matrix_treatment_id, dose_date)  -- one dose per sow per day
);

CREATE INDEX IF NOT EXISTS idx_matrix_doses_treatment ON public.matrix_doses(matrix_treatment_id);
CREATE INDEX IF NOT EXISTS idx_matrix_doses_org ON public.matrix_doses(organization_id);

ALTER TABLE public.matrix_doses ENABLE ROW LEVEL SECURITY;

-- Org-membership RLS, mirroring matrix_treatments.
CREATE POLICY "Users can view matrix doses in their organizations"
  ON public.matrix_doses FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can insert their own matrix doses"
  ON public.matrix_doses FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can update matrix doses in their organizations"
  ON public.matrix_doses FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true))
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can delete matrix doses in their organizations"
  ON public.matrix_doses FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));
