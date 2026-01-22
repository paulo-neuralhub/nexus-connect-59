-- FASE 1: Infraestructura Capabilities + Jurisdicciones + SDUI + AI usage (retry: fix casts)
-- Error previo: 42804 (limit_value int vs text) en seed plan_capabilities.

BEGIN;

-- 0) Helpers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 1) CAPABILITIES
CREATE TABLE IF NOT EXISTS public.capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  module_code TEXT,
  capability_type TEXT DEFAULT 'boolean',
  is_metered BOOLEAN DEFAULT false,
  unit_name TEXT,
  unit_price DECIMAL(10,4),
  icon TEXT,
  sort_order INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_capabilities_category ON public.capabilities(category);
CREATE INDEX IF NOT EXISTS idx_capabilities_module ON public.capabilities(module_code);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_capabilities_updated_at') THEN
    CREATE TRIGGER trg_capabilities_updated_at
    BEFORE UPDATE ON public.capabilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 2) JURISDICTIONS
CREATE TABLE IF NOT EXISTS public.jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  name_local TEXT,
  region TEXT NOT NULL,
  tier INT DEFAULT 1,
  price_monthly DECIMAL(10,2) NOT NULL,
  price_yearly DECIMAL(10,2),
  has_knowledge_base BOOLEAN DEFAULT true,
  has_spider_monitoring BOOLEAN DEFAULT true,
  has_deadline_rules BOOLEAN DEFAULT true,
  has_official_forms BOOLEAN DEFAULT false,
  has_api_integration BOOLEAN DEFAULT false,
  ipo_name TEXT,
  ipo_url TEXT,
  ipo_api_url TEXT,
  flag_emoji TEXT,
  icon TEXT,
  stripe_price_id_monthly TEXT,
  stripe_price_id_yearly TEXT,
  is_active BOOLEAN DEFAULT true,
  kb_last_updated TIMESTAMPTZ,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_region ON public.jurisdictions(region);
CREATE INDEX IF NOT EXISTS idx_jurisdictions_tier ON public.jurisdictions(tier);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jurisdictions_updated_at') THEN
    CREATE TRIGGER trg_jurisdictions_updated_at
    BEFORE UPDATE ON public.jurisdictions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 3) SUBSCRIPTION_PLANS (extend existing)
ALTER TABLE public.subscription_plans
  ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'suite',
  ADD COLUMN IF NOT EXISTS max_users INT,
  ADD COLUMN IF NOT EXISTS max_storage_gb INT,
  ADD COLUMN IF NOT EXISTS trial_days INT DEFAULT 14,
  ADD COLUMN IF NOT EXISTS trial_includes_all BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS stripe_product_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id_monthly TEXT,
  ADD COLUMN IF NOT EXISTS stripe_price_id_yearly TEXT,
  ADD COLUMN IF NOT EXISTS ui_config JSONB DEFAULT '{
    "layout": "standard",
    "theme": "default",
    "show_upgrade_prompts": true,
    "sidebar_style": "full"
  }'::jsonb,
  ADD COLUMN IF NOT EXISTS badge_text TEXT,
  ADD COLUMN IF NOT EXISTS badge_color TEXT,
  ADD COLUMN IF NOT EXISTS highlight BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_subscription_plans_updated_at') THEN
    CREATE TRIGGER trg_subscription_plans_updated_at
    BEFORE UPDATE ON public.subscription_plans
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 4) PLAN_CAPABILITIES
CREATE TABLE IF NOT EXISTS public.plan_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  capability_code TEXT NOT NULL,
  limit_value INT,
  limit_period TEXT,
  config_override JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, capability_code)
);
CREATE INDEX IF NOT EXISTS idx_plan_capabilities_plan ON public.plan_capabilities(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_capabilities_code ON public.plan_capabilities(capability_code);

-- 5) PLAN_JURISDICTIONS
CREATE TABLE IF NOT EXISTS public.plan_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL,
  inclusion_type TEXT DEFAULT 'base',
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(plan_id, jurisdiction_code)
);

-- 6) ORGANIZATION_SUBSCRIPTIONS
CREATE TABLE IF NOT EXISTS public.organization_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.subscription_plans(id),
  status TEXT DEFAULT 'trialing',
  billing_cycle TEXT DEFAULT 'monthly',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  trial_started_at TIMESTAMPTZ DEFAULT now(),
  trial_ends_at TIMESTAMPTZ,
  credit_balance DECIMAL(10,2) DEFAULT 0,
  auto_recharge BOOLEAN DEFAULT false,
  auto_recharge_threshold DECIMAL(10,2),
  auto_recharge_amount DECIMAL(10,2),
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  canceled_at TIMESTAMPTZ,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id)
);
CREATE INDEX IF NOT EXISTS idx_org_subs_org ON public.organization_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_subs_status ON public.organization_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_org_subs_trial ON public.organization_subscriptions(trial_ends_at) WHERE status = 'trialing';
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_subscriptions_updated_at') THEN
    CREATE TRIGGER trg_org_subscriptions_updated_at
    BEFORE UPDATE ON public.organization_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 7) ORGANIZATION_CAPABILITIES
CREATE TABLE IF NOT EXISTS public.organization_capabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  capability_code TEXT NOT NULL,
  limit_override INT,
  is_unlimited BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, capability_code)
);
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_org_capabilities_updated_at') THEN
    CREATE TRIGGER trg_org_capabilities_updated_at
    BEFORE UPDATE ON public.organization_capabilities
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 8) ORGANIZATION_JURISDICTIONS
CREATE TABLE IF NOT EXISTS public.organization_jurisdictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  jurisdiction_code TEXT NOT NULL,
  is_base BOOLEAN DEFAULT false,
  is_from_plan BOOLEAN DEFAULT false,
  purchased_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  stripe_subscription_item_id TEXT,
  is_favorite BOOLEAN DEFAULT false,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, jurisdiction_code)
);
CREATE INDEX IF NOT EXISTS idx_org_jurisdictions_org ON public.organization_jurisdictions(organization_id);

