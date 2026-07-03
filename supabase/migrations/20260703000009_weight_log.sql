-- Ongoing weight tracking + average daily gain for any animal.
--
-- Birth/weaning/sale weights are fixed points on the piglet; this logs repeated
-- weigh-ins over an animal's life (grow pigs toward show/sale weight, but also
-- sows/boars — weights get tracked for different reasons). Polymorphic like
-- health_records: exactly one of sow_id/boar_id/piglet_id is set, each ON DELETE
-- CASCADE so weights follow the animal.

CREATE TABLE IF NOT EXISTS public.weight_log (
  id uuid PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  animal_type varchar NOT NULL CHECK (animal_type IN ('sow','boar','piglet')),
  sow_id uuid REFERENCES public.sows(id) ON DELETE CASCADE,
  boar_id uuid REFERENCES public.boars(id) ON DELETE CASCADE,
  piglet_id uuid REFERENCES public.piglets(id) ON DELETE CASCADE,
  weigh_date date NOT NULL,
  weight numeric(10,2) NOT NULL,
  notes text,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT weight_log_one_animal CHECK (num_nonnulls(sow_id, boar_id, piglet_id) = 1)
);

CREATE INDEX IF NOT EXISTS idx_weight_log_sow ON public.weight_log(sow_id);
CREATE INDEX IF NOT EXISTS idx_weight_log_boar ON public.weight_log(boar_id);
CREATE INDEX IF NOT EXISTS idx_weight_log_piglet ON public.weight_log(piglet_id);
CREATE INDEX IF NOT EXISTS idx_weight_log_org ON public.weight_log(organization_id);

ALTER TABLE public.weight_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view weight log in their organizations"
  ON public.weight_log FOR SELECT
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can insert their own weight log"
  ON public.weight_log FOR INSERT
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can update weight log in their organizations"
  ON public.weight_log FOR UPDATE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true))
  WITH CHECK (user_id = auth.uid() AND organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

CREATE POLICY "Users can delete weight log in their organizations"
  ON public.weight_log FOR DELETE
  USING (organization_id IN (
    SELECT organization_id FROM organization_members
    WHERE user_id = auth.uid() AND is_active = true));

-- Optional target weight for show pigs (buyers grow them out to a show class;
-- this is just a goal the breeder can set/track). Kept on piglets/grow pigs.
ALTER TABLE public.piglets ADD COLUMN IF NOT EXISTS target_weight numeric(10,2);
