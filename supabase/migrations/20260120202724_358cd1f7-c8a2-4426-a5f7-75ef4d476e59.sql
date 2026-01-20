-- ============================================
-- PROMPT 50: PLATFORM MODULARIZATION
-- ============================================

-- Extend platform_modules with all modules
INSERT INTO platform_modules (
  code, name, description, category,
  is_standalone_available, is_addon_available, 
  required_modules, recommended_modules, 
  base_price_monthly,
  tiers,
  icon, color
) VALUES
-- CORE (always included, free)
('core', 'IP-NEXUS Core', 'Funcionalidades base de la plataforma', 'core',
 false, false, '{}', '{}', 0,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["auth","navigation","settings"],"limits":{}}
 ]'::jsonb,
 'LayoutDashboard', '#3B82F6'),

-- DOCKET
('docket', 'IP-NEXUS Docket', 'Gestión de expedientes de PI', 'core',
 true, true, '{}', '{}', 99,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["matters_crud","tasks_basic","documents"],"limits":{"matters":50,"tasks_per_matter":20}},
   {"code":"pro","name":"Professional","price":99,"features":["auto_deadlines","email_parsing","family_trees","bulk_actions"],"limits":{"matters":500,"tasks_per_matter":-1}},
   {"code":"enterprise","name":"Enterprise","price":299,"features":["api","custom_rules","white_label","unlimited"],"limits":{"matters":-1}}
 ]'::jsonb,
 'Briefcase', '#3B82F6'),

-- CRM
('crm', 'IP-NEXUS CRM', 'Gestión de relaciones con clientes', 'core',
 true, true, '{}', '{docket}', 79,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["contacts","companies","deals_basic"],"limits":{"contacts":100,"deals":50}},
   {"code":"pro","name":"Professional","price":79,"features":["pipeline_custom","automation","email_tracking","activities"],"limits":{"contacts":1000,"deals":-1}},
   {"code":"enterprise","name":"Enterprise","price":199,"features":["api","linkedin_integration","custom_fields_unlimited"],"limits":{"contacts":-1}}
 ]'::jsonb,
 'Users', '#EC4899'),

-- MARKETING
('marketing', 'IP-NEXUS Marketing', 'Automatización de marketing para PI', 'addon',
 false, true, '{crm}', '{}', 99,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["templates","campaigns_manual","lists"],"limits":{"emails_month":1000,"campaigns":5}},
   {"code":"pro","name":"Professional","price":99,"features":["automation","ab_testing","analytics"],"limits":{"emails_month":10000,"campaigns":-1}},
   {"code":"enterprise","name":"Enterprise","price":249,"features":["custom_domain","api","sms"],"limits":{"emails_month":-1}}
 ]'::jsonb,
 'Megaphone', '#F59E0B'),

-- GENIUS (AI)
('genius', 'IP-NEXUS Genius', 'Asistente de IA para PI', 'addon',
 false, true, '{}', '{docket,crm}', 49,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["chat","basic_analysis"],"limits":{"queries_month":100}},
   {"code":"pro","name":"Professional","price":49,"features":["document_analysis","personas","translator"],"limits":{"queries_month":500}},
   {"code":"enterprise","name":"Enterprise","price":149,"features":["training","api","unlimited"],"limits":{"queries_month":-1}}
 ]'::jsonb,
 'Sparkles', '#A855F7'),

-- FINANCE
('finance', 'IP-NEXUS Finance', 'Facturación y costes de PI', 'addon',
 false, true, '{docket}', '{}', 49,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["invoices_basic","cost_tracking"],"limits":{"invoices_month":20}},
   {"code":"pro","name":"Professional","price":49,"features":["time_tracking","profitability","reports","multi_currency"],"limits":{"invoices_month":-1}}
 ]'::jsonb,
 'Wallet', '#0EA5E9'),

-- MARKET
('market', 'IP-NEXUS Market', 'Compra y vende activos de PI', 'addon',
 true, true, '{}', '{docket}', 49,
 '[
   {"code":"browser","name":"Browser","price":0,"features":["browse","search","saved_searches"],"limits":{"view_only":true}},
   {"code":"seller","name":"Seller","price":49,"features":["listings","analytics","messaging"],"limits":{"listings":10}},
   {"code":"broker","name":"Broker","price":199,"features":["unlimited_listings","featured","api"],"limits":{"listings":-1}}
 ]'::jsonb,
 'Store', '#22C55E'),

