-- =============================================
-- IP-WORKFLOW SYSTEM - DATABASE SCHEMA
-- =============================================

-- 1. Workflow Templates Table
CREATE TABLE public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'custom',
  
  trigger_type TEXT NOT NULL,
  trigger_config JSONB DEFAULT '{}',
  
  conditions JSONB DEFAULT '[]',
  actions JSONB DEFAULT '[]',
  
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  
  execution_count INTEGER DEFAULT 0,
  last_executed_at TIMESTAMPTZ,
  
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, code)
);

-- 2. Workflow Executions Table
CREATE TABLE public.workflow_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'pending',
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  current_action_index INTEGER DEFAULT 0,
  actions_completed INTEGER DEFAULT 0,
  actions_failed INTEGER DEFAULT 0,
  
  result JSONB DEFAULT '{}',
  error_message TEXT,
  
  context JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Workflow Action Logs Table
CREATE TABLE public.workflow_action_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_id UUID NOT NULL REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  
  action_index INTEGER NOT NULL,
  action_type TEXT NOT NULL,
  action_config JSONB DEFAULT '{}',
  
  status TEXT NOT NULL DEFAULT 'pending',
  
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER,
  
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  
  retry_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Workflow Queue Table
CREATE TABLE public.workflow_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  execution_id UUID REFERENCES public.workflow_executions(id) ON DELETE CASCADE,
  
  trigger_type TEXT NOT NULL,
  trigger_data JSONB DEFAULT '{}',
  
  priority INTEGER DEFAULT 5,
  
  status TEXT NOT NULL DEFAULT 'pending',
  
  scheduled_for TIMESTAMPTZ DEFAULT NOW(),
  locked_at TIMESTAMPTZ,
  locked_by TEXT,
  
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  last_error TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Workflow Variables Table
CREATE TABLE public.workflow_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  
  scope TEXT NOT NULL DEFAULT 'organization',
  scope_id UUID,
  
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  value_type TEXT NOT NULL DEFAULT 'string',
  
  description TEXT,
  is_secret BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, scope, scope_id, key)
);

-- 6. Workflow Schedules Table
CREATE TABLE public.workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  workflow_id UUID NOT NULL REFERENCES public.workflow_templates(id) ON DELETE CASCADE,
  
  name TEXT NOT NULL,
  description TEXT,
  
  schedule_type TEXT NOT NULL DEFAULT 'cron',
  cron_expression TEXT,
  interval_minutes INTEGER,
  
  timezone TEXT DEFAULT 'UTC',
  
  is_active BOOLEAN DEFAULT true,
  
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  run_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_workflow_templates_org ON public.workflow_templates(organization_id);
CREATE INDEX idx_workflow_templates_trigger ON public.workflow_templates(trigger_type) WHERE is_active = true;
CREATE INDEX idx_workflow_templates_category ON public.workflow_templates(category);

CREATE INDEX idx_workflow_executions_org ON public.workflow_executions(organization_id);
CREATE INDEX idx_workflow_executions_workflow ON public.workflow_executions(workflow_id);
CREATE INDEX idx_workflow_executions_status ON public.workflow_executions(status);
CREATE INDEX idx_workflow_executions_created ON public.workflow_executions(created_at DESC);

CREATE INDEX idx_workflow_action_logs_execution ON public.workflow_action_logs(execution_id);
CREATE INDEX idx_workflow_action_logs_status ON public.workflow_action_logs(status);

CREATE INDEX idx_workflow_queue_status ON public.workflow_queue(status, scheduled_for) WHERE status = 'pending';
CREATE INDEX idx_workflow_queue_org ON public.workflow_queue(organization_id);

CREATE INDEX idx_workflow_variables_org ON public.workflow_variables(organization_id);
CREATE INDEX idx_workflow_variables_scope ON public.workflow_variables(scope, scope_id);

CREATE INDEX idx_workflow_schedules_next ON public.workflow_schedules(next_run_at) WHERE is_active = true;

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_executions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_variables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

-- Workflow Templates Policies
CREATE POLICY "Users can view their org workflow templates"
  ON public.workflow_templates FOR SELECT
  USING (is_member_of_org(organization_id) OR organization_id IS NULL);

CREATE POLICY "Users can create workflow templates in their org"
  ON public.workflow_templates FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update their org workflow templates"
  ON public.workflow_templates FOR UPDATE
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can delete their org workflow templates"
  ON public.workflow_templates FOR DELETE
  USING (is_member_of_org(organization_id) AND is_system = false);

