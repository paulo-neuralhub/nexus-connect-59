-- =============================================================
-- STABILITY-02C PASO 2-4: Plan Enterprise + CRM Accounts completos
-- (Sin usuarios ficticios - no se pueden crear sin auth.users)
-- =============================================================

-- PASO 2A: Plan Enterprise en organizations
UPDATE organizations 
SET plan = 'enterprise'
WHERE id = 'd0000001-0000-0000-0000-000000000001';

-- PASO 4: Actualizar crm_accounts existentes con datos completos
-- (Sin assigned_to porque no podemos crear usuarios ficticios)

-- GreenPower Energías
UPDATE crm_accounts SET 
  legal_name = 'GreenPower Energías S.L.', 
  tax_id = 'B-99887766', tax_id_type = 'CIF', tax_country = 'ES',
  tier = 'gold', industry = 'Energía Renovable',
  email = 'info@greenpower-energy.es', phone = '+34 91 555 0200', website = 'www.greenpower-energy.es',
  address_line1 = 'Paseo de la Castellana 100', city = 'Madrid', state_province = 'Madrid', postal_code = '28046', country = 'España',
  notes = 'Cliente principal. 5 expedientes activos. Vigilancia intensiva.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f' -- Tu usuario real
WHERE id = 'a0000001-0006-0000-0000-000000000001';

-- TechFlow Solutions
UPDATE crm_accounts SET 
  legal_name = 'TechFlow Solutions S.L.', 
  tax_id = 'B-87654321', tax_id_type = 'CIF', tax_country = 'ES',
  tier = 'gold', industry = 'Tecnología / IA',
  email = 'info@techflow.es', phone = '+34 91 555 0201', website = 'www.techflow.es',
  address_line1 = 'Calle Alcalá 200', city = 'Madrid', state_province = 'Madrid', postal_code = '28028', country = 'España',
  notes = 'Startup IA. 4 expedientes. Vigilancia activa.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f'
WHERE id = 'a0000001-0001-0000-0000-000000000001';

-- Olivar Premium
UPDATE crm_accounts SET 
  legal_name = 'Olivar Premium S.A.', 
  tax_id = 'A-11223344', tax_id_type = 'CIF', tax_country = 'ES',
  tier = 'silver', industry = 'Alimentación / Aceite de oliva',
  email = 'info@olivar-premium.com', phone = '+34 953 555 300', website = 'www.olivar-premium.com',
  address_line1 = 'Carretera de Bailén km 5', city = 'Jaén', state_province = 'Jaén', postal_code = '23001', country = 'España',
  notes = 'Productor aceite oliva premium. 2 expedientes.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f'
WHERE id = 'a0000001-0002-0000-0000-000000000001';

-- Dra. Elena Voss
UPDATE crm_accounts SET 
  legal_name = 'Elena Voss', 
  tax_id = '12345678Z', tax_id_type = 'NIF', tax_country = 'ES',
  tier = 'standard', industry = 'Farmacéutica',
  email = 'elena.voss@gmail.com', phone = '+34 616 555 403',
  address_line1 = 'Calle del Prado 15', city = 'Madrid', state_province = 'Madrid', postal_code = '28014', country = 'España',
  notes = 'Investigadora CSIC. Patente pharma.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f'
WHERE id = 'a0000001-0003-0000-0000-000000000001';

-- NordikHaus GmbH
UPDATE crm_accounts SET 
  legal_name = 'NordikHaus GmbH', 
  tax_id = 'DE123456789', tax_id_type = 'VAT', tax_country = 'DE',
  tier = 'gold', industry = 'Mobiliario / Diseño',
  email = 'legal@nordikhaus.de', phone = '+49 30 555 6789', website = 'www.nordikhaus.de',
  address_line1 = 'Friedrichstraße 123', city = 'Berlín', postal_code = '10117', country = 'Alemania',
  notes = 'Cliente internacional. 2 expedientes (ES+PT). Factura pendiente pago.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f'
WHERE id = 'a0000001-0004-0000-0000-000000000001';

-- Sabores del Mediterráneo
UPDATE crm_accounts SET 
  legal_name = 'Sabores del Mediterráneo S.L.', 
  tax_id = 'B-55667788', tax_id_type = 'CIF', tax_country = 'ES',
  tier = 'silver', industry = 'Hostelería',
  email = 'franquicias@saboresmed.es', phone = '+34 96 555 0500', website = 'www.saboresmed.es',
  address_line1 = 'Av. del Puerto 45', city = 'Valencia', state_province = 'Valencia', postal_code = '46021', country = 'España',
  notes = 'Cadena 12 restaurantes. Plan franquicias.',
  assigned_to = '0090b656-5c9a-445c-91be-34228afb2b0f'
WHERE id = 'a0000001-0005-0000-0000-000000000001';