-- DATA HUB
('datahub', 'IP-NEXUS Data Hub', 'Datos de registros mundiales', 'addon',
 false, true, '{}', '{docket}', 49,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["search","basic_lookup"],"limits":{"lookups_month":50}},
   {"code":"pro","name":"Professional","price":49,"features":["auto_enrich","alerts"],"limits":{"lookups_month":500}},
   {"code":"enterprise","name":"Enterprise","price":149,"features":["api","unlimited"],"limits":{"lookups_month":-1}}
 ]'::jsonb,
 'Database', '#6366F1'),

-- ANALYTICS
('analytics', 'IP-NEXUS Analytics', 'Business Intelligence para PI', 'addon',
 false, true, '{}', '{docket,crm,finance}', 49,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["dashboard","reports_basic"],"limits":{"reports":5}},
   {"code":"pro","name":"Professional","price":49,"features":["custom_dashboards","unlimited_reports","export","scheduled"],"limits":{"reports":-1}}
 ]'::jsonb,
 'BarChart3', '#8B5CF6'),

-- LEGAL OPS
('legalops', 'IP-NEXUS Legal Ops', 'Operaciones legales avanzadas', 'addon',
 false, true, '{docket,crm}', '{finance,genius}', 99,
 '[
   {"code":"pro","name":"Professional","price":99,"features":["client_360","comms_hub","ai_assistants","onboarding"],"limits":{}},
   {"code":"enterprise","name":"Enterprise","price":299,"features":["client_portal","workflow_builder","custom_forms"],"limits":{}}
 ]'::jsonb,
 'Scale', '#DC2626'),

-- MIGRATOR
('migrator', 'IP-NEXUS Migrator', 'Importa tus datos desde cualquier sistema', 'addon',
 false, true, '{}', '{}', 29,
 '[
   {"code":"basic","name":"Starter","price":0,"included_in_base":true,"features":["csv_import","basic_mapping"],"limits":{"imports_month":3}},
   {"code":"pro","name":"Professional","price":29,"features":["ai_mapping","unlimited_imports"],"limits":{"imports_month":-1}}
 ]'::jsonb,
 'Upload', '#94A3B8'),

-- API
('api', 'IP-NEXUS API', 'API REST para integraciones', 'addon',
 false, true, '{}', '{}', 99,
 '[
   {"code":"basic","name":"Developer","price":99,"features":["rest_api","webhooks"],"limits":{"requests_month":10000}},
   {"code":"pro","name":"Professional","price":299,"features":["graphql","priority_support"],"limits":{"requests_month":100000}},
   {"code":"enterprise","name":"Enterprise","price":999,"features":["dedicated_support","sla"],"limits":{"requests_month":-1}}
 ]'::jsonb,
 'Code', '#0891B2')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  tiers = EXCLUDED.tiers,
  base_price_monthly = EXCLUDED.base_price_monthly,
  is_standalone_available = EXCLUDED.is_standalone_available,
  is_addon_available = EXCLUDED.is_addon_available,
  required_modules = EXCLUDED.required_modules,
  recommended_modules = EXCLUDED.recommended_modules,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  updated_at = NOW();


-- ============================================
-- SUBSCRIPTION PACKS (Bundles)
-- ============================================

CREATE TABLE IF NOT EXISTS subscription_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  tagline VARCHAR(300),
  
  -- Type
  pack_type VARCHAR(30) NOT NULL DEFAULT 'bundle',
  
  -- Included modules
  included_modules JSONB NOT NULL DEFAULT '[]'::jsonb,
  
  -- Pricing
  price_monthly DECIMAL(10,2) NOT NULL DEFAULT 0,
  price_yearly DECIMAL(10,2),
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Limits
  max_users INTEGER,
  max_organizations INTEGER DEFAULT 1,
  
  -- Stripe
  stripe_price_id_monthly VARCHAR(100),
  stripe_price_id_yearly VARCHAR(100),
  stripe_product_id VARCHAR(100),
  
  -- UI
  is_featured BOOLEAN DEFAULT false,
  badge_text VARCHAR(50),
  display_order INTEGER DEFAULT 0,
  features_highlight TEXT[],
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_public BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE subscription_packs ENABLE ROW LEVEL SECURITY;

-- Public read access for pricing page
DROP POLICY IF EXISTS "Anyone can view active public packs" ON subscription_packs;
CREATE POLICY "Anyone can view active public packs"
  ON subscription_packs FOR SELECT
  USING (is_active = true AND is_public = true);


-- Insert predefined packs
INSERT INTO subscription_packs (
  code, name, tagline, description, pack_type,
  included_modules,
  price_monthly, price_yearly,
  max_users, is_featured, badge_text, display_order,
  features_highlight
) VALUES
-- FREE / STARTER
('starter', 'Starter', 'Empieza gratis', 
 'Perfecto para comenzar a organizar tu cartera de PI. Sin tarjeta de crédito.',
 'bundle',
 '[
   {"module_code":"docket","tier":"basic"},
   {"module_code":"crm","tier":"basic"},
   {"module_code":"genius","tier":"basic"}
 ]'::jsonb,
 0, 0,
 3, false, 'Gratis', 1,
 ARRAY['Hasta 50 expedientes', 'Hasta 100 contactos', '100 consultas IA/mes', '3 usuarios']),

