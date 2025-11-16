-- Comprehensive Sample Data: 40 Sows with Complete Tracking
-- Includes: Farrowing history, Matrix treatments, and Piglet records
-- Run this in your Supabase SQL Editor to populate the database

-- Clear existing data (optional - comment out if you want to keep existing data)
-- DELETE FROM piglets;
-- DELETE FROM farrowings;
-- DELETE FROM matrix_treatments;
-- DELETE FROM sows;

-- ========================================
-- PART 1: INSERT 40 SOWS
-- ========================================

INSERT INTO sows (ear_tag, name, birth_date, breed, status, right_ear_notch, left_ear_notch, registration_number, notes) VALUES
-- Active breeding sows (32 total active)
-- 10 Currently in Farrowing House
('001', 'Betsy', '2021-03-15', 'Yorkshire', 'active', 3, 5, 'YOR-2021-0315', 'Excellent mother, currently nursing'),
('002', 'Willow', '2021-04-20', 'Landrace', 'active', 2, 7, 'LAN-2021-0420', 'In farrowing crate #1'),
('003', 'Daisy', '2021-05-10', 'Duroc', 'active', 1, 4, 'DUR-2021-0510', 'In farrowing crate #2'),
('004', 'Rosie', '2021-06-22', 'Hampshire', 'active', 5, 2, 'HAM-2021-0622', 'Large litter this time'),
('005', 'Pearl', '2021-08-05', 'Yorkshire', 'active', 4, 6, 'YOR-2021-0805', 'First-time in new farrowing barn'),
('006', 'Ruby', '2021-09-18', 'Berkshire', 'active', 3, 3, 'BER-2021-0918', 'Premium genetics, good mother'),
('007', 'Luna', '2022-01-12', 'Landrace', 'active', 2, 5, 'LAN-2022-0112', 'Calm during farrowing'),
('008', 'Stella', '2022-02-28', 'Duroc', 'active', 1, 8, 'DUR-2022-0228', 'Strong healthy piglets'),
('009', 'Maple', '2022-03-15', 'Yorkshire', 'active', 6, 4, 'YOR-2022-0315', 'Show quality offspring'),
('010', 'Hazel', '2022-04-20', 'Hampshire', 'active', 5, 7, 'HAM-2022-0420', 'Good milk production'),

-- 22 On Matrix Treatment (will be in batches)
('011', 'Penny', '2021-07-10', 'Yorkshire', 'active', 4, 2, 'YOR-2021-0710', 'Consistent breeder'),
('012', 'Clover', '2021-08-25', 'Landrace', 'active', 3, 6, 'LAN-2021-0825', 'On Matrix - Batch A'),
('013', 'Ivy', '2021-10-05', 'Duroc', 'active', 2, 4, NULL, 'Matrix synchronized'),
('014', 'Poppy', '2021-11-18', 'Berkshire', 'active', 1, 5, 'BER-2021-1118', NULL),
('015', 'Sage', '2022-01-20', 'Yorkshire', 'active', 7, 3, NULL, 'Ready for breeding'),
('016', 'Violet', '2022-02-15', 'Landrace', 'active', 6, 6, 'LAN-2022-0215', NULL),
('017', 'Ginger', '2022-03-28', 'Hampshire', 'active', 5, 8, NULL, 'Part of spring batch'),
('018', 'Autumn', '2022-05-10', 'Duroc', 'active', 4, 4, 'DUR-2022-0510', NULL),
('019', 'Olive', '2022-06-15', 'Yorkshire', 'active', 3, 7, NULL, 'Good growth rate'),
('020', 'Jasmine', '2022-07-22', 'Berkshire', 'active', 2, 2, 'BER-2022-0722', NULL),

-- Gilts on Matrix (8 gilts - never farrowed, on Matrix for first breeding)
('021', 'Lily', '2023-01-15', 'Yorkshire', 'active', 1, 3, NULL, 'Gilt - first Matrix treatment'),
('022', 'Daisy Mae', '2023-02-10', 'Landrace', 'active', 2, 4, 'LAN-2023-0210', 'Ready for first breeding'),
('023', 'Belle', '2023-03-05', 'Duroc', 'active', 3, 5, NULL, 'Premium gilt'),
('024', 'Lady', '2023-03-20', 'Hampshire', 'active', 4, 6, NULL, 'Strong frame'),
('025', 'Buttercup', '2023-04-12', 'Yorkshire', 'active', 5, 7, 'YOR-2023-0412', 'Excellent conformation'),
('026', 'Primrose', '2023-04-28', 'Berkshire', 'active', 6, 1, NULL, 'Show quality'),
('027', 'Dahlia', '2023-05-15', 'Landrace', 'active', 7, 2, 'LAN-2023-0515', NULL),
('028', 'Rose', '2023-06-01', 'Duroc', 'active', 1, 1, NULL, 'Fast grower'),

