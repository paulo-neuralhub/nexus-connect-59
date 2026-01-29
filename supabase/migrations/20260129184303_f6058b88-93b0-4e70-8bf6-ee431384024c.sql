-- Añadir columnas a matters para tracking de workflow
ALTER TABLE matters ADD COLUMN IF NOT EXISTS current_phase VARCHAR(10) DEFAULT 'F0';
ALTER TABLE matters ADD COLUMN IF NOT EXISTS phase_started_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE matters ADD COLUMN IF NOT EXISTS phase_history JSONB DEFAULT '[]';

-- Insertar las 10 fases si workflow_phases está vacía:
INSERT INTO workflow_phases (code, name, description, position, color, icon) 
SELECT * FROM (VALUES
  ('F0', 'Apertura', 'Crear expediente, asignar responsable', 0, 'gray', 'folder-open'),
  ('F1', 'Encargo', 'Conflictos, carta encargo, presupuesto, poderes', 1, 'blue', 'file-signature'),
  ('F2', 'Estrategia', 'Alcance, plan, riesgos', 2, 'purple', 'target'),
  ('F3', 'Inputs', 'Recolección documentos, evidencias', 3, 'cyan', 'upload'),
  ('F4', 'Preparación', 'Redacción técnica/legal', 4, 'amber', 'edit'),
  ('F5', 'Aprobación', 'Revisión, QA, firma cliente', 5, 'orange', 'check-circle'),
  ('F6', 'Ejecución', 'Filing, presentación', 6, 'indigo', 'send'),
  ('F7', 'Tramitación', 'Requerimientos, oposiciones, plazos', 7, 'pink', 'clock'),
  ('F8', 'Resolución', 'Concesión, denegación, acuerdo', 8, 'emerald', 'gavel'),
  ('F9', 'Post-servicio', 'Renovaciones, vigilancia, archivo', 9, 'slate', 'archive')
) AS v(code, name, description, position, color, icon)
WHERE NOT EXISTS (SELECT 1 FROM workflow_phases LIMIT 1);