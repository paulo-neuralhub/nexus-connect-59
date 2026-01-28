-- Asignar pipeline_id a todos los leads de la organización demo
UPDATE crm_leads 
SET pipeline_id = 'dd0e797d-bf6a-4f16-a2dd-c2b0563040c6'
WHERE organization_id = 'a1000000-0000-0000-0000-000000000001' 
AND pipeline_id IS NULL;

-- Mapear status a stage_id
-- new → Nuevo (6a45a5b5-b825-4be6-8f7d-8ee2cd41d660)
UPDATE crm_leads SET stage_id = '6a45a5b5-b825-4be6-8f7d-8ee2cd41d660' 
WHERE status = 'new' AND stage_id IS NULL;

-- contacted → Contactado (15140588-779a-4bbd-b40d-2d7b65864bfb)
UPDATE crm_leads SET stage_id = '15140588-779a-4bbd-b40d-2d7b65864bfb' 
WHERE status = 'contacted' AND stage_id IS NULL;

-- qualified → Cualificado (091c4ee3-dd6d-482f-876a-49c47bfe746e)
UPDATE crm_leads SET stage_id = '091c4ee3-dd6d-482f-876a-49c47bfe746e' 
WHERE status = 'qualified' AND stage_id IS NULL;

-- proposal → Propuesta (2d53cf06-2b9f-412f-af94-58e39930f452)
UPDATE crm_leads SET stage_id = '2d53cf06-2b9f-412f-af94-58e39930f452' 
WHERE status = 'proposal' AND stage_id IS NULL;

-- standby → Stand By (d1913f6e-95d0-4832-b30e-546cbde5ec4b)
UPDATE crm_leads SET stage_id = 'd1913f6e-95d0-4832-b30e-546cbde5ec4b' 
WHERE status = 'standby' AND stage_id IS NULL;

-- converted/won → Ganado (2c8c2d48-1abd-47d0-8f2b-2c7779783e35)
UPDATE crm_leads SET stage_id = '2c8c2d48-1abd-47d0-8f2b-2c7779783e35' 
WHERE (status = 'converted' OR status = 'won') AND stage_id IS NULL;

-- lost → Perdido (aa75cee1-dd85-45a8-9aa7-1c6270a510a9)
UPDATE crm_leads SET stage_id = 'aa75cee1-dd85-45a8-9aa7-1c6270a510a9' 
WHERE status = 'lost' AND stage_id IS NULL;

-- Cualquier lead restante → primera etapa (Nuevo)
UPDATE crm_leads SET stage_id = '6a45a5b5-b825-4be6-8f7d-8ee2cd41d660' 
WHERE stage_id IS NULL AND pipeline_id IS NOT NULL;