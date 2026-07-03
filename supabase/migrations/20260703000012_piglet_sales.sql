-- Structured sales for grow pigs: buyer, sale channel, deposits/reservations,
-- and a 'reserved' state. The Nursery sale flow now also writes an
-- income_records row so sales flow into the financial picture.

ALTER TABLE public.piglets ADD COLUMN IF NOT EXISTS buyer varchar;
ALTER TABLE public.piglets ADD COLUMN IF NOT EXISTS sale_type varchar;   -- auction | private | show
ALTER TABLE public.piglets ADD COLUMN IF NOT EXISTS deposit numeric(10,2);

-- Add 'reserved' (pre-buy / deposit taken, pig still on farm until auction/pickup).
ALTER TABLE public.piglets DROP CONSTRAINT IF EXISTS piglets_status_check;
ALTER TABLE public.piglets
  ADD CONSTRAINT piglets_status_check
  CHECK (status::text = ANY (ARRAY['nursing','weaned','sold','died','culled','retained','reserved']::text[]));