-- 9) KB (pgvector)
CREATE EXTENSION IF NOT EXISTS vector;
CREATE TABLE IF NOT EXISTS public.jurisdiction_knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  jurisdiction_code TEXT NOT NULL,
  category TEXT NOT NULL,
  subcategory TEXT,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  summary TEXT,
  embedding vector(1536),
  source_name TEXT,
  source_url TEXT,
  source_date DATE,
  effective_date DATE,
  expiry_date DATE,
  version INT DEFAULT 1,
  previous_version_id UUID,
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verified_by TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_kb_jurisdiction ON public.jurisdiction_knowledge_base(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_kb_category ON public.jurisdiction_knowledge_base(category, subcategory);
CREATE INDEX IF NOT EXISTS idx_kb_active ON public.jurisdiction_knowledge_base(is_active) WHERE is_active = true;
DO $$
BEGIN
  BEGIN
    EXECUTE 'CREATE INDEX IF NOT EXISTS idx_kb_embedding ON public.jurisdiction_knowledge_base USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)';
  EXCEPTION WHEN others THEN
    NULL;
  END;
END $$;
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_jkb_updated_at') THEN
    CREATE TRIGGER trg_jkb_updated_at
    BEFORE UPDATE ON public.jurisdiction_knowledge_base
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- 10) CAPABILITY_USAGE
CREATE TABLE IF NOT EXISTS public.capability_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  capability_code TEXT NOT NULL,
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  usage_count INT DEFAULT 0,
  usage_cost DECIMAL(10,4) DEFAULT 0,
  limit_value INT,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, capability_code, period_start)
);
CREATE INDEX IF NOT EXISTS idx_cap_usage_org ON public.capability_usage(organization_id, period_start);

-- 11) AI usage events + view monthly
CREATE TABLE IF NOT EXISTS public.ai_usage_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.users(id),
  operation_type TEXT NOT NULL,
  jurisdiction_code TEXT,
  input_tokens INT NOT NULL DEFAULT 0,
  output_tokens INT NOT NULL DEFAULT 0,
  total_tokens INT GENERATED ALWAYS AS (input_tokens + output_tokens) STORED,
  cost_usd DECIMAL(10,6),
  model_used TEXT,
  module TEXT,
  matter_id UUID,
  conversation_id UUID,
  query_hash TEXT,
  kb_chunks_used TEXT[],
  response_quality SMALLINT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_org ON public.ai_usage_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_date ON public.ai_usage_events(created_at);
CREATE INDEX IF NOT EXISTS idx_ai_usage_events_type ON public.ai_usage_events(operation_type);

CREATE OR REPLACE VIEW public.ai_usage_monthly AS
SELECT
  id,
  organization_id,
  period_start,
  period_end,
  COALESCE(chat_messages, 0) AS total_queries,
  COALESCE(document_analyses, 0) AS total_analyses,
  COALESCE(document_generations, 0) AS total_generations,
  COALESCE(messages_count, 0) AS total_agent_runs,
  COALESCE(tokens_input, 0)::bigint AS total_input_tokens,
  COALESCE(tokens_output, 0)::bigint AS total_output_tokens,
  (COALESCE(tokens_input, 0) + COALESCE(tokens_output, 0))::bigint AS total_tokens,
  (COALESCE(estimated_cost_cents, 0) / 100.0)::numeric(10,4) AS total_cost_usd,
  updated_at
FROM public.ai_usage;

-- 12) platform_modules additions for SDUI
ALTER TABLE public.platform_modules
  ADD COLUMN IF NOT EXISTS is_core BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS show_in_sidebar BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS badge_text TEXT;

-- 13) RLS
ALTER TABLE public.capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_capabilities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_jurisdictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jurisdiction_knowledge_base ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.capability_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_events ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='capabilities' AND policyname='Anyone can view capabilities') THEN
    CREATE POLICY "Anyone can view capabilities" ON public.capabilities FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='jurisdictions' AND policyname='Anyone can view jurisdictions') THEN
    CREATE POLICY "Anyone can view jurisdictions" ON public.jurisdictions FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='subscription_plans' AND policyname='Anyone can view active plans') THEN
    CREATE POLICY "Anyone can view active plans" ON public.subscription_plans FOR SELECT USING (is_active = true AND is_public = true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plan_capabilities' AND policyname='Anyone can view plan capabilities') THEN
    CREATE POLICY "Anyone can view plan capabilities" ON public.plan_capabilities FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='plan_jurisdictions' AND policyname='Anyone can view plan jurisdictions') THEN
    CREATE POLICY "Anyone can view plan jurisdictions" ON public.plan_jurisdictions FOR SELECT USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_subscriptions' AND policyname='Users can view own org subscription') THEN
    CREATE POLICY "Users can view own org subscription" ON public.organization_subscriptions
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_capabilities' AND policyname='Users can view own org capabilities') THEN
    CREATE POLICY "Users can view own org capabilities" ON public.organization_capabilities
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='organization_jurisdictions' AND policyname='Users can view own org jurisdictions') THEN
    CREATE POLICY "Users can view own org jurisdictions" ON public.organization_jurisdictions
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='capability_usage' AND policyname='Users can view own org usage') THEN
    CREATE POLICY "Users can view own org usage" ON public.capability_usage
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_usage_events' AND policyname='Users can view own ai usage events') THEN
    CREATE POLICY "Users can view own ai usage events" ON public.ai_usage_events
    FOR SELECT
    USING (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='ai_usage_events' AND policyname='Users can insert own ai usage events') THEN
    CREATE POLICY "Users can insert own ai usage events" ON public.ai_usage_events
    FOR INSERT
    WITH CHECK (organization_id IN (SELECT organization_id FROM public.memberships WHERE user_id = auth.uid()));
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='jurisdiction_knowledge_base' AND policyname='Users can view KB of subscribed jurisdictions') THEN
    CREATE POLICY "Users can view KB of subscribed jurisdictions"
    ON public.jurisdiction_knowledge_base
    FOR SELECT
    USING (
      EXISTS (
        SELECT 1
        FROM public.organization_jurisdictions oj
        JOIN public.memberships m ON m.organization_id = oj.organization_id
        WHERE m.user_id = auth.uid()
          AND oj.jurisdiction_code = public.jurisdiction_knowledge_base.jurisdiction_code
          AND (oj.expires_at IS NULL OR oj.expires_at > now())
      )
      OR EXISTS (
        SELECT 1
        FROM public.organization_subscriptions os
        JOIN public.memberships m ON m.organization_id = os.organization_id
        JOIN public.plan_jurisdictions pj ON pj.plan_id = os.plan_id
        WHERE m.user_id = auth.uid()
          AND pj.inclusion_type = 'all'
          AND os.status IN ('active', 'trialing')
      )
    );
  END IF;