-- Workflow Executions Policies
CREATE POLICY "Users can view their org workflow executions"
  ON public.workflow_executions FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create workflow executions in their org"
  ON public.workflow_executions FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update their org workflow executions"
  ON public.workflow_executions FOR UPDATE
  USING (is_member_of_org(organization_id));

-- Workflow Action Logs Policies
CREATE POLICY "Users can view action logs for their executions"
  ON public.workflow_action_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.workflow_executions we
    WHERE we.id = execution_id AND is_member_of_org(we.organization_id)
  ));

CREATE POLICY "Users can create action logs"
  ON public.workflow_action_logs FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.workflow_executions we
    WHERE we.id = execution_id AND is_member_of_org(we.organization_id)
  ));

CREATE POLICY "Users can update action logs"
  ON public.workflow_action_logs FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.workflow_executions we
    WHERE we.id = execution_id AND is_member_of_org(we.organization_id)
  ));

-- Workflow Queue Policies
CREATE POLICY "Users can view their org queue items"
  ON public.workflow_queue FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can create queue items in their org"
  ON public.workflow_queue FOR INSERT
  WITH CHECK (is_member_of_org(organization_id));

CREATE POLICY "Users can update their org queue items"
  ON public.workflow_queue FOR UPDATE
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can delete their org queue items"
  ON public.workflow_queue FOR DELETE
  USING (is_member_of_org(organization_id));

-- Workflow Variables Policies
CREATE POLICY "Users can view their org variables"
  ON public.workflow_variables FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can manage their org variables"
  ON public.workflow_variables FOR ALL
  USING (is_member_of_org(organization_id));

-- Workflow Schedules Policies
CREATE POLICY "Users can view their org schedules"
  ON public.workflow_schedules FOR SELECT
  USING (is_member_of_org(organization_id));

CREATE POLICY "Users can manage their org schedules"
  ON public.workflow_schedules FOR ALL
  USING (is_member_of_org(organization_id));

-- =============================================
-- TRIGGERS
-- =============================================

-- Update timestamps
CREATE TRIGGER update_workflow_templates_updated_at
  BEFORE UPDATE ON public.workflow_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_variables_updated_at
  BEFORE UPDATE ON public.workflow_variables
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_workflow_schedules_updated_at
  BEFORE UPDATE ON public.workflow_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================
-- WORKFLOW TRIGGER FUNCTIONS
-- =============================================

-- Function to queue workflow on matter creation
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_matter_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workflow_queue (
    organization_id, workflow_id, trigger_type, trigger_data, priority
  )
  SELECT 
    NEW.organization_id,
    wt.id,
    'matter_created',
    jsonb_build_object(
      'matter_id', NEW.id,
      'matter_type', NEW.matter_type,
      'ip_type', NEW.ip_type,
      'matter_data', to_jsonb(NEW)
    ),
    5
  FROM public.workflow_templates wt
  WHERE wt.organization_id = NEW.organization_id
    AND wt.trigger_type = 'matter_created'
    AND wt.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue workflow on matter status change
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_matter_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.workflow_queue (
      organization_id, workflow_id, trigger_type, trigger_data, priority
    )
    SELECT 
      NEW.organization_id,
      wt.id,
      'matter_status_changed',
      jsonb_build_object(
        'matter_id', NEW.id,
        'old_status', OLD.status,
        'new_status', NEW.status,
        'matter_data', to_jsonb(NEW)
      ),
      5
    FROM public.workflow_templates wt
    WHERE wt.organization_id = NEW.organization_id
      AND wt.trigger_type = 'matter_status_changed'
      AND wt.is_active = true
      AND (
        wt.trigger_config->>'from_status' IS NULL 
        OR wt.trigger_config->>'from_status' = OLD.status
      )
      AND (
        wt.trigger_config->>'to_status' IS NULL 
        OR wt.trigger_config->>'to_status' = NEW.status
      );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue workflow on deal stage change
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_deal_stage_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.stage_id IS DISTINCT FROM NEW.stage_id THEN
    INSERT INTO public.workflow_queue (
      organization_id, workflow_id, trigger_type, trigger_data, priority
    )
    SELECT 
      NEW.organization_id,
      wt.id,
      'deal_stage_changed',
      jsonb_build_object(
        'deal_id', NEW.id,
        'old_stage_id', OLD.stage_id,
        'new_stage_id', NEW.stage_id,
        'deal_data', to_jsonb(NEW)
      ),
      5
    FROM public.workflow_templates wt
    WHERE wt.organization_id = NEW.organization_id
      AND wt.trigger_type = 'deal_stage_changed'
      AND wt.is_active = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue workflow on contact created
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_contact_created()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workflow_queue (
    organization_id, workflow_id, trigger_type, trigger_data, priority
  )
  SELECT 
    NEW.organization_id,
    wt.id,
    'contact_created',
    jsonb_build_object(
      'contact_id', NEW.id,
      'contact_type', NEW.type,
      'contact_data', to_jsonb(NEW)
    ),
    5
  FROM public.workflow_templates wt
  WHERE wt.organization_id = NEW.organization_id
    AND wt.trigger_type = 'contact_created'
    AND wt.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to queue workflow on spider alert