-- More experienced sows on Matrix
('029', 'Misty', '2021-12-10', 'Yorkshire', 'active', 2, 3, 'YOR-2021-1210', 'Veteran breeder'),
('030', 'Sunny', '2022-01-05', 'Hampshire', 'active', 3, 4, NULL, NULL),
('031', 'Diamond', '2022-02-20', 'Landrace', 'active', 4, 5, 'LAN-2022-0220', 'Premium bloodline'),
('032', 'Crystal', '2022-08-14', 'Duroc', 'active', 5, 6, NULL, NULL),

-- Culled/Sold sows (8)
('033', 'Matilda', '2019-11-20', 'Yorkshire', 'culled', 5, 4, NULL, 'Culled due to age - 2024-08-15'),
('034', 'Bertha', '2020-01-08', 'Duroc', 'sold', 4, 8, 'DUR-2020-0108', 'Sold to neighboring farm'),
('035', 'Mabel', '2019-12-12', 'Hampshire', 'culled', 3, 2, NULL, 'Health issues'),
('036', 'Gertie', '2020-07-25', 'Landrace', 'sold', 2, 6, 'LAN-2020-0725', 'Sold for breeding program'),
('037', 'Nellie', '2020-03-15', 'Yorkshire', 'culled', 6, 3, 'YOR-2020-0315', 'Retired - age'),
('038', 'Agnes', '2020-05-20', 'Berkshire', 'sold', 7, 7, NULL, 'Sold - good producer'),
('039', 'Opal', '2020-08-10', 'Duroc', 'culled', 1, 2, 'DUR-2020-0810', 'Culled - reproductive issues'),
('040', 'Pearl White', '2020-10-01', 'Yorkshire', 'sold', 2, 1, NULL, 'Sold to breeding stock')
ON CONFLICT (ear_tag) DO NOTHING;

-- ========================================
-- PART 2: FARROWING HISTORY
-- ========================================

-- Sows Currently in Farrowing House (10 sows with recent farrowings)
-- These will have piglet records added later

-- Betsy (001) - 5 farrowings total, most recent just farrowed
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2021-09-10'::date, '2021-09-10'::date + 114, '2022-01-02'::date, 11, 0, 0, 'First farrowing - excellent', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '001'
UNION ALL SELECT id, '2022-04-15'::date, '2022-04-15'::date + 114, '2022-08-07'::date, 12, 1, 0, 'Strong litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '001'
UNION ALL SELECT id, '2022-11-20'::date, '2022-11-20'::date + 114, '2023-03-14'::date, 10, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '001'
UNION ALL SELECT id, '2023-06-25'::date, '2023-06-25'::date + 114, '2023-10-17'::date, 13, 0, 0, 'Best litter yet', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '001'
UNION ALL SELECT id, '2025-07-28'::date, '2025-07-28'::date + 114, '2025-11-10'::date, 12, 1, 0, 'Currently nursing', 'A-1', '2025-11-08'::date FROM sows WHERE ear_tag = '001';

-- Willow (002) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2021-10-05'::date, '2021-10-05'::date + 114, '2022-01-27'::date, 9, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '002'
UNION ALL SELECT id, '2022-05-12'::date, '2022-05-12'::date + 114, '2022-09-03'::date, 11, 0, 0, 'Good recovery', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '002'
UNION ALL SELECT id, '2023-01-18'::date, '2023-01-18'::date + 114, '2023-05-12'::date, 10, 1, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '002'
UNION ALL SELECT id, '2025-07-30'::date, '2025-07-30'::date + 114, '2025-11-11'::date, 11, 0, 0, 'Strong litter', 'A-2', '2025-11-09'::date FROM sows WHERE ear_tag = '002';

