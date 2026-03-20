-- BLOQUE A Part 3/4: finance_categories through jurisdictions

CREATE TABLE IF NOT EXISTS public.finance_categories (
  auto_track BOOLEAN, category_id UUID, channel TEXT, color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, sort_order INTEGER, type TEXT
);
ALTER TABLE public.finance_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_categories_authenticated_read" ON public.finance_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "finance_categories_admin_all" ON public.finance_categories FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.finance_vendors (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, type TEXT, website TEXT
);
ALTER TABLE public.finance_vendors ENABLE ROW LEVEL SECURITY;
CREATE POLICY "finance_vendors_authenticated_read" ON public.finance_vendors FOR SELECT TO authenticated USING (true);
CREATE POLICY "finance_vendors_admin_all" ON public.finance_vendors FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.frontend_error_log (
  created_at TIMESTAMPTZ DEFAULT NOW(), error_code TEXT, error_message TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), page_url TEXT, table_name TEXT, user_agent TEXT
);
ALTER TABLE public.frontend_error_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "frontend_error_log_authenticated_read" ON public.frontend_error_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "frontend_error_log_admin_all" ON public.frontend_error_log FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.gazette_sources (
  code TEXT, country TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_issue_date TIMESTAMPTZ, last_scraped_at TIMESTAMPTZ, name TEXT, scrape_config JSONB, scrape_frequency TEXT, source_type TEXT, url TEXT
);
ALTER TABLE public.gazette_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "gazette_sources_authenticated_read" ON public.gazette_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "gazette_sources_admin_all" ON public.gazette_sources FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.generated_documents (
  ai_model_used TEXT, ai_prompt_used TEXT, ai_tokens_used INTEGER, category TEXT, client_id UUID, contact_id UUID, content TEXT, content_html TEXT, content_json JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, currency TEXT, discount_amount NUMERIC, document_data JSONB, document_date TIMESTAMPTZ, document_number TEXT, document_type_id UUID, due_date TIMESTAMPTZ, export_format TEXT, exported_at TIMESTAMPTZ, exported_document_id UUID, generation_time_ms INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), invoice_id UUID, matter_id UUID, name TEXT, organization_id UUID, paid_at TIMESTAMPTZ, parent_document_id UUID, parent_id UUID, pdf_url TEXT, sent_at TIMESTAMPTZ, sent_to TEXT, status TEXT, style_code TEXT, style_id UUID, subtotal INTEGER, tax_amount NUMERIC, template_id UUID, title TEXT, total_amount NUMERIC, updated_at TIMESTAMPTZ DEFAULT NOW(), user_feedback TEXT, user_rating INTEGER, variables_input JSONB, variables_resolved JSONB, version INTEGER, word_html TEXT
);
ALTER TABLE public.generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "generated_documents_org_isolation" ON public.generated_documents FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.genius_generated_documents (
  citations JSONB, content_html TEXT, content_markdown TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), disclaimer_accepted BOOLEAN, disclaimer_accepted_at TIMESTAMPTZ, document_type TEXT, estimated_fees JSONB, export_formats JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), input_data JSONB, legal_analysis JSONB, organization_id UUID, risk_assessment JSONB, title TEXT, tone TEXT, trademark_analysis JSONB, updated_at TIMESTAMPTZ DEFAULT NOW(), user_approved BOOLEAN, user_id UUID, user_notes TEXT, verification_status TEXT, verification_warnings JSONB, verified_at TIMESTAMPTZ
);
ALTER TABLE public.genius_generated_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genius_generated_documents_org_isolation" ON public.genius_generated_documents FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.genius_legal_sources (
  content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), effective_date TIMESTAMPTZ, expiry_date TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_current BOOLEAN, jurisdiction TEXT, language TEXT, reference_number TEXT, source_type TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), url TEXT, version INTEGER
);
ALTER TABLE public.genius_legal_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "genius_legal_sources_authenticated_read" ON public.genius_legal_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "genius_legal_sources_admin_all" ON public.genius_legal_sources FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_announcements (
  affected_modules TEXT[], announcement_type TEXT, audience TEXT, content TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, expire_at TIMESTAMPTZ, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), image_url TEXT, is_breaking_change BOOLEAN, is_featured BOOLEAN, is_published BOOLEAN, learn_more_url TEXT, publish_at TIMESTAMPTZ, summary TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), version TEXT, video_url TEXT
);
ALTER TABLE public.help_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_announcements_authenticated_read" ON public.help_announcements FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_announcements_admin_all" ON public.help_announcements FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_articles (
  article_type TEXT, category_id UUID, content TEXT, content_es TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, display_order INTEGER, excerpt TEXT, excerpt_es TEXT, featured_image TEXT, helpful_count INTEGER, helpful_no INTEGER, helpful_yes INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_featured BOOLEAN, is_published BOOLEAN, language TEXT, meta_description TEXT, meta_title TEXT, module TEXT, not_helpful_count INTEGER, published_at TIMESTAMPTZ, search_vector TSVECTOR, slug TEXT, sort_order INTEGER, status TEXT, summary TEXT, tags TEXT[], title TEXT, title_es TEXT, translations JSONB, updated_at TIMESTAMPTZ DEFAULT NOW(), video_duration INTEGER, video_url TEXT, view_count INTEGER
);
ALTER TABLE public.help_articles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_articles_authenticated_read" ON public.help_articles FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_articles_admin_all" ON public.help_articles FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_categories (
  color TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, description_es TEXT, display_order INTEGER, icon TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, parent_id UUID, slug TEXT, sort_order INTEGER, title TEXT, title_es TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.help_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_categories_authenticated_read" ON public.help_categories FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_categories_admin_all" ON public.help_categories FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_faqs (
  answer TEXT, answer_es TEXT, category TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, question TEXT, question_es TEXT, sort_order INTEGER
);
ALTER TABLE public.help_faqs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_faqs_authenticated_read" ON public.help_faqs FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_faqs_admin_all" ON public.help_faqs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_rule_triggers (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), rule_id UUID, trigger_config JSONB, trigger_target TEXT, trigger_type TEXT
);
ALTER TABLE public.help_rule_triggers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_rule_triggers_authenticated_read" ON public.help_rule_triggers FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_rule_triggers_admin_all" ON public.help_rule_triggers FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_search_logs (
  clicked_article_id UUID, context_module TEXT, context_page TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, query TEXT, results_count INTEGER, user_id UUID
);
ALTER TABLE public.help_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_search_logs_org_isolation" ON public.help_search_logs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.help_system_status (
  created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, message TEXT, resolved_at TIMESTAMPTZ, severity TEXT, status TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.help_system_status ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_system_status_authenticated_read" ON public.help_system_status FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_system_status_admin_all" ON public.help_system_status FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_tooltips (
  content TEXT, content_es TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), element_selector TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, module TEXT, page TEXT, placement TEXT, title TEXT, title_es TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.help_tooltips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_tooltips_authenticated_read" ON public.help_tooltips FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_tooltips_admin_all" ON public.help_tooltips FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.help_tours (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, description_es TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, module TEXT, name TEXT, name_es TEXT, sort_order INTEGER, steps JSONB, target_page TEXT, target_role TEXT, trigger_event TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.help_tours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "help_tours_authenticated_read" ON public.help_tours FOR SELECT TO authenticated USING (true);
CREATE POLICY "help_tours_admin_all" ON public.help_tours FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.holders (
  address TEXT, city TEXT, country TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), holder_code TEXT, holder_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name TEXT, notes TEXT, organization_id UUID, postal_code TEXT, state TEXT, tax_id TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.holders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "holders_org_isolation" ON public.holders FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.import_files (
  created_at TIMESTAMPTZ DEFAULT NOW(), error_message TEXT, file_name TEXT, file_path TEXT, file_size INTEGER, file_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_job_id UUID, parsed_data JSONB, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_files_authenticated_read" ON public.import_files FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_files_admin_all" ON public.import_files FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.import_jobs (
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, entity_type TEXT, error_log JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_type TEXT, mapping JSONB, metadata JSONB, organization_id UUID, records_failed INTEGER, records_processed INTEGER, records_total INTEGER, source_file_url TEXT, source_type TEXT, started_at TIMESTAMPTZ, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_jobs_org_isolation" ON public.import_jobs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.import_mapping_templates (
  column_mappings JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, entity_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, organization_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_mapping_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_mapping_templates_org_isolation" ON public.import_mapping_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.import_review_queue (
  action TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), entity_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_id UUID, matched_record_id UUID, organization_id UUID, raw_data JSONB, resolved_at TIMESTAMPTZ, resolved_by UUID, review_reason TEXT, status TEXT
);
ALTER TABLE public.import_review_queue ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_review_queue_org_isolation" ON public.import_review_queue FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.import_scraping_rules (
  confidence_threshold NUMERIC, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), css_selectors JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_used TIMESTAMPTZ, office_type TEXT, success_rate NUMERIC, updated_at TIMESTAMPTZ DEFAULT NOW(), url_pattern TEXT, xpath_selectors JSONB
);
ALTER TABLE public.import_scraping_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_scraping_rules_authenticated_read" ON public.import_scraping_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_scraping_rules_admin_all" ON public.import_scraping_rules FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.import_snapshots (
  change_type TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), entity_id UUID, entity_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), import_id UUID, new_data JSONB, old_data JSONB
);
ALTER TABLE public.import_snapshots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_snapshots_authenticated_read" ON public.import_snapshots FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_snapshots_admin_all" ON public.import_snapshots FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.import_sources (
  config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_import_at TIMESTAMPTZ, name TEXT, source_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_sources_authenticated_read" ON public.import_sources FOR SELECT TO authenticated USING (true);
CREATE POLICY "import_sources_admin_all" ON public.import_sources FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.import_sync_configs (
  created_at TIMESTAMPTZ DEFAULT NOW(), entity_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), last_sync_at TIMESTAMPTZ, match_fields TEXT[], merge_strategy TEXT, organization_id UUID, source_id UUID, sync_frequency TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_sync_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_sync_configs_org_isolation" ON public.import_sync_configs FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.import_templates (
  column_count INTEGER, column_mappings JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), entity_type TEXT, headers TEXT[], id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT, organization_id UUID, preview_rows JSONB, sample_data JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.import_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "import_templates_org_isolation" ON public.import_templates FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.importable_fields (
  created_at TIMESTAMPTZ DEFAULT NOW(), default_value TEXT, description TEXT, display_name TEXT, entity_type TEXT, field_name TEXT, field_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_required BOOLEAN, sort_order INTEGER, validation_regex TEXT
);
ALTER TABLE public.importable_fields ENABLE ROW LEVEL SECURITY;
CREATE POLICY "importable_fields_authenticated_read" ON public.importable_fields FOR SELECT TO authenticated USING (true);
CREATE POLICY "importable_fields_admin_all" ON public.importable_fields FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.imports (
  completed_at TIMESTAMPTZ, created_at TIMESTAMPTZ DEFAULT NOW(), created_by UUID, duplicates_count INTEGER, entity_type TEXT, errors JSONB, file_name TEXT, file_path TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, records_count INTEGER, records_imported INTEGER, source TEXT, started_at TIMESTAMPTZ, status TEXT, template_id UUID, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.imports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "imports_org_isolation" ON public.imports FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.intelligence_config (
  config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, key TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.intelligence_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "intelligence_config_authenticated_read" ON public.intelligence_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "intelligence_config_admin_all" ON public.intelligence_config FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.internal_notifications (
  action_url TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_read BOOLEAN, message TEXT, metadata JSONB, organization_id UUID, read_at TIMESTAMPTZ, title TEXT, type TEXT, user_id UUID
);
ALTER TABLE public.internal_notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_notifications_org_isolation" ON public.internal_notifications FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.internal_reference_config (
  created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, format_pattern TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_generated_at TIMESTAMPTZ, matter_type TEXT, organization_id UUID, prefix TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.internal_reference_config ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_reference_config_org_isolation" ON public.internal_reference_config FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.internal_reference_sequences (
  created_at TIMESTAMPTZ DEFAULT NOW(), current_value INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), organization_id UUID, sequence_key TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.internal_reference_sequences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "internal_reference_sequences_org_isolation" ON public.internal_reference_sequences FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ip_nice_classification (
  class_id UUID, class_number INTEGER, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_primary BOOLEAN, matter_id UUID, organization_id UUID, products TEXT[], selected_items JSONB, services TEXT[]
);
ALTER TABLE public.ip_nice_classification ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_nice_classification_org_isolation" ON public.ip_nice_classification FOR ALL TO authenticated USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));

CREATE TABLE IF NOT EXISTS public.ip_office_fees (
  additional_class_fee NUMERIC, amount NUMERIC, base_fee NUMERIC, classes_included INTEGER, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), currency TEXT, data_source TEXT, effective_date TIMESTAMPTZ, fee_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_verified BOOLEAN, last_verified TIMESTAMPTZ, notes TEXT, office_id UUID, right_type TEXT, source TEXT, source_url TEXT, updated_at TIMESTAMPTZ DEFAULT NOW(), verified_by TEXT
);
ALTER TABLE public.ip_office_fees ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ip_office_fees_authenticated_read" ON public.ip_office_fees FOR SELECT TO authenticated USING (true);
CREATE POLICY "ip_office_fees_admin_all" ON public.ip_office_fees FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipc_classes (
  class_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, section_id UUID, title_en TEXT, title_es TEXT
);
ALTER TABLE public.ipc_classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipc_classes_authenticated_read" ON public.ipc_classes FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipc_classes_admin_all" ON public.ipc_classes FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipc_groups (
  class_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), group_code TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, subclass_id UUID, title_en TEXT, title_es TEXT
);
ALTER TABLE public.ipc_groups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipc_groups_authenticated_read" ON public.ipc_groups FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipc_groups_admin_all" ON public.ipc_groups FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipc_sections (
  code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, title_en TEXT, title_es TEXT
);
ALTER TABLE public.ipc_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipc_sections_authenticated_read" ON public.ipc_sections FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipc_sections_admin_all" ON public.ipc_sections FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipc_subclasses (
  class_id UUID, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, subclass_code TEXT, title_en TEXT, title_es TEXT
);
ALTER TABLE public.ipc_subclasses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipc_subclasses_authenticated_read" ON public.ipc_subclasses FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipc_subclasses_admin_all" ON public.ipc_subclasses FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipo_enrich_runs (
  completed_at TIMESTAMPTZ, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), enrichment_type TEXT, error_details TEXT, fields_enriched TEXT[], fields_found JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), office_id UUID, prompt_tokens INTEGER, response_tokens INTEGER, source TEXT, status TEXT
);
ALTER TABLE public.ipo_enrich_runs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipo_enrich_runs_authenticated_read" ON public.ipo_enrich_runs FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipo_enrich_runs_admin_all" ON public.ipo_enrich_runs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipo_fee_history (
  change_source TEXT, change_type TEXT, changed_by TEXT, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), effective_date TIMESTAMPTZ, fee_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), new_amount NUMERIC, new_currency TEXT, notes TEXT, old_amount NUMERIC, old_currency TEXT, right_type TEXT
);
ALTER TABLE public.ipo_fee_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipo_fee_history_authenticated_read" ON public.ipo_fee_history FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipo_fee_history_admin_all" ON public.ipo_fee_history FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipo_market_intel (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), data_type TEXT, data_value JSONB, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), source TEXT, source_url TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ipo_market_intel ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipo_market_intel_authenticated_read" ON public.ipo_market_intel FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipo_market_intel_admin_all" ON public.ipo_market_intel FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipo_procedures (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, estimated_duration_days INTEGER, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, name_en TEXT, name_es TEXT, official_fee_amount NUMERIC, official_fee_currency TEXT, procedure_type TEXT, required_documents TEXT[], right_type TEXT, sort_order INTEGER, source_url TEXT, steps JSONB, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ipo_procedures ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipo_procedures_authenticated_read" ON public.ipo_procedures FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipo_procedures_admin_all" ON public.ipo_procedures FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.ipo_rejection_analysis (
  ai_suggestions JSONB, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), matter_id UUID, office_action_text TEXT, rejection_category TEXT, rejection_date TIMESTAMPTZ, response_deadline TIMESTAMPTZ, status TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.ipo_rejection_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ipo_rejection_analysis_authenticated_read" ON public.ipo_rejection_analysis FOR SELECT TO authenticated USING (true);
CREATE POLICY "ipo_rejection_analysis_admin_all" ON public.ipo_rejection_analysis FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdiction_document_requirements (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, document_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_mandatory BOOLEAN, notes TEXT, right_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdiction_document_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_document_requirements_authenticated_read" ON public.jurisdiction_document_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdiction_document_requirements_admin_all" ON public.jurisdiction_document_requirements FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdiction_field_configs (
  code TEXT, config JSONB, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, display_name TEXT, field_type TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_required BOOLEAN, jurisdiction_code TEXT, sort_order INTEGER, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdiction_field_configs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_field_configs_authenticated_read" ON public.jurisdiction_field_configs FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdiction_field_configs_admin_all" ON public.jurisdiction_field_configs FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdiction_filing_requirements (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_required BOOLEAN, metadata JSONB, name TEXT, requirement_type TEXT, right_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdiction_filing_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_filing_requirements_authenticated_read" ON public.jurisdiction_filing_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdiction_filing_requirements_admin_all" ON public.jurisdiction_filing_requirements FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdiction_knowledge_base (
  content TEXT, country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_verified BOOLEAN, language TEXT, legal_area TEXT, source TEXT, title TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdiction_knowledge_base ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_knowledge_base_authenticated_read" ON public.jurisdiction_knowledge_base FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdiction_knowledge_base_admin_all" ON public.jurisdiction_knowledge_base FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdiction_requirements (
  country_code TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), description TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), is_active BOOLEAN DEFAULT TRUE, last_verified TIMESTAMPTZ, metadata JSONB, name TEXT, requirement_type TEXT, right_type TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdiction_requirements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdiction_requirements_authenticated_read" ON public.jurisdiction_requirements FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdiction_requirements_admin_all" ON public.jurisdiction_requirements FOR ALL TO authenticated USING (public.is_backoffice_staff());

CREATE TABLE IF NOT EXISTS public.jurisdictions (
  code TEXT, continent TEXT, country_name TEXT, country_name_es TEXT, created_at TIMESTAMPTZ DEFAULT NOW(), currency TEXT, flag_emoji TEXT, id UUID PRIMARY KEY DEFAULT gen_random_uuid(), ip_office_id UUID, is_active BOOLEAN DEFAULT TRUE, is_madrid_member BOOLEAN, language TEXT, region TEXT, updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jurisdictions_authenticated_read" ON public.jurisdictions FOR SELECT TO authenticated USING (true);
CREATE POLICY "jurisdictions_admin_all" ON public.jurisdictions FOR ALL TO authenticated USING (public.is_backoffice_staff());