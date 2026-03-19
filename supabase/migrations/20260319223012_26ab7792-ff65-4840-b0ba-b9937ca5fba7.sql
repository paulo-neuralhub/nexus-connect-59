
-- ============================================================
-- PHASE 2: SECONDARY TABLES
-- ============================================================

-- 14. INVOICES
CREATE TABLE IF NOT EXISTS public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  invoice_number text NOT NULL,
  invoice_series text,
  invoice_type text DEFAULT 'FC',
  corrected_invoice_id uuid,
  correction_reason text,
  correction_description text,
  billing_client_id uuid,
  client_name text NOT NULL,
  client_tax_id text,
  client_address text,
  invoice_date timestamptz NOT NULL DEFAULT now(),
  due_date timestamptz,
  tax_point_date timestamptz,
  period_start timestamptz,
  period_end timestamptz,
  subtotal numeric NOT NULL DEFAULT 0,
  tax_rate numeric DEFAULT 21,
  tax_amount numeric DEFAULT 0,
  discount_amount numeric DEFAULT 0,
  vat_breakdown jsonb,
  total_surcharge numeric DEFAULT 0,
  total_withholding numeric DEFAULT 0,
  withholding_percent numeric DEFAULT 0,
  total numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'draft',
  paid_amount numeric DEFAULT 0,
  paid_date timestamptz,
  payment_method text,
  payment_method_code text,
  payment_reference text,
  bank_account text,
  notes text,
  internal_notes text,
  footer_text text,
  pdf_url text,
  sii_status text,
  sii_csv text,
  sii_sent_at timestamptz,
  sii_response jsonb,
  sii_registration_key text,
  tbai_status text,
  tbai_identifier text,
  tbai_qr_url text,
  tbai_signature text,
  tbai_sent_at timestamptz,
  tbai_chain_hash text,
  verifactu_status text,
  verifactu_id text,
  verifactu_qr text,
  verifactu_hash text,
  verifactu_sent_at timestamptz,
  facturae_xml text,
  facturae_signed boolean DEFAULT false,
  facturae_certificate_id text,
  sent_at timestamptz,
  sent_to_email text,
  viewed_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage invoices" ON public.invoices FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 15. COMMUNICATIONS
CREATE TABLE IF NOT EXISTS public.communications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.contacts(id),
  contact_id uuid REFERENCES public.contacts(id),
  matter_id uuid REFERENCES public.matters(id),
  channel text NOT NULL DEFAULT 'email',
  direction text NOT NULL DEFAULT 'inbound',
  channel_config_id uuid,
  subject text,
  body text,
  body_html text,
  body_preview text,
  attachments jsonb DEFAULT '[]',
  ai_category text,
  ai_subcategory text,
  ai_priority integer,
  ai_confidence numeric,
  ai_classified_at timestamptz,
  ai_model text,
  manual_category text,
  manual_priority integer,
  classified_by uuid,
  classified_at timestamptz,
  external_id text,
  external_metadata jsonb DEFAULT '{}',
  email_from text,
  email_to text[],
  email_cc text[],
  email_bcc text[],
  email_message_id text,
  email_thread_id text,
  email_in_reply_to text,
  whatsapp_from text,
  whatsapp_to text,
  whatsapp_type text,
  whatsapp_media_url text,
  phone_from text,
  phone_to text,
  phone_duration_seconds integer,
  phone_recording_url text,
  is_read boolean DEFAULT false,
  read_at timestamptz,
  read_by uuid,
  is_replied boolean DEFAULT false,
  replied_at timestamptz,
  reply_comm_id uuid,
  is_archived boolean DEFAULT false,
  archived_at timestamptz,
  is_starred boolean DEFAULT false,
  assigned_to uuid,
  assigned_at timestamptz,
  received_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage communications" ON public.communications FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 16. ACTIVITY_LOG (generic audit/activity log)
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text,
  entity_id uuid,
  matter_id uuid REFERENCES public.matters(id),
  client_id uuid REFERENCES public.contacts(id),
  action text NOT NULL,
  title text,
  description text,
  old_value jsonb,
  new_value jsonb,
  metadata jsonb DEFAULT '{}',
  source text,
  ip_address text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read activity_log" ON public.activity_log FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 17. ACTIVITY_ACTION_TYPES
