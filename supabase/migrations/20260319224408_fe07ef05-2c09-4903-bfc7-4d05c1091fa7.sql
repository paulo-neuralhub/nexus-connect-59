
-- 1. Create memberships table
CREATE TABLE IF NOT EXISTS public.memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id)
);

ALTER TABLE public.memberships ENABLE ROW LEVEL SECURITY;

-- Users can read their own memberships
CREATE POLICY "Users read own memberships" ON public.memberships
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own memberships (for org creation)
CREATE POLICY "Users create own memberships" ON public.memberships
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- 2. Add INSERT policy on organizations for authenticated users
CREATE POLICY "Authenticated users create organizations" ON public.organizations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 3. Add UPDATE policy on organizations for members
CREATE POLICY "Org members update org" ON public.organizations
  FOR UPDATE TO authenticated
  USING (id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()))
  WITH CHECK (id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

-- 4. Update the SELECT policy to also check memberships (not just profiles)
DROP POLICY IF EXISTS "Members read own org" ON public.organizations;
CREATE POLICY "Members read own org" ON public.organizations
  FOR SELECT TO authenticated
  USING (
    id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid())
    OR id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
  );

-- 5. Allow users to update their own profile's organization_id
DROP POLICY IF EXISTS "Users update own profile" ON public.profiles;
CREATE POLICY "Users update own profile" ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());
