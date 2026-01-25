-- =====================================================
-- PRODUCTS MANAGEMENT SYSTEM FOR BACKOFFICE
-- =====================================================

-- Products base table (plans, modules, addons)
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Type: plan, module_standalone, addon, feature
  product_type VARCHAR(50) NOT NULL CHECK (product_type IN ('plan', 'module_standalone', 'addon', 'feature')),
  
  -- For standalone modules
  module_code VARCHAR(50),
  
  -- Branding
  icon VARCHAR(100),
  color VARCHAR(20),
  image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_visible BOOLEAN DEFAULT true,
  is_popular BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  -- Associated landing page
  landing_url VARCHAR(255),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Product prices
CREATE TABLE IF NOT EXISTS public.product_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Billing period: monthly, yearly, one_time
  billing_period VARCHAR(20) NOT NULL CHECK (billing_period IN ('monthly', 'yearly', 'one_time')),
  
  -- Pricing
  price DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'EUR',
  
  -- Discounts (for yearly vs monthly comparison)
  discount_percent INTEGER DEFAULT 0,
  
  -- Stripe integration
  stripe_price_id VARCHAR(255),
  stripe_product_id VARCHAR(255),
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(product_id, billing_period, currency)
);

-- Features included in each product
CREATE TABLE IF NOT EXISTS public.product_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  feature_code VARCHAR(100) NOT NULL,
  feature_name VARCHAR(255) NOT NULL,
  feature_description TEXT,
  
  -- Limits (null = unlimited)
  limit_value INTEGER,
  limit_unit VARCHAR(50), -- users, matters, searches, storage_gb, api_requests, etc.
  
  -- UI display
  is_highlighted BOOLEAN DEFAULT false,
  sort_order INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Plan inclusions: what each plan includes
CREATE TABLE IF NOT EXISTS public.plan_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  included_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Specific limits for this plan (overrides product default)
  limit_override INTEGER,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(plan_product_id, included_product_id)
);

-- Add-ons configuration
CREATE TABLE IF NOT EXISTS public.product_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  addon_product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Availability
  available_for_plans TEXT[] DEFAULT '{}',
  included_in_plans TEXT[] DEFAULT '{}',
  
  -- Requirements
  requires_product_id UUID REFERENCES public.products(id),
  incompatible_with TEXT[] DEFAULT '{}',
  
  -- Minimum plan required
  min_plan_required VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(addon_product_id)
);

