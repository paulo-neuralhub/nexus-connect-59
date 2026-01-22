-- =====================================================
-- IP-NEXUS CRM: Automation Studio (Semana 1)
-- Tables + RLS + Seed + RPCs
-- Pattern: get_user_organization_ids() + is_backoffice_admin()
-- =====================================================

BEGIN;

-- 0) Helpers (safe, idempotent)
-- Ensure updated_at trigger function exists
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Ensure helper exists (do NOT assume view user_organizations)
-- get_user_organization_ids() should already exist in this project; we keep as-is.
-- is_backoffice_admin() should already exist; we keep as-is.

-- =====================================================
-- 1) TABLE: crm_automation_action_types (system catalog)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_automation_action_types (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  name text NOT NULL,
  name_es text NOT NULL,
  description text,
  description_es text,

  category text NOT NULL CHECK (category IN (
    'communication',
    'internal',
    'data',
    'flow',
    'integration',
    'ai'
  )),

  icon text NOT NULL DEFAULT 'zap',
  color text NOT NULL DEFAULT '#3b82f6',

  config_schema jsonb NOT NULL DEFAULT '{}'::jsonb,
  available_in_plans text[] DEFAULT ARRAY['professional','enterprise'],
  requires_integration text,

  is_active boolean DEFAULT TRUE,
  sort_order integer DEFAULT 0,

  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_automation_action_types_category
  ON public.crm_automation_action_types(category);

-- RLS: deny by default for tenants; allow backoffice admin read
ALTER TABLE public.crm_automation_action_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_action_types_select_backoffice
  ON public.crm_automation_action_types
  FOR SELECT
  USING (public.is_backoffice_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY crm_action_types_deny_write
  ON public.crm_automation_action_types
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 2) TABLE: crm_automation_templates (system templates)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_automation_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  code text NOT NULL UNIQUE,
  name text NOT NULL,
  name_es text NOT NULL,
  description text,
  description_es text,

  category text NOT NULL CHECK (category IN (
    'onboarding',
    'sales',
    'engagement',
    'retention',
    'operations',
    'compliance'
  )),

  icon text DEFAULT 'zap',
  color text DEFAULT '#3b82f6',

  definition jsonb NOT NULL,

  is_system boolean DEFAULT TRUE,
  recommended_for text[],
  estimated_impact text,
  complexity text DEFAULT 'simple' CHECK (complexity IN ('simple','medium','advanced')),

  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.crm_automation_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_automation_templates_select_backoffice
  ON public.crm_automation_templates
  FOR SELECT
  USING (public.is_backoffice_admin());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY crm_automation_templates_deny_write
  ON public.crm_automation_templates
  FOR ALL
  USING (FALSE)
  WITH CHECK (FALSE);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 3) TABLE: crm_automations (tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_automations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  template_id uuid REFERENCES public.crm_automation_templates(id),

  name text NOT NULL,
  description text,
  category text NOT NULL,

  icon text DEFAULT 'zap',
  color text DEFAULT '#3b82f6',

  is_active boolean DEFAULT FALSE,
  is_paused boolean DEFAULT FALSE,

  trigger_type text NOT NULL CHECK (trigger_type IN (
    'entity_created',
    'entity_updated',
    'field_changed',
    'stage_changed',
    'scheduled',
    'date_approaching',
    'time_in_stage',
    'inactivity',
    'webhook_received',
    'email_received',
    'whatsapp_received',
    'manual'
  )),
  trigger_config jsonb NOT NULL DEFAULT '{}'::jsonb,

  conditions jsonb DEFAULT '[]'::jsonb,
  actions jsonb NOT NULL DEFAULT '[]'::jsonb,

  max_runs_per_entity integer DEFAULT 1,
  max_runs_per_day integer DEFAULT 100,
  cooldown_hours integer DEFAULT 24,

  total_runs integer DEFAULT 0,
  successful_runs integer DEFAULT 0,
  failed_runs integer DEFAULT 0,
  last_run_at timestamptz,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- IMPORTANT: no FK to auth.users
  created_by uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_automations_org
  ON public.crm_automations(organization_id);

CREATE INDEX IF NOT EXISTS idx_crm_automations_active
  ON public.crm_automations(organization_id, is_active)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_crm_automations_trigger
  ON public.crm_automations(trigger_type);

ALTER TABLE public.crm_automations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_automations_tenant_isolation
  ON public.crm_automations
  FOR ALL
  USING (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  )
  WITH CHECK (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_automations_updated_at
  BEFORE UPDATE ON public.crm_automations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 4) TABLE: crm_automation_executions (tenant log)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_automation_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  automation_id uuid NOT NULL REFERENCES public.crm_automations(id) ON DELETE CASCADE,

  trigger_event jsonb NOT NULL,
  entity_type text,
  entity_id uuid,

  status text NOT NULL DEFAULT 'running' CHECK (status IN (
    'running',
    'waiting',
    'waiting_approval',
    'completed',
    'failed',
    'cancelled',
    'skipped'
  )),

  current_action_index integer DEFAULT 0,
  context_data jsonb DEFAULT '{}'::jsonb,

  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  next_action_at timestamptz,

  error_message text,
  error_action_index integer,

  actions_executed jsonb DEFAULT '[]'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_crm_automation_executions_org
  ON public.crm_automation_executions(organization_id);

CREATE INDEX IF NOT EXISTS idx_crm_automation_executions_status_active
  ON public.crm_automation_executions(status)
  WHERE status IN ('running','waiting','waiting_approval');

CREATE INDEX IF NOT EXISTS idx_crm_automation_executions_next
  ON public.crm_automation_executions(next_action_at)
  WHERE status = 'waiting' AND next_action_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_crm_automation_executions_automation
  ON public.crm_automation_executions(automation_id);

ALTER TABLE public.crm_automation_executions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_automation_executions_tenant_isolation
  ON public.crm_automation_executions
  FOR ALL
  USING (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  )
  WITH CHECK (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 5) TABLE: crm_automation_approvals (tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_automation_approvals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  execution_id uuid NOT NULL REFERENCES public.crm_automation_executions(id) ON DELETE CASCADE,

  approval_type text NOT NULL,
  title text NOT NULL,
  description text,
  context_data jsonb NOT NULL,

  assigned_to uuid REFERENCES public.users(id),
  assigned_role text,

  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected','expired')),

  decided_by uuid REFERENCES public.users(id),
  decided_at timestamptz,
  decision_notes text,

  on_approve_actions jsonb DEFAULT '[]'::jsonb,
  on_reject_actions jsonb DEFAULT '[]'::jsonb,

  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_crm_automation_approvals_pending
  ON public.crm_automation_approvals(organization_id, status)
  WHERE status = 'pending';

CREATE INDEX IF NOT EXISTS idx_crm_automation_approvals_assigned
  ON public.crm_automation_approvals(assigned_to, status)
  WHERE status = 'pending';

ALTER TABLE public.crm_automation_approvals ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_automation_approvals_tenant_isolation
  ON public.crm_automation_approvals
  FOR ALL
  USING (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  )
  WITH CHECK (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 6) TABLE: crm_message_templates (tenant)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.crm_message_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,

  name text NOT NULL,
  code text,

  channel text NOT NULL CHECK (channel IN ('email','whatsapp','sms','notification')),

  email_subject text,
  email_body_html text,
  email_body_text text,

  whatsapp_template_name text,
  whatsapp_template_id text,
  whatsapp_language text DEFAULT 'es',
  whatsapp_components jsonb,
  whatsapp_status text DEFAULT 'pending' CHECK (whatsapp_status IN ('pending','approved','rejected')),

  sms_body text,

  notification_title text,
  notification_body text,
  notification_action_url text,

  available_variables jsonb DEFAULT '[]'::jsonb,
  category text,

  is_system boolean DEFAULT FALSE,
  usage_count integer DEFAULT 0,

  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  created_by uuid REFERENCES public.users(id)
);

CREATE INDEX IF NOT EXISTS idx_crm_message_templates_org
  ON public.crm_message_templates(organization_id);

CREATE INDEX IF NOT EXISTS idx_crm_message_templates_channel
  ON public.crm_message_templates(organization_id, channel);

CREATE INDEX IF NOT EXISTS idx_crm_message_templates_code
  ON public.crm_message_templates(organization_id, code)
  WHERE code IS NOT NULL;

ALTER TABLE public.crm_message_templates ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY crm_message_templates_tenant_isolation
  ON public.crm_message_templates
  FOR ALL
  USING (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  )
  WITH CHECK (
    public.is_backoffice_admin()
    OR organization_id = ANY(public.get_user_organization_ids())
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_crm_message_templates_updated_at
  BEFORE UPDATE ON public.crm_message_templates
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =====================================================
-- 7) SEED: Action Types (system)
-- =====================================================
INSERT INTO public.crm_automation_action_types
(code, name, name_es, category, icon, color, config_schema, available_in_plans, sort_order)
VALUES
('send_email', 'Send Email', 'Enviar Email', 'communication', 'mail', '#3b82f6', '{
  "type": "object",
  "required": ["template_id", "to"],
  "properties": {
    "template_id": { "type": "string" },
    "to": { "type": "string" },
    "cc": { "type": "array" },
    "track_opens": { "type": "boolean", "default": true },
    "track_clicks": { "type": "boolean", "default": true }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 1),

('send_whatsapp', 'Send WhatsApp', 'Enviar WhatsApp', 'communication', 'message-circle', '#25D366', '{
  "type": "object",
  "required": ["template_id", "to"],
  "properties": {
    "template_id": { "type": "string" },
    "to": { "type": "string" },
    "variables": { "type": "object" }
  }
}'::jsonb, ARRAY['professional','enterprise'], 2),

('send_sms', 'Send SMS', 'Enviar SMS', 'communication', 'smartphone', '#8b5cf6', '{
  "type": "object",
  "required": ["to"],
  "properties": {
    "template_id": { "type": "string" },
    "to": { "type": "string" },
    "message": { "type": "string", "maxLength": 160 }
  }
}'::jsonb, ARRAY['professional','enterprise'], 3),

('create_task', 'Create Task', 'Crear Tarea', 'internal', 'check-square', '#f59e0b', '{
  "type": "object",
  "required": ["title"],
  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" },
    "assign_to": { "type": "string", "enum": ["owner", "manager", "specific_user", "round_robin"] },
    "assign_user_id": { "type": "string" },
    "due_days": { "type": "integer", "default": 3 },
    "priority": { "type": "string", "enum": ["low", "medium", "high", "urgent"] }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 10),

('send_notification', 'Send Notification', 'Enviar Notificación', 'internal', 'bell', '#ef4444', '{
  "type": "object",
  "required": ["title", "to"],
  "properties": {
    "title": { "type": "string" },
    "body": { "type": "string" },
    "to": { "type": "string", "enum": ["owner", "manager", "specific_user", "all_team"] },
    "to_user_id": { "type": "string" },
    "priority": { "type": "string", "enum": ["low", "normal", "high"] },
    "action_url": { "type": "string" }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 11),

('reassign_owner', 'Reassign Owner', 'Reasignar Responsable', 'internal', 'user-check', '#6366f1', '{
  "type": "object",
  "required": ["strategy"],
  "properties": {
    "strategy": { "type": "string", "enum": ["specific_user", "round_robin", "least_loaded", "by_specialty"] },
    "user_id": { "type": "string" },
    "specialty": { "type": "string" }
  }
}'::jsonb, ARRAY['professional','enterprise'], 12),

('request_approval', 'Request Approval', 'Solicitar Aprobación', 'internal', 'shield-check', '#10b981', '{
  "type": "object",
  "required": ["title", "assign_to"],
  "properties": {
    "approval_type": { "type": "string" },
    "title": { "type": "string" },
    "description": { "type": "string" },
    "assign_to": { "type": "string", "enum": ["manager", "director", "specific_user"] },
    "assign_user_id": { "type": "string" },
    "expires_hours": { "type": "integer", "default": 48 },
    "on_approve_actions": { "type": "array" },
    "on_reject_actions": { "type": "array" }
  }
}'::jsonb, ARRAY['enterprise'], 13),

('update_field', 'Update Field', 'Actualizar Campo', 'data', 'edit-3', '#8b5cf6', '{
  "type": "object",
  "required": ["entity", "field", "value"],
  "properties": {
    "entity": { "type": "string", "enum": ["deal", "contact", "organization", "matter"] },
    "field": { "type": "string" },
    "value": {},
    "operation": { "type": "string", "enum": ["set", "increment", "append"], "default": "set" }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 20),

('create_record', 'Create Record', 'Crear Registro', 'data', 'plus-circle', '#22c55e', '{
  "type": "object",
  "required": ["entity", "data"],
  "properties": {
    "entity": { "type": "string", "enum": ["deal", "task", "interaction", "note"] },
    "data": { "type": "object" },
    "link_to_trigger": { "type": "boolean", "default": true }
  }
}'::jsonb, ARRAY['professional','enterprise'], 21),

('move_deal_stage', 'Move Deal Stage', 'Mover Etapa', 'data', 'arrow-right-circle', '#f59e0b', '{
  "type": "object",
  "properties": {
    "stage_id": { "type": "string" },
    "stage_code": { "type": "string" }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 22),

('add_tag', 'Add Tag', 'Añadir Etiqueta', 'data', 'tag', '#ec4899', '{
  "type": "object",
  "required": ["tags"],
  "properties": {
    "tags": { "type": "array", "items": { "type": "string" } }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 23),

('delay', 'Delay', 'Esperar Tiempo', 'flow', 'clock', '#64748b', '{
  "type": "object",
  "properties": {
    "minutes": { "type": "integer" },
    "hours": { "type": "integer" },
    "days": { "type": "integer" },
    "business_days_only": { "type": "boolean", "default": false }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 30),

('wait_for_event', 'Wait for Event', 'Esperar Evento', 'flow', 'pause-circle', '#3b82f6', '{
  "type": "object",
  "required": ["event_type", "timeout_hours"],
  "properties": {
    "event_type": { "type": "string", "enum": ["email_opened", "email_clicked", "whatsapp_read", "whatsapp_replied", "form_submitted", "payment_received"] },
    "timeout_hours": { "type": "integer", "default": 48 },
    "on_event_actions": { "type": "array" },
    "on_timeout_actions": { "type": "array" }
  }
}'::jsonb, ARRAY['professional','enterprise'], 31),

('branch', 'Branch', 'Bifurcación', 'flow', 'git-branch', '#a855f7', '{
  "type": "object",
  "required": ["condition"],
  "properties": {
    "condition": {
      "type": "object",
      "properties": {
        "field": { "type": "string" },
        "operator": { "type": "string" },
        "value": {}
      }
    },
    "true_actions": { "type": "array" },
    "false_actions": { "type": "array" }
  }
}'::jsonb, ARRAY['professional','enterprise'], 32),

('stop', 'Stop', 'Detener', 'flow', 'stop-circle', '#ef4444', '{
  "type": "object",
  "properties": {
    "reason": { "type": "string" }
  }
}'::jsonb, ARRAY['starter','professional','enterprise'], 33),

('webhook_call', 'Call Webhook', 'Llamar Webhook', 'integration', 'globe', '#6366f1', '{
  "type": "object",
  "required": ["url"],
  "properties": {
    "url": { "type": "string", "format": "uri" },
    "method": { "type": "string", "enum": ["GET", "POST", "PUT"], "default": "POST" },
    "headers": { "type": "object" },
    "body": { "type": "object" }
  }
}'::jsonb, ARRAY['enterprise'], 40),

('create_matter', 'Create Matter', 'Crear Expediente', 'integration', 'folder-plus', '#10b981', '{
  "type": "object",
  "required": ["matter_type", "title"],
  "properties": {
    "matter_type": { "type": "string", "enum": ["trademark", "patent", "design", "litigation", "license"] },
    "title": { "type": "string" },
    "link_to_deal": { "type": "boolean", "default": true },
    "copy_data_from_deal": { "type": "boolean", "default": true }
  }
}'::jsonb, ARRAY['professional','enterprise'], 41),

('ai_generate_text', 'AI Generate Text', 'IA Generar Texto', 'ai', 'sparkles', '#8b5cf6', '{
  "type": "object",
  "required": ["prompt", "output_field"],
  "properties": {
    "prompt": { "type": "string" },
    "context_fields": { "type": "array" },
    "output_field": { "type": "string" },
    "max_tokens": { "type": "integer", "default": 500 },
    "tone": { "type": "string", "enum": ["formal", "friendly", "professional"] }
  }
}'::jsonb, ARRAY['enterprise'], 50),

('ai_analyze_sentiment', 'AI Sentiment', 'IA Sentimiento', 'ai', 'heart', '#ec4899', '{
  "type": "object",
  "required": ["text_field"],
  "properties": {
    "text_field": { "type": "string" },
    "output_field": { "type": "string" },
    "trigger_on_negative": { "type": "boolean", "default": true },
    "negative_threshold": { "type": "number", "default": -0.3 }
  }
}'::jsonb, ARRAY['enterprise'], 51),

('ai_enrich_lead', 'AI Enrich Lead', 'IA Enriquecer Lead', 'ai', 'search', '#3b82f6', '{
  "type": "object",
  "properties": {
    "search_company": { "type": "boolean", "default": true },
    "search_trademarks": { "type": "boolean", "default": true },
    "search_patents": { "type": "boolean", "default": true }
  }
}'::jsonb, ARRAY['enterprise'], 52)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  config_schema = EXCLUDED.config_schema,
  available_in_plans = EXCLUDED.available_in_plans,
  sort_order = EXCLUDED.sort_order,
  is_active = TRUE;

-- =====================================================
-- 8) SEED: 15 Automation Templates (system)
-- =====================================================
INSERT INTO public.crm_automation_templates
(code, name, name_es, category, icon, color, estimated_impact, complexity, definition, sort_order)
VALUES
('welcome_sequence', 'Welcome Sequence', 'Secuencia de Bienvenida', 'onboarding', 'sparkles', '#22c55e', '3x engagement en 30 días', 'medium', '{
  "trigger": { "type": "stage_changed", "config": { "pipeline_code": "new_business", "to_stage": "won" } },
  "conditions": [],
  "actions": [
    { "type": "send_email", "config": { "template_code": "welcome_email", "to": "{{contact.email}}" } },
    { "type": "delay", "config": { "hours": 2 } },
    { "type": "send_whatsapp", "config": { "template_code": "welcome_whatsapp", "to": "{{contact.whatsapp_phone}}" } },
    { "type": "create_task", "config": { "title": "Llamada de onboarding: {{contact.name}}", "assign_to": "owner", "due_days": 3, "priority": "high" } },
    { "type": "delay", "config": { "days": 7 } },
    { "type": "send_email", "config": { "template_code": "onboarding_checkin", "to": "{{contact.email}}" } }
  ]
}'::jsonb, 1),

('new_lead_response', 'New Lead Instant Response', 'Respuesta Inmediata Lead', 'onboarding', 'zap', '#f59e0b', '+80% tasa conversión', 'simple', '{
  "trigger": { "type": "entity_created", "config": { "entity": "contact", "source": "web_form" } },
  "conditions": [{ "field": "contact.lead_status", "operator": "equals", "value": "new" }],
  "actions": [
    { "type": "send_email", "config": { "template_code": "lead_instant_response", "to": "{{contact.email}}" } },
    { "type": "create_task", "config": { "title": "Contactar nuevo lead: {{contact.name}}", "assign_to": "round_robin", "due_days": 1, "priority": "urgent" } },
    { "type": "send_notification", "config": { "title": "🔥 Nuevo Lead", "body": "{{contact.name}} de {{contact.company}}", "to": "all_team", "priority": "high" } }
  ]
}'::jsonb, 2),

('proposal_followup', 'Proposal Follow-up', 'Seguimiento Propuesta', 'sales', 'file-text', '#3b82f6', '+40% cierre propuestas', 'medium', '{
  "trigger": { "type": "stage_changed", "config": { "to_stage": "proposal" } },
  "conditions": [],
  "actions": [
    { "type": "send_email", "config": { "template_code": "proposal_sent", "to": "{{contact.email}}", "track_opens": true } },
    { "type": "wait_for_event", "config": {
        "event_type": "email_opened", "timeout_hours": 48,
        "on_event_actions": [
          { "type": "send_notification", "config": { "title": "📧 Propuesta vista", "body": "{{contact.name}} abrió la propuesta", "to": "owner" } }
        ],
        "on_timeout_actions": [
          { "type": "send_whatsapp", "config": { "template_code": "proposal_reminder", "to": "{{contact.whatsapp_phone}}" } }
        ]
      }
    },
    { "type": "delay", "config": { "days": 5 } },
    { "type": "branch", "config": {
        "condition": { "field": "deal.stage", "operator": "equals", "value": "proposal" },
        "true_actions": [
          { "type": "create_task", "config": { "title": "Llamar seguimiento: {{deal.name}}", "assign_to": "owner", "due_days": 1, "priority": "high" } }
        ],
        "false_actions": []
      }
    }
  ]
}'::jsonb, 3),

('stalled_deal_alert', 'Stalled Deal Alert', 'Alerta Deal Estancado', 'sales', 'alert-triangle', '#ef4444', '-50% deals perdidos', 'simple', '{
  "trigger": { "type": "time_in_stage", "config": { "days": 14, "exclude_stages": ["won", "lost"] } },
  "conditions": [],
  "actions": [
    { "type": "send_notification", "config": { "title": "⚠️ Deal estancado", "body": "{{deal.name}} lleva {{deal.days_in_stage}} días sin movimiento", "to": "owner", "priority": "high" } },
    { "type": "create_task", "config": { "title": "Reactivar: {{deal.name}}", "assign_to": "owner", "due_days": 2, "priority": "high" } },
    { "type": "delay", "config": { "days": 7 } },
    { "type": "branch", "config": {
        "condition": { "field": "deal.days_in_stage", "operator": "greater_than", "value": 21 },
        "true_actions": [
          { "type": "send_notification", "config": { "title": "🚨 Escalación", "body": "{{deal.name}} requiere intervención", "to": "manager", "priority": "high" } }
        ]
      }
    }
  ]
}'::jsonb, 4),

('high_value_deal', 'High Value Deal Alert', 'Alerta Deal Alto Valor', 'sales', 'dollar-sign', '#22c55e', 'Visibilidad VIP', 'simple', '{
  "trigger": { "type": "entity_created", "config": { "entity": "deal" } },
  "conditions": [{ "field": "deal.amount", "operator": "greater_than", "value": 10000 }],
  "actions": [
    { "type": "send_notification", "config": { "title": "💰 Deal alto valor", "body": "{{deal.name}} por {{deal.amount}}€", "to": "manager", "priority": "high" } },
    { "type": "add_tag", "config": { "tags": ["high-value", "priority"] } }
  ]
}'::jsonb, 5),

('renewal_reminder_6m', 'Renewal Reminder 6 Months', 'Recordatorio Renovación 6M', 'compliance', 'calendar-clock', '#f59e0b', '99.9% compliance', 'medium', '{
  "trigger": { "type": "date_approaching", "config": { "entity": "matter", "date_field": "expiry_date", "days_before": 180 } },
  "conditions": [{ "field": "matter.status", "operator": "equals", "value": "active" }],
  "actions": [
    { "type": "send_email", "config": { "template_code": "renewal_notice_6m", "to": "{{matter.contact.email}}" } },
    { "type": "create_record", "config": {
        "entity": "deal",
        "data": { "name": "Renovación {{matter.reference}}", "pipeline_code": "renewals", "stage": "pre_notice", "related_matter_id": "{{matter.id}}" }
      }
    },
    { "type": "create_task", "config": { "title": "Preparar renovación: {{matter.reference}}", "assign_to": "owner", "due_days": 30 } }
  ]
}'::jsonb, 6),

('renewal_urgent_1m', 'Renewal Urgent 1 Month', 'Renovación Urgente 1M', 'compliance', 'alert-circle', '#ef4444', 'Evita caducidades', 'medium', '{
  "trigger": { "type": "date_approaching", "config": { "entity": "matter", "date_field": "expiry_date", "days_before": 30 } },
  "conditions": [{ "field": "matter.status", "operator": "equals", "value": "active" }],
  "actions": [
    { "type": "send_whatsapp", "config": { "template_code": "renewal_urgent", "to": "{{matter.contact.whatsapp_phone}}" } },
    { "type": "send_email", "config": { "template_code": "renewal_urgent_email", "to": "{{matter.contact.email}}" } },
    { "type": "send_notification", "config": { "title": "🚨 Renovación URGENTE", "body": "{{matter.reference}} caduca en 30 días", "to": "owner", "priority": "high" } },
    { "type": "create_task", "config": { "title": "URGENTE: Renovar {{matter.reference}}", "assign_to": "owner", "due_days": 3, "priority": "urgent" } }
  ]
}'::jsonb, 7),

('deadline_approaching', 'Deadline Approaching', 'Deadline Próximo', 'compliance', 'clock', '#ef4444', 'Sin deadlines perdidos', 'simple', '{
  "trigger": { "type": "date_approaching", "config": { "entity": "deadline", "date_field": "due_date", "days_before": 7 } },
  "conditions": [{ "field": "deadline.status", "operator": "equals", "value": "pending" }],
  "actions": [
    { "type": "send_notification", "config": { "title": "⏰ Deadline en 7 días", "body": "{{deadline.description}} - {{deadline.matter.reference}}", "to": "owner", "priority": "high" } },
    { "type": "branch", "config": {
        "condition": { "field": "deadline.type", "operator": "in", "value": ["opposition_deadline", "response_deadline"] },
        "true_actions": [
          { "type": "send_email", "config": { "template_code": "deadline_critical", "to": "{{deadline.matter.contact.email}}" } },
          { "type": "send_notification", "config": { "title": "🚨 DEADLINE CRÍTICO", "body": "{{deadline.description}}", "to": "manager", "priority": "high" } }
        ]
      }
    }
  ]
}'::jsonb, 8),

('docs_pending_reminder', 'Documents Pending Reminder', 'Recordatorio Docs Pendientes', 'compliance', 'file-warning', '#f59e0b', 'Acelera tramitación', 'medium', '{
  "trigger": { "type": "time_in_stage", "config": { "pipeline_code": "trademark_filing", "stage": "docs_pending", "days": 3 } },
  "conditions": [],
  "actions": [
    { "type": "send_whatsapp", "config": { "template_code": "docs_reminder", "to": "{{contact.whatsapp_phone}}" } },
    { "type": "delay", "config": { "days": 4 } },
    { "type": "branch", "config": {
        "condition": { "field": "deal.stage", "operator": "equals", "value": "docs_pending" },
        "true_actions": [
          { "type": "send_email", "config": { "template_code": "docs_escalation", "to": "{{contact.email}}" } },
          { "type": "create_task", "config": { "title": "Llamar para docs: {{deal.name}}", "assign_to": "owner", "due_days": 1, "priority": "high" } }
        ]
      }
    }
  ]
}'::jsonb, 9),

('inactive_client', 'Inactive Client Reactivation', 'Reactivación Cliente Inactivo', 'engagement', 'user-x', '#8b5cf6', 'Recupera 25% clientes', 'medium', '{
  "trigger": { "type": "inactivity", "config": { "entity": "organization", "days": 60 } },
  "conditions": [{ "field": "organization.account_tier", "operator": "in", "value": ["professional", "enterprise"] }],
  "actions": [
    { "type": "update_field", "config": { "entity": "organization", "field": "churn_risk_level", "value": "high" } },
    { "type": "send_email", "config": { "template_code": "we_miss_you", "to": "{{organization.primary_contact.email}}" } },
    { "type": "create_task", "config": { "title": "Reactivar: {{organization.name}}", "assign_to": "owner", "due_days": 3, "priority": "high" } },
    { "type": "send_notification", "config": { "title": "⚠️ Cliente en riesgo", "body": "{{organization.name}} sin actividad 60 días", "to": "manager" } }
  ]
}'::jsonb, 10),

('nps_survey', 'NPS Survey Post-Service', 'Encuesta NPS Post-Servicio', 'engagement', 'star', '#f59e0b', '+35 puntos NPS', 'advanced', '{
  "trigger": { "type": "stage_changed", "config": { "to_stage": "granted" } },
  "conditions": [],
  "actions": [
    { "type": "delay", "config": { "days": 3 } },
    { "type": "send_whatsapp", "config": { "template_code": "nps_quick_survey", "to": "{{contact.whatsapp_phone}}" } },
    { "type": "wait_for_event", "config": {
        "event_type": "whatsapp_replied", "timeout_hours": 48,
        "on_event_actions": [
          { "type": "ai_analyze_sentiment", "config": { "text_field": "{{last_reply}}", "output_field": "nps_sentiment" } },
          { "type": "branch", "config": {
              "condition": { "field": "nps_sentiment", "operator": "less_than", "value": 0 },
              "true_actions": [
                { "type": "send_notification", "config": { "title": "🚨 NPS Negativo", "body": "{{contact.name}} dio feedback negativo", "to": "manager", "priority": "high" } },
                { "type": "create_task", "config": { "title": "Resolver insatisfacción: {{contact.name}}", "assign_to": "manager", "due_days": 1, "priority": "urgent" } }
              ],
              "false_actions": [
                { "type": "send_email", "config": { "template_code": "thank_you_feedback", "to": "{{contact.email}}" } }
              ]
            }
          }
        ],
        "on_timeout_actions": [
          { "type": "send_email", "config": { "template_code": "nps_email_survey", "to": "{{contact.email}}" } }
        ]
      }
    }
  ]
}'::jsonb, 11),

('churn_intervention', 'Churn Risk Intervention', 'Intervención Riesgo Churn', 'retention', 'shield-alert', '#ef4444', 'Retiene 40% en riesgo', 'advanced', '{
  "trigger": { "type": "field_changed", "config": { "entity": "organization", "field": "churn_risk_level", "to": "critical" } },
  "conditions": [],
  "actions": [
    { "type": "send_notification", "config": { "title": "🚨 CLIENTE RIESGO CRÍTICO", "body": "{{organization.name}} en riesgo crítico de churn", "to": "manager", "priority": "high" } },
    { "type": "request_approval", "config": {
        "approval_type": "churn_intervention",
        "title": "Aprobar intervención: {{organization.name}}",
        "description": "Cliente con riesgo crítico de churn",
        "assign_to": "manager",
        "expires_hours": 24,
        "on_approve_actions": [
          { "type": "send_email", "config": { "template_code": "vip_checkin", "to": "{{organization.primary_contact.email}}" } },
          { "type": "create_task", "config": { "title": "Llamada retención: {{organization.name}}", "assign_to": "manager", "due_days": 1, "priority": "urgent" } }
        ]
      }
    }
  ]
}'::jsonb, 12),

('upsell_opportunity', 'Upsell Opportunity Detection', 'Detectar Oportunidad Upsell', 'retention', 'trending-up', '#22c55e', '+35% revenue por cliente', 'simple', '{
  "trigger": { "type": "field_changed", "config": { "entity": "organization", "field": "health_score" } },
  "conditions": [
    { "field": "organization.health_score", "operator": "greater_than", "value": 80 },
    { "field": "organization.account_tier", "operator": "not_equals", "value": "enterprise" }
  ],
  "actions": [
    { "type": "send_notification", "config": { "title": "💰 Oportunidad Upsell", "body": "{{organization.name}} - Health {{organization.health_score}}. Candidato upgrade.", "to": "owner" } },
    { "type": "create_record", "config": { "entity": "deal", "data": { "name": "Upgrade a Enterprise - {{organization.name}}", "pipeline_code": "expansion", "stage": "opportunity" } } }
  ]
}'::jsonb, 13),

('auto_assign', 'Auto-Assign by Specialty', 'Asignación Automática', 'operations', 'users', '#6366f1', 'Eficiencia asignación', 'medium', '{
  "trigger": { "type": "entity_created", "config": { "entity": "deal" } },
  "conditions": [{ "field": "deal.owner_id", "operator": "is_empty" }],
  "actions": [
    { "type": "branch", "config": {
        "condition": { "field": "deal.service_type", "operator": "equals", "value": "patent_filing" },
        "true_actions": [
          { "type": "reassign_owner", "config": { "strategy": "by_specialty", "specialty": "patents" } }
        ],
        "false_actions": [
          { "type": "reassign_owner", "config": { "strategy": "round_robin" } }
        ]
      }
    },
    { "type": "send_notification", "config": { "title": "📋 Deal asignado", "body": "{{deal.name}}", "to": "owner" } }
  ]
}'::jsonb, 14),

('weekly_summary', 'Weekly Summary Report', 'Resumen Semanal', 'operations', 'bar-chart-2', '#8b5cf6', 'Visibilidad equipo', 'simple', '{
  "trigger": { "type": "scheduled", "config": { "cron": "0 9 * * 1" } },
  "conditions": [],
  "actions": [
    { "type": "ai_generate_text", "config": {
        "prompt": "Genera resumen semanal: deals ganados, perdidos, nuevos leads, tareas completadas",
        "context_fields": ["weekly_stats"],
        "output_field": "weekly_summary",
        "tone": "professional"
      }
    },
    { "type": "send_email", "config": { "template_code": "weekly_summary", "to": "all_team" } }
  ]
}'::jsonb, 15)
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  name_es = EXCLUDED.name_es,
  category = EXCLUDED.category,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  estimated_impact = EXCLUDED.estimated_impact,
  complexity = EXCLUDED.complexity,
  definition = EXCLUDED.definition,
  sort_order = EXCLUDED.sort_order;

-- =====================================================
-- 9) RPCs
-- Note: SECURITY DEFINER with fixed search_path and explicit access checks
-- =====================================================

CREATE OR REPLACE FUNCTION public.crm_get_automations(
  p_organization_id uuid,
  p_category text DEFAULT NULL,
  p_active_only boolean DEFAULT FALSE
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT (public.is_backoffice_admin() OR p_organization_id = ANY(public.get_user_organization_ids())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(a.*), '[]'::jsonb)
    FROM (
      SELECT
        au.id,
        au.name,
        au.description,
        au.category,
        au.icon,
        au.color,
        au.is_active,
        au.is_paused,
        au.trigger_type,
        au.total_runs,
        au.successful_runs,
        au.failed_runs,
        au.last_run_at,
        (
          SELECT COUNT(*)
          FROM public.crm_automation_executions e
          WHERE e.automation_id = au.id
            AND e.started_at > now() - interval '24 hours'
        ) AS runs_today,
        t.name_es AS template_name,
        t.estimated_impact
      FROM public.crm_automations au
      LEFT JOIN public.crm_automation_templates t ON t.id = au.template_id
      WHERE au.organization_id = p_organization_id
        AND (p_category IS NULL OR au.category = p_category)
        AND (NOT p_active_only OR au.is_active = TRUE)
      ORDER BY au.is_active DESC, au.total_runs DESC
    ) a
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_get_automation_executions(
  p_automation_id uuid,
  p_status text DEFAULT NULL,
  p_limit integer DEFAULT 50
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.crm_automations
  WHERE id = p_automation_id;

  IF v_org_id IS NULL THEN
    RETURN '[]'::jsonb;
  END IF;

  IF NOT (public.is_backoffice_admin() OR v_org_id = ANY(public.get_user_organization_ids())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  RETURN (
    SELECT COALESCE(jsonb_agg(e.*), '[]'::jsonb)
    FROM (
      SELECT
        ex.id,
        ex.status,
        ex.entity_type,
        ex.entity_id,
        ex.current_action_index,
        ex.started_at,
        ex.completed_at,
        ex.error_message,
        ex.actions_executed
      FROM public.crm_automation_executions ex
      WHERE ex.automation_id = p_automation_id
        AND (p_status IS NULL OR ex.status = p_status)
      ORDER BY ex.started_at DESC
      LIMIT GREATEST(1, LEAST(p_limit, 500))
    ) e
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_activate_automation_template(
  p_organization_id uuid,
  p_template_code text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template record;
  v_automation_id uuid;
BEGIN
  IF NOT (public.is_backoffice_admin() OR p_organization_id = ANY(public.get_user_organization_ids())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  SELECT * INTO v_template
  FROM public.crm_automation_templates
  WHERE code = p_template_code;

  IF v_template IS NULL THEN
    RAISE EXCEPTION 'Template not found: %', p_template_code;
  END IF;

  SELECT id INTO v_automation_id
  FROM public.crm_automations
  WHERE organization_id = p_organization_id
    AND template_id = v_template.id;

  IF v_automation_id IS NOT NULL THEN
    UPDATE public.crm_automations
    SET is_active = TRUE, is_paused = FALSE, updated_at = now()
    WHERE id = v_automation_id;
    RETURN v_automation_id;
  END IF;

  INSERT INTO public.crm_automations (
    organization_id,
    template_id,
    name,
    description,
    category,
    icon,
    color,
    trigger_type,
    trigger_config,
    conditions,
    actions,
    is_active
  )
  VALUES (
    p_organization_id,
    v_template.id,
    v_template.name_es,
    v_template.description_es,
    v_template.category,
    COALESCE(v_template.icon, 'zap'),
    COALESCE(v_template.color, '#3b82f6'),
    (v_template.definition->'trigger'->>'type'),
    COALESCE(v_template.definition->'trigger'->'config', '{}'::jsonb),
    COALESCE(v_template.definition->'conditions', '[]'::jsonb),
    COALESCE(v_template.definition->'actions', '[]'::jsonb),
    TRUE
  )
  RETURNING id INTO v_automation_id;

  RETURN v_automation_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_get_pending_approvals(p_user_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(a.*), '[]'::jsonb)
    FROM (
      SELECT
        ap.id,
        ap.approval_type,
        ap.title,
        ap.description,
        ap.context_data,
        ap.expires_at,
        ap.created_at,
        au.name AS automation_name
      FROM public.crm_automation_approvals ap
      JOIN public.crm_automation_executions ex ON ex.id = ap.execution_id
      JOIN public.crm_automations au ON au.id = ex.automation_id
      WHERE ap.status = 'pending'
        AND (public.is_backoffice_admin() OR ap.organization_id = ANY(public.get_user_organization_ids()))
        AND (p_user_id IS NULL OR ap.assigned_to = p_user_id OR ap.assigned_to IS NULL)
      ORDER BY ap.created_at DESC
    ) a
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.crm_resolve_approval(
  p_approval_id uuid,
  p_decision text,
  p_notes text DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_approval record;
BEGIN
  IF p_decision NOT IN ('approved','rejected') THEN
    RAISE EXCEPTION 'Invalid decision';
  END IF;

  SELECT * INTO v_approval
  FROM public.crm_automation_approvals
  WHERE id = p_approval_id
    AND status = 'pending';

  IF v_approval IS NULL THEN
    RETURN FALSE;
  END IF;

  IF NOT (public.is_backoffice_admin() OR v_approval.organization_id = ANY(public.get_user_organization_ids())) THEN
    RAISE EXCEPTION 'Access denied';
  END IF;

  UPDATE public.crm_automation_approvals
  SET
    status = p_decision,
    decided_by = auth.uid(),
    decided_at = now(),
    decision_notes = p_notes
  WHERE id = p_approval_id;

  UPDATE public.crm_automation_executions
  SET
    status = 'running',
    context_data = COALESCE(context_data, '{}'::jsonb) || jsonb_build_object(
      'approval_decision', p_decision,
      'approval_notes', p_notes
    )
  WHERE id = v_approval.execution_id;

  RETURN TRUE;
END;
$$;

COMMIT;