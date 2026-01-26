-- Añadir licencia de Marketing a todas las organizaciones demo existentes
INSERT INTO organization_module_licenses (
  organization_id,
  module_id,
  tier_code,
  license_type,
  status
)
SELECT 
  o.id,
  'f667a400-cc6d-495e-9a46-1dbd04ba842e'::uuid, -- marketing module id
  'pro',
  'included',
  'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id 
  AND oml.module_id = 'f667a400-cc6d-495e-9a46-1dbd04ba842e'::uuid
);

-- También añadir otros módulos core que faltan (docket, crm, spider, genius, finance)
INSERT INTO organization_module_licenses (organization_id, module_id, tier_code, license_type, status)
SELECT o.id, '12e79249-b9b3-4712-8b22-d15c705cb254'::uuid, 'pro', 'included', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id AND oml.module_id = '12e79249-b9b3-4712-8b22-d15c705cb254'::uuid
);

INSERT INTO organization_module_licenses (organization_id, module_id, tier_code, license_type, status)
SELECT o.id, '5c979386-1f6e-4cae-98bf-ac82fa7fd9f1'::uuid, 'pro', 'included', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id AND oml.module_id = '5c979386-1f6e-4cae-98bf-ac82fa7fd9f1'::uuid
);

INSERT INTO organization_module_licenses (organization_id, module_id, tier_code, license_type, status)
SELECT o.id, '89c10f15-51ed-423d-af9b-d056663cbf55'::uuid, 'pro', 'included', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id AND oml.module_id = '89c10f15-51ed-423d-af9b-d056663cbf55'::uuid
);

INSERT INTO organization_module_licenses (organization_id, module_id, tier_code, license_type, status)
SELECT o.id, '4dc67022-2ee5-4d7a-9a3f-8adbb9e42047'::uuid, 'pro', 'included', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id AND oml.module_id = '4dc67022-2ee5-4d7a-9a3f-8adbb9e42047'::uuid
);

INSERT INTO organization_module_licenses (organization_id, module_id, tier_code, license_type, status)
SELECT o.id, '85e007ca-dd61-46df-931c-b13b939542a7'::uuid, 'pro', 'included', 'active'
FROM organizations o
WHERE NOT EXISTS (
  SELECT 1 FROM organization_module_licenses oml 
  WHERE oml.organization_id = o.id AND oml.module_id = '85e007ca-dd61-46df-931c-b13b939542a7'::uuid
);