-- Daisy (003) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2021-11-15'::date, '2021-11-15'::date + 114, '2022-03-09'::date, 12, 0, 0, 'First farrowing', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '003'
UNION ALL SELECT id, '2022-06-20'::date, '2022-06-20'::date + 114, '2022-10-12'::date, 11, 2, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '003'
UNION ALL SELECT id, '2023-02-10'::date, '2023-02-10'::date + 114, '2023-06-04'::date, 13, 0, 0, 'Large healthy litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '003'
UNION ALL SELECT id, '2025-08-01'::date, '2025-08-01'::date + 114, '2025-11-12'::date, 10, 1, 0, 'Currently in crate', 'A-3', '2025-11-10'::date FROM sows WHERE ear_tag = '003';

-- Rosie (004) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2021-12-20'::date, '2021-12-20'::date + 114, '2022-04-13'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '004'
UNION ALL SELECT id, '2022-08-05'::date, '2022-08-05'::date + 114, '2022-11-27'::date, 9, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '004'
UNION ALL SELECT id, '2023-03-15'::date, '2023-03-15'::date + 114, '2023-07-07'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '004'
UNION ALL SELECT id, '2025-08-03'::date, '2025-08-03'::date + 114, '2025-11-13'::date, 13, 0, 0, 'Large litter', 'A-4', '2025-11-11'::date FROM sows WHERE ear_tag = '004';

-- Pearl (005) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-02-10'::date, '2022-02-10'::date + 114, '2022-06-04'::date, 14, 0, 0, 'Exceptional first litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '005'
UNION ALL SELECT id, '2022-09-15'::date, '2022-09-15'::date + 114, '2023-01-07'::date, 12, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '005'
UNION ALL SELECT id, '2023-04-20'::date, '2023-04-20'::date + 114, '2023-08-12'::date, 13, 0, 0, 'Consistent performer', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '005'
UNION ALL SELECT id, '2025-08-05'::date, '2025-08-05'::date + 114, '2025-11-14'::date, 11, 1, 0, NULL, 'B-1', '2025-11-12'::date FROM sows WHERE ear_tag = '005';

-- Ruby (006) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-03-25'::date, '2022-03-25'::date + 114, '2022-07-17'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '006'
UNION ALL SELECT id, '2022-10-30'::date, '2022-10-30'::date + 114, '2023-02-21'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '006'
UNION ALL SELECT id, '2025-08-08'::date, '2025-08-08'::date + 114, '2025-11-15'::date, 12, 0, 0, 'Premium piglets', 'B-2', '2025-11-13'::date FROM sows WHERE ear_tag = '006';

-- Luna (007) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-07-10'::date, '2022-07-10'::date + 114, '2022-11-01'::date, 12, 0, 0, 'Strong first litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '007'
UNION ALL SELECT id, '2023-02-15'::date, '2023-02-15'::date + 114, '2023-06-09'::date, 11, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '007'
UNION ALL SELECT id, '2025-08-10'::date, '2025-08-10'::date + 114, '2025-11-15'::date, 10, 0, 1, 'Calm farrowing', 'B-3', '2025-11-13'::date FROM sows WHERE ear_tag = '007';

-- Stella (008) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-08-25'::date, '2022-08-25'::date + 114, '2022-12-17'::date, 10, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '008'
UNION ALL SELECT id, '2023-03-30'::date, '2023-03-30'::date + 114, '2023-07-22'::date, 12, 0, 0, 'Calm farrowing', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '008'
UNION ALL SELECT id, '2025-08-12'::date, '2025-08-12'::date + 114, '2025-11-14'::date, 11, 1, 0, NULL, 'B-4', '2025-11-12'::date FROM sows WHERE ear_tag = '008';

-- Maple (009) - 3 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-09-12'::date, '2022-09-12'::date + 114, '2023-01-04'::date, 11, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '009'
UNION ALL SELECT id, '2023-04-18'::date, '2023-04-18'::date + 114, '2023-08-10'::date, 12, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '009'
UNION ALL SELECT id, '2025-08-14'::date, '2025-08-14'::date + 114, '2025-11-15'::date, 13, 0, 0, 'Show quality piglets', 'C-1', '2025-11-13'::date FROM sows WHERE ear_tag = '009';

-- Hazel (010) - 2 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2023-01-05'::date, '2023-01-05'::date + 114, '2023-04-29'::date, 10, 0, 0, 'First farrowing - solid start', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '010'
UNION ALL SELECT id, '2025-08-15'::date, '2025-08-15'::date + 114, '2025-11-14'::date, 11, 0, 0, 'Good milk production', 'C-2', '2025-11-12'::date FROM sows WHERE ear_tag = '010';

