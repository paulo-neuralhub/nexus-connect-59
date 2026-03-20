-- BLOQUE A Part 1/4: Tables admin_notifications through agent_query_log, ai_agent_* through ai_cost_log

CREATE TABLE IF NOT EXISTS public.admin_notifications (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_read BOOLEAN,
  message TEXT,
  metadata JSONB,
  severity TEXT,
  title TEXT,
  type TEXT
);
ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admin_notifications_authenticated_read" ON public.admin_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "admin_notifications_admin_all" ON public.admin_notifications FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_audit_log (
  action TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  details JSONB,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID
);
ALTER TABLE public.agent_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_audit_log_authenticated_read" ON public.agent_audit_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_audit_log_admin_all" ON public.agent_audit_log FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_badges (
  agent_id UUID,
  badge_type TEXT,
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  earned_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.agent_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_badges_authenticated_read" ON public.agent_badges FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_badges_admin_all" ON public.agent_badges FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_chat_messages (
  content TEXT,
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_tokens INTEGER,
  latency_ms INTEGER,
  metadata JSONB,
  model_used TEXT,
  output_tokens INTEGER,
  role TEXT,
  session_id UUID,
  tool_calls JSONB,
  tool_results JSONB
);
ALTER TABLE public.agent_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_chat_messages_authenticated_read" ON public.agent_chat_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_chat_messages_admin_all" ON public.agent_chat_messages FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_chat_sessions (
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at TIMESTAMPTZ,
  message_count INTEGER,
  model TEXT,
  status TEXT,
  title TEXT,
  total_cost_cents NUMERIC,
  user_id UUID
);
ALTER TABLE public.agent_chat_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_chat_sessions_authenticated_read" ON public.agent_chat_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_chat_sessions_admin_all" ON public.agent_chat_sessions FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_config (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  value JSONB
);
ALTER TABLE public.agent_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_config_authenticated_read" ON public.agent_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_config_admin_all" ON public.agent_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_emails (
  body_html TEXT,
  body_text TEXT,
  classification TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  from_address TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID,
  status TEXT,
  subject TEXT,
  to_address TEXT
);
ALTER TABLE public.agent_emails ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_emails_authenticated_read" ON public.agent_emails FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_emails_admin_all" ON public.agent_emails FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_instance_config (
  allowed_tools JSONB,
  brand_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  llm_max_tokens INTEGER,
  llm_model TEXT,
  llm_provider TEXT,
  llm_temperature INTEGER,
  memory_enabled BOOLEAN,
  rag_enabled BOOLEAN,
  rag_max_chunks INTEGER,
  rag_similarity_threshold INTEGER,
  system_prompt TEXT,
  tool_definitions JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agent_instance_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_instance_config_authenticated_read" ON public.agent_instance_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_instance_config_admin_all" ON public.agent_instance_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_jurisdiction_profiles (
  cases_processed INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  currency TEXT,
  expertise_description TEXT,
  flag_code TEXT,
  flag_emoji TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID,
  is_active BOOLEAN DEFAULT TRUE,
  jurisdiction_code TEXT,
  jurisdiction_name TEXT,
  kb_chunk_filter TEXT,
  kb_chunks_count INTEGER,
  kb_last_updated TEXT,
  kb_status TEXT,
  key_institutions TEXT[],
  legislation_refs TEXT[],
  official_language TEXT,
  sort_order INTEGER,
  system_prompt_extension TEXT,
  typical_timeline TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agent_jurisdiction_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_jurisdiction_profiles_authenticated_read" ON public.agent_jurisdiction_profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_jurisdiction_profiles_admin_all" ON public.agent_jurisdiction_profiles FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_learned_knowledge (
  answer_summary TEXT,
  category TEXT,
  confidence NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID,
  jurisdiction TEXT,
  knowledge_chunk TEXT,
  promoted_to_rag BOOLEAN,
  question_summary TEXT,
  times_confirmed INTEGER,
  times_used INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.agent_learned_knowledge ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_learned_knowledge_authenticated_read" ON public.agent_learned_knowledge FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_learned_knowledge_admin_all" ON public.agent_learned_knowledge FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_memory (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  fact_text TEXT,
  fact_type TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_id UUID,
  metadata JSONB,
  relevance_score NUMERIC,
  session_id UUID
);
ALTER TABLE public.agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_memory_authenticated_read" ON public.agent_memory FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_memory_admin_all" ON public.agent_memory FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_portal_monitors (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  last_run_at TIMESTAMPTZ,
  monitor_type TEXT,
  name TEXT
);
ALTER TABLE public.agent_portal_monitors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_portal_monitors_authenticated_read" ON public.agent_portal_monitors FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_portal_monitors_admin_all" ON public.agent_portal_monitors FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_providers_config (
  config_encrypted TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  provider_type TEXT
);
ALTER TABLE public.agent_providers_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_providers_config_authenticated_read" ON public.agent_providers_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_providers_config_admin_all" ON public.agent_providers_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.agent_query_log (
  aliases_detected JSONB,
  classes_requested INTEGER,
  country_codes_requested TEXT[],
  country_codes_resolved TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  had_missing_data BOOLEAN,
  had_stale_data BOOLEAN,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  min_confidence_returned INTEGER,
  response_ms INTEGER,
  results_found INTEGER,
  service_type TEXT,
  session_id UUID,
  tool_action TEXT,
  user_id UUID
);
ALTER TABLE public.agent_query_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "agent_query_log_authenticated_read" ON public.agent_query_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "agent_query_log_admin_all" ON public.agent_query_log FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_agent_messages (
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referenced_events TEXT[],
  referenced_organizations TEXT[],
  response_time_ms INTEGER,
  role TEXT,
  session_id UUID,
  tokens_used INTEGER,
  tools_used JSONB
);
ALTER TABLE public.ai_agent_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agent_messages_authenticated_read" ON public.ai_agent_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_agent_messages_admin_all" ON public.ai_agent_messages FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_agent_sessions (
  context JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_message_at TIMESTAMPTZ,
  metadata JSONB,
  status TEXT,
  title TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_id UUID
);
ALTER TABLE public.ai_agent_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_agent_sessions_authenticated_read" ON public.ai_agent_sessions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_agent_sessions_admin_all" ON public.ai_agent_sessions FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_annual_cost_summary (
  cost_trend_pct NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  most_expensive_module TEXT,
  organization_id UUID,
  total_cost_cents NUMERIC,
  total_requests INTEGER,
  year INTEGER
);
ALTER TABLE public.ai_annual_cost_summary ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_annual_cost_summary_org_isolation" ON public.ai_annual_cost_summary FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_budget_alerts (
  alert_type TEXT,
  budget_config_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_amount NUMERIC,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_read BOOLEAN,
  message TEXT,
  organization_id UUID,
  threshold_amount NUMERIC
);
ALTER TABLE public.ai_budget_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_budget_alerts_org_isolation" ON public.ai_budget_alerts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_budget_config (
  alert_thresholds INTEGER[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  max_cost_per_request_cents INTEGER,
  monthly_budget_cents INTEGER,
  organization_id UUID,
  per_module_limits JSONB,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_budget_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_budget_config_org_isolation" ON public.ai_budget_config FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_capabilities (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  key TEXT,
  name TEXT
);
ALTER TABLE public.ai_capabilities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_capabilities_authenticated_read" ON public.ai_capabilities FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_capabilities_admin_all" ON public.ai_capabilities FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_capability_assignments (
  capability_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT TRUE,
  organization_id UUID,
  plan_tier TEXT
);
ALTER TABLE public.ai_capability_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_capability_assignments_org_isolation" ON public.ai_capability_assignments FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_circuit_breaker_states (
  consecutive_failures INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  failure_count INTEGER,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  last_failure_at TIMESTAMPTZ,
  last_success_at TIMESTAMPTZ,
  next_retry_at TIMESTAMPTZ,
  provider_id UUID,
  state TEXT,
  success_count INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_circuit_breaker_states ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_circuit_breaker_states_authenticated_read" ON public.ai_circuit_breaker_states FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_circuit_breaker_states_admin_all" ON public.ai_circuit_breaker_states FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_cost_history (
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT,
  module TEXT,
  organization_id UUID,
  period_end TIMESTAMPTZ,
  period_start TIMESTAMPTZ,
  provider_id TEXT,
  request_count INTEGER,
  tokens_input INTEGER,
  tokens_output INTEGER
);
ALTER TABLE public.ai_cost_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_cost_history_org_isolation" ON public.ai_cost_history FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_cost_log (
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  execution_id UUID,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_tokens INTEGER,
  model_id TEXT,
  module TEXT,
  organization_id UUID,
  output_tokens INTEGER,
  prompt_id UUID,
  provider_id TEXT,
  user_id UUID
);
ALTER TABLE public.ai_cost_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_cost_log_org_isolation" ON public.ai_cost_log FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_execution_logs (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  error_message TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_data JSONB,
  input_tokens INTEGER,
  model_used TEXT,
  organization_id UUID,
  output_data JSONB,
  output_tokens INTEGER,
  prompt_id UUID,
  quality_score NUMERIC,
  status TEXT,
  task_id UUID,
  total_cost_cents NUMERIC,
  user_id UUID
);
ALTER TABLE public.ai_execution_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_execution_logs_org_isolation" ON public.ai_execution_logs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_function_config (
  config JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  enabled BOOLEAN,
  function_name TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_tokens INTEGER,
  model TEXT,
  system_prompt TEXT,
  temperature NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_function_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_function_config_authenticated_read" ON public.ai_function_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_function_config_admin_all" ON public.ai_function_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_generated_documents (
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  document_type TEXT,
  generated_by TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  language TEXT,
  matter_id UUID,
  metadata JSONB,
  model_used TEXT,
  organization_id UUID,
  prompt_used TEXT,
  quality_score NUMERIC,
  status TEXT,
  template_id UUID,
  title TEXT,
  tokens_used INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  version INTEGER
);
ALTER TABLE public.ai_generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_generated_documents_org_isolation" ON public.ai_generated_documents FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_glossary_terms (
  context TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  definition TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction TEXT,
  language TEXT,
  legal_area TEXT,
  source TEXT,
  term TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_glossary_terms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_glossary_terms_authenticated_read" ON public.ai_glossary_terms FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_glossary_terms_admin_all" ON public.ai_glossary_terms FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_kb_disclaimers (
  content TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  disclaimer_type TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  jurisdiction TEXT,
  language TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_kb_disclaimers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_kb_disclaimers_authenticated_read" ON public.ai_kb_disclaimers FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_kb_disclaimers_admin_all" ON public.ai_kb_disclaimers FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_kb_jurisdictions (
  content TEXT,
  content_type TEXT,
  country_code TEXT,
  country_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  language TEXT,
  legal_area TEXT,
  metadata JSONB,
  source TEXT,
  title TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_kb_jurisdictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_kb_jurisdictions_authenticated_read" ON public.ai_kb_jurisdictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_kb_jurisdictions_admin_all" ON public.ai_kb_jurisdictions FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_kb_legal_areas (
  content TEXT,
  content_type TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  jurisdiction TEXT,
  language TEXT,
  legal_area TEXT,
  metadata JSONB,
  source TEXT,
  title TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_kb_legal_areas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_kb_legal_areas_authenticated_read" ON public.ai_kb_legal_areas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_kb_legal_areas_admin_all" ON public.ai_kb_legal_areas FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_messages (
  content TEXT,
  conversation_id UUID,
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_tokens INTEGER,
  metadata JSONB,
  model TEXT,
  output_tokens INTEGER,
  role TEXT
);
ALTER TABLE public.ai_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_messages_authenticated_read" ON public.ai_messages FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_messages_admin_all" ON public.ai_messages FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_model_catalog (
  api_name TEXT,
  context_window INTEGER,
  cost_per_1m_input NUMERIC,
  cost_per_1m_output NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  max_output INTEGER,
  name TEXT,
  provider TEXT,
  supports_tools BOOLEAN,
  supports_vision BOOLEAN,
  tier TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_model_catalog ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_model_catalog_authenticated_read" ON public.ai_model_catalog FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_model_catalog_admin_all" ON public.ai_model_catalog FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_model_prices (
  cost_per_1m_input NUMERIC,
  cost_per_1m_output NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  effective_date TIMESTAMPTZ,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id TEXT,
  provider_id TEXT,
  source TEXT
);
ALTER TABLE public.ai_model_prices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_model_prices_authenticated_read" ON public.ai_model_prices FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_model_prices_admin_all" ON public.ai_model_prices FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_module_config (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  default_model TEXT,
  description TEXT,
  fallback_model TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT TRUE,
  max_requests_per_hour INTEGER,
  max_tokens INTEGER,
  module_key TEXT,
  module_name TEXT,
  system_prompt TEXT,
  temperature NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_module_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_module_config_authenticated_read" ON public.ai_module_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_module_config_admin_all" ON public.ai_module_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_module_usage (
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_key TEXT,
  month INTEGER,
  organization_id UUID,
  request_count INTEGER,
  tokens_used INTEGER,
  year INTEGER
);
ALTER TABLE public.ai_module_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_module_usage_org_isolation" ON public.ai_module_usage FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_optimization_suggestions (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_cost_cents NUMERIC,
  estimated_savings_cents NUMERIC,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  implemented_at TIMESTAMPTZ,
  is_implemented BOOLEAN,
  organization_id UUID,
  suggestion_text TEXT,
  suggestion_type TEXT
);
ALTER TABLE public.ai_optimization_suggestions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_optimization_suggestions_org_isolation" ON public.ai_optimization_suggestions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_prompt_changes (
  change_type TEXT,
  changed_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  diff_summary TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  new_version_id UUID,
  old_version_id UUID,
  prompt_id UUID
);
ALTER TABLE public.ai_prompt_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompt_changes_authenticated_read" ON public.ai_prompt_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_prompt_changes_admin_all" ON public.ai_prompt_changes FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_prompt_comments (
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt_id UUID,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID
);
ALTER TABLE public.ai_prompt_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompt_comments_authenticated_read" ON public.ai_prompt_comments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_prompt_comments_admin_all" ON public.ai_prompt_comments FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_prompt_templates (
  category TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  name TEXT,
  system_prompt TEXT,
  task_type TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  user_prompt_template TEXT,
  variables JSONB
);
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_prompt_templates_authenticated_read" ON public.ai_prompt_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_prompt_templates_admin_all" ON public.ai_prompt_templates FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_provider_connections (
  api_key_encrypted TEXT,
  base_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  organization_id UUID,
  provider_code TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_provider_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_provider_connections_org_isolation" ON public.ai_provider_connections FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_provider_health (
  avg_latency_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  error_rate NUMERIC,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_healthy BOOLEAN,
  last_check_at TIMESTAMPTZ,
  last_error TEXT,
  provider_id UUID,
  success_rate NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_provider_health ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_provider_health_authenticated_read" ON public.ai_provider_health FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_provider_health_admin_all" ON public.ai_provider_health FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_provider_health_log (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  error_count INTEGER,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  latency_p50_ms INTEGER,
  latency_p99_ms INTEGER,
  provider_id UUID,
  request_count INTEGER,
  success_count INTEGER,
  window_end TIMESTAMPTZ,
  window_start TIMESTAMPTZ
);
ALTER TABLE public.ai_provider_health_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_provider_health_log_authenticated_read" ON public.ai_provider_health_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_provider_health_log_admin_all" ON public.ai_provider_health_log FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_quality_evaluations (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  evaluated_by UUID,
  evaluation_criteria JSONB,
  execution_id UUID,
  feedback TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  overall_score NUMERIC,
  prompt_id UUID
);
ALTER TABLE public.ai_quality_evaluations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_quality_evaluations_authenticated_read" ON public.ai_quality_evaluations FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_quality_evaluations_admin_all" ON public.ai_quality_evaluations FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_rag_collections (
  chunk_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  description TEXT,
  embedding_model TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_active BOOLEAN DEFAULT TRUE,
  last_synced_at TIMESTAMPTZ,
  name TEXT,
  organization_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_rag_collections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_rag_collections_org_isolation" ON public.ai_rag_collections FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_rate_limits (
  cooldown_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  current_count INTEGER,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  limit_type TEXT,
  max_count INTEGER,
  organization_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  window_start TIMESTAMPTZ
);
ALTER TABLE public.ai_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_rate_limits_org_isolation" ON public.ai_rate_limits FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_request_logs (
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  error_message TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_tokens INTEGER,
  model_id TEXT,
  organization_id UUID,
  output_tokens INTEGER,
  prompt_id UUID,
  provider_id TEXT,
  status TEXT,
  user_id UUID
);
ALTER TABLE public.ai_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_request_logs_org_isolation" ON public.ai_request_logs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_research_reports (
  content TEXT,
  country_code TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metadata JSONB,
  model_used TEXT,
  report_type TEXT,
  sources JSONB,
  status TEXT,
  title TEXT,
  tokens_used INTEGER,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_research_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_research_reports_authenticated_read" ON public.ai_research_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_research_reports_admin_all" ON public.ai_research_reports FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_task_assignments (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  fallback_model_id TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  max_tokens INTEGER,
  primary_model_id TEXT,
  task_id UUID,
  temperature NUMERIC,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_task_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_task_assignments_authenticated_read" ON public.ai_task_assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_task_assignments_admin_all" ON public.ai_task_assignments FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_task_rag_config (
  chunk_overlap INTEGER,
  chunk_size INTEGER,
  collection_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  is_enabled BOOLEAN DEFAULT TRUE,
  max_chunks INTEGER,
  similarity_threshold NUMERIC,
  task_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_task_rag_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_task_rag_config_authenticated_read" ON public.ai_task_rag_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_task_rag_config_admin_all" ON public.ai_task_rag_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_test_cases (
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expected_output TEXT,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  input_variables JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  name TEXT,
  suite_id UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  weight NUMERIC
);
ALTER TABLE public.ai_test_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_test_cases_authenticated_read" ON public.ai_test_cases FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_test_cases_admin_all" ON public.ai_test_cases FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_test_results (
  actual_output TEXT,
  cost_cents NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  duration_ms INTEGER,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_used TEXT,
  passed BOOLEAN,
  prompt_version_id UUID,
  quality_score NUMERIC,
  run_id UUID,
  test_case_id UUID
);
ALTER TABLE public.ai_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_test_results_authenticated_read" ON public.ai_test_results FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_test_results_admin_all" ON public.ai_test_results FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_test_runs (
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  passed_count INTEGER,
  prompt_version_id UUID,
  status TEXT,
  suite_id UUID,
  total_count INTEGER
);
ALTER TABLE public.ai_test_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_test_runs_authenticated_read" ON public.ai_test_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_test_runs_admin_all" ON public.ai_test_runs FOR ALL TO authenticated USING (public.is_backoffice_staff());