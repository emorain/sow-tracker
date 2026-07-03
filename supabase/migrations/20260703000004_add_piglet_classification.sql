-- Nursery workflow: classify weaned pigs and let breeders graduate to the herd.
--
-- Two independent axes on a pig:
--   * status         — lifecycle (nursing -> weaned -> sold/died/culled/retained)
--   * classification — intended use, decided while growing in the nursery
-- Classification is the "sort" step (show / feeder / breeder / market); it is
-- orthogonal to status (a pig can be classified 'show' while still on farm).

-- 1. Classification column (backfills existing rows to 'undecided').
ALTER TABLE public.piglets
  ADD COLUMN IF NOT EXISTS classification varchar NOT NULL DEFAULT 'undecided';

ALTER TABLE public.piglets DROP CONSTRAINT IF EXISTS piglets_classification_check;
ALTER TABLE public.piglets
  ADD CONSTRAINT piglets_classification_check
  CHECK (classification::text = ANY (ARRAY['undecided','show','feeder','breeder','market']::text[]));

-- 2. Add 'retained' status for pigs kept back and promoted into the sow/boar herd.
ALTER TABLE public.piglets DROP CONSTRAINT IF EXISTS piglets_status_check;
ALTER TABLE public.piglets
  ADD CONSTRAINT piglets_status_check
  CHECK (status::text = ANY (ARRAY['nursing','weaned','sold','died','culled','retained']::text[]));

-- 3. The old default 'alive' was never a valid status; a newborn pig is nursing.
ALTER TABLE public.piglets ALTER COLUMN status SET DEFAULT 'nursing';