END $$;

-- 14) RPC (same as prior attempt)
CREATE OR REPLACE FUNCTION public.check_capability(
  p_organization_id UUID,
  p_capability_code TEXT,
  p_increment BOOLEAN DEFAULT false
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan_id UUID;
  v_plan_code TEXT;
  v_status TEXT;
  v_has_capability BOOLEAN := false;
  v_limit_value INT;
  v_limit_period TEXT;
  v_current_usage INT := 0;
  v_is_metered BOOLEAN;
  v_unit_price DECIMAL(10,4);
  v_credit_balance DECIMAL(10,2);
  v_period_start DATE;
  v_period_end DATE;
  v_is_unlimited_override BOOLEAN := false;
BEGIN
  SELECT os.plan_id, os.status, os.credit_balance, sp.code
  INTO v_plan_id, v_status, v_credit_balance, v_plan_code
  FROM public.organization_subscriptions os
  JOIN public.subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = p_organization_id
    AND os.status IN ('active', 'trialing');

  IF v_plan_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'no_active_subscription', 'upgrade_available', true);
  END IF;

  SELECT pc.limit_value, pc.limit_period
  INTO v_limit_value, v_limit_period
  FROM public.plan_capabilities pc
  WHERE pc.plan_id = v_plan_id
    AND pc.capability_code = p_capability_code;

  IF FOUND THEN
    v_has_capability := true;
  END IF;

  IF NOT v_has_capability THEN
    SELECT oc.limit_override, oc.is_unlimited
    INTO v_limit_value, v_is_unlimited_override
    FROM public.organization_capabilities oc
    WHERE oc.organization_id = p_organization_id
      AND oc.capability_code = p_capability_code
      AND (oc.expires_at IS NULL OR oc.expires_at > now());

    IF FOUND THEN
      v_has_capability := true;
      IF v_is_unlimited_override OR v_limit_value IS NULL THEN
        v_limit_value := NULL;
      END IF;
    END IF;
  END IF;

  IF NOT v_has_capability THEN
    SELECT true INTO v_has_capability
    FROM public.capabilities c
    WHERE c.code = p_capability_code
      AND c.category = 'core'
      AND c.is_active = true;
  END IF;

  IF NOT v_has_capability THEN
    SELECT c.is_metered, c.unit_price
    INTO v_is_metered, v_unit_price
    FROM public.capabilities c
    WHERE c.code = p_capability_code;

    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'capability_not_included',
      'capability_code', p_capability_code,
      'can_purchase', COALESCE(v_is_metered, false),
      'unit_price', v_unit_price,
      'upgrade_available', true
    );
  END IF;

  IF v_limit_value IS NOT NULL THEN
    v_period_start := CASE v_limit_period
      WHEN 'day' THEN CURRENT_DATE
      WHEN 'week' THEN date_trunc('week', CURRENT_DATE)::DATE
      WHEN 'month' THEN date_trunc('month', CURRENT_DATE)::DATE
      WHEN 'year' THEN date_trunc('year', CURRENT_DATE)::DATE
      ELSE date_trunc('month', CURRENT_DATE)::DATE
    END;

    v_period_end := (CASE v_limit_period
      WHEN 'day' THEN (v_period_start + INTERVAL '1 day')
      WHEN 'week' THEN (v_period_start + INTERVAL '1 week')
      WHEN 'month' THEN (v_period_start + INTERVAL '1 month')
      WHEN 'year' THEN (v_period_start + INTERVAL '1 year')
      ELSE (v_period_start + INTERVAL '1 month')
    END)::DATE;

    SELECT COALESCE(usage_count, 0) INTO v_current_usage
    FROM public.capability_usage
    WHERE organization_id = p_organization_id
      AND capability_code = p_capability_code
      AND period_start = v_period_start;

    IF v_current_usage >= v_limit_value THEN
      SELECT c.is_metered, c.unit_price
      INTO v_is_metered, v_unit_price
      FROM public.capabilities c
      WHERE c.code = p_capability_code;

      IF COALESCE(v_is_metered, false) AND COALESCE(v_credit_balance, 0) >= COALESCE(v_unit_price, 0) THEN
        IF p_increment THEN
          UPDATE public.organization_subscriptions
          SET credit_balance = credit_balance - COALESCE(v_unit_price, 0),
              updated_at = now()
          WHERE organization_id = p_organization_id;
        END IF;
      ELSE
        RETURN jsonb_build_object(
          'allowed', false,
          'reason', 'limit_reached',
          'limit', v_limit_value,
          'used', v_current_usage,
          'period', v_limit_period,
          'resets_at', v_period_end,
          'can_purchase', COALESCE(v_is_metered, false),
          'unit_price', v_unit_price,
          'credit_balance', COALESCE(v_credit_balance, 0)
        );
      END IF;
    END IF;

    IF p_increment THEN
      INSERT INTO public.capability_usage (
        organization_id,
        capability_code,
        period_start,
        period_end,
        usage_count,
        limit_value
      ) VALUES (
        p_organization_id,
        p_capability_code,
        v_period_start,
        v_period_end,
        1,
        v_limit_value
      )
      ON CONFLICT (organization_id, capability_code, period_start)
      DO UPDATE SET
        usage_count = public.capability_usage.usage_count + 1,
        updated_at = now();
    END IF;
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'plan', v_plan_code,
    'limit', v_limit_value,
    'used', CASE WHEN p_increment THEN v_current_usage + 1 ELSE v_current_usage END,
    'remaining', CASE
      WHEN v_limit_value IS NULL THEN NULL
      ELSE v_limit_value - v_current_usage - CASE WHEN p_increment THEN 1 ELSE 0 END
    END,
    'period', v_limit_period,
    'is_unlimited', v_limit_value IS NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.check_jurisdiction(
  p_organization_id UUID,
  p_jurisdiction_code TEXT
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_has_access BOOLEAN := false;
  v_jurisdiction RECORD;
  v_plan_code TEXT;
BEGIN
  SELECT * INTO v_jurisdiction
  FROM public.jurisdictions
  WHERE code = p_jurisdiction_code AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'jurisdiction_not_found');
  END IF;

  SELECT true INTO v_has_access
  FROM public.organization_jurisdictions oj
  WHERE oj.organization_id = p_organization_id
    AND oj.jurisdiction_code = p_jurisdiction_code
    AND (oj.expires_at IS NULL OR oj.expires_at > now());

  IF NOT v_has_access THEN
    SELECT sp.code INTO v_plan_code
    FROM public.organization_subscriptions os
    JOIN public.subscription_plans sp ON sp.id = os.plan_id
    JOIN public.plan_jurisdictions pj ON pj.plan_id = sp.id
    WHERE os.organization_id = p_organization_id
      AND os.status IN ('active', 'trialing')
      AND pj.inclusion_type = 'all';

    IF FOUND THEN
      v_has_access := true;
    END IF;
  END IF;

  IF NOT v_has_access THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'jurisdiction_not_subscribed',
      'jurisdiction', jsonb_build_object(
        'code', v_jurisdiction.code,
        'name', v_jurisdiction.name,
        'flag', v_jurisdiction.flag_emoji,
        'price_monthly', v_jurisdiction.price_monthly,
        'tier', v_jurisdiction.tier
      ),
      'can_purchase', true
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'jurisdiction', jsonb_build_object(
      'code', v_jurisdiction.code,
      'name', v_jurisdiction.name,
      'flag', v_jurisdiction.flag_emoji,
      'has_kb', v_jurisdiction.has_knowledge_base,
      'has_spider', v_jurisdiction.has_spider_monitoring,
      'has_deadlines', v_jurisdiction.has_deadline_rules,
      'kb_last_updated', v_jurisdiction.kb_last_updated
    )
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_organization_jurisdictions(
  p_organization_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
  v_has_all BOOLEAN := false;
BEGIN
  SELECT true INTO v_has_all
  FROM public.organization_subscriptions os
  JOIN public.plan_jurisdictions pj ON pj.plan_id = os.plan_id
  WHERE os.organization_id = p_organization_id
    AND os.status IN ('active', 'trialing')
    AND pj.inclusion_type = 'all';

  SELECT jsonb_agg(
    jsonb_build_object(
      'code', j.code,
      'name', j.name,
      'flag', j.flag_emoji,
      'region', j.region,
      'tier', j.tier,
      'price_monthly', j.price_monthly,
      'has_kb', j.has_knowledge_base,
      'has_spider', j.has_spider_monitoring,
      'kb_last_updated', j.kb_last_updated,
      'is_subscribed', COALESCE(v_has_all, false) OR oj.id IS NOT NULL,
      'is_base', COALESCE(oj.is_base, false),
      'is_favorite', COALESCE(oj.is_favorite, false),
      'expires_at', oj.expires_at
    )
    ORDER BY
      CASE WHEN oj.id IS NOT NULL OR v_has_all THEN 0 ELSE 1 END,
      COALESCE(oj.sort_order, 999),
      j.sort_order
  ) INTO v_result
  FROM public.jurisdictions j
  LEFT JOIN public.organization_jurisdictions oj
    ON oj.jurisdiction_code = j.code
    AND oj.organization_id = p_organization_id
    AND (oj.expires_at IS NULL OR oj.expires_at > now())
  WHERE j.is_active = true;

  RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

CREATE OR REPLACE FUNCTION public.get_ui_config(
  p_organization_id UUID
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_plan RECORD;
  v_capabilities TEXT[];
  v_modules JSONB;
  v_sidebar JSONB;
BEGIN
  SELECT sp.* INTO v_plan
  FROM public.organization_subscriptions os
  JOIN public.subscription_plans sp ON sp.id = os.plan_id
  WHERE os.organization_id = p_organization_id
    AND os.status IN ('active', 'trialing');

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'layout', 'minimal',
      'has_subscription', false,
      'show_upgrade_prompts', true,
      'modules', '{}'::jsonb,
      'sidebar', '[]'::jsonb
    );
  END IF;

  SELECT array_agg(DISTINCT cap_code) INTO v_capabilities
  FROM (
    SELECT pc.capability_code as cap_code
    FROM public.plan_capabilities pc
    WHERE pc.plan_id = v_plan.id
    UNION
    SELECT oc.capability_code
    FROM public.organization_capabilities oc
    WHERE oc.organization_id = p_organization_id
      AND (oc.expires_at IS NULL OR oc.expires_at > now())
  ) caps;

  SELECT jsonb_object_agg(
    pm.code,
    jsonb_build_object(
      'enabled', pm.is_core
        OR pm.code = ANY(COALESCE(v_capabilities, ARRAY[]::text[]))
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(v_capabilities, ARRAY[]::text[])) c
          WHERE c LIKE pm.code || '\_%' ESCAPE '\\'
        ),
      'name', pm.name,
      'icon', pm.icon,
      'path', '/app/' || pm.code,
      'is_core', pm.is_core,
      'config', COALESCE(v_plan.ui_config->'modules'->pm.code, '{}'::jsonb)
    )
  ) INTO v_modules
  FROM public.platform_modules pm
  WHERE pm.is_active = true;

  SELECT jsonb_agg(
    jsonb_build_object(
      'code', pm.code,
      'name', pm.name,
      'icon', pm.icon,
      'path', '/app/' || pm.code,
      'visible', pm.show_in_sidebar AND (
        pm.is_core
        OR pm.code = ANY(COALESCE(v_capabilities, ARRAY[]::text[]))
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(v_capabilities, ARRAY[]::text[])) c
          WHERE c LIKE pm.code || '\_%' ESCAPE '\\'
        )
      ),
      'locked', NOT (
        pm.is_core
        OR pm.code = ANY(COALESCE(v_capabilities, ARRAY[]::text[]))
        OR EXISTS (
          SELECT 1 FROM unnest(COALESCE(v_capabilities, ARRAY[]::text[])) c
          WHERE c LIKE pm.code || '\_%' ESCAPE '\\'
        )
      ),
      'badge', pm.badge_text
    )
    ORDER BY pm.sort_order
  ) INTO v_sidebar
  FROM public.platform_modules pm
  WHERE pm.is_active = true
    AND pm.show_in_sidebar = true;

  RETURN jsonb_build_object(
    'has_subscription', true,
    'plan_code', v_plan.code,
    'plan_name', v_plan.name,
    'layout', COALESCE(v_plan.ui_config->>'layout', 'standard'),
    'theme', COALESCE(v_plan.ui_config->>'theme', 'default'),
    'show_upgrade_prompts', COALESCE((v_plan.ui_config->>'show_upgrade_prompts')::boolean, v_plan.code = 'free'),
    'capabilities', to_jsonb(COALESCE(v_capabilities, ARRAY[]::TEXT[])),
    'modules', COALESCE(v_modules, '{}'::jsonb),
    'sidebar', COALESCE(v_sidebar, '[]'::jsonb)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.use_ai_query(
  p_organization_id UUID,
  p_user_id UUID,
  p_operation_type TEXT DEFAULT 'query',
  p_jurisdiction_code TEXT DEFAULT NULL,
  p_input_tokens INT DEFAULT 0,
  p_output_tokens INT DEFAULT 0,
  p_model TEXT DEFAULT 'claude-3-sonnet'
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_check JSONB;
  v_period_start DATE;
  v_period_end DATE;
  v_cost DECIMAL(10,6);
BEGIN
  v_check := public.check_capability(p_organization_id, 'ai_queries', true);
  IF NOT (v_check->>'allowed')::boolean THEN
    RETURN v_check;
  END IF;

  v_cost := (p_input_tokens * 0.000003) + (p_output_tokens * 0.000015);

  INSERT INTO public.ai_usage_events (
    organization_id,
    user_id,
    operation_type,
    jurisdiction_code,
    input_tokens,
    output_tokens,
    cost_usd,
    model_used,
    module
  ) VALUES (
    p_organization_id,
    p_user_id,
    p_operation_type,
    p_jurisdiction_code,
    p_input_tokens,
    p_output_tokens,
    v_cost,
    p_model,
    'genius'
  );

  v_period_start := date_trunc('month', CURRENT_DATE)::DATE;
  v_period_end := (v_period_start + INTERVAL '1 month')::DATE;

  INSERT INTO public.ai_usage (
    organization_id,
    user_id,
    period_start,
    period_end,
    messages_count,
    tokens_input,
    tokens_output,
    chat_messages,
    document_analyses,
    document_generations,
    estimated_cost_cents
  ) VALUES (
    p_organization_id,
    p_user_id,
    v_period_start,
    v_period_end,
    1,
    p_input_tokens,
    p_output_tokens,
    CASE WHEN p_operation_type = 'query' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'analysis' THEN 1 ELSE 0 END,
    CASE WHEN p_operation_type = 'generation' THEN 1 ELSE 0 END,
    (v_cost * 100)::int
  )
  ON CONFLICT (organization_id, period_start)
  DO UPDATE SET
    messages_count = COALESCE(public.ai_usage.messages_count, 0) + 1,
    chat_messages = COALESCE(public.ai_usage.chat_messages, 0) + CASE WHEN p_operation_type = 'query' THEN 1 ELSE 0 END,
    document_analyses = COALESCE(public.ai_usage.document_analyses, 0) + CASE WHEN p_operation_type = 'analysis' THEN 1 ELSE 0 END,
    document_generations = COALESCE(public.ai_usage.document_generations, 0) + CASE WHEN p_operation_type = 'generation' THEN 1 ELSE 0 END,
    tokens_input = COALESCE(public.ai_usage.tokens_input, 0) + p_input_tokens,
    tokens_output = COALESCE(public.ai_usage.tokens_output, 0) + p_output_tokens,
    estimated_cost_cents = COALESCE(public.ai_usage.estimated_cost_cents, 0) + (v_cost * 100)::int,
    updated_at = now();

  RETURN jsonb_build_object(
    'allowed', true,
    'tokens_used', p_input_tokens + p_output_tokens,
    'cost_usd', v_cost,
    'remaining', NULLIF(v_check->>'remaining','')::int
  );
END;
$$;

-- 15) SEED
INSERT INTO public.capabilities (code, name, description, category, module_code, capability_type, is_metered, unit_name, unit_price, sort_order)
VALUES
('dashboard', 'Dashboard', 'Acceso al dashboard principal', 'core', 'dashboard', 'boolean', false, NULL, NULL, 1),
('settings', 'Configuración', 'Acceso a configuración', 'core', 'settings', 'boolean', false, NULL, NULL, 2),
('help', 'Ayuda', 'Acceso a centro de ayuda', 'core', 'help', 'boolean', false, NULL, NULL, 3),
('docket', 'Docket', 'Acceso al módulo Docket', 'module', 'docket', 'boolean', false, NULL, NULL, 10),
('docket_matters', 'Expedientes', 'Crear y gestionar expedientes', 'limit', 'docket', 'numeric', false, 'expediente', NULL, 11),
('docket_deadlines', 'Plazos', 'Gestión de plazos y recordatorios', 'feature', 'docket', 'boolean', false, NULL, NULL, 12),
('docket_documents', 'Documentos', 'Gestión documental', 'feature', 'docket', 'boolean', false, NULL, NULL, 13),
('spider', 'Spider', 'Acceso al módulo Spider', 'module', 'spider', 'boolean', false, NULL, NULL, 20),
('spider_watchlists', 'Watchlists', 'Número de watchlists', 'limit', 'spider', 'numeric', false, 'watchlist', NULL, 21),
('spider_alerts', 'Alertas', 'Alertas de vigilancia', 'feature', 'spider', 'boolean', false, NULL, NULL, 22),
('spider_channels_marketplaces', 'Marketplaces', 'Vigilancia en marketplaces', 'feature', 'spider', 'boolean', false, NULL, NULL, 23),
('spider_channels_social', 'Redes sociales', 'Vigilancia en redes sociales', 'feature', 'spider', 'boolean', false, NULL, NULL, 24),
('spider_shadow_agents', 'Shadow Agents', 'Agentes automáticos 24/7', 'feature', 'spider', 'boolean', false, NULL, NULL, 25),
('crm', 'CRM', 'Acceso al módulo CRM', 'module', 'crm', 'boolean', false, NULL, NULL, 30),
('crm_contacts', 'Contactos', 'Número de contactos', 'limit', 'crm', 'numeric', false, 'contacto', NULL, 31),
('crm_leads', 'Leads', 'Gestión de leads', 'feature', 'crm', 'boolean', false, NULL, NULL, 32),
('crm_deals', 'Oportunidades', 'Pipeline de ventas', 'feature', 'crm', 'boolean', false, NULL, NULL, 33),
('genius', 'Genius', 'Acceso al asistente IA', 'module', 'genius', 'boolean', false, NULL, NULL, 40),
('ai_queries', 'Consultas IA', 'Consultas al asistente', 'limit', 'genius', 'numeric', true, 'consulta', 0.05, 41),
('ai_analysis', 'Análisis documentos', 'Análisis de documentos con IA', 'feature', 'genius', 'boolean', false, NULL, NULL, 42),
('ai_generation', 'Generación', 'Generación de documentos con IA', 'feature', 'genius', 'boolean', false, NULL, NULL, 43),
('ai_custom_kb', 'KB personalizada', 'Knowledge base personalizada', 'feature', 'genius', 'boolean', false, NULL, NULL, 44),
('finance', 'Finance', 'Acceso al módulo Finance', 'module', 'finance', 'boolean', false, NULL, NULL, 50),
('finance_invoicing', 'Facturación', 'Crear y gestionar facturas', 'feature', 'finance', 'boolean', false, NULL, NULL, 51),
('finance_stripe', 'Stripe', 'Integración con Stripe', 'integration', 'finance', 'boolean', false, NULL, NULL, 52),
('collab', 'Collab', 'Acceso al módulo Collab', 'module', 'collab', 'boolean', false, NULL, NULL, 60),
('collab_portals', 'Portales cliente', 'Número de portales', 'limit', 'collab', 'numeric', false, 'portal', NULL, 61),
('collab_signatures', 'Firmas digitales', 'Firmas por mes', 'limit', 'collab', 'numeric', true, 'firma', 0.50, 62),
('datahub', 'Data Hub', 'Acceso al módulo Data Hub', 'module', 'datahub', 'boolean', false, NULL, NULL, 70),
('datahub_csv', 'Import CSV/Excel', 'Importar archivos CSV y Excel', 'feature', 'datahub', 'boolean', false, NULL, NULL, 71),
('datahub_connectors', 'Conectores API', 'Conectores a oficinas PI', 'feature', 'datahub', 'boolean', false, NULL, NULL, 72),
('datahub_live_migration', 'Migración live', 'Migración desde otros sistemas', 'feature', 'datahub', 'boolean', false, NULL, NULL, 73),
('market', 'Market', 'Acceso al marketplace', 'module', 'market', 'boolean', false, NULL, NULL, 80),
('market_search', 'Búsqueda', 'Buscar en marketplace', 'feature', 'market', 'boolean', false, NULL, NULL, 81),
('market_publish', 'Publicar', 'Publicar activos', 'feature', 'market', 'boolean', false, NULL, NULL, 82),
('api_access', 'API Access', 'Acceso a la API', 'integration', NULL, 'boolean', false, NULL, NULL, 90),
('sso', 'SSO/SAML', 'Single Sign-On', 'integration', NULL, 'boolean', false, NULL, NULL, 91),
('blockchain_cert', 'Certificación blockchain', 'Certificaciones', 'feature', NULL, 'boolean', true, 'certificación', 5.00, 92),
('export_data', 'Export masivo', 'Exportar datos', 'feature', NULL, 'boolean', true, 'registro', 0.01, 93)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  category = EXCLUDED.category,
  module_code = EXCLUDED.module_code,
  capability_type = EXCLUDED.capability_type,
  is_metered = EXCLUDED.is_metered,
  unit_name = EXCLUDED.unit_name,
  unit_price = EXCLUDED.unit_price,
  sort_order = EXCLUDED.sort_order,
  is_active = true,
  updated_at = now();

INSERT INTO public.jurisdictions (code, name, region, tier, price_monthly, price_yearly, flag_emoji, ipo_name, ipo_url, sort_order)
VALUES
('ES', 'España', 'europe', 1, 29.00, 290.00, '🇪🇸', 'OEPM', 'https://www.oepm.es', 1),
('EU', 'Europa (EUIPO)', 'europe', 1, 29.00, 290.00, '🇪🇺', 'EUIPO', 'https://euipo.europa.eu', 2),
('US', 'Estados Unidos', 'americas', 1, 29.00, 290.00, '🇺🇸', 'USPTO', 'https://www.uspto.gov', 3),
('GB', 'Reino Unido', 'europe', 1, 29.00, 290.00, '🇬🇧', 'UKIPO', 'https://www.gov.uk/government/organisations/intellectual-property-office', 4),
('DE', 'Alemania', 'europe', 1, 29.00, 290.00, '🇩🇪', 'DPMA', 'https://www.dpma.de', 5),
('FR', 'Francia', 'europe', 1, 29.00, 290.00, '🇫🇷', 'INPI', 'https://www.inpi.fr', 6),
('WIPO', 'Internacional (WIPO)', 'international', 1, 29.00, 290.00, '🌐', 'WIPO', 'https://www.wipo.int', 7),
('IT', 'Italia', 'europe', 2, 19.00, 190.00, '🇮🇹', 'UIBM', 'https://uibm.mise.gov.it', 10),
('PT', 'Portugal', 'europe', 2, 19.00, 190.00, '🇵🇹', 'INPI-PT', 'https://inpi.justica.gov.pt', 11),
('NL', 'Países Bajos', 'europe', 2, 19.00, 190.00, '🇳🇱', 'BOIP', 'https://www.boip.int', 12),
('CN', 'China', 'asia', 2, 19.00, 190.00, '🇨🇳', 'CNIPA', 'https://www.cnipa.gov.cn', 20),
('JP', 'Japón', 'asia', 2, 19.00, 190.00, '🇯🇵', 'JPO', 'https://www.jpo.go.jp', 21),
('KR', 'Corea del Sur', 'asia', 2, 19.00, 190.00, '🇰🇷', 'KIPO', 'https://www.kipo.go.kr', 22),
('BR', 'Brasil', 'americas', 2, 19.00, 190.00, '🇧🇷', 'INPI-BR', 'https://www.gov.br/inpi', 30),
('MX', 'México', 'americas', 2, 19.00, 190.00, '🇲🇽', 'IMPI', 'https://www.gob.mx/impi', 31),
('CA', 'Canadá', 'americas', 2, 19.00, 190.00, '🇨🇦', 'CIPO', 'https://www.ic.gc.ca/eic/site/cipointernet-internetopic.nsf', 32),
('AU', 'Australia', 'asia', 2, 19.00, 190.00, '🇦🇺', 'IP Australia', 'https://www.ipaustralia.gov.au', 40)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  region = EXCLUDED.region,
  tier = EXCLUDED.tier,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  flag_emoji = EXCLUDED.flag_emoji,
  ipo_name = EXCLUDED.ipo_name,
  ipo_url = EXCLUDED.ipo_url,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

INSERT INTO public.subscription_plans (
  code, name, description, plan_type,
  price_monthly, price_yearly,
  max_users, max_storage_gb,
  trial_days, ui_config,
  sort_order, is_active, is_public,
  badge_text, badge_color, highlight
)
VALUES
('free','Free','Para empezar a gestionar tu PI','suite',0.00,0.00,1,1,14,'{"layout":"standard","theme":"default","show_upgrade_prompts":true,"sidebar_style":"compact"}'::jsonb,1,true,true,NULL,NULL,false),
('professional','Professional','Para despachos en crecimiento','suite',99.00,990.00,5,10,14,'{"layout":"standard","theme":"default","show_upgrade_prompts":true,"sidebar_style":"full"}'::jsonb,2,true,true,'Popular',NULL,true),
('enterprise','Enterprise','Para grandes organizaciones','suite',299.00,2990.00,15,100,14,'{"layout":"advanced","theme":"default","show_upgrade_prompts":false,"sidebar_style":"full","show_analytics":true}'::jsonb,3,true,true,NULL,NULL,false),
('standalone_docket','IP-DOCKET','Gestión de expedientes de PI','standalone',49.00,490.00,2,5,14,'{"layout":"focused","theme":"docket","show_upgrade_prompts":true,"sidebar_style":"minimal","primary_module":"docket"}'::jsonb,10,true,true,NULL,NULL,false),
('standalone_spider','IP-SPIDER','Vigilancia de marcas y patentes','standalone',39.00,390.00,2,2,14,'{"layout":"focused","theme":"spider","show_upgrade_prompts":true,"sidebar_style":"minimal","primary_module":"spider"}'::jsonb,11,true,true,NULL,NULL,false),
('standalone_genius','IP-GENIUS','Asistente legal con IA','standalone',29.00,290.00,3,2,14,'{"layout":"focused","theme":"genius","show_upgrade_prompts":true,"sidebar_style":"minimal","primary_module":"genius"}'::jsonb,12,true,true,NULL,NULL,false)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  plan_type = EXCLUDED.plan_type,
  price_monthly = EXCLUDED.price_monthly,
  price_yearly = EXCLUDED.price_yearly,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  trial_days = EXCLUDED.trial_days,
  ui_config = EXCLUDED.ui_config,
  sort_order = EXCLUDED.sort_order,
  is_active = EXCLUDED.is_active,
  is_public = EXCLUDED.is_public,
  badge_text = EXCLUDED.badge_text,
  badge_color = EXCLUDED.badge_color,
  highlight = EXCLUDED.highlight,
  updated_at = now();

-- FIX: explicit casts in VALUES so limit_value is int
-- FREE
INSERT INTO public.plan_capabilities (plan_id, capability_code, limit_value, limit_period)
SELECT p.id, c.code, c.limit_val, c.limit_per
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('dashboard'::text, NULL::int, NULL::text),
  ('settings'::text, NULL::int, NULL::text),
  ('help'::text, NULL::int, NULL::text),
  ('docket'::text, NULL::int, NULL::text),
  ('docket_matters'::text, 25::int, 'month'::text),
  ('docket_deadlines'::text, NULL::int, NULL::text),
  ('crm'::text, NULL::int, NULL::text),
  ('crm_contacts'::text, 50::int, 'month'::text),
  ('genius'::text, NULL::int, NULL::text),
  ('ai_queries'::text, 20::int, 'month'::text),
  ('datahub'::text, NULL::int, NULL::text),
  ('datahub_csv'::text, 4::int, 'month'::text),
  ('market'::text, NULL::int, NULL::text),
  ('market_search'::text, NULL::int, NULL::text)
) AS c(code, limit_val, limit_per)
WHERE p.code = 'free'
ON CONFLICT (plan_id, capability_code) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  limit_period = EXCLUDED.limit_period;

