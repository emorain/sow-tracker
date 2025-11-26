-- Migration: Add Sow Transfer System
-- Enables secure transfer of sows between users while maintaining RLS and audit trails

-- ========================================
-- 1. ADD TRANSFER TRACKING FIELDS
-- ========================================

-- Add transfer history to sows
ALTER TABLE sows
ADD COLUMN IF NOT EXISTS original_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transferred_from_user_id UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN sows.original_user_id IS 'The original owner of this sow (never changes)';
COMMENT ON COLUMN sows.transferred_from_user_id IS 'The most recent previous owner';
COMMENT ON COLUMN sows.transferred_at IS 'When this sow was last transferred';

-- Backfill existing sows with original_user_id
UPDATE sows
SET original_user_id = user_id
WHERE original_user_id IS NULL;

-- ========================================
-- 2. CREATE TRANSFER REQUESTS TABLE
-- ========================================

CREATE TABLE IF NOT EXISTS sow_transfer_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    sow_id UUID NOT NULL REFERENCES sows(id) ON DELETE CASCADE,
    from_user_id UUID NOT NULL REFERENCES auth.users(id),
    to_user_email VARCHAR(255) NOT NULL,
    to_user_id UUID REFERENCES auth.users(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'cancelled')),
    message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,

    -- Ensure only one active request per sow
    CONSTRAINT unique_active_request UNIQUE (sow_id, status)
        DEFERRABLE INITIALLY DEFERRED
);

COMMENT ON TABLE sow_transfer_requests IS 'Transfer requests for sows between users';
COMMENT ON COLUMN sow_transfer_requests.to_user_email IS 'Email of recipient (may not be registered yet)';
COMMENT ON COLUMN sow_transfer_requests.to_user_id IS 'Filled in when email is matched to user';

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_transfer_requests_from_user ON sow_transfer_requests(from_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_to_user ON sow_transfer_requests(to_user_id);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_status ON sow_transfer_requests(status);
CREATE INDEX IF NOT EXISTS idx_transfer_requests_sow ON sow_transfer_requests(sow_id);

-- ========================================
-- 3. RLS POLICIES FOR TRANSFER REQUESTS
-- ========================================

ALTER TABLE sow_transfer_requests ENABLE ROW LEVEL SECURITY;

-- Sender can view their sent requests
CREATE POLICY "Users can view their sent transfer requests"
    ON sow_transfer_requests FOR SELECT
    USING (auth.uid() = from_user_id);

-- Recipient can view requests sent to them
CREATE POLICY "Users can view transfer requests sent to them"
    ON sow_transfer_requests FOR SELECT
    USING (auth.uid() = to_user_id OR to_user_email = auth.email());

-- Sender can create transfer requests for their sows
CREATE POLICY "Users can create transfer requests for their sows"
    ON sow_transfer_requests FOR INSERT
    WITH CHECK (
        auth.uid() = from_user_id AND
        EXISTS (
            SELECT 1 FROM sows
            WHERE sows.id = sow_id
            AND sows.user_id = auth.uid()
        )
    );

-- Sender can cancel their pending requests
CREATE POLICY "Users can cancel their pending requests"
    ON sow_transfer_requests FOR UPDATE
    USING (auth.uid() = from_user_id AND status = 'pending')
    WITH CHECK (status = 'cancelled');

-- Recipient can accept/decline requests
CREATE POLICY "Recipient can respond to requests"
    ON sow_transfer_requests FOR UPDATE
    USING (
        (auth.uid() = to_user_id OR to_user_email = auth.email()) AND
        status = 'pending'
    )
    WITH CHECK (status IN ('accepted', 'declined'));

-- ========================================
-- 4. TRANSFER EXECUTION FUNCTION
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

    -- 2. Transfer FARROWINGS (breeding/farrowing records)
    UPDATE farrowings
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM farrowings WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 3. DO NOT TRANSFER PIGLETS
    -- Piglets are separate animals and may have been sold/transferred independently
    -- The new owner will see the farrowing records (litter history) but not ownership of piglets

    -- 4. Transfer VACCINATIONS
    UPDATE vaccinations
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM vaccinations WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 5. Transfer HEALTH RECORDS (if table exists)
    UPDATE health_records
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM health_records WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 6. Transfer SCHEDULED TASKS
    UPDATE scheduled_tasks
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM scheduled_tasks WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- 7. Transfer MATRIX TREATMENTS
    UPDATE matrix_treatments
    SET user_id = v_to_user
    WHERE sow_id = v_sow_id AND user_id = v_from_user;

    v_transfer_count := v_transfer_count + (SELECT COUNT(*) FROM matrix_treatments WHERE sow_id = v_sow_id AND user_id = v_to_user);

    -- Mark request as completed (add a completed status if needed)
    -- For now, we keep it as 'accepted' with a responded_at timestamp

    RETURN jsonb_build_object(
        'success', true,
        'sow_id', v_sow_id,
        'from_user', v_from_user,
        'to_user', v_to_user,
        'records_transferred', v_transfer_count,
        'message', format('Successfully transferred sow and %s related records', v_transfer_count)
    );

EXCEPTION
    WHEN OTHERS THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', SQLERRM
        );
END;
$$;

COMMENT ON FUNCTION execute_sow_transfer IS 'Transfers a sow and ALL related records to a new owner. Runs with elevated privileges to bypass RLS.';

-- ========================================
-- 5. HELPER FUNCTION: Match email to user
-- ========================================

CREATE OR REPLACE FUNCTION match_transfer_request_to_user()
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
DROP TRIGGER IF EXISTS trigger_match_transfer_email ON sow_transfer_requests;
CREATE TRIGGER trigger_match_transfer_email
    BEFORE INSERT ON sow_transfer_requests
    FOR EACH ROW
    EXECUTE FUNCTION match_transfer_request_to_user();

-- ========================================
-- 6. NOTIFICATION VIEW
-- ========================================

CREATE OR REPLACE VIEW my_transfer_requests AS
SELECT
    tr.id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag as sow_ear_tag,
    s.name as sow_name,
    s.breed as sow_breed,
    'sent' as request_type
FROM sow_transfer_requests tr
JOIN sows s ON tr.sow_id = s.id
WHERE tr.from_user_id = auth.uid()

UNION ALL

SELECT
    tr.id,
    tr.sow_id,
    tr.from_user_id,
    tr.to_user_email,
    tr.to_user_id,
    tr.status,
    tr.message,
    tr.created_at,
    tr.responded_at,
    s.ear_tag as sow_ear_tag,
    s.name as sow_name,
    s.breed as sow_breed,
    'received' as request_type
FROM sow_transfer_requests tr
JOIN sows s ON tr.sow_id = s.id
WHERE tr.to_user_id = auth.uid() OR tr.to_user_email = auth.email();

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify the changes
SELECT
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'sows'
  AND column_name IN ('original_user_id', 'transferred_from_user_id', 'transferred_at')
ORDER BY ordinal_position;

SELECT
    table_name,
    COUNT(*) as policy_count
FROM information_schema.table_privileges
WHERE table_name = 'sow_transfer_requests'
GROUP BY table_name;
