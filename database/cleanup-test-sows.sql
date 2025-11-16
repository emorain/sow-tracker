-- Remove test sows SOW-001, SOW-002, SOW-003
-- Delete related records first due to foreign key constraints

-- Delete piglets related to farrowings of these sows
DELETE FROM piglets
WHERE farrowing_id IN (
  SELECT f.id FROM farrowings f
  JOIN sows s ON f.sow_id = s.id
  WHERE s.ear_tag IN ('SOW-001', 'SOW-002', 'SOW-003')
);

-- Delete farrowings for these sows
DELETE FROM farrowings
WHERE sow_id IN (
  SELECT id FROM sows
  WHERE ear_tag IN ('SOW-001', 'SOW-002', 'SOW-003')
);

-- Delete vaccinations for these sows
DELETE FROM vaccinations
WHERE sow_id IN (
  SELECT id FROM sows
  WHERE ear_tag IN ('SOW-001', 'SOW-002', 'SOW-003')
);

-- Delete reminders for these sows
DELETE FROM reminders
WHERE sow_id IN (
  SELECT id FROM sows
  WHERE ear_tag IN ('SOW-001', 'SOW-002', 'SOW-003')
);

-- Finally, delete the sows themselves
DELETE FROM sows
WHERE ear_tag IN ('SOW-001', 'SOW-002', 'SOW-003');

-- Show remaining sow count
SELECT COUNT(*) as remaining_sows FROM sows;
