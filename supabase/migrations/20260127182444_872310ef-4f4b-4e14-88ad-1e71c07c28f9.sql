-- ============================================================
-- AI BRAIN PHASE 2: ROUTING + HEALTH MONITOR
-- ============================================================

-- 1. Add health monitoring columns to ai_providers
ALTER TABLE ai_providers 
ADD COLUMN IF NOT EXISTS error_count_1h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS success_count_1h INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_latency_1h INTEGER,
ADD COLUMN IF NOT EXISTS last_error_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_error_message TEXT,
ADD COLUMN IF NOT EXISTS circuit_open BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS circuit_opened_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS circuit_half_open_at TIMESTAMPTZ;

-- 2. Create health log table
CREATE TABLE IF NOT EXISTS ai_provider_health_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES ai_providers(id) ON DELETE CASCADE,
  checked_at TIMESTAMPTZ DEFAULT NOW(),
  is_healthy BOOLEAN NOT NULL,
  latency_ms INTEGER,
  error_code VARCHAR(50),
  error_message TEXT,
  check_type VARCHAR(20) DEFAULT 'execution',
  execution_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_health_log_provider ON ai_provider_health_log(provider_id, checked_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_log_checked ON ai_provider_health_log(checked_at DESC);

-- 3. Enable RLS
ALTER TABLE ai_provider_health_log ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read health logs (backoffice access)
CREATE POLICY "Allow authenticated to read health logs"
  ON ai_provider_health_log
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow service role to insert health logs
CREATE POLICY "Allow service to insert health logs"
  ON ai_provider_health_log
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 4. Function to get task routing with health status
CREATE OR REPLACE FUNCTION get_task_routing(
  p_task_code VARCHAR,
  p_tenant_id UUID DEFAULT NULL
)
RETURNS TABLE (
  task_id UUID,
  task_code VARCHAR,
  primary_model_code VARCHAR,
  primary_provider_code VARCHAR,
  primary_healthy BOOLEAN,
  backup_1_model_code VARCHAR,
  backup_1_provider_code VARCHAR,
  backup_1_healthy BOOLEAN,
  backup_2_model_code VARCHAR,
  backup_2_provider_code VARCHAR,
  backup_2_healthy BOOLEAN,
  temperature DECIMAL,
  max_tokens INTEGER,
  timeout_ms INTEGER
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id::UUID as task_id,
    t.task_code::VARCHAR,
    pm.model_id::VARCHAR as primary_model_code,
    pp.code::VARCHAR as primary_provider_code,
    (pp.health_status = 'healthy' AND COALESCE(pp.circuit_open, FALSE) = FALSE)::BOOLEAN as primary_healthy,
    b1m.model_id::VARCHAR as backup_1_model_code,
    b1p.code::VARCHAR as backup_1_provider_code,
    (b1p.health_status = 'healthy' AND COALESCE(b1p.circuit_open, FALSE) = FALSE)::BOOLEAN as backup_1_healthy,
    b2m.model_id::VARCHAR as backup_2_model_code,
    b2p.code::VARCHAR as backup_2_provider_code,
    (b2p.health_status = 'healthy' AND COALESCE(b2p.circuit_open, FALSE) = FALSE)::BOOLEAN as backup_2_healthy,
    COALESCE(t.temperature, 0.7)::DECIMAL as temperature,
    COALESCE(t.max_tokens, 4096)::INTEGER as max_tokens,
    COALESCE(t.timeout_ms, 30000)::INTEGER as timeout_ms
  FROM ai_task_assignments t
  LEFT JOIN ai_models pm ON pm.id = t.primary_model_id
  LEFT JOIN ai_providers pp ON pp.id = pm.provider_id
  LEFT JOIN ai_models b1m ON b1m.id = t.fallback_1_model_id
  LEFT JOIN ai_providers b1p ON b1p.id = b1m.provider_id
  LEFT JOIN ai_models b2m ON b2m.id = t.fallback_2_model_id
  LEFT JOIN ai_providers b2p ON b2p.id = b2m.provider_id
  WHERE t.task_code = p_task_code
    AND t.is_active = TRUE
  LIMIT 1;
END;
$$;

-- 5. Function to update provider health after execution
CREATE OR REPLACE FUNCTION update_provider_health_after_execution(
  p_provider_code VARCHAR,
  p_success BOOLEAN,
  p_latency_ms INTEGER DEFAULT NULL,
  p_error_code VARCHAR DEFAULT NULL,
  p_error_message TEXT DEFAULT NULL,
  p_execution_id UUID DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_provider_id UUID;
  v_consecutive_failures INTEGER;
BEGIN
  -- Get provider
  SELECT id, consecutive_failures INTO v_provider_id, v_consecutive_failures
  FROM ai_providers WHERE code = p_provider_code;
  
  IF v_provider_id IS NULL THEN RETURN; END IF;
  
  -- Log health check
  INSERT INTO ai_provider_health_log (
    provider_id, is_healthy, latency_ms, error_code, error_message, 
    check_type, execution_id
  ) VALUES (
    v_provider_id, p_success, p_latency_ms, p_error_code, p_error_message,
    'execution', p_execution_id
  );
  
  IF p_success THEN
    -- Success: reset counters
    UPDATE ai_providers SET
      health_status = 'healthy',
      last_health_check_at = NOW(),
      health_latency_ms = p_latency_ms,
      consecutive_failures = 0,
      success_count_1h = COALESCE(success_count_1h, 0) + 1,
      circuit_open = FALSE,
      circuit_opened_at = NULL,
      circuit_half_open_at = NULL
    WHERE id = v_provider_id;
  ELSE
    -- Error: increment counters
    UPDATE ai_providers SET
      last_health_check_at = NOW(),
      consecutive_failures = COALESCE(consecutive_failures, 0) + 1,
      error_count_1h = COALESCE(error_count_1h, 0) + 1,
      last_error_at = NOW(),
      last_error_message = p_error_message,
      -- Circuit breaker: open if 5+ consecutive failures
      health_status = CASE 
        WHEN COALESCE(consecutive_failures, 0) >= 4 THEN 'down'
        WHEN COALESCE(consecutive_failures, 0) >= 1 THEN 'degraded'
        ELSE 'healthy'
      END,
      circuit_open = CASE WHEN COALESCE(consecutive_failures, 0) >= 4 THEN TRUE ELSE circuit_open END,
      circuit_opened_at = CASE 
        WHEN COALESCE(consecutive_failures, 0) >= 4 AND COALESCE(circuit_open, FALSE) = FALSE 
        THEN NOW() 
        ELSE circuit_opened_at 
      END
    WHERE id = v_provider_id;
  END IF;
END;
$$;

-- 6. Function to select best model for task
CREATE OR REPLACE FUNCTION select_model_for_task(
  p_task_code VARCHAR,
  p_tenant_id UUID DEFAULT NULL,
  p_requires_vision BOOLEAN DEFAULT FALSE,
  p_requires_tools BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
  selected_model_id UUID,
  selected_model_code VARCHAR,
  selected_provider_code VARCHAR,
  is_fallback BOOLEAN,
  fallback_reason VARCHAR,
  temperature DECIMAL,
  max_tokens INTEGER,
  timeout_ms INTEGER
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_routing RECORD;
BEGIN
  -- Get routing config
  SELECT * INTO v_routing FROM get_task_routing(p_task_code, p_tenant_id);
  
  IF v_routing IS NULL THEN
    RETURN;
  END IF;
  
  -- Try primary model
  IF v_routing.primary_healthy = TRUE THEN
    RETURN QUERY SELECT 
      (SELECT id FROM ai_models WHERE model_id = v_routing.primary_model_code LIMIT 1)::UUID,
      v_routing.primary_model_code::VARCHAR,
      v_routing.primary_provider_code::VARCHAR,
      FALSE::BOOLEAN as is_fallback,
      NULL::VARCHAR as fallback_reason,
      v_routing.temperature,
      v_routing.max_tokens,
      v_routing.timeout_ms;
    RETURN;
  END IF;
  
  -- Try backup 1
  IF v_routing.backup_1_healthy = TRUE AND v_routing.backup_1_model_code IS NOT NULL THEN
    RETURN QUERY SELECT 
      (SELECT id FROM ai_models WHERE model_id = v_routing.backup_1_model_code LIMIT 1)::UUID,
      v_routing.backup_1_model_code::VARCHAR,
      v_routing.backup_1_provider_code::VARCHAR,
      TRUE::BOOLEAN as is_fallback,
      'primary_unhealthy'::VARCHAR as fallback_reason,
      v_routing.temperature,
      v_routing.max_tokens,
      v_routing.timeout_ms;
    RETURN;
  END IF;
  
  -- Try backup 2
  IF v_routing.backup_2_healthy = TRUE AND v_routing.backup_2_model_code IS NOT NULL THEN
    RETURN QUERY SELECT 
      (SELECT id FROM ai_models WHERE model_id = v_routing.backup_2_model_code LIMIT 1)::UUID,
      v_routing.backup_2_model_code::VARCHAR,
      v_routing.backup_2_provider_code::VARCHAR,
      TRUE::BOOLEAN as is_fallback,
      'backups_exhausted'::VARCHAR as fallback_reason,
      v_routing.temperature,
      v_routing.max_tokens,
      v_routing.timeout_ms;
    RETURN;
  END IF;
  
  -- No healthy options, return primary anyway
  RETURN QUERY SELECT 
    (SELECT id FROM ai_models WHERE model_id = v_routing.primary_model_code LIMIT 1)::UUID,
    v_routing.primary_model_code::VARCHAR,
    v_routing.primary_provider_code::VARCHAR,
    FALSE::BOOLEAN as is_fallback,
    'no_healthy_options'::VARCHAR as fallback_reason,
    v_routing.temperature,
    v_routing.max_tokens,
    v_routing.timeout_ms;
END;
$$;

-- 7. Function to reset provider health counters (hourly cleanup)
CREATE OR REPLACE FUNCTION reset_provider_hourly_counters()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_providers SET
    error_count_1h = 0,
    success_count_1h = 0,
    avg_latency_1h = NULL;
    
  -- Cleanup old health logs (keep 24 hours)
  DELETE FROM ai_provider_health_log 
  WHERE checked_at < NOW() - INTERVAL '24 hours';
END;
$$;

-- 8. Function to toggle circuit breaker
CREATE OR REPLACE FUNCTION toggle_circuit_breaker(
  p_provider_id UUID,
  p_open BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_providers SET
    circuit_open = p_open,
    circuit_opened_at = CASE WHEN p_open THEN NOW() ELSE NULL END,
    circuit_half_open_at = NULL,
    health_status = CASE WHEN p_open THEN 'down' ELSE 'unknown' END
  WHERE id = p_provider_id;
END;
$$;

-- 9. Function to reset provider health
CREATE OR REPLACE FUNCTION reset_provider_health(p_provider_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE ai_providers SET
    health_status = 'unknown',
    consecutive_failures = 0,
    error_count_1h = 0,
    success_count_1h = 0,
    avg_latency_1h = NULL,
    circuit_open = FALSE,
    circuit_opened_at = NULL,
    circuit_half_open_at = NULL,
    last_error_at = NULL,
    last_error_message = NULL
  WHERE id = p_provider_id;
END;
$$;