CREATE TABLE IF NOT EXISTS public.activity_action_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text NOT NULL,
  category text,
  icon text,
  color text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.activity_action_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read action_types" ON public.activity_action_types FOR SELECT TO authenticated USING (true);

-- 18. AUDIT_LOGS
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  entity_type text,
  entity_id uuid,
  old_data jsonb,
  new_data jsonb,
  metadata jsonb DEFAULT '{}',
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read audit_logs" ON public.audit_logs FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 19. ACCESS_AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.access_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  action text NOT NULL,
  resource_type text,
  resource_id uuid,
  granted boolean DEFAULT true,
  reason text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.access_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members read access_audit_log" ON public.access_audit_log FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 20. CONSENT_AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.consent_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  event_type text NOT NULL,
  consent_type text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  document_version text,
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.consent_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage consent_audit_log" ON public.consent_audit_log FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 21. SETTINGS_AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.settings_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  setting_key text NOT NULL,
  old_value jsonb,
  new_value jsonb,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.settings_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage settings_audit_log" ON public.settings_audit_log FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 22. SIGNATURE_AUDIT_LOG
CREATE TABLE IF NOT EXISTS public.signature_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  signature_request_id uuid,
  signer_id uuid,
  action text NOT NULL,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.signature_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users manage signature_audit_log" ON public.signature_audit_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 23. CLIENT_DOCUMENTS
CREATE TABLE IF NOT EXISTS public.client_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  matter_id uuid REFERENCES public.matters(id),
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_size bigint,
  mime_type text,
  file_hash text,
  doc_type text DEFAULT 'otro',
  doc_type_confidence numeric,
  doc_type_verified boolean DEFAULT false,
  title text,
  description text,
  validity_status text DEFAULT 'pending_verification',
  valid_from timestamptz,
  valid_until timestamptz,
  validity_verified boolean DEFAULT false,
  validity_verified_by uuid,
  validity_verified_at timestamptz,
  ocr_text text,
  ocr_completed_at timestamptz,
  ocr_confidence numeric,
  ner_status text DEFAULT 'pending',
  ner_completed_at timestamptz,
  ner_model text,
  embedding_status text DEFAULT 'pending',
  tags text[],
  notes text,
  visible_in_portal boolean DEFAULT false,
  version integer DEFAULT 1,
  parent_document_id uuid,
  uploaded_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  deleted_at timestamptz
);
ALTER TABLE public.client_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage client_documents" ON public.client_documents FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 24. CLIENT_RELATIONSHIPS
CREATE TABLE IF NOT EXISTS public.client_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  related_client_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  relationship_type text NOT NULL,
  description text,
  is_primary boolean DEFAULT false,
  valid_from timestamptz,
  valid_until timestamptz,
  metadata jsonb DEFAULT '{}',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.client_relationships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage client_relationships" ON public.client_relationships FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 25. WATCHLISTS
CREATE TABLE IF NOT EXISTS public.watchlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  owner_type text NOT NULL DEFAULT 'tenant',
  name text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'trademark',
  watch_terms text[] DEFAULT '{}',
  watch_classes integer[] DEFAULT '{}',
  watch_jurisdictions text[] DEFAULT '{}',
  matter_id uuid REFERENCES public.matters(id),
  similarity_threshold numeric DEFAULT 0.7,
  filter_config jsonb DEFAULT '{}',
  watch_type text DEFAULT 'text',
  image_url text,
  image_embedding numeric[],
  color_palette text[],
  visual_threshold numeric DEFAULT 0.7,
  notify_email boolean DEFAULT true,
  notify_in_app boolean DEFAULT true,
  notify_frequency text DEFAULT 'daily',
  notify_users text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  run_frequency text DEFAULT 'daily',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage watchlists" ON public.watchlists FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 26. PROVISIONS
