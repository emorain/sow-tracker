-- SECURITY FIX: SECURITY DEFINER views bypassed RLS and were readable by the
-- public anon role (the anon key ships in the client bundle). This leaked every
-- organization's sows/boars/breeding data — and team member emails — to anyone
-- with the app URL. Verified against production with the anon key alone.
--
-- Fix:
--  1. Convert data views to security_invoker so they respect the querying
--     user's RLS (Postgres 15+; project is on PG17). Authenticated in-app usage
--     is unaffected because the underlying tables already have org-scoped RLS.
--  2. organization_members_with_email is a passthrough to a SECURITY DEFINER
--     function that reads auth.users, so it can't be a plain invoker view. Scope
--     the function to the caller's own organizations instead, and revoke anon.

-- 1. Data views -> security_invoker
ALTER VIEW public.sow_list_view            SET (security_invoker = on);
ALTER VIEW public.boar_list_view           SET (security_invoker = on);
ALTER VIEW public.available_ai_semen       SET (security_invoker = on);
ALTER VIEW public.piglet_pedigree_view     SET (security_invoker = on);
ALTER VIEW public.sow_breeding_status      SET (security_invoker = on);
ALTER VIEW public.matrix_treatment_status  SET (security_invoker = on);
ALTER VIEW public.bred_sows_view           SET (security_invoker = on);
ALTER VIEW public.housing_unit_occupancy   SET (security_invoker = on);
ALTER VIEW public.my_transfer_requests     SET (security_invoker = on);

-- 2a. Scope the members-with-email function to the caller's organizations.
--     Stays SECURITY DEFINER because it must read auth.users, but now only
--     returns members of organizations the calling user actively belongs to.
CREATE OR REPLACE FUNCTION public.get_organization_members_with_email()
 RETURNS TABLE(id uuid, organization_id uuid, user_id uuid, role text, invited_by uuid, invited_at timestamp with time zone, joined_at timestamp with time zone, is_active boolean, created_at timestamp with time zone, updated_at timestamp with time zone, email text, full_name text, avatar_url text)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    om.id,
    om.organization_id,
    om.user_id,
    om.role::TEXT,
    om.invited_by,
    om.invited_at,
    om.joined_at,
    om.is_active,
    om.created_at,
    om.updated_at,
    u.email,
    (u.raw_user_meta_data->>'full_name')::TEXT as full_name,
    (u.raw_user_meta_data->>'avatar_url')::TEXT as avatar_url
  FROM organization_members om
  LEFT JOIN auth.users u ON u.id = om.user_id
  WHERE om.organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$function$;

-- 2b. Belt-and-suspenders: the anon role never needs these.
REVOKE SELECT ON public.organization_members_with_email FROM anon;
REVOKE EXECUTE ON FUNCTION public.get_organization_members_with_email() FROM anon;
