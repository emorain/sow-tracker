-- Revamp slice 5: per-farm feature flags so the grown-on modules can be hidden
-- from the navigation by default and turned on only when a farm uses them.
-- (Prop 12 / compliance reuses the existing prop12_compliance_enabled flag.)

ALTER TABLE public.farm_settings
  ADD COLUMN IF NOT EXISTS feature_finances boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS feature_transfers boolean NOT NULL DEFAULT false;