CREATE TABLE IF NOT EXISTS public.provisions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  client_id uuid REFERENCES public.contacts(id),
  matter_id uuid REFERENCES public.matters(id),
  concept text NOT NULL,
  description text,
  amount numeric NOT NULL DEFAULT 0,
  currency text DEFAULT 'EUR',
  status text NOT NULL DEFAULT 'pending',
  requested_at timestamptz,
  received_at timestamptz,
  payment_reference text,
  payment_date timestamptz,
  used_amount numeric DEFAULT 0,
  used_for text,
  returned_amount numeric DEFAULT 0,
  returned_at timestamptz,
  quote_id uuid,
  quote_line_id uuid,
  invoice_id uuid,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.provisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage provisions" ON public.provisions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 27. AI_PROVIDERS
CREATE TABLE IF NOT EXISTS public.ai_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL,
  api_key_encrypted text,
  base_url text,
  is_gateway boolean DEFAULT false,
  supports_chat boolean DEFAULT true,
  supports_embeddings boolean DEFAULT false,
  supports_vision boolean DEFAULT false,
  supports_tools boolean DEFAULT false,
  status text NOT NULL DEFAULT 'active',
  health_status text DEFAULT 'unknown',
  last_health_check_at timestamptz,
  health_latency_ms integer,
  consecutive_failures integer DEFAULT 0,
  circuit_open boolean DEFAULT false,
  logo_url text,
  config jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ai_providers" ON public.ai_providers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage ai_providers" ON public.ai_providers FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 28. IPO_OFFICES
CREATE TABLE IF NOT EXISTS public.ipo_offices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_official text NOT NULL,
  name_short text,
  country_code text,
  country_name text,
  flag_emoji text,
  region text,
  office_type text DEFAULT 'national',
  data_source_type text,
  api_url text,
  api_config jsonb DEFAULT '{}',
  credentials_encrypted text,
  operational_status text DEFAULT 'unknown',
  is_active boolean DEFAULT true,
  tier text DEFAULT 'standard',
  last_health_check timestamptz,
  avg_response_time_ms integer,
  supported_ip_types text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ipo_offices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read ipo_offices" ON public.ipo_offices FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage ipo_offices" ON public.ipo_offices FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 29. IPO_SYNC_LOGS
CREATE TABLE IF NOT EXISTS public.ipo_sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id uuid REFERENCES public.ipo_offices(id),
  office_code text,
  sync_type text,
  status text NOT NULL DEFAULT 'running',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  matters_checked integer DEFAULT 0,
  matters_updated integer DEFAULT 0,
  documents_downloaded integer DEFAULT 0,
  deadlines_created integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_details jsonb DEFAULT '[]',
  triggered_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ipo_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage ipo_sync_logs" ON public.ipo_sync_logs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 30. GENERATED_REPORTS
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  title text NOT NULL,
  parameters jsonb DEFAULT '{}',
  file_url text,
  file_format text DEFAULT 'pdf',
  status text NOT NULL DEFAULT 'generating',
  generated_by uuid,
  error_message text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage generated_reports" ON public.generated_reports FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 31. SCHEDULED_REPORTS
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  report_type text NOT NULL,
  title text NOT NULL,
  frequency text NOT NULL DEFAULT 'weekly',
  parameters jsonb DEFAULT '{}',
  recipients text[] DEFAULT '{}',
  is_active boolean DEFAULT true,
  last_run_at timestamptz,
  next_run_at timestamptz,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage scheduled_reports" ON public.scheduled_reports FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 32. SEARCH_HISTORY
