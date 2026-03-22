
-- =============================================
-- 1.1 Add is_platform_owner and organization_type to organizations
-- =============================================
ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS is_platform_owner boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS organization_type text DEFAULT 'client';

-- =============================================
-- 1.2 platform_costs — Costes operativos de IP-NEXUS
-- =============================================
CREATE TABLE IF NOT EXISTS platform_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cost_category text NOT NULL,
  cost_subcategory text,
  description text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  amount numeric(10,4) NOT NULL,
  currency text DEFAULT 'EUR',
  amount_eur numeric(10,4),
  source_type text DEFAULT 'manual',
  source_reference_ids jsonb DEFAULT '[]',
  status text DEFAULT 'pending_review',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  journal_entry_id uuid REFERENCES fin_journal_entries(id),
  vendor_name text,
  vendor_invoice_number text,
  receipt_storage_path text,
  notes text,
  auto_captured_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 1.3 platform_revenue — Ingresos de IP-NEXUS
-- =============================================
CREATE TABLE IF NOT EXISTS platform_revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  revenue_type text NOT NULL,
  source_organization_id uuid REFERENCES organizations(id),
  source_type text,
  source_reference_id uuid,
  gross_amount numeric(10,2) NOT NULL,
  stripe_fee numeric(10,2) DEFAULT 0,
  net_amount numeric(10,2),
  currency text DEFAULT 'EUR',
  revenue_date date NOT NULL,
  period_month text,
  status text DEFAULT 'pending_review',
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamptz,
  journal_entry_id uuid REFERENCES fin_journal_entries(id),
  stripe_payment_intent_id text,
  stripe_charge_id text,
  description text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- =============================================
-- 1.4 platform_mrr_snapshots — Snapshots MRR/ARR
-- =============================================
CREATE TABLE IF NOT EXISTS platform_mrr_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  snapshot_date date NOT NULL UNIQUE,
  period_month text NOT NULL,
  mrr_total numeric(10,2) DEFAULT 0,
  mrr_new numeric(10,2) DEFAULT 0,
  mrr_expansion numeric(10,2) DEFAULT 0,
  mrr_contraction numeric(10,2) DEFAULT 0,
  mrr_churn numeric(10,2) DEFAULT 0,
  mrr_net_new numeric(10,2) DEFAULT 0,
  arr_total numeric(10,2) DEFAULT 0,
  tenants_total integer DEFAULT 0,
  tenants_new integer DEFAULT 0,
  tenants_churned integer DEFAULT 0,
  tenants_by_plan jsonb DEFAULT '{}',
  churn_rate_pct numeric(5,2) DEFAULT 0,
  avg_revenue_per_tenant numeric(10,2) DEFAULT 0,
  marketplace_gmv numeric(10,2) DEFAULT 0,
  marketplace_revenue numeric(10,2) DEFAULT 0,
  total_costs_month numeric(10,2) DEFAULT 0,
  gross_profit numeric(10,2) DEFAULT 0,
  gross_margin_pct numeric(5,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- =============================================
-- RLS for platform tables
-- =============================================
ALTER TABLE platform_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE platform_mrr_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_costs_platform_only" ON platform_costs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin')
    )
  );

CREATE POLICY "platform_revenue_platform_only" ON platform_revenue
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin')
    )
  );

CREATE POLICY "platform_mrr_snapshots_platform_only" ON platform_mrr_snapshots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('super_admin')
    )
  );

-- =============================================
-- Indices
-- =============================================
CREATE INDEX IF NOT EXISTS idx_platform_costs_category
  ON platform_costs(cost_category, period_start DESC);
