-- FIX 1: updated_at en genius_workflow_runs
ALTER TABLE genius_workflow_runs
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

CREATE OR REPLACE FUNCTION update_workflow_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_workflow_updated
  BEFORE UPDATE ON genius_workflow_runs
  FOR EACH ROW EXECUTE FUNCTION update_workflow_timestamp();

-- FIX 2: Índice vector para búsqueda semántica
CREATE INDEX IF NOT EXISTS idx_gcm_embedding
  ON genius_conversation_memory
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 50);

-- FIX 3: Corregir RLS de genius_agent_performance
DROP POLICY IF EXISTS "gap_service_insert" ON genius_agent_performance;

CREATE POLICY "gap_org_insert" ON genius_agent_performance
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "gap_service_upsert" ON genius_agent_performance
  FOR UPDATE USING (true);

-- FIX 4: Limpieza automática de memorias expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_memories()
RETURNS void AS $$
BEGIN
  DELETE FROM genius_conversation_memory
  WHERE expires_at IS NOT NULL
  AND expires_at < now() - interval '1 hour';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT cron.schedule(
  'cleanup-expired-memories',
  '0 */6 * * *',
  'SELECT cleanup_expired_memories()'
);

-- FIX 5: GDPR — borrado completo por usuario
CREATE OR REPLACE FUNCTION delete_user_ai_data(p_user_id uuid)
RETURNS void AS $$
BEGIN
  DELETE FROM genius_conversation_memory
    WHERE user_id = p_user_id;

  UPDATE genius_workflow_runs
    SET results_json = '{"deleted": true}'::jsonb,
        plan_json = '[]'::jsonb,
        approval_payload = NULL
    WHERE user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;