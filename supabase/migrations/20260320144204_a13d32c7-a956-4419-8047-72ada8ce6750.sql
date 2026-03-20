-- ============================================================
-- BILLING-01: PHASE 1 — Tables, RLS, Function, Seed
-- ============================================================

-- 1. BILLING_PLANS
CREATE TABLE IF NOT EXISTS public.billing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text NOT NULL,
  description_es text,
  price_monthly_eur numeric NOT NULL DEFAULT 0,
  price_annual_eur numeric NOT NULL DEFAULT 0,
  annual_discount_pct integer DEFAULT 20,
  trial_days integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_visible_pricing boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  highlight_label text,
  highlight_color_hex text,
  limit_matters integer NOT NULL DEFAULT 10,
  limit_contacts integer NOT NULL DEFAULT 50,
  limit_users integer NOT NULL DEFAULT 1,
  limit_storage_gb integer NOT NULL DEFAULT 2,
  limit_genius_queries_monthly integer NOT NULL DEFAULT 0,
  limit_spider_alerts_monthly integer NOT NULL DEFAULT 0,
  limit_jurisdictions_docket integer NOT NULL DEFAULT 1,
  included_modules text[] NOT NULL DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. BILLING_ADDONS
CREATE TABLE IF NOT EXISTS public.billing_addons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name_es text NOT NULL,
  name_en text NOT NULL,
  description_es text,
  category text NOT NULL,
  price_monthly_eur numeric NOT NULL DEFAULT 0,
  price_annual_eur numeric NOT NULL DEFAULT 0,
  is_standalone boolean DEFAULT false,
  is_active boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  icon_name text,
  color_hex text,
  module_code text,
  adds_genius_queries_monthly integer DEFAULT 0,
  adds_spider_alerts_monthly integer DEFAULT 0,
  adds_users integer DEFAULT 0,
  adds_storage_gb integer DEFAULT 0,
  adds_jurisdictions integer DEFAULT 0,
  jurisdiction_codes text[] DEFAULT '{}',
  compatible_plan_codes text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. TENANT_FEATURE_FLAGS
CREATE TABLE IF NOT EXISTS public.tenant_feature_flags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL UNIQUE REFERENCES public.organizations(id) ON DELETE CASCADE,
  has_docket boolean DEFAULT true,
  has_crm boolean DEFAULT true,
  has_finance_basic boolean DEFAULT true,
  has_finance_full boolean DEFAULT false,
  has_spider boolean DEFAULT false,
  has_genius boolean DEFAULT false,
  has_market boolean DEFAULT false,
  has_filing boolean DEFAULT false,
  has_analytics boolean DEFAULT false,
  has_api_access boolean DEFAULT false,
  has_sso boolean DEFAULT false,
  has_accounting_basic boolean DEFAULT false,
  has_accounting_advanced boolean DEFAULT false,
  has_communications boolean DEFAULT false,
  has_automations boolean DEFAULT false,
  effective_limit_matters integer NOT NULL DEFAULT 10,
  effective_limit_contacts integer NOT NULL DEFAULT 50,
  effective_limit_users integer NOT NULL DEFAULT 1,
  effective_limit_storage_gb integer NOT NULL DEFAULT 2,
  effective_limit_genius_queries_monthly integer NOT NULL DEFAULT 0,
  effective_limit_spider_alerts_monthly integer NOT NULL DEFAULT 0,
  effective_limit_jurisdictions_docket integer NOT NULL DEFAULT 1,
  active_jurisdiction_codes text[] DEFAULT '{}',
  is_in_trial boolean DEFAULT false,
  trial_ends_at timestamptz,
  is_active boolean DEFAULT true,
  suspension_reason text,
  manual_override jsonb DEFAULT '{}',
  current_plan_code text DEFAULT 'free_trial',
  current_billing_cycle text DEFAULT 'monthly',
  current_addons jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- 4. BILLING_PLAN_HISTORY
CREATE TABLE IF NOT EXISTS public.billing_plan_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  changed_by_user_id uuid REFERENCES public.profiles(id),
  change_type text NOT NULL,
  previous_state jsonb,
  new_state jsonb,
  notes text,
  created_at timestamptz DEFAULT now()
);

-- ============================================================
-- RLS
-- ============================================================
ALTER TABLE public.billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_feature_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.billing_plan_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "billing_plans_public_read" ON public.billing_plans
  FOR SELECT USING (is_active = true AND is_visible_pricing = true);
