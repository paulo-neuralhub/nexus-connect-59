-- ============================================================
-- IP-NEXUS: 12 tablas del directorio IP (paridad UmbrellaBrandsV2)
-- Idempotente: CREATE TABLE IF NOT EXISTS + ON CONFLICT DO NOTHING
-- ============================================================

-- Helper function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ════════════════════════════════════════════════════════════
-- 1. ip_office_research_queue
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ip_office_research_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES ipo_offices(id) ON DELETE CASCADE,
  country_code TEXT NOT NULL,
  office_name TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  priority INTEGER DEFAULT 5,
  phase_1_general JSONB DEFAULT '{}',
  phase_2_trademarks JSONB DEFAULT '{}',
  phase_3_fees JSONB DEFAULT '{}',
  phase_4_treaties JSONB DEFAULT '{}',
  phase_5_digital JSONB DEFAULT '{}',
  phase_6_requirements JSONB DEFAULT '{}',
  parsed_data JSONB DEFAULT '{}',
  research_started_at TIMESTAMPTZ,
  research_completed_at TIMESTAMPTZ,
  total_queries_made INTEGER DEFAULT 0,
  total_tokens_used INTEGER DEFAULT 0,
  estimated_cost_usd DECIMAL(6,4) DEFAULT 0,
  auto_confidence_score INTEGER DEFAULT 0,
  needs_human_review BOOLEAN DEFAULT false,
  reviewed_by TEXT,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_research_queue_status ON ip_office_research_queue(status);
CREATE INDEX IF NOT EXISTS idx_research_queue_priority ON ip_office_research_queue(priority, status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_research_queue_office ON ip_office_research_queue(office_id);

ALTER TABLE ip_office_research_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin manage research_queue" ON ip_office_research_queue
  FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 2. ip_office_apis
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS ip_office_apis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID REFERENCES ipo_offices(id) ON DELETE CASCADE,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  version TEXT DEFAULT '1.0.0',
  base_path TEXT NOT NULL,
  auth_flow TEXT NOT NULL,
  required_scopes TEXT[],
  is_active BOOLEAN DEFAULT true,
  status TEXT DEFAULT 'operational',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(office_id, code)
);

