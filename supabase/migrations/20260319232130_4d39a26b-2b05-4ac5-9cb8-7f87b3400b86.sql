
-- ============================================================
-- FASE 1: DIRECTORIO MUNDIAL DE OFICINAS IP — Schema completo
-- 100% idempotente (IF NOT EXISTS, ADD COLUMN IF NOT EXISTS)
-- ============================================================

-- ============================================================
-- 1. EXPAND ipo_offices — add missing columns from UB
-- ============================================================

-- Names & Identity
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS name TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS name_en TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS name_es TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS code_alt TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS country_flag TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS office_acronym TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS display_order INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS priority_score INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS product_id TEXT; EXCEPTION WHEN others THEN NULL; END $$;

-- Contact & Location
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS address TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS city TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS phone_general TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS email_general TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS fax TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS support_email TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS support_phone TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS contact_trademarks_dept TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS contact_appeals_dept TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS contact_urgent TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS director_name TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS director_title TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS linkedin_page TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC'; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS office_hours TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS working_hours JSONB; EXCEPTION WHEN others THEN NULL; END $$;

-- Websites
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS website_official TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS website_search TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS search_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS fees_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS e_filing_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS e_filing_available BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS url_status TEXT; EXCEPTION WHEN others THEN NULL; END $$;

-- Languages & Currency
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS languages TEXT[]; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS accepted_languages JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS translation_required BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS translation_languages JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS currency TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS payment_methods JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS online_payment BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;

-- IP Types & Capabilities
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS ip_types TEXT[]; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS capabilities JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS accepted_mark_types JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supported_mark_types JSONB; EXCEPTION WHEN others THEN NULL; END $$;

-- API & Integration
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS has_api BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_type TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_base_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_version TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_authentication_type TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_documentation_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_sandbox_available BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS api_credentials JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS auth_type TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS bulk_data_available BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS open_data_available BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS electronic_signature BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tmview_available BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;

-- Connection & Sync
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS connection_config JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS connection_status TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS is_connected BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_source_config JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_source_notes TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS sync_frequency TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS last_sync_at TIMESTAMPTZ; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS last_sync_status TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS last_sync_type TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS last_interaction_at TIMESTAMPTZ; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supports_search BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supports_status BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supports_documents BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supports_events BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS supports_fees BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS rate_limit_per_minute INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS rate_limit_per_day INTEGER; EXCEPTION WHEN others THEN NULL; END $$;

-- Automation & Digital
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS automation_level TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS automation_percentage NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS digital_score NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;

-- Agent Requirements
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS agent_required BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS agent_required_for_foreign BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;

-- International Memberships
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS member_madrid_protocol BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS paris_convention_member BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS wipo_madrid_code TEXT; EXCEPTION WHEN others THEN NULL; END $$;

-- Trademark-specific fields
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_filing_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_class_extra_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_renewal_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_opposition_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_appeal_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_expedited_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_recordal_fee NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_fee_currency TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_fee_last_change_date TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_fee_next_review_date TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_fee_change_pct_last NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_multi_class BOOLEAN DEFAULT TRUE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_use_requirement BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_opposition_period_days INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_registration_duration_years INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_estimated_registration_months INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_online_filing_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS tm_search_url TEXT; EXCEPTION WHEN others THEN NULL; END $$;

-- Procedures & Requirements
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS opposition_procedure JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS appeal_procedure JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS cancellation_procedure JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS renewal_procedure JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS documents_required JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS special_requirements JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS best_practices JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS common_mistakes JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS preparation_tips TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS grace_period_days INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS priority_claim_months INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS nice_version TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS uses_nice_classification BOOLEAN DEFAULT TRUE; EXCEPTION WHEN others THEN NULL; END $$;

-- Statistics
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS annual_filing_volume INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS approval_rate_pct NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS rejection_rate_pct NUMERIC; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS avg_days_to_first_action INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS avg_days_to_decision INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS common_rejection_reasons JSONB; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS stats_tm_applications INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS stats_tm_registrations INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS latam_relevance_score INTEGER; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS spanish_companies_active BOOLEAN DEFAULT FALSE; EXCEPTION WHEN others THEN NULL; END $$;

-- Data Quality
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_confidence TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_quality_flag TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_quality_notes TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_last_verified_at TIMESTAMPTZ; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS data_last_verified_by TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS fee_last_verified_at TIMESTAMPTZ; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS fees_source_notes TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS internal_notes TEXT; EXCEPTION WHEN others THEN NULL; END $$;
DO $$ BEGIN ALTER TABLE public.ipo_offices ADD COLUMN IF NOT EXISTS flag TEXT; EXCEPTION WHEN others THEN NULL; END $$;

-- Unique constraint on code
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE tablename = 'ipo_offices' AND indexname = 'ipo_offices_code_key') THEN
    ALTER TABLE public.ipo_offices ADD CONSTRAINT ipo_offices_code_key UNIQUE (code);
  END IF;
EXCEPTION WHEN others THEN NULL;
END $$;

