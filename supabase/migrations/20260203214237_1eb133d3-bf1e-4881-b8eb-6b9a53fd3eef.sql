-- =============================================================
-- STABILITY-02C PASO 5-7: Contactos, Leads y Deals (UUIDs válidos)
-- =============================================================

-- PASO 5: CRM Contactos (9 personas vinculadas a cuentas)
-- Los contactos ya se insertaron en la migración anterior (cc000001-...)
-- Verificamos si existen, si no los insertamos
INSERT INTO crm_contacts (
  id, organization_id, account_id, 
  full_name, email, phone,
  is_lead, lead_score,
  metadata, created_at, assigned_to
) VALUES
-- GreenPower (2 contactos)
('cc000001-0000-0000-0000-000000000001',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0006-0000-0000-000000000001',
 'Roberto Casas Martínez', 'roberto.casas@greenpower-energy.es', '+34 91 555 0210',
 false, 0,
 '{"job_title": "Director I+D", "is_primary": true, "notes": "Contacto principal."}'::jsonb,
 '2025-02-15', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('cc000001-0000-0000-0000-000000000002',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0006-0000-0000-000000000001',
 'Isabel Fernández López', 'isabel.fernandez@greenpower-energy.es', '+34 91 555 0211',
 false, 0,
 '{"job_title": "CFO", "is_primary": false, "notes": "Responsable facturación."}'::jsonb,
 '2025-02-15', '0090b656-5c9a-445c-91be-34228afb2b0f'),

-- TechFlow (2 contactos)
('cc000001-0000-0000-0000-000000000003',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0001-0000-0000-000000000001',
 'Alejandro Ruiz Martín', 'alejandro.ruiz@techflow.es', '+34 91 555 0201',
 false, 0,
 '{"job_title": "CEO", "is_primary": true, "notes": "Fundador."}'::jsonb,
 '2025-03-10', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('cc000001-0000-0000-0000-000000000004',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0001-0000-0000-000000000001',
 'Marina López García', 'marina.lopez@techflow.es', '+34 91 555 0202',
 false, 0,
 '{"job_title": "CTO", "is_primary": false, "notes": "Responsable técnica."}'::jsonb,
 '2025-03-10', '0090b656-5c9a-445c-91be-34228afb2b0f'),

-- Olivar Premium (1 contacto)
('cc000001-0000-0000-0000-000000000005',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0002-0000-0000-000000000001',
 'Francisco Morales Ruiz', 'fmorales@olivar-premium.com', '+34 953 555 301',
 false, 0,
 '{"job_title": "Director General", "is_primary": true, "notes": "Decisor único."}'::jsonb,
 '2025-04-20', '0090b656-5c9a-445c-91be-34228afb2b0f'),

-- Dra. Elena Voss (1 contacto)
('cc000001-0000-0000-0000-000000000006',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0003-0000-0000-000000000001',
 'Elena Voss', 'elena.voss@gmail.com', '+34 616 555 403',
 false, 0,
 '{"job_title": "Investigadora CSIC", "is_primary": true, "notes": "Patente BioVoss-7."}'::jsonb,
 '2025-05-05', '0090b656-5c9a-445c-91be-34228afb2b0f'),

-- NordikHaus (2 contactos)
('cc000001-0000-0000-0000-000000000007',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0004-0000-0000-000000000001',
 'Klaus Bergmann', 'k.bergmann@nordikhaus.de', '+49 30 555 6790',
 false, 0,
 '{"job_title": "Head of Legal", "is_primary": true, "notes": "Contacto principal Europa."}'::jsonb,
 '2025-06-01', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('cc000001-0000-0000-0000-000000000008',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0004-0000-0000-000000000001',
 'Anna Schneider', 'a.schneider@nordikhaus.de', '+49 30 555 6791',
 false, 0,
 '{"job_title": "Brand Manager", "is_primary": false, "notes": "Marca y comunicación."}'::jsonb,
 '2025-06-01', '0090b656-5c9a-445c-91be-34228afb2b0f'),

-- Sabores del Mediterráneo (1 contacto)
('cc000001-0000-0000-0000-000000000009',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0005-0000-0000-000000000001',
 'Valentina García Serrano', 'vgarcia@saboresmed.es', '+34 96 555 0501',
 false, 0,
 '{"job_title": "Directora Expansión", "is_primary": true, "notes": "Franquicias."}'::jsonb,
 '2025-07-15', '0090b656-5c9a-445c-91be-34228afb2b0f')
ON CONFLICT (id) DO UPDATE SET 
  full_name = EXCLUDED.full_name, 
  account_id = EXCLUDED.account_id;

-- PASO 6: CRM Leads (6 leads) - usando UUIDs válidos (b en vez de l)
DELETE FROM crm_leads WHERE organization_id = 'd0000001-0000-0000-0000-000000000001';

INSERT INTO crm_leads (
  id, organization_id, 
  contact_name, company_name, contact_email, contact_phone,
  source, status, estimated_value,
  notes, created_at
) VALUES
('b0000001-0000-0000-0000-000000000001',
 'd0000001-0000-0000-0000-000000000001',
 'Roberto Casas Martínez', 'GreenPower Energías S.L.', 'roberto.casas@greenpower-energy.es', '+34 91 555 0210',
 'referral', 'converted', 18500.00,
 'Referido evento AEMPI Madrid feb 2025. Convertido a cliente.', '2025-02-10'),

('b0000001-0000-0000-0000-000000000002',
 'd0000001-0000-0000-0000-000000000001',
 'Alejandro Ruiz Martín', 'TechFlow Solutions S.L.', 'alejandro.ruiz@techflow.es', '+34 91 555 0201',
 'website', 'converted', 12800.00,
 'Llegó por web. Startup IA. Convertido.', '2025-03-05'),

('b0000001-0000-0000-0000-000000000003',
 'd0000001-0000-0000-0000-000000000001',
 'Francisco Morales Ruiz', 'Olivar Premium S.A.', 'fmorales@olivar-premium.com', '+34 953 555 301',
 'event', 'converted', 8200.00,
 'Contactado en Expoliva 2025. Convertido.', '2025-04-15'),

('b0000001-0000-0000-0000-000000000004',
 'd0000001-0000-0000-0000-000000000001',
 'Klaus Bergmann', 'NordikHaus GmbH', 'k.bergmann@nordikhaus.de', '+49 30 555 6790',
 'referral', 'converted', 6500.00,
 'Referido corresponsal Berlín. Convertido.', '2025-05-25'),

('b0000001-0000-0000-0000-000000000005',
 'd0000001-0000-0000-0000-000000000001',
 'Patricia Molina', 'Biomedical Innovations S.L.', 'pmolina@biomedical-inn.es', '+34 91 555 0800',
 'referral', 'contacted', 32000.00,
 'COO. 4 patentes médicas. Propuesta €32K enviada.', '2025-09-01'),

('b0000001-0000-0000-0000-000000000006',
 'd0000001-0000-0000-0000-000000000001',
 'Diego Navarro', 'Viñedos Aurora S.L.', 'dnavarro@vinedosaurora.es', '+34 941 555 100',
 'cold_call', 'new', 5000.00,
 'Primer contacto. Bodega La Rioja.', '2025-11-20');

-- PASO 7: CRM Deals (6 deals)
DELETE FROM crm_deals WHERE organization_id = 'd0000001-0000-0000-0000-000000000001';

INSERT INTO crm_deals (
  id, organization_id, account_id, contact_id,
  name, amount, stage, probability, won,
  expected_close_date, actual_close_date, won_at, won_value,
  metadata, created_at, assigned_to
) VALUES
('d1000001-0000-0000-0000-000000000001',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0006-0000-0000-000000000001',
 'cc000001-0000-0000-0000-000000000001',
 'GreenPower — Protección PI completa', 18500.00, 'won', 100, true,
 '2025-03-01', '2025-03-01', '2025-03-01', 18500.00,
 '{"notes": "Portfolio: 3 marcas + 1 patente + oposición."}'::jsonb,
 '2025-02-15', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('d1000001-0000-0000-0000-000000000002',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0001-0000-0000-000000000001',
 'cc000001-0000-0000-0000-000000000003',
 'TechFlow — Marcas + Patente software', 12800.00, 'won', 100, true,
 '2025-04-01', '2025-04-01', '2025-04-01', 12800.00,
 '{"notes": "2 marcas + 1 EUIPO + patente ML."}'::jsonb,
 '2025-03-10', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('d1000001-0000-0000-0000-000000000003',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0002-0000-0000-000000000001',
 'cc000001-0000-0000-0000-000000000005',
 'Olivar Premium — Marca nacional + EUIPO', 8200.00, 'won', 100, true,
 '2025-05-15', '2025-05-15', '2025-05-15', 8200.00,
 '{"notes": "1 marca OEPM + 1 EUIPO."}'::jsonb,
 '2025-04-20', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('d1000001-0000-0000-0000-000000000004',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0005-0000-0000-000000000001',
 'cc000001-0000-0000-0000-000000000009',
 'Sabores Mediterráneo — Marca franquicia', 9500.00, 'negotiation', 60, false,
 '2026-03-01', NULL, NULL, NULL,
 '{"notes": "50 franquicias. En negociación."}'::jsonb,
 '2025-07-15', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('d1000001-0000-0000-0000-000000000005',
 'd0000001-0000-0000-0000-000000000001',
 'a0000001-0004-0000-0000-000000000001',
 'cc000001-0000-0000-0000-000000000007',
 'NordikHaus — Marcas España + Portugal', 6500.00, 'won', 100, true,
 '2025-07-01', '2025-07-01', '2025-07-01', 6500.00,
 '{"notes": "OEPM + INPI Portugal."}'::jsonb,
 '2025-06-01', '0090b656-5c9a-445c-91be-34228afb2b0f'),

('d1000001-0000-0000-0000-000000000006',
 'd0000001-0000-0000-0000-000000000001',
 NULL, NULL,
 'Biomedical Innovations — 4 patentes médicas', 32000.00, 'proposal', 40, false,
 '2026-04-01', NULL, NULL, NULL,
 '{"notes": "Propuesta enviada. 4 patentes."}'::jsonb,
 '2025-09-15', '0090b656-5c9a-445c-91be-34228afb2b0f');