-- BLOQUE A Part 2/4: ai_test_suites through document_embeddings

CREATE TABLE IF NOT EXISTS public.ai_test_suites (
  created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, is_required_for_publish BOOLEAN, name TEXT, pass_threshold INTEGER, task_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_test_suites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_test_suites_authenticated_read" ON public.ai_test_suites FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_test_suites_admin_all" ON public.ai_test_suites FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_tier_quotas (
  allowed_models TEXT[], created_at TIMESTAMPTZ DEFAULT NOW(), features JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), max_context_tokens INTEGER, monthly_requests INTEGER, monthly_tokens INTEGER, tier TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_tier_quotas ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_tier_quotas_authenticated_read" ON public.ai_tier_quotas FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_tier_quotas_admin_all" ON public.ai_tier_quotas FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_transaction_ledger (
  billable_amount NUMERIC, billing_strategy TEXT, client_id UUID, cost_input NUMERIC, cost_output NUMERIC, cost_total NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), error_code TEXT, error_message TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), input_tokens INTEGER, is_billable BOOLEAN, jurisdiction_code TEXT, latency_ms INTEGER, markup_percent INTEGER, matter_id UUID, model_code TEXT, model_id UUID, module TEXT, organization_id UUID, output_tokens INTEGER, provider_id UUID, routing_reason TEXT, routing_rule_id UUID, session_id UUID, status TEXT, task_type TEXT, total_tokens INTEGER, transaction_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW(), user_id UUID
);
ALTER TABLE public.ai_transaction_ledger ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_transaction_ledger_org_isolation" ON public.ai_transaction_ledger FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_translation_glossaries (
  created_at TIMESTAMPTZ DEFAULT NOW(), domain TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_official BOOLEAN, is_public BOOLEAN, name TEXT, organization_id UUID, source_language TEXT, target_language TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), user_id UUID
);
ALTER TABLE public.ai_translation_glossaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_translation_glossaries_org_isolation" ON public.ai_translation_glossaries FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_translations (
  character_count INTEGER, completed_at TIMESTAMPTZ, confidence_score NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), disclaimer_accepted BOOLEAN, disclaimer_accepted_at TIMESTAMPTZ, document_type TEXT, glossary_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, processing_time_ms INTEGER, source_language TEXT, source_text TEXT, status TEXT, target_language TEXT, terms_used JSONB, translated_text TEXT, user_id UUID, word_count INTEGER
);
ALTER TABLE public.ai_translations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_translations_org_isolation" ON public.ai_translations FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_usage_aggregates (
  avg_latency_ms INTEGER, by_model JSONB, by_task JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), failed_requests INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, p50_latency_ms INTEGER, p95_latency_ms INTEGER, p99_latency_ms INTEGER, period_end TEXT, period_start TEXT, period_type TEXT, successful_requests INTEGER, total_cost_usd NUMERIC, total_input_tokens INTEGER, total_output_tokens INTEGER, total_requests INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_usage_aggregates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_aggregates_org_isolation" ON public.ai_usage_aggregates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  conversation_id UUID, cost_usd NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), input_tokens INTEGER, jurisdiction_code TEXT, kb_chunks_used TEXT[], matter_id UUID, model_used TEXT, module TEXT, operation_type TEXT, organization_id UUID, output_tokens INTEGER, query_hash TEXT, response_quality INTEGER, total_tokens INTEGER, user_id UUID
);
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_events_org_isolation" ON public.ai_usage_events FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ai_usage_log (
  cache_read_tokens INTEGER, cache_write_tokens INTEGER, chat_message_id UUID, chat_session_id UUID, computer_use_steps INTEGER, context_id UUID, context_type TEXT, cost_cache_read_usd NUMERIC, cost_cache_write_usd NUMERIC, cost_computer_use_usd NUMERIC, cost_input_usd NUMERIC, cost_output_usd NUMERIC, cost_total_cents NUMERIC, cost_total_usd NUMERIC, cost_web_search_usd NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), function_name TEXT, had_retry BOOLEAN, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), input_tokens INTEGER, latency_ms INTEGER, model_id UUID, output_tokens INTEGER, processing_ms INTEGER, prompt_efficiency_score NUMERIC, provider TEXT, provider_code TEXT, retry_count INTEGER, status TEXT, stop_reason TEXT, success BOOLEAN, task_category TEXT, task_subcategory TEXT, tokens_input INTEGER, tokens_output INTEGER, user_id UUID, web_search_calls INTEGER
);
ALTER TABLE public.ai_usage_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_log_authenticated_read" ON public.ai_usage_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_usage_log_admin_all" ON public.ai_usage_log FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_usage_logs (
  chat_message_id UUID, chat_session_id UUID, cost_total_cents NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), latency_ms INTEGER, model_id UUID, provider_code TEXT, status TEXT, task_category TEXT, tokens_input INTEGER, tokens_output INTEGER, user_id UUID
);
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_logs_authenticated_read" ON public.ai_usage_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ai_usage_logs_admin_all" ON public.ai_usage_logs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ai_usage_monthly (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, period_end TEXT, period_start TEXT, total_agent_runs INTEGER, total_analyses INTEGER, total_cost_usd NUMERIC, total_generations INTEGER, total_input_tokens INTEGER, total_output_tokens INTEGER, total_queries INTEGER, total_tokens INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ai_usage_monthly ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ai_usage_monthly_org_isolation" ON public.ai_usage_monthly FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.api_connections (
  config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), credentials JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_error TEXT, last_sync_at TIMESTAMPTZ, organization_id UUID, provider TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.api_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_connections_org_isolation" ON public.api_connections FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.api_keys (
  allowed_ips JSONB, allowed_origins JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, description TEXT, expires_at TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, key_hash TEXT, key_prefix TEXT, last_used_at TIMESTAMPTZ, name TEXT, organization_id UUID, rate_limit_per_day NUMERIC, rate_limit_per_minute NUMERIC, scopes JSONB
);
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_keys_org_isolation" ON public.api_keys FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.api_logs (
  api_key_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), endpoint TEXT, error_message TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ip_address TEXT, method TEXT, organization_id UUID, query_params JSONB, request_body JSONB, response_size_bytes INTEGER, response_time_ms INTEGER, status_code INTEGER, user_agent TEXT
);
ALTER TABLE public.api_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_logs_org_isolation" ON public.api_logs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.api_rate_limits (
  created_at TIMESTAMPTZ DEFAULT NOW(), current_count INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), identifier TEXT, limit_count INTEGER, organization_id UUID, reset_at TIMESTAMPTZ, updated_at TIMESTAMPTZ DEFAULT NOW(), window_type TEXT
);
ALTER TABLE public.api_rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "api_rate_limits_org_isolation" ON public.api_rate_limits FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.bug_report_replies (
  content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_internal BOOLEAN, report_id UUID
);
ALTER TABLE public.bug_report_replies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bug_report_replies_authenticated_read" ON public.bug_report_replies FOR SELECT TO authenticated USING (true);
CREATE POLICY "bug_report_replies_admin_all" ON public.bug_report_replies FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.bug_reports (
  assigned_to UUID, browser TEXT, component TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, environment TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), os TEXT, priority TEXT, reported_by UUID, resolution TEXT, resolved_at TIMESTAMPTZ, screenshots TEXT[], severity TEXT, status TEXT, steps_to_reproduce TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), url TEXT
);
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bug_reports_authenticated_read" ON public.bug_reports FOR SELECT TO authenticated USING (true);
CREATE POLICY "bug_reports_admin_all" ON public.bug_reports FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.classification_sync_logs (
  created_at TIMESTAMPTZ DEFAULT NOW(), details JSONB, edition TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), items_added INTEGER, items_removed INTEGER, items_updated INTEGER, source TEXT, status TEXT, system TEXT
);
ALTER TABLE public.classification_sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classification_sync_logs_authenticated_read" ON public.classification_sync_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "classification_sync_logs_admin_all" ON public.classification_sync_logs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.classification_systems (
  created_at TIMESTAMPTZ DEFAULT NOW(), current_edition TEXT, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_synced_at TIMESTAMPTZ, name TEXT, source_url TEXT, system_code TEXT, total_items INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.classification_systems ENABLE ROW LEVEL SECURITY;
