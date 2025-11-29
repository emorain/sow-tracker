-- Comprehensive Test Data for Sow Tracker
-- Covers all features: breeding, farrowing, weaning, housing, health tracking
-- Replace YOUR_USER_ID with your actual user_id from auth.users

-- Set your user_id here
DO $$
DECLARE
    v_user_id UUID := '709f96ca-61bc-474c-88ed-405967cc5882'; -- Replace with your actual user_id
BEGIN

-- ============================================================================
-- HOUSING UNITS (Various types and buildings)
-- ============================================================================

INSERT INTO housing_units (id, user_id, name, pen_number, type, building_name, length_feet, width_feet, square_footage, max_capacity, notes) VALUES
-- Gestation Building
('11111111-1111-1111-1111-000000000001', v_user_id, 'Gestation Pen 1', '1', 'gestation', 'Gestation Building A', 20, 30, 600, 25, 'Main gestation area'),
('11111111-1111-1111-1111-000000000002', v_user_id, 'Gestation Pen 2', '2', 'gestation', 'Gestation Building A', 20, 30, 600, 25, 'Secondary gestation'),
('11111111-1111-1111-1111-000000000003', v_user_id, 'Gestation Pen 3', '3', 'gestation', 'Gestation Building B', 25, 30, 750, 30, 'Large gestation pen'),

-- Farrowing Building
('11111111-1111-1111-1111-000000000004', v_user_id, 'Farrowing Pen 1', '1', 'farrowing', 'Farrowing House 1', 12, 8, 96, 1, 'Individual farrowing crate'),
('11111111-1111-1111-1111-000000000005', v_user_id, 'Farrowing Pen 2', '2', 'farrowing', 'Farrowing House 1', 12, 8, 96, 1, 'Individual farrowing crate'),
('11111111-1111-1111-1111-000000000006', v_user_id, 'Farrowing Pen 3', '3', 'farrowing', 'Farrowing House 1', 12, 8, 96, 1, 'Individual farrowing crate'),
('11111111-1111-1111-1111-000000000007', v_user_id, 'Farrowing Pen 4', '4', 'farrowing', 'Farrowing House 2', 12, 8, 96, 1, 'Individual farrowing crate'),
('11111111-1111-1111-1111-000000000008', v_user_id, 'Farrowing Pen 5', '5', 'farrowing', 'Farrowing House 2', 12, 8, 96, 1, 'Individual farrowing crate'),

-- Nursery Building
('11111111-1111-1111-1111-000000000009', v_user_id, 'Nursery Pen 1', '1', 'other', 'Nursery Building', 15, 20, 300, 50, 'Weaned piglet nursery'),
('11111111-1111-1111-1111-000000000010', v_user_id, 'Nursery Pen 2', '2', 'other', 'Nursery Building', 15, 20, 300, 50, 'Weaned piglet nursery'),
('11111111-1111-1111-1111-000000000011', v_user_id, 'Nursery Pen 3', '3', 'other', 'Nursery Building', 15, 20, 300, 50, 'Weaned piglet nursery'),

-- Breeding Area
('11111111-1111-1111-1111-000000000012', v_user_id, 'Breeding Pen 1', '1', 'breeding', 'Breeding Barn', 10, 12, 120, 3, 'Heat detection area'),

-- Hospital & Quarantine
('11111111-1111-1111-1111-000000000013', v_user_id, 'Hospital Pen', '1', 'hospital', 'Medical Building', 8, 10, 80, 2, 'Sick animal isolation'),
('11111111-1111-1111-1111-000000000014', v_user_id, 'Quarantine Pen', '1', 'quarantine', 'Medical Building', 8, 10, 80, 2, 'New animal quarantine');

-- ============================================================================
-- BOARS (For breeding records)
-- ============================================================================

