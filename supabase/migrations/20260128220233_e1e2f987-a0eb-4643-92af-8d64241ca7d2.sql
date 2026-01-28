-- PASO 1: Modificar tabla pipelines
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS code VARCHAR(50);
ALTER TABLE pipelines ADD COLUMN IF NOT EXISTS entity_type VARCHAR(20) DEFAULT 'lead';

-- PASO 2: Modificar tabla crm_leads
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS pipeline_id UUID REFERENCES pipelines(id);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES pipeline_stages(id);
ALTER TABLE crm_leads ADD COLUMN IF NOT EXISTS title VARCHAR(255);

-- Crear índices para crm_leads
CREATE INDEX IF NOT EXISTS idx_crm_leads_pipeline ON crm_leads(pipeline_id);
CREATE INDEX IF NOT EXISTS idx_crm_leads_stage ON crm_leads(stage_id);

-- Copiar contact_name a title si title está vacío
UPDATE crm_leads SET title = contact_name WHERE title IS NULL AND contact_name IS NOT NULL;

-- Actualizar pipelines existentes con code y entity_type
UPDATE pipelines SET code = 'leads', entity_type = 'lead' 
WHERE name ILIKE '%lead%' AND code IS NULL;

UPDATE pipelines SET code = 'deals', entity_type = 'deal' 
WHERE name ILIKE '%negociaci%' AND code IS NULL;

-- Para cualquier otro pipeline sin código, asignar uno basado en el nombre
UPDATE pipelines SET code = LOWER(REPLACE(name, ' ', '_')), entity_type = 'lead'
WHERE code IS NULL;