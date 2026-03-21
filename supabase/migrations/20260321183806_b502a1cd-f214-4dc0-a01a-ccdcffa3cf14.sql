-- =============================================
-- ANALYTICS-01 FASE 1: Core Tables & Functions
-- =============================================

-- 1. ALTER analytics_events: add missing columns for IP-NEXUS multi-tenant
ALTER TABLE analytics_events
  ADD COLUMN IF NOT EXISTS event_type text,
  ADD COLUMN IF NOT EXISTS matter_id uuid REFERENCES matters(id),
  ADD COLUMN IF NOT EXISTS entity_type text,
  ADD COLUMN IF NOT EXISTS entity_id uuid,
  ADD COLUMN IF NOT EXISTS user_country text,
  ADD COLUMN IF NOT EXISTS occurred_at timestamptz DEFAULT now();

-- Backfill event_type from event_name for existing rows
UPDATE analytics_events SET event_type = event_name WHERE event_type IS NULL AND event_name IS NOT NULL;

-- Make organization_id NOT NULL (0 rows so safe)
ALTER TABLE analytics_events ALTER COLUMN organization_id SET NOT NULL;

-- 2. CREATE analytics_daily_metrics
CREATE TABLE IF NOT EXISTS analytics_daily_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  metric_date date NOT NULL DEFAULT CURRENT_DATE,
  matters_total integer DEFAULT 0,
  matters_active integer DEFAULT 0,
  matters_created_today integer DEFAULT 0,
  matters_trademark integer DEFAULT 0,
  matters_patent integer DEFAULT 0,
  matters_design integer DEFAULT 0,
  deadlines_due_today integer DEFAULT 0,
  deadlines_completed_today integer DEFAULT 0,
  deadlines_missed_today integer DEFAULT 0,
  deadlines_overdue_total integer DEFAULT 0,
  deadline_compliance_rate numeric(5,2) DEFAULT 0,
  revenue_invoiced_month numeric(10,2) DEFAULT 0,
  revenue_collected_month numeric(10,2) DEFAULT 0,
  revenue_pending numeric(10,2) DEFAULT 0,
  invoices_created_today integer DEFAULT 0,
  avg_invoice_value numeric(10,2) DEFAULT 0,
  clients_total integer DEFAULT 0,
  clients_active integer DEFAULT 0,
  deals_pipeline_value numeric(10,2) DEFAULT 0,
  deals_won_month integer DEFAULT 0,
  deals_lost_month integer DEFAULT 0,
  ai_queries_today integer DEFAULT 0,
  ai_documents_generated_today integer DEFAULT 0,
  ai_cost_today_eur numeric(10,4) DEFAULT 0,
  ai_cost_month_eur numeric(10,4) DEFAULT 0,
  spider_alerts_new integer DEFAULT 0,
  spider_alerts_critical integer DEFAULT 0,
  spider_watches_active integer DEFAULT 0,
  emails_sent_today integer DEFAULT 0,
  whatsapp_sent_today integer DEFAULT 0,
  calls_made_today integer DEFAULT 0,
  hours_logged_today numeric(6,2) DEFAULT 0,
  hours_billable_today numeric(6,2) DEFAULT 0,
  calculated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, metric_date)
);

-- 3. CREATE analytics_matter_metrics
CREATE TABLE IF NOT EXISTS analytics_matter_metrics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  matter_id uuid NOT NULL UNIQUE REFERENCES matters(id),
  total_invoiced numeric(10,2) DEFAULT 0,
  total_collected numeric(10,2) DEFAULT 0,
  total_hours numeric(6,2) DEFAULT 0,
  total_hours_cost numeric(10,2) DEFAULT 0,
  total_expenses numeric(10,2) DEFAULT 0,
  margin_eur numeric(10,2) DEFAULT 0,
  margin_pct numeric(5,2) DEFAULT 0,
  office_actions_received integer DEFAULT 0,
  office_actions_responded integer DEFAULT 0,
  office_actions_on_time integer DEFAULT 0,
  oppositions_received integer DEFAULT 0,
  oppositions_filed integer DEFAULT 0,
  deadlines_total integer DEFAULT 0,
  deadlines_completed_on_time integer DEFAULT 0,
  deadlines_missed integer DEFAULT 0,
  days_since_filing integer,
  expected_registration_date date,
  actual_registration_date date,
  days_to_registration integer,
  last_calculated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 4. ALTER report_definitions: add missing columns