-- ============================================================
-- 2. CREATE ipo_official_fees
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ipo_official_fees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.ipo_offices(id) ON DELETE CASCADE,
  ip_type TEXT NOT NULL DEFAULT 'trademark',
  service_category TEXT NOT NULL DEFAULT 'filing',
  service_name TEXT NOT NULL DEFAULT 'Filing fee',
  fee_type TEXT NOT NULL DEFAULT 'tm_filing',
  amount NUMERIC NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'EUR',
  amount_eur NUMERIC,
  fee_per_additional NUMERIC,
  fee_base_includes INTEGER DEFAULT 1,
  online_discount_pct NUMERIC,
  sme_discount_pct NUMERIC,
  effective_from DATE DEFAULT CURRENT_DATE,
  effective_until DATE,
  source_url TEXT,
  description TEXT,
  notes TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  channel TEXT DEFAULT 'national',
  verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ipo_official_fees ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ipo_fees_office ON public.ipo_official_fees(office_id);
CREATE INDEX IF NOT EXISTS idx_ipo_fees_type ON public.ipo_official_fees(fee_type);

-- ============================================================
-- 3. CREATE ipo_treaty_status
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ipo_treaty_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES public.ipo_offices(id) ON DELETE CASCADE,
  treaty_code TEXT,
  treaty_name TEXT NOT NULL,
  treaty_full_name TEXT,
  status TEXT NOT NULL DEFAULT 'not_member',
  member_since TEXT,
  ratification_date DATE,
  entry_into_force_date DATE,
  has_reservations BOOLEAN DEFAULT FALSE,
  reservations_text TEXT,
  declarations TEXT,
  source_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.ipo_treaty_status ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_ipo_treaty_office ON public.ipo_treaty_status(office_id);

-- ============================================================
-- 4. CREATE exchange_rates
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency TEXT NOT NULL DEFAULT 'EUR',
  target_currency TEXT NOT NULL,
  rate NUMERIC NOT NULL,
  previous_rate NUMERIC,
  change_pct NUMERIC,
  manual_override NUMERIC,
  source TEXT NOT NULL DEFAULT 'frankfurter',
  currency_name TEXT,
  symbol TEXT,
  region TEXT,
  fetched_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '24 hours'),
  updated_by TEXT,
  UNIQUE(base_currency, target_currency)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 5. CREATE jurisdiction_change_patterns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurisdiction_change_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES public.ipo_offices(id),
  change_type TEXT NOT NULL,
  typical_change_months INTEGER[],
  avg_change_interval_days INTEGER,
  interval_variance_days INTEGER DEFAULT 180,
  known_change_dates DATE[],
  typical_change_magnitude_pct DECIMAL(5,2),
  gives_advance_notice BOOLEAN DEFAULT FALSE,
  advance_notice_days INTEGER,
  announcement_url TEXT,
  signal_search_terms TEXT[],
  legal_framework TEXT,
  requires_legislative_change BOOLEAN DEFAULT FALSE,
  confidence_in_pattern DECIMAL(3,2) DEFAULT 0.70,
  notes TEXT,
  last_pattern_review DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(ipo_office_id, change_type)
);

ALTER TABLE public.jurisdiction_change_patterns ENABLE ROW LEVEL SECURITY;
CREATE INDEX IF NOT EXISTS idx_jcp_office ON public.jurisdiction_change_patterns(ipo_office_id);

-- ============================================================
-- 6. CREATE jurisdiction_risk_windows
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurisdiction_risk_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES public.ipo_offices(id),
  pattern_id UUID NOT NULL REFERENCES public.jurisdiction_change_patterns(id),
  change_type TEXT NOT NULL,
  window_start DATE NOT NULL,
  window_end DATE NOT NULL,
  check_frequency_in_window_hours INTEGER NOT NULL,
  check_frequency_stable_hours INTEGER NOT NULL,
  is_currently_in_window BOOLEAN DEFAULT FALSE,
  change_probability DECIMAL(3,2),
  calculation_basis TEXT,
  calculated_at TIMESTAMPTZ DEFAULT NOW(),
  change_occurred BOOLEAN DEFAULT FALSE,
  change_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jurisdiction_risk_windows ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 7. CREATE jurisdiction_change_signals
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurisdiction_change_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES public.ipo_offices(id),
  change_type TEXT NOT NULL,
  signal_type TEXT NOT NULL,
  signal_title TEXT NOT NULL,
  signal_description TEXT,
  signal_url TEXT,
  signal_date DATE NOT NULL,
  urgency_level TEXT NOT NULL DEFAULT 'medium',
  triggered_check_frequency_hours INTEGER NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  confirmed_change BOOLEAN,
  detected_by TEXT NOT NULL DEFAULT 'system',
  expires_at DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jurisdiction_change_signals ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 8. CREATE jurisdiction_extraction_config
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurisdiction_extraction_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ipo_office_id UUID NOT NULL REFERENCES public.ipo_offices(id) ON DELETE RESTRICT,
  office_code TEXT NOT NULL UNIQUE,
  office_name TEXT NOT NULL,
  extraction_method TEXT NOT NULL,
  primary_url TEXT NOT NULL,
  verification_url TEXT,
  api_endpoint TEXT,
  api_requires_auth BOOLEAN DEFAULT FALSE,
  api_auth_header TEXT,
  extraction_prompt_hint TEXT NOT NULL,
  check_frequency_hours INTEGER NOT NULL DEFAULT 168,
  last_checked_at TIMESTAMPTZ,
  next_check_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT TRUE,
  consecutive_failures INTEGER DEFAULT 0,
  last_success_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jurisdiction_extraction_config ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 9. CREATE jurisdiction_update_queue