-- PROFESSIONAL
('professional', 'Professional', 'Para despachos en crecimiento',
 'Todo lo que necesitas para gestionar tu práctica de PI de forma profesional.',
 'bundle',
 '[
   {"module_code":"docket","tier":"pro"},
   {"module_code":"crm","tier":"pro"},
   {"module_code":"marketing","tier":"basic"},
   {"module_code":"finance","tier":"basic"},
   {"module_code":"spider","tier":"basic"},
   {"module_code":"genius","tier":"pro"},
   {"module_code":"analytics","tier":"basic"}
 ]'::jsonb,
 299, 2990,
 10, true, 'Más Popular', 2,
 ARRAY['Hasta 500 expedientes', 'CRM avanzado con pipelines', 'Vigilancia de marcas', 'Facturación integrada', 'Asistente IA Pro', '10 usuarios']),

-- ENTERPRISE
('enterprise', 'Enterprise', 'Para grandes organizaciones',
 'Solución completa con todas las funcionalidades, soporte premium y SLA garantizado.',
 'enterprise',
 '[
   {"module_code":"docket","tier":"enterprise"},
   {"module_code":"crm","tier":"enterprise"},
   {"module_code":"marketing","tier":"pro"},
   {"module_code":"finance","tier":"pro"},
   {"module_code":"spider","tier":"pro"},
   {"module_code":"genius","tier":"enterprise"},
   {"module_code":"analytics","tier":"pro"},
   {"module_code":"legalops","tier":"pro"},
   {"module_code":"api","tier":"pro"}
 ]'::jsonb,
 999, 9990,
 -1, false, 'Todo Incluido', 3,
 ARRAY['Expedientes ilimitados', 'Contactos ilimitados', 'API completa', 'SSO/SAML', 'Soporte prioritario', 'Account Manager dedicado']),

-- SPIDER STANDALONE
('spider_standalone', 'Spider Pro', 'Vigilancia sin IP-NEXUS',
 'Servicio de vigilancia de marcas independiente. Ideal si ya tienes otro sistema de gestión.',
 'standalone',
 '[{"module_code":"spider","tier":"pro"}]'::jsonb,
 199, 1990,
 5, false, 'Standalone', 10,
 ARRAY['25 watchlists activas', 'Vigilancia global', 'Alertas en tiempo real', 'Análisis de similitud', 'Informes PDF']),

-- CRM + MARKETING BUNDLE
('crm_marketing', 'CRM + Marketing', 'Capta más clientes',
 'Combina gestión de clientes con automatización de marketing para máximo impacto comercial.',
 'bundle',
 '[
   {"module_code":"crm","tier":"pro"},
   {"module_code":"marketing","tier":"pro"}
 ]'::jsonb,
 199, 1990,
 5, false, 'Bundle', 11,
 ARRAY['CRM completo', 'Email marketing', 'Automatizaciones', 'Campañas ilimitadas', 'Analytics'])

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  tagline = EXCLUDED.tagline,
  description = EXCLUDED.description,
  included_modules = EXCLUDED.included_modules,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  features_highlight = EXCLUDED.features_highlight,
  updated_at = NOW();


-- ============================================
-- FUNCTION: Provision modules for organization
-- ============================================

CREATE OR REPLACE FUNCTION provision_pack_modules(
  p_organization_id UUID,
  p_pack_code VARCHAR(50),
  p_billing_cycle VARCHAR(20) DEFAULT 'monthly'
)
RETURNS TABLE(
  module_code VARCHAR,
  tier_code VARCHAR,
  status VARCHAR
) AS $$
DECLARE
  v_pack RECORD;
  v_module RECORD;
  v_module_config JSONB;
