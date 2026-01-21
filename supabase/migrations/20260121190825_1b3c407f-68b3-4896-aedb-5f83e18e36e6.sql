-- ============================================================
-- P78: Persistencia multi-dispositivo de guías contextuales
-- Tabla: contextual_guide_progress
-- ============================================================

CREATE TABLE IF NOT EXISTS public.contextual_guide_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed', -- completed | skipped
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_contextual_guide_progress_org_user
  ON public.contextual_guide_progress (organization_id, user_id);

CREATE INDEX IF NOT EXISTS idx_contextual_guide_progress_feature
  ON public.contextual_guide_progress (feature_key);

ALTER TABLE public.contextual_guide_progress ENABLE ROW LEVEL SECURITY;

-- Helper: check membership in org
CREATE OR REPLACE FUNCTION public.is_member_of_org(org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  select exists(
    select 1
    from public.memberships m
    where m.organization_id = org_id
      and m.user_id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_member_of_org(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_member_of_org(uuid) TO authenticated;

-- Policies
CREATE POLICY "Users can view their own guide progress"
ON public.contextual_guide_progress
FOR SELECT
USING (
  auth.uid() = user_id
  AND public.is_member_of_org(organization_id)
);

CREATE POLICY "Users can insert their own guide progress"
ON public.contextual_guide_progress
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND public.is_member_of_org(organization_id)
);

CREATE POLICY "Users can update their own guide progress"
ON public.contextual_guide_progress
FOR UPDATE
USING (
  auth.uid() = user_id
  AND public.is_member_of_org(organization_id)
)
WITH CHECK (
  auth.uid() = user_id
  AND public.is_member_of_org(organization_id)
);

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_contextual_guide_progress_updated_at ON public.contextual_guide_progress;
CREATE TRIGGER trg_contextual_guide_progress_updated_at
BEFORE UPDATE ON public.contextual_guide_progress
FOR EACH ROW
EXECUTE FUNCTION public.set_updated_at();
