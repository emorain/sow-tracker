-- Follow-up to 20260702000001: mark the organization_members_with_email wrapper
-- view as security_invoker so it runs as the caller. The inner
-- get_organization_members_with_email() function stays SECURITY DEFINER (it must
-- read auth.users) but already self-scopes to the caller's active organizations.
-- This clears the security_definer_view advisor for the wrapper view; the leak
-- itself was already closed by 20260702000001 (function scoping + anon revoke).

ALTER VIEW public.organization_members_with_email SET (security_invoker = on);
