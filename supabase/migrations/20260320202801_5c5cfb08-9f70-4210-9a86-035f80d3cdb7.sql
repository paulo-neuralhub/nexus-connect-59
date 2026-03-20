
-- ============================================================
-- CRM V2 Phase 1: Tables, RLS, Seed
-- 100% idempotent
-- ============================================================

-- 0. Helper function for RLS (security definer to avoid recursion)
CREATE OR REPLACE FUNCTION public.get_user_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM public.profiles WHERE id = auth.uid()
$$;

-- ============================================================
-- 1. crm_accounts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  legal_name text,
  tax_id text,
  client_token text,
  account_type text DEFAULT 'company',
  vat_number text,
  country_code text,
  city text,
  address text,
  industry text,
  ip_portfolio_size integer DEFAULT 0,
  annual_ip_budget_eur numeric,
  preferred_language text DEFAULT 'es',
  status text DEFAULT 'active',
  tier text,
  health_score integer,
  rating_stars integer,
  lifecycle_stage text DEFAULT 'customer',
  assigned_to uuid,
  tags text[] DEFAULT '{}',
  notes text,
  is_active boolean DEFAULT true,
  last_interaction_at timestamptz,
  client_type_id uuid,
  payment_classification_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_accounts;
CREATE POLICY crm_org_isolation ON public.crm_accounts
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 2. crm_contacts
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  email text,
  phone text,
  whatsapp_phone text,
  job_title text,
  role text,
  is_primary boolean DEFAULT false,
  is_lead boolean DEFAULT false,
  lead_score integer DEFAULT 0,
  lead_status text,
  portal_access_enabled boolean DEFAULT false,
  preferred_language text DEFAULT 'es',
  country_code text,
  city text,
  tags text[] DEFAULT '{}',
  notes text,
  assigned_to uuid,
  last_interaction_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_contacts;
CREATE POLICY crm_org_isolation ON public.crm_contacts
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 3. crm_pipelines
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  description text,
  pipeline_type text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  position integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_pipelines ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_pipelines;
CREATE POLICY crm_org_isolation ON public.crm_pipelines
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 4. crm_pipeline_stages
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.crm_pipelines(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text DEFAULT '#94A3B8',
  probability integer DEFAULT 50,
  position integer DEFAULT 0,
  is_won_stage boolean DEFAULT false,
  is_lost_stage boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Stage inherits access from pipeline
DROP POLICY IF EXISTS crm_stage_via_pipeline ON public.crm_pipeline_stages;
CREATE POLICY crm_stage_via_pipeline ON public.crm_pipeline_stages
  USING (
    pipeline_id IN (
      SELECT id FROM public.crm_pipelines WHERE organization_id = public.get_user_org_id()
    )
  );

-- ============================================================
-- 5. crm_leads
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  full_name text NOT NULL,
  email text,
  phone text,
  company_name text,
  source text,
  lead_score integer DEFAULT 0,
  lead_status text DEFAULT 'new',
  assigned_to uuid,
  notes text,
  tags text[] DEFAULT '{}',
  converted_account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_leads;
CREATE POLICY crm_org_isolation ON public.crm_leads
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 6. crm_activities
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  activity_type text NOT NULL DEFAULT 'note',
  subject text,
  description text,
  activity_date timestamptz NOT NULL DEFAULT now(),
  duration_minutes integer,
  outcome text,
  next_action text,
  next_action_date timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_activities;
CREATE POLICY crm_org_isolation ON public.crm_activities
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 7. crm_tasks
-- ============================================================
CREATE TABLE IF NOT EXISTS public.crm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  due_date timestamptz,
  completed_at timestamptz,
  assigned_to uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS crm_org_isolation ON public.crm_tasks;
CREATE POLICY crm_org_isolation ON public.crm_tasks
  USING (organization_id = public.get_user_org_id());

-- ============================================================
-- 8. ALTER crm_deals — add IP-specific columns
-- ============================================================
ALTER TABLE public.crm_deals
  ADD COLUMN IF NOT EXISTS pipeline_id uuid REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS pipeline_stage_id uuid REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS deal_type text,
  ADD COLUMN IF NOT EXISTS jurisdiction_code text,
  ADD COLUMN IF NOT EXISTS nice_classes integer[],
  ADD COLUMN IF NOT EXISTS probability_pct integer DEFAULT 50,
  ADD COLUMN IF NOT EXISTS amount_eur numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS official_fees_eur numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS professional_fees_eur numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS lost_reason text,
  ADD COLUMN IF NOT EXISTS matter_id uuid,
  ADD COLUMN IF NOT EXISTS account_name_cache text,
  ADD COLUMN IF NOT EXISTS assigned_to uuid;

-- ============================================================
-- 9. updated_at triggers
-- ============================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_accounts') THEN
    CREATE TRIGGER set_updated_at_crm_accounts BEFORE UPDATE ON public.crm_accounts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_contacts') THEN
    CREATE TRIGGER set_updated_at_crm_contacts BEFORE UPDATE ON public.crm_contacts
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_pipelines') THEN
    CREATE TRIGGER set_updated_at_crm_pipelines BEFORE UPDATE ON public.crm_pipelines
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_leads') THEN
    CREATE TRIGGER set_updated_at_crm_leads BEFORE UPDATE ON public.crm_leads
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_activities') THEN
    CREATE TRIGGER set_updated_at_crm_activities BEFORE UPDATE ON public.crm_activities
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname='set_updated_at_crm_tasks') THEN
    CREATE TRIGGER set_updated_at_crm_tasks BEFORE UPDATE ON public.crm_tasks
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- 10. Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_crm_accounts_org ON public.crm_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_org ON public.crm_contacts(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_contacts_account ON public.crm_contacts(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_pipelines_org ON public.crm_pipelines(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_stages_pipeline ON public.crm_pipeline_stages(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_org ON public.crm_leads(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_org ON public.crm_activities(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_account ON public.crm_activities(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_activities_deal ON public.crm_activities(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_org ON public.crm_tasks(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_tasks_deal ON public.crm_tasks(deal_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_pipeline ON public.crm_deals(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_deals_stage ON public.crm_deals(pipeline_stage_id);
