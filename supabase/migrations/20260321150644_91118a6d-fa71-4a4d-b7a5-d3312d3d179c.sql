-- =============================================
-- COMM-01 Phase 1: Communications Module — Enterprise v2
-- Multi-Tenant Strict Isolation
-- =============================================

-- TABLA 1: Configuración de comunicaciones por tenant
CREATE TABLE IF NOT EXISTS comm_tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  is_active boolean DEFAULT false,
  activated_at timestamptz,
  plan_code text DEFAULT 'comm_basic',
  max_email_per_month integer DEFAULT 1000,
  max_whatsapp_per_month integer DEFAULT 500,
  max_sms_per_month integer DEFAULT 200,
  current_month_emails integer DEFAULT 0,
  current_month_whatsapp integer DEFAULT 0,
  current_month_sms integer DEFAULT 0,
  current_month_reset_at timestamptz DEFAULT date_trunc('month', now()),
  email_provider text DEFAULT 'resend',
  sending_domain text,
  domain_verified boolean DEFAULT false,
  email_from_name text,
  email_from_address text,
  email_reply_to text,
  smtp_host text,
  smtp_port integer DEFAULT 587,
  smtp_use_tls boolean DEFAULT true,
  smtp_secret_key text,
  email_signature_html text,
  whatsapp_enabled boolean DEFAULT false,
  whatsapp_bsp text DEFAULT '360dialog',
  whatsapp_phone_number_id text,
  whatsapp_display_name text,
  whatsapp_webhook_verify_token text,
  sms_enabled boolean DEFAULT false,
  internal_chat_enabled boolean DEFAULT true,
  retention_days integer DEFAULT 2555,
  retention_policy text DEFAULT 'keep_all',
  notify_new_message_email boolean DEFAULT true,
  notify_new_message_internal boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 2: Cola de mensajes por tenant
CREATE TABLE IF NOT EXISTS comm_message_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  operation text NOT NULL,
  payload jsonb NOT NULL,
  idempotency_key text NOT NULL,
  status text DEFAULT 'pending',
  attempt_count integer DEFAULT 0,
  max_attempts integer DEFAULT 3,
  next_attempt_at timestamptz DEFAULT now(),
  last_error text,
  errors_detail jsonb DEFAULT '[]',
  priority integer DEFAULT 5,
  result jsonb,
  processed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, idempotency_key)
);

CREATE INDEX IF NOT EXISTS idx_comm_queue_pending
  ON comm_message_queue(organization_id, priority, next_attempt_at)
  WHERE status = 'pending';

