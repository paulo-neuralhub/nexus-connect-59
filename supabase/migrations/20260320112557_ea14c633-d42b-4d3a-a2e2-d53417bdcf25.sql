-- BLOQUE A Part 4/4: legal_acceptances through vienna_sections

CREATE TABLE IF NOT EXISTS public.legal_acceptances (
  acceptance_method TEXT, accepted_at TIMESTAMPTZ, content_hash TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), document_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ip_address TEXT, organization_id UUID, signature_data JSONB, updated_at TIMESTAMPTZ DEFAULT NOW(), user_agent TEXT, user_id UUID, version_accepted TEXT
);
ALTER TABLE public.legal_acceptances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_acceptances_org_isolation" ON public.legal_acceptances FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.legal_deadlines_history (
  changed_at TIMESTAMPTZ, changed_by TEXT, field_changed TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), legal_deadline_id UUID, new_value TEXT, old_value TEXT, reason TEXT
);
ALTER TABLE public.legal_deadlines_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_deadlines_history_authenticated_read" ON public.legal_deadlines_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "legal_deadlines_history_admin_all" ON public.legal_deadlines_history FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.legal_document_contents (
  checkbox_text TEXT, code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), full_content TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, link_text TEXT, short_summary TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), updated_by UUID, version TEXT
);
ALTER TABLE public.legal_document_contents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_document_contents_authenticated_read" ON public.legal_document_contents FOR SELECT TO authenticated USING (true);
CREATE POLICY "legal_document_contents_admin_all" ON public.legal_document_contents FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.legal_documents (
  changelog TEXT, code TEXT, content TEXT, content_hash TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, doc_type TEXT, effective_date TIMESTAMPTZ, effective_from TEXT, effective_until TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, is_current BOOLEAN, language TEXT, organization_id UUID, requires_re_consent BOOLEAN, requires_signature BOOLEAN, show_on_ai_first_use BOOLEAN, signature_type TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), version TEXT
);
ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "legal_documents_org_isolation" ON public.legal_documents FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.locarno_classes (
  class_number INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, note_es TEXT, title_en TEXT, title_es TEXT, version TEXT
);
ALTER TABLE public.locarno_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locarno_classes_authenticated_read" ON public.locarno_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "locarno_classes_admin_all" ON public.locarno_classes FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.locarno_items (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, item_number TEXT, subclass_id UUID, term_en TEXT, term_es TEXT, version TEXT
);
ALTER TABLE public.locarno_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locarno_items_authenticated_read" ON public.locarno_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "locarno_items_admin_all" ON public.locarno_items FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.locarno_subclasses (
  class_id UUID, code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, title_en TEXT, title_es TEXT, version TEXT
);
ALTER TABLE public.locarno_subclasses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "locarno_subclasses_authenticated_read" ON public.locarno_subclasses FOR SELECT TO authenticated USING (true);
CREATE POLICY "locarno_subclasses_admin_all" ON public.locarno_subclasses FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.market_opportunities (
  country_iso2 TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, growth_rate NUMERIC, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), market_size INTEGER, opportunity_score NUMERIC
);
ALTER TABLE public.market_opportunities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "market_opportunities_authenticated_read" ON public.market_opportunities FOR SELECT TO authenticated USING (true);
CREATE POLICY "market_opportunities_admin_all" ON public.market_opportunities FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.model_change_history (
  change_reason TEXT, changed_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), function_name TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), new_model_id UUID, old_model_id UUID, suggestion_id UUID
);
ALTER TABLE public.model_change_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "model_change_history_authenticated_read" ON public.model_change_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "model_change_history_admin_all" ON public.model_change_history FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.monitored_deadlines (
  assigned_to UUID, completed_at TIMESTAMPTZ, completed_by TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), deadline_date TIMESTAMPTZ, deadline_type TEXT, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), last_reminder_sent TEXT, matter_id UUID, organization_id UUID, reminder_days INTEGER[], status TEXT, title TEXT, watch_result_id UUID
);
ALTER TABLE public.monitored_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "monitored_deadlines_org_isolation" ON public.monitored_deadlines FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.nice_products (
  added_at TIMESTAMPTZ, added_by TEXT, class_number INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, is_common BOOLEAN, name_en TEXT, name_es TEXT, search_keywords TEXT[], wipo_code TEXT
);
ALTER TABLE public.nice_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "nice_products_authenticated_read" ON public.nice_products FOR SELECT TO authenticated USING (true);
CREATE POLICY "nice_products_admin_all" ON public.nice_products FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_actions (
  action_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, deadline_date TIMESTAMPTZ, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jurisdiction_code TEXT, notes TEXT, office_reference TEXT, priority TEXT, response_date TIMESTAMPTZ, status TEXT, title TEXT, trademark_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.office_actions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_actions_authenticated_read" ON public.office_actions FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_actions_admin_all" ON public.office_actions FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_document_requirements (
  created_at TIMESTAMPTZ DEFAULT NOW(), default_template_id UUID, document_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), last_verified_date TIMESTAMPTZ, office_code TEXT, official_form_number TEXT, official_form_url TEXT, organization_id UUID, requirements JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.office_document_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_document_requirements_org_isolation" ON public.office_document_requirements FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.office_documents (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, download_status TEXT, downloaded_at TIMESTAMPTZ, error_message TEXT, file_name TEXT, file_path TEXT, file_size INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, mime_type TEXT, office_code TEXT, office_doc_date TIMESTAMPTZ, office_doc_id UUID, office_doc_type TEXT, office_metadata JSONB, tenant_id UUID, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.office_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_documents_authenticated_read" ON public.office_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_documents_admin_all" ON public.office_documents FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_file_imports (
  created_at TIMESTAMPTZ DEFAULT NOW(), errors JSONB, file_name TEXT, file_path TEXT, file_size INTEGER, file_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_status TEXT, office_code TEXT, processed_at TIMESTAMPTZ, processing_method TEXT, records_failed INTEGER, records_found INTEGER, records_imported INTEGER, records_updated INTEGER, requires_review BOOLEAN, reviewed_at TIMESTAMPTZ, reviewed_by TEXT, source_url TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.office_file_imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_file_imports_authenticated_read" ON public.office_file_imports FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_file_imports_admin_all" ON public.office_file_imports FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_holidays (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), holiday_date TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_recurring BOOLEAN, name TEXT, name_local TEXT, type TEXT
);
ALTER TABLE public.office_holidays ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_holidays_authenticated_read" ON public.office_holidays FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_holidays_admin_all" ON public.office_holidays FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_import_review_queue (
  action TEXT, admin_notes TEXT, confidence NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), field_name TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_id UUID, new_value TEXT, office_id UUID, old_value TEXT, reviewed_at TIMESTAMPTZ, reviewed_by TEXT, source TEXT, status TEXT
);
ALTER TABLE public.office_import_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_import_review_queue_authenticated_read" ON public.office_import_review_queue FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_import_review_queue_admin_all" ON public.office_import_review_queue FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_import_templates (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, field_mappings JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, source_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), validation_rules JSONB
);
ALTER TABLE public.office_import_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_import_templates_authenticated_read" ON public.office_import_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_import_templates_admin_all" ON public.office_import_templates FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_query_cache (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), expires_at TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), query_hash TEXT, response_data JSONB, service_type TEXT
);
ALTER TABLE public.office_query_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_query_cache_authenticated_read" ON public.office_query_cache FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_query_cache_admin_all" ON public.office_query_cache FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_request_logs (
  created_at TIMESTAMPTZ DEFAULT NOW(), error_message TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB, office_code TEXT, request_type TEXT, response_time_ms INTEGER, status TEXT, user_id UUID
);
ALTER TABLE public.office_request_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_request_logs_authenticated_read" ON public.office_request_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_request_logs_admin_all" ON public.office_request_logs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.office_status_mappings (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), internal_status TEXT, is_active BOOLEAN DEFAULT TRUE, office_code TEXT, office_status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.office_status_mappings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "office_status_mappings_authenticated_read" ON public.office_status_mappings FOR SELECT TO authenticated USING (true);
CREATE POLICY "office_status_mappings_admin_all" ON public.office_status_mappings FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.partners (
  address TEXT, city TEXT, commission_rate NUMERIC, contact_email TEXT, contact_name TEXT, contact_phone TEXT, country TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, notes TEXT, partner_type TEXT, payment_terms TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), website TEXT
);
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "partners_authenticated_read" ON public.partners FOR SELECT TO authenticated USING (true);
CREATE POLICY "partners_admin_all" ON public.partners FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.payment_settings (
  bank_details JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), currency TEXT, default_payment_terms INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_footer TEXT, invoice_notes TEXT, organization_id UUID, payment_methods JSONB, tax_config JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.payment_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payment_settings_org_isolation" ON public.payment_settings FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.predictive_alerts (
  alert_type TEXT, confidence NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, dismissed_at TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, metadata JSONB, organization_id UUID, priority TEXT, resolved_at TIMESTAMPTZ, status TEXT, title TEXT
);
ALTER TABLE public.predictive_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "predictive_alerts_org_isolation" ON public.predictive_alerts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.rag_chunks (
  chunk_index INTEGER, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), document_id UUID, embedding TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB, token_count INTEGER
);
ALTER TABLE public.rag_chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_chunks_authenticated_read" ON public.rag_chunks FOR SELECT TO authenticated USING (true);
CREATE POLICY "rag_chunks_admin_all" ON public.rag_chunks FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.rag_documents (
  chunk_count INTEGER, collection_id UUID, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), file_path TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), metadata JSONB, source TEXT, status TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.rag_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_documents_authenticated_read" ON public.rag_documents FOR SELECT TO authenticated USING (true);
