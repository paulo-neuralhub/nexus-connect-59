-- ============================================
-- P-VOIP-03 (Parte DB) - Schema only
-- Adds pricing plans, subscriptions, usage records, invoices, settings, views and functions.
-- NOTE: No data is inserted directly here. A seeding function is provided.
-- ============================================

-- updated_at helper (safe to re-create)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ============================================
-- 1) voip_pricing_plans
-- ============================================
CREATE TABLE IF NOT EXISTS public.voip_pricing_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,

  plan_type VARCHAR(20) NOT NULL DEFAULT 'package'
    CHECK (plan_type IN ('package', 'pay_as_you_go', 'unlimited')),

  included_minutes INTEGER,

  monthly_price_cents INTEGER NOT NULL DEFAULT 0,
  price_per_minute_cents INTEGER NOT NULL,
  overage_price_per_minute_cents INTEGER,

  cost_per_minute_cents INTEGER NOT NULL DEFAULT 10,

  features JSONB NOT NULL DEFAULT '{
    "recording": true,
    "transcription": true,
    "ai_summary": true,
    "incoming_calls": true,
    "transfer": true
  }'::jsonb,

  max_concurrent_calls INTEGER DEFAULT 2,
  max_call_duration_minutes INTEGER DEFAULT 60,

  is_active BOOLEAN NOT NULL DEFAULT true,
  is_default BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voip_plans_active ON public.voip_pricing_plans(is_active);
CREATE INDEX IF NOT EXISTS idx_voip_plans_code ON public.voip_pricing_plans(code);

DROP TRIGGER IF EXISTS trg_voip_pricing_plans_updated_at ON public.voip_pricing_plans;
CREATE TRIGGER trg_voip_pricing_plans_updated_at
BEFORE UPDATE ON public.voip_pricing_plans
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.voip_pricing_plans ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read active plans (needed for client plan picker)
DROP POLICY IF EXISTS "VoIP plans readable" ON public.voip_pricing_plans;
CREATE POLICY "VoIP plans readable"
  ON public.voip_pricing_plans
  FOR SELECT
  USING (true);

-- Only superadmins can write plans
DROP POLICY IF EXISTS "Superadmins manage VoIP plans" ON public.voip_pricing_plans;
CREATE POLICY "Superadmins manage VoIP plans"
  ON public.voip_pricing_plans
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- ============================================
-- 2) voip_subscriptions
-- ============================================
CREATE TABLE IF NOT EXISTS public.voip_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  plan_id UUID NOT NULL REFERENCES public.voip_pricing_plans(id),

  status VARCHAR(20) NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'cancelled', 'pending')),

  billing_cycle_start DATE NOT NULL DEFAULT CURRENT_DATE,
  billing_cycle_end DATE NOT NULL DEFAULT (CURRENT_DATE + INTERVAL '1 month'),

  minutes_used INTEGER NOT NULL DEFAULT 0,
  minutes_included INTEGER,

  total_minutes_used INTEGER NOT NULL DEFAULT 0,
  total_calls INTEGER NOT NULL DEFAULT 0,
  total_amount_cents INTEGER NOT NULL DEFAULT 0,

  twilio_subaccount_sid VARCHAR(100),
  twilio_phone_number VARCHAR(50),

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voip_subs_org ON public.voip_subscriptions(organization_id);
CREATE INDEX IF NOT EXISTS idx_voip_subs_status ON public.voip_subscriptions(status);

DROP TRIGGER IF EXISTS trg_voip_subscriptions_updated_at ON public.voip_subscriptions;
CREATE TRIGGER trg_voip_subscriptions_updated_at
BEFORE UPDATE ON public.voip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.voip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Orgs can read their own subscription
DROP POLICY IF EXISTS "Orgs can view own voip subscription" ON public.voip_subscriptions;
CREATE POLICY "Orgs can view own voip subscription"
  ON public.voip_subscriptions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_subscriptions.organization_id
        AND m.user_id = auth.uid()
    )
  );