ALTER TABLE report_definitions
  ADD COLUMN IF NOT EXISTS output_formats text[] DEFAULT '{"pdf","csv","excel"}',
  ADD COLUMN IF NOT EXISTS is_scheduled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS schedule_cron text,
  ADD COLUMN IF NOT EXISTS is_system_template boolean DEFAULT false;

-- 5. ALTER report_executions: add missing columns
ALTER TABLE report_executions
  ADD COLUMN IF NOT EXISTS report_definition_id uuid REFERENCES report_definitions(id),
  ADD COLUMN IF NOT EXISTS parameters jsonb DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS duration_seconds integer,
  ADD COLUMN IF NOT EXISTS row_count integer,
  ADD COLUMN IF NOT EXISTS file_path text,
  ADD COLUMN IF NOT EXISTS file_size_bytes integer,
  ADD COLUMN IF NOT EXISTS requested_by uuid REFERENCES profiles(id);

-- 6. RLS on new tables
ALTER TABLE analytics_daily_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_matter_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "analytics_daily_metrics_org" ON analytics_daily_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "analytics_matter_metrics_org" ON analytics_matter_metrics
  FOR ALL USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Update report_definitions RLS: system templates readable by all
DROP POLICY IF EXISTS "report_definitions_org_isolation" ON report_definitions;

