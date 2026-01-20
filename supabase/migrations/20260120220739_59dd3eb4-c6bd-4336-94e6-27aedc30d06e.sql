-- =====================================================
-- DOCKET DEADLINE ENGINE - PROMPT 52
-- =====================================================

-- 1. DEADLINE RULES - Reglas maestras de plazos por jurisdicción
CREATE TABLE IF NOT EXISTS public.deadline_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  jurisdiction TEXT NOT NULL,
  matter_type TEXT NOT NULL,
  event_type TEXT NOT NULL,
  
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  
  days_from_event INTEGER NOT NULL,
  calendar_type TEXT DEFAULT 'calendar' CHECK (calendar_type IN ('calendar', 'business', 'office')),
  
  conditions JSONB DEFAULT '{}',
  
  creates_deadline BOOLEAN DEFAULT true,
  deadline_type TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  auto_create_task BOOLEAN DEFAULT false,
  task_template_id UUID,
  
  alert_days INTEGER[] DEFAULT ARRAY[30, 15, 7, 1],
  
  is_active BOOLEAN DEFAULT true,
  
  source TEXT,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadline_rules_jurisdiction ON deadline_rules(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_deadline_rules_matter_type ON deadline_rules(matter_type);
CREATE INDEX IF NOT EXISTS idx_deadline_rules_event ON deadline_rules(event_type);
CREATE INDEX IF NOT EXISTS idx_deadline_rules_active ON deadline_rules(is_active) WHERE is_active = true;

-- 2. MATTER DEADLINES
CREATE TABLE IF NOT EXISTS public.matter_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  
  rule_id UUID REFERENCES deadline_rules(id),
  rule_code TEXT,
  
  deadline_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  
  trigger_date DATE NOT NULL,
  deadline_date DATE NOT NULL,
  original_deadline DATE,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'upcoming', 'urgent', 'overdue', 
    'completed', 'extended', 'waived', 'cancelled'
  )),
  
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
  
  completed_at TIMESTAMPTZ,
  completed_by UUID REFERENCES users(id),
  completion_notes TEXT,
  
  extension_count INTEGER DEFAULT 0,
  extension_reason TEXT,
  extended_by UUID REFERENCES users(id),
  
  task_id UUID,
  
  alerts_sent JSONB DEFAULT '{}',
  next_alert_date DATE,
  
  google_event_id TEXT,
  outlook_event_id TEXT,
  
  metadata JSONB DEFAULT '{}',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_matter_deadlines_org ON matter_deadlines(organization_id);
CREATE INDEX IF NOT EXISTS idx_matter_deadlines_matter ON matter_deadlines(matter_id);
CREATE INDEX IF NOT EXISTS idx_matter_deadlines_date ON matter_deadlines(deadline_date);
CREATE INDEX IF NOT EXISTS idx_matter_deadlines_status ON matter_deadlines(status);
CREATE INDEX IF NOT EXISTS idx_matter_deadlines_pending ON matter_deadlines(organization_id, deadline_date) 
  WHERE status IN ('pending', 'upcoming', 'urgent');

-- 3. OFFICE HOLIDAYS
CREATE TABLE IF NOT EXISTS public.office_holidays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  jurisdiction TEXT NOT NULL,
  office_code TEXT,
  
  holiday_date DATE NOT NULL,
  name TEXT NOT NULL,
  
  holiday_type TEXT DEFAULT 'public' CHECK (holiday_type IN ('public', 'office', 'regional')),
  
  is_recurring BOOLEAN DEFAULT false,
  recurrence_pattern TEXT,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_holidays_jurisdiction ON office_holidays(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_holidays_date ON office_holidays(holiday_date);

-- 4. DEADLINE ALERTS
CREATE TABLE IF NOT EXISTS public.deadline_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  deadline_id UUID NOT NULL REFERENCES matter_deadlines(id) ON DELETE CASCADE,
  
  alert_type TEXT NOT NULL CHECK (alert_type IN (
    'days_30', 'days_15', 'days_7', 'days_1', 
    'overdue', 'custom', 'escalation'
  )),
  
  channel TEXT NOT NULL CHECK (channel IN ('email', 'in_app', 'push', 'sms')),
  recipient_id UUID REFERENCES users(id),
  recipient_email TEXT,
  
  status TEXT DEFAULT 'pending' CHECK (status IN (
    'pending', 'sent', 'delivered', 'failed', 'read'
  )),
  
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  error_message TEXT,
  
  subject TEXT,
  body TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deadline_alerts_deadline ON deadline_alerts(deadline_id);
CREATE INDEX IF NOT EXISTS idx_deadline_alerts_org ON deadline_alerts(organization_id);
CREATE INDEX IF NOT EXISTS idx_deadline_alerts_status ON deadline_alerts(status) WHERE status = 'pending';

-- 5. CALENDAR INTEGRATIONS
CREATE TABLE IF NOT EXISTS public.calendar_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  
  provider TEXT NOT NULL CHECK (provider IN ('google', 'outlook', 'apple')),
  
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expires_at TIMESTAMPTZ,
  
  calendar_id TEXT,
  calendar_name TEXT,
  
  sync_enabled BOOLEAN DEFAULT true,
  sync_direction TEXT DEFAULT 'push' CHECK (sync_direction IN ('push', 'pull', 'bidirectional')),
  last_sync_at TIMESTAMPTZ,
  sync_errors JSONB DEFAULT '[]',
  
  sync_deadlines BOOLEAN DEFAULT true,
  sync_tasks BOOLEAN DEFAULT false,
  sync_hearings BOOLEAN DEFAULT true,
  
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(user_id, provider)
);

