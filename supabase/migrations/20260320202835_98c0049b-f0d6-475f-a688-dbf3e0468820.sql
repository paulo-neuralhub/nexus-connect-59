
-- ============================================================
-- CRM V2 Phase 1: Seed 3 IP Pipelines + Stages
-- Idempotent: checks existence before inserting
-- ============================================================

DO $$
DECLARE
  v_org_id uuid;
  v_pipe_id uuid;
BEGIN
  -- Loop through all organizations to seed pipelines
  FOR v_org_id IN SELECT id FROM public.organizations
  LOOP

    -- ── Pipeline 1: Nuevos Servicios IP ──
    SELECT id INTO v_pipe_id FROM public.crm_pipelines
      WHERE organization_id = v_org_id AND name = 'Nuevos Servicios IP';

    IF v_pipe_id IS NULL THEN
      INSERT INTO public.crm_pipelines (organization_id, name, description, pipeline_type, is_default, position)
      VALUES (v_org_id, 'Nuevos Servicios IP', 'Pipeline para nuevos mandatos de registro, renovación y defensa', 'ip_services', true, 0)
      RETURNING id INTO v_pipe_id;

      INSERT INTO public.crm_pipeline_stages (pipeline_id, name, color, probability, position, is_won_stage, is_lost_stage) VALUES
        (v_pipe_id, 'Prospecto identificado',  '#94A3B8', 10, 0, false, false),
        (v_pipe_id, 'Briefing de necesidades', '#3B82F6', 25, 1, false, false),
        (v_pipe_id, 'Propuesta enviada',       '#8B5CF6', 50, 2, false, false),
        (v_pipe_id, 'Negociación',             '#F59E0B', 75, 3, false, false),
        (v_pipe_id, 'Mandato firmado',         '#22C55E', 100, 4, true,  false),
        (v_pipe_id, 'Perdido',                 '#EF4444', 0,   5, false, true);
    END IF;

    -- ── Pipeline 2: Renovaciones Proactivas ──
    SELECT id INTO v_pipe_id FROM public.crm_pipelines
      WHERE organization_id = v_org_id AND name = 'Renovaciones Proactivas';

    IF v_pipe_id IS NULL THEN
      INSERT INTO public.crm_pipelines (organization_id, name, description, pipeline_type, is_default, position)
      VALUES (v_org_id, 'Renovaciones Proactivas', 'Gestión proactiva de renovaciones de marcas y patentes próximas', 'renewals', false, 1)
      RETURNING id INTO v_pipe_id;

      INSERT INTO public.crm_pipeline_stages (pipeline_id, name, color, probability, position, is_won_stage, is_lost_stage) VALUES
        (v_pipe_id, 'Renovación identificada',      '#94A3B8', 10, 0, false, false),
        (v_pipe_id, 'Contacto proactivo realizado',  '#3B82F6', 30, 1, false, false),
        (v_pipe_id, 'Presupuesto enviado',           '#F59E0B', 60, 2, false, false),
        (v_pipe_id, 'Renovación confirmada',         '#22C55E', 100, 3, true,  false),
        (v_pipe_id, 'No renovar (abandono)',          '#EF4444', 0,   4, false, true);
    END IF;

    -- ── Pipeline 3: Oposiciones y Litigios ──
    SELECT id INTO v_pipe_id FROM public.crm_pipelines
      WHERE organization_id = v_org_id AND name = 'Oposiciones y Litigios';

    IF v_pipe_id IS NULL THEN
      INSERT INTO public.crm_pipelines (organization_id, name, description, pipeline_type, is_default, position)
      VALUES (v_org_id, 'Oposiciones y Litigios', 'Pipeline para gestión de conflictos y acciones de defensa', 'litigation', false, 2)
      RETURNING id INTO v_pipe_id;

      INSERT INTO public.crm_pipeline_stages (pipeline_id, name, color, probability, position, is_won_stage, is_lost_stage) VALUES
        (v_pipe_id, 'Conflicto detectado',         '#94A3B8', 10, 0, false, false),
        (v_pipe_id, 'Análisis legal realizado',     '#3B82F6', 30, 1, false, false),
        (v_pipe_id, 'Propuesta de acción',          '#8B5CF6', 50, 2, false, false),
        (v_pipe_id, 'Cliente acepta actuar',        '#22C55E', 100, 3, true,  false),
        (v_pipe_id, 'Cliente decide no actuar',     '#EF4444', 0,   4, false, true);
    END IF;

  END LOOP;
END $$;
