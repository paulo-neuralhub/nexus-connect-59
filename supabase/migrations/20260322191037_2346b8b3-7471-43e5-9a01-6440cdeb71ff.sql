-- ============================================================
-- COPILOT-PRO-02 Fase 1: Sistema de aprendizaje adaptativo
-- ============================================================

-- BLOQUE 1: Columnas nuevas en copilot_user_preferences
ALTER TABLE copilot_user_preferences
  ADD COLUMN IF NOT EXISTS position_x integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS position_y integer DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS last_greeted_date date DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS bubble_state text DEFAULT 'standby',
  ADD COLUMN IF NOT EXISTS learning_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS suggestions_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS suggestion_confidence_threshold numeric(3,2) DEFAULT 0.70,
  ADD COLUMN IF NOT EXISTS greeting_enabled boolean DEFAULT true;

CREATE OR REPLACE FUNCTION validate_bubble_state()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.bubble_state IS NOT NULL AND NEW.bubble_state NOT IN (
    'standby','attentive','speaking','urgent','guide','hidden'
  ) THEN
    RAISE EXCEPTION 'Invalid bubble_state: %', NEW.bubble_state;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_bubble_state ON copilot_user_preferences;
CREATE TRIGGER trg_validate_bubble_state
  BEFORE INSERT OR UPDATE ON copilot_user_preferences
  FOR EACH ROW EXECUTE FUNCTION validate_bubble_state();

-- BLOQUE 2: copilot_context_events
CREATE TABLE IF NOT EXISTS copilot_context_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  event_type text NOT NULL,
  page_url text,
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  invoice_id uuid REFERENCES invoices(id),
  suggestion_id uuid,
  event_data jsonb DEFAULT '{}',
  session_id text,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_cce_event_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.event_type NOT IN (
    'page_view','matter_opened','deadline_viewed',
    'alert_viewed','email_sent','document_approved',
    'document_generated','suggestion_shown',
    'suggestion_acted','suggestion_dismissed',
    'search_performed','filter_applied',
    'matter_status_changed','spider_alert_viewed',
    'invoice_viewed','client_opened','briefing_read',
    'guide_started','guide_completed','guide_dismissed'
  ) THEN
    RAISE EXCEPTION 'Invalid event_type: %', NEW.event_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cce_event_type ON copilot_context_events;
CREATE TRIGGER trg_validate_cce_event_type
  BEFORE INSERT ON copilot_context_events
  FOR EACH ROW EXECUTE FUNCTION validate_cce_event_type();

CREATE INDEX IF NOT EXISTS idx_cce_user_date ON copilot_context_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cce_org_type ON copilot_context_events(organization_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cce_session ON copilot_context_events(session_id, created_at ASC) WHERE session_id IS NOT NULL;

-- BLOQUE 3: copilot_user_patterns
CREATE TABLE IF NOT EXISTS copilot_user_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  pattern_type text NOT NULL,
  pattern_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric(3,2) DEFAULT 0.50,
  sample_size integer DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id, pattern_type)
);

CREATE OR REPLACE FUNCTION validate_cup_pattern_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pattern_type NOT IN (
    'writing_style','work_schedule','priority_behavior',
    'communication_preference','decision_tendency',
    'tool_preference','response_speed'
  ) THEN
    RAISE EXCEPTION 'Invalid pattern_type: %', NEW.pattern_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cup ON copilot_user_patterns;
CREATE TRIGGER trg_validate_cup
  BEFORE INSERT OR UPDATE ON copilot_user_patterns
  FOR EACH ROW EXECUTE FUNCTION validate_cup_pattern_type();

CREATE INDEX IF NOT EXISTS idx_cup_user ON copilot_user_patterns(user_id, pattern_type);

-- BLOQUE 4: copilot_org_patterns (NO tiene user_id)
CREATE TABLE IF NOT EXISTS copilot_org_patterns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  pattern_type text NOT NULL,
  pattern_data jsonb NOT NULL DEFAULT '{}',
  confidence_score numeric(3,2) DEFAULT 0.50,
  sample_size integer DEFAULT 0,
  last_updated_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, pattern_type)
);

CREATE OR REPLACE FUNCTION validate_cop_pattern_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.pattern_type NOT IN (
    'opposition_threshold','renewal_timing',
    'jurisdiction_preference','response_time_oa',
    'billing_behavior','client_communication_style',
    'matter_abandonment_rate','specialty_areas'
  ) THEN
    RAISE EXCEPTION 'Invalid pattern_type: %', NEW.pattern_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cop ON copilot_org_patterns;
CREATE TRIGGER trg_validate_cop
  BEFORE INSERT OR UPDATE ON copilot_org_patterns
  FOR EACH ROW EXECUTE FUNCTION validate_cop_pattern_type();

CREATE INDEX IF NOT EXISTS idx_cop_org ON copilot_org_patterns(organization_id, pattern_type);

