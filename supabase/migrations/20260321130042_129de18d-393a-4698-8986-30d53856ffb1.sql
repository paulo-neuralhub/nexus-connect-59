
-- =============================================
-- SPIDER-01 FASE 1 — BASE DE DATOS COMPLETA
-- =============================================

-- GLOBAL: Fuentes/APIs
CREATE TABLE IF NOT EXISTS spider_supported_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  api_type text NOT NULL,
  base_url text,
  requires_credentials boolean DEFAULT false,
  is_active boolean DEFAULT true,
  reliability_level text DEFAULT 'high',
  jurisdictions_covered text[] DEFAULT '{}',
  rate_limit_per_minute integer DEFAULT 10,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE spider_supported_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sources_read_authenticated" ON spider_supported_sources
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "sources_write_superadmin" ON spider_supported_sources
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- GLOBAL: Plazos de oposición
CREATE TABLE IF NOT EXISTS spider_opposition_deadlines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code text NOT NULL UNIQUE,
  jurisdiction_name text NOT NULL,
  opposition_days integer NOT NULL,
  count_from text NOT NULL,
  is_extendable boolean DEFAULT false,
  max_extension_days integer DEFAULT 0,
  legal_basis text,
  legal_notes text,
  source_url text,
  last_verified_at date DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE spider_opposition_deadlines ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deadlines_read" ON spider_opposition_deadlines
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "deadlines_superadmin" ON spider_opposition_deadlines
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- Seed plazos legales
INSERT INTO spider_opposition_deadlines
  (jurisdiction_code, jurisdiction_name, opposition_days, count_from, is_extendable, max_extension_days, legal_basis)
VALUES
  ('EM','EUIPO (Marca UE)',90,'publication',false,0,'Art.46 RMUE (EU 2017/1001)'),
  ('US','USPTO (Marca US)',30,'publication',true,90,'Lanham Act §13(a), 15 USC §1063'),
  ('ES','OEPM (España)',60,'publication',false,0,'Art.18 Ley 17/2001 de Marcas'),
  ('GB','UKIPO (Reino Unido)',60,'publication',false,0,'Trade Marks Act 1994, s.38'),
  ('WO','WIPO Madrid',548,'filing',false,0,'Protocolo de Madrid, Regla 17'),
  ('FR','INPI (Francia)',60,'publication',false,0,'CPI art.L.712-4'),
  ('DE','DPMA (Alemania)',90,'publication',false,0,'Markengesetz §42'),
  ('IT','UIBM (Italia)',90,'publication',false,0,'CPI art.177'),
  ('CN','CNIPA (China)',90,'publication',false,0,'Trademark Law PRC art.33'),
  ('JP','JPO (Japón)',60,'publication',false,0,'Trademark Act Japan art.43-2')
ON CONFLICT (jurisdiction_code) DO UPDATE SET
  last_verified_at = CURRENT_DATE, updated_at = now();

-- Seed fuentes
INSERT INTO spider_supported_sources
  (code, name, api_type, base_url, requires_credentials, reliability_level, jurisdictions_covered, rate_limit_per_minute)
VALUES
  ('TMVIEW','TMView (70+ oficinas)','rest_api','https://www.tmdn.org/tmview/api',false,'high',
   ARRAY['EM','ES','FR','DE','IT','GB','PT','NL','BE','AT','PL','CZ','HU','RO','BG','HR','DK','FI','SE'],30),
  ('EUIPO','EUIPO eSearch','rest_api','https://euipo.europa.eu/eSearch',true,'high',ARRAY['EM'],20),
  ('USPTO','USPTO TSDR','rest_api','https://tsdrapi.uspto.gov',false,'high',ARRAY['US'],15),
  ('AI_SEARCH','Perplexity (fallback)','ai_search',null,true,'low',
   ARRAY['ES','PT','MX','AR','CO','CL','JP','CN','KR'],5)
ON CONFLICT (code) DO NOTHING;

