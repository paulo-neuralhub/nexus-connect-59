
-- TABLA 1: genius_workflow_runs
CREATE TABLE IF NOT EXISTS genius_workflow_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  workflow_type text NOT NULL CHECK (workflow_type IN (
    'oa_response','spider_analysis','renewal','portfolio_report',
    'competitor_analysis','new_matter','communication',
    'translation','email_analysis','due_diligence',
    'international_strategy','infringement_analysis',
    'morning_briefing','service_proposal','full_matter_prep'
  )),
  goal_text text NOT NULL,
  matter_id uuid REFERENCES matters(id),
  client_id uuid REFERENCES crm_accounts(id),
  status text NOT NULL DEFAULT 'planning' CHECK (status IN (
    'planning','running','paused','approval_needed',
    'completed','failed','cancelled'
  )),
  plan_json jsonb DEFAULT '[]',
  current_step integer DEFAULT 0,
  total_steps integer DEFAULT 0,
  results_json jsonb DEFAULT '{}',
  approval_payload jsonb DEFAULT NULL,
  approved_by uuid REFERENCES profiles(id),
  approved_at timestamptz,
  error_message text,
  trace_id text UNIQUE DEFAULT gen_random_uuid()::text,
  tokens_by_agent jsonb DEFAULT '{}',
  cost_by_agent jsonb DEFAULT '{}',
  quality_scores jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genius_workflow_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gwr_org_read" ON genius_workflow_runs
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "gwr_user_insert" ON genius_workflow_runs
  FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "gwr_user_update" ON genius_workflow_runs
  FOR UPDATE USING (
    user_id = auth.uid()
    OR organization_id IN (
      SELECT organization_id FROM profiles
      WHERE id = auth.uid() AND role IN ('admin','superadmin')
    )
  );

CREATE INDEX IF NOT EXISTS idx_gwr_active
  ON genius_workflow_runs(organization_id, status)
  WHERE status IN ('planning','running','paused','approval_needed');

CREATE INDEX IF NOT EXISTS idx_gwr_user_date
  ON genius_workflow_runs(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_gwr_matter
  ON genius_workflow_runs(matter_id)
  WHERE matter_id IS NOT NULL;

-- TABLA 2: genius_conversation_memory
CREATE TABLE IF NOT EXISTS genius_conversation_memory (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id),
  user_id uuid NOT NULL REFERENCES profiles(id),
  matter_id uuid REFERENCES matters(id),
  memory_type text NOT NULL CHECK (memory_type IN (
    'short_term','long_term','working'
  )),
  content text NOT NULL,
  embedding vector(1536),
  relevance_score numeric(3,2) DEFAULT 0.80,
  last_accessed timestamptz DEFAULT now(),
  access_count integer DEFAULT 0,
  expires_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE genius_conversation_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gcm_user_all" ON genius_conversation_memory
  FOR ALL USING (user_id = auth.uid());

-- Index WITHOUT now() in predicate (now() is not immutable)
CREATE INDEX IF NOT EXISTS idx_gcm_user_type
  ON genius_conversation_memory(user_id, memory_type, relevance_score DESC);

CREATE INDEX IF NOT EXISTS idx_gcm_matter
  ON genius_conversation_memory(matter_id)
  WHERE matter_id IS NOT NULL;

-- Auto-expirar short_term en 24h via función
CREATE OR REPLACE FUNCTION set_memory_expiry()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.memory_type = 'short_term' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '24 hours';
  END IF;
  IF NEW.memory_type = 'working' AND NEW.expires_at IS NULL THEN
    NEW.expires_at := now() + interval '2 hours';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_memory_expiry
  BEFORE INSERT ON genius_conversation_memory
  FOR EACH ROW EXECUTE FUNCTION set_memory_expiry();

-- TABLA 3: genius_agent_performance
CREATE TABLE IF NOT EXISTS genius_agent_performance (
  organization_id uuid NOT NULL REFERENCES organizations(id),
  agent_type text NOT NULL CHECK (agent_type IN (
    'orchestrator','jurisdiction','dossier','document',
    'competitor','communication','portfolio','evaluator'
  )),
  period_date date NOT NULL DEFAULT CURRENT_DATE,
  calls_count integer DEFAULT 0,
  success_count integer DEFAULT 0,
  error_count integer DEFAULT 0,
  avg_latency_ms integer DEFAULT 0,
  p95_latency_ms integer DEFAULT 0,
  total_tokens integer DEFAULT 0,
  total_cost_eur numeric(10,4) DEFAULT 0,
  circuit_breaker_triggers integer DEFAULT 0,
  PRIMARY KEY (organization_id, agent_type, period_date)
);

ALTER TABLE genius_agent_performance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gap_org_read" ON genius_agent_performance
  FOR SELECT USING (organization_id IN (
    SELECT organization_id FROM profiles WHERE id = auth.uid()
  ));

CREATE POLICY "gap_service_insert" ON genius_agent_performance
  FOR ALL USING (true)
  WITH CHECK (true);

-- Función para actualizar métricas de forma atómica
CREATE OR REPLACE FUNCTION upsert_agent_metric(
  p_org_id uuid,
  p_agent_type text,
  p_success boolean,
  p_latency_ms integer,
  p_tokens integer,
  p_cost_eur numeric
) RETURNS void AS $$
BEGIN
  INSERT INTO genius_agent_performance
    (organization_id, agent_type, period_date,
     calls_count, success_count, error_count,
     avg_latency_ms, total_tokens, total_cost_eur)
  VALUES
    (p_org_id, p_agent_type, CURRENT_DATE,
     1,
     CASE WHEN p_success THEN 1 ELSE 0 END,
     CASE WHEN p_success THEN 0 ELSE 1 END,
     p_latency_ms, p_tokens, p_cost_eur)
  ON CONFLICT (organization_id, agent_type, period_date)
  DO UPDATE SET
    calls_count = genius_agent_performance.calls_count + 1,
    success_count = genius_agent_performance.success_count
      + CASE WHEN p_success THEN 1 ELSE 0 END,
    error_count = genius_agent_performance.error_count
      + CASE WHEN p_success THEN 0 ELSE 1 END,
    avg_latency_ms = (genius_agent_performance.avg_latency_ms
      * genius_agent_performance.calls_count + p_latency_ms)
      / (genius_agent_performance.calls_count + 1),
    total_tokens = genius_agent_performance.total_tokens + p_tokens,
    total_cost_eur = genius_agent_performance.total_cost_eur + p_cost_eur;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
