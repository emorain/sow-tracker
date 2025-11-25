-- Sample Data: Complete Pedigree Testing Dataset
-- This creates a multi-generation dataset with full lineage tracking
-- Includes foundation animals, breeding records, and weaned piglets with pedigrees

-- IMPORTANT: Run migration-add-piglet-pedigree.sql BEFORE running this script

-- Get the current user_id (you'll need to replace this with your actual user_id)
-- To find your user_id, run: SELECT id, email FROM auth.users;

-- For this example, we'll use a variable. Replace 'YOUR_USER_ID_HERE' with actual UUID
DO $$
DECLARE
    v_user_id UUID;

    -- Foundation Boars (Generation 0 - no known parents)
    v_boar_duke UUID;
    v_boar_maximus UUID;
    v_boar_chief UUID;

    -- Foundation Sows (Generation 0 - no known parents)
    v_sow_betsy UUID;
    v_sow_molly UUID;
    v_sow_daisy UUID;

    -- Second Generation Boars (Gen 1 - known parents)
    v_boar_prince UUID;
    v_boar_rex UUID;

    -- Second Generation Sows (Gen 1 - known parents)
    v_sow_princess UUID;
    v_sow_belle UUID;
    v_sow_luna UUID;

    -- Third Generation Sows (Gen 2 - known grandparents)
    v_sow_starlight UUID;

    -- Farrowing records
    v_farrowing_1 UUID;
    v_farrowing_2 UUID;
    v_farrowing_3 UUID;
    v_farrowing_4 UUID;
BEGIN
    -- Get the first user in the system (or replace with specific user_id)
    SELECT id INTO v_user_id FROM auth.users ORDER BY created_at LIMIT 1;

    IF v_user_id IS NULL THEN
        RAISE NOTICE 'No user found. Please run this script after authentication is set up.';
        RETURN;
    END IF;

    RAISE NOTICE 'Using user_id: %', v_user_id;

    -- ========================================
    -- CLEANUP: Remove existing test data
    -- ========================================
    RAISE NOTICE 'Cleaning up existing test data...';

    -- Delete piglets from test litters (cascades will handle relationships)
    DELETE FROM piglets
    WHERE user_id = v_user_id
      AND ear_tag IN ('P-301', 'P-302', 'P-303', 'P-304', 'P-305', 'P-306', 'P-307', 'P-308',
                      'P-401', 'P-402', 'P-403', 'P-404', 'P-405', 'P-406', 'P-407');

    -- Delete test farrowings
    DELETE FROM farrowings
    WHERE user_id = v_user_id
      AND sow_id IN (
        SELECT id FROM sows
        WHERE user_id = v_user_id
          AND ear_tag IN ('S-001', 'S-002', 'S-003', 'S-101', 'S-102', 'S-103', 'S-201')
      );

    -- Delete test sows
    DELETE FROM sows
    WHERE user_id = v_user_id
      AND ear_tag IN ('S-001', 'S-002', 'S-003', 'S-101', 'S-102', 'S-103', 'S-201');

    -- Delete test boars
    DELETE FROM boars
    WHERE user_id = v_user_id
      AND ear_tag IN ('B-001', 'B-002', 'B-003', 'B-101', 'B-102');

    RAISE NOTICE 'Cleanup complete. Creating new test data...';

    -- ========================================
    -- GENERATION 0: FOUNDATION ANIMALS
    -- ========================================

    -- Foundation Boars (Champion bloodlines, no recorded parents)
    INSERT INTO boars (user_id, ear_tag, name, birth_date, breed, status, boar_type, registration_number, notes)
    VALUES
        (v_user_id, 'B-001', 'Grand Champion Duke', '2020-03-15', 'Yorkshire', 'active', 'live', 'YS-2020-12345',
         'National Grand Champion 2022. Excellent muscle definition and structural correctness. Known for producing high-quality show pigs.')
    RETURNING id INTO v_boar_duke;

    INSERT INTO boars (user_id, ear_tag, name, birth_date, breed, status, boar_type, registration_number, notes)
    VALUES
        (v_user_id, 'B-002', 'Maximus Gold', '2019-11-08', 'Duroc', 'active', 'live', 'DR-2019-67890',
         'Reserve Grand Champion 2021. Superior carcass traits and excellent temperament.')
    RETURNING id INTO v_boar_maximus;

    INSERT INTO boars (user_id, ear_tag, name, birth_date, breed, status, boar_type, registration_number, notes)
    VALUES
        (v_user_id, 'B-003', 'Chief Commander', '2020-06-20', 'Hampshire', 'active', 'live', 'HP-2020-11111',
         'State Fair Champion 2022. Outstanding muscle and leanness.')
    RETURNING id INTO v_boar_chief;

    -- Foundation Sows (No recorded parents)
    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, registration_number, notes)
    VALUES
        (v_user_id, 'S-001', 'Lady Betsy', '2020-04-10', 'Yorkshire', 'active', 'YS-2020-54321',
         'Excellent mother with consistent large litters. Great maternal instincts.')
    RETURNING id INTO v_sow_betsy;

    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, registration_number, notes)
    VALUES
        (v_user_id, 'S-002', 'Sweet Molly', '2020-05-15', 'Duroc', 'active', 'DR-2020-98765',
         'Reserve Champion gilt 2021. Produces high-quality market hogs.')
    RETURNING id INTO v_sow_molly;

    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, registration_number, notes)
    VALUES
        (v_user_id, 'S-003', 'Miss Daisy', '2020-07-22', 'Hampshire', 'active', 'HP-2020-22222',
         'County Fair Grand Champion 2021. Excellent conformation.')
    RETURNING id INTO v_sow_daisy;

    RAISE NOTICE 'Foundation animals created (Generation 0)';

    -- ========================================
    -- GENERATION 1: OFFSPRING OF FOUNDATION
    -- ========================================

    -- Second Generation Boars (have pedigree)
    -- Prince = son of Duke (B-001) and Betsy (S-001)
    INSERT INTO boars (user_id, ear_tag, name, birth_date, breed, status, boar_type, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'B-101', 'Prince Royal', '2021-08-15', 'Yorkshire', 'active', 'live',
         v_boar_duke, v_sow_betsy, 'YS-2021-33333',
         'Son of Grand Champion Duke. Excellent genetics, shown at state level.')
    RETURNING id INTO v_boar_prince;

    -- Rex = son of Maximus (B-002) and Molly (S-002)
    INSERT INTO boars (user_id, ear_tag, name, birth_date, breed, status, boar_type, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'B-102', 'King Rex', '2021-09-20', 'Duroc', 'active', 'live',
         v_boar_maximus, v_sow_molly, 'DR-2021-44444',
         'Son of Maximus Gold. Great muscle and carcass traits.')
    RETURNING id INTO v_boar_rex;

    -- Second Generation Sows (have pedigree)
    -- Princess = daughter of Duke (B-001) and Betsy (S-001) [full sister to Prince]
    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'S-101', 'Princess Belle', '2021-08-15', 'Yorkshire', 'active',
         v_boar_duke, v_sow_betsy, 'YS-2021-55555',
         'Daughter of Grand Champion Duke. Full sister to Prince Royal.')
    RETURNING id INTO v_sow_princess;

    -- Belle = daughter of Chief (B-003) and Daisy (S-003)
    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'S-102', 'Beautiful Belle', '2021-10-05', 'Hampshire', 'active',
         v_boar_chief, v_sow_daisy, 'HP-2021-66666',
         'Daughter of Chief Commander. Excellent show potential.')
    RETURNING id INTO v_sow_belle;

    -- Luna = daughter of Maximus (B-002) and Molly (S-002) [full sister to Rex]
    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'S-103', 'Luna Star', '2021-09-20', 'Duroc', 'active',
         v_boar_maximus, v_sow_molly, 'DR-2021-77777',
         'Full sister to King Rex. Great maternal traits.')
    RETURNING id INTO v_sow_luna;

    RAISE NOTICE 'Second generation animals created (Generation 1)';

    -- ========================================
    -- GENERATION 2: THIRD GENERATION SOW
    -- ========================================

    -- Starlight = daughter of Prince (B-101) and Princess (S-101)
    -- This gives us a 3-generation pedigree!
    INSERT INTO sows (user_id, ear_tag, name, birth_date, breed, status, sire_id, dam_id, registration_number, notes)
    VALUES
        (v_user_id, 'S-201', 'Starlight Dreams', '2023-03-10', 'Yorkshire', 'active',
         v_boar_prince, v_sow_princess, 'YS-2023-88888',
         'Third generation Yorkshire. Granddaughter of Grand Champion Duke on both sides.')
    RETURNING id INTO v_sow_starlight;

    RAISE NOTICE 'Third generation animals created (Generation 2)';

    -- ========================================
    -- BREEDING AND FARROWING RECORDS
    -- ========================================

    -- Farrowing 1: Princess (S-101) bred to Rex (B-102)
    -- Breeding date: 90 days ago, Farrowed: 24 days ago (weaning age)
    INSERT INTO farrowings (
        user_id, sow_id, boar_id, breeding_method, breeding_date,
        expected_farrowing_date, actual_farrowing_date,
        live_piglets, stillborn, mummified, notes
    ) VALUES (
        v_user_id, v_sow_princess, v_boar_rex, 'natural',
        CURRENT_DATE - INTERVAL '114 days',
        CURRENT_DATE - INTERVAL '24 days',
        CURRENT_DATE - INTERVAL '24 days',
        10, 1, 0,
        'Excellent litter from Princess Belle × King Rex cross. Strong piglets with good vigor.'
    ) RETURNING id INTO v_farrowing_1;

    -- Farrowing 2: Luna (S-103) bred to Duke (B-001)
    -- Breeding date: 90 days ago, Farrowed: 21 days ago (weaning age)
    INSERT INTO farrowings (
        user_id, sow_id, boar_id, breeding_method, breeding_date,
        expected_farrowing_date, actual_farrowing_date,
        live_piglets, stillborn, mummified, notes
    ) VALUES (
        v_user_id, v_sow_luna, v_boar_duke, 'natural',
        CURRENT_DATE - INTERVAL '111 days',
        CURRENT_DATE - INTERVAL '21 days',
        CURRENT_DATE - INTERVAL '21 days',
        9, 0, 1,
        'Luna Star × Grand Champion Duke. Consistent litter size with excellent growth.'
    ) RETURNING id INTO v_farrowing_2;

    -- Farrowing 3: Belle (S-102) bred to Prince (B-101)
    -- Breeding date: 85 days ago, Farrowed: 28 days ago (already weaned)
    INSERT INTO farrowings (
        user_id, sow_id, boar_id, breeding_method, breeding_date,
        expected_farrowing_date, actual_farrowing_date,
        live_piglets, stillborn, mummified, moved_out_of_farrowing_date, notes
    ) VALUES (
        v_user_id, v_sow_belle, v_boar_prince, 'natural',
        CURRENT_DATE - INTERVAL '142 days',
        CURRENT_DATE - INTERVAL '28 days',
        CURRENT_DATE - INTERVAL '28 days',
        8, 0, 0,
        CURRENT_DATE - INTERVAL '7 days',
        'Beautiful Belle × Prince Royal. Hampshire/Yorkshire cross. Excellent show prospects.'
    ) RETURNING id INTO v_farrowing_3;

    -- Farrowing 4: Starlight (S-201) bred to Maximus (B-002) - First litter
    -- Breeding date: 80 days ago, Farrowed: 35 days ago (already weaned)
    INSERT INTO farrowings (
        user_id, sow_id, boar_id, breeding_method, breeding_date,
        expected_farrowing_date, actual_farrowing_date,
        live_piglets, stillborn, mummified, moved_out_of_farrowing_date, notes
    ) VALUES (
        v_user_id, v_sow_starlight, v_boar_maximus, 'natural',
        CURRENT_DATE - INTERVAL '149 days',
        CURRENT_DATE - INTERVAL '35 days',
        CURRENT_DATE - INTERVAL '35 days',
        7, 1, 0,
        CURRENT_DATE - INTERVAL '14 days',
        'Starlight Dreams × Maximus Gold. First litter - smaller but high quality. Great show pig potential!'
    ) RETURNING id INTO v_farrowing_4;

    RAISE NOTICE 'Farrowing records created';

    -- ========================================
    -- WEANED PIGLETS WITH COMPLETE PEDIGREES
    -- ========================================

    -- Litter 1: From Princess × Rex (farrowing_3, already weaned)
    -- These piglets will have: Sire=Prince, Dam=Belle, and 2 generations of known grandparents
    INSERT INTO piglets (
        user_id, farrowing_id, name, ear_tag, sex, birth_weight, weaning_weight,
        status, weaned_date, notes
    ) VALUES
        (v_user_id, v_farrowing_3, 'Belle''s Royal Commander', 'P-301', 'male', 1.4, 7.2, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Top show prospect. Excellent muscle and structure.'),
        (v_user_id, v_farrowing_3, 'Princess Royal Dream', 'P-302', 'female', 1.5, 7.5, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Beautiful gilt. Great conformation and movement.'),
        (v_user_id, v_farrowing_3, NULL, 'P-303', 'male', 1.3, 6.8, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Good growth rate. Potential breeding boar.'),
        (v_user_id, v_farrowing_3, 'Belle''s Golden Lady', 'P-304', 'female', 1.6, 7.8, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Heaviest in litter. Excellent frame and depth.'),
        (v_user_id, v_farrowing_3, NULL, 'P-305', 'male', 1.4, 7.0, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Good overall. Market hog potential.'),
        (v_user_id, v_farrowing_3, NULL, 'P-306', 'female', 1.5, 7.4, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Strong gilt. Good maternal lines.'),
        (v_user_id, v_farrowing_3, NULL, 'P-307', 'male', 1.2, 6.5, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Smaller but catching up. Good genetics.'),
        (v_user_id, v_farrowing_3, NULL, 'P-308', 'female', 1.5, 7.3, 'weaned', CURRENT_DATE - INTERVAL '7 days',
         'Very nice gilt. Could be shown.');

    -- Litter 2: From Starlight × Maximus (farrowing_4, already weaned)
    -- These piglets have 3 GENERATIONS on dam side (Starlight's grandparents are known)!
    INSERT INTO piglets (
        user_id, farrowing_id, name, ear_tag, sex, birth_weight, weaning_weight,
        registration_number, registration_association, status, weaned_date, notes
    ) VALUES
        (v_user_id, v_farrowing_4, 'Starlight''s Golden Boy', 'P-401', 'male', 1.6, 8.2, 'YS-2024-99999', 'National Swine Registry',
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'REGISTERED! Top pick of litter. County fair champion prospect. Exceptional muscle and balance.'),
        (v_user_id, v_farrowing_4, 'Maximus Dream Girl', 'P-402', 'female', 1.7, 8.5, 'YS-2024-99998', 'National Swine Registry',
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'REGISTERED! Outstanding gilt. State fair potential. Perfect show pig type.'),
        (v_user_id, v_farrowing_4, 'Duke''s Legacy', 'P-403', 'male', 1.5, 7.9, NULL, NULL,
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'Excellent boar pig. Not registered yet but great quality.'),
        (v_user_id, v_farrowing_4, 'Starlight Princess', 'P-404', 'female', 1.6, 8.1, NULL, NULL,
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'Beautiful gilt. Breeding or show prospect.'),
        (v_user_id, v_farrowing_4, NULL, 'P-405', 'male', 1.4, 7.6, NULL, NULL,
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'Good market weight. Strong genetics.'),
        (v_user_id, v_farrowing_4, NULL, 'P-406', 'female', 1.5, 7.8, NULL, NULL,
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'Nice gilt. Could be shown at county level.'),
        (v_user_id, v_farrowing_4, NULL, 'P-407', 'male', 1.3, 7.3, NULL, NULL,
         'weaned', CURRENT_DATE - INTERVAL '14 days',
         'Good overall. Solid genetics from Starlight Dreams line.');

    RAISE NOTICE 'Weaned piglets created with pedigrees';

    -- ========================================
    -- SUMMARY REPORT
    -- ========================================

    RAISE NOTICE '========================================';
    RAISE NOTICE 'SAMPLE DATA CREATION COMPLETE!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Created:';
    RAISE NOTICE '  - 3 Foundation Boars (Generation 0)';
    RAISE NOTICE '  - 3 Foundation Sows (Generation 0)';
    RAISE NOTICE '  - 2 Second-Gen Boars (Generation 1)';
    RAISE NOTICE '  - 3 Second-Gen Sows (Generation 1)';
    RAISE NOTICE '  - 1 Third-Gen Sow (Generation 2 - Starlight)';
    RAISE NOTICE '  - 4 Farrowing records with breeding info';
    RAISE NOTICE '  - 15 Weaned piglets with FULL PEDIGREES';
    RAISE NOTICE '';
    RAISE NOTICE 'KEY PIGLETS TO TEST:';
    RAISE NOTICE '  - P-401 & P-402: REGISTERED show pigs with 3-generation pedigree!';
    RAISE NOTICE '    (Sire: Maximus Gold, Dam: Starlight Dreams)';
    RAISE NOTICE '    (Maternal Grandsire: Prince Royal, Maternal Granddam: Princess Belle)';
    RAISE NOTICE '    (Great-grandsire Duke appears on BOTH maternal grandparent lines!)';
    RAISE NOTICE '';
    RAISE NOTICE '  - P-301 to P-308: Hampshire/Yorkshire cross piglets';
    RAISE NOTICE '    (Sire: Prince Royal, Dam: Beautiful Belle)';
    RAISE NOTICE '';
    RAISE NOTICE 'Navigate to /piglets/weaned and click the document icon';
    RAISE NOTICE 'to view pedigree certificates!';
    RAISE NOTICE '========================================';

END $$;