CREATE INDEX IF NOT EXISTS idx_calendar_integrations_user ON calendar_integrations(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_integrations_org ON calendar_integrations(organization_id);

-- 6. Enable RLS
ALTER TABLE deadline_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE matter_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE office_holidays ENABLE ROW LEVEL SECURITY;
ALTER TABLE deadline_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_integrations ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies

CREATE POLICY "Anyone can read active deadline rules"
ON deadline_rules FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view their org deadlines"
ON matter_deadlines FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their org deadlines"
ON matter_deadlines FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can update their org deadlines"
ON matter_deadlines FOR UPDATE
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can delete their org deadlines"
ON matter_deadlines FOR DELETE
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Anyone can read holidays"
ON office_holidays FOR SELECT
USING (is_active = true);

CREATE POLICY "Users can view their org alerts"
ON deadline_alerts FOR SELECT
USING (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can insert their org alerts"
ON deadline_alerts FOR INSERT
WITH CHECK (organization_id IN (
  SELECT organization_id FROM memberships WHERE user_id = auth.uid()
));

CREATE POLICY "Users can view own calendar integrations"
ON calendar_integrations FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert own calendar integrations"
ON calendar_integrations FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own calendar integrations"
ON calendar_integrations FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete own calendar integrations"
ON calendar_integrations FOR DELETE
USING (user_id = auth.uid());

-- 8. SQL Functions

CREATE OR REPLACE FUNCTION calculate_deadline_date(
  p_start_date DATE,
  p_days INTEGER,
  p_calendar_type TEXT,
  p_jurisdiction TEXT DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
  v_result_date DATE;
  v_days_added INTEGER := 0;
  v_current_date DATE;
BEGIN
  IF p_calendar_type = 'calendar' THEN
    v_result_date := p_start_date + p_days;
  ELSE
    v_current_date := p_start_date;
    
    WHILE v_days_added < p_days LOOP
      v_current_date := v_current_date + 1;
      
      IF EXTRACT(DOW FROM v_current_date) NOT IN (0, 6) THEN
        IF NOT EXISTS (
          SELECT 1 FROM office_holidays 
          WHERE holiday_date = v_current_date
            AND jurisdiction = COALESCE(p_jurisdiction, jurisdiction)
            AND is_active = true
        ) THEN
          v_days_added := v_days_added + 1;
        END IF;
      END IF;
    END LOOP;
    
    v_result_date := v_current_date;
  END IF;
  
  IF EXTRACT(DOW FROM v_result_date) = 0 THEN
    v_result_date := v_result_date + 1;
  ELSIF EXTRACT(DOW FROM v_result_date) = 6 THEN
    v_result_date := v_result_date + 2;
  END IF;
  
  WHILE EXISTS (
    SELECT 1 FROM office_holidays 
    WHERE holiday_date = v_result_date
      AND jurisdiction = COALESCE(p_jurisdiction, jurisdiction)
      AND is_active = true
  ) LOOP
    v_result_date := v_result_date + 1;
  END LOOP;
  
  RETURN v_result_date;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION update_deadline_statuses() RETURNS INTEGER AS $$
DECLARE
  v_updated INTEGER := 0;
BEGIN
  UPDATE matter_deadlines
  SET status = 'upcoming', updated_at = NOW()
  WHERE status = 'pending'
    AND deadline_date <= CURRENT_DATE + 30
    AND deadline_date > CURRENT_DATE + 7;
  
  GET DIAGNOSTICS v_updated = ROW_COUNT;
  
  UPDATE matter_deadlines
  SET status = 'urgent', updated_at = NOW()
  WHERE status IN ('pending', 'upcoming')
    AND deadline_date <= CURRENT_DATE + 7
    AND deadline_date > CURRENT_DATE;
  
  UPDATE matter_deadlines
  SET status = 'overdue', updated_at = NOW()
  WHERE status IN ('pending', 'upcoming', 'urgent')
    AND deadline_date < CURRENT_DATE;
  
  RETURN v_updated;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_deadline_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_matter_deadlines_updated_at ON matter_deadlines;
CREATE TRIGGER trigger_matter_deadlines_updated_at
BEFORE UPDATE ON matter_deadlines
FOR EACH ROW EXECUTE FUNCTION update_deadline_updated_at();

DROP TRIGGER IF EXISTS trigger_calendar_integrations_updated_at ON calendar_integrations;
CREATE TRIGGER trigger_calendar_integrations_updated_at
BEFORE UPDATE ON calendar_integrations
FOR EACH ROW EXECUTE FUNCTION update_deadline_updated_at();