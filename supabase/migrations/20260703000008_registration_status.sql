-- Registration workflow: fix the boar registration-document column and add an
-- explicit registered-vs-pending status for breeding stock and show pigs.

-- 1. The Add Boar form uploads a registration document and writes
--    registration_document_url, but the column never existed on boars — adding a
--    boar with a photo or document errored on the follow-up update. Add it
--    (parity with sows, which already have this column).
ALTER TABLE public.boars ADD COLUMN IF NOT EXISTS registration_document_url text;

-- 2. Explicit registration status. A number alone couldn't distinguish
--    "papers in hand" from "application submitted, awaiting number".
ALTER TABLE public.sows    ADD COLUMN IF NOT EXISTS registration_status varchar NOT NULL DEFAULT 'unregistered';
ALTER TABLE public.boars   ADD COLUMN IF NOT EXISTS registration_status varchar NOT NULL DEFAULT 'unregistered';
ALTER TABLE public.piglets ADD COLUMN IF NOT EXISTS registration_status varchar NOT NULL DEFAULT 'unregistered';

ALTER TABLE public.sows    DROP CONSTRAINT IF EXISTS sows_registration_status_check;
ALTER TABLE public.sows    ADD CONSTRAINT sows_registration_status_check    CHECK (registration_status IN ('unregistered','pending','registered'));
ALTER TABLE public.boars   DROP CONSTRAINT IF EXISTS boars_registration_status_check;
ALTER TABLE public.boars   ADD CONSTRAINT boars_registration_status_check   CHECK (registration_status IN ('unregistered','pending','registered'));
ALTER TABLE public.piglets DROP CONSTRAINT IF EXISTS piglets_registration_status_check;
ALTER TABLE public.piglets ADD CONSTRAINT piglets_registration_status_check CHECK (registration_status IN ('unregistered','pending','registered'));

-- 3. Backfill: an animal that already has a registration number is registered.
UPDATE public.sows    SET registration_status = 'registered'
  WHERE registration_status = 'unregistered' AND NULLIF(TRIM(registration_number), '') IS NOT NULL;
UPDATE public.boars   SET registration_status = 'registered'
  WHERE registration_status = 'unregistered' AND NULLIF(TRIM(registration_number), '') IS NOT NULL;
UPDATE public.piglets SET registration_status = 'registered'
  WHERE registration_status = 'unregistered' AND NULLIF(TRIM(registration_number), '') IS NOT NULL;