-- ============================================================
CREATE TABLE IF NOT EXISTS public.jurisdiction_update_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  extraction_config_id UUID NOT NULL REFERENCES public.jurisdiction_extraction_config(id),
  ipo_office_id UUID NOT NULL REFERENCES public.ipo_offices(id),
  status TEXT NOT NULL DEFAULT 'pending',
  scheduled_for TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  extracted_data JSONB,
  changes_detected JSONB DEFAULT '[]'::jsonb,
  auto_approved_count INTEGER DEFAULT 0,
  needs_review_count INTEGER DEFAULT 0,
  rejected_count INTEGER DEFAULT 0,
  attempt_count INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  admin_notified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.jurisdiction_update_queue ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 10. RLS POLICIES
-- ============================================================

-- ipo_official_fees
DROP POLICY IF EXISTS "Superadmin manage ipo_official_fees" ON public.ipo_official_fees;
CREATE POLICY "Superadmin manage ipo_official_fees" ON public.ipo_official_fees
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Authenticated read ipo_official_fees" ON public.ipo_official_fees;
CREATE POLICY "Authenticated read ipo_official_fees" ON public.ipo_official_fees
  FOR SELECT TO authenticated USING (true);

-- ipo_treaty_status
DROP POLICY IF EXISTS "Superadmin manage ipo_treaty_status" ON public.ipo_treaty_status;
CREATE POLICY "Superadmin manage ipo_treaty_status" ON public.ipo_treaty_status
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Authenticated read ipo_treaty_status" ON public.ipo_treaty_status;
CREATE POLICY "Authenticated read ipo_treaty_status" ON public.ipo_treaty_status
  FOR SELECT TO authenticated USING (true);

-- exchange_rates
DROP POLICY IF EXISTS "Public read exchange_rates" ON public.exchange_rates;
CREATE POLICY "Public read exchange_rates" ON public.exchange_rates
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Superadmin manage exchange_rates" ON public.exchange_rates;
CREATE POLICY "Superadmin manage exchange_rates" ON public.exchange_rates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- jurisdiction_change_patterns
DROP POLICY IF EXISTS "Authenticated read jurisdiction_change_patterns" ON public.jurisdiction_change_patterns;
CREATE POLICY "Authenticated read jurisdiction_change_patterns" ON public.jurisdiction_change_patterns
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage jurisdiction_change_patterns" ON public.jurisdiction_change_patterns;
CREATE POLICY "Superadmin manage jurisdiction_change_patterns" ON public.jurisdiction_change_patterns
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- jurisdiction_risk_windows
DROP POLICY IF EXISTS "Authenticated read jurisdiction_risk_windows" ON public.jurisdiction_risk_windows;
CREATE POLICY "Authenticated read jurisdiction_risk_windows" ON public.jurisdiction_risk_windows
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage jurisdiction_risk_windows" ON public.jurisdiction_risk_windows;
CREATE POLICY "Superadmin manage jurisdiction_risk_windows" ON public.jurisdiction_risk_windows
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- jurisdiction_change_signals
DROP POLICY IF EXISTS "Authenticated read jurisdiction_change_signals" ON public.jurisdiction_change_signals;
CREATE POLICY "Authenticated read jurisdiction_change_signals" ON public.jurisdiction_change_signals
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage jurisdiction_change_signals" ON public.jurisdiction_change_signals;
CREATE POLICY "Superadmin manage jurisdiction_change_signals" ON public.jurisdiction_change_signals
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- jurisdiction_extraction_config
DROP POLICY IF EXISTS "Authenticated read jurisdiction_extraction_config" ON public.jurisdiction_extraction_config;
CREATE POLICY "Authenticated read jurisdiction_extraction_config" ON public.jurisdiction_extraction_config
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage jurisdiction_extraction_config" ON public.jurisdiction_extraction_config;
CREATE POLICY "Superadmin manage jurisdiction_extraction_config" ON public.jurisdiction_extraction_config
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- jurisdiction_update_queue
DROP POLICY IF EXISTS "Authenticated read jurisdiction_update_queue" ON public.jurisdiction_update_queue;
CREATE POLICY "Authenticated read jurisdiction_update_queue" ON public.jurisdiction_update_queue
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Superadmin manage jurisdiction_update_queue" ON public.jurisdiction_update_queue;
CREATE POLICY "Superadmin manage jurisdiction_update_queue" ON public.jurisdiction_update_queue
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Superadmin on ipo_offices
DROP POLICY IF EXISTS "Superadmin manage ipo_offices" ON public.ipo_offices;
CREATE POLICY "Superadmin manage ipo_offices" ON public.ipo_offices
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));