ALTER TABLE ip_office_apis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read ip_office_apis" ON ip_office_apis FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage ip_office_apis" ON ip_office_apis FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 3. jurisdiction_service_map (dependency for jurisdiction_fees)
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jurisdiction_service_map (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_key TEXT NOT NULL UNIQUE,
  service_type TEXT NOT NULL,
  display_name_es TEXT NOT NULL,
  display_name_en TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE jurisdiction_service_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read jurisdiction_service_map" ON jurisdiction_service_map FOR SELECT USING (true);
CREATE POLICY "Admin manage jurisdiction_service_map" ON jurisdiction_service_map FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

INSERT INTO jurisdiction_service_map (canonical_key, service_type, display_name_es, display_name_en) VALUES
  ('REGISTER_1CLASS','registration','Registro de Marca — 1 Clase','Trademark Registration — 1 Class'),
  ('REGISTER_2CLASS','registration','Registro de Marca — 2 Clases','Trademark Registration — 2 Classes'),
  ('EXTRA_CLASS','extra_class','Clase Adicional','Additional Class'),
  ('RENEWAL_1CLASS','renewal','Renovación — 1 Clase','Renewal — 1 Class'),
  ('RENEWAL_EXTRA','extra_class','Clase Adicional Renovación','Renewal Additional Class'),
  ('OPPOSITION','opposition','Oposición de Marca','Trademark Opposition'),
  ('OFFICE_ACTION','office_action','Recurso / Office Action','Office Action Response'),
  ('SEARCH_BASIC','search','Búsqueda de Disponibilidad','Availability Search'),
  ('SEARCH_PREMIUM','search','Búsqueda Premium','Premium Search'),
  ('SURVEILLANCE','surveillance','Vigilancia de Marca','Trademark Watch'),
  ('CANCELLATION','cancellation','Cancelación de Marca','Trademark Cancellation'),
  ('TRANSFER','transfer','Cesión de Marca','Trademark Transfer'),
  ('OFFICIAL_FEE','registration','Tasa Oficial','Official Fee')
ON CONFLICT (canonical_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 4. jurisdiction_aliases
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jurisdiction_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alias TEXT NOT NULL,
  country_code TEXT NOT NULL,
  language TEXT DEFAULT 'es',
  alias_type TEXT DEFAULT 'geographic',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_ja_alias_lang ON jurisdiction_aliases(alias, language);

ALTER TABLE jurisdiction_aliases ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read jurisdiction_aliases" ON jurisdiction_aliases FOR SELECT USING (true);
CREATE POLICY "Admin manage jurisdiction_aliases" ON jurisdiction_aliases FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

INSERT INTO jurisdiction_aliases (alias, country_code, language, alias_type) VALUES
  ('europa', 'EU', 'es', 'geographic'),('union europea', 'EU', 'es', 'geographic'),('ue', 'EU', 'es', 'geographic'),
  ('euipo', 'EU', 'es', 'office_name'),('marca comunitaria', 'EU', 'es', 'common_name'),('marca europea', 'EU', 'es', 'common_name'),
  ('españa', 'ES', 'es', 'geographic'),('spain', 'ES', 'en', 'geographic'),('oepm', 'ES', 'es', 'office_name'),
  ('estados unidos', 'US', 'es', 'geographic'),('eeuu', 'US', 'es', 'geographic'),('usa', 'US', 'es', 'geographic'),
  ('uspto', 'US', 'es', 'office_name'),('reino unido', 'UK', 'es', 'geographic'),('ukipo', 'UK', 'es', 'office_name'),
  ('alemania', 'DE', 'es', 'geographic'),('dpma', 'DE', 'es', 'office_name'),('francia', 'FR', 'es', 'geographic'),
  ('inpi', 'FR', 'es', 'office_name'),('wipo', 'WO', 'es', 'office_name'),('ompi', 'WO', 'es', 'office_name'),
  ('china', 'CN', 'es', 'geographic'),('cnipa', 'CN', 'es', 'office_name'),('mexico', 'MX', 'es', 'geographic'),
  ('impi', 'MX', 'es', 'office_name'),('brasil', 'BR', 'es', 'geographic'),('inpi brasil', 'BR', 'es', 'office_name')
ON CONFLICT (alias, language) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 5. jurisdiction_fees
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jurisdiction_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES ipo_offices(id) ON DELETE RESTRICT,
  service_type TEXT NOT NULL,
  canonical_key TEXT REFERENCES jurisdiction_service_map(canonical_key),
  classes_1_fee DECIMAL(10,2),
  class_additional_fee DECIMAL(10,2),
  base_fee DECIMAL(10,2),
  currency TEXT NOT NULL DEFAULT 'EUR',
  fee_type TEXT NOT NULL DEFAULT 'official',
  confidence DECIMAL(3,2) NOT NULL DEFAULT 0.80,
  source_url TEXT,
  source_name TEXT,
  valid_from DATE,
  valid_until DATE,
  extraction_method TEXT DEFAULT 'manual',
  last_verified_at TIMESTAMPTZ DEFAULT NOW(),
  verified_by TEXT DEFAULT 'migration',
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ipo_office_id, canonical_key)
);

CREATE INDEX IF NOT EXISTS idx_jf_office_service ON jurisdiction_fees(ipo_office_id, service_type);
CREATE INDEX IF NOT EXISTS idx_jf_canonical ON jurisdiction_fees(canonical_key);
CREATE INDEX IF NOT EXISTS idx_jf_active_confidence ON jurisdiction_fees(is_active, confidence DESC);
CREATE INDEX IF NOT EXISTS idx_jf_verified ON jurisdiction_fees(last_verified_at DESC);