BEGIN
  -- Get pack
  SELECT * INTO v_pack FROM subscription_packs WHERE code = p_pack_code;
  
  IF v_pack IS NULL THEN
    RAISE EXCEPTION 'Pack not found: %', p_pack_code;
  END IF;
  
  -- Deactivate existing licenses
  UPDATE organization_module_licenses
  SET status = 'cancelled', cancelled_at = NOW()
  WHERE organization_id = p_organization_id AND status = 'active';
  
  -- Create licenses for each module in pack
  FOR v_module_config IN SELECT * FROM jsonb_array_elements(v_pack.included_modules)
  LOOP
    -- Find module
    SELECT * INTO v_module 
    FROM platform_modules 
    WHERE code = v_module_config->>'module_code';
    
    IF v_module IS NOT NULL THEN
      INSERT INTO organization_module_licenses (
        organization_id,
        module_id,
        license_type,
        tier_code,
        billing_cycle,
        status,
        activated_at
      ) VALUES (
        p_organization_id,
        v_module.id,
        CASE WHEN v_pack.pack_type = 'standalone' THEN 'standalone' ELSE 'included' END,
        v_module_config->>'tier',
        p_billing_cycle,
        'active',
        NOW()
      )
      ON CONFLICT (organization_id, module_id) DO UPDATE SET
        tier_code = EXCLUDED.tier_code,
        license_type = EXCLUDED.license_type,
        status = 'active',
        activated_at = NOW(),
        updated_at = NOW();
      
      -- Return result
      module_code := v_module.code;
      tier_code := v_module_config->>'tier';
      status := 'provisioned';
      RETURN NEXT;
    END IF;
  END LOOP;
  
  -- Update organization's plan
  UPDATE organizations
  SET plan = p_pack_code, updated_at = NOW()
  WHERE id = p_organization_id;
  
  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNCTION: Get module limits for organization
-- ============================================

CREATE OR REPLACE FUNCTION get_module_limit(
  p_organization_id UUID,
  p_module_code VARCHAR(50),
  p_limit_key VARCHAR(100)
)
RETURNS INTEGER AS $$
DECLARE
  v_license RECORD;
  v_tier JSONB;
  v_limit_value INTEGER;
BEGIN
  -- Get license
  SELECT oml.*, pm.code as module_code, pm.tiers
  INTO v_license
  FROM organization_module_licenses oml
  JOIN platform_modules pm ON pm.id = oml.module_id
  WHERE oml.organization_id = p_organization_id
    AND pm.code = p_module_code
    AND oml.status = 'active';
  
  IF v_license IS NULL THEN
    RETURN 0; -- No access
  END IF;
  
  -- Find tier in module tiers
  SELECT t INTO v_tier
  FROM jsonb_array_elements(v_license.tiers) t
  WHERE t->>'code' = v_license.tier_code;
  
  IF v_tier IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Check limits_override first
  IF v_license.limits_override IS NOT NULL AND v_license.limits_override ? p_limit_key THEN
    RETURN (v_license.limits_override->>p_limit_key)::INTEGER;
  END IF;
  
  -- Get limit from tier
  IF v_tier->'limits' IS NOT NULL AND v_tier->'limits' ? p_limit_key THEN
    v_limit_value := (v_tier->'limits'->>p_limit_key)::INTEGER;
    RETURN v_limit_value;
  END IF;
  
  RETURN -1; -- Default unlimited if not specified
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNCTION: Check if org has module access
-- ============================================

CREATE OR REPLACE FUNCTION has_module_access(
  p_organization_id UUID,
  p_module_code VARCHAR(50)
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM organization_module_licenses oml
    JOIN platform_modules pm ON pm.id = oml.module_id
    WHERE oml.organization_id = p_organization_id
      AND pm.code = p_module_code
      AND oml.status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ============================================
-- FUNCTION: Check feature access
-- ============================================

CREATE OR REPLACE FUNCTION has_feature_access(
  p_organization_id UUID,
  p_module_code VARCHAR(50),
  p_feature VARCHAR(100)
)
RETURNS BOOLEAN AS $$
DECLARE
  v_license RECORD;
  v_tier JSONB;
  v_features JSONB;
BEGIN
  -- Get license
  SELECT oml.*, pm.tiers
  INTO v_license
  FROM organization_module_licenses oml
  JOIN platform_modules pm ON pm.id = oml.module_id
  WHERE oml.organization_id = p_organization_id
    AND pm.code = p_module_code
    AND oml.status = 'active';
  
  IF v_license IS NULL THEN
    RETURN false;
  END IF;
  
  -- Find tier
  SELECT t INTO v_tier
  FROM jsonb_array_elements(v_license.tiers) t
  WHERE t->>'code' = v_license.tier_code;
  
  IF v_tier IS NULL THEN
    RETURN false;
  END IF;
  
  -- Check features
  v_features := v_tier->'features';
  IF v_features IS NOT NULL THEN
    RETURN v_features @> to_jsonb(p_feature);
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Grant execute permissions
GRANT EXECUTE ON FUNCTION provision_pack_modules TO authenticated;
GRANT EXECUTE ON FUNCTION get_module_limit TO authenticated;
GRANT EXECUTE ON FUNCTION has_module_access TO authenticated;
GRANT EXECUTE ON FUNCTION has_feature_access TO authenticated;