-- PROFESSIONAL
INSERT INTO public.plan_capabilities (plan_id, capability_code, limit_value, limit_period)
SELECT p.id, c.code, c.limit_val, c.limit_per
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('dashboard'::text, NULL::int, NULL::text),
  ('settings'::text, NULL::int, NULL::text),
  ('help'::text, NULL::int, NULL::text),
  ('docket'::text, NULL::int, NULL::text),
  ('docket_matters'::text, 500::int, 'month'::text),
  ('docket_deadlines'::text, NULL::int, NULL::text),
  ('docket_documents'::text, NULL::int, NULL::text),
  ('spider'::text, NULL::int, NULL::text),
  ('spider_watchlists'::text, 10::int, NULL::text),
  ('spider_alerts'::text, NULL::int, NULL::text),
  ('crm'::text, NULL::int, NULL::text),
  ('crm_contacts'::text, 2000::int, NULL::text),
  ('crm_leads'::text, NULL::int, NULL::text),
  ('crm_deals'::text, NULL::int, NULL::text),
  ('genius'::text, NULL::int, NULL::text),
  ('ai_queries'::text, 200::int, 'month'::text),
  ('ai_analysis'::text, NULL::int, NULL::text),
  ('ai_generation'::text, NULL::int, NULL::text),
  ('finance'::text, NULL::int, NULL::text),
  ('finance_invoicing'::text, NULL::int, NULL::text),
  ('collab'::text, NULL::int, NULL::text),
  ('collab_portals'::text, 3::int, NULL::text),
  ('collab_signatures'::text, 20::int, 'month'::text),
  ('datahub'::text, NULL::int, NULL::text),
  ('datahub_csv'::text, NULL::int, NULL::text),
  ('datahub_connectors'::text, 3::int, NULL::text),
  ('market'::text, NULL::int, NULL::text),
  ('market_search'::text, NULL::int, NULL::text)
) AS c(code, limit_val, limit_per)
WHERE p.code = 'professional'
ON CONFLICT (plan_id, capability_code) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  limit_period = EXCLUDED.limit_period;

