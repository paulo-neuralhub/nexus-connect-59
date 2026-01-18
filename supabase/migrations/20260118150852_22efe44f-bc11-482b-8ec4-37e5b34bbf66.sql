-- Fix onboarding org creation: memberships INSERT policies must be PERMISSIVE (OR), otherwise first owner membership can never be created.

BEGIN;

-- Recreate INSERT policies as PERMISSIVE
DROP POLICY IF EXISTS "Users can create their own membership" ON public.memberships;
DROP POLICY IF EXISTS "Owners and admins can create memberships in their org" ON public.memberships;

CREATE POLICY "Users can create their own membership"
ON public.memberships
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners and admins can create memberships in their org"
ON public.memberships
AS PERMISSIVE
FOR INSERT
TO authenticated
WITH CHECK (
  public.get_user_role_in_org(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])
);

-- Recreate UPDATE/DELETE as PERMISSIVE too (consistent behavior)
DROP POLICY IF EXISTS "Owners and admins can update memberships" ON public.memberships;
DROP POLICY IF EXISTS "Owners and admins can delete memberships" ON public.memberships;

CREATE POLICY "Owners and admins can update memberships"
ON public.memberships
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (
  public.get_user_role_in_org(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])
)
WITH CHECK (
  public.get_user_role_in_org(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])
);

CREATE POLICY "Owners and admins can delete memberships"
ON public.memberships
AS PERMISSIVE
FOR DELETE
TO authenticated
USING (
  public.get_user_role_in_org(organization_id) = ANY (ARRAY['owner'::text, 'admin'::text])
  AND role <> 'owner'::text
);

COMMIT;