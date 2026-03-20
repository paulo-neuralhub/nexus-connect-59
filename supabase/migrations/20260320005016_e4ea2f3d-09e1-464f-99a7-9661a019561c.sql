CREATE TABLE IF NOT EXISTS public.ip_office_update_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  source text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.ip_office_update_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Backoffice staff can manage update logs"
  ON public.ip_office_update_logs
  FOR ALL
  TO authenticated
  USING (public.is_backoffice_staff())
  WITH CHECK (public.is_backoffice_staff());