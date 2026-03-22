
-- =============================================
-- CLIENT-PORTAL-01 FASE 1: BASE DE DATOS
-- =============================================

-- PASO 1: EXPANDIR TABLAS STUB

ALTER TABLE portal_access
  ADD COLUMN IF NOT EXISTS can_view_matters boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_documents boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_invoices boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_deadlines boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_view_alerts boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_request_services boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_pay_invoices boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_sign_documents boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_basic_search boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_use_advanced_search boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS can_message_despacho boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_use_chatbot boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_complete_intake_forms boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS can_sync_calendar boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS advanced_search_fee_eur numeric(10,2) DEFAULT 10.00,
  ADD COLUMN IF NOT EXISTS advanced_searches_used_month integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS searches_reset_at timestamptz DEFAULT date_trunc('month', now()),
  ADD COLUMN IF NOT EXISTS invited_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS invited_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS activated_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portal_access_org_account_unique' AND conrelid = 'portal_access'::regclass
  ) THEN
    ALTER TABLE portal_access ADD CONSTRAINT portal_access_org_account_unique UNIQUE(organization_id, crm_account_id);
  END IF;
END $$;

ALTER TABLE portal_notifications
  ADD COLUMN IF NOT EXISTS portal_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS action_url text,
  ADD COLUMN IF NOT EXISTS icon text,
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS document_id uuid REFERENCES matter_documents(id),
  ADD COLUMN IF NOT EXISTS invoice_id uuid REFERENCES invoices(id),
  ADD COLUMN IF NOT EXISTS is_read boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS read_at timestamptz,
  ADD COLUMN IF NOT EXISTS sent_email boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_whatsapp boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS sent_push boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS dedup_key text;

CREATE UNIQUE INDEX IF NOT EXISTS idx_portal_notifications_dedup ON portal_notifications(dedup_key) WHERE dedup_key IS NOT NULL;

ALTER TABLE portal_service_requests
  ADD COLUMN IF NOT EXISTS portal_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS market_service_request_id uuid REFERENCES market_service_requests(id),
  ADD COLUMN IF NOT EXISTS jurisdictions text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS nice_classes integer[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS mark_name text,
  ADD COLUMN IF NOT EXISTS urgency text DEFAULT 'normal',
  ADD COLUMN IF NOT EXISTS quoted_amount_eur numeric(10,2),
  ADD COLUMN IF NOT EXISTS quote_notes text,
  ADD COLUMN IF NOT EXISTS quote_valid_until timestamptz,
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS client_notes text,
  ADD COLUMN IF NOT EXISTS despacho_notes text;

-- PASO 2: EXTENSIONES A TABLAS EXISTENTES

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS portal_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_subdomain text,
  ADD COLUMN IF NOT EXISTS portal_name text,
  ADD COLUMN IF NOT EXISTS portal_welcome_title text DEFAULT '¡Bienvenido a tu portal!',
  ADD COLUMN IF NOT EXISTS portal_welcome_message text,
  ADD COLUMN IF NOT EXISTS portal_footer_text text,
  ADD COLUMN IF NOT EXISTS portal_show_ipnexus_branding boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_max_clients integer DEFAULT 10,
  ADD COLUMN IF NOT EXISTS portal_chatbot_name text DEFAULT 'Asistente PI',
  ADD COLUMN IF NOT EXISTS portal_chatbot_welcome text DEFAULT '¡Hola! Soy tu asistente de PI. ¿En qué puedo ayudarte?',
  ADD COLUMN IF NOT EXISTS portal_logo_dark_url text,
  ADD COLUMN IF NOT EXISTS portal_favicon_url text,
  ADD COLUMN IF NOT EXISTS primary_color text DEFAULT '#1E40AF',
  ADD COLUMN IF NOT EXISTS secondary_color text DEFAULT '#3B82F6',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS portal_pwa_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_push_notifications_enabled boolean DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'portal_subdomain_format') THEN
    ALTER TABLE organizations ADD CONSTRAINT portal_subdomain_format
      CHECK (portal_subdomain ~ '^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$' OR portal_subdomain IS NULL);
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_organizations_portal_subdomain ON organizations(portal_subdomain) WHERE portal_subdomain IS NOT NULL;