CREATE POLICY "rag_documents_admin_all" ON public.rag_documents FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.rag_knowledge_bases (
  chunk_count INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, document_count INTEGER, embedding_model TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_synced_at TIMESTAMPTZ, name TEXT, organization_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.rag_knowledge_bases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_knowledge_bases_org_isolation" ON public.rag_knowledge_bases FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.rag_queries (
  chunks_retrieved INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), knowledge_base_id UUID, query_text TEXT, response_text TEXT, similarity_threshold NUMERIC, user_id UUID
);
ALTER TABLE public.rag_queries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_queries_authenticated_read" ON public.rag_queries FOR SELECT TO authenticated USING (true);
CREATE POLICY "rag_queries_admin_all" ON public.rag_queries FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.rag_search_logs (
  avg_similarity NUMERIC, chunks_returned INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), knowledge_base_id UUID, max_similarity NUMERIC, min_similarity NUMERIC, query_text TEXT, search_time_ms INTEGER, user_id UUID
);
ALTER TABLE public.rag_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rag_search_logs_authenticated_read" ON public.rag_search_logs FOR SELECT TO authenticated USING (true);
CREATE POLICY "rag_search_logs_admin_all" ON public.rag_search_logs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.renewal_schedule (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, next_renewal_date TIMESTAMPTZ, organization_id UUID, renewal_cost NUMERIC, renewal_number INTEGER, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.renewal_schedule ENABLE ROW LEVEL SECURITY;
CREATE POLICY "renewal_schedule_org_isolation" ON public.renewal_schedule FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.report_definitions (
  config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, organization_id UUID, report_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_definitions_org_isolation" ON public.report_definitions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.report_executions (
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), error_message TEXT, file_url TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, report_id UUID, started_at TIMESTAMPTZ, status TEXT, triggered_by UUID
);
ALTER TABLE public.report_executions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_executions_org_isolation" ON public.report_executions FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.report_templates (
  category TEXT, config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, organization_id UUID, template_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "report_templates_org_isolation" ON public.report_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.search_service_config (
  config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, service_key TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.search_service_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_service_config_authenticated_read" ON public.search_service_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "search_service_config_admin_all" ON public.search_service_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.search_synonyms (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, language TEXT, source_term TEXT, synonyms TEXT[], updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.search_synonyms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "search_synonyms_authenticated_read" ON public.search_synonyms FOR SELECT TO authenticated USING (true);
CREATE POLICY "search_synonyms_admin_all" ON public.search_synonyms FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.service_pricing_rules (
  base_price NUMERIC, conditions JSONB, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), currency TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, organization_id UUID, price_per_class NUMERIC, service_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.service_pricing_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_pricing_rules_org_isolation" ON public.service_pricing_rules FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.service_requests (
  client_id UUID, completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, priority TEXT, request_type TEXT, status TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.service_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_requests_org_isolation" ON public.service_requests FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.service_templates (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, organization_id UUID, service_type TEXT, steps JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.service_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_templates_org_isolation" ON public.service_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.similarity_analyses (
  analysis_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, organization_id UUID, results JSONB, search_term TEXT, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.similarity_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "similarity_analyses_org_isolation" ON public.similarity_analyses FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.site_config (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), value JSONB
);
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "site_config_authenticated_read" ON public.site_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "site_config_admin_all" ON public.site_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.surveillance_alerts (
  alert_type TEXT, confidence NUMERIC, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, metadata JSONB, organization_id UUID, resolved_at TIMESTAMPTZ, severity TEXT, source TEXT, status TEXT, title TEXT
);
ALTER TABLE public.surveillance_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "surveillance_alerts_org_isolation" ON public.surveillance_alerts FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.system_settings (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), key TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), value JSONB
);
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "system_settings_authenticated_read" ON public.system_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "system_settings_admin_all" ON public.system_settings FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.template_categories (
  color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.template_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_categories_authenticated_read" ON public.template_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "template_categories_admin_all" ON public.template_categories FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.template_field_validations (
  created_at TIMESTAMPTZ DEFAULT NOW(), error_message TEXT, field_name TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), template_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW(), validation_params JSONB, validation_type TEXT
);
ALTER TABLE public.template_field_validations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "template_field_validations_authenticated_read" ON public.template_field_validations FOR SELECT TO authenticated USING (true);
CREATE POLICY "template_field_validations_admin_all" ON public.template_field_validations FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.trademark_searches (
  classes INTEGER[], created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), jurisdictions TEXT[], matter_id UUID, organization_id UUID, results JSONB, search_term TEXT, search_type TEXT, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.trademark_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trademark_searches_org_isolation" ON public.trademark_searches FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.trademark_visuals (
  ai_analysis JSONB, color_palette TEXT[], created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, file_path TEXT, file_size INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_primary BOOLEAN, matter_id UUID, mime_type TEXT, organization_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW(), vienna_codes TEXT[]
);
ALTER TABLE public.trademark_visuals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "trademark_visuals_org_isolation" ON public.trademark_visuals FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.user_jurisdiction_preferences (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_favorite BOOLEAN, jurisdiction_code TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW(), user_id UUID
);
ALTER TABLE public.user_jurisdiction_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_jurisdiction_preferences_authenticated_read" ON public.user_jurisdiction_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_jurisdiction_preferences_admin_all" ON public.user_jurisdiction_preferences FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.user_template_preferences (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_favorite BOOLEAN, last_used_at TIMESTAMPTZ, template_id UUID, use_count INTEGER, user_id UUID
);
ALTER TABLE public.user_template_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "user_template_preferences_authenticated_read" ON public.user_template_preferences FOR SELECT TO authenticated USING (true);
CREATE POLICY "user_template_preferences_admin_all" ON public.user_template_preferences FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.vienna_categories (
  category_number INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), description_en TEXT, description_es TEXT, division_id UUID, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE
);
ALTER TABLE public.vienna_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vienna_categories_authenticated_read" ON public.vienna_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "vienna_categories_admin_all" ON public.vienna_categories FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.vienna_divisions (
  created_at TIMESTAMPTZ DEFAULT NOW(), description_en TEXT, description_es TEXT, division_number INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, section_id UUID
);
ALTER TABLE public.vienna_divisions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vienna_divisions_authenticated_read" ON public.vienna_divisions FOR SELECT TO authenticated USING (true);
CREATE POLICY "vienna_divisions_admin_all" ON public.vienna_divisions FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.vienna_sections (
  created_at TIMESTAMPTZ DEFAULT NOW(), description_en TEXT, description_es TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, section_number INTEGER
);
ALTER TABLE public.vienna_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vienna_sections_authenticated_read" ON public.vienna_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "vienna_sections_admin_all" ON public.vienna_sections FOR ALL TO authenticated USING (public.is_backoffice_staff());