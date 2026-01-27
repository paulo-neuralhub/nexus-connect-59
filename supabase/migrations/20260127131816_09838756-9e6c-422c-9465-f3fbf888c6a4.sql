-- ============================================================
-- FASE 5: ELIMINAR TABLA PROBLEMÁTICA organization_offices
-- ============================================================
-- Esta tabla permitía erróneamente a los tenants configurar oficinas.
-- Las oficinas IP son gestionadas GLOBALMENTE por IP-NEXUS.
-- El acceso se determina por el plan de suscripción.
-- ============================================================

-- 1. Backup de datos existentes (si hay alguno)
CREATE TABLE IF NOT EXISTS _backup_organization_offices AS 
SELECT * FROM organization_offices;

-- 2. Eliminar la tabla problemática
DROP TABLE IF EXISTS organization_offices CASCADE;

-- 3. Crear tabla de inclusión de oficinas por plan (si no existe)
CREATE TABLE IF NOT EXISTS office_plan_inclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  office_id UUID NOT NULL REFERENCES ipo_offices(id) ON DELETE CASCADE,
  plan VARCHAR(50) NOT NULL, -- starter, professional, business, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(office_id, plan)
);

-- 4. Poblar inclusiones por defecto
INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'starter' 
FROM ipo_offices o 
WHERE o.code IN ('OEPM')
ON CONFLICT (office_id, plan) DO NOTHING;

INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'professional' 
FROM ipo_offices o 
WHERE o.code IN ('OEPM', 'EUIPO')
ON CONFLICT (office_id, plan) DO NOTHING;

INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'basico' 
FROM ipo_offices o 
WHERE o.code IN ('OEPM', 'EUIPO', 'USPTO')
ON CONFLICT (office_id, plan) DO NOTHING;

INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'business' 
FROM ipo_offices o 
WHERE o.code IN ('OEPM', 'EUIPO', 'USPTO', 'WIPO', 'EPO', 'UKIPO')
ON CONFLICT (office_id, plan) DO NOTHING;

INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'enterprise' 
FROM ipo_offices o 
WHERE o.is_active = true
ON CONFLICT (office_id, plan) DO NOTHING;

INSERT INTO office_plan_inclusions (office_id, plan)
SELECT o.id, 'empresarial' 
FROM ipo_offices o 
WHERE o.is_active = true
ON CONFLICT (office_id, plan) DO NOTHING;

-- 5. Función para obtener oficinas con acceso por plan
CREATE OR REPLACE FUNCTION get_offices_with_plan_access(p_plan VARCHAR)
RETURNS TABLE (
  id UUID,
  code VARCHAR,
  name VARCHAR,
  name_short VARCHAR,
  country_code VARCHAR,
  country_name VARCHAR,
  flag_emoji VARCHAR,
  region VARCHAR,
  automation_level CHAR,
  automation_percentage INTEGER,
  operational_status VARCHAR,
  last_sync_at TIMESTAMPTZ,
  has_access BOOLEAN,
  capabilities JSONB
) 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.code::VARCHAR,
    o.name_official::VARCHAR as name,
    o.name_short::VARCHAR,
    o.country_code::VARCHAR,
    o.country_name::VARCHAR,
    o.flag_emoji::VARCHAR,
    o.region::VARCHAR,
    o.automation_level,
    o.automation_percentage,
    o.operational_status::VARCHAR,
    o.last_health_check as last_sync_at,
    EXISTS (
      SELECT 1 FROM office_plan_inclusions opi
      WHERE opi.office_id = o.id
      AND opi.plan = p_plan
    ) as has_access,
    o.capabilities
  FROM ipo_offices o
  WHERE o.is_active = TRUE
  ORDER BY 
    CASE WHEN EXISTS (
      SELECT 1 FROM office_plan_inclusions opi
      WHERE opi.office_id = o.id AND opi.plan = p_plan
    ) THEN 0 ELSE 1 END,
    o.tier NULLS LAST,
    o.region,
    o.country_name;
END;
$$;

-- 6. RLS para office_plan_inclusions (solo lectura pública)
ALTER TABLE office_plan_inclusions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can read office plan inclusions"
ON office_plan_inclusions
FOR SELECT
TO authenticated, anon
USING (true);

-- Solo admins de backoffice pueden modificar (via service role)
CREATE POLICY "Service role can manage office plan inclusions"
ON office_plan_inclusions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- 7. Comentario descriptivo
COMMENT ON TABLE office_plan_inclusions IS 'Define qué oficinas IP están incluidas en cada plan de suscripción. Gestionado globalmente por IP-NEXUS, no por tenants.';
COMMENT ON FUNCTION get_offices_with_plan_access IS 'Retorna todas las oficinas IP con información de si el plan dado tiene acceso a cada una.';