-- Superadmins can read all
DROP POLICY IF EXISTS "Superadmins can view all voip subscriptions" ON public.voip_subscriptions;
CREATE POLICY "Superadmins can view all voip subscriptions"
  ON public.voip_subscriptions
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- Writes restricted to superadmins (backoffice ops)
DROP POLICY IF EXISTS "Superadmins manage voip subscriptions" ON public.voip_subscriptions;
CREATE POLICY "Superadmins manage voip subscriptions"
  ON public.voip_subscriptions
  FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "Superadmins update voip subscriptions" ON public.voip_subscriptions;
CREATE POLICY "Superadmins update voip subscriptions"
  ON public.voip_subscriptions
  FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

DROP POLICY IF EXISTS "Superadmins delete voip subscriptions" ON public.voip_subscriptions;
CREATE POLICY "Superadmins delete voip subscriptions"
  ON public.voip_subscriptions
  FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- Keep minutes_included aligned with plan on insert / plan change
CREATE OR REPLACE FUNCTION public.voip_apply_plan_snapshot()
RETURNS TRIGGER AS $$
DECLARE
  v_plan public.voip_pricing_plans%ROWTYPE;
BEGIN
  SELECT * INTO v_plan FROM public.voip_pricing_plans WHERE id = NEW.plan_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'voip_pricing_plans not found: %', NEW.plan_id;
  END IF;

  NEW.minutes_included = v_plan.included_minutes;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_voip_subscriptions_plan_snapshot ON public.voip_subscriptions;
CREATE TRIGGER trg_voip_subscriptions_plan_snapshot
BEFORE INSERT OR UPDATE OF plan_id ON public.voip_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.voip_apply_plan_snapshot();

-- ============================================
-- 3) voip_usage_records (CDR)
-- ============================================
CREATE TABLE IF NOT EXISTS public.voip_usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  call_id UUID REFERENCES public.crm_voip_calls(id) ON DELETE SET NULL,
  subscription_id UUID REFERENCES public.voip_subscriptions(id),

  billing_period DATE NOT NULL,

  call_sid VARCHAR(100),
  direction VARCHAR(20) NOT NULL,
  from_number VARCHAR(50),
  to_number VARCHAR(50),
  destination_country VARCHAR(2) NOT NULL DEFAULT 'ES',

  started_at TIMESTAMPTZ NOT NULL,
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER NOT NULL DEFAULT 0,
  billable_minutes INTEGER NOT NULL DEFAULT 0,

  cost_per_minute_cents INTEGER NOT NULL,
  price_per_minute_cents INTEGER NOT NULL,

  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  total_price_cents INTEGER NOT NULL DEFAULT 0,
  margin_cents INTEGER GENERATED ALWAYS AS (total_price_cents - total_cost_cents) STORED,

  recording_cost_cents INTEGER NOT NULL DEFAULT 0,
  transcription_cost_cents INTEGER NOT NULL DEFAULT 0,

  minute_type VARCHAR(20) NOT NULL DEFAULT 'included'
    CHECK (minute_type IN ('included', 'overage', 'pay_as_you_go')),

  status VARCHAR(20) NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'billed', 'credited', 'void')),

  invoice_id UUID,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voip_usage_org ON public.voip_usage_records(organization_id);
CREATE INDEX IF NOT EXISTS idx_voip_usage_period ON public.voip_usage_records(billing_period);
CREATE INDEX IF NOT EXISTS idx_voip_usage_status ON public.voip_usage_records(status);
CREATE INDEX IF NOT EXISTS idx_voip_usage_call ON public.voip_usage_records(call_id);

ALTER TABLE public.voip_usage_records ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orgs can view own voip usage" ON public.voip_usage_records;
CREATE POLICY "Orgs can view own voip usage"
  ON public.voip_usage_records
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_usage_records.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Superadmins can view all voip usage" ON public.voip_usage_records;
CREATE POLICY "Superadmins can view all voip usage"
  ON public.voip_usage_records
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- Writes are done server-side (service role / SECURITY DEFINER), not from client.