-- Office-specific pricing (for IP offices add-ons)
CREATE TABLE IF NOT EXISTS public.office_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_code VARCHAR(20) NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  
  -- Specific pricing
  price_monthly DECIMAL(10,2),
  price_yearly DECIMAL(10,2),
  
  -- Plan inclusion
  included_in_plans TEXT[] DEFAULT '{}',
  
  -- Availability
  is_available BOOLEAN DEFAULT true,
  min_plan_required VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(office_code, product_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products(product_type);
CREATE INDEX IF NOT EXISTS idx_products_active ON public.products(is_active);
CREATE INDEX IF NOT EXISTS idx_products_code ON public.products(code);
CREATE INDEX IF NOT EXISTS idx_product_prices_product ON public.product_prices(product_id);
CREATE INDEX IF NOT EXISTS idx_product_features_product ON public.product_features(product_id);
CREATE INDEX IF NOT EXISTS idx_plan_inclusions_plan ON public.plan_inclusions(plan_product_id);
CREATE INDEX IF NOT EXISTS idx_plan_inclusions_included ON public.plan_inclusions(included_product_id);
CREATE INDEX IF NOT EXISTS idx_product_addons_addon ON public.product_addons(addon_product_id);

-- Enable RLS
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_inclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.office_pricing ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read for active products (for pricing pages)
CREATE POLICY "Public can view active products" ON public.products
  FOR SELECT USING (is_active = true AND is_visible = true);

CREATE POLICY "Service role full access to products" ON public.products
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view active prices" ON public.product_prices
  FOR SELECT USING (is_active = true);

CREATE POLICY "Service role full access to prices" ON public.product_prices
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view features" ON public.product_features
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to features" ON public.product_features
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view plan inclusions" ON public.plan_inclusions
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to inclusions" ON public.plan_inclusions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view addons config" ON public.product_addons
  FOR SELECT USING (true);

CREATE POLICY "Service role full access to addons" ON public.product_addons
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Public can view office pricing" ON public.office_pricing
  FOR SELECT USING (is_available = true);

CREATE POLICY "Service role full access to office pricing" ON public.office_pricing
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_products_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_products_timestamp
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE TRIGGER update_product_prices_timestamp
  BEFORE UPDATE ON public.product_prices
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE TRIGGER update_product_addons_timestamp
  BEFORE UPDATE ON public.product_addons
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

CREATE TRIGGER update_office_pricing_timestamp
  BEFORE UPDATE ON public.office_pricing
  FOR EACH ROW EXECUTE FUNCTION update_products_updated_at();

-- =====================================================
-- SEED DATA
-- =====================================================

-- Plans
INSERT INTO public.products (code, name, description, product_type, icon, color, is_popular, sort_order) VALUES
('plan_starter', 'Starter', 'Para profesionales independientes y pequeños despachos', 'plan', 'Zap', '#10B981', false, 1),
('plan_professional', 'Professional', 'Para despachos en crecimiento con necesidades avanzadas', 'plan', 'Briefcase', '#3B82F6', true, 2),
('plan_enterprise', 'Enterprise', 'Para grandes despachos y corporaciones con requisitos enterprise', 'plan', 'Building2', '#8B5CF6', false, 3)
ON CONFLICT (code) DO NOTHING;

-- Standalone Modules
INSERT INTO public.products (code, name, description, product_type, module_code, icon, color, landing_url, sort_order) VALUES
('module_docket', 'IP-DOCKET', 'Gestión integral de expedientes de propiedad intelectual', 'module_standalone', 'DOCKET', 'FileText', '#0EA5E9', '/docket', 10),
('module_spider', 'IP-SPIDER', 'Vigilancia de marcas con inteligencia artificial', 'module_standalone', 'SPIDER', 'Radar', '#8B5CF6', '/spider', 11),
('module_market', 'IP-MARKET', 'Marketplace de agentes de propiedad intelectual', 'module_standalone', 'MARKET', 'Globe', '#10B981', '/market', 12),
('module_genius', 'IP-GENIUS', 'Asistente de IA especializado en PI', 'addon', 'GENIUS', 'Brain', '#F59E0B', '/genius', 13)
ON CONFLICT (code) DO NOTHING;

-- Office Add-ons
INSERT INTO public.products (code, name, description, product_type, icon, sort_order) VALUES
('addon_office_oepm', 'Oficina OEPM', 'Conexión con la Oficina Española de Patentes y Marcas', 'addon', 'Flag', 20),
('addon_office_euipo', 'Oficina EUIPO', 'Conexión con la Oficina de Propiedad Intelectual de la UE', 'addon', 'Flag', 21),
('addon_office_wipo', 'Oficina WIPO', 'Conexión con la Organización Mundial de la Propiedad Intelectual', 'addon', 'Globe2', 22),
('addon_office_uspto', 'Oficina USPTO', 'Conexión con la Oficina de Patentes y Marcas de EE.UU.', 'addon', 'Flag', 23),
('addon_office_epo', 'Oficina EPO', 'Conexión con la Oficina Europea de Patentes', 'addon', 'Flag', 24),
('addon_office_ukipo', 'Oficina UKIPO', 'Conexión con la Oficina de Propiedad Intelectual del Reino Unido', 'addon', 'Flag', 25)
ON CONFLICT (code) DO NOTHING;

-- Plan prices
INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'monthly', 29, 0, 'EUR' FROM public.products WHERE code = 'plan_starter'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'yearly', 278, 20, 'EUR' FROM public.products WHERE code = 'plan_starter'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'monthly', 99, 0, 'EUR' FROM public.products WHERE code = 'plan_professional'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'yearly', 950, 20, 'EUR' FROM public.products WHERE code = 'plan_professional'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'monthly', 299, 0, 'EUR' FROM public.products WHERE code = 'plan_enterprise'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, discount_percent, currency)
SELECT id, 'yearly', 2870, 20, 'EUR' FROM public.products WHERE code = 'plan_enterprise'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

-- Office add-on prices
INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 19, 'EUR' FROM public.products WHERE code = 'addon_office_euipo'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 29, 'EUR' FROM public.products WHERE code = 'addon_office_wipo'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 39, 'EUR' FROM public.products WHERE code = 'addon_office_uspto'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 29, 'EUR' FROM public.products WHERE code = 'addon_office_epo'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 19, 'EUR' FROM public.products WHERE code = 'addon_office_ukipo'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

-- Module prices
INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 49, 'EUR' FROM public.products WHERE code = 'module_spider'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

INSERT INTO public.product_prices (product_id, billing_period, price, currency)
SELECT id, 'monthly', 149, 'EUR' FROM public.products WHERE code = 'module_genius'
ON CONFLICT (product_id, billing_period, currency) DO NOTHING;