CREATE TABLE IF NOT EXISTS public.search_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  query text NOT NULL,
  filters jsonb DEFAULT '{}',
  entity_types text[] DEFAULT '{}',
  total_results integer DEFAULT 0,
  source text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.search_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own search_history" ON public.search_history FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 33. ROLE_PERMISSIONS
CREATE TABLE IF NOT EXISTS public.role_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role_id uuid,
  scope text NOT NULL,
  resource text NOT NULL,
  actions text[] DEFAULT '{}',
  conditions jsonb DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.role_permissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read role_permissions" ON public.role_permissions FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage role_permissions" ON public.role_permissions FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 34. USER_PRESENCE
CREATE TABLE IF NOT EXISTS public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  status text DEFAULT 'online',
  current_matter_id uuid REFERENCES public.matters(id),
  last_seen_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage user_presence" ON public.user_presence FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 35. PUSH_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  endpoint text NOT NULL,
  p256dh text,
  auth_key text,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own push_subscriptions" ON public.push_subscriptions FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 36. HELP_RULES
CREATE TABLE IF NOT EXISTS public.help_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  rule_type text DEFAULT 'contextual',
  trigger_config jsonb DEFAULT '{}',
  action_config jsonb DEFAULT '{}',
  priority integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read help_rules" ON public.help_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "Authenticated manage help_rules" ON public.help_rules FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 37. HELP_RULE_EXECUTION_LOG
CREATE TABLE IF NOT EXISTS public.help_rule_execution_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid REFERENCES public.help_rules(id) ON DELETE CASCADE,
  user_id uuid,
  organization_id uuid REFERENCES public.organizations(id),
  trigger_data jsonb DEFAULT '{}',
  result text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_rule_execution_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage help_rule_execution_log" ON public.help_rule_execution_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 38. HELP_TOUR_PROGRESS
CREATE TABLE IF NOT EXISTS public.help_tour_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  tour_id text NOT NULL,
  step_index integer DEFAULT 0,
  completed boolean DEFAULT false,
  completed_at timestamptz,
  skipped boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, tour_id)
);
ALTER TABLE public.help_tour_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own help_tour_progress" ON public.help_tour_progress FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 39. HELP_ANNOUNCEMENT_READS
CREATE TABLE IF NOT EXISTS public.help_announcement_reads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  announcement_id text NOT NULL,
  read_at timestamptz DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, announcement_id)
);
ALTER TABLE public.help_announcement_reads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own help_announcement_reads" ON public.help_announcement_reads FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 40. HELP_ARTICLE_FEEDBACK
CREATE TABLE IF NOT EXISTS public.help_article_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id text NOT NULL,
  user_id uuid,
  rating integer,
  comment text,
  helpful boolean,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.help_article_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage help_article_feedback" ON public.help_article_feedback FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 41. GENIUS_TRADEMARK_COMPARISONS
CREATE TABLE IF NOT EXISTS public.genius_trademark_comparisons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  term_a text NOT NULL,
  term_b text NOT NULL,
  image_a_url text,
  image_b_url text,
  overall_score numeric,
  phonetic_score numeric,
  visual_score numeric,
  conceptual_score numeric,
  analysis_method text DEFAULT 'ai',
  analysis_details jsonb DEFAULT '{}',
  ai_explanation text,
  ai_recommendation text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.genius_trademark_comparisons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage genius_comparisons" ON public.genius_trademark_comparisons FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 42. LEGALOPS_AI_INTERACTIONS
CREATE TABLE IF NOT EXISTS public.legalops_ai_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id uuid,
  client_id uuid REFERENCES public.contacts(id),
  matter_id uuid REFERENCES public.matters(id),
  interaction_type text NOT NULL,
  input_text text,
  input_tokens integer,
  input_metadata jsonb DEFAULT '{}',
  output_text text,
  output_tokens integer,
  output_metadata jsonb DEFAULT '{}',
  sources jsonb DEFAULT '[]',
  confidence numeric,
  confidence_level text,
  model_provider text,
  model_name text,
  model_version text,
  latency_ms integer,
  cost_usd numeric,
  user_feedback text,
  user_correction text,
  feedback_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legalops_ai_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage legalops_ai_interactions" ON public.legalops_ai_interactions FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 43. LEGALOPS_AI_FEEDBACK