-- ============================================
-- 4) voip_invoices
-- ============================================
CREATE TABLE IF NOT EXISTS public.voip_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  subscription_id UUID REFERENCES public.voip_subscriptions(id),

  invoice_number VARCHAR(50) UNIQUE,

  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,

  total_calls INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  included_minutes_used INTEGER NOT NULL DEFAULT 0,
  overage_minutes INTEGER NOT NULL DEFAULT 0,

  plan_amount_cents INTEGER NOT NULL DEFAULT 0,
  usage_amount_cents INTEGER NOT NULL DEFAULT 0,
  extras_amount_cents INTEGER NOT NULL DEFAULT 0,
  subtotal_cents INTEGER NOT NULL DEFAULT 0,
  tax_cents INTEGER NOT NULL DEFAULT 0,
  total_cents INTEGER NOT NULL DEFAULT 0,

  total_cost_cents INTEGER NOT NULL DEFAULT 0,
  margin_cents INTEGER NOT NULL DEFAULT 0,
  margin_percentage DECIMAL(5,2),

  status VARCHAR(20) NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'pending', 'paid', 'overdue', 'cancelled')),

  issued_at TIMESTAMPTZ,
  due_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,

  pdf_url TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_voip_invoices_org ON public.voip_invoices(organization_id);
CREATE INDEX IF NOT EXISTS idx_voip_invoices_status ON public.voip_invoices(status);
CREATE INDEX IF NOT EXISTS idx_voip_invoices_period ON public.voip_invoices(billing_period_start);

DROP TRIGGER IF EXISTS trg_voip_invoices_updated_at ON public.voip_invoices;
CREATE TRIGGER trg_voip_invoices_updated_at
BEFORE UPDATE ON public.voip_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.voip_invoices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orgs can view own voip invoices" ON public.voip_invoices;
CREATE POLICY "Orgs can view own voip invoices"
  ON public.voip_invoices
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_invoices.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Superadmins can view all voip invoices" ON public.voip_invoices;
CREATE POLICY "Superadmins can view all voip invoices"
  ON public.voip_invoices
  FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- ============================================
-- 5) voip_settings (consent/recording switches)
-- ============================================
CREATE TABLE IF NOT EXISTS public.voip_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID UNIQUE NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  recording_enabled BOOLEAN NOT NULL DEFAULT true,
  recording_consent_required BOOLEAN NOT NULL DEFAULT false,
  recording_consent_message TEXT,

  transcription_enabled BOOLEAN NOT NULL DEFAULT true,
  ai_summary_enabled BOOLEAN NOT NULL DEFAULT true,

  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DROP TRIGGER IF EXISTS trg_voip_settings_updated_at ON public.voip_settings;
CREATE TRIGGER trg_voip_settings_updated_at
BEFORE UPDATE ON public.voip_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.voip_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Orgs can view own voip settings" ON public.voip_settings;
CREATE POLICY "Orgs can view own voip settings"
  ON public.voip_settings
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_settings.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Orgs can update own voip settings" ON public.voip_settings;
CREATE POLICY "Orgs can update own voip settings"
  ON public.voip_settings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_settings.organization_id
        AND m.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.memberships m
      WHERE m.organization_id = voip_settings.organization_id
        AND m.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Superadmins manage voip settings" ON public.voip_settings;
CREATE POLICY "Superadmins manage voip settings"
  ON public.voip_settings
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()));

-- ============================================
-- 6) Views for backoffice
-- ============================================
CREATE OR REPLACE VIEW public.v_voip_billing_summary AS
SELECT
  o.id AS organization_id,
  o.name AS organization_name,

  p.name AS plan_name,
  p.code AS plan_code,
  s.status AS subscription_status,

  s.minutes_used AS current_minutes_used,
  s.minutes_included AS current_minutes_included,
  GREATEST(0, s.minutes_used - COALESCE(s.minutes_included, 0)) AS current_overage_minutes,

  COALESCE(usage.total_calls, 0) AS month_total_calls,
  COALESCE(usage.total_minutes, 0) AS month_total_minutes,
  COALESCE(usage.total_cost, 0) AS month_total_cost_cents,
  COALESCE(usage.total_price, 0) AS month_total_price_cents,
  COALESCE(usage.total_margin, 0) AS month_margin_cents,

  s.total_minutes_used AS lifetime_minutes,
  s.total_calls AS lifetime_calls,
  s.total_amount_cents AS lifetime_amount_cents,

  s.twilio_phone_number