-- Plan features
INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'users', 'Usuarios', 1, 'users', true, 1 FROM public.products WHERE code = 'plan_starter';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'matters', 'Expedientes', 100, 'matters', false, 2 FROM public.products WHERE code = 'plan_starter';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'storage', 'Almacenamiento', 5, 'storage_gb', false, 3 FROM public.products WHERE code = 'plan_starter';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'users', 'Usuarios', 5, 'users', true, 1 FROM public.products WHERE code = 'plan_professional';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'matters', 'Expedientes', NULL, 'matters', true, 2 FROM public.products WHERE code = 'plan_professional';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'storage', 'Almacenamiento', 50, 'storage_gb', false, 3 FROM public.products WHERE code = 'plan_professional';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'api_requests', 'API requests/mes', 10000, 'api_requests', false, 4 FROM public.products WHERE code = 'plan_professional';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'users', 'Usuarios', NULL, 'users', true, 1 FROM public.products WHERE code = 'plan_enterprise';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'matters', 'Expedientes', NULL, 'matters', true, 2 FROM public.products WHERE code = 'plan_enterprise';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'storage', 'Almacenamiento', NULL, 'storage_gb', true, 3 FROM public.products WHERE code = 'plan_enterprise';

INSERT INTO public.product_features (product_id, feature_code, feature_name, limit_value, limit_unit, is_highlighted, sort_order)
SELECT id, 'api_requests', 'API requests/mes', NULL, 'api_requests', false, 4 FROM public.products WHERE code = 'plan_enterprise';

-- Plan inclusions
-- Starter includes OEPM
INSERT INTO public.plan_inclusions (plan_product_id, included_product_id)
SELECT p1.id, p2.id FROM public.products p1, public.products p2 
WHERE p1.code = 'plan_starter' AND p2.code = 'addon_office_oepm'
ON CONFLICT (plan_product_id, included_product_id) DO NOTHING;

-- Professional includes OEPM + EUIPO
INSERT INTO public.plan_inclusions (plan_product_id, included_product_id)
SELECT p1.id, p2.id FROM public.products p1, public.products p2 
WHERE p1.code = 'plan_professional' AND p2.code = 'addon_office_oepm'
ON CONFLICT (plan_product_id, included_product_id) DO NOTHING;

INSERT INTO public.plan_inclusions (plan_product_id, included_product_id)
SELECT p1.id, p2.id FROM public.products p1, public.products p2 
WHERE p1.code = 'plan_professional' AND p2.code = 'addon_office_euipo'
ON CONFLICT (plan_product_id, included_product_id) DO NOTHING;

-- Enterprise includes all offices
INSERT INTO public.plan_inclusions (plan_product_id, included_product_id)
SELECT p1.id, p2.id FROM public.products p1, public.products p2 
WHERE p1.code = 'plan_enterprise' AND p2.code LIKE 'addon_office_%'
ON CONFLICT (plan_product_id, included_product_id) DO NOTHING;

-- Enterprise includes GENIUS
INSERT INTO public.plan_inclusions (plan_product_id, included_product_id)
SELECT p1.id, p2.id FROM public.products p1, public.products p2 
WHERE p1.code = 'plan_enterprise' AND p2.code = 'module_genius'
ON CONFLICT (plan_product_id, included_product_id) DO NOTHING;

-- Configure add-ons availability
INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans)
SELECT id, ARRAY['plan_starter', 'plan_professional', 'plan_enterprise'], ARRAY['plan_professional', 'plan_enterprise']
FROM public.products WHERE code = 'addon_office_euipo'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans)
SELECT id, ARRAY['plan_starter', 'plan_professional', 'plan_enterprise'], ARRAY['plan_enterprise']
FROM public.products WHERE code = 'addon_office_wipo'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans, min_plan_required)
SELECT id, ARRAY['plan_professional', 'plan_enterprise'], ARRAY['plan_enterprise'], 'plan_professional'
FROM public.products WHERE code = 'addon_office_uspto'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans, min_plan_required)
SELECT id, ARRAY['plan_professional', 'plan_enterprise'], ARRAY['plan_enterprise'], 'plan_professional'
FROM public.products WHERE code = 'addon_office_epo'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans)
SELECT id, ARRAY['plan_starter', 'plan_professional', 'plan_enterprise'], ARRAY[]::text[]
FROM public.products WHERE code = 'addon_office_ukipo'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans, min_plan_required)
SELECT id, ARRAY['plan_professional', 'plan_enterprise'], ARRAY['plan_enterprise'], 'plan_professional'
FROM public.products WHERE code = 'module_genius'
ON CONFLICT (addon_product_id) DO NOTHING;

INSERT INTO public.product_addons (addon_product_id, available_for_plans, included_in_plans)
SELECT id, ARRAY['plan_starter', 'plan_professional', 'plan_enterprise'], ARRAY[]::text[]
FROM public.products WHERE code = 'module_spider'
ON CONFLICT (addon_product_id) DO NOTHING;