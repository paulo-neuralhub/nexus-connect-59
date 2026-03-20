-- leads_billing for "coming soon" interest capture
CREATE TABLE IF NOT EXISTS public.leads_billing (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  selected_plan_code text,
  selected_addons jsonb DEFAULT '[]',
  billing_cycle text DEFAULT 'monthly',
  estimated_monthly_eur numeric DEFAULT 0,
  comments text,
  organization_id uuid REFERENCES public.organizations(id),
  user_id uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.leads_billing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads_billing_insert" ON public.leads_billing FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "leads_billing_superadmin" ON public.leads_billing FOR ALL TO authenticated USING (public.is_backoffice_staff());