-- BLOQUE 5: copilot_suggestions
CREATE TABLE IF NOT EXISTS copilot_suggestions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  suggestion_type text NOT NULL,
  title text NOT NULL,
  body text NOT NULL,
  action_primary_label text,
  action_primary_url text,
  action_secondary_label text,
  action_secondary_url text,
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  trigger_source text,
  trigger_source_id uuid,
  confidence_score numeric(3,2) DEFAULT 0.70,
  shown_at timestamptz,
  acted_at timestamptz,
  dismissed_at timestamptz,
  action_taken text,
  expires_at timestamptz DEFAULT now() + interval '48 hours',
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_cs_types()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.suggestion_type NOT IN (
    'deadline_warning','opposition_recommend','renewal_recommend',
    'document_offer','client_followup','spider_action',
    'billing_reminder','portal_invite','matter_dormant',
    'style_match_offer','pattern_insight'
  ) THEN
    RAISE EXCEPTION 'Invalid suggestion_type: %', NEW.suggestion_type;
  END IF;
  IF NEW.trigger_source IS NOT NULL AND NEW.trigger_source NOT IN (
    'page_context','cron_learn','spider_alert',
    'deadline_check','invoice_check','pattern_match'
  ) THEN
    RAISE EXCEPTION 'Invalid trigger_source: %', NEW.trigger_source;
  END IF;
  IF NEW.action_taken IS NOT NULL AND NEW.action_taken NOT IN (
    'primary','secondary','dismissed','expired','ignored'
  ) THEN
    RAISE EXCEPTION 'Invalid action_taken: %', NEW.action_taken;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cs ON copilot_suggestions;
CREATE TRIGGER trg_validate_cs
  BEFORE INSERT OR UPDATE ON copilot_suggestions
  FOR EACH ROW EXECUTE FUNCTION validate_cs_types();

CREATE INDEX IF NOT EXISTS idx_cs_user_active ON copilot_suggestions(user_id, created_at DESC) WHERE acted_at IS NULL AND dismissed_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_cs_expires ON copilot_suggestions(expires_at) WHERE acted_at IS NULL AND dismissed_at IS NULL;

-- BLOQUE 6: copilot_decision_log
CREATE TABLE IF NOT EXISTS copilot_decision_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  decision_type text NOT NULL,
  context_snapshot jsonb NOT NULL DEFAULT '{}',
  matter_id uuid REFERENCES matters(id),
  crm_account_id uuid REFERENCES crm_accounts(id),
  matter_type text,
  jurisdiction_code text,
  similarity_score numeric(3,2),
  was_suggested_by_copilot boolean DEFAULT false,
  copilot_suggestion_id uuid REFERENCES copilot_suggestions(id),
  copilot_confidence_at_time numeric(3,2),
  outcome text,
  outcome_updated_at timestamptz,
  created_at timestamptz DEFAULT now()
);

CREATE OR REPLACE FUNCTION validate_cdl_types()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.decision_type NOT IN (
    'oppose','not_oppose','renew_early','renew_standard','abandon',
    'escalate','negotiate','send_payment_reminder','waive_fee',
    'file_divisional','file_continuation',
    'accept_oa_response','reject_oa_response',
    'portal_invite','portal_not_invite',
    'document_approved','document_rejected'
  ) THEN
    RAISE EXCEPTION 'Invalid decision_type: %', NEW.decision_type;
  END IF;
  IF NEW.outcome IS NOT NULL AND NEW.outcome NOT IN (
    'positive','negative','neutral','pending'
  ) THEN
    RAISE EXCEPTION 'Invalid outcome: %', NEW.outcome;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cdl ON copilot_decision_log;
CREATE TRIGGER trg_validate_cdl
  BEFORE INSERT OR UPDATE ON copilot_decision_log
  FOR EACH ROW EXECUTE FUNCTION validate_cdl_types();

CREATE INDEX IF NOT EXISTS idx_cdl_org_type ON copilot_decision_log(organization_id, decision_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cdl_user ON copilot_decision_log(user_id, created_at DESC);

-- BLOQUE 7: copilot_writing_memory
CREATE TABLE IF NOT EXISTS copilot_writing_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  context_type text NOT NULL,
  style_profile jsonb NOT NULL DEFAULT '{}',
  sample_count integer DEFAULT 0,
  last_analyzed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id, user_id, context_type)
);

CREATE OR REPLACE FUNCTION validate_cwm_context_type()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.context_type NOT IN (
    'client_email','internal_note','legal_document',
    'whatsapp','oa_response','opposition_brief'
  ) THEN
    RAISE EXCEPTION 'Invalid context_type: %', NEW.context_type;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_cwm ON copilot_writing_memory;
CREATE TRIGGER trg_validate_cwm
  BEFORE INSERT OR UPDATE ON copilot_writing_memory
  FOR EACH ROW EXECUTE FUNCTION validate_cwm_context_type();

-- ============================================================
-- BLOQUE 8: RLS — tables WITH user_id
-- ============================================================
DO $$
DECLARE t text;
BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'copilot_context_events','copilot_user_patterns',
    'copilot_decision_log','copilot_suggestions',
    'copilot_writing_memory'
  ]) LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format(
      'CREATE POLICY "%s_org_read" ON %I
       FOR SELECT USING (organization_id IN (
         SELECT organization_id FROM profiles WHERE id = auth.uid()
       ))', t, t);
    EXECUTE format(
      'CREATE POLICY "%s_self_insert" ON %I
       FOR INSERT WITH CHECK (user_id = auth.uid())', t, t);
  END LOOP;
END $$;

-- copilot_org_patterns: separate RLS (no user_id)
ALTER TABLE copilot_org_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cop_org_read" ON copilot_org_patterns
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "cop_org_insert" ON copilot_org_patterns
  FOR INSERT WITH CHECK (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "cop_org_update" ON copilot_org_patterns
  FOR UPDATE USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

-- Immutable tables: no delete
CREATE POLICY "cce_no_delete" ON copilot_context_events FOR DELETE USING (false);
CREATE POLICY "cdl_no_delete" ON copilot_decision_log FOR DELETE USING (false);

-- User can update own suggestions/patterns/memory
CREATE POLICY "cs_user_update" ON copilot_suggestions FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cup_self_update" ON copilot_user_patterns FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "cwm_self_update" ON copilot_writing_memory FOR UPDATE USING (user_id = auth.uid());