CREATE POLICY "billing_plans_superadmin" ON public.billing_plans
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

CREATE POLICY "billing_addons_public_read" ON public.billing_addons
  FOR SELECT USING (is_active = true);
CREATE POLICY "billing_addons_superadmin" ON public.billing_addons
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

CREATE POLICY "flags_org_read" ON public.tenant_feature_flags
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
CREATE POLICY "flags_superadmin" ON public.tenant_feature_flags
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

CREATE POLICY "history_org_read" ON public.billing_plan_history
  FOR SELECT TO authenticated
  USING (organization_id IN (
    SELECT organization_id FROM public.profiles WHERE id = auth.uid()
  ));
CREATE POLICY "history_superadmin" ON public.billing_plan_history
  FOR ALL TO authenticated
  USING (public.is_backoffice_staff());

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_tenant_flags_org ON public.tenant_feature_flags(organization_id);
CREATE INDEX IF NOT EXISTS idx_billing_history_org ON public.billing_plan_history(organization_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_billing_plans_code ON public.billing_plans(code);
CREATE INDEX IF NOT EXISTS idx_billing_addons_code ON public.billing_addons(code);

-- ============================================================
-- FUNCTION: recalculate_tenant_flags
-- ============================================================
CREATE OR REPLACE FUNCTION public.recalculate_tenant_flags(
  p_org_id uuid,
  p_plan_code text,
  p_addons jsonb DEFAULT '[]'::jsonb,
  p_billing_cycle text DEFAULT 'monthly'
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan billing_plans%ROWTYPE;
  v_addon_row billing_addons%ROWTYPE;
  v_addon_item jsonb;
  v_addon_code text;
  v_addon_qty integer;
  v_lim_matters integer;
  v_lim_contacts integer;
  v_lim_users integer;
  v_lim_storage integer;
  v_lim_genius integer;
  v_lim_spider integer;
  v_lim_jurisdictions integer;
  v_has_spider boolean;
  v_has_genius boolean;
  v_has_market boolean;
  v_has_filing boolean;
  v_has_accounting_basic boolean;
  v_has_accounting_advanced boolean;
BEGIN
  SELECT * INTO v_plan FROM billing_plans WHERE code = p_plan_code;
  IF v_plan IS NULL THEN
    RAISE EXCEPTION 'Plan code % not found', p_plan_code;
  END IF;

  v_lim_matters := v_plan.limit_matters;
  v_lim_contacts := v_plan.limit_contacts;
  v_lim_users := v_plan.limit_users;
  v_lim_storage := v_plan.limit_storage_gb;
  v_lim_genius := v_plan.limit_genius_queries_monthly;
  v_lim_spider := v_plan.limit_spider_alerts_monthly;
  v_lim_jurisdictions := v_plan.limit_jurisdictions_docket;

  v_has_spider := 'spider' = ANY(v_plan.included_modules);
  v_has_genius := 'genius' = ANY(v_plan.included_modules);
  v_has_market := 'market' = ANY(v_plan.included_modules);
  v_has_filing := 'filing' = ANY(v_plan.included_modules);
  v_has_accounting_basic := 'accounting_basic' = ANY(v_plan.included_modules);
  v_has_accounting_advanced := 'accounting_advanced' = ANY(v_plan.included_modules);

  FOR v_addon_item IN SELECT * FROM jsonb_array_elements(p_addons)
  LOOP
    v_addon_code := v_addon_item->>'code';
    v_addon_qty := COALESCE((v_addon_item->>'quantity')::integer, 1);

    SELECT * INTO v_addon_row FROM billing_addons WHERE code = v_addon_code AND is_active = true;
    IF v_addon_row IS NULL THEN CONTINUE; END IF;

    IF v_addon_row.module_code = 'spider' THEN v_has_spider := true; END IF;
    IF v_addon_row.module_code = 'genius' THEN v_has_genius := true; END IF;
    IF v_addon_row.module_code = 'market' THEN v_has_market := true; END IF;
    IF v_addon_row.module_code = 'filing' THEN v_has_filing := true; END IF;
    IF v_addon_row.category = 'accounting' AND v_addon_row.code = 'accounting_basic' THEN v_has_accounting_basic := true; END IF;
    IF v_addon_row.category = 'accounting' AND v_addon_row.code = 'accounting_advanced' THEN v_has_accounting_advanced := true; END IF;

    IF v_addon_row.adds_genius_queries_monthly != 0 AND v_lim_genius != -1 THEN
      IF v_addon_row.adds_genius_queries_monthly = -1 THEN v_lim_genius := -1;
      ELSE v_lim_genius := v_lim_genius + (v_addon_row.adds_genius_queries_monthly * v_addon_qty);
      END IF;
    END IF;

    IF v_addon_row.adds_spider_alerts_monthly != 0 AND v_lim_spider != -1 THEN
      IF v_addon_row.adds_spider_alerts_monthly = -1 THEN v_lim_spider := -1;
      ELSE v_lim_spider := v_lim_spider + (v_addon_row.adds_spider_alerts_monthly * v_addon_qty);
      END IF;
    END IF;

    IF v_addon_row.adds_users != 0 AND v_lim_users != -1 THEN
      v_lim_users := v_lim_users + (v_addon_row.adds_users * v_addon_qty);
    END IF;

    IF v_addon_row.adds_storage_gb != 0 AND v_lim_storage != -1 THEN
      v_lim_storage := v_lim_storage + (v_addon_row.adds_storage_gb * v_addon_qty);
    END IF;

    IF v_addon_row.adds_jurisdictions != 0 AND v_lim_jurisdictions != -1 THEN
      IF v_addon_row.adds_jurisdictions = -1 THEN v_lim_jurisdictions := -1;
      ELSE v_lim_jurisdictions := v_lim_jurisdictions + (v_addon_row.adds_jurisdictions * v_addon_qty);
      END IF;
    END IF;
  END LOOP;

  INSERT INTO tenant_feature_flags (
    organization_id, current_plan_code, current_billing_cycle, current_addons,
    has_docket, has_crm, has_finance_basic, has_finance_full,
    has_spider, has_genius, has_market, has_filing, has_analytics,
    has_api_access, has_sso, has_accounting_basic, has_accounting_advanced,
    has_communications, has_automations,
    effective_limit_matters, effective_limit_contacts, effective_limit_users,
    effective_limit_storage_gb, effective_limit_genius_queries_monthly,
    effective_limit_spider_alerts_monthly, effective_limit_jurisdictions_docket,
    updated_at
  ) VALUES (
    p_org_id, p_plan_code, p_billing_cycle, p_addons,
    'docket' = ANY(v_plan.included_modules),
    'crm' = ANY(v_plan.included_modules),
    'finance' = ANY(v_plan.included_modules) OR 'finance_basic' = ANY(v_plan.included_modules),
    'finance_full' = ANY(v_plan.included_modules) OR 'finance' = ANY(v_plan.included_modules),
    v_has_spider, v_has_genius, v_has_market, v_has_filing,
    'analytics' = ANY(v_plan.included_modules),
    'api' = ANY(v_plan.included_modules),
    'sso' = ANY(v_plan.included_modules),
    v_has_accounting_basic, v_has_accounting_advanced,
    'communications' = ANY(v_plan.included_modules),
    'automations' = ANY(v_plan.included_modules),
    v_lim_matters, v_lim_contacts, v_lim_users,
    v_lim_storage, v_lim_genius, v_lim_spider, v_lim_jurisdictions,
    now()
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    current_plan_code = EXCLUDED.current_plan_code,
    current_billing_cycle = EXCLUDED.current_billing_cycle,
    current_addons = EXCLUDED.current_addons,
    has_docket = EXCLUDED.has_docket,
    has_crm = EXCLUDED.has_crm,
    has_finance_basic = EXCLUDED.has_finance_basic,
    has_finance_full = EXCLUDED.has_finance_full,
    has_spider = EXCLUDED.has_spider,
    has_genius = EXCLUDED.has_genius,
    has_market = EXCLUDED.has_market,
    has_filing = EXCLUDED.has_filing,
    has_analytics = EXCLUDED.has_analytics,
    has_api_access = EXCLUDED.has_api_access,
    has_sso = EXCLUDED.has_sso,
    has_accounting_basic = EXCLUDED.has_accounting_basic,
    has_accounting_advanced = EXCLUDED.has_accounting_advanced,
    has_communications = EXCLUDED.has_communications,
    has_automations = EXCLUDED.has_automations,
    effective_limit_matters = EXCLUDED.effective_limit_matters,
    effective_limit_contacts = EXCLUDED.effective_limit_contacts,
    effective_limit_users = EXCLUDED.effective_limit_users,
    effective_limit_storage_gb = EXCLUDED.effective_limit_storage_gb,
    effective_limit_genius_queries_monthly = EXCLUDED.effective_limit_genius_queries_monthly,
    effective_limit_spider_alerts_monthly = EXCLUDED.effective_limit_spider_alerts_monthly,
    effective_limit_jurisdictions_docket = EXCLUDED.effective_limit_jurisdictions_docket,
    updated_at = EXCLUDED.updated_at;
END;
$$;

-- ============================================================
-- SEED: Plans
-- ============================================================
INSERT INTO public.billing_plans (code, name_es, name_en, description_es, price_monthly_eur, price_annual_eur, trial_days, limit_matters, limit_contacts, limit_users, limit_storage_gb, limit_genius_queries_monthly, limit_spider_alerts_monthly, limit_jurisdictions_docket, included_modules, sort_order, highlight_label, highlight_color_hex)
VALUES
('free_trial', 'Prueba Gratuita', 'Free Trial', '7 días con acceso completo, después muy limitado', 0, 0, 7, 10, 50, 1, 2, 10, 0, 1, ARRAY['docket','crm'], 0, null, null),
('starter', 'Starter', 'Starter', 'Para agentes individuales y despachos pequeños', 149, 119, 0, 50, 200, 1, 5, 30, 0, 1, ARRAY['docket','crm','finance_basic'], 1, null, null),
('professional', 'Professional', 'Professional', 'Para despachos medianos con equipo', 399, 319, 0, -1, -1, 5, 25, 300, 150, 5, ARRAY['docket','crm','finance','communications','automations'], 2, 'Más popular', '#3B82F6'),
('enterprise', 'Enterprise', 'Enterprise', 'Para grandes despachos y corporaciones', 999, 799, 0, -1, -1, -1, 100, -1, -1, -1, ARRAY['docket','crm','finance','communications','automations','spider','genius','market','filing','analytics','api','sso','accounting_basic'], 3, null, null)
ON CONFLICT (code) DO UPDATE SET
  name_es = EXCLUDED.name_es,
  price_monthly_eur = EXCLUDED.price_monthly_eur,
  price_annual_eur = EXCLUDED.price_annual_eur,
  included_modules = EXCLUDED.included_modules,
  updated_at = now();

-- ============================================================
-- SEED: Addons (modules + resources)
-- ============================================================
INSERT INTO public.billing_addons (code, name_es, name_en, description_es, category, price_monthly_eur, price_annual_eur, is_standalone, module_code, adds_genius_queries_monthly, adds_spider_alerts_monthly, adds_users, adds_storage_gb, adds_jurisdictions, sort_order, icon_name, color_hex)
VALUES
('spider_lite', 'IP-SPIDER Lite', 'IP-SPIDER Lite', 'Hasta 150 alertas de vigilancia/mes', 'module_standalone', 49, 39, true, 'spider', 0, 150, 0, 0, 0, 1, 'Eye', '#8B5CF6'),
('spider_pro', 'IP-SPIDER Pro', 'IP-SPIDER Pro', 'Hasta 500 alertas de vigilancia/mes', 'module_standalone', 99, 79, true, 'spider', 0, 500, 0, 0, 0, 2, 'Eye', '#8B5CF6'),
('spider_full', 'IP-SPIDER Full', 'IP-SPIDER Full', 'Alertas ilimitadas de vigilancia', 'module_standalone', 199, 159, true, 'spider', 0, -1, 0, 0, 0, 3, 'Eye', '#8B5CF6'),
('genius_starter', 'IP-GENIUS Starter', 'IP-GENIUS Starter', '200 consultas IA adicionales/mes', 'module_standalone', 29, 23, true, 'genius', 200, 0, 0, 0, 0, 4, 'Sparkles', '#F59E0B'),
('genius_pro', 'IP-GENIUS Pro', 'IP-GENIUS Pro', '1.000 consultas IA adicionales/mes', 'module_standalone', 79, 63, true, 'genius', 1000, 0, 0, 0, 0, 5, 'Sparkles', '#F59E0B'),
('genius_full', 'IP-GENIUS Full', 'IP-GENIUS Full', 'Consultas IA ilimitadas', 'module_standalone', 199, 159, true, 'genius', -1, 0, 0, 0, 0, 6, 'Sparkles', '#F59E0B'),
('market_access', 'IP-MARKET', 'IP-MARKET', 'Acceso al marketplace de agentes IP (+ 8% comisión)', 'module_standalone', 29, 23, true, 'market', 0, 0, 0, 0, 0, 7, 'ShoppingBag', '#10B981'),
('accounting_basic', 'Contabilidad Básica', 'Basic Accounting', 'Facturas, presupuestos, gastos, timesheet, exportación Excel', 'accounting', 29, 23, false, null, 0, 0, 0, 0, 0, 8, 'Calculator', '#14B8A6'),
('accounting_advanced', 'Contabilidad Avanzada', 'Advanced Accounting', 'Todo lo básico + conciliación bancaria, SII España, integración Holded/Sage/A3', 'accounting', 79, 63, false, null, 0, 0, 0, 0, 0, 9, 'Calculator', '#14B8A6'),
('users_extra', 'Usuario adicional', 'Extra User', '+1 usuario para tu plan', 'users', 39, 31, false, null, 0, 0, 1, 0, 0, 10, 'UserPlus', '#6366F1'),
('storage_10gb', 'Storage +10 GB', 'Storage +10 GB', '+10 GB de almacenamiento adicional', 'storage', 9, 7, false, null, 0, 0, 0, 10, 0, 11, 'HardDrive', '#64748B'),
('storage_50gb', 'Storage +50 GB', 'Storage +50 GB', '+50 GB de almacenamiento adicional', 'storage', 29, 23, false, null, 0, 0, 0, 50, 0, 12, 'HardDrive', '#64748B'),
('storage_200gb', 'Storage +200 GB', 'Storage +200 GB', '+200 GB de almacenamiento adicional', 'storage', 89, 71, false, null, 0, 0, 0, 200, 0, 13, 'HardDrive', '#64748B')
ON CONFLICT (code) DO UPDATE SET
  price_monthly_eur = EXCLUDED.price_monthly_eur,
  price_annual_eur = EXCLUDED.price_annual_eur,
  updated_at = now();

-- ============================================================
-- SEED: Addons (jurisdiction packs)
-- ============================================================
INSERT INTO public.billing_addons (code, name_es, name_en, description_es, category, price_monthly_eur, price_annual_eur, is_standalone, adds_jurisdictions, jurisdiction_codes, sort_order, icon_name, color_hex)
VALUES
('pack_europa', 'Pack Europa', 'Europe Pack', 'EUIPO + 10 oficinas nacionales europeas clave', 'jurisdiction_pack', 79, 63, false, 11, ARRAY['EU','ES','DE','FR','IT','PT','NL','PL','SE','CH','GB'], 20, 'Globe', '#3B82F6'),
('pack_americas', 'Pack Américas', 'Americas Pack', 'USPTO + 8 oficinas latinoamericanas', 'jurisdiction_pack', 59, 47, false, 9, ARRAY['US','MX','BR','CO','AR','CL','PE','VE','EC'], 21, 'Globe', '#10B981'),
('pack_asia', 'Pack Asia-Pacífico', 'Asia-Pacific Pack', 'JPO, CNIPA, KIPO, IP Australia + 4 más', 'jurisdiction_pack', 59, 47, false, 8, ARRAY['JP','CN','KR','AU','SG','IN','TH','MY'], 22, 'Globe', '#F59E0B'),
('pack_mena', 'Pack MENA', 'MENA Pack', 'Oficinas del Golfo y Norte de África', 'jurisdiction_pack', 39, 31, false, 8, ARRAY['AE','SA','QA','MA','EG','TN','DZ','JO'], 23, 'Globe', '#EF4444'),
('pack_global', 'Pack Global', 'Global Pack', 'Acceso a las 200+ jurisdicciones del directorio completo', 'jurisdiction_pack', 179, 143, false, -1, ARRAY[]::text[], 24, 'Globe2', '#0F172A'),
('jurisdiction_single', 'País individual', 'Single Country', 'Añade 1 país a tu cobertura', 'jurisdiction_pack', 9, 7, false, 1, ARRAY[]::text[], 25, 'MapPin', '#64748B')
ON CONFLICT (code) DO UPDATE SET
  price_monthly_eur = EXCLUDED.price_monthly_eur,
  jurisdiction_codes = EXCLUDED.jurisdiction_codes,
  updated_at = now();

-- ============================================================
-- Initialize flags for existing organizations
-- ============================================================
INSERT INTO public.tenant_feature_flags (organization_id, current_plan_code, current_billing_cycle)
SELECT id, 'free_trial', 'monthly'
FROM public.organizations
ON CONFLICT (organization_id) DO NOTHING;