ALTER TABLE jurisdiction_fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read jurisdiction_fees" ON jurisdiction_fees FOR SELECT USING (true);
CREATE POLICY "Admin manage jurisdiction_fees" ON jurisdiction_fees FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 6. jurisdiction_updates_log
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS jurisdiction_updates_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID REFERENCES ipo_offices(id),
  jurisdiction_fee_id UUID REFERENCES jurisdiction_fees(id),
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  check_type TEXT DEFAULT 'manual',
  had_changes BOOLEAN DEFAULT FALSE,
  changes_detected JSONB DEFAULT '[]'::jsonb,
  auto_approved BOOLEAN DEFAULT FALSE,
  auto_approval_reason TEXT,
  requires_human_review BOOLEAN DEFAULT FALSE,
  review_reason TEXT,
  approved_by TEXT,
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  raw_extraction JSONB,
  error_message TEXT,
  processing_ms INTEGER,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_jul_office_date ON jurisdiction_updates_log(ipo_office_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_jul_pending_review ON jurisdiction_updates_log(requires_human_review, applied_at) WHERE requires_human_review = TRUE AND applied_at IS NULL;

ALTER TABLE jurisdiction_updates_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read jurisdiction_updates_log" ON jurisdiction_updates_log FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage jurisdiction_updates_log" ON jurisdiction_updates_log FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 7. fee_verification_log
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS fee_verification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES ipo_offices(id),
  country_code TEXT,
  office_acronym TEXT,
  status TEXT NOT NULL,
  dry_run BOOLEAN DEFAULT false,
  verification_date DATE DEFAULT CURRENT_DATE,
  fee_before DECIMAL(10,2),
  fee_extracted DECIMAL(10,2),
  currency_before TEXT,
  currency_extracted TEXT,
  confidence_before TEXT,
  discrepancy_pct DECIMAL(5,2),
  source_url TEXT,
  method TEXT,
  ai_model TEXT,
  raw_extract TEXT,
  error_message TEXT,
  processing_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE fee_verification_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin read fee_verification_log" ON fee_verification_log FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admin insert fee_verification_log" ON fee_verification_log FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 8. batch_jobs
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS batch_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT NOT NULL,
  anthropic_batch_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'preparing',
  total_requests INTEGER DEFAULT 0,
  succeeded_count INTEGER DEFAULT 0,
  errored_count INTEGER DEFAULT 0,
  expired_count INTEGER DEFAULT 0,
  canceled_count INTEGER DEFAULT 0,
  prepared_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  estimated_completion TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  results_processed_at TIMESTAMPTZ,
  estimated_cost_usd DECIMAL(10,4),
  actual_cost_usd DECIMAL(10,4),
  cost_without_batch_usd DECIMAL(10,4),
  savings_usd DECIMAL(10,4),
  results_url TEXT,
  model_id TEXT DEFAULT 'claude-haiku-4-5-20251001',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bj_status ON batch_jobs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bj_region ON batch_jobs(region_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bj_anthropic_id ON batch_jobs(anthropic_batch_id) WHERE anthropic_batch_id IS NOT NULL;

ALTER TABLE batch_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read batch_jobs" ON batch_jobs FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage batch_jobs" ON batch_jobs FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 9. batch_job_items
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS batch_job_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_job_id UUID NOT NULL REFERENCES batch_jobs(id),
  ipo_office_id UUID NOT NULL REFERENCES ipo_offices(id),
  custom_id TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending',
  request_prompt TEXT,
  raw_response JSONB,
  extracted_fees JSONB,
  validation_results JSONB DEFAULT '[]'::jsonb,
  auto_approved_count INTEGER DEFAULT 0,
  needs_review_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  applied_at TIMESTAMPTZ,
  input_tokens INTEGER,
  output_tokens INTEGER,
  item_cost_usd DECIMAL(10,8),
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_bji_batch ON batch_job_items(batch_job_id, status);
CREATE INDEX IF NOT EXISTS idx_bji_custom_id ON batch_job_items(custom_id);
CREATE INDEX IF NOT EXISTS idx_bji_office ON batch_job_items(ipo_office_id, created_at DESC);

ALTER TABLE batch_job_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read batch_job_items" ON batch_job_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage batch_job_items" ON batch_job_items FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 10. directory_change_log
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS directory_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  entity_name TEXT,
  action TEXT NOT NULL,
  changes JSONB,
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  source TEXT DEFAULT 'manual',
  notes TEXT,
  organization_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_change_log_entity ON directory_change_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_change_log_date ON directory_change_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_change_log_org ON directory_change_log(organization_id);

ALTER TABLE directory_change_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view change logs" ON directory_change_log FOR SELECT USING (true);
CREATE POLICY "Authenticated insert change logs" ON directory_change_log FOR INSERT TO authenticated WITH CHECK (auth.uid() IS NOT NULL);

-- Auto-log trigger
CREATE OR REPLACE FUNCTION public.log_ip_office_changes() RETURNS TRIGGER AS $$
DECLARE
  changes_json jsonb := '{}';
  col text;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    FOR col IN SELECT column_name FROM information_schema.columns WHERE table_name = TG_TABLE_NAME AND table_schema = 'public' AND column_name NOT IN ('updated_at', 'created_at')
    LOOP
      IF to_jsonb(NEW) ->> col IS DISTINCT FROM to_jsonb(OLD) ->> col THEN
        changes_json := changes_json || jsonb_build_object(col, jsonb_build_object('old', to_jsonb(OLD) ->> col, 'new', to_jsonb(NEW) ->> col));
      END IF;
    END LOOP;
    IF changes_json != '{}' THEN
      INSERT INTO directory_change_log (entity_type, entity_id, entity_name, action, changes, source)
      VALUES (TG_TABLE_NAME, NEW.id, COALESCE(NEW.name, NEW.id::text), 'update', changes_json, 'system');
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO directory_change_log (entity_type, entity_id, entity_name, action, changes, source)
    VALUES (TG_TABLE_NAME, NEW.id, COALESCE(NEW.name, NEW.id::text), 'create', to_jsonb(NEW), 'system');
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO directory_change_log (entity_type, entity_id, entity_name, action, changes, source)
    VALUES (TG_TABLE_NAME, OLD.id, COALESCE(OLD.name, OLD.id::text), 'delete', to_jsonb(OLD), 'system');
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_log_ipo_offices_changes ON ipo_offices;
CREATE TRIGGER trg_log_ipo_offices_changes
  AFTER INSERT OR UPDATE OR DELETE ON ipo_offices
  FOR EACH ROW EXECUTE FUNCTION log_ip_office_changes();

-- ════════════════════════════════════════════════════════════
-- 11. regional_agent_config
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS regional_agent_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_code TEXT NOT NULL UNIQUE,
  region_name TEXT NOT NULL,
  region_emoji TEXT NOT NULL,
  country_codes TEXT[] NOT NULL,
  currencies TEXT[] NOT NULL,
  web_languages TEXT[] NOT NULL,
  extraction_system_prompt TEXT NOT NULL,
  regional_context TEXT NOT NULL,
  handles_tier_2 BOOLEAN DEFAULT TRUE,
  handles_tier_4 BOOLEAN DEFAULT TRUE,
  total_jurisdictions INTEGER DEFAULT 0,
  jurisdictions_with_data INTEGER DEFAULT 0,
  last_batch_run TIMESTAMPTZ,
  last_batch_success_rate DECIMAL(5,2),
  scheduled_day_of_week INTEGER DEFAULT 0,
  scheduled_hour_utc INTEGER DEFAULT 2,
  model_id TEXT DEFAULT 'claude-haiku-4-5-20251001',
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_regional_agent_config_region_code ON regional_agent_config(region_code);
CREATE INDEX IF NOT EXISTS idx_regional_agent_config_country_codes ON regional_agent_config USING GIN(country_codes);

ALTER TABLE regional_agent_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated read regional_agent_config" ON regional_agent_config FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin manage regional_agent_config" ON regional_agent_config FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

INSERT INTO regional_agent_config (region_code, region_name, region_emoji, country_codes, currencies, web_languages, extraction_system_prompt, regional_context) VALUES
('EU_REGION', 'Europa', '🌍', ARRAY['DE','FR','IT','NL','BE','LU','AT','PT','PL','CZ','SE','NO','DK','FI','HU','RO','BG','HR','SK','SI','EE','LV','LT','MT','CY','IE','GR','RS','CH','UA'], ARRAY['EUR','SEK','NOK','DKK','PLN','CZK','HUF','RON','BGN','CHF'], ARRAY['en','de','fr','it','es','pt','nl','pl','cs','sv','no','da','fi'], 'Extractor especializado en tasas de PI europeas.', 'Moneda dominante: EUR. BOIP cubre NL+BE+LU.'),
('AMER_N', 'Américas Norte', '🌎', ARRAY['US','CA','MX','CU','JM','TT','DO','HT','PA','CR','GT','HN','NI','SV','BZ'], ARRAY['USD','CAD','MXN','JMD','TTD'], ARRAY['en','es','fr'], 'Extractor especializado en tasas de PI de América del Norte.', 'Moneda dominante: USD. USPTO: TEAS Plus y Standard.'),
('AMER_S', 'Américas Sur', '🌎', ARRAY['BR','AR','CL','CO','PE','EC','BO','PY','UY','VE','GY','SR','GF'], ARRAY['BRL','ARS','CLP','COP','PEN','BOB','PYG','UYU','VES'], ARRAY['es','pt'], 'Extractor especializado en tasas de PI de América del Sur.', 'Todas las monedas locales. Argentina: inflación rápida.'),
('APAC', 'Asia-Pacífico', '🌏', ARRAY['JP','CN','KR','AU','NZ','SG','IN','TH','VN','MY','ID','PH','TW','HK','MO','PK','BD','LK','MM','KH','LA','BN'], ARRAY['JPY','CNY','KRW','AUD','NZD','SGD','INR','THB','VND','MYR','IDR','PHP','TWD','HKD'], ARRAY['en','ja','zh','ko','th','vi','ms','id','hi'], 'Extractor especializado en tasas de PI de Asia-Pacífico.', 'China CNIPA: mayor volumen mundial. Japón año fiscal abril.'),
('MEA', 'Oriente Medio y África', '🌍', ARRAY['AE','SA','EG','MA','ZA','NG','KE','TZ','GH','ET','SN','TN','DZ','LY','SD','QA','KW','BH','OM','JO','LB','IL','TR','IR','IQ','SY'], ARRAY['USD','AED','SAR','EGP','MAD','ZAR','NGN','KES','QAR','KWD','BHD','OMR','ILS','TRY'], ARRAY['en','ar','fr','he','tr'], 'Extractor especializado en tasas de PI de Oriente Medio y África.', 'Alta variabilidad. UAE/IL modernos vs África subsahariana.'),
('INTL', 'Internacional / Regional', '🌐', ARRAY['WO','AP','OA','GC','EA'], ARRAY['CHF','USD','EUR'], ARRAY['en','fr','es','ru','ar'], 'Extractor de sistemas de registro internacional.', 'WIPO Madrid: basic fee + tasas individuales.')
ON CONFLICT (region_code) DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- 12. pricing_jurisdictions
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pricing_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  name_en VARCHAR(100),
  flag VARCHAR(10),
  flag_image_url TEXT,
  office_code VARCHAR(20),
  office_name VARCHAR(100),
  office_website TEXT,
  automation_level VARCHAR(20) NOT NULL DEFAULT 'managed',
  automation_reason TEXT,
  coverage_description VARCHAR(200),
  coverage_countries INTEGER,
  requirements JSONB DEFAULT '[]',
  external_portal_name VARCHAR(100),
  external_portal_url TEXT,
  estimated_time_platform VARCHAR(50),
  estimated_time_total VARCHAR(50),
  supports_classes BOOLEAN DEFAULT true,
  max_classes INTEGER DEFAULT 45,
  default_currency VARCHAR(3) DEFAULT 'EUR',
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  supports_trademarks BOOLEAN DEFAULT true,
  supports_patents BOOLEAN DEFAULT false,
  supports_designs BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_jurisdictions_active ON pricing_jurisdictions(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_pricing_jurisdictions_level ON pricing_jurisdictions(automation_level);

ALTER TABLE pricing_jurisdictions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pricing_jurisdictions" ON pricing_jurisdictions FOR SELECT USING (true);
CREATE POLICY "Admin manage pricing_jurisdictions" ON pricing_jurisdictions FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- 13. pricing_services
-- ════════════════════════════════════════════════════════════
CREATE TABLE IF NOT EXISTS pricing_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  jurisdiction_id UUID REFERENCES pricing_jurisdictions(id) ON DELETE SET NULL,
  name VARCHAR(200) NOT NULL,
  name_en VARCHAR(200),
  description TEXT,
  description_en TEXT,
  service_type VARCHAR(50) NOT NULL,
  service_subtype VARCHAR(50),
  base_classes INTEGER DEFAULT 1,
  allows_additional_classes BOOLEAN DEFAULT false,
  base_price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  additional_class_price DECIMAL(10,2) DEFAULT 0,
  internal_cost DECIMAL(10,2) DEFAULT 0,
  internal_cost_per_class DECIMAL(10,2) DEFAULT 0,
  official_fee DECIMAL(10,2) DEFAULT 0,
  official_fee_currency VARCHAR(3) DEFAULT 'EUR',
  official_fee_per_class JSONB,
  official_fee_included BOOLEAN DEFAULT false,
  third_party_cost_min DECIMAL(10,2) DEFAULT 0,
  third_party_cost_max DECIMAL(10,2) DEFAULT 0,
  third_party_cost_included BOOLEAN DEFAULT false,
  third_party_description VARCHAR(200),
  features JSONB DEFAULT '[]',
  requirements JSONB DEFAULT '[]',
  estimated_time VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  is_featured BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  show_on_pricing_page BOOLEAN DEFAULT true,
  show_on_wizard BOOLEAN DEFAULT true,
  cta_text VARCHAR(100),
  cta_url VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pricing_services_jurisdiction ON pricing_services(jurisdiction_id);
CREATE INDEX IF NOT EXISTS idx_pricing_services_type ON pricing_services(service_type);
CREATE INDEX IF NOT EXISTS idx_pricing_services_active ON pricing_services(is_active, display_order);

ALTER TABLE pricing_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read pricing_services" ON pricing_services FOR SELECT USING (true);
CREATE POLICY "Admin manage pricing_services" ON pricing_services FOR ALL USING (public.has_role(auth.uid(), 'super_admin') OR public.has_role(auth.uid(), 'admin'));

-- ════════════════════════════════════════════════════════════
-- Updated_at triggers
-- ════════════════════════════════════════════════════════════
DROP TRIGGER IF EXISTS batch_jobs_updated_at ON batch_jobs;
CREATE TRIGGER batch_jobs_updated_at BEFORE UPDATE ON batch_jobs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS batch_job_items_updated_at ON batch_job_items;
CREATE TRIGGER batch_job_items_updated_at BEFORE UPDATE ON batch_job_items FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS jurisdiction_fees_updated_at ON jurisdiction_fees;
CREATE TRIGGER jurisdiction_fees_updated_at BEFORE UPDATE ON jurisdiction_fees FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS regional_agent_config_updated_at ON regional_agent_config;
CREATE TRIGGER regional_agent_config_updated_at BEFORE UPDATE ON regional_agent_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS pricing_jurisdictions_updated_at ON pricing_jurisdictions;
CREATE TRIGGER pricing_jurisdictions_updated_at BEFORE UPDATE ON pricing_jurisdictions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS pricing_services_updated_at ON pricing_services;
CREATE TRIGGER pricing_services_updated_at BEFORE UPDATE ON pricing_services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ════════════════════════════════════════════════════════════
-- Populate research queue from existing ipo_offices
-- ════════════════════════════════════════════════════════════
INSERT INTO ip_office_research_queue (office_id, country_code, office_name, priority)
SELECT o.id, o.code, COALESCE(o.name, o.code),
  CASE
    WHEN o.code IN ('ES','US','GB','DE','FR','IT','PT','EM','EU','CN','JP','KR','MX','BR','WIPO','ARIPO','OAPI','BOIP') THEN 1
    WHEN o.code IN ('CA','AU','NZ','IN','SG','CH','NL','BE','AT','CL','CO','AE','IL','SE','NO','DK','FI','IE','PL','CZ') THEN 2
    WHEN o.code IN ('AR','PE','EC','UY','PY','BO','VE','CR','PA','GT','HN','SV','NI','DO','CU','JM','TT') THEN 3
    WHEN o.code IN ('ZA','MA','EG','NG','KE','GH','TZ','TH','ID','MY','PH','VN','TW','HK','SA','QA','BH','KW','JO','LB') THEN 4
    ELSE 5
  END
FROM ipo_offices o
WHERE NOT EXISTS (SELECT 1 FROM ip_office_research_queue r WHERE r.office_id = o.id)
ON CONFLICT DO NOTHING;

-- ════════════════════════════════════════════════════════════
-- apply_research_data function
-- ════════════════════════════════════════════════════════════
CREATE OR REPLACE FUNCTION public.apply_research_data(p_queue_id UUID)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_queue RECORD; v_data JSONB; v_office_id UUID;
BEGIN
  SELECT * INTO v_queue FROM ip_office_research_queue WHERE id = p_queue_id;
  IF v_queue IS NULL THEN RETURN jsonb_build_object('error', 'Queue item not found'); END IF;
  v_data := v_queue.parsed_data; v_office_id := v_queue.office_id;

  UPDATE ipo_offices SET
    official_name_local = COALESCE(v_data->>'official_name_local', official_name_local),
    acronym = COALESCE(v_data->>'acronym', acronym),
    office_type = COALESCE(v_data->>'office_type', office_type),
    phone_main = COALESCE(v_data->>'phone_main', phone_main),
    email_general = COALESCE(v_data->>'email_general', email_general),
    city = COALESCE(v_data->>'city', city),
    website_main = COALESCE(v_data->>'website_main', website_main),
    website_search = COALESCE(v_data->>'website_search', website_search),
    requires_local_agent = COALESCE((v_data->>'requires_local_agent')::BOOLEAN, requires_local_agent),
    agent_requirement_type = COALESCE(v_data->>'agent_requirement_type', agent_requirement_type),
    handles_trademarks = COALESCE((v_data->>'handles_trademarks')::BOOLEAN, handles_trademarks),
    handles_patents = COALESCE((v_data->>'handles_patents')::BOOLEAN, handles_patents),
    handles_designs = COALESCE((v_data->>'handles_designs')::BOOLEAN, handles_designs),
    handles_utility_models = COALESCE((v_data->>'handles_utility_models')::BOOLEAN, handles_utility_models),
    tm_estimated_registration_months = COALESCE((v_data->>'tm_estimated_registration_months')::INTEGER, tm_estimated_registration_months),
    member_madrid_protocol = COALESCE((v_data->>'madrid_protocol_member')::BOOLEAN, member_madrid_protocol),
    has_api = COALESCE((v_data->>'has_api')::BOOLEAN, has_api),
    e_filing_available = COALESCE((v_data->>'efiling_available')::BOOLEAN, e_filing_available),
    digital_maturity_score = COALESCE((v_data->>'digital_maturity_score')::INTEGER, digital_maturity_score),
    last_verified_at = NOW(),
    data_sources = ARRAY['perplexity_research_2026']
  WHERE id = v_office_id;

  UPDATE ip_office_research_queue SET status = 'completed', research_completed_at = NOW(), updated_at = NOW()
  WHERE id = p_queue_id;

  RETURN jsonb_build_object('success', true, 'office_id', v_office_id);
END;
$$;