FROM public.organizations o
LEFT JOIN public.voip_subscriptions s ON o.id = s.organization_id
LEFT JOIN public.voip_pricing_plans p ON s.plan_id = p.id
LEFT JOIN (
  SELECT
    organization_id,
    COUNT(*) AS total_calls,
    SUM(billable_minutes) AS total_minutes,
    SUM(total_cost_cents) AS total_cost,
    SUM(total_price_cents) AS total_price,
    SUM(total_price_cents - total_cost_cents) AS total_margin
  FROM public.voip_usage_records
  WHERE billing_period = date_trunc('month', CURRENT_DATE)::DATE
  GROUP BY organization_id
) usage ON o.id = usage.organization_id;

CREATE OR REPLACE VIEW public.v_voip_global_stats AS
SELECT
  date_trunc('month', CURRENT_DATE)::DATE AS current_period,

  COUNT(DISTINCT u.organization_id) AS active_organizations,
  COUNT(u.id) AS total_calls,
  COALESCE(SUM(u.billable_minutes), 0) AS total_minutes,
  COALESCE(SUM(u.total_cost_cents), 0) AS total_cost_cents,
  COALESCE(SUM(u.total_price_cents), 0) AS total_revenue_cents,
  COALESCE(SUM(u.margin_cents), 0) AS total_margin_cents,

  CASE
    WHEN COALESCE(SUM(u.total_price_cents), 0) > 0
    THEN ROUND((SUM(u.margin_cents)::DECIMAL / SUM(u.total_price_cents)) * 100, 2)
    ELSE 0
  END AS margin_percentage,

  COUNT(DISTINCT s.id) FILTER (WHERE p.code = 'pay_as_you_go') AS pay_as_you_go_orgs,
  COUNT(DISTINCT s.id) FILTER (WHERE p.code = 'starter') AS starter_orgs,
  COUNT(DISTINCT s.id) FILTER (WHERE p.code = 'pro') AS pro_orgs,
  COUNT(DISTINCT s.id) FILTER (WHERE p.code = 'business') AS business_orgs,
  COUNT(DISTINCT s.id) FILTER (WHERE p.code = 'unlimited') AS unlimited_orgs

FROM public.voip_usage_records u
LEFT JOIN public.voip_subscriptions s ON u.organization_id = s.organization_id
LEFT JOIN public.voip_pricing_plans p ON s.plan_id = p.id
WHERE u.billing_period = date_trunc('month', CURRENT_DATE)::DATE;

-- ============================================
-- 7) register_voip_usage(call_id)
-- ============================================
CREATE OR REPLACE FUNCTION public.register_voip_usage(p_call_id UUID)
RETURNS void AS $$
DECLARE
  v_call RECORD;
  v_sub RECORD;
  v_plan RECORD;
  v_billable_minutes INTEGER;
  v_minute_type VARCHAR(20);
  v_price_per_minute INTEGER;
  v_cost_per_minute INTEGER;
  v_period DATE;
