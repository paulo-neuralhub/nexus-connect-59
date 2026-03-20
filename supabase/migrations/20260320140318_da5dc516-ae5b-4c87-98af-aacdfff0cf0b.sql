-- ══════════════════════════════════════════════════════════════
-- IP-NEXUS: Tablas faltantes para módulos del sidebar
-- ══════════════════════════════════════════════════════════════

-- 1. SPIDER: surveillance_configs
CREATE TABLE IF NOT EXISTS public.surveillance_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  search_name TEXT NOT NULL,
  search_variants TEXT[] DEFAULT '{}',
  search_phonetic BOOLEAN DEFAULT TRUE,
  countries TEXT[] NOT NULL DEFAULT '{}',
  nice_classes INTEGER[] NOT NULL DEFAULT '{}',
  watch_all_classes BOOLEAN DEFAULT FALSE,
  plan_type TEXT NOT NULL DEFAULT 'watch_basic',
  is_active BOOLEAN DEFAULT TRUE,
  last_scan_at TIMESTAMPTZ,
  next_scan_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_surv_configs_org ON surveillance_configs(organization_id);
ALTER TABLE public.surveillance_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surv_configs_tenant" ON public.surveillance_configs FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 1b. surveillance_scans
CREATE TABLE IF NOT EXISTS public.surveillance_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  config_id UUID NOT NULL REFERENCES public.surveillance_configs(id) ON DELETE CASCADE,
  scan_started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scan_completed_at TIMESTAMPTZ,
  scan_status TEXT DEFAULT 'running',
  total_results_found INTEGER DEFAULT 0,
  new_alerts_created INTEGER DEFAULT 0,
  sources_checked TEXT[] DEFAULT '{}',
  error_message TEXT,
  error_details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.surveillance_scans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surv_scans_access" ON public.surveillance_scans FOR ALL TO authenticated USING (EXISTS (SELECT 1 FROM public.surveillance_configs sc WHERE sc.id = config_id));

-- 1c. surveillance_subscriptions
CREATE TABLE IF NOT EXISTS public.surveillance_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  subscription_number VARCHAR(50),
  search_term VARCHAR(255) NOT NULL,
  search_type VARCHAR(50) DEFAULT 'similar',
  jurisdictions TEXT[],
  nice_classes INTEGER[],
  frequency VARCHAR(20) DEFAULT 'weekly',
  alert_threshold INTEGER DEFAULT 70,
  status VARCHAR(20) DEFAULT 'active',
  start_date DATE DEFAULT CURRENT_DATE,
  end_date DATE,
  next_scan_at TIMESTAMPTZ,
  last_scan_at TIMESTAMPTZ,
  monthly_price DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.surveillance_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surv_subs_tenant" ON public.surveillance_subscriptions FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 1d. surveillance_notification_settings
CREATE TABLE IF NOT EXISTS public.surveillance_notification_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email_enabled BOOLEAN DEFAULT TRUE,
  email_address TEXT,
  push_enabled BOOLEAN DEFAULT TRUE,
  whatsapp_enabled BOOLEAN DEFAULT FALSE,
  whatsapp_number TEXT,
  notify_immediately_critical BOOLEAN DEFAULT TRUE,
  notify_immediately_high BOOLEAN DEFAULT TRUE,
  digest_medium_low TEXT DEFAULT 'daily',
  quiet_hours_start TIME,
  quiet_hours_end TIME,
  timezone TEXT DEFAULT 'Europe/Madrid',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, organization_id)
);
ALTER TABLE public.surveillance_notification_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surv_notif_own" ON public.surveillance_notification_settings FOR ALL TO authenticated USING (user_id = auth.uid());

-- 1e. Enrich existing surveillance_alerts
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='organization_id') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='config_id') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN config_id UUID REFERENCES public.surveillance_configs(id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='detected_trademark') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN detected_trademark VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='similarity_score') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN similarity_score INTEGER;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='jurisdiction') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN jurisdiction VARCHAR(10);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='filing_number') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN filing_number VARCHAR(100);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='filing_date') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN filing_date DATE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='applicant_name') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN applicant_name VARCHAR(255);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='nice_classes') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN nice_classes INTEGER[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='ai_analysis') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN ai_analysis TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='status') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN status VARCHAR(20) DEFAULT 'new';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='reviewed_by') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN reviewed_by UUID;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='reviewed_at') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN reviewed_at TIMESTAMPTZ;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='action_taken') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN action_taken VARCHAR(50);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema='public' AND table_name='surveillance_alerts' AND column_name='action_notes') THEN
    ALTER TABLE public.surveillance_alerts ADD COLUMN action_notes TEXT;
  END IF;
END $$;

-- 2. FILING
CREATE TABLE IF NOT EXISTS public.ip_filing_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  office_id UUID REFERENCES public.ipo_offices(id),
  filing_type TEXT NOT NULL,
  application_number TEXT,
  filing_date TIMESTAMPTZ,
  application_status TEXT,
  submission_payload JSONB NOT NULL DEFAULT '{}',
  applicant_name TEXT,
  applicant_id TEXT,
  representative_name TEXT,
  representative_id TEXT,
  mark_name TEXT,
  mark_feature TEXT,
  nice_classes INTEGER[],
  first_language TEXT DEFAULT 'en',
  second_language TEXT DEFAULT 'es',
  payment_method TEXT,
  payment_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending',
  payment_reference TEXT,
  status TEXT DEFAULT 'draft',
  submission_date TIMESTAMPTZ,
  last_status_check TIMESTAMPTZ,
  validation_errors JSONB,
  submission_errors JSONB,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ip_filing_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "filing_tenant" ON public.ip_filing_submissions FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

