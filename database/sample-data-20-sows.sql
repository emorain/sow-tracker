-- Sample Data: 20 Sows with Farrowing History
-- Run this in your Supabase SQL Editor to populate the database

-- Insert 20 Sows
INSERT INTO sows (ear_tag, name, birth_date, breed, status, right_ear_notch, left_ear_notch, registration_number, notes) VALUES
-- Active breeding sows (16)
('AUTO-20231115-0001', 'Betsy', '2021-03-15', 'Yorkshire', 'active', 3, 5, 'YOR-2021-0315', 'Excellent mother, consistent litter sizes'),
('AUTO-20231115-0002', 'Willow', '2021-04-20', 'Landrace', 'active', 2, 7, 'LAN-2021-0420', 'Good temperament'),
('AUTO-20231115-0003', 'Daisy', '2021-05-10', 'Duroc', 'active', 1, 4, NULL, 'Fast grower'),
('AUTO-20231115-0004', NULL, '2021-06-22', 'Hampshire', 'active', 5, 2, 'HAM-2021-0622', NULL),
('AUTO-20231115-0005', 'Pearl', '2021-08-05', 'Yorkshire', 'active', 4, 6, NULL, 'First farrowing was exceptional'),
('AUTO-20231115-0006', 'Ruby', '2021-09-18', 'Berkshire', 'active', 3, 3, 'BER-2021-0918', 'Premium genetics'),
('AUTO-20231115-0007', NULL, '2021-10-30', 'Landrace', 'active', 2, 5, NULL, NULL),
('AUTO-20231115-0008', 'Stella', '2022-01-12', 'Duroc', 'active', 1, 8, 'DUR-2022-0112', 'Strong piglets'),
('AUTO-20231115-0009', 'Luna', '2022-02-28', 'Yorkshire', 'active', 6, 4, NULL, 'Calm during farrowing'),
('AUTO-20231115-0010', NULL, '2022-03-15', 'Hampshire', 'active', 5, 7, 'HAM-2022-0315', NULL),
('AUTO-20231115-0011', 'Hazel', '2022-04-20', 'Landrace', 'active', 4, 2, NULL, 'High weaning weights'),
('AUTO-20231115-0012', 'Rosie', '2022-05-30', 'Yorkshire', 'active', 3, 6, 'YOR-2022-0530', 'Good milk production'),
('AUTO-20231115-0013', NULL, '2022-07-14', 'Duroc', 'active', 2, 4, NULL, NULL),
('AUTO-20231115-0014', 'Maple', '2022-08-22', 'Berkshire', 'active', 1, 5, 'BER-2022-0822', 'Show quality'),
('AUTO-20231115-0015', 'Penny', '2022-09-10', 'Yorkshire', 'active', 7, 3, NULL, 'Consistent breeder'),
('AUTO-20231115-0016', NULL, '2022-10-05', 'Landrace', 'active', 6, 6, 'LAN-2022-1005', NULL),

