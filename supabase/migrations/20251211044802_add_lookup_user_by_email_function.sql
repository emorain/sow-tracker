-- Create a function to lookup a user's ID by email
-- This is needed for inviting team members without exposing auth.users table directly
-- Only returns user_id, not sensitive data

CREATE OR REPLACE FUNCTION lookup_user_by_email(user_email TEXT)
RETURNS TABLE (user_id UUID) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id as user_id
  FROM auth.users
  WHERE email = LOWER(user_email)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION lookup_user_by_email(TEXT) TO authenticated;

-- Add helpful comment
COMMENT ON FUNCTION lookup_user_by_email(TEXT) IS 
  'Looks up a user ID by email address. Returns NULL if user does not exist. Used for team invitations. Security definer allows querying auth.users without exposing the table directly.';