-- ENTERPRISE
INSERT INTO public.plan_capabilities (plan_id, capability_code, limit_value, limit_period)
SELECT p.id, c.code, c.limit_val, c.limit_per
FROM public.subscription_plans p
CROSS JOIN (VALUES
  ('dashboard'::text, NULL::int, NULL::text),
  ('settings'::text, NULL::int, NULL::text),
  ('help'::text, NULL::int, NULL::text),
  ('docket'::text, NULL::int, NULL::text),
  ('docket_matters'::text, NULL::int, NULL::text),
  ('docket_deadlines'::text, NULL::int, NULL::text),
  ('docket_documents'::text, NULL::int, NULL::text),
  ('spider'::text, NULL::int, NULL::text),
  ('spider_watchlists'::text, NULL::int, NULL::text),
  ('spider_alerts'::text, NULL::int, NULL::text),
  ('spider_channels_marketplaces'::text, NULL::int, NULL::text),
  ('spider_channels_social'::text, NULL::int, NULL::text),
  ('spider_shadow_agents'::text, NULL::int, NULL::text),
  ('crm'::text, NULL::int, NULL::text),
  ('crm_contacts'::text, NULL::int, NULL::text),
  ('crm_leads'::text, NULL::int, NULL::text),
  ('crm_deals'::text, NULL::int, NULL::text),
  ('genius'::text, NULL::int, NULL::text),
  ('ai_queries'::text, NULL::int, NULL::text),
  ('ai_analysis'::text, NULL::int, NULL::text),
  ('ai_generation'::text, NULL::int, NULL::text),
  ('ai_custom_kb'::text, NULL::int, NULL::text),
  ('finance'::text, NULL::int, NULL::text),
  ('finance_invoicing'::text, NULL::int, NULL::text),
  ('finance_stripe'::text, NULL::int, NULL::text),
  ('collab'::text, NULL::int, NULL::text),
  ('collab_portals'::text, NULL::int, NULL::text),
  ('collab_signatures'::text, NULL::int, NULL::text),
  ('datahub'::text, NULL::int, NULL::text),
  ('datahub_csv'::text, NULL::int, NULL::text),
  ('datahub_connectors'::text, NULL::int, NULL::text),
  ('datahub_live_migration'::text, NULL::int, NULL::text),
  ('market'::text, NULL::int, NULL::text),
  ('market_search'::text, NULL::int, NULL::text),
  ('market_publish'::text, NULL::int, NULL::text),
  ('api_access'::text, NULL::int, NULL::text),
  ('sso'::text, NULL::int, NULL::text)
) AS c(code, limit_val, limit_per)
WHERE p.code = 'enterprise'
ON CONFLICT (plan_id, capability_code) DO UPDATE SET
  limit_value = EXCLUDED.limit_value,
  limit_period = EXCLUDED.limit_period;

INSERT INTO public.plan_jurisdictions (plan_id, jurisdiction_code, inclusion_type)
SELECT p.id, 'BASE'::text, 'base'::text
FROM public.subscription_plans p
WHERE p.code IN ('free', 'professional')
ON CONFLICT (plan_id, jurisdiction_code) DO UPDATE SET inclusion_type = EXCLUDED.inclusion_type;

INSERT INTO public.plan_jurisdictions (plan_id, jurisdiction_code, inclusion_type)
SELECT p.id, 'ALL'::text, 'all'::text
FROM public.subscription_plans p
WHERE p.code = 'enterprise'
ON CONFLICT (plan_id, jurisdiction_code) DO UPDATE SET inclusion_type = EXCLUDED.inclusion_type;

COMMIT;