-- TENANT: Configuración Spider
CREATE TABLE IF NOT EXISTS spider_tenant_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES organizations(id),
  plan_code text NOT NULL DEFAULT 'lite',
  is_active boolean DEFAULT true,
  activated_at timestamptz DEFAULT now(),
  activated_by uuid REFERENCES profiles(id),
  max_watches integer DEFAULT 5,
  max_jurisdictions_per_watch integer DEFAULT 3,
  max_scans_per_month integer DEFAULT 30,
  max_alerts_per_month integer DEFAULT 50,
  alerts_this_month integer DEFAULT 0,
  alerts_month_reset_at timestamptz DEFAULT date_trunc('month', now()),
  feature_phonetic boolean DEFAULT true,
  feature_semantic boolean DEFAULT true,
  feature_visual boolean DEFAULT false,
  domain_watch_enabled boolean DEFAULT false,
  realtime_scan_enabled boolean DEFAULT false,
  default_similarity_threshold integer DEFAULT 70,
  default_scan_frequency text DEFAULT 'daily',
  default_jurisdictions text[] DEFAULT ARRAY['EM','ES'],
  weight_phonetic integer DEFAULT 45,
  weight_semantic integer DEFAULT 55,
  weight_visual integer DEFAULT 0,
  notify_critical boolean DEFAULT true,
  notify_high boolean DEFAULT true,
  notify_medium boolean DEFAULT false,
  notify_low boolean DEFAULT false,
  notification_emails text[] DEFAULT '{}',
  webhook_url text,
  webhook_secret text,
  notes text,
  updated_at timestamptz DEFAULT now()
);

-- TENANT: Marcas vigiladas
CREATE TABLE IF NOT EXISTS spider_watches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid REFERENCES matters(id),
  watch_name text NOT NULL,
  watch_name_normalized text NOT NULL DEFAULT '',
  watch_type text DEFAULT 'trademark',
  mark_image_url text,
  mark_image_path text,
  jurisdictions text[] NOT NULL DEFAULT '{}',
  nice_classes integer[] DEFAULT '{}',
  watch_related_classes boolean DEFAULT false,
  similarity_threshold integer DEFAULT 70,
  weight_phonetic integer,
  weight_semantic integer,
  weight_visual integer,
  check_phonetic boolean DEFAULT true,
  check_semantic boolean DEFAULT true,
  check_visual boolean DEFAULT false,
  workflow_id uuid,
  is_active boolean DEFAULT true,
  scan_frequency text DEFAULT 'daily',
  last_scanned_at timestamptz,
  next_scan_at timestamptz DEFAULT now(),
  total_alerts_generated integer DEFAULT 0,
  active_alerts_count integer DEFAULT 0,
  false_positives_count integer DEFAULT 0,
  notes text,
  created_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION spider_normalize_watch_name()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.watch_name_normalized := lower(
    regexp_replace(
      translate(NEW.watch_name,
        'áàäâãéèëêíìïîóòöôõúùüûñçÁÀÄÂÃÉÈËÊÍÌÏÎÓÒÖÔÕÚÙÜÛÑÇ',
        'aaaaaeeeeiiiioooooouuuuncaaaaaeeeeiiiioooooouuuunc'),
      '[^a-zA-Z0-9]', '', 'g'));
  RETURN NEW;
END;
$$;
DROP TRIGGER IF EXISTS trg_spider_normalize ON spider_watches;
CREATE TRIGGER trg_spider_normalize
BEFORE INSERT OR UPDATE ON spider_watches
FOR EACH ROW EXECUTE FUNCTION spider_normalize_watch_name();