CREATE TABLE IF NOT EXISTS public.ip_trademark_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID,
  search_term TEXT NOT NULL,
  office_code TEXT NOT NULL,
  nice_classes INTEGER[],
  status_filter TEXT[],
  total_results INTEGER,
  results_snapshot JSONB,
  related_matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ip_trademark_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_tenant" ON public.ip_trademark_searches FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 3. WORKFLOWS
CREATE TABLE IF NOT EXISTS public.workflow_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  webhook_path TEXT,
  job_types TEXT[] DEFAULT '{}',
  trigger_type TEXT DEFAULT 'manual',
  is_active BOOLEAN DEFAULT TRUE,
  is_system BOOLEAN DEFAULT FALSE,
  timeout_seconds INTEGER DEFAULT 300,
  retry_on_failure BOOLEAN DEFAULT TRUE,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workflow_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_def_tenant" ON public.workflow_definitions FOR ALL TO authenticated USING (is_system = TRUE OR organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

CREATE TABLE IF NOT EXISTS public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workflow_definitions(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  triggered_by UUID,
  trigger_type TEXT DEFAULT 'manual',
  status TEXT DEFAULT 'pending',
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  input_data JSONB,
  output_data JSONB,
  error_message TEXT,
  steps_completed INTEGER DEFAULT 0,
  steps_total INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wf_exec_tenant" ON public.workflow_executions FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 4. TIME TRACKING
CREATE TABLE IF NOT EXISTS public.time_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  description TEXT,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  duration_minutes INTEGER NOT NULL DEFAULT 0,
  start_time TIMESTAMPTZ,
  end_time TIMESTAMPTZ,
  is_billable BOOLEAN DEFAULT TRUE,
  is_billed BOOLEAN DEFAULT FALSE,
  hourly_rate DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  activity_type TEXT,
  invoice_id UUID,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_time_entries_org ON time_entries(organization_id);
CREATE INDEX IF NOT EXISTS idx_time_entries_user ON time_entries(user_id, date);
ALTER TABLE public.time_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "time_tenant" ON public.time_entries FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 5. COMMUNICATIONS
CREATE TABLE IF NOT EXISTS public.communication_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'open',
  priority TEXT DEFAULT 'normal',
  last_message_at TIMESTAMPTZ,
  message_count INTEGER DEFAULT 0,
  assigned_to UUID,
  tags TEXT[] DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.communication_threads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_threads_tenant" ON public.communication_threads FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

CREATE TABLE IF NOT EXISTS public.communication_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.communication_threads(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  direction TEXT DEFAULT 'outbound',
  from_address TEXT,
  to_addresses TEXT[],
  cc_addresses TEXT[],
  bcc_addresses TEXT[],
  subject TEXT,
  body_text TEXT,
  body_html TEXT,
  attachments JSONB DEFAULT '[]',
  sent_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  external_message_id TEXT,
  sender_user_id UUID,
  status TEXT DEFAULT 'draft',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.communication_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "comm_msgs_tenant" ON public.communication_messages FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 6. MARKETING
CREATE TABLE IF NOT EXISTS public.marketing_campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  campaign_type TEXT DEFAULT 'email',
  status TEXT DEFAULT 'draft',
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  currency TEXT DEFAULT 'EUR',
  target_audience JSONB DEFAULT '{}',
  content JSONB DEFAULT '{}',
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  conversion_count INTEGER DEFAULT 0,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.marketing_campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "mkt_tenant" ON public.marketing_campaigns FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 7. IP-CHAIN
CREATE TABLE IF NOT EXISTS public.ip_chain_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  record_type TEXT NOT NULL DEFAULT 'timestamp',
  content_hash TEXT NOT NULL,
  algorithm TEXT DEFAULT 'sha256',
  blockchain_network TEXT,
  transaction_hash TEXT,
  block_number BIGINT,
  status TEXT DEFAULT 'pending',
  verified_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ip_chain_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipchain_tenant" ON public.ip_chain_records FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));

-- 8. CALENDAR
CREATE TABLE IF NOT EXISTS public.calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT DEFAULT 'meeting',
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT FALSE,
  location TEXT,
  matter_id UUID REFERENCES public.matters(id) ON DELETE SET NULL,
  contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  attendees JSONB DEFAULT '[]',
  recurrence_rule TEXT,
  reminder_minutes INTEGER DEFAULT 15,
  status TEXT DEFAULT 'confirmed',
  color TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cal_events_org ON calendar_events(organization_id, start_at);
ALTER TABLE public.calendar_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cal_tenant" ON public.calendar_events FOR ALL TO authenticated USING (organization_id IN (SELECT id FROM public.organizations WHERE id = organization_id));