CREATE POLICY "classification_systems_authenticated_read" ON public.classification_systems FOR SELECT TO authenticated USING (true);
CREATE POLICY "classification_systems_admin_all" ON public.classification_systems FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.client_ai_billing_rules (
  ai_feature TEXT, billing_type TEXT, client_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_billable BOOLEAN, markup_percent INTEGER, max_monthly_amount NUMERIC, organization_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.client_ai_billing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_ai_billing_rules_org_isolation" ON public.client_ai_billing_rules FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_contacts (
  client_id UUID, contact_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_primary BOOLEAN, organization_id UUID, role TEXT
);
ALTER TABLE public.client_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_contacts_org_isolation" ON public.client_contacts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_folder_documents (
  client_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), document_id UUID, folder_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID
);
ALTER TABLE public.client_folder_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_folder_documents_org_isolation" ON public.client_folder_documents FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_folders (
  client_id UUID, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, documents_count INTEGER, icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_system BOOLEAN, name TEXT, organization_id UUID, parent_id UUID, sort_order INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.client_folders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_folders_org_isolation" ON public.client_folders FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_holders (
  client_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), holder_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_primary BOOLEAN, organization_id UUID, relationship_type TEXT
);
ALTER TABLE public.client_holders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_holders_org_isolation" ON public.client_holders FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_lookup_public (
  city TEXT, client_number TEXT, company_name TEXT, country TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), email TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, phone TEXT, status TEXT, type TEXT
);
ALTER TABLE public.client_lookup_public ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_lookup_public_authenticated_read" ON public.client_lookup_public FOR SELECT TO authenticated USING (true);
CREATE POLICY "client_lookup_public_admin_all" ON public.client_lookup_public FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.client_tag_categories (
  color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_system BOOLEAN, name TEXT, organization_id UUID, sort_order INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.client_tag_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_tag_categories_org_isolation" ON public.client_tag_categories FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_tag_config (
  category TEXT, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_system BOOLEAN, name TEXT, organization_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.client_tag_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_tag_config_org_isolation" ON public.client_tag_config FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_tags (
  client_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, tag_id UUID
);
ALTER TABLE public.client_tags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_tags_org_isolation" ON public.client_tags FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.client_type_config (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, organization_id UUID, type_code TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.client_type_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "client_type_config_org_isolation" ON public.client_type_config FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.clients (
  address TEXT, city TEXT, client_number TEXT, client_type TEXT, company_name TEXT, country TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, email TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, notes TEXT, organization_id UUID, phone TEXT, postal_code TEXT, preferred_language TEXT, rating INTEGER, source TEXT, state TEXT, status TEXT, tags TEXT[], tax_id TEXT, type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), website TEXT
);
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
CREATE POLICY "clients_org_isolation" ON public.clients FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.competitor_price_changes (
  change_type TEXT, competitor TEXT, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB, new_price NUMERIC, old_price NUMERIC, service_type TEXT
);
ALTER TABLE public.competitor_price_changes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitor_price_changes_authenticated_read" ON public.competitor_price_changes FOR SELECT TO authenticated USING (true);
CREATE POLICY "competitor_price_changes_admin_all" ON public.competitor_price_changes FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.competitor_scan_config (
  competitor_name TEXT, country_codes TEXT[], created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_scan_at TIMESTAMPTZ, scan_frequency TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), website_url TEXT
);
ALTER TABLE public.competitor_scan_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "competitor_scan_config_authenticated_read" ON public.competitor_scan_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "competitor_scan_config_admin_all" ON public.competitor_scan_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.contact_role_config (
  code TEXT, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, name_en TEXT, name_es TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.contact_role_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contact_role_config_authenticated_read" ON public.contact_role_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "contact_role_config_admin_all" ON public.contact_role_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.contextual_guide_progress (
  completed_at TIMESTAMPTZ, context_id TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), guide_id TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), step_progress JSONB, user_id UUID
);
ALTER TABLE public.contextual_guide_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "contextual_guide_progress_authenticated_read" ON public.contextual_guide_progress FOR SELECT TO authenticated USING (true);
CREATE POLICY "contextual_guide_progress_admin_all" ON public.contextual_guide_progress FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.correction_reason_codes (
  category TEXT, code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.correction_reason_codes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "correction_reason_codes_authenticated_read" ON public.correction_reason_codes FOR SELECT TO authenticated USING (true);
CREATE POLICY "correction_reason_codes_admin_all" ON public.correction_reason_codes FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.data_audit_log (
  action TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), details JSONB, entity_id UUID, entity_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), new_value JSONB, old_value JSONB, organization_id UUID, user_id UUID
);
ALTER TABLE public.data_audit_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "data_audit_log_org_isolation" ON public.data_audit_log FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.deadline_notifications (
  created_at TIMESTAMPTZ DEFAULT NOW(), deadline_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), message TEXT, notification_type TEXT, read_at TIMESTAMPTZ, sent_at TIMESTAMPTZ, user_id UUID
);
ALTER TABLE public.deadline_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deadline_notifications_authenticated_read" ON public.deadline_notifications FOR SELECT TO authenticated USING (true);
CREATE POLICY "deadline_notifications_admin_all" ON public.deadline_notifications FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.deadline_reminders (
  created_at TIMESTAMPTZ DEFAULT NOW(), deadline_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), reminder_date TIMESTAMPTZ, sent BOOLEAN, sent_at TIMESTAMPTZ, type TEXT
);
ALTER TABLE public.deadline_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deadline_reminders_authenticated_read" ON public.deadline_reminders FOR SELECT TO authenticated USING (true);
CREATE POLICY "deadline_reminders_admin_all" ON public.deadline_reminders FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.demand_signals (
  confidence NUMERIC, contact_info JSONB, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), detected_at TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_processed BOOLEAN, metadata JSONB, nice_classes INTEGER[], processed_at TIMESTAMPTZ, signal_source TEXT, signal_type TEXT, strength NUMERIC, trademark_name TEXT
);
ALTER TABLE public.demand_signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "demand_signals_authenticated_read" ON public.demand_signals FOR SELECT TO authenticated USING (true);
CREATE POLICY "demand_signals_admin_all" ON public.demand_signals FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.doc_templates (
  category TEXT, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, language TEXT, metadata JSONB, name TEXT, organization_id UUID, template_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), variables JSONB, version INTEGER
);
ALTER TABLE public.doc_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "doc_templates_org_isolation" ON public.doc_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.document_chunks (
  chunk_index INTEGER, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), document_id UUID, embedding TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB, token_count INTEGER
);
ALTER TABLE public.document_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_chunks_authenticated_read" ON public.document_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_chunks_admin_all" ON public.document_chunks FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.document_counters (
  counter_value INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), document_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, prefix TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), year INTEGER
);
ALTER TABLE public.document_counters ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_counters_org_isolation" ON public.document_counters FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.document_embeddings (
  chunk_text TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), document_id UUID, embedding TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB
);
ALTER TABLE public.document_embeddings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "document_embeddings_authenticated_read" ON public.document_embeddings FOR SELECT TO authenticated USING (true);
CREATE POLICY "document_embeddings_admin_all" ON public.document_embeddings FOR ALL TO authenticated USING (public.is_backoffice_staff());