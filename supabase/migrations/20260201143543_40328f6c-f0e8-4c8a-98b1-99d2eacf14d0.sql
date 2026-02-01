-- ════════════════════════════════════════════════════════════════════════════
-- PROMPT 4C: Sistema completo de fases workflow
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- PASO 3: Actualizar workflow_phases con campos adicionales
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE workflow_phases
  ADD COLUMN IF NOT EXISTS sequence INTEGER,
  ADD COLUMN IF NOT EXISTS is_initial BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_terminal BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS allows_editing BOOLEAN DEFAULT true,
  ADD COLUMN IF NOT EXISTS allowed_next_phases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS allowed_prev_phases TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS on_enter_actions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS on_exit_actions JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS entry_validations JSONB DEFAULT '{}';

-- Actualizar las fases existentes con transiciones y comportamiento
UPDATE workflow_phases SET
  sequence = 0, is_initial = true, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F1}', allowed_prev_phases = '{}'
WHERE code = 'F0';

UPDATE workflow_phases SET
  sequence = 1, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F2,F9}', allowed_prev_phases = '{F0}'
WHERE code = 'F1';

UPDATE workflow_phases SET
  sequence = 2, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F3,F9}', allowed_prev_phases = '{F1}'
WHERE code = 'F2';

UPDATE workflow_phases SET
  sequence = 3, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F4,F5,F9}', allowed_prev_phases = '{F2}'
WHERE code = 'F3';

UPDATE workflow_phases SET
  sequence = 4, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F5,F6,F9}', allowed_prev_phases = '{F3}'
WHERE code = 'F4';

UPDATE workflow_phases SET
  sequence = 5, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F6,F7,F9}', allowed_prev_phases = '{F4}'
WHERE code = 'F5';

UPDATE workflow_phases SET
  sequence = 6, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F7,F8}', allowed_prev_phases = '{F5,F4,F3}'
WHERE code = 'F6';

UPDATE workflow_phases SET
  sequence = 7, is_initial = false, is_terminal = false, allows_editing = true,
  allowed_next_phases = '{F8,F9}', allowed_prev_phases = '{F6}'
WHERE code = 'F7';

UPDATE workflow_phases SET
  sequence = 8, is_initial = false, is_terminal = true, allows_editing = false,
  allowed_next_phases = '{F9}', allowed_prev_phases = '{F7,F6}'
WHERE code = 'F8';

UPDATE workflow_phases SET
  sequence = 9, is_initial = false, is_terminal = true, allows_editing = false,
  allowed_next_phases = '{}', allowed_prev_phases = '{F0,F1,F2,F3,F4,F5,F6,F7,F8}'
WHERE code = 'F9';

-- ════════════════════════════════════════════════════════════════════════════
-- PASO 4: Crear/actualizar matter_phase_history
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS matter_phase_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  matter_id UUID NOT NULL REFERENCES matters(id) ON DELETE CASCADE,
  from_phase TEXT,
  to_phase TEXT NOT NULL,
  changed_by UUID REFERENCES auth.users(id),
  changed_at TIMESTAMPTZ DEFAULT now(),
  reason TEXT,
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  time_in_previous_phase INTERVAL
);

-- Añadir columnas si no existen
ALTER TABLE matter_phase_history
  ADD COLUMN IF NOT EXISTS reason TEXT,
  ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS time_in_previous_phase INTERVAL;

-- Índices
CREATE INDEX IF NOT EXISTS idx_mph_matter ON matter_phase_history(matter_id);
CREATE INDEX IF NOT EXISTS idx_mph_to_phase ON matter_phase_history(to_phase);
CREATE INDEX IF NOT EXISTS idx_mph_changed_at ON matter_phase_history(changed_at);

-- RLS
ALTER TABLE matter_phase_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "mph_select" ON matter_phase_history;
CREATE POLICY "mph_select" ON matter_phase_history FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM matters m 
    JOIN memberships mb ON mb.organization_id = m.organization_id
    WHERE m.id = matter_id AND mb.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "mph_insert" ON matter_phase_history;