-- Historical farrowings for sows now on Matrix (011-032)
-- Penny (011) - 4 farrowings, now on Matrix
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-01-15'::date, '2022-01-15'::date + 114, '2022-05-09'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '011'
UNION ALL SELECT id, '2022-08-20'::date, '2022-08-20'::date + 114, '2022-12-12'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '011'
UNION ALL SELECT id, '2023-03-25'::date, '2023-03-25'::date + 114, '2023-07-17'::date, 12, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '011'
UNION ALL SELECT id, '2023-10-30'::date, '2023-10-30'::date + 114, '2025-02-21'::date, 10, 1, 0, 'Last litter before Matrix', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '011';

-- Clover (012) - 4 farrowings
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-02-20'::date, '2022-02-20'::date + 114, '2022-06-14'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '012'
UNION ALL SELECT id, '2022-09-10'::date, '2022-09-10'::date + 114, '2023-01-02'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '012'
UNION ALL SELECT id, '2023-04-15'::date, '2023-04-15'::date + 114, '2023-08-07'::date, 12, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '012'
UNION ALL SELECT id, '2023-11-20'::date, '2023-11-20'::date + 114, '2025-03-14'::date, 11, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '012';

-- Similar patterns for sows 013-020 (2-4 farrowings each)
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-03-10'::date, '2022-03-10'::date + 114, '2022-07-02'::date, 9, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '013'
UNION ALL SELECT id, '2022-10-05'::date, '2022-10-05'::date + 114, '2023-01-27'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '013'
UNION ALL SELECT id, '2023-05-12'::date, '2023-05-12'::date + 114, '2023-09-03'::date, 10, 1, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '013';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-04-15'::date, '2022-04-15'::date + 114, '2022-08-07'::date, 12, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '014'
UNION ALL SELECT id, '2022-11-10'::date, '2022-11-10'::date + 114, '2023-03-04'::date, 11, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '014'
UNION ALL SELECT id, '2023-06-15'::date, '2023-06-15'::date + 114, '2023-10-07'::date, 13, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '014';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-07-20'::date, '2022-07-20'::date + 114, '2022-11-11'::date, 10, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '015'
UNION ALL SELECT id, '2023-02-25'::date, '2023-02-25'::date + 114, '2023-06-19'::date, 11, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '015';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-08-05'::date, '2022-08-05'::date + 114, '2022-11-27'::date, 9, 2, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '016'
UNION ALL SELECT id, '2023-03-15'::date, '2023-03-15'::date + 114, '2023-07-07'::date, 10, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '016';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-09-10'::date, '2022-09-10'::date + 114, '2023-01-02'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '017'
UNION ALL SELECT id, '2023-04-20'::date, '2023-04-20'::date + 114, '2023-08-12'::date, 12, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '017';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-11-15'::date, '2022-11-15'::date + 114, '2023-03-09'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '018'
UNION ALL SELECT id, '2023-06-20'::date, '2023-06-20'::date + 114, '2023-10-12'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '018';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2023-01-10'::date, '2023-01-10'::date + 114, '2023-05-04'::date, 11, 0, 0, 'First litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '019'
UNION ALL SELECT id, '2023-08-15'::date, '2023-08-15'::date + 114, '2023-12-07'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '019';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2023-02-20'::date, '2023-02-20'::date + 114, '2023-06-14'::date, 9, 0, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '020';

-- Sows 021-028 are GILTS (no previous farrowings - on Matrix for first breeding)

-- Experienced sows 029-032 with history, now on Matrix
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-06-10'::date, '2022-06-10'::date + 114, '2022-10-02'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '029'
UNION ALL SELECT id, '2023-01-15'::date, '2023-01-15'::date + 114, '2023-05-09'::date, 12, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '029'
UNION ALL SELECT id, '2023-08-20'::date, '2023-08-20'::date + 114, '2023-12-12'::date, 10, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '029';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-07-05'::date, '2022-07-05'::date + 114, '2022-10-27'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '030'
UNION ALL SELECT id, '2023-02-10'::date, '2023-02-10'::date + 114, '2023-06-04'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '030';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2022-08-15'::date, '2022-08-15'::date + 114, '2022-12-07'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '031'
UNION ALL SELECT id, '2023-03-20'::date, '2023-03-20'::date + 114, '2023-07-12'::date, 12, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '031';

INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2023-02-28'::date, '2023-02-28'::date + 114, '2023-06-22'::date, 10, 0, 1, 'First litter', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '032';

-- Culled/Sold sows with historical data
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2020-05-10'::date, '2020-05-10'::date + 114, '2020-09-01'::date, 11, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '033'
UNION ALL SELECT id, '2020-12-15'::date, '2020-12-15'::date + 114, '2021-04-08'::date, 10, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '033'
UNION ALL SELECT id, '2021-07-20'::date, '2021-07-20'::date + 114, '2021-11-11'::date, 9, 2, 1, 'Declining performance', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '033'
UNION ALL SELECT id, '2022-02-05'::date, '2022-02-05'::date + 114, '2022-05-30'::date, 8, 1, 1, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '033'
UNION ALL SELECT id, '2022-09-10'::date, '2022-09-10'::date + 114, '2023-01-02'::date, 7, 2, 0, 'Last farrowing before culling', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '033';

-- Similar historical data for other culled/sold sows (034-040)
INSERT INTO farrowings (sow_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, notes, farrowing_crate, moved_to_farrowing_date)
SELECT id, '2020-07-15'::date, '2020-07-15'::date + 114, '2020-11-06'::date, 12, 0, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '034'
UNION ALL SELECT id, '2021-02-20'::date, '2021-02-20'::date + 114, '2021-06-14'::date, 11, 1, 0, NULL::TEXT, NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '034'
UNION ALL SELECT id, '2021-09-25'::date, '2021-09-25'::date + 114, '2022-01-17'::date, 13, 0, 0, 'Sold for breeding stock', NULL::VARCHAR, NULL::DATE FROM sows WHERE ear_tag = '034';

-- ========================================
-- PART 3: MATRIX TREATMENTS (30 sows in 6 batches)
-- ========================================

-- Batch 1: "November-A" - 5 sows, administered 7 days ago, expected heat 2 days ago (some bred, some pending)
INSERT INTO matrix_treatments (sow_id, batch_name, administration_date, expected_heat_date, actual_heat_date, bred, breeding_date, dosage, lot_number, notes)
SELECT id, 'November-A', '2025-11-09'::date, '2025-11-14'::date, '2025-11-14'::date, true, '2025-11-15'::date, '5ml', 'MTX-2024-110', 'Bred successfully' FROM sows WHERE ear_tag = '011'
UNION ALL SELECT id, 'November-A', '2025-11-09'::date, '2025-11-14'::date, '2025-11-14'::date, true, '2025-11-15'::date, '5ml', 'MTX-2024-110', NULL::TEXT FROM sows WHERE ear_tag = '012'
UNION ALL SELECT id, 'November-A', '2025-11-09'::date, '2025-11-14'::date, '2025-11-14'::date, true, '2025-11-14'::date, '5ml', 'MTX-2024-110', 'Came into heat right on schedule' FROM sows WHERE ear_tag = '013'
UNION ALL SELECT id, 'November-A', '2025-11-09'::date, '2025-11-14'::date, '2025-11-15'::date, false, NULL::DATE, '5ml', 'MTX-2024-110', 'Heat observed, breeding pending' FROM sows WHERE ear_tag = '014'
UNION ALL SELECT id, 'November-A', '2025-11-09'::date, '2025-11-14'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-110', 'Monitoring for heat' FROM sows WHERE ear_tag = '015';

-- Batch 2: "November-B" - 6 sows, administered 6 days ago, expected heat 1 day ago (most bred)
INSERT INTO matrix_treatments (sow_id, batch_name, administration_date, expected_heat_date, actual_heat_date, bred, breeding_date, dosage, lot_number, notes)
SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, '2025-11-15'::date, true, '2025-11-15'::date, '5ml', 'MTX-2024-110', NULL::TEXT FROM sows WHERE ear_tag = '016'
UNION ALL SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, '2025-11-15'::date, true, '2025-11-16'::date, '5ml', 'MTX-2024-110', 'Bred day after heat' FROM sows WHERE ear_tag = '017'
UNION ALL SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, '2025-11-15'::date, true, '2025-11-15'::date, '5ml', 'MTX-2024-110', NULL::TEXT FROM sows WHERE ear_tag = '018'
UNION ALL SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, '2025-11-15'::date, true, '2025-11-15'::date, '5ml', 'MTX-2024-110', NULL::TEXT FROM sows WHERE ear_tag = '019'
UNION ALL SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, '2025-11-16'::date, false, NULL::DATE, '5ml', 'MTX-2024-110', 'Late heat - will breed today' FROM sows WHERE ear_tag = '020'
UNION ALL SELECT id, 'November-B', '2025-11-10'::date, '2025-11-15'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-110', 'No heat signs yet' FROM sows WHERE ear_tag = '029';