ALTER TABLE crm_accounts
  ADD COLUMN IF NOT EXISTS portal_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_user_id uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS portal_invited_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_invitation_token text,
  ADD COLUMN IF NOT EXISTS portal_invitation_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_last_login timestamptz,
  ADD COLUMN IF NOT EXISTS portal_login_count integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portal_notification_email boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_notification_whatsapp boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_notification_sms boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_notification_push boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_nps_last_score integer,
  ADD COLUMN IF NOT EXISTS portal_nps_last_at timestamptz;

ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS portal_visible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_visible_confirmed_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS portal_visible_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_show_reference_numbers boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_show_deadlines boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_show_costs boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_client_notes text,
  ADD COLUMN IF NOT EXISTS portal_status_label text,
  ADD COLUMN IF NOT EXISTS portal_timeline_visible boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS portal_certificate_generated boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_certificate_url text,
  ADD COLUMN IF NOT EXISTS portal_intake_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_intake_completed_at timestamptz;

ALTER TABLE matter_documents
  ADD COLUMN IF NOT EXISTS portal_visible boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_auto_publish boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_visible_confirmed_by uuid REFERENCES profiles(id),
  ADD COLUMN IF NOT EXISTS portal_visible_confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_requires_signature boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_signature_level text DEFAULT 'simple',
  ADD COLUMN IF NOT EXISTS portal_signature_status text DEFAULT 'not_required',
  ADD COLUMN IF NOT EXISTS portal_signed_at timestamptz,
  ADD COLUMN IF NOT EXISTS portal_signed_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS portal_signature_data jsonb;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'spider_alerts' AND table_schema = 'public') THEN
    EXECUTE 'ALTER TABLE spider_alerts
      ADD COLUMN IF NOT EXISTS portal_visible boolean DEFAULT false,
      ADD COLUMN IF NOT EXISTS portal_approved_by uuid REFERENCES profiles(id),
      ADD COLUMN IF NOT EXISTS portal_approved_at timestamptz,
      ADD COLUMN IF NOT EXISTS portal_despacho_analysis text';
  END IF;
END $$;

-- PASO 3: 9 TABLAS NUEVAS

CREATE TABLE IF NOT EXISTS portal_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  email text NOT NULL,
  token text NOT NULL UNIQUE DEFAULT encode(gen_random_bytes(32), 'hex'),
  status text DEFAULT 'pending',
  expires_at timestamptz DEFAULT now() + interval '7 days',
  accepted_at timestamptz,
  reminder_count integer DEFAULT 0,
  last_reminder_at timestamptz,
  initial_permissions jsonb DEFAULT '{}',
  sent_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  sender_type text NOT NULL,
  sender_user_id uuid REFERENCES auth.users(id),
  sender_name text,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  attachments jsonb DEFAULT '[]',
  ai_model_used text,
  ai_sources_used jsonb DEFAULT '[]',
  ai_disclaimer_shown boolean DEFAULT true,
  matter_id uuid REFERENCES matters(id),
  invoice_id uuid REFERENCES invoices(id),
  read_by_client boolean DEFAULT false,
  read_by_agent boolean DEFAULT false,
  read_at_client timestamptz,
  read_at_agent timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_chat_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  portal_user_id uuid NOT NULL REFERENCES auth.users(id),
  mode text DEFAULT 'ai',
  assigned_agent_id uuid REFERENCES profiles(id),
  assigned_at timestamptz,
  handoff_requested_at timestamptz,
  handoff_trigger text,
  human_joined_at timestamptz,
  sla_response_minutes integer DEFAULT 10,
  sla_warned_at timestamptz,
  realtime_channel text UNIQUE DEFAULT 'portal_chat_' || gen_random_uuid()::text,
  ai_context_summary text,
  client_rating integer CHECK (client_rating BETWEEN 1 AND 5),
  client_feedback text,
  rated_at timestamptz,
  closed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_agent_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  agent_id uuid NOT NULL REFERENCES profiles(id),
  status text DEFAULT 'offline',
  current_active_chats integer DEFAULT 0,
  max_concurrent_chats integer DEFAULT 3,
  last_heartbeat_at timestamptz DEFAULT now(),
  total_chats_today integer DEFAULT 0,
  avg_response_seconds integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, agent_id)
);

CREATE TABLE IF NOT EXISTS portal_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  matter_id uuid NOT NULL UNIQUE REFERENCES matters(id),
  certificate_type text DEFAULT 'registration_confirmation',
  certificate_number text UNIQUE,
  mark_name text NOT NULL,
  registration_number text,
  registration_date date,
  jurisdiction_code text,
  nice_classes integer[] DEFAULT '{}',
  owner_name text NOT NULL,
  despacho_name text NOT NULL,
  despacho_tax_id text,
  verification_url text,
  verification_qr_url text,
  certificate_pdf_url text,
  content_hash text,
  is_revoked boolean DEFAULT false,
  revoked_at timestamptz,
  revoked_reason text,
  generated_by uuid REFERENCES profiles(id),
  generated_at timestamptz DEFAULT now(),
  viewed_by_client boolean DEFAULT false,
  downloaded_by_client boolean DEFAULT false
);

