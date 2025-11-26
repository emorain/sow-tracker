-- Migration: Update transfer execution functions to support retain_records
-- When retain_records is true, creates a copy marked as 'sold' for the sender

-- ========================================
-- 1. UPDATE SOW TRANSFER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION execute_sow_transfer(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS
AS $$
DECLARE
    v_request sow_transfer_requests%ROWTYPE;
    v_sow_id UUID;
    v_from_user UUID;
    v_to_user UUID;
    v_transfer_count INT := 0;
    v_sold_copy_id UUID;
BEGIN
    -- Get and validate the request
    SELECT * INTO v_request
    FROM sow_transfer_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer request not found';
    END IF;

    IF v_request.status != 'accepted' THEN
        RAISE EXCEPTION 'Transfer request must be accepted before execution';
    END IF;

    v_sow_id := v_request.sow_id;
    v_from_user := v_request.from_user_id;
    v_to_user := v_request.to_user_id;

    -- Verify the sow still belongs to sender
    IF NOT EXISTS (
        SELECT 1 FROM sows WHERE id = v_sow_id AND user_id = v_from_user
    ) THEN
        RAISE EXCEPTION 'Sow no longer belongs to sender';
    END IF;

    -- ========================================
    -- CREATE SOLD COPY IF RETAIN_RECORDS IS TRUE
    -- ========================================

    IF v_request.retain_records THEN
        -- Create a copy of the sow marked as 'sold'
        INSERT INTO sows (
            user_id, ear_tag, name, breed, date_of_birth, purchase_date,
            purchase_price, source, genetics_info, notes, status,
            sire_id, dam_id, registration_number
        )
        SELECT
            user_id,
            ear_tag || ' (Sold)', -- Mark the sold copy
            name,
            breed,
            date_of_birth,
            purchase_date,
            purchase_price,
            source,
            genetics_info,
            COALESCE(notes, '') || E'\n\nSOLD to ' || v_request.to_user_email || ' on ' || NOW()::date,
            'sold', -- Mark as sold
            sire_id,
            dam_id,
            registration_number
        FROM sows
        WHERE id = v_sow_id
        RETURNING id INTO v_sold_copy_id;

        -- Copy breeding attempts
        INSERT INTO breeding_attempts (
            user_id, sow_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        )
        SELECT
            user_id, v_sold_copy_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        FROM breeding_attempts
        WHERE sow_id = v_sow_id;

        -- Copy farrowings
        INSERT INTO farrowings (
            user_id, sow_id, breeding_date, expected_farrowing_date,
            actual_farrowing_date, born_alive, born_dead, mummified,
            weaned_count, weaned_date, breeding_method, boar_id,
            breeding_attempt_id, notes
        )
        SELECT
            user_id, v_sold_copy_id, breeding_date, expected_farrowing_date,
            actual_farrowing_date, born_alive, born_dead, mummified,
            weaned_count, weaned_date, breeding_method, boar_id,
            NULL, -- Don't link to breeding attempt (it's a copy)
            notes
        FROM farrowings
        WHERE sow_id = v_sow_id;

        -- Copy health records
        INSERT INTO health_records (
            user_id, sow_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        )
        SELECT
            user_id, v_sold_copy_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        FROM health_records
        WHERE sow_id = v_sow_id;

        -- Copy vaccinations
        INSERT INTO vaccinations (
            user_id, sow_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        )
        SELECT
            user_id, v_sold_copy_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        FROM vaccinations
        WHERE sow_id = v_sow_id;

        -- Note: Don't copy scheduled_tasks or matrix_treatments for sold animals
        -- These are active/future records that shouldn't apply to sold copies

    END IF;

    -- ========================================
    -- TRANSFER ALL RELATED RECORDS
    -- ========================================

    -- 1. Transfer SOW
    UPDATE sows
    SET
        user_id = v_to_user,
        transferred_from_user_id = v_from_user,
        transferred_at = NOW()
    WHERE id = v_sow_id;

    v_transfer_count := v_transfer_count + 1;

    -- 2. Transfer BREEDING ATTEMPTS
    UPDATE breeding_attempts
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM breeding_attempts WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 3. Transfer FARROWINGS (breeding/farrowing records)
    UPDATE farrowings
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM farrowings WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 4. DO NOT TRANSFER PIGLETS
    -- Piglets are separate animals and may have been sold/transferred independently

    -- 5. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 6. Transfer HEALTH RECORDS
    UPDATE health_records
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 7. Transfer SCHEDULED TASKS
    UPDATE scheduled_tasks
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM scheduled_tasks WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 8. Transfer MATRIX TREATMENTS
    UPDATE matrix_treatments
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM matrix_treatments WHERE sow_id = v_sow_id AND user_id = v_to_user);

    RETURN jsonb_build_object(
        'success', true,
        'sow_id', v_sow_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'sold_copy_created', v_request.retain_records,
        'sold_copy_id', v_sold_copy_id,
        'message', format('Successfully transferred sow and %s related records%s',
            v_transfer_count,
            CASE WHEN v_request.retain_records THEN ' (sold copy retained)' ELSE '' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION execute_sow_transfer IS 'Transfers a sow and ALL related records to a new owner. Optionally creates a sold copy for the sender.';

-- ========================================
-- 2. UPDATE BOAR TRANSFER FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION execute_boar_transfer(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_request boar_transfer_requests%ROWTYPE;
    v_boar_id UUID;
    v_from_user UUID;
    v_to_user UUID;
    v_transfer_count INT := 0;
    v_sold_copy_id UUID;
BEGIN
    -- Get and validate the request
    SELECT * INTO v_request
    FROM boar_transfer_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Transfer request not found';
    END IF;

    IF v_request.status != 'accepted' THEN
        RAISE EXCEPTION 'Transfer request must be accepted before execution';
    END IF;

    v_boar_id := v_request.boar_id;
    v_from_user := v_request.from_user_id;
    v_to_user := v_request.to_user_id;

    -- Verify the boar still belongs to sender
    IF NOT EXISTS (
        SELECT 1 FROM boars WHERE id = v_boar_id AND user_id = v_from_user
    ) THEN
        RAISE EXCEPTION 'Boar no longer belongs to sender';
    END IF;

    -- ========================================
    -- CREATE SOLD COPY IF RETAIN_RECORDS IS TRUE
    -- ========================================

    IF v_request.retain_records THEN
        -- Create a copy of the boar marked as 'sold'
        INSERT INTO boars (
            user_id, ear_tag, name, breed, date_of_birth, purchase_date,
            purchase_price, source, genetics_info, notes, status,
            sire_id, dam_id, registration_number
        )
        SELECT
            user_id,
            ear_tag || ' (Sold)', -- Mark the sold copy
            name,
            breed,
            date_of_birth,
            purchase_date,
            purchase_price,
            source,
            genetics_info,
            COALESCE(notes, '') || E'\n\nSOLD to ' || v_request.to_user_email || ' on ' || NOW()::date,
            'sold', -- Mark as sold
            sire_id,
            dam_id,
            registration_number
        FROM boars
        WHERE id = v_boar_id
        RETURNING id INTO v_sold_copy_id;

        -- Copy breeding attempts (where this boar was used)
        INSERT INTO breeding_attempts (
            user_id, sow_id, breeding_date, breeding_method, boar_id,
            boar_description, pregnancy_check_date, pregnancy_confirmed,
            result, farrowing_id, notes
        )
        SELECT
            v_from_user, -- Keep under original owner
            sow_id,
            breeding_date,
            breeding_method,
            v_sold_copy_id, -- Reference the sold copy
            boar_description,
            pregnancy_check_date,
            pregnancy_confirmed,
            result,
            farrowing_id,
            notes
        FROM breeding_attempts
        WHERE boar_id = v_boar_id AND user_id = v_from_user;

        -- Copy health records
        INSERT INTO health_records (
            user_id, boar_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        )
        SELECT
            user_id, v_sold_copy_id, record_date, record_type, diagnosis,
            treatment, veterinarian, cost, notes
        FROM health_records
        WHERE boar_id = v_boar_id;

        -- Copy vaccinations
        INSERT INTO vaccinations (
            user_id, boar_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        )
        SELECT
            user_id, v_sold_copy_id, vaccination_date, vaccine_name,
            vaccine_type, batch_number, veterinarian, notes
        FROM vaccinations
        WHERE boar_id = v_boar_id;

    END IF;

    -- ========================================
    -- TRANSFER ALL RELATED RECORDS
    -- ========================================

    -- 1. Transfer BOAR
    UPDATE boars
    SET
        user_id = v_to_user,
        transferred_from_user_id = v_from_user,
        transferred_at = NOW()
    WHERE id = v_boar_id;

    v_transfer_count := v_transfer_count + 1;

    -- 2. Transfer BREEDING ATTEMPTS (where this boar was used)
    -- Note: Only transfer breeding records where the user owns BOTH the boar AND the sow
    UPDATE breeding_attempts
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id
      AND user_id = v_from_user
      AND sow_id IN (SELECT id FROM sows WHERE user_id = v_to_user);

    v_transfer_count := v_transfer_count + (
        SELECT COUNT(*) FROM breeding_attempts
        WHERE boar_id = v_boar_id AND user_id = v_to_user
    );

    -- 3. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE boar_id = v_boar_id AND user_id = v_to_user);

    -- 4. Transfer HEALTH RECORDS
    UPDATE health_records
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE boar_id = v_boar_id AND user_id = v_to_user);

    RETURN jsonb_build_object(
        'success', true,
        'boar_id', v_boar_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'sold_copy_created', v_request.retain_records,
        'sold_copy_id', v_sold_copy_id,
        'message', format('Successfully transferred boar and %s related records%s',
            v_transfer_count,
            CASE WHEN v_request.retain_records THEN ' (sold copy retained)' ELSE '' END
        )
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION execute_boar_transfer IS 'Transfers a boar and ALL related records to a new owner. Optionally creates a sold copy for the sender.';
