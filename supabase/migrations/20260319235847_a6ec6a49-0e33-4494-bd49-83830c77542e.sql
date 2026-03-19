
CREATE OR REPLACE FUNCTION public.is_backoffice_staff()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND role IN ('super_admin'::app_role, 'admin'::app_role)
  )
$$;