CREATE TABLE IF NOT EXISTS portal_intake_forms (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  portal_user_id uuid REFERENCES auth.users(id),
  matter_id uuid REFERENCES matters(id),
  form_type text NOT NULL DEFAULT 'trademark_registration',
  form_data jsonb NOT NULL DEFAULT '{}',
  status text DEFAULT 'pending',
  completed_at timestamptz,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  review_notes text,
  applied_to_matter_at timestamptz,
  applied_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_nps_responses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  portal_user_id uuid NOT NULL REFERENCES auth.users(id),
  matter_id uuid REFERENCES matters(id),
  score integer NOT NULL CHECK (score BETWEEN 0 AND 10),
  category text GENERATED ALWAYS AS (
    CASE WHEN score >= 9 THEN 'promoter' WHEN score >= 7 THEN 'neutral' ELSE 'detractor' END
  ) STORED,
  reason text,
  would_recommend boolean GENERATED ALWAYS AS (score >= 7) STORED,
  review_requested boolean DEFAULT false,
  review_submitted boolean DEFAULT false,
  review_platform text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_impersonation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  staff_user_id uuid NOT NULL REFERENCES profiles(id),
  staff_role text NOT NULL,
  target_crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  target_portal_user_id uuid REFERENCES auth.users(id),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration_seconds integer,
  purpose text NOT NULL DEFAULT 'configuration_review',
  pages_visited text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS portal_calendar_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_account_id uuid NOT NULL REFERENCES crm_accounts(id),
  portal_user_id uuid NOT NULL REFERENCES auth.users(id),
  calendar_provider text NOT NULL DEFAULT 'google',
  access_token_encrypted text,
  refresh_token_encrypted text,
  token_expires_at timestamptz,
  ical_url text,
  calendar_id text,
  sync_deadlines boolean DEFAULT true,
  sync_renewals boolean DEFAULT true,
  sync_appointments boolean DEFAULT true,
  is_active boolean DEFAULT true,
  last_sync_at timestamptz,
  sync_error text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, crm_account_id, calendar_provider)
);

-- PASO 4: RLS + POLICIES

-- Enable RLS on all tables
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'portal_invitations','portal_chat_messages','portal_chat_sessions',
    'portal_agent_availability','portal_certificates','portal_intake_forms',
    'portal_nps_responses','portal_impersonation_sessions','portal_calendar_syncs',
    'portal_access','portal_notifications','portal_service_requests','portal_client_instructions'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
  END LOOP;
END $$;

-- matters portal policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'matters'::regclass AND polname = 'matters_portal_client_v2') THEN
    CREATE POLICY "matters_portal_client_v2" ON matters FOR SELECT USING (
      portal_visible = true AND client_id IN (
        SELECT crm_account_id FROM portal_access WHERE portal_user_id = auth.uid() AND status = 'active' AND organization_id = matters.organization_id
      )
    );
  END IF;
END $$;

-- matter_documents portal policy
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'matter_documents'::regclass AND polname = 'matter_docs_portal_v2') THEN
    CREATE POLICY "matter_docs_portal_v2" ON matter_documents FOR SELECT USING (
      portal_visible = true AND matter_id IN (
        SELECT id FROM matters WHERE portal_visible = true AND client_id IN (
          SELECT crm_account_id FROM portal_access WHERE portal_user_id = auth.uid() AND status = 'active'
        )
      )
    );
  END IF;
END $$;

-- portal_access
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_access'::regclass AND polname = 'pa_despacho') THEN
    CREATE POLICY "pa_despacho" ON portal_access FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_access'::regclass AND polname = 'pa_client_read') THEN
    CREATE POLICY "pa_client_read" ON portal_access FOR SELECT USING (portal_user_id = auth.uid());
  END IF;
END $$;