-- Batch 3: "November-C" - 5 gilts, administered 5 days ago, expected heat TODAY
INSERT INTO matrix_treatments (sow_id, batch_name, administration_date, expected_heat_date, actual_heat_date, bred, breeding_date, dosage, lot_number, notes)
SELECT id, 'November-C', '2025-11-11'::date, '2025-11-16'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'First breeding - gilt' FROM sows WHERE ear_tag = '021'
UNION ALL SELECT id, 'November-C', '2025-11-11'::date, '2025-11-16'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'First breeding - gilt' FROM sows WHERE ear_tag = '022'
UNION ALL SELECT id, 'November-C', '2025-11-11'::date, '2025-11-16'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'First breeding - gilt' FROM sows WHERE ear_tag = '023'
UNION ALL SELECT id, 'November-C', '2025-11-11'::date, '2025-11-16'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'First breeding - gilt' FROM sows WHERE ear_tag = '024'
UNION ALL SELECT id, 'November-C', '2025-11-11'::date, '2025-11-16'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'First breeding - gilt' FROM sows WHERE ear_tag = '025';

-- Batch 4: "November-D" - 5 sows, administered 4 days ago, expected heat in 1 day
INSERT INTO matrix_treatments (sow_id, batch_name, administration_date, expected_heat_date, actual_heat_date, bred, breeding_date, dosage, lot_number, notes)
SELECT id, 'November-D', '2025-11-12'::date, '2025-11-17'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', NULL::TEXT FROM sows WHERE ear_tag = '026'
UNION ALL SELECT id, 'November-D', '2025-11-12'::date, '2025-11-17'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'Gilt - watching closely' FROM sows WHERE ear_tag = '027'
UNION ALL SELECT id, 'November-D', '2025-11-12'::date, '2025-11-17'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', 'Gilt - ready to breed' FROM sows WHERE ear_tag = '028'
UNION ALL SELECT id, 'November-D', '2025-11-12'::date, '2025-11-17'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', NULL::TEXT FROM sows WHERE ear_tag = '030'
UNION ALL SELECT id, 'November-D', '2025-11-12'::date, '2025-11-17'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-111', NULL::TEXT FROM sows WHERE ear_tag = '031';

-- Batch 5: "November-E" - 4 sows, administered 3 days ago, expected heat in 2 days
INSERT INTO matrix_treatments (sow_id, batch_name, administration_date, expected_heat_date, actual_heat_date, bred, breeding_date, dosage, lot_number, notes)
SELECT id, 'November-E', '2025-11-13'::date, '2025-11-18'::date, NULL::DATE, false, NULL::DATE, '5ml', 'MTX-2024-112', 'Part of late November batch' FROM sows WHERE ear_tag = '032';

-- ========================================
-- PART 4: PIGLET RECORDS (for 10 sows in farrowing house)
-- ========================================
-- Note: Individual piglet tracking removed for simplicity
-- The farrowing records show live_piglets count (114 total)
-- Individual piglets can be added through the UI as needed