CREATE INDEX IF NOT EXISTS idx_platform_costs_status
  ON platform_costs(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_platform_revenue_type
  ON platform_revenue(revenue_type, revenue_date DESC);
CREATE INDEX IF NOT EXISTS idx_platform_mrr_period
  ON platform_mrr_snapshots(period_month DESC);

-- =============================================
-- 1.5 FUNCTION: Capture AI costs
-- =============================================
CREATE OR REPLACE FUNCTION capture_ai_costs_to_platform(
  p_period_start date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_period_end date DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
  v_total_cost numeric;
  v_total_tokens bigint;
  v_query_count integer;
BEGIN
  SELECT
    COALESCE(SUM(estimated_cost_cents), 0) / 100.0,
    COALESCE(SUM(tokens_input + tokens_output), 0),
    COUNT(*)
  INTO v_total_cost, v_total_tokens, v_query_count
  FROM ai_usage
  WHERE created_at::date BETWEEN p_period_start AND p_period_end;

  IF v_query_count > 0 AND NOT EXISTS (
    SELECT 1 FROM platform_costs
    WHERE cost_category = 'ai_inference'
    AND period_start = p_period_start
    AND source_type = 'auto_ai_usage'
  ) THEN
    INSERT INTO platform_costs (
      cost_category, cost_subcategory, description,
      period_start, period_end,
      amount, currency, amount_eur,
      source_type, status, auto_captured_at
    ) VALUES (
      'ai_inference', 'anthropic',
      'Coste IA: ' || v_query_count || ' queries, ' || v_total_tokens || ' tokens',
      p_period_start, p_period_end,
      v_total_cost, 'EUR', v_total_cost,
      'auto_ai_usage', 'pending_review', now()
    );
    v_inserted := 1;
  END IF;

  RETURN v_inserted;
END;
$$;

-- =============================================
-- 1.6 FUNCTION: Capture telephony costs
-- =============================================
CREATE OR REPLACE FUNCTION capture_telephony_costs_to_platform(
  p_period_start date DEFAULT date_trunc('month', CURRENT_DATE)::date,
  p_period_end date DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date
)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_inserted integer := 0;
  v_total_cost numeric;
  v_total_minutes numeric;
  v_call_count integer;
BEGIN
  SELECT
    COALESCE(SUM(provider_cost), 0),
    COALESCE(SUM(billable_minutes), 0),
    COUNT(*)
  INTO v_total_cost, v_total_minutes, v_call_count
  FROM telephony_cdrs
  WHERE created_at::date BETWEEN p_period_start AND p_period_end
  AND status = 'completed';

  IF v_call_count > 0 AND NOT EXISTS (
    SELECT 1 FROM platform_costs
    WHERE cost_category = 'telephony'
    AND period_start = p_period_start
    AND source_type = 'auto_telephony'
  ) THEN
    INSERT INTO platform_costs (
      cost_category, description,
      period_start, period_end,
      amount, currency, amount_eur,
      source_type, status, auto_captured_at
    ) VALUES (
      'telephony',
      'Telefonía: ' || v_call_count || ' llamadas, ' || ROUND(v_total_minutes) || ' minutos',
      p_period_start, p_period_end,
      v_total_cost, 'EUR', v_total_cost,
      'auto_telephony', 'pending_review', now()
    );
    v_inserted := 1;
  END IF;

  RETURN v_inserted;
END;
$$;

-- =============================================
-- 1.7 FUNCTION: Calculate MRR snapshot
-- =============================================
CREATE OR REPLACE FUNCTION calculate_mrr_snapshot(
  p_period_month text DEFAULT TO_CHAR(CURRENT_DATE, 'YYYY-MM')
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_mrr numeric := 0;
  v_tenants integer := 0;
  v_marketplace_gmv numeric := 0;
  v_marketplace_rev numeric := 0;
  v_by_plan jsonb := '{}';
  v_period_start date;
  v_period_end date;
  v_total_costs numeric := 0;
BEGIN
  v_period_start := (p_period_month || '-01')::date;
  v_period_end := (v_period_start + interval '1 month' - interval '1 day')::date;

  SELECT
    COALESCE(SUM(
      CASE plan_code
        WHEN 'starter' THEN 149.00
        WHEN 'professional' THEN 399.00
        WHEN 'enterprise' THEN 999.00
        ELSE 0
      END
    ), 0),
    COUNT(*),
    jsonb_build_object(
      'free_trial', COUNT(*) FILTER (WHERE plan_code = 'free_trial'),
      'starter', COUNT(*) FILTER (WHERE plan_code = 'starter'),
      'professional', COUNT(*) FILTER (WHERE plan_code = 'professional'),
      'enterprise', COUNT(*) FILTER (WHERE plan_code = 'enterprise')
    )
  INTO v_mrr, v_tenants, v_by_plan
  FROM subscriptions
  WHERE status = 'active'
  AND (current_period_end IS NULL OR current_period_end >= v_period_start);

  SELECT
    COALESCE(SUM(quoted_amount_eur), 0),
    COALESCE(SUM(platform_fee_amount), 0)
  INTO v_marketplace_gmv, v_marketplace_rev
  FROM market_service_requests
  WHERE status = 'completed'
  AND completed_at::date BETWEEN v_period_start AND v_period_end;

  SELECT COALESCE(SUM(amount_eur), 0)
  INTO v_total_costs
  FROM platform_costs
  WHERE status IN ('confirmed', 'posted')
  AND period_start >= v_period_start
  AND period_end <= v_period_end;

  INSERT INTO platform_mrr_snapshots (
    snapshot_date, period_month,
    mrr_total, arr_total,
    tenants_total, tenants_by_plan,
    marketplace_gmv, marketplace_revenue,
    avg_revenue_per_tenant,
    total_costs_month, gross_profit, gross_margin_pct,
    calculated_at
  ) VALUES (
    v_period_start, p_period_month,
    v_mrr, v_mrr * 12,
    v_tenants, v_by_plan,
    v_marketplace_gmv, v_marketplace_rev,
    CASE WHEN v_tenants > 0 THEN v_mrr / v_tenants ELSE 0 END,
    v_total_costs,
    (v_mrr + v_marketplace_rev) - v_total_costs,
    CASE WHEN (v_mrr + v_marketplace_rev) > 0
      THEN ROUND(((v_mrr + v_marketplace_rev - v_total_costs) / (v_mrr + v_marketplace_rev)) * 100, 2)
      ELSE 0 END,
    now()
  )
  ON CONFLICT (snapshot_date) DO UPDATE SET
    mrr_total = EXCLUDED.mrr_total,
    arr_total = EXCLUDED.arr_total,
    tenants_total = EXCLUDED.tenants_total,
    tenants_by_plan = EXCLUDED.tenants_by_plan,
    marketplace_gmv = EXCLUDED.marketplace_gmv,
    marketplace_revenue = EXCLUDED.marketplace_revenue,
    avg_revenue_per_tenant = EXCLUDED.avg_revenue_per_tenant,
    total_costs_month = EXCLUDED.total_costs_month,
    gross_profit = EXCLUDED.gross_profit,
    gross_margin_pct = EXCLUDED.gross_margin_pct,
    calculated_at = now();
END;
$$;