-- TENANT: Alertas
CREATE TABLE IF NOT EXISTS spider_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  watch_id uuid NOT NULL REFERENCES spider_watches(id),
  matter_id uuid REFERENCES matters(id),
  detected_mark_name text NOT NULL,
  detected_mark_name_normalized text NOT NULL,
  detected_application_number text,
  detected_filing_date date,
  detected_publication_date date,
  detected_applicant text,
  detected_applicant_country text,
  detected_jurisdiction text NOT NULL,
  detected_nice_classes integer[] DEFAULT '{}',
  detected_goods_services text,
  detected_mark_image_url text,
  detected_mark_status text DEFAULT 'pending',
  source_code text NOT NULL,
  source_url text,
  source_reliability text DEFAULT 'high',
  phonetic_score integer,
  visual_score integer,
  semantic_score integer,
  combined_score integer NOT NULL,
  weight_phonetic_used integer,
  weight_semantic_used integer,
  weight_visual_used integer,
  severity text NOT NULL,
  opposition_deadline date,
  opposition_days_remaining integer,
  ai_analysis text,
  ai_risk_level text,
  ai_recommendation text,
  ai_key_factors text[],
  ai_disclaimer text DEFAULT 'Análisis orientativo. Consultar especialista en PI.',
  status text NOT NULL DEFAULT 'new',
  workflow_step_id uuid,
  actioned_at timestamptz,
  actioned_by uuid REFERENCES profiles(id),
  action_taken text,
  action_notes text,
  snoozed_until timestamptz,
  opposition_matter_id uuid REFERENCES matters(id),
  crm_deal_id uuid,
  detected_at timestamptz DEFAULT now(),
  viewed_at timestamptz,
  viewed_by uuid REFERENCES profiles(id),
  created_at timestamptz DEFAULT now()
);

-- Anti-duplicados por número oficial
CREATE UNIQUE INDEX IF NOT EXISTS idx_spider_alerts_appnum
ON spider_alerts(watch_id, detected_application_number)
WHERE detected_application_number IS NOT NULL AND status != 'false_positive';

-- Anti-duplicados por nombre (sin now() — filtro temporal en queries)
CREATE UNIQUE INDEX IF NOT EXISTS idx_spider_alerts_name
ON spider_alerts(watch_id, detected_mark_name_normalized, detected_jurisdiction)
WHERE detected_application_number IS NULL;

-- TENANT: Historial inmutable
CREATE TABLE IF NOT EXISTS spider_alert_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  alert_id uuid NOT NULL REFERENCES spider_alerts(id),
  event_type text NOT NULL,
  old_status text,
  new_status text,
  performed_by uuid REFERENCES profiles(id),
  notes text,
  metadata jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- TENANT: Runs de escaneo
CREATE TABLE IF NOT EXISTS spider_scan_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  watch_id uuid REFERENCES spider_watches(id),
  scan_type text NOT NULL,
  jurisdictions_attempted text[] DEFAULT '{}',
  jurisdictions_succeeded text[] DEFAULT '{}',
  jurisdictions_failed text[] DEFAULT '{}',
  sources_used text[] DEFAULT '{}',
  status text DEFAULT 'running',
  marks_scanned integer DEFAULT 0,
  comparisons_made integer DEFAULT 0,
  alerts_created integer DEFAULT 0,
  alerts_updated integer DEFAULT 0,
  alerts_skipped_cache integer DEFAULT 0,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  duration_seconds integer,
  error_message text,
  errors_by_jurisdiction jsonb DEFAULT '{}',
  ai_tokens_used integer DEFAULT 0,
  ai_cost_eur numeric(10,4) DEFAULT 0.0000,
  created_at timestamptz DEFAULT now()
);

-- TENANT: Cache de análisis (AISLADA)
CREATE TABLE IF NOT EXISTS spider_analysis_cache (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  watch_name_normalized text NOT NULL,
  detected_name_normalized text NOT NULL,
  phonetic_score integer NOT NULL,
  semantic_score integer NOT NULL,
  visual_score integer,
  combined_score integer NOT NULL,
  weights_used jsonb NOT NULL,
  cached_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '7 days'),
  UNIQUE(organization_id, watch_name_normalized, detected_name_normalized)
);

