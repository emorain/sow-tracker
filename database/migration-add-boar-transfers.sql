-- Migration: Add Boar Transfer System
-- Enables secure transfer of boars between users (parallel to sow transfer system)

-- ========================================
-- 1. ADD TRANSFER TRACKING FIELDS TO BOARS
-- ========================================

ALTER TABLE boars
ADD COLUMN IF NOT EXISTS original_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transferred_from_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN boars.original_user_id IS 'The original owner of this boar (never changes)';
COMMENT ON COLUMN boars.transferred_from_user_id IS 'The most recent previous owner';
COMMENT ON COLUMN boars.transferred_at IS 'When this boar was last transferred';

-- Backfill existing boars with original_user_id
UPDATE boars
SET original_user_id = user_id
WHERE original_user_id IS NULL;

-- ========================================
-- 2. CREATE BOAR TRANSFER REQUESTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS boar_transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    boar_id UUID NOT NULL REFERENCES boars(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES auth.users(id),
    to_user_email VARCHAR(255) NOT NULL,
    to_user_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Ensure only one active request per boar
    CONSTRAINT unique_active_boar_request UNIQUE (boar_id, status)
        DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE boar_transfer_requests IS 'Transfer requests for boars between users';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_from_user ON boar_transfer_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_to_user ON boar_transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_status ON boar_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_boar_transfer_requests_boar ON boar_transfer_requests(boar_id);

-- ========================================
-- 3. RLS POLICIES FOR BOAR TRANSFER REQUESTS
-- ========================================

ALTER TABLE boar_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Sender can view their sent requests
CREATE POLICY "Users can view their sent boar transfer requests"
    ON boar_transfer_requests FOR SELECT
    USING (auth.uid() = from_user_id);

-- Recipient can view requests sent to them
CREATE POLICY "Users can view boar transfer requests sent to them"
    ON boar_transfer_requests FOR SELECT
    USING (auth.uid() = to_user_id OR to_user_email = auth.email());

-- Sender can create transfer requests for their boars
CREATE POLICY "Users can create boar transfer requests for their boars"
    ON boar_transfer_requests FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id AND
        EXISTS (
            SELECT 1 FROM boars
            WHERE boars.id = boar_id
            AND boars.user_id = auth.uid()
        )
    );

-- Sender can cancel their pending requests
CREATE POLICY "Users can cancel their pending boar requests"
    ON boar_transfer_requests FOR UPDATE
    USING (auth.uid() = from_user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Recipient can accept/decline requests
CREATE POLICY "Recipient can respond to boar requests"
    ON boar_transfer_requests FOR UPDATE
    USING (
        (auth.uid() = to_user_id OR to_user_email = auth.email()) AND
        status = 'pending'
    )
    WITH CHECK (status IN ('accepted', 'declined'));

-- ========================================
-- 4. BOAR TRANSFER EXECUTION FUNCTION
-- ========================================

CREATE OR REPLACE FUNCTION execute_boar_transfer(
    p_request_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS
AS $$
DECLARE
    v_request boar_transfer_requests%ROWTYPE;
    v_boar_id UUID;
    v_from_user UUID;
    v_to_user UUID;
    v_transfer_count INT := 0;
BEGIN
    -- Get and validate the request
    SELECT * INTO v_request
    FROM boar_transfer_requests
    WHERE id = p_request_id;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Boar transfer request not found';
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

    -- 2. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE boar_id = v_boar_id AND user_id = v_to_user);

    -- 3. Transfer HEALTH RECORDS (if boar_id column exists)
    UPDATE health_records
    SET user_id = v_to_user
    WHERE boar_id = v_boar_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE boar_id = v_boar_id AND user_id = v_to_user);

    -- 4. DO NOT TRANSFER:
    -- - Farrowings where this boar was the sire (breeding records stay with sow owner)
    -- - Piglets sired by this boar (offspring stay with their owner)
    -- The new owner will still see breeding performance if they query by boar

    RETURN jsonb_build_object(
        'success', true,
        'boar_id', v_boar_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'message', format('Successfully transferred boar and %s related records', v_transfer_count)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION execute_boar_transfer IS 'Transfers a boar and related health records to a new owner. Does not transfer offspring or breeding records.';

-- ========================================
-- 5. HELPER FUNCTION: Match email to user
-- ========================================

CREATE OR REPLACE FUNCTION match_boar_transfer_request_to_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Try to find user by email
    SELECT id INTO NEW.to_user_id
    FROM auth.users
    WHERE email = NEW.to_user_email
    LIMIT 1;

    RETURN NEW;
END;
$$;

-- Trigger to automatically match email to user_id
DROP TRIGGER IF EXISTS trigger_match_boar_transfer_email ON boar_transfer_requests;
CREATE TRIGGER trigger_match_boar_transfer_email
    BEFORE INSERT ON boar_transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION match_boar_transfer_request_to_user();

-- ========================================
-- 6. UNIFIED TRANSFER REQUESTS VIEW
-- ========================================

-- Drop old view and recreate with both sows and boars
DROP VIEW IF EXISTS my_transfer_requests;

CREATE OR REPLACE VIEW my_transfer_requests AS
-- Sow transfers sent
SELECT
    tr.id,
    'sow' as animal_type,
    tr.sow_id as animal_id,
    NULL::UUID as boar_id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag as animal_ear_tag,
    s.name as animal_name,
    s.breed as animal_breed,
    'sent' as request_type
FROM sow_transfer_requests tr
JOIN sows s ON tr.sow_id = s.id
WHERE tr.from_user_id = auth.uid()

UNION ALL

-- Sow transfers received
SELECT
    tr.id,
    'sow' as animal_type,
    tr.sow_id as animal_id,
    NULL::UUID as boar_id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag as animal_ear_tag,
    s.name as animal_name,
    s.breed as animal_breed,
    'received' as request_type
FROM sow_transfer_requests tr
JOIN sows s ON tr.sow_id = s.id
WHERE tr.to_user_id = auth.uid() OR tr.to_user_email = auth.email()

UNION ALL

-- Boar transfers sent
SELECT
    tr.id,
    'boar' as animal_type,
    tr.boar_id as animal_id,
    tr.boar_id,
    NULL::UUID as sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    b.ear_tag as animal_ear_tag,
    b.name as animal_name,
    b.breed as animal_breed,
    'sent' as request_type
FROM boar_transfer_requests tr
JOIN boars b ON tr.boar_id = b.id
WHERE tr.from_user_id = auth.uid()

UNION ALL

-- Boar transfers received
SELECT
    tr.id,
    'boar' as animal_type,
    tr.boar_id as animal_id,
    tr.boar_id,
    NULL::UUID as sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    b.ear_tag as animal_ear_tag,
    b.name as animal_name,
    b.breed as animal_breed,
    'received' as request_type
FROM boar_transfer_requests tr
JOIN boars b ON tr.boar_id = b.id
WHERE tr.to_user_id = auth.uid() OR tr.to_user_email = auth.email();

COMMENT ON VIEW my_transfer_requests IS 'Unified view of all transfer requests (sows and boars) for current user';
