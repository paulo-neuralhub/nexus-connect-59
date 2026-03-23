-- 1. Create superadmins table
CREATE TABLE IF NOT EXISTS public.superadmins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  notes text,
  UNIQUE(user_id)
);

-- 2. Enable RLS
ALTER TABLE public.superadmins ENABLE ROW LEVEL SECURITY;

-- 3. Allow authenticated users to check their own superadmin status
CREATE POLICY "Users can check own superadmin status"
  ON public.superadmins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- 4. Enable genius for the existing organization
UPDATE public.tenant_feature_flags
SET has_genius = true,
    updated_at = now()
WHERE organization_id = '1187fb92-0b65-44ba-91cc-7955af6a08d0';