-- TENANT: Workflows
CREATE TABLE IF NOT EXISTS spider_workflows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  name text NOT NULL,
  description text,
  is_default boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS spider_workflow_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid NOT NULL REFERENCES spider_workflows(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES organizations(id),
  step_order integer NOT NULL,
  step_name text NOT NULL,
  assignee_role text,
  sla_hours integer DEFAULT 48,
  auto_escalate boolean DEFAULT true,
  actions_available text[] DEFAULT ARRAY['approve','reject','escalate'],
  created_at timestamptz DEFAULT now()
);

-- TENANT: Reportes
CREATE TABLE IF NOT EXISTS spider_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  report_type text NOT NULL,
  title text NOT NULL,
  date_from date,
  date_to date,
  watch_ids uuid[] DEFAULT '{}',
  jurisdiction_codes text[] DEFAULT '{}',
  storage_path text,
  file_size_bytes integer,
  status text DEFAULT 'generating',
  error_message text,
  generated_by uuid REFERENCES profiles(id),
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '90 days')
);

-- =============================================
-- RLS EN TODAS LAS TABLAS TENANT-SPECIFIC
-- =============================================
ALTER TABLE spider_tenant_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_watches ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_alert_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_scan_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_workflow_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE spider_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "spider_tenant_config_tenant" ON spider_tenant_config
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_tenant_config_superadmin" ON spider_tenant_config
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_watches_tenant" ON spider_watches
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_watches_superadmin" ON spider_watches
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_alerts_tenant" ON spider_alerts
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_alerts_superadmin" ON spider_alerts
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_alert_history_tenant_read" ON spider_alert_history
  FOR SELECT USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_alert_history_tenant_insert" ON spider_alert_history
  FOR INSERT WITH CHECK (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_alert_history_superadmin" ON spider_alert_history
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_scan_runs_tenant" ON spider_scan_runs
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_scan_runs_superadmin" ON spider_scan_runs
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_analysis_cache_tenant" ON spider_analysis_cache
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_analysis_cache_superadmin" ON spider_analysis_cache
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_workflows_tenant" ON spider_workflows
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_workflows_superadmin" ON spider_workflows
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_workflow_steps_tenant" ON spider_workflow_steps
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_workflow_steps_superadmin" ON spider_workflow_steps
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

CREATE POLICY "spider_reports_tenant" ON spider_reports
  FOR ALL USING (organization_id = (SELECT organization_id FROM profiles WHERE id = auth.uid()));
CREATE POLICY "spider_reports_superadmin" ON spider_reports
  FOR ALL USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'));

-- =============================================
-- FUNCIONES SQL
-- =============================================
CREATE OR REPLACE FUNCTION verify_spider_access(p_org_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM tenant_feature_flags
    WHERE organization_id = p_org_id AND has_spider = true
  ) AND EXISTS (
    SELECT 1 FROM spider_tenant_config
    WHERE organization_id = p_org_id AND is_active = true
  );
$$;

CREATE OR REPLACE FUNCTION activate_spider_for_tenant(
  p_org_id uuid,
  p_plan text DEFAULT 'lite',
  p_activated_by uuid DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_config_id uuid;
  v_max_watches integer; v_max_jur integer;
  v_max_scans integer; v_max_alerts integer;
  v_visual boolean; v_domain boolean; v_realtime boolean;
BEGIN
  CASE p_plan
    WHEN 'lite' THEN
      v_max_watches:=5; v_max_jur:=3; v_max_scans:=30; v_max_alerts:=50;
      v_visual:=false; v_domain:=false; v_realtime:=false;
    WHEN 'pro','spider_pro' THEN
      v_max_watches:=25; v_max_jur:=10; v_max_scans:=100; v_max_alerts:=500;
      v_visual:=true; v_domain:=false; v_realtime:=false;
    WHEN 'full','spider_full' THEN
      v_max_watches:=999; v_max_jur:=999; v_max_scans:=999999; v_max_alerts:=999999;
      v_visual:=true; v_domain:=true; v_realtime:=true;
    ELSE RAISE EXCEPTION 'Plan desconocido: %', p_plan;
  END CASE;

  INSERT INTO spider_tenant_config (
    organization_id, plan_code, is_active,
    max_watches, max_jurisdictions_per_watch, max_scans_per_month,
    max_alerts_per_month, activated_at, activated_by,
    feature_visual, domain_watch_enabled, realtime_scan_enabled
  ) VALUES (
    p_org_id, p_plan, true,
    v_max_watches, v_max_jur, v_max_scans,
    v_max_alerts, now(), p_activated_by,
    v_visual, v_domain, v_realtime
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    plan_code = EXCLUDED.plan_code, is_active = true,
    max_watches = EXCLUDED.max_watches,
    max_jurisdictions_per_watch = EXCLUDED.max_jurisdictions_per_watch,
    max_scans_per_month = EXCLUDED.max_scans_per_month,
    max_alerts_per_month = EXCLUDED.max_alerts_per_month,
    feature_visual = EXCLUDED.feature_visual,
    domain_watch_enabled = EXCLUDED.domain_watch_enabled,
    realtime_scan_enabled = EXCLUDED.realtime_scan_enabled,
    updated_at = now()
  RETURNING id INTO v_config_id;

  INSERT INTO spider_workflows (organization_id, name, is_default)
  VALUES (p_org_id, 'Revisión estándar', true)
  ON CONFLICT DO NOTHING;

  RETURN v_config_id;
END;
$$;

-- =============================================
-- ÍNDICES (todos incluyen organization_id)
-- =============================================
CREATE INDEX IF NOT EXISTS idx_sw_tenant_active ON spider_watches(organization_id, is_active, next_scan_at);
CREATE INDEX IF NOT EXISTS idx_sw_tenant_matter ON spider_watches(organization_id, matter_id);
CREATE INDEX IF NOT EXISTS idx_sa_tenant_status ON spider_alerts(organization_id, status, severity);
CREATE INDEX IF NOT EXISTS idx_sa_tenant_deadline ON spider_alerts(organization_id, opposition_deadline)
  WHERE status NOT IN ('actioned','dismissed','false_positive');
CREATE INDEX IF NOT EXISTS idx_sa_tenant_watch ON spider_alerts(organization_id, watch_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sac_tenant_lookup ON spider_analysis_cache(organization_id, watch_name_normalized, detected_name_normalized);
CREATE INDEX IF NOT EXISTS idx_sah_alert ON spider_alert_history(organization_id, alert_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ssr_tenant ON spider_scan_runs(organization_id, status, started_at DESC);

-- =============================================
-- STORAGE: spider-assets bucket
-- =============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('spider-assets', 'spider-assets', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "spider_assets_tenant_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'spider-assets'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "spider_assets_tenant_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'spider-assets'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
  );
CREATE POLICY "spider_assets_tenant_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'spider-assets'
    AND (storage.foldername(name))[1] = (SELECT organization_id::text FROM profiles WHERE id = auth.uid())
  );

-- =============================================
-- ACTIVAR TENANT DE PRUEBA
-- =============================================
UPDATE tenant_feature_flags
SET has_spider = true, effective_limit_spider_alerts_monthly = 100
WHERE organization_id = '1187fb92-0b65-44ba-91cc-7955af6a08d0';

SELECT activate_spider_for_tenant(
  '1187fb92-0b65-44ba-91cc-7955af6a08d0'::uuid, 'spider_pro', NULL
);

UPDATE spider_tenant_config
SET feature_phonetic = true, feature_semantic = true, feature_visual = true,
    max_watches = 15, max_jurisdictions_per_watch = 10,
    max_scans_per_month = 100, max_alerts_per_month = 100
WHERE organization_id = '1187fb92-0b65-44ba-91cc-7955af6a08d0';
