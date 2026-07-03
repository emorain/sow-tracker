-- Show / exhibition results — a growing "resume" of an animal's placings.
--
-- Attaches to any animal (sow/boar/piglet) like health_records/weight_log, so a
-- pig you SOLD can still accrue results when a buyer reports back ("your pig won
-- its class"), turning wins into marketing proof for your genetics.

CREATE TABLE IF NOT EXISTS public.show_results (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  animal_type varchar NOT NULL CHECK (animal_type IN ('sow','boar','piglet')),
  sow_id uuid REFERENCES public.sows(id) ON DELETE CASCADE,
  boar_id uuid REFERENCES public.boars(id) ON DELETE CASCADE,
  piglet_id uuid REFERENCES public.piglets(id) ON DELETE CASCADE,
  show_name varchar NOT NULL,
  show_date date NOT NULL,
  show_class varchar,
  placement varchar,
  premium numeric(10,2),
  judge varchar,
  notes text,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT show_results_one_animal CHECK (num_nonnulls(sow_id, boar_id, piglet_id) = 1)
);

CREATE INDEX IF NOT EXISTS idx_show_results_sow ON public.show_results(sow_id);
CREATE INDEX IF NOT EXISTS idx_show_results_boar ON public.show_results(boar_id);
CREATE INDEX IF NOT EXISTS idx_show_results_piglet ON public.show_results(piglet_id);
CREATE INDEX IF NOT EXISTS idx_show_results_org ON public.show_results(organization_id);

ALTER TABLE public.show_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view show results in their organizations"
  ON public.show_results FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can insert their own show results"
  ON public.show_results FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can update show results in their organizations"
  ON public.show_results FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true))
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can delete show results in their organizations"
  ON public.show_results FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));