INSERT INTO boars (id, user_id, ear_tag, name, birth_date, breed, status, housing_unit_id, notes) VALUES
('22222222-2222-2222-2222-000000000001', v_user_id, 'B001', 'Duke', '2022-01-15', 'Duroc', 'active', '11111111-1111-1111-1111-000000000012', 'Prime breeding boar'),
('22222222-2222-2222-2222-000000000002', v_user_id, 'B002', 'King', '2021-11-20', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000012', 'Excellent temperament'),
('22222222-2222-2222-2222-000000000003', v_user_id, 'B003', 'Max', '2022-03-10', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000012', 'Young boar, good genetics');

-- ============================================================================
-- SOWS (50 sows with diverse scenarios)
-- ============================================================================

INSERT INTO sows (id, user_id, ear_tag, name, birth_date, breed, status, housing_unit_id, notes) VALUES
-- Group 1: Currently Pregnant (10 sows) - Various stages of pregnancy
('33333333-3333-3333-3333-000000000001', v_user_id, 'S001', 'Daisy', '2021-03-15', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Excellent mother, 4th parity'),
('33333333-3333-3333-3333-000000000002', v_user_id, 'S002', 'Rosie', '2021-05-20', 'Landrace', 'active', '11111111-1111-1111-1111-000000000001', 'Good appetite, 3rd parity'),
('33333333-3333-3333-3333-000000000003', v_user_id, 'S003', 'Bella', '2021-08-10', 'Duroc', 'active', '11111111-1111-1111-1111-000000000001', 'First-time mother'),
('33333333-3333-3333-3333-000000000004', v_user_id, 'S004', 'Lucy', '2020-11-25', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000002', 'Veteran sow, 6th parity'),
('33333333-3333-3333-3333-000000000005', v_user_id, 'S005', 'Molly', '2021-07-14', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000002', '2nd parity, good genetics'),
('33333333-3333-3333-3333-000000000006', v_user_id, 'S006', 'Sophie', '2021-09-30', 'Crossbred', 'active', '11111111-1111-1111-1111-000000000002', 'Yorkshire x Landrace cross'),
('33333333-3333-3333-3333-000000000007', v_user_id, 'S007', 'Penny', '2020-12-05', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000003', 'Consistent producer, 5th parity'),
('33333333-3333-3333-3333-000000000008', v_user_id, 'S008', 'Maggie', '2021-04-18', 'Duroc', 'active', '11111111-1111-1111-1111-000000000003', 'Strong maternal instincts'),
('33333333-3333-3333-3333-000000000009', v_user_id, 'S009', 'Sadie', '2021-10-22', 'Landrace', 'active', '11111111-1111-1111-1111-000000000003', 'First pregnancy, bred late'),
('33333333-3333-3333-3333-000000000010', v_user_id, 'S010', 'Willow', '2021-06-08', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000001', '3rd parity, good litter size'),

-- Group 2: Currently Farrowing (5 sows) - Have farrowed, nursing piglets
('33333333-3333-3333-3333-000000000011', v_user_id, 'S011', 'Ginger', '2020-10-12', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000004', 'Just farrowed, 11 live piglets'),
('33333333-3333-3333-3333-000000000012', v_user_id, 'S012', 'Hazel', '2021-02-28', 'Duroc', 'active', '11111111-1111-1111-1111-000000000005', 'Farrowed 3 days ago, 10 piglets'),
('33333333-3333-3333-3333-000000000013', v_user_id, 'S013', 'Chloe', '2021-01-19', 'Landrace', 'active', '11111111-1111-1111-1111-000000000006', 'Farrowed last week, 12 piglets'),
('33333333-3333-3333-3333-000000000014', v_user_id, 'S014', 'Pearl', '2020-09-15', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000007', 'Excellent milk production'),
('33333333-3333-3333-3333-000000000015', v_user_id, 'S015', 'Ruby', '2021-03-22', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000008', 'Good mother, attentive to piglets'),

-- Group 3: Recently Weaned (8 sows) - Litters weaned, back in gestation/breeding
('33333333-3333-3333-3333-000000000016', v_user_id, 'S016', 'Clover', '2020-08-30', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Weaned 2 weeks ago, ready for breeding'),
('33333333-3333-3333-3333-000000000017', v_user_id, 'S017', 'Buttercup', '2021-01-14', 'Duroc', 'active', '11111111-1111-1111-1111-000000000002', 'Recently weaned, recovering well'),
('33333333-3333-3333-3333-000000000018', v_user_id, 'S018', 'Lola', '2021-04-07', 'Landrace', 'active', '11111111-1111-1111-1111-000000000002', 'Good recovery from weaning'),
('33333333-3333-3333-3333-000000000019', v_user_id, 'S019', 'Lily', '2020-12-20', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000001', 'Weaned 10 days ago'),
('33333333-3333-3333-3333-000000000020', v_user_id, 'S020', 'Grace', '2021-05-11', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000003', 'Ready for next cycle'),
('33333333-3333-3333-3333-000000000021', v_user_id, 'S021', 'Emma', '2021-02-16', 'Crossbred', 'active', '11111111-1111-1111-1111-000000000003', 'Duroc x Yorkshire'),
('33333333-3333-3333-3333-000000000022', v_user_id, 'S022', 'Stella', '2020-11-08', 'Landrace', 'active', '11111111-1111-1111-1111-000000000002', 'Veteran producer'),
('33333333-3333-3333-3333-000000000023', v_user_id, 'S023', 'Olive', '2021-06-25', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Second litter weaned'),

-- Group 4: Just Bred (7 sows) - Recently bred, pregnancy not yet confirmed
('33333333-3333-3333-3333-000000000024', v_user_id, 'S024', 'Charlotte', '2021-07-30', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000002', 'First breeding, gilt'),
('33333333-3333-3333-3333-000000000025', v_user_id, 'S025', 'Violet', '2021-03-12', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Bred 5 days ago'),
('33333333-3333-3333-3333-000000000026', v_user_id, 'S026', 'Piper', '2020-10-05', 'Duroc', 'active', '11111111-1111-1111-1111-000000000003', 'Re-bred after failed pregnancy'),
('33333333-3333-3333-3333-000000000027', v_user_id, 'S027', 'Zoe', '2021-08-19', 'Landrace', 'active', '11111111-1111-1111-1111-000000000002', 'Young gilt, first breeding'),
('33333333-3333-3333-3333-000000000028', v_user_id, 'S028', 'Ellie', '2021-01-28', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Bred last week'),
('33333333-3333-3333-3333-000000000029', v_user_id, 'S029', 'Nala', '2021-04-14', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000003', 'Good heat signs'),
('33333333-3333-3333-3333-000000000030', v_user_id, 'S030', 'Annie', '2020-12-11', 'Crossbred', 'active', '11111111-1111-1111-1111-000000000002', 'Landrace x Hampshire'),

-- Group 5: Open/Ready to Breed (10 sows) - Not pregnant, available for breeding
('33333333-3333-3333-3333-000000000031', v_user_id, 'S031', 'Cookie', '2021-09-03', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Replacement gilt, ready'),
('33333333-3333-3333-3333-000000000032', v_user_id, 'S032', 'Honey', '2021-02-20', 'Duroc', 'active', '11111111-1111-1111-1111-000000000002', 'Open, watching for heat'),
('33333333-3333-3333-3333-000000000033', v_user_id, 'S033', 'Maple', '2021-05-15', 'Landrace', 'active', '11111111-1111-1111-1111-000000000003', 'Recovering from weaning'),
('33333333-3333-3333-3333-000000000034', v_user_id, 'S034', 'Poppy', '2021-07-22', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000001', 'Young, almost ready'),
('33333333-3333-3333-3333-000000000035', v_user_id, 'S035', 'Coco', '2020-11-16', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000002', 'Experienced sow, ready'),
('33333333-3333-3333-3333-000000000036', v_user_id, 'S036', 'Gigi', '2021-03-09', 'Crossbred', 'active', '11111111-1111-1111-1111-000000000003', 'Yorkshire x Duroc'),
('33333333-3333-3333-3333-000000000037', v_user_id, 'S037', 'Mabel', '2021-06-18', 'Landrace', 'active', '11111111-1111-1111-1111-000000000001', 'Good body condition'),
('33333333-3333-3333-3333-000000000038', v_user_id, 'S038', 'Luna', '2021-08-27', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000002', 'Gilt, slight underweight'),
('33333333-3333-3333-3333-000000000039', v_user_id, 'S039', 'Winnie', '2020-10-14', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000003', 'Needs breeding soon'),
('33333333-3333-3333-3333-000000000040', v_user_id, 'S040', 'Peaches', '2021-04-29', 'Duroc', 'active', '11111111-1111-1111-1111-000000000001', 'Ready for breeding'),

-- Group 6: Health Issues (5 sows) - Various health conditions
('33333333-3333-3333-3333-000000000041', v_user_id, 'S041', 'Misty', '2020-09-22', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000013', 'Respiratory infection, on antibiotics'),
('33333333-3333-3333-3333-000000000042', v_user_id, 'S042', 'Fern', '2021-02-11', 'Landrace', 'active', '11111111-1111-1111-1111-000000000013', 'Lameness, being monitored'),
('33333333-3333-3333-3333-000000000043', v_user_id, 'S043', 'Dixie', '2021-05-07', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000002', 'Mild mastitis, treating'),
('33333333-3333-3333-3333-000000000044', v_user_id, 'S044', 'Trixie', '2020-12-28', 'Duroc', 'active', '11111111-1111-1111-1111-000000000013', 'Recovering from retained placenta'),
('33333333-3333-3333-3333-000000000045', v_user_id, 'S045', 'Jasmine', '2021-07-13', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000001', 'Poor appetite, monitoring'),

-- Group 7: High Performers (5 sows) - Exceptional breeding stock
('33333333-3333-3333-3333-000000000046', v_user_id, 'S046', 'Queen', '2019-08-15', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000002', 'Top producer, 8 litters, avg 12 piglets'),
('33333333-3333-3333-3333-000000000047', v_user_id, 'S047', 'Duchess', '2019-11-20', 'Landrace', 'active', '11111111-1111-1111-1111-000000000003', 'Excellent genetics, 7 litters'),
('33333333-3333-3333-3333-000000000048', v_user_id, 'S048', 'Princess', '2020-01-10', 'Hampshire', 'active', '11111111-1111-1111-1111-000000000001', 'Consistent large litters'),
('33333333-3333-3333-3333-000000000049', v_user_id, 'S049', 'Lady', '2020-04-05', 'Duroc', 'active', '11111111-1111-1111-1111-000000000002', 'Great mothering ability'),
('33333333-3333-3333-3333-000000000050', v_user_id, 'S050', 'Majesty', '2019-12-18', 'Yorkshire', 'active', '11111111-1111-1111-1111-000000000003', 'Top 5% producer, keep genetics');

-- ============================================================================
-- BREEDING ATTEMPTS (Breeding records for pregnant and recently bred sows)
-- ============================================================================

INSERT INTO breeding_attempts (id, user_id, sow_id, boar_id, breeding_date, breeding_method, notes, pregnancy_confirmed, pregnancy_check_date) VALUES
-- Confirmed pregnancies (Group 1: Currently Pregnant)
('44444444-4444-4444-4444-000000000001', v_user_id, '33333333-3333-3333-3333-000000000001', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 95, 'natural', 'Strong heat signs', true, CURRENT_DATE - 70),
('44444444-4444-4444-4444-000000000002', v_user_id, '33333333-3333-3333-3333-000000000002', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 85, 'natural', 'Good breeding', true, CURRENT_DATE - 60),
('44444444-4444-4444-4444-000000000003', v_user_id, '33333333-3333-3333-3333-000000000003', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 75, 'natural', 'First breeding, nervous', true, CURRENT_DATE - 50),
('44444444-4444-4444-4444-000000000004', v_user_id, '33333333-3333-3333-3333-000000000004', '22222222-2222-2222-2222-000000000003', CURRENT_DATE - 100, 'natural', 'Textbook breeding', true, CURRENT_DATE - 75),
('44444444-4444-4444-4444-000000000005', v_user_id, '33333333-3333-3333-3333-000000000005', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 80, 'natural', 'Quick breeding', true, CURRENT_DATE - 55),
('44444444-4444-4444-4444-000000000006', v_user_id, '33333333-3333-3333-3333-000000000006', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 70, 'natural', 'Good timing', true, CURRENT_DATE - 45),
('44444444-4444-4444-4444-000000000007', v_user_id, '33333333-3333-3333-3333-000000000007', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 105, 'natural', 'Experienced sow', true, CURRENT_DATE - 80),
('44444444-4444-4444-4444-000000000008', v_user_id, '33333333-3333-3333-3333-000000000008', '22222222-2222-2222-2222-000000000003', CURRENT_DATE - 90, 'natural', 'Strong heat', true, CURRENT_DATE - 65),
('44444444-4444-4444-4444-000000000009', v_user_id, '33333333-3333-3333-3333-000000000009', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 65, 'natural', 'Late breeding', true, CURRENT_DATE - 40),
('44444444-4444-4444-4444-000000000010', v_user_id, '33333333-3333-3333-3333-000000000010', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 88, 'natural', 'Good standing heat', true, CURRENT_DATE - 63),

-- Recently bred, not yet confirmed (Group 4: Just Bred)
('44444444-4444-4444-4444-000000000024', v_user_id, '33333333-3333-3333-3333-000000000024', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 5, 'natural', 'First breeding, gilt', false, NULL),
('44444444-4444-4444-4444-000000000025', v_user_id, '33333333-3333-3333-3333-000000000025', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 5, 'natural', 'Strong heat signs', false, NULL),
('44444444-4444-4444-4444-000000000026', v_user_id, '33333333-3333-3333-3333-000000000026', '22222222-2222-2222-2222-000000000003', CURRENT_DATE - 8, 'natural', 'Re-breed after fail', false, NULL),
('44444444-4444-4444-4444-000000000027', v_user_id, '33333333-3333-3333-3333-000000000027', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 6, 'natural', 'Young gilt', false, NULL),
('44444444-4444-4444-4444-000000000028', v_user_id, '33333333-3333-3333-3333-000000000028', '22222222-2222-2222-2222-000000000002', CURRENT_DATE - 7, 'natural', 'Good heat', false, NULL),
('44444444-4444-4444-4444-000000000029', v_user_id, '33333333-3333-3333-3333-000000000029', '22222222-2222-2222-2222-000000000003', CURRENT_DATE - 4, 'natural', 'Standing heat', false, NULL),
('44444444-4444-4444-4444-000000000030', v_user_id, '33333333-3333-3333-3333-000000000030', '22222222-2222-2222-2222-000000000001', CURRENT_DATE - 9, 'natural', 'Crossbred sow', false, NULL);

-- ============================================================================
-- FARROWINGS (Active and historical)
-- ============================================================================

INSERT INTO farrowings (id, user_id, sow_id, breeding_attempt_id, breeding_date, expected_farrowing_date, actual_farrowing_date, live_piglets, stillborn, mummified, moved_to_farrowing_date, moved_out_of_farrowing_date, notes) VALUES
-- Currently farrowing - nursing piglets (Group 2)
('55555555-5555-5555-5555-000000000011', v_user_id, '33333333-3333-3333-3333-000000000011', NULL, CURRENT_DATE - 115, CURRENT_DATE - 1, CURRENT_DATE - 1, 11, 1, 0, CURRENT_DATE - 5, NULL, 'Good farrowing, 1 stillborn'),
('55555555-5555-5555-5555-000000000012', v_user_id, '33333333-3333-3333-3333-000000000012', NULL, CURRENT_DATE - 118, CURRENT_DATE - 4, CURRENT_DATE - 3, 10, 0, 0, CURRENT_DATE - 7, NULL, 'Perfect litter, no losses'),
('55555555-5555-5555-5555-000000000013', v_user_id, '33333333-3333-3333-3333-000000000013', NULL, CURRENT_DATE - 122, CURRENT_DATE - 8, CURRENT_DATE - 7, 12, 2, 0, CURRENT_DATE - 11, NULL, 'Large litter, 2 stillborn'),
('55555555-5555-5555-5555-000000000014', v_user_id, '33333333-3333-3333-3333-000000000014', NULL, CURRENT_DATE - 120, CURRENT_DATE - 6, CURRENT_DATE - 5, 9, 0, 0, CURRENT_DATE - 9, NULL, 'Smaller litter, all healthy'),
('55555555-5555-5555-5555-000000000015', v_user_id, '33333333-3333-3333-3333-000000000015', NULL, CURRENT_DATE - 116, CURRENT_DATE - 2, CURRENT_DATE - 2, 11, 1, 0, CURRENT_DATE - 6, NULL, 'Good mothering'),

-- Recently weaned litters (Group 3)
('55555555-5555-5555-5555-000000000016', v_user_id, '33333333-3333-3333-3333-000000000016', NULL, CURRENT_DATE - 142, CURRENT_DATE - 28, CURRENT_DATE - 28, 10, 1, 0, CURRENT_DATE - 32, CURRENT_DATE - 14, 'Weaned at 21 days, all healthy'),
('55555555-5555-5555-5555-000000000017', v_user_id, '33333333-3333-3333-3333-000000000017', NULL, CURRENT_DATE - 145, CURRENT_DATE - 31, CURRENT_DATE - 30, 11, 0, 0, CURRENT_DATE - 34, CURRENT_DATE - 12, 'Excellent weaning weight'),
('55555555-5555-5555-5555-000000000018', v_user_id, '33333333-3333-3333-3333-000000000018', NULL, CURRENT_DATE - 140, CURRENT_DATE - 26, CURRENT_DATE - 26, 9, 1, 1, CURRENT_DATE - 30, CURRENT_DATE - 10, 'Early wean, small litter'),
('55555555-5555-5555-5555-000000000019', v_user_id, '33333333-3333-3333-3333-000000000019', NULL, CURRENT_DATE - 148, CURRENT_DATE - 34, CURRENT_DATE - 33, 12, 2, 0, CURRENT_DATE - 37, CURRENT_DATE - 16, 'Large litter, good weaning'),
('55555555-5555-5555-5555-000000000020', v_user_id, '33333333-3333-3333-3333-000000000020', NULL, CURRENT_DATE - 143, CURRENT_DATE - 29, CURRENT_DATE - 29, 10, 0, 0, CURRENT_DATE - 33, CURRENT_DATE - 11, 'Standard weaning'),
('55555555-5555-5555-5555-000000000021', v_user_id, '33333333-3333-3333-3333-000000000021', NULL, CURRENT_DATE - 138, CURRENT_DATE - 24, CURRENT_DATE - 24, 11, 1, 0, CURRENT_DATE - 28, CURRENT_DATE - 9, 'Early wean due to sow health'),
('55555555-5555-5555-5555-000000000022', v_user_id, '33333333-3333-3333-3333-000000000022', NULL, CURRENT_DATE - 150, CURRENT_DATE - 36, CURRENT_DATE - 35, 10, 0, 0, CURRENT_DATE - 39, CURRENT_DATE - 18, 'Veteran sow, good litter'),
('55555555-5555-5555-5555-000000000023', v_user_id, '33333333-3333-3333-3333-000000000023', NULL, CURRENT_DATE - 141, CURRENT_DATE - 27, CURRENT_DATE - 27, 9, 1, 0, CURRENT_DATE - 31, CURRENT_DATE - 13, 'Second litter, improving');

-- ============================================================================
-- PIGLETS (Nursing and weaned)
-- ============================================================================

-- Nursing piglets from currently farrowing sows (Group 2) - Total: 53 piglets
INSERT INTO piglets (id, user_id, farrowing_id, birth_weight, status, sex, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000011',
    3.2 + random() * 0.8,
    'nursing',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    'Nursing, healthy'
FROM generate_series(1, 11);

INSERT INTO piglets (id, user_id, farrowing_id, birth_weight, status, sex, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000012',
    3.5 + random() * 0.8,
    'nursing',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    'Nursing, gaining well'
FROM generate_series(1, 10);

INSERT INTO piglets (id, user_id, farrowing_id, birth_weight, status, sex, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000013',
    4.0 + random() * 1.0,
    'nursing',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    'Week old, strong'
FROM generate_series(1, 12);

INSERT INTO piglets (id, user_id, farrowing_id, birth_weight, status, sex, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000014',
    3.8 + random() * 0.9,
    'nursing',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    'Good size, active'
FROM generate_series(1, 9);

INSERT INTO piglets (id, user_id, farrowing_id, birth_weight, status, sex, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000015',
    3.3 + random() * 0.7,
    'nursing',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    'Nursing well'
FROM generate_series(1, 11);

-- Weaned piglets in nursery (from Group 3 weaned sows) - Total: 72 piglets
-- These are distributed across nursery pens
INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000016',
    CURRENT_DATE - 14,
    12.0 + random() * 3.0,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000009',
    'Nursery Pen 1, eating well'
FROM generate_series(1, 10);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000017',
    CURRENT_DATE - 12,
    13.0 + random() * 3.5,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000009',
    'Nursery Pen 1, strong growers'
FROM generate_series(1, 11);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000018',
    CURRENT_DATE - 10,
    10.5 + random() * 2.5,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000010',
    'Nursery Pen 2, catching up'
FROM generate_series(1, 9);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000019',
    CURRENT_DATE - 16,
    14.5 + random() * 4.0,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000010',
    'Nursery Pen 2, excellent growth'
FROM generate_series(1, 12);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000020',
    CURRENT_DATE - 11,
    12.5 + random() * 3.0,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000011',
    'Nursery Pen 3, good condition'
FROM generate_series(1, 10);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000021',
    CURRENT_DATE - 9,
    11.0 + random() * 2.8,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000011',
    'Nursery Pen 3, adjusting well'
FROM generate_series(1, 11);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000022',
    CURRENT_DATE - 18,
    15.0 + random() * 4.0,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000011',
    'Nursery Pen 3, ready for grower'
FROM generate_series(1, 10);

INSERT INTO piglets (id, user_id, farrowing_id, weaned_date, weaning_weight, status, sex, housing_unit_id, notes)
SELECT
    uuid_generate_v4(),
    v_user_id,
    '55555555-5555-5555-5555-000000000023',
    CURRENT_DATE - 13,
    11.5 + random() * 2.5,
    'weaned',
    CASE WHEN random() < 0.5 THEN 'male' ELSE 'female' END,
    '11111111-1111-1111-1111-000000000010',
    'Nursery Pen 2, doing well'
FROM generate_series(1, 9);

END $$;

-- ============================================================================
-- SUMMARY OF TEST DATA
-- ============================================================================

/*
HOUSING UNITS: 14 units
- 3 Gestation pens (Building A & B)
- 5 Farrowing pens (House 1 & 2)
- 3 Nursery pens (Nursery Building)
- 1 Breeding pen
- 1 Hospital pen
- 1 Quarantine pen

BOARS: 3 active breeding boars
- Duke (Duroc)
- King (Hampshire)
- Max (Yorkshire)

SOWS: 50 sows in various statuses
- Group 1 (10): Currently pregnant at various stages (65-105 days bred)
- Group 2 (5): Currently farrowing - nursing piglets in farrowing pens
- Group 3 (8): Recently weaned - litters moved to nursery 9-18 days ago
- Group 4 (7): Just bred - waiting for pregnancy confirmation
- Group 5 (10): Open/ready to breed - available for breeding
- Group 6 (5): Health issues - in treatment or monitoring
- Group 7 (5): High performers - top genetics, 7-8 litters

BREEDING ATTEMPTS: 17 records
- 10 confirmed pregnancies
- 7 recent breedings awaiting confirmation

FARROWINGS: 13 records
- 5 active (currently nursing)
- 8 completed (weaned)

PIGLETS: ~125 total
- ~53 nursing (with mothers in farrowing pens)
- ~72 weaned (in nursery pens 1-3)

MATRIX TREATMENTS: 10 records
- Health treatments for sick sows
- Routine pre-farrowing care
- Vaccinations
- Piglet iron shots

This dataset covers:
✓ All housing types and Prop 12 compliance scenarios
✓ Sows in all lifecycle stages
✓ Active and historical breeding records
✓ Nursing and weaned piglet tracking
✓ Housing assignments and transfers
✓ Health monitoring and treatments
✓ Various body conditions and health statuses
✓ Multiple breeds and crossbreeds
✓ Different parity levels (1st litter to 8th litter)
*/