CREATE OR REPLACE FUNCTION public.trigger_workflow_on_spider_alert()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.workflow_queue (
    organization_id, workflow_id, trigger_type, trigger_data, priority
  )
  SELECT 
    NEW.organization_id,
    wt.id,
    'spider_alert',
    jsonb_build_object(
      'alert_id', NEW.id,
      'alert_type', NEW.alert_type,
      'severity', NEW.severity,
      'alert_data', to_jsonb(NEW)
    ),
    CASE NEW.severity
      WHEN 'critical' THEN 1
      WHEN 'high' THEN 2
      WHEN 'medium' THEN 3
      ELSE 5
    END
  FROM public.workflow_templates wt
  WHERE wt.organization_id = NEW.organization_id
    AND wt.trigger_type = 'spider_alert'
    AND wt.is_active = true;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- =============================================
-- ATTACH TRIGGERS TO TABLES
-- =============================================

CREATE TRIGGER workflow_trigger_matter_created
  AFTER INSERT ON public.matters
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow_on_matter_created();

CREATE TRIGGER workflow_trigger_matter_status
  AFTER UPDATE ON public.matters
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow_on_matter_status_change();

CREATE TRIGGER workflow_trigger_deal_stage
  AFTER UPDATE ON public.deals
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow_on_deal_stage_change();

CREATE TRIGGER workflow_trigger_contact_created
  AFTER INSERT ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow_on_contact_created();

CREATE TRIGGER workflow_trigger_spider_alert
  AFTER INSERT ON public.spider_alerts
  FOR EACH ROW EXECUTE FUNCTION trigger_workflow_on_spider_alert();

-- =============================================
-- HELPER FUNCTIONS
-- =============================================

-- Function to manually trigger a workflow
CREATE OR REPLACE FUNCTION public.trigger_workflow_manually(
  p_workflow_id UUID,
  p_trigger_data JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  v_queue_id UUID;
  v_org_id UUID;
BEGIN
  SELECT organization_id INTO v_org_id
  FROM public.workflow_templates
  WHERE id = p_workflow_id AND is_active = true;
  
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'Workflow not found or inactive';
  END IF;
  
  INSERT INTO public.workflow_queue (
    organization_id, workflow_id, trigger_type, trigger_data, priority
  ) VALUES (
    v_org_id, p_workflow_id, 'manual', p_trigger_data, 1
  ) RETURNING id INTO v_queue_id;
  
  RETURN v_queue_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to get workflow execution stats
CREATE OR REPLACE FUNCTION public.get_workflow_stats(
  p_organization_id UUID,
  p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
  total_executions BIGINT,
  successful BIGINT,
  failed BIGINT,
  pending BIGINT,
  avg_duration_ms NUMERIC,
  by_workflow JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::BIGINT as total_executions,
    COUNT(*) FILTER (WHERE we.status = 'completed')::BIGINT as successful,
    COUNT(*) FILTER (WHERE we.status = 'failed')::BIGINT as failed,
    COUNT(*) FILTER (WHERE we.status IN ('pending', 'running'))::BIGINT as pending,
    AVG(EXTRACT(EPOCH FROM (we.completed_at - we.started_at)) * 1000)::NUMERIC as avg_duration_ms,
    jsonb_agg(jsonb_build_object(
      'workflow_id', we.workflow_id,
      'count', 1
    )) as by_workflow
  FROM public.workflow_executions we
  WHERE we.organization_id = p_organization_id
    AND we.created_at > NOW() - (p_days || ' days')::interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;