-- portal_chat_messages
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_chat_messages'::regclass AND polname = 'pcm_client') THEN
    CREATE POLICY "pcm_client" ON portal_chat_messages FOR ALL USING (
      crm_account_id IN (SELECT crm_account_id FROM portal_access WHERE portal_user_id = auth.uid() AND status = 'active')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_chat_messages'::regclass AND polname = 'pcm_despacho') THEN
    CREATE POLICY "pcm_despacho" ON portal_chat_messages FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- portal_chat_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_chat_sessions'::regclass AND polname = 'pcs_client') THEN
    CREATE POLICY "pcs_client" ON portal_chat_sessions FOR ALL USING (portal_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_chat_sessions'::regclass AND polname = 'pcs_despacho') THEN
    CREATE POLICY "pcs_despacho" ON portal_chat_sessions FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_chat_sessions'::regclass AND polname = 'pcs_assigned_agent') THEN
    CREATE POLICY "pcs_assigned_agent" ON portal_chat_sessions FOR ALL USING (assigned_agent_id = auth.uid());
  END IF;
END $$;

-- portal_agent_availability
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_agent_availability'::regclass AND polname = 'paa_despacho') THEN
    CREATE POLICY "paa_despacho" ON portal_agent_availability FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_agent_availability'::regclass AND polname = 'paa_self') THEN
    CREATE POLICY "paa_self" ON portal_agent_availability FOR ALL USING (agent_id = auth.uid());
  END IF;
END $$;

-- portal_notifications
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_notifications'::regclass AND polname = 'pn_client_read') THEN
    CREATE POLICY "pn_client_read" ON portal_notifications FOR SELECT USING (portal_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_notifications'::regclass AND polname = 'pn_despacho') THEN
    CREATE POLICY "pn_despacho" ON portal_notifications FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- portal_impersonation_sessions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_impersonation_sessions'::regclass AND polname = 'pis_staff') THEN
    CREATE POLICY "pis_staff" ON portal_impersonation_sessions FOR ALL USING (
      organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()) AND staff_user_id = auth.uid()
    );
  END IF;
END $$;

-- portal_invitations
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_invitations'::regclass AND polname = 'pi_despacho') THEN
    CREATE POLICY "pi_despacho" ON portal_invitations FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- portal_certificates (NO tiene portal_user_id — usar crm_account_id via portal_access)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_certificates'::regclass AND polname = 'portal_certificates_client_read') THEN
    CREATE POLICY "portal_certificates_client_read" ON portal_certificates FOR SELECT USING (
      crm_account_id IN (SELECT crm_account_id FROM portal_access WHERE portal_user_id = auth.uid() AND status = 'active')
    );
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_certificates'::regclass AND polname = 'portal_certificates_despacho') THEN
    CREATE POLICY "portal_certificates_despacho" ON portal_certificates FOR ALL USING (
      organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid())
    );
  END IF;
END $$;

-- portal_intake_forms, portal_nps_responses, portal_calendar_syncs (tienen portal_user_id)
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY['portal_intake_forms','portal_nps_responses','portal_calendar_syncs']) LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = t::regclass AND polname = t || '_client_read') THEN
      EXECUTE format('CREATE POLICY "%s_client_read" ON %I FOR SELECT USING (portal_user_id = auth.uid())', t, t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = t::regclass AND polname = t || '_client_insert') THEN
      EXECUTE format('CREATE POLICY "%s_client_insert" ON %I FOR INSERT WITH CHECK (portal_user_id = auth.uid())', t, t);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = t::regclass AND polname = t || '_despacho') THEN
      EXECUTE format('CREATE POLICY "%s_despacho" ON %I FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()))', t, t);
    END IF;
  END LOOP;
END $$;

-- portal_service_requests
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_service_requests'::regclass AND polname = 'psr_client_read') THEN
    CREATE POLICY "psr_client_read" ON portal_service_requests FOR SELECT USING (portal_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_service_requests'::regclass AND polname = 'psr_client_insert') THEN
    CREATE POLICY "psr_client_insert" ON portal_service_requests FOR INSERT WITH CHECK (portal_user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policy WHERE polrelid = 'portal_service_requests'::regclass AND polname = 'psr_despacho') THEN
    CREATE POLICY "psr_despacho" ON portal_service_requests FOR ALL USING (organization_id IN (SELECT organization_id FROM profiles WHERE id = auth.uid()));
  END IF;
END $$;

-- PASO 5: ÍNDICES
CREATE INDEX IF NOT EXISTS idx_portal_access_user ON portal_access(portal_user_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_access_account ON portal_access(organization_id, crm_account_id);
CREATE INDEX IF NOT EXISTS idx_portal_chat_messages_account ON portal_chat_messages(crm_account_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_portal_notifications_user ON portal_notifications(portal_user_id, is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_agent_heartbeat ON portal_agent_availability(organization_id, status, last_heartbeat_at);
CREATE INDEX IF NOT EXISTS idx_portal_certificates_matter ON portal_certificates(matter_id);
CREATE INDEX IF NOT EXISTS idx_portal_intake_matter ON portal_intake_forms(matter_id, status);
CREATE INDEX IF NOT EXISTS idx_portal_nps_org ON portal_nps_responses(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_portal_impersonation_staff ON portal_impersonation_sessions(staff_user_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_matters_portal_visible ON matters(client_id, portal_visible) WHERE portal_visible = true;
CREATE INDEX IF NOT EXISTS idx_matter_docs_portal ON matter_documents(matter_id, portal_visible) WHERE portal_visible = true;
