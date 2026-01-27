-- =============================================
-- DATOS DEMO: PARTIES, FILINGS, DOCUMENTS, TASKS
-- Usando source_type = 'manual' (valor válido para check constraint)
-- =============================================

-- matter_parties
INSERT INTO matter_parties (id, matter_id, organization_id, party_role, source_type, external_name, external_country, party_type, sort_order, is_primary)
VALUES
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'applicant', 'manual', 'TechVerde Innovations S.L.', 'ES', 'company', 1, true),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'representative', 'manual', 'Bufete Martínez & Asociados', 'ES', 'company', 2, false),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'inventor', 'manual', 'Dr. Carlos Martínez López', 'ES', 'person', 3, false),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'applicant', 'manual', 'BioSalud Pharma S.A.', 'ES', 'company', 1, true),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'representative', 'manual', 'IP-NEXUS Demo', 'ES', 'company', 2, false),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'opponent', 'manual', 'GenericPharma AG', 'DE', 'company', 3, false),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'opponent_rep', 'manual', 'Kanzlei Schmidt & Partner', 'DE', 'company', 4, false),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'applicant', 'manual', 'Mediterránea Foods S.L.', 'ES', 'company', 1, true),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'owner', 'manual', 'María García Fernández', 'ES', 'person', 2, false);

-- matter_filings
INSERT INTO matter_filings (id, matter_id, organization_id, jurisdiction_code, office_code, application_number, filing_date, status)
VALUES
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'ES', 'OEPM', 'P202400123', NOW() - INTERVAL '180 days', 'granted'),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'WO', 'WIPO', 'PCT/ES2024/070001', NOW() - INTERVAL '90 days', 'pending'),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'EU', 'EUIPO', '018765432', NOW() - INTERVAL '200 days', 'opposed'),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'ES', 'OEPM', 'M4012345', NOW() - INTERVAL '365 days', 'registered');

-- matter_documents
INSERT INTO matter_documents (id, matter_id, organization_id, name, file_path, category, description, is_official, document_date)
VALUES
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'Solicitud de patente.pdf', 'demo/patent-app.pdf', 'application', 'Documento de solicitud', true, NOW() - INTERVAL '180 days'),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'Certificado concesión.pdf', 'demo/grant-cert.pdf', 'certificate', 'Certificado oficial', true, NOW() - INTERVAL '60 days'),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'Informe técnico.docx', 'demo/tech-report.docx', 'report', 'Análisis técnico', false, NOW() - INTERVAL '185 days'),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Solicitud marca EU.pdf', 'demo/tm-app-eu.pdf', 'application', 'Solicitud marca EU', true, NOW() - INTERVAL '200 days'),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Escrito oposición.pdf', 'demo/opposition.pdf', 'correspondence', 'Oposición GenericPharma', true, NOW() - INTERVAL '120 days'),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Borrador respuesta.docx', 'demo/response-draft.docx', 'correspondence', 'Borrador contestación', false, NOW() - INTERVAL '30 days'),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'Certificado registro.pdf', 'demo/reg-cert.pdf', 'certificate', 'Certificado registro', true, NOW() - INTERVAL '300 days'),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'Formulario renovación.pdf', 'demo/renewal-form.pdf', 'application', 'Formulario renovación', true, NOW() - INTERVAL '10 days');

-- matter_tasks
INSERT INTO matter_tasks (id, matter_id, organization_id, title, description, priority, status, due_date, is_completed)
VALUES
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Preparar contestación a oposición', 'Redactar escrito de respuesta', 'urgent', 'in_progress', NOW() + INTERVAL '5 days', false),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Recopilar pruebas de uso', 'Solicitar evidencias al cliente', 'high', 'pending', NOW() + INTERVAL '3 days', false),
(gen_random_uuid(), '4c147e28-9359-438f-b463-e966d51ce3c6', 'a1000000-0000-0000-0000-000000000001', 'Análisis de marca oponente', 'Investigar marcas GenericPharma', 'high', 'completed', NOW() - INTERVAL '10 days', true),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'Enviar certificado al cliente', 'Remitir certificado concesión', 'medium', 'completed', NOW() - INTERVAL '50 days', true),
(gen_random_uuid(), 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b', 'a1000000-0000-0000-0000-000000000001', 'Preparar extensión PCT', 'Evaluar países fase nacional', 'medium', 'pending', NOW() + INTERVAL '30 days', false),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'Procesar renovación', 'Presentar formulario y pago', 'high', 'pending', NOW() + INTERVAL '7 days', false),
(gen_random_uuid(), 'cfd049b3-ac1f-4a56-b191-0edd8b805b46', 'a1000000-0000-0000-0000-000000000001', 'Confirmar datos titular', 'Verificar datos actualizados', 'low', 'completed', NOW() - INTERVAL '5 days', true);

-- UPDATE invoices para vincular a expedientes
UPDATE invoices 
SET matter_id = 'ac2a0bb9-7fd6-4d5d-a0f6-995594576c8b'
WHERE organization_id = 'a1000000-0000-0000-0000-000000000001'
  AND matter_id IS NULL
  AND id IN (SELECT id FROM invoices WHERE organization_id = 'a1000000-0000-0000-0000-000000000001' AND matter_id IS NULL LIMIT 2);

UPDATE invoices 
SET matter_id = '4c147e28-9359-438f-b463-e966d51ce3c6'
WHERE organization_id = 'a1000000-0000-0000-0000-000000000001'
  AND matter_id IS NULL
  AND id IN (SELECT id FROM invoices WHERE organization_id = 'a1000000-0000-0000-0000-000000000001' AND matter_id IS NULL LIMIT 2);