BEGIN
  SELECT * INTO v_call
  FROM public.crm_voip_calls
  WHERE id = p_call_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Require call end + duration
  IF v_call.ended_at IS NULL THEN
    RETURN;
  END IF;

  v_period := date_trunc('month', (v_call.initiated_at)::timestamptz)::date;

  SELECT * INTO v_sub
  FROM public.voip_subscriptions
  WHERE organization_id = v_call.organization_id;

  IF NOT FOUND THEN
    -- No subscription: do not bill
    RETURN;
  END IF;

  SELECT * INTO v_plan
  FROM public.voip_pricing_plans
  WHERE id = v_sub.plan_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  v_billable_minutes := CEIL(COALESCE(v_call.duration_seconds, 0) / 60.0);
  IF v_billable_minutes < 1 THEN v_billable_minutes := 1; END IF;

  -- Determine minute type + price
  IF v_plan.plan_type IN ('pay_as_you_go') OR v_plan.included_minutes IS NULL THEN
    v_minute_type := 'pay_as_you_go';
    v_price_per_minute := v_plan.price_per_minute_cents;
  ELSIF (COALESCE(v_sub.minutes_included, v_plan.included_minutes) IS NOT NULL)
        AND (v_sub.minutes_used + v_billable_minutes) <= COALESCE(v_sub.minutes_included, v_plan.included_minutes) THEN
    v_minute_type := 'included';
    v_price_per_minute := 0;
  ELSE
    v_minute_type := 'overage';
    v_price_per_minute := COALESCE(v_plan.overage_price_per_minute_cents, v_plan.price_per_minute_cents);
  END IF;

  v_cost_per_minute := COALESCE(v_plan.cost_per_minute_cents, 0);

  -- Prevent duplicate usage records for same call_id
  IF EXISTS (SELECT 1 FROM public.voip_usage_records WHERE call_id = p_call_id) THEN
    RETURN;
  END IF;

  INSERT INTO public.voip_usage_records (
    organization_id,
    call_id,
    subscription_id,
    billing_period,
    call_sid,
    direction,
    from_number,
    to_number,
    started_at,
    ended_at,
    duration_seconds,
    billable_minutes,
    cost_per_minute_cents,
    price_per_minute_cents,
    total_cost_cents,
    total_price_cents,
    minute_type,
    status
  ) VALUES (
    v_call.organization_id,
    p_call_id,
    v_sub.id,
    v_period,
    v_call.call_sid,
    v_call.direction,
    v_call.from_number,
    v_call.to_number,
    v_call.initiated_at,
    v_call.ended_at,
    COALESCE(v_call.duration_seconds, 0),
    v_billable_minutes,
    v_cost_per_minute,
    v_price_per_minute,
    v_billable_minutes * v_cost_per_minute,
    v_billable_minutes * v_price_per_minute,
    v_minute_type,
    'pending'
  );

  UPDATE public.voip_subscriptions
  SET
    minutes_used = minutes_used + v_billable_minutes,
    total_minutes_used = total_minutes_used + v_billable_minutes,
    total_calls = total_calls + 1,
    total_amount_cents = total_amount_cents + (v_billable_minutes * v_price_per_minute),
    updated_at = now()
  WHERE organization_id = v_call.organization_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.register_voip_usage(UUID) FROM PUBLIC;

-- ============================================
-- 8) Optional: seeding function for default plans (NOT executed here)
-- ============================================
CREATE OR REPLACE FUNCTION public.seed_voip_pricing_plans_if_empty()
RETURNS void AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM public.voip_pricing_plans) THEN
    RETURN;
  END IF;

  INSERT INTO public.voip_pricing_plans (
    name, code, plan_type, included_minutes,
    monthly_price_cents, price_per_minute_cents, overage_price_per_minute_cents,
    cost_per_minute_cents, max_concurrent_calls, display_order, is_default
  ) VALUES
    ('Pago por uso', 'pay_as_you_go', 'pay_as_you_go', NULL, 0, 20, NULL, 10, 1, 0, true),
    ('Starter', 'starter', 'package', 100, 1500, 15, 20, 10, 2, 1, false),
    ('Profesional', 'pro', 'package', 500, 6000, 12, 15, 10, 5, 2, false),
    ('Business', 'business', 'package', 2000, 20000, 10, 12, 10, 10, 3, false),
    ('Enterprise', 'unlimited', 'unlimited', NULL, 50000, 0, 0, 10, 25, 4, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.seed_voip_pricing_plans_if_empty() FROM PUBLIC;
