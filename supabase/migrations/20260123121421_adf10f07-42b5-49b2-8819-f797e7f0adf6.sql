-- ============================================
-- P-VOIP-03 (Pending completion) - Schema only
-- 1) Trigger to register usage when a crm_voip_call ends
-- 2) Superadmin-gated seed + invoice generation functions
-- 3) Grants for views to authenticated
-- ============================================

-- 1) Trigger: register usage when crm_voip_calls transitions to ended
CREATE OR REPLACE FUNCTION public.trg_register_voip_usage_on_call_end()
RETURNS TRIGGER AS $$
BEGIN
  -- Only when ended_at becomes non-null (or changes) AND duration_seconds is present
  IF (NEW.ended_at IS NOT NULL)
     AND (OLD.ended_at IS DISTINCT FROM NEW.ended_at)
  THEN
    PERFORM public.register_voip_usage(NEW.id);
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

REVOKE ALL ON FUNCTION public.trg_register_voip_usage_on_call_end() FROM PUBLIC;

DROP TRIGGER IF EXISTS trg_crm_voip_calls_register_usage ON public.crm_voip_calls;
CREATE TRIGGER trg_crm_voip_calls_register_usage
AFTER UPDATE OF ended_at ON public.crm_voip_calls
FOR EACH ROW
EXECUTE FUNCTION public.trg_register_voip_usage_on_call_end();

-- 2) Superadmin-gated plan seeding
CREATE OR REPLACE FUNCTION public.seed_voip_pricing_plans_if_empty_superadmin()
RETURNS void AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  PERFORM public.seed_voip_pricing_plans_if_empty();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.seed_voip_pricing_plans_if_empty_superadmin() TO authenticated;

-- 3) Invoice generation (superadmin)
CREATE OR REPLACE FUNCTION public.generate_voip_invoices_superadmin(
  p_period_start DATE,
  p_tax_rate NUMERIC DEFAULT 0
)
RETURNS TABLE (invoice_id UUID) AS $$
DECLARE
  v_period_end DATE;
  v_sub RECORD;
  v_plan RECORD;
  v_inv_id UUID;
  v_plan_amount INTEGER;
  v_usage_amount INTEGER;
  v_extras_amount INTEGER;
  v_subtotal INTEGER;
  v_tax INTEGER;
  v_total INTEGER;
  v_cost INTEGER;
  v_margin INTEGER;
  v_total_calls INTEGER;
  v_total_minutes INTEGER;
  v_included_minutes_used INTEGER;
  v_overage_minutes INTEGER;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.superadmins sa WHERE sa.user_id = auth.uid()) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  v_period_end := (p_period_start + INTERVAL '1 month')::date;

  FOR v_sub IN
    SELECT s.*
    FROM public.voip_subscriptions s
    WHERE s.status = 'active'
  LOOP
    SELECT * INTO v_plan FROM public.voip_pricing_plans p WHERE p.id = v_sub.plan_id;
    IF NOT FOUND THEN
      CONTINUE;
    END IF;

    -- Totals from usage records for period
    SELECT
      COALESCE(COUNT(*), 0) AS total_calls,
      COALESCE(SUM(u.billable_minutes), 0) AS total_minutes,
      COALESCE(SUM(u.total_price_cents), 0) AS usage_amount,
      COALESCE(SUM(u.total_cost_cents), 0) AS total_cost,
      COALESCE(SUM(u.recording_cost_cents + u.transcription_cost_cents), 0) AS extras_amount,
      COALESCE(SUM(CASE WHEN u.minute_type = 'included' THEN u.billable_minutes ELSE 0 END), 0) AS included_minutes_used,
      COALESCE(SUM(CASE WHEN u.minute_type = 'overage' THEN u.billable_minutes ELSE 0 END), 0) AS overage_minutes
    INTO v_total_calls, v_total_minutes, v_usage_amount, v_cost, v_extras_amount, v_included_minutes_used, v_overage_minutes
    FROM public.voip_usage_records u
    WHERE u.organization_id = v_sub.organization_id
      AND u.billing_period = p_period_start
      AND u.status = 'pending';

    -- If nothing pending for this org and plan has no monthly fee, skip
    v_plan_amount := COALESCE(v_plan.monthly_price_cents, 0);
    IF v_total_calls = 0 AND v_plan_amount = 0 THEN
      CONTINUE;
    END IF;

    v_subtotal := v_plan_amount + COALESCE(v_usage_amount, 0) + COALESCE(v_extras_amount, 0);
    v_tax := ROUND(v_subtotal * p_tax_rate)::int;
    v_total := v_subtotal + v_tax;
    v_margin := (COALESCE(v_usage_amount, 0) + COALESCE(v_plan_amount, 0) + COALESCE(v_extras_amount, 0)) - COALESCE(v_cost, 0);

    INSERT INTO public.voip_invoices (
      organization_id,
      subscription_id,
      invoice_number,
      billing_period_start,
      billing_period_end,
      total_calls,
      total_minutes,
      included_minutes_used,
      overage_minutes,
      plan_amount_cents,
      usage_amount_cents,
      extras_amount_cents,
      subtotal_cents,
      tax_cents,
      total_cents,
      total_cost_cents,
      margin_cents,
      margin_percentage,
      status,
      issued_at,
      due_at
    ) VALUES (
      v_sub.organization_id,
      v_sub.id,
      'VOIP-' || to_char(p_period_start, 'YYYYMM') || '-' || substr(v_sub.organization_id::text, 1, 6),
      p_period_start,
      v_period_end,
      v_total_calls,
      v_total_minutes,
      v_included_minutes_used,
      v_overage_minutes,
      v_plan_amount,
      COALESCE(v_usage_amount, 0),
      COALESCE(v_extras_amount, 0),
      v_subtotal,
      v_tax,
      v_total,
      COALESCE(v_cost, 0),
      v_margin,
      CASE WHEN v_total > 0 THEN ROUND((v_margin::numeric / v_total) * 100, 2) ELSE 0 END,
      'pending',
      now(),
      now() + INTERVAL '15 days'
    ) RETURNING id INTO v_inv_id;

    -- Mark usage records as billed and link invoice
    UPDATE public.voip_usage_records
    SET status = 'billed', invoice_id = v_inv_id
    WHERE organization_id = v_sub.organization_id
      AND billing_period = p_period_start
      AND status = 'pending';

    invoice_id := v_inv_id;
    RETURN NEXT;
  END LOOP;

  RETURN;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.generate_voip_invoices_superadmin(DATE, NUMERIC) TO authenticated;

-- 4) Grants for views (required for client-side queries)
GRANT SELECT ON public.v_voip_billing_summary TO authenticated;
GRANT SELECT ON public.v_voip_global_stats TO authenticated;
