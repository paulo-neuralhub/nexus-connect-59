-- =====================================================
-- MIGRACIÓN: Activar plan Enterprise para Meridian IP Demo
-- =====================================================

-- 1. Actualizar plan de la organización a enterprise
UPDATE organizations 
SET 
  plan = 'enterprise',
  status = 'active',
  updated_at = NOW()
WHERE id = 'd0000001-0000-0000-0000-000000000001';

-- 2. Eliminar licencias existentes (si hay)
DELETE FROM organization_module_licenses 
WHERE organization_id = 'd0000001-0000-0000-0000-000000000001';

-- 3. Crear licencias enterprise para TODOS los módulos activos
INSERT INTO organization_module_licenses (
  id,
  organization_id,
  module_id,
  tier_code,
  license_type,
  status,
  starts_at,
  expires_at,
  limits_override,
  created_at
)
SELECT 
  gen_random_uuid(),
  'd0000001-0000-0000-0000-000000000001',
  pm.id,
  'enterprise',
  'included',
  'active',
  '2025-01-01'::timestamptz,
  '2026-12-31'::timestamptz,
  '{"unlimited": true}'::jsonb,
  NOW()
FROM platform_modules pm
WHERE pm.is_active = true;