-- TABLA 3: Threads de comunicación
CREATE TABLE IF NOT EXISTS comm_threads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  crm_contact_id uuid REFERENCES crm_contacts(id),
  additional_matter_ids uuid[] DEFAULT '{}',
  channel text NOT NULL,
  email_thread_id text,
  whatsapp_conversation_id text,
  participants jsonb DEFAULT '[]',
  subject text,
  status text DEFAULT 'open',
  assigned_to uuid REFERENCES profiles(id),
  message_count integer DEFAULT 0,
  unread_count integer DEFAULT 0,
  last_message_at timestamptz,
  last_message_preview text,
  last_message_sender text,
  auto_indexed boolean DEFAULT false,
  indexing_confidence text DEFAULT 'none',
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 4: Mensajes — INMUTABLES una vez enviados
CREATE TABLE IF NOT EXISTS comm_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  thread_id uuid NOT NULL REFERENCES comm_threads(id),
  sender_type text NOT NULL,
  sender_id uuid,
  sender_name text NOT NULL,
  sender_email text,
  sender_phone text,
  channel text NOT NULL,
  content_type text DEFAULT 'text',
  body text,
  body_html text,
  template_name text,
  template_language text,
  template_params jsonb,
  attachments jsonb DEFAULT '[]',
  content_hash text,
  is_legally_critical boolean DEFAULT false,
  status text DEFAULT 'sent',
  sent_at timestamptz,
  delivered_at timestamptz,
  read_at timestamptz,
  failed_reason text,
  retry_count integer DEFAULT 0,
  provider_message_id text,
  provider text,
  email_message_id text,
  email_in_reply_to text,
  email_references text[],
  idempotency_key text,
  is_draft boolean DEFAULT false,
  draft_updated_at timestamptz,
  telephony_cdr_id uuid,
  created_at timestamptz DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_comm_messages_idempotency
  ON comm_messages(organization_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

-- TABLA 5: Resolución de identidad
CREATE TABLE IF NOT EXISTS comm_identity_map (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  crm_contact_id uuid REFERENCES crm_contacts(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  email_addresses text[] DEFAULT '{}',
  phone_numbers text[] DEFAULT '{}',
  whatsapp_ids text[] DEFAULT '{}',
  resolution_method text DEFAULT 'manual',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 6: Templates por tenant
CREATE TABLE IF NOT EXISTS comm_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  channel text NOT NULL,
  category text NOT NULL,
  subject text,
  body_text text,
  body_html text,
  whatsapp_template_name text,
  whatsapp_template_language text DEFAULT 'es',
  whatsapp_approval_status text DEFAULT 'pending',
  available_variables jsonb DEFAULT '[]',
  is_active boolean DEFAULT true,
  is_system_default boolean DEFAULT false,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- TABLA 7: Chat interno entre empleados
CREATE TABLE IF NOT EXISTS comm_internal_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  room_type text NOT NULL DEFAULT 'direct',
  room_id text NOT NULL,
  sender_id uuid NOT NULL REFERENCES profiles(id),
  sender_name text NOT NULL,
  content text NOT NULL,
  content_type text DEFAULT 'text',
  mentions uuid[] DEFAULT '{}',
  attachments jsonb DEFAULT '[]',
  read_by jsonb DEFAULT '{}',
  is_edited boolean DEFAULT false,
  is_deleted boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- TABLA 8: Eventos de comunicación (audit trail inmutable)
CREATE TABLE IF NOT EXISTS comm_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL,
  message_id uuid REFERENCES comm_messages(id),
  thread_id uuid REFERENCES comm_threads(id),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  provider_event_id text,
  occurred_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS — AISLAMIENTO ESTRICTO
-- =============================================
ALTER TABLE comm_tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_message_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_identity_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_internal_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE comm_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "comm_tenant_config_strict_org" ON comm_tenant_config
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_message_queue_strict_org" ON comm_message_queue
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_threads_strict_org" ON comm_threads
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_messages_strict_org" ON comm_messages
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_identity_map_strict_org" ON comm_identity_map
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_templates_strict_org" ON comm_templates
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_internal_messages_strict_org" ON comm_internal_messages
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_events_strict_org" ON comm_events
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "comm_tenant_config_backoffice" ON comm_tenant_config
  FOR ALL USING (public.is_backoffice_staff());

CREATE POLICY "comm_message_queue_backoffice" ON comm_message_queue
  FOR ALL USING (public.is_backoffice_staff());

CREATE POLICY "comm_threads_backoffice" ON comm_threads
  FOR ALL USING (public.is_backoffice_staff());

CREATE POLICY "comm_messages_backoffice" ON comm_messages
  FOR ALL USING (public.is_backoffice_staff());

CREATE POLICY "comm_events_backoffice" ON comm_events
  FOR ALL USING (public.is_backoffice_staff());

-- =============================================
-- FUNCIONES
-- =============================================

CREATE OR REPLACE FUNCTION public.get_or_create_comm_thread(
  p_org_id uuid,
  p_channel text,
  p_matter_id uuid DEFAULT NULL,
  p_account_id uuid DEFAULT NULL,
  p_contact_id uuid DEFAULT NULL,
  p_subject text DEFAULT NULL,
  p_created_by uuid DEFAULT NULL,
  p_email_thread_id text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_thread_id uuid;
BEGIN
  IF p_email_thread_id IS NOT NULL THEN
    SELECT id INTO v_thread_id
    FROM comm_threads
    WHERE organization_id = p_org_id
      AND email_thread_id = p_email_thread_id
      AND status != 'archived';
  END IF;

  IF v_thread_id IS NULL THEN
    SELECT id INTO v_thread_id
    FROM comm_threads
    WHERE organization_id = p_org_id
      AND channel = p_channel
      AND (p_matter_id IS NULL OR matter_id = p_matter_id)
      AND (p_account_id IS NULL OR crm_account_id = p_account_id)
      AND status = 'open'
    ORDER BY last_message_at DESC NULLS LAST
    LIMIT 1;
  END IF;

  IF v_thread_id IS NULL THEN
    INSERT INTO comm_threads (
      organization_id, channel, matter_id, crm_account_id,
      crm_contact_id, subject, created_by, email_thread_id
    ) VALUES (
      p_org_id, p_channel, p_matter_id, p_account_id,
      p_contact_id, p_subject, p_created_by, p_email_thread_id
    )
    ON CONFLICT DO NOTHING
    RETURNING id INTO v_thread_id;

    IF v_thread_id IS NULL THEN
      SELECT id INTO v_thread_id
      FROM comm_threads
      WHERE organization_id = p_org_id
        AND channel = p_channel
        AND (p_email_thread_id IS NULL OR email_thread_id = p_email_thread_id)
      ORDER BY created_at DESC
      LIMIT 1;
    END IF;
  END IF;

  RETURN v_thread_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_comm_counter(
  p_org_id uuid,
  p_channel text
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE comm_tenant_config
  SET
    current_month_emails = CASE
      WHEN p_channel = 'email' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_emails + 1 END
      ELSE current_month_emails END,
    current_month_whatsapp = CASE
      WHEN p_channel = 'whatsapp' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_whatsapp + 1 END
      ELSE current_month_whatsapp END,
    current_month_sms = CASE
      WHEN p_channel = 'sms' THEN
        CASE WHEN current_month_reset_at < date_trunc('month', now())
          THEN 1 ELSE current_month_sms + 1 END
      ELSE current_month_sms END,
    current_month_reset_at = CASE
      WHEN current_month_reset_at < date_trunc('month', now())
      THEN date_trunc('month', now())
      ELSE current_month_reset_at END,
    updated_at = now()
  WHERE organization_id = p_org_id;
END;
$$;

-- =============================================
-- ÍNDICES CRÍTICOS
-- =============================================
CREATE INDEX IF NOT EXISTS idx_comm_threads_org_channel
  ON comm_threads(organization_id, channel, status);
CREATE INDEX IF NOT EXISTS idx_comm_threads_matter
  ON comm_threads(matter_id) WHERE matter_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_threads_account
  ON comm_threads(crm_account_id) WHERE crm_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_messages_thread
  ON comm_messages(thread_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_messages_cdr
  ON comm_messages(telephony_cdr_id)
  WHERE telephony_cdr_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_comm_internal_room
  ON comm_internal_messages(organization_id, room_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comm_events_message
  ON comm_events(message_id, occurred_at DESC);

-- =============================================
-- STORAGE BUCKET para adjuntos
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('comm-attachments', 'comm-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "comm_attachments_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'comm-attachments'
    AND (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

CREATE POLICY "comm_attachments_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'comm-attachments'
    AND (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );

CREATE POLICY "comm_attachments_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'comm-attachments'
    AND (storage.foldername(name))[1] = (public.get_user_org_id())::text
  );