-- Gilts (5 - young sows that haven't farrowed yet)
('AUTO-20231115-0017', 'Ivy', '2023-01-15', 'Yorkshire', 'active', 1, 3, NULL, 'Young gilt - ready for breeding soon'),
('AUTO-20231115-0018', 'Poppy', '2023-02-28', 'Landrace', 'active', 2, 4, 'LAN-2023-0228', 'Good growth rate'),
('AUTO-20231115-0019', NULL, '2023-04-10', 'Duroc', 'active', 3, 5, NULL, 'Gilt from spring litter'),
('AUTO-20231115-0020', 'Sage', '2023-05-20', 'Hampshire', 'active', 4, 6, NULL, NULL),
('AUTO-20231115-0021', 'Violet', '2023-06-30', 'Berkshire', 'active', 5, 7, 'BER-2023-0630', 'Premium bloodline'),

-- Culled/Sold sows (4)
('AUTO-20231115-0022', 'Matilda', '2020-11-20', 'Yorkshire', 'culled', 5, 4, NULL, 'Culled due to age - 2024-08-15'),
('AUTO-20231115-0023', NULL, '2021-01-08', 'Duroc', 'sold', 4, 8, 'DUR-2021-0108', 'Sold to neighboring farm'),
('AUTO-20231115-0024', 'Clover', '2020-12-12', 'Hampshire', 'culled', 3, 2, NULL, 'Health issues'),
('AUTO-20231115-0025', 'Ginger', '2021-07-25', 'Landrace', 'sold', 2, 6, 'LAN-2021-0725', 'Sold for breeding program')
ON CONFLICT (ear_tag) DO NOTHING;

-- Insert Farrowing Records (multiple farrowings per sow over 3-4 years)

-- Betsy (AUTO-20231115-0001) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-09-10'::date, '2021-09-10'::date + interval '114 days', '2022-01-02'::date, 11, 0, 0, 'First farrowing - excellent'
FROM sows WHERE ear_tag = 'AUTO-20231115-0001'
UNION ALL
SELECT id, '2022-04-15'::date, '2022-04-15'::date + interval '114 days', '2022-08-07'::date, 12, 1, 0, 'Strong litter'
FROM sows WHERE ear_tag = 'AUTO-20231115-0001'
UNION ALL
SELECT id, '2022-11-20'::date, '2022-11-20'::date + interval '114 days', '2023-03-14'::date, 10, 0, 1, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0001'
UNION ALL
SELECT id, '2023-06-25'::date, '2023-06-25'::date + interval '114 days', '2023-10-17'::date, 13, 0, 0, 'Best litter yet'
FROM sows WHERE ear_tag = 'AUTO-20231115-0001';

-- Willow (AUTO-20231115-0002) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-10-05'::date, '2021-10-05'::date + interval '114 days', '2022-01-27'::date, 9, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0002'
UNION ALL
SELECT id, '2022-05-12'::date, '2022-05-12'::date + interval '114 days', '2022-09-03'::date, 11, 0, 0, 'Good recovery'
FROM sows WHERE ear_tag = 'AUTO-20231115-0002'
UNION ALL
SELECT id, '2023-01-18'::date, '2023-01-18'::date + interval '114 days', '2023-05-12'::date, 10, 1, 1, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0002';

-- Daisy (AUTO-20231115-0003) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-11-15'::date, '2021-11-15'::date + interval '114 days', '2022-03-09'::date, 12, 0, 0, 'First farrowing'
FROM sows WHERE ear_tag = 'AUTO-20231115-0003'
UNION ALL
SELECT id, '2022-06-20'::date, '2022-06-20'::date + interval '114 days', '2022-10-12'::date, 11, 2, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0003'
UNION ALL
SELECT id, '2023-02-10'::date, '2023-02-10'::date + interval '114 days', '2023-06-04'::date, 13, 0, 0, 'Large healthy litter'
FROM sows WHERE ear_tag = 'AUTO-20231115-0003';

-- Sow #4 (AUTO-20231115-0004) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-12-20'::date, '2021-12-20'::date + interval '114 days', '2022-04-13'::date, 10, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0004'
UNION ALL
SELECT id, '2022-08-05'::date, '2022-08-05'::date + interval '114 days', '2022-11-27'::date, 9, 0, 1, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0004';

-- Pearl (AUTO-20231115-0005) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-02-10'::date, '2022-02-10'::date + interval '114 days', '2022-06-04'::date, 14, 0, 0, 'Exceptional first litter'
FROM sows WHERE ear_tag = 'AUTO-20231115-0005'
UNION ALL
SELECT id, '2022-09-15'::date, '2022-09-15'::date + interval '114 days', '2023-01-07'::date, 12, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0005'
UNION ALL
SELECT id, '2023-04-20'::date, '2023-04-20'::date + interval '114 days', '2023-08-12'::date, 13, 0, 0, 'Consistent performer'
FROM sows WHERE ear_tag = 'AUTO-20231115-0005';

-- Ruby (AUTO-20231115-0006) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-03-25'::date, '2022-03-25'::date + interval '114 days', '2022-07-17'::date, 11, 0, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0006'
UNION ALL
SELECT id, '2022-10-30'::date, '2022-10-30'::date + interval '114 days', '2023-02-21'::date, 10, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0006';

-- Sow #7 (AUTO-20231115-0007) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-04-28'::date, '2022-04-28'::date + interval '114 days', '2022-08-20'::date, 9, 2, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0007'
UNION ALL
SELECT id, '2022-12-05'::date, '2022-12-05'::date + interval '114 days', '2023-03-29'::date, 11, 0, 0, 'Improvement from first'
FROM sows WHERE ear_tag = 'AUTO-20231115-0007';

-- Stella (AUTO-20231115-0008) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-07-10'::date, '2022-07-10'::date + interval '114 days', '2022-11-01'::date, 12, 0, 0, 'Strong first litter'
FROM sows WHERE ear_tag = 'AUTO-20231115-0008'
UNION ALL
SELECT id, '2023-02-15'::date, '2023-02-15'::date + interval '114 days', '2023-06-09'::date, 11, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0008';

-- Luna (AUTO-20231115-0009) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-08-25'::date, '2022-08-25'::date + interval '114 days', '2022-12-17'::date, 10, 0, 1, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0009'
UNION ALL
SELECT id, '2023-03-30'::date, '2023-03-30'::date + interval '114 days', '2023-07-22'::date, 12, 0, 0, 'Calm farrowing'
FROM sows WHERE ear_tag = 'AUTO-20231115-0009';

-- Sow #10 (AUTO-20231115-0010) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2022-09-12'::date, '2022-09-12'::date + interval '114 days', '2023-01-04'::date, 11, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0010'
UNION ALL
SELECT id, '2023-04-18'::date, '2023-04-18'::date + interval '114 days', NULL, NULL, NULL, NULL, 'Currently pregnant'
FROM sows WHERE ear_tag = 'AUTO-20231115-0010';

-- Hazel (AUTO-20231115-0011) - 1 farrowing (younger sow)
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-01-05'::date, '2023-01-05'::date + interval '114 days', '2023-04-29'::date, 10, 0, 0, 'First farrowing - solid start'
FROM sows WHERE ear_tag = 'AUTO-20231115-0011';

-- Rosie (AUTO-20231115-0012) - 1 farrowing
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-02-20'::date, '2023-02-20'::date + interval '114 days', '2023-06-14'::date, 11, 0, 0, 'Good milk production noted'
FROM sows WHERE ear_tag = 'AUTO-20231115-0012';

-- Sow #13 (AUTO-20231115-0013) - 1 farrowing
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-03-10'::date, '2023-03-10'::date + interval '114 days', '2023-07-02'::date, 9, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0013';

-- Maple (AUTO-20231115-0014) - 1 farrowing
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-04-15'::date, '2023-04-15'::date + interval '114 days', '2023-08-07'::date, 12, 0, 0, 'Show quality piglets'
FROM sows WHERE ear_tag = 'AUTO-20231115-0014';

-- Penny (AUTO-20231115-0015) - 1 farrowing
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-05-01'::date, '2023-05-01'::date + interval '114 days', '2023-08-23'::date, 10, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0015';

-- Sow #16 (AUTO-20231115-0016) - Bred, not farrowed yet
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2023-07-10'::date, '2023-07-10'::date + interval '114 days', NULL, NULL, NULL, NULL, 'First breeding - due soon'
FROM sows WHERE ear_tag = 'AUTO-20231115-0016';

-- Culled/Sold sows with historical data

-- Matilda (AUTO-20231115-0022) - 5 farrowings before culling
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-05-10'::date, '2021-05-10'::date + interval '114 days', '2021-09-01'::date, 11, 0, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0022'
UNION ALL
SELECT id, '2021-12-15'::date, '2021-12-15'::date + interval '114 days', '2022-04-08'::date, 10, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0022'
UNION ALL
SELECT id, '2022-07-20'::date, '2022-07-20'::date + interval '114 days', '2022-11-11'::date, 9, 2, 1, 'Declining performance'
FROM sows WHERE ear_tag = 'AUTO-20231115-0022'
UNION ALL
SELECT id, '2023-02-05'::date, '2023-02-05'::date + interval '114 days', '2023-05-30'::date, 8, 1, 1, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0022'
UNION ALL
SELECT id, '2023-09-10'::date, '2023-09-10'::date + interval '114 days', '2024-01-02'::date, 7, 2, 0, 'Last farrowing before culling'
FROM sows WHERE ear_tag = 'AUTO-20231115-0022';

-- Sold Sow #23 (AUTO-20231115-0023) - 3 farrowings before sale
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes)
SELECT id, '2021-07-15'::date, '2021-07-15'::date + interval '114 days', '2021-11-06'::date, 12, 0, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0023'
UNION ALL
SELECT id, '2022-02-20'::date, '2022-02-20'::date + interval '114 days', '2022-06-14'::date, 11, 1, 0, NULL
FROM sows WHERE ear_tag = 'AUTO-20231115-0023'
UNION ALL
SELECT id, '2022-09-25'::date, '2022-09-25'::date + interval '114 days', '2023-01-17'::date, 13, 0, 0, 'Sold for breeding stock'
FROM sows WHERE ear_tag = 'AUTO-20231115-0023';

-- Summary:
-- 25 sows total
-- 21 active (16 experienced sows + 5 gilts), 2 culled, 2 sold
-- Multiple farrowings per experienced sow (1-5 depending on age)
-- 5 GILTS (young females that have never farrowed):
--   - Ivy, Poppy, Sage, Violet, and one unnamed
--   - Born in 2023 (ages 6-11 months)
--   - No farrowing records (this is what makes them gilts!)
-- Realistic dates spanning 2021-2024
-- Mix of litter sizes (7-14 piglets)
-- Some with ongoing pregnancies
-- Variety of breeds and characteristics