CREATE POLICY "report_defs_read" ON report_definitions
  FOR SELECT USING (
    is_system_template = true OR
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "report_defs_write" ON report_definitions
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "report_defs_update" ON report_definitions
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

CREATE POLICY "report_defs_delete" ON report_definitions
  FOR DELETE USING (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    ) OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
    )
  );

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_analytics_events_org_type
  ON analytics_events(organization_id, event_type, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_daily_org_date
  ON analytics_daily_metrics(organization_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_matter_org
  ON analytics_matter_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_report_exec_org_status
  ON report_executions(organization_id, status, created_at DESC);

-- 8. FUNCTION: calculate_daily_metrics
CREATE OR REPLACE FUNCTION calculate_daily_metrics(
  p_org_id uuid,
  p_date date DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_matters_total integer;
  v_matters_active integer;
  v_matters_created integer;
  v_matters_trademark integer;
  v_matters_patent integer;
  v_matters_design integer;
  v_deadlines_due integer;
  v_deadlines_completed integer;
  v_deadlines_missed integer;
  v_deadlines_overdue integer;
  v_compliance numeric(5,2);
  v_rev_invoiced numeric(10,2);
  v_rev_collected numeric(10,2);
  v_rev_pending numeric(10,2);
  v_invoices_created integer;
  v_avg_invoice numeric(10,2);
  v_ai_cost_month numeric(10,4);
  v_hours_logged numeric(6,2);
  v_hours_billable numeric(6,2);
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status NOT IN ('archived','cancelled','closed')),
    COUNT(*) FILTER (WHERE DATE(created_at) = p_date),
    COUNT(*) FILTER (WHERE type = 'trademark'),
    COUNT(*) FILTER (WHERE type = 'patent'),
    COUNT(*) FILTER (WHERE type = 'design')
  INTO v_matters_total, v_matters_active, v_matters_created,
       v_matters_trademark, v_matters_patent, v_matters_design
  FROM matters WHERE organization_id = p_org_id;

  SELECT
    COUNT(*) FILTER (WHERE deadline_date = p_date),
    COUNT(*) FILTER (WHERE status = 'completed' AND DATE(completed_at) = p_date),
    COUNT(*) FILTER (WHERE status = 'missed' AND deadline_date = p_date),
    COUNT(*) FILTER (WHERE deadline_date < p_date AND status NOT IN ('completed','cancelled'))
  INTO v_deadlines_due, v_deadlines_completed, v_deadlines_missed, v_deadlines_overdue
  FROM matter_deadlines WHERE organization_id = p_org_id;

  SELECT CASE
    WHEN COUNT(*) FILTER (WHERE deadline_date <= p_date) = 0 THEN 100
    ELSE ROUND(
      100.0 * COUNT(*) FILTER (WHERE status = 'completed' AND deadline_date <= p_date) /
      NULLIF(COUNT(*) FILTER (WHERE deadline_date <= p_date), 0), 2
    )
  END INTO v_compliance
  FROM matter_deadlines WHERE organization_id = p_org_id;

  SELECT
    COALESCE(SUM(total) FILTER (WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', p_date::timestamp)), 0),
    COALESCE(SUM(paid_amount) FILTER (WHERE paid_date IS NOT NULL AND DATE_TRUNC('month', paid_date::timestamp) = DATE_TRUNC('month', p_date::timestamp)), 0),
    COALESCE(SUM(total) FILTER (WHERE status IN ('sent','overdue','partial')), 0),
    COUNT(*) FILTER (WHERE DATE(created_at) = p_date),
    COALESCE(AVG(total) FILTER (WHERE DATE_TRUNC('month', invoice_date) = DATE_TRUNC('month', p_date::timestamp)), 0)
  INTO v_rev_invoiced, v_rev_collected, v_rev_pending, v_invoices_created, v_avg_invoice
  FROM invoices WHERE organization_id = p_org_id;

  SELECT COALESCE(SUM(estimated_cost_cents) / 100.0, 0) INTO v_ai_cost_month
  FROM ai_usage
  WHERE organization_id = p_org_id
  AND DATE_TRUNC('month', created_at) = DATE_TRUNC('month', p_date::timestamp);

  SELECT
    COALESCE(SUM(duration_minutes) / 60.0, 0),
    COALESCE(SUM(duration_minutes) FILTER (WHERE is_billable = true) / 60.0, 0)
  INTO v_hours_logged, v_hours_billable
  FROM time_entries
  WHERE organization_id = p_org_id AND date = p_date;

  INSERT INTO analytics_daily_metrics (
    organization_id, metric_date,
    matters_total, matters_active, matters_created_today,
    matters_trademark, matters_patent, matters_design,
    deadlines_due_today, deadlines_completed_today,
    deadlines_missed_today, deadlines_overdue_total,
    deadline_compliance_rate,
    revenue_invoiced_month, revenue_collected_month,
    revenue_pending, invoices_created_today, avg_invoice_value,
    ai_cost_month_eur,
    hours_logged_today, hours_billable_today,
    calculated_at
  ) VALUES (
    p_org_id, p_date,
    v_matters_total, v_matters_active, v_matters_created,
    v_matters_trademark, v_matters_patent, v_matters_design,
    v_deadlines_due, v_deadlines_completed,
    v_deadlines_missed, v_deadlines_overdue,
    v_compliance,
    v_rev_invoiced, v_rev_collected,
    v_rev_pending, v_invoices_created, v_avg_invoice,
    v_ai_cost_month,
    v_hours_logged, v_hours_billable,
    now()
  )
  ON CONFLICT (organization_id, metric_date)
  DO UPDATE SET
    matters_total = EXCLUDED.matters_total,
    matters_active = EXCLUDED.matters_active,
    matters_created_today = EXCLUDED.matters_created_today,
    matters_trademark = EXCLUDED.matters_trademark,
    matters_patent = EXCLUDED.matters_patent,
    matters_design = EXCLUDED.matters_design,
    deadlines_due_today = EXCLUDED.deadlines_due_today,
    deadlines_completed_today = EXCLUDED.deadlines_completed_today,
    deadlines_missed_today = EXCLUDED.deadlines_missed_today,
    deadlines_overdue_total = EXCLUDED.deadlines_overdue_total,
    deadline_compliance_rate = EXCLUDED.deadline_compliance_rate,
    revenue_invoiced_month = EXCLUDED.revenue_invoiced_month,
    revenue_collected_month = EXCLUDED.revenue_collected_month,
    revenue_pending = EXCLUDED.revenue_pending,
    invoices_created_today = EXCLUDED.invoices_created_today,
    avg_invoice_value = EXCLUDED.avg_invoice_value,
    ai_cost_month_eur = EXCLUDED.ai_cost_month_eur,
    hours_logged_today = EXCLUDED.hours_logged_today,
    hours_billable_today = EXCLUDED.hours_billable_today,
    calculated_at = now();
END;
$$;

-- 9. FUNCTION: calculate_matter_metrics
CREATE OR REPLACE FUNCTION calculate_matter_metrics(
  p_matter_id uuid
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_org_id uuid;
  v_invoiced numeric(10,2);
  v_collected numeric(10,2);
  v_hours numeric(6,2);
  v_hours_cost numeric(10,2);
  v_expenses numeric(10,2);
  v_margin numeric(10,2);
  v_margin_pct numeric(5,2);
  v_dl_total integer;
  v_dl_on_time integer;
  v_dl_missed integer;
BEGIN
  SELECT organization_id INTO v_org_id FROM matters WHERE id = p_matter_id;
  IF v_org_id IS NULL THEN RETURN; END IF;

  SELECT COALESCE(SUM(total), 0), COALESCE(SUM(paid_amount), 0)
  INTO v_invoiced, v_collected
  FROM invoices WHERE matter_id = p_matter_id;

  SELECT
    COALESCE(SUM(duration_minutes) / 60.0, 0),
    COALESCE(SUM(duration_minutes / 60.0 * COALESCE(hourly_rate, 0)), 0)
  INTO v_hours, v_hours_cost
  FROM time_entries WHERE matter_id = p_matter_id;

  SELECT COALESCE(SUM(amount), 0) INTO v_expenses
  FROM expenses WHERE matter_id = p_matter_id;

  v_margin := v_invoiced - v_hours_cost - v_expenses;
  v_margin_pct := CASE WHEN v_invoiced > 0 THEN ROUND(v_margin / v_invoiced * 100, 2) ELSE 0 END;

  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'completed' AND completed_at <= deadline_date),
    COUNT(*) FILTER (WHERE status = 'missed' OR (deadline_date < CURRENT_DATE AND status NOT IN ('completed','cancelled')))
  INTO v_dl_total, v_dl_on_time, v_dl_missed
  FROM matter_deadlines WHERE matter_id = p_matter_id;

  INSERT INTO analytics_matter_metrics (
    organization_id, matter_id,
    total_invoiced, total_collected,
    total_hours, total_hours_cost, total_expenses,
    margin_eur, margin_pct,
    deadlines_total, deadlines_completed_on_time, deadlines_missed,
    last_calculated_at
  ) VALUES (
    v_org_id, p_matter_id,
    v_invoiced, v_collected,
    v_hours, v_hours_cost, v_expenses,
    v_margin, v_margin_pct,
    v_dl_total, v_dl_on_time, v_dl_missed,
    now()
  )
  ON CONFLICT (matter_id) DO UPDATE SET
    total_invoiced = EXCLUDED.total_invoiced,
    total_collected = EXCLUDED.total_collected,
    total_hours = EXCLUDED.total_hours,
    total_hours_cost = EXCLUDED.total_hours_cost,
    total_expenses = EXCLUDED.total_expenses,
    margin_eur = EXCLUDED.margin_eur,
    margin_pct = EXCLUDED.margin_pct,
    deadlines_total = EXCLUDED.deadlines_total,
    deadlines_completed_on_time = EXCLUDED.deadlines_completed_on_time,
    deadlines_missed = EXCLUDED.deadlines_missed,
    last_calculated_at = now(),
    updated_at = now();
END;
$$;

-- 10. SEED: System report templates
INSERT INTO report_definitions
  (name, description, report_type, is_system_template, is_active, output_formats, config)
VALUES
('Portfolio de PI', 'Resumen completo del portfolio por tipo, jurisdicción y estado',
 'portfolio', true, true, '{"pdf","excel","csv"}',
 '{"group_by": ["type","jurisdiction","status"], "include_deadlines": true}'),
('Plazos y Deadlines', 'Análisis de cumplimiento de plazos legales',
 'deadlines', true, true, '{"pdf","excel"}',
 '{"include_overdue": true, "include_upcoming_days": 90}'),
('Análisis Financiero', 'Revenue, cobros, rentabilidad por expediente y cliente',
 'financial', true, true, '{"pdf","excel","csv"}',
 '{"include_matter_profitability": true, "include_client_analysis": true}'),
('Productividad del Despacho', 'Horas trabajadas, facturables y facturadas por usuario',
 'productivity', true, true, '{"pdf","excel"}',
 '{"group_by": ["user","matter_type"], "include_utilization_rate": true}'),
('Análisis de Clientes', 'Portfolio por cliente, revenue, actividad',
 'client_analysis', true, true, '{"pdf","excel"}',
 '{"include_portfolio_per_client": true, "include_revenue": true}'),
('Uso de IA', 'Consumo y costes de IP-GENIUS y otros módulos IA',
 'ai_usage', true, true, '{"pdf","csv"}',
 '{"group_by": ["module","model"], "include_cost_breakdown": true}')
ON CONFLICT DO NOTHING;