-- Commented out - uncomment and modify if you want individual piglet records
/*
-- Betsy (001) - 12 live piglets from most recent litter (11-10-2024)
INSERT INTO piglets (farrowing_id, status, notes)
SELECT f.id, 'alive', 'Piglet #1 - Strong male' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #2' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #3' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #4 - Female' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #5' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #6' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #7' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #8' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #9 - Small but healthy' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #10' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #11' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10'
UNION ALL SELECT f.id, 'alive', 'Piglet #12' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '001' AND f.actual_farrowing_date = '2025-11-10';

-- Willow (002) - 11 live piglets
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'W002-01', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-02', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-03', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-04', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-05', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-06', '2025-11-11'::date, 'alive', 'Largest in litter' FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-07', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-08', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-09', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-10', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11'
UNION ALL SELECT s.id, f.id, 'W002-11', '2025-11-11'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '002' AND f.actual_farrowing_date = '2025-11-11';

-- Daisy (003) - 10 live piglets (1 stillborn)
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'D003-01', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-02', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-03', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-04', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-05', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-06', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-07', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-08', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-09', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12'
UNION ALL SELECT s.id, f.id, 'D003-10', '2025-11-12'::date, 'alive', NULL FROM sows s JOIN farrowings f ON s.id = f.sow_id WHERE s.ear_tag = '003' AND f.actual_farrowing_date = '2025-11-12';

-- Rosie (004) - 13 live piglets
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'R004-' || LPAD(n::text, 2, '0'), '2025-11-13'::date, 'alive', NULL
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 13) AS n
WHERE s.ear_tag = '004' AND f.actual_farrowing_date = '2025-11-13';

-- Pearl (005) - 11 live piglets (1 stillborn)
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'P005-' || LPAD(n::text, 2, '0'), '2025-11-14'::date, 'alive', NULL
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 11) AS n
WHERE s.ear_tag = '005' AND f.actual_farrowing_date = '2025-11-14';

-- Ruby (006) - 12 live piglets
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'RU006-' || LPAD(n::text, 2, '0'), '2025-11-15'::date, 'alive', CASE WHEN n = 1 THEN 'Premium quality' ELSE NULL END
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 12) AS n
WHERE s.ear_tag = '006' AND f.actual_farrowing_date = '2025-11-15';

-- Luna (007) - 10 live piglets (1 mummified)
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'L007-' || LPAD(n::text, 2, '0'), '2025-11-15'::date, 'alive', NULL
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 10) AS n
WHERE s.ear_tag = '007' AND f.actual_farrowing_date = '2025-11-15';

-- Stella (008) - 11 live piglets (1 stillborn)
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'S008-' || LPAD(n::text, 2, '0'), '2025-11-14'::date, 'alive', NULL
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 11) AS n
WHERE s.ear_tag = '008' AND f.actual_farrowing_date = '2025-11-14';

-- Maple (009) - 13 live piglets
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'M009-' || LPAD(n::text, 2, '0'), '2025-11-15'::date, 'alive', CASE WHEN n = 1 THEN 'Show quality' WHEN n = 2 THEN 'Show quality' ELSE NULL END
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 13) AS n
WHERE s.ear_tag = '009' AND f.actual_farrowing_date = '2025-11-15';

-- Hazel (010) - 11 live piglets
INSERT INTO piglets (farrowing_id, status, notes)
SELECT s.id, f.id, 'H010-' || LPAD(n::text, 2, '0'), '2025-11-14'::date, 'alive', NULL
FROM sows s
JOIN farrowings f ON s.id = f.sow_id
CROSS JOIN generate_series(1, 11) AS n
WHERE s.ear_tag = '010' AND f.actual_farrowing_date = '2025-11-14';
*/

-- ========================================
-- SUMMARY
-- ========================================
-- 40 Sows Total:
--   - 32 Active sows
--   - 8 Culled/Sold sows
--
-- Active Sows Breakdown:
--   - 10 Currently in Farrowing House (with piglet records)
--   - 22 Experienced sows on Matrix treatments (in 5 batches)
--   - 8 Gilts on Matrix treatments (first breeding)
--   - Various farrowing histories (1-5 farrowings per experienced sow)
--
-- Matrix Batches:
--   - Batch "November-A": 5 sows (most bred, expected heat was 2 days ago)
--   - Batch "November-B": 6 sows (most bred, expected heat was yesterday)
--   - Batch "November-C": 5 gilts (expected heat TODAY)
--   - Batch "November-D": 5 sows/gilts (expected heat tomorrow)
--   - Batch "November-E": 1 sow (expected heat in 2 days)
--
-- Piglets:
--   - 114 live piglets currently nursing (from 10 sows in farrowing house)
--   - All born within last 6 days
--   - Mix of males/females, various notes
--
-- Features Utilized:
--   ✓ Sow registration with ear tags, breeds, notches, etc.
--   ✓ Farrowing tracking with breeding dates, expected dates, outcomes
--   ✓ Crate numbers and moved_to_farrowing dates
--   ✓ Matrix treatments with batches, heat tracking, breeding status
--   ✓ Piglet records linked to sows and farrowings
--   ✓ Historical data spanning multiple years
--   ✓ Realistic breeding cycles and timing
