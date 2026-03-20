
-- ============================================================
-- CRM-02 FASE 1: Llamadas, Automatizaciones, AI Suggestions
-- ============================================================

-- 1. crm_calls (llamadas con grabación y GDPR)
CREATE TABLE IF NOT EXISTS public.crm_calls (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL,
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  initiated_by uuid NOT NULL REFERENCES public.profiles(id),
  direction text NOT NULL DEFAULT 'outbound',
  phone_number_to text,
  phone_number_from text,
  duration_seconds integer DEFAULT 0,
  status text DEFAULT 'initiated',
  outcome text,
  recording_consent boolean DEFAULT false,
  recording_url text,
  recording_duration_seconds integer,
  transcription text,
  transcription_summary text,
  ai_next_action text,
  provider text DEFAULT 'manual',
  provider_call_sid text,
  notes text,
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- 2. crm_automation_rules
CREATE TABLE IF NOT EXISTS public.crm_automation_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  pipeline_id uuid REFERENCES public.crm_pipelines(id) ON DELETE SET NULL,
  stage_id uuid REFERENCES public.crm_pipeline_stages(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT true,
  trigger_type text NOT NULL,
  trigger_config jsonb NOT NULL DEFAULT '{}',
  action_type text NOT NULL,
  action_config jsonb NOT NULL DEFAULT '{}',
  execution_count integer DEFAULT 0,
  last_executed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 3. crm_automation_executions (log inmutable)
CREATE TABLE IF NOT EXISTS public.crm_automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_id uuid NOT NULL REFERENCES public.crm_automation_rules(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  deal_id uuid REFERENCES public.crm_deals(id) ON DELETE SET NULL,
  account_id uuid REFERENCES public.crm_accounts(id) ON DELETE SET NULL,
  trigger_data jsonb DEFAULT '{}',
  action_result jsonb DEFAULT '{}',
  status text NOT NULL DEFAULT 'success',
  error_message text,
  executed_at timestamptz DEFAULT now()
);

-- 4. crm_ai_suggestions (CoPilot)
CREATE TABLE IF NOT EXISTS public.crm_ai_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id),
  user_id uuid REFERENCES public.profiles(id),
  context_type text NOT NULL,
  context_id uuid,
  suggestion_type text NOT NULL,
  priority text NOT NULL DEFAULT 'medium',
  title text NOT NULL,
  body text NOT NULL,
  action_label text,
  action_type text,
  action_data jsonb DEFAULT '{}',
  is_dismissed boolean DEFAULT false,
  is_actioned boolean DEFAULT false,
  generated_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT (now() + interval '6 hours'),
  related_matter_id uuid REFERENCES public.matters(id) ON DELETE SET NULL,
  related_deadline_id uuid REFERENCES public.matter_deadlines(id) ON DELETE SET NULL
);

-- 5. Add call_id to crm_activities
ALTER TABLE public.crm_activities
  ADD COLUMN IF NOT EXISTS call_id uuid;

-- 6. RLS
ALTER TABLE public.crm_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_automation_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_ai_suggestions ENABLE ROW LEVEL SECURITY;

-- RLS policies using get_user_org_id()
CREATE POLICY "crm_calls_org_isolation" ON public.crm_calls
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "crm_automation_rules_org_isolation" ON public.crm_automation_rules
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "crm_automation_executions_org_isolation" ON public.crm_automation_executions
  FOR ALL USING (organization_id = public.get_user_org_id());

CREATE POLICY "crm_ai_suggestions_org_isolation" ON public.crm_ai_suggestions
  FOR ALL USING (organization_id = public.get_user_org_id());

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_crm_calls_account ON public.crm_calls(account_id);
CREATE INDEX IF NOT EXISTS idx_crm_calls_contact ON public.crm_calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_crm_calls_org ON public.crm_calls(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_auto_rules_stage ON public.crm_automation_rules(stage_id, is_active);
CREATE INDEX IF NOT EXISTS idx_crm_auto_rules_org ON public.crm_automation_rules(organization_id);
CREATE INDEX IF NOT EXISTS idx_crm_auto_exec_rule ON public.crm_automation_executions(rule_id);
CREATE INDEX IF NOT EXISTS idx_crm_ai_suggestions_context ON public.crm_ai_suggestions(context_type, context_id, is_dismissed);
CREATE INDEX IF NOT EXISTS idx_crm_ai_suggestions_expires ON public.crm_ai_suggestions(expires_at);
CREATE INDEX IF NOT EXISTS idx_crm_ai_suggestions_org ON public.crm_ai_suggestions(organization_id);

-- 8. Updated_at triggers
CREATE TRIGGER update_crm_automation_rules_updated_at
  BEFORE UPDATE ON public.crm_automation_rules
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 9. Seed: 5 default IP automation rules per organization
INSERT INTO public.crm_automation_rules (
  organization_id, name, description, trigger_type, trigger_config,
  action_type, action_config, is_active
)
SELECT
  o.id,
  r.name,
  r.description,
  r.trigger_type,
  r.trigger_config::jsonb,
  r.action_type,
  r.action_config::jsonb,
  true
FROM public.organizations o
CROSS JOIN (VALUES
  (
    'Al firmar mandato → generar POA',
    'Genera documento de Power of Attorney al cerrar deal como ganado',
    'deal_won',
    '{}',
    'generate_document',
    '{"template": "power_of_attorney", "notify_responsible": true}'
  ),
  (
    'Al firmar mandato → tarea apertura expediente',
    'Crea tarea para abrir expediente IP del nuevo cliente',
    'deal_won',
    '{}',
    'create_task',
    '{"title": "Abrir expediente IP para {{account_name}}", "assignee": "responsible", "days_due": 2}'
  ),
  (
    'Propuesta sin respuesta 7 días → CoPilot',
    'Genera sugerencia de seguimiento si la propuesta lleva 7 días sin actividad',
    'stage_time_elapsed',
    '{"days": 7}',
    'ai_suggest',
    '{"suggestion_type": "follow_up", "priority": "high"}'
  ),
  (
    'Deal perdido → re-engagement 90 días',
    'Sugiere reactivación del cliente tras 90 días de perder el deal',
    'deal_lost',
    '{}',
    'ai_suggest',
    '{"suggestion_type": "reengagement", "priority": "low", "delay_days": 90}'
  ),
  (
    'Renovación IP < 60 días sin deal → oportunidad',
    'Detecta renovaciones próximas sin presupuesto y sugiere crear deal',
    'deadline_approaching',
    '{"days_before": 60, "deadline_type": "renewal"}',
    'ai_suggest',
    '{"suggestion_type": "renewal_opportunity", "priority": "high"}'
  )
) AS r(name, description, trigger_type, trigger_config, action_type, action_config)
ON CONFLICT DO NOTHING;
