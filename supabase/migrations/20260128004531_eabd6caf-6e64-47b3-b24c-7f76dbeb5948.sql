
-- Add Market module license to Enterprise demo organization
INSERT INTO organization_module_licenses (
  organization_id,
  module_id,
  license_type,
  tier_code,
  starts_at,
  status
) VALUES (
  'a1000000-0000-0000-0000-000000000001',
  'e324cc6e-e66e-4d3a-91fa-a579b9078a6b',
  'included',
  'enterprise',
  NOW(),
  'active'
) ON CONFLICT (organization_id, module_id) 
DO UPDATE SET 
  status = 'active',
  license_type = 'included',
  tier_code = 'enterprise',
  updated_at = NOW();