CREATE TABLE IF NOT EXISTS public.legalops_ai_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  interaction_id uuid REFERENCES public.legalops_ai_interactions(id),
  user_id uuid NOT NULL,
  feedback_type text NOT NULL,
  original_output text,
  corrected_output text,
  feedback_comment text,
  approved_for_training boolean DEFAULT false,
  training_exported_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.legalops_ai_feedback ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage legalops_ai_feedback" ON public.legalops_ai_feedback FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 44. EXTRACTION_SUGGESTION_LOG
CREATE TABLE IF NOT EXISTS public.extraction_suggestion_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  document_id uuid,
  entity_type text,
  suggested_value text,
  accepted_value text,
  was_accepted boolean,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.extraction_suggestion_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage extraction_suggestion_log" ON public.extraction_suggestion_log FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 45. NICE_IMPORT_LOG
CREATE TABLE IF NOT EXISTS public.nice_import_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  import_type text,
  source text,
  classes_imported integer DEFAULT 0,
  products_imported integer DEFAULT 0,
  errors_count integer DEFAULT 0,
  error_details jsonb DEFAULT '[]',
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nice_import_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage nice_import_log" ON public.nice_import_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 46. NICE_REVISION_LOG
CREATE TABLE IF NOT EXISTS public.nice_revision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_number integer,
  action text NOT NULL,
  details jsonb DEFAULT '{}',
  performed_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.nice_revision_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage nice_revision_log" ON public.nice_revision_log FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 47. TICKET_MESSAGES
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid,
  sender_id uuid,
  sender_type text DEFAULT 'user',
  content text NOT NULL,
  attachments jsonb DEFAULT '[]',
  is_internal boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated manage ticket_messages" ON public.ticket_messages FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 48. MARKET_USERS
CREATE TABLE IF NOT EXISTS public.market_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid,
  organization_id uuid REFERENCES public.organizations(id),
  display_name text,
  avatar_url text,
  company_name text,
  country text,
  bio text,
  specializations text[] DEFAULT '{}',
  languages text[] DEFAULT '{}',
  is_agent boolean DEFAULT false,
  is_active boolean DEFAULT true,
  user_type text DEFAULT 'requester',
  rating_avg numeric DEFAULT 0,
  rating_count integer DEFAULT 0,
  success_rate numeric DEFAULT 0,
  total_transactions integer DEFAULT 0,
  verified boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.market_users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone read active market_users" ON public.market_users FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users manage own market_users" ON public.market_users FOR ALL TO authenticated
  USING (auth_user_id = auth.uid()) WITH CHECK (auth_user_id = auth.uid());

-- 49. MIGRATION_LEARNED_MAPPINGS
CREATE TABLE IF NOT EXISTS public.migration_learned_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type text NOT NULL,
  source_field text NOT NULL,
  target_field text NOT NULL,
  confidence numeric DEFAULT 1.0,
  usage_count integer DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.migration_learned_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Org members manage migration_learned_mappings" ON public.migration_learned_mappings FOR ALL TO authenticated
  USING (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()))
  WITH CHECK (organization_id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()));

-- 50. RELATIONSHIP_TO_PARTY_MAPPING
CREATE TABLE IF NOT EXISTS public.relationship_to_party_mapping (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  relationship_type text NOT NULL,
  party_role_code text NOT NULL,
  auto_import boolean DEFAULT true,
  ip_types text[] DEFAULT '{}',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.relationship_to_party_mapping ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated read relationship_to_party_mapping" ON public.relationship_to_party_mapping FOR SELECT TO authenticated USING (true);