CREATE POLICY "mph_insert" ON matter_phase_history FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM matters m 
    JOIN memberships mb ON mb.organization_id = m.organization_id
    WHERE m.id = matter_id AND mb.user_id = auth.uid()
  )
);

-- ════════════════════════════════════════════════════════════════════════════
-- PASO 5: Actualizar matters con campos workflow
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE matters
  ADD COLUMN IF NOT EXISTS service_template_id UUID REFERENCES service_templates(id),
  ADD COLUMN IF NOT EXISTS phase_entered_at TIMESTAMPTZ DEFAULT now(),
  ADD COLUMN IF NOT EXISTS previous_phase TEXT,
  ADD COLUMN IF NOT EXISTS target_phase TEXT DEFAULT 'F8',
  ADD COLUMN IF NOT EXISTS workflow_progress INTEGER DEFAULT 0;

-- Índices
CREATE INDEX IF NOT EXISTS idx_matters_template ON matters(service_template_id);
CREATE INDEX IF NOT EXISTS idx_matters_phase_entered ON matters(phase_entered_at);

-- ════════════════════════════════════════════════════════════════════════════
-- FUNCIÓN: Cambiar fase de expediente con validación
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION change_matter_phase(
  p_matter_id UUID,
  p_new_phase TEXT,
  p_reason TEXT DEFAULT NULL,
  p_notes TEXT DEFAULT NULL,
  p_user_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_current_phase TEXT;
  v_phase_entered TIMESTAMPTZ;
  v_time_in_phase INTERVAL;
  v_allowed_next TEXT[];
  v_allowed_prev TEXT[];
  v_result JSONB;
BEGIN
  -- Obtener fase actual
  SELECT current_phase, phase_entered_at INTO v_current_phase, v_phase_entered
  FROM matters WHERE id = p_matter_id;
  
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Matter not found');
  END IF;
  
  -- Si es la misma fase, no hacer nada
  IF v_current_phase = p_new_phase THEN
    RETURN jsonb_build_object('success', true, 'message', 'Already in this phase');
  END IF;
  
  -- Verificar transición permitida (hacia adelante)
  SELECT allowed_next_phases INTO v_allowed_next
  FROM workflow_phases WHERE code = v_current_phase;
  
  -- Verificar transición permitida (hacia atrás)
  SELECT allowed_prev_phases INTO v_allowed_prev
  FROM workflow_phases WHERE code = v_current_phase;
  
  IF v_current_phase IS NOT NULL 
     AND NOT (p_new_phase = ANY(v_allowed_next)) 
     AND NOT (p_new_phase = ANY(v_allowed_prev)) THEN
    RETURN jsonb_build_object(
      'success', false, 
      'error', 'Transition not allowed from ' || v_current_phase || ' to ' || p_new_phase,
      'allowed_next', v_allowed_next,
      'allowed_prev', v_allowed_prev
    );
  END IF;
  
  -- Calcular tiempo en fase anterior
  v_time_in_phase := COALESCE(now() - v_phase_entered, INTERVAL '0');
  
  -- Registrar en historial
  INSERT INTO matter_phase_history (
    matter_id, from_phase, to_phase, changed_by, reason, notes, time_in_previous_phase
  ) VALUES (
    p_matter_id, v_current_phase, p_new_phase, p_user_id, p_reason, p_notes, v_time_in_phase
  );
  
  -- Actualizar matter
  UPDATE matters SET
    previous_phase = current_phase,
    current_phase = p_new_phase,
    phase_entered_at = now(),
    workflow_progress = COALESCE((SELECT sequence * 10 FROM workflow_phases WHERE code = p_new_phase), 0),
    updated_at = now()
  WHERE id = p_matter_id;
  
  RETURN jsonb_build_object(
    'success', true,
    'from_phase', v_current_phase,
    'to_phase', p_new_phase,
    'time_in_previous_phase', extract(epoch from v_time_in_phase)::integer
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inicializar workflow_progress para expedientes existentes
UPDATE matters m SET
  workflow_progress = COALESCE((SELECT sequence * 10 FROM workflow_phases wp WHERE wp.code = m.current_phase), 0)
WHERE workflow_progress IS NULL OR workflow_progress = 0;