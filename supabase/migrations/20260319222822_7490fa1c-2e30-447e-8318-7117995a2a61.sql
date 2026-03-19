
-- ============================================================
-- PHASE 1: CORE TABLES (matters, contacts, deals, activities)
-- ============================================================

-- 1. CONTACTS
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_type text NOT NULL DEFAULT 'tenant',
  type text NOT NULL DEFAULT 'person',
  name text NOT NULL,
  email text,
  phone text,
  mobile text,
  company_name text,
  job_title text,
  department text,
  tax_id text,
  website text,
  industry text,
  employee_count text,
  annual_revenue numeric,
  address_line1 text,
  address_line2 text,
  city text,
  state text,
  postal_code text,
  country text,
  source text,
  source_detail text,
  assigned_to uuid,
  lifecycle_stage text NOT NULL DEFAULT 'lead',
  tags text[],
  custom_fields jsonb DEFAULT '{}',
  avatar_url text,
  notes text,
  last_contacted_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage contacts" ON public.contacts FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 2. MATTERS
CREATE TABLE IF NOT EXISTS public.matters (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  reference text NOT NULL,
  title text NOT NULL,
  type text NOT NULL DEFAULT 'trademark',
  status text NOT NULL DEFAULT 'draft',
  ip_type text,
  status_code text,
  status_date timestamptz,
  filing_number text,
  priority_date timestamptz,
  priority_number text,
  priority_country text,
  auto_renewal boolean DEFAULT false,
  renewal_instructions text,
  internal_notes text,
  estimated_value numeric,
  cost_center text,
  is_archived boolean DEFAULT false,
  jurisdiction text,
  jurisdiction_code text,
  application_number text,
  registration_number text,
  filing_date timestamptz,
  registration_date timestamptz,
  expiry_date timestamptz,
  next_renewal_date timestamptz,
  mark_name text,
  mark_type text,
  nice_classes integer[],
  goods_services text,
  owner_name text,
  assigned_to uuid,
  client_id uuid REFERENCES public.contacts(id),
  official_fees numeric,
  professional_fees numeric,
  total_cost numeric,
  currency text DEFAULT 'EUR',
  tags text[],
  notes text,
  mark_image_url text,
  images text[],
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matters" ON public.matters FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 3. DEALS
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_type text NOT NULL DEFAULT 'tenant',
  pipeline_id uuid,
  stage_id uuid,
  title text NOT NULL,
  description text,
  value numeric,
  currency text DEFAULT 'EUR',
  contact_id uuid REFERENCES public.contacts(id),
  company_id uuid REFERENCES public.contacts(id),
  matter_id uuid REFERENCES public.matters(id),
  assigned_to uuid,
  expected_close_date timestamptz,
  actual_close_date timestamptz,
  status text NOT NULL DEFAULT 'open',
  lost_reason text,
  won_reason text,
  tags text[],
  custom_fields jsonb DEFAULT '{}',
  priority text DEFAULT 'medium',
  closed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage deals" ON public.deals FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 4. CRM_DEALS (backoffice CRM v2)
CREATE TABLE IF NOT EXISTS public.crm_deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  account_id uuid,
  contact_id uuid REFERENCES public.contacts(id),
  owner_id uuid,
  name text NOT NULL,
  stage text NOT NULL DEFAULT 'prospecting',
  opportunity_type text,
  amount numeric,
  weighted_amount numeric,
  expected_close_date timestamptz,
  actual_close_date timestamptz,
  stage_entered_at timestamptz DEFAULT now(),
  stage_history jsonb DEFAULT '[]',
  close_reason text,
  lost_to_competitor text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.crm_deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage crm_deals" ON public.crm_deals FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 5. ACTIVITIES (CRM timeline)
CREATE TABLE IF NOT EXISTS public.activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_type text NOT NULL DEFAULT 'tenant',
  type text NOT NULL DEFAULT 'note',
  contact_id uuid REFERENCES public.contacts(id),
  deal_id uuid REFERENCES public.deals(id),
  matter_id uuid REFERENCES public.matters(id),
  subject text,
  content text,
  metadata jsonb DEFAULT '{}',
  direction text,
  email_from text,
  email_to text[],
  email_cc text[],
  email_message_id text,
  call_duration integer,
  call_outcome text,
  call_recording_url text,
  meeting_start timestamptz,
  meeting_end timestamptz,
  meeting_location text,
  meeting_attendees text[],
  due_date timestamptz,
  completed_at timestamptz,
  is_completed boolean DEFAULT false,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage activities" ON public.activities FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 6. MATTER_DEADLINES
CREATE TABLE IF NOT EXISTS public.matter_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  rule_id uuid,
  rule_code text,
  deadline_type text NOT NULL DEFAULT 'custom',
  title text NOT NULL,
  description text,
  trigger_date timestamptz,
  deadline_date timestamptz NOT NULL,
  original_deadline timestamptz,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'medium',
  completed_at timestamptz,
  completed_by uuid,
  completion_notes text,
  extension_count integer DEFAULT 0,
  extension_reason text,
  extended_by uuid,
  task_id uuid,
  alerts_sent jsonb DEFAULT '{}',
  next_alert_date timestamptz,
  google_event_id text,
  outlook_event_id text,
  metadata jsonb DEFAULT '{}',
  auto_generated boolean DEFAULT false,
  source text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_deadlines" ON public.matter_deadlines FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 7. MATTER_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.matter_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  category text,
  description text,
  is_official boolean DEFAULT false,
  document_date timestamptz,
  expiry_date timestamptz,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_documents" ON public.matter_documents FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 8. MATTER_COSTS
CREATE TABLE IF NOT EXISTS public.matter_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  cost_type text NOT NULL DEFAULT 'other',
  official_fee_id uuid,
  service_fee_id uuid,
  description text NOT NULL,
  notes text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  exchange_rate numeric,
  amount_local numeric,
  quantity integer NOT NULL DEFAULT 1,
  total_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  cost_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  paid_date timestamptz,
  is_billable boolean DEFAULT true,
  invoice_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_costs" ON public.matter_costs FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 9. MATTER_TASKS
CREATE TABLE IF NOT EXISTS public.matter_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'pending',
  priority text DEFAULT 'medium',
  assigned_to uuid,
  due_date timestamptz,
  completed_at timestamptz,
  completed_by uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_tasks" ON public.matter_tasks FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 10. MATTER_COMMENTS
CREATE TABLE IF NOT EXISTS public.matter_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  content text NOT NULL,
  is_internal boolean DEFAULT true,
  parent_id uuid REFERENCES public.matter_comments(id),
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_comments" ON public.matter_comments FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 11. MATTER_PARTIES
CREATE TABLE IF NOT EXISTS public.matter_parties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  party_role text NOT NULL,
  source_type text DEFAULT 'manual',
  source_relationship_id uuid,
  client_id uuid REFERENCES public.contacts(id),
  contact_id uuid REFERENCES public.contacts(id),
  external_name text,
  external_address text,
  external_country text,
  external_email text,
  external_phone text,
  percentage numeric,
  is_primary boolean DEFAULT false,
  jurisdiction text,
  notes text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_parties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_parties" ON public.matter_parties FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 12. MATTER_ACTIVITY (timeline log)
CREATE TABLE IF NOT EXISTS public.matter_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id uuid NOT NULL REFERENCES public.matters(id) ON DELETE CASCADE,
  action text NOT NULL,
  title text,
  description text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.matter_activity ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage matter_activity" ON public.matter_activity FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 13. PARTY_ROLES
CREATE TABLE IF NOT EXISTS public.party_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text NOT NULL,
  category text NOT NULL DEFAULT 'other',
  applies_to text[] DEFAULT '{}',
  icon text,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.party_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read party_roles" ON public.party_roles FOR SELECT TO authenticated USING (true);
