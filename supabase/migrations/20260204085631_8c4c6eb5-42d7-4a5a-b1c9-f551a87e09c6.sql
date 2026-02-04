-- FASE 1B: COMUNICACIONES sin contact_id (es nullable, el FK apunta a tabla contacts diferente)
INSERT INTO communications (
  id, organization_id, matter_id,
  channel, direction, subject, body, body_preview,
  email_from, email_to, received_at, created_at
) VALUES

-- GREENPOWER 2025/TM/001
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0001-0000-0000-000000000001',
 'email', 'outbound', 'Bienvenida — Expediente GREENPOWER abierto',
 'Estimado Roberto, le damos la bienvenida. Hemos abierto expediente para registro de marca GREENPOWER ante OEPM.',
 'Le damos la bienvenida. Hemos abierto expediente...',
 'carlos@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-02-15 10:00:00+00', '2025-02-15'),

(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0001-0000-0000-000000000001',
 'email', 'outbound', 'Solicitud GREENPOWER presentada — M-2025-001234',
 'Estimado Roberto, confirmamos la presentación. Nº solicitud M-2025-001234.',
 'Confirmamos la presentación. Nº solicitud M-2025-001234...',
 'carlos@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-02-25 11:00:00+00', '2025-02-25'),

(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0001-0000-0000-000000000001',
 'email', 'outbound', '¡Enhorabuena! Marca GREENPOWER registrada',
 'Estimado Roberto, la marca GREENPOWER ha sido registrada oficialmente.',
 'La marca GREENPOWER ha sido registrada oficialmente...',
 'carlos@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-08-16 09:00:00+00', '2025-08-16'),

-- OLIVAR PREMIUM 2025/TM/006
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0008-0000-0000-000000000001',
 'email', 'outbound', 'Solicitud OLIVAR PREMIUM presentada en OEPM',
 'Estimado Francisco, la solicitud ha sido presentada. Nº M-2025-004567.',
 'La solicitud ha sido presentada. Nº M-2025-004567...',
 'miguel@meridian-ip.com', ARRAY['fmorales@olivar-premium.com'],
 '2025-05-06 10:30:00+00', '2025-05-06'),

(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0008-0000-0000-000000000001',
 'email', 'outbound', '¡Marca OLIVAR PREMIUM registrada!',
 'Estimado Francisco, excelente noticia. Adjuntamos certificado oficial OEPM.',
 'Excelente noticia. Adjuntamos certificado oficial...',
 'miguel@meridian-ip.com', ARRAY['fmorales@olivar-premium.com'],
 '2025-10-31 11:00:00+00', '2025-10-31'),

-- TECHFLOW 2025/TM/003
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0004-0000-0000-000000000001',
 'email', 'outbound', 'Solicitud TECHFLOW presentada en OEPM',
 'Estimado Alejandro, la marca TECHFLOW ha sido presentada. Nº M-2025-003456.',
 'La marca TECHFLOW ha sido presentada...',
 'sofia@meridian-ip.com', ARRAY['alejandro.ruiz@techflow.es'],
 '2025-03-21 09:00:00+00', '2025-03-21'),

(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0004-0000-0000-000000000001',
 'email', 'outbound', 'Marca TECHFLOW registrada — Certificado adjunto',
 'Estimado Alejandro, TECHFLOW registrada con éxito.',
 'TECHFLOW registrada con éxito...',
 'sofia@meridian-ip.com', ARRAY['alejandro.ruiz@techflow.es'],
 '2025-09-11 10:00:00+00', '2025-09-11'),

-- FLOWAI 2025/TM/004
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0005-0000-0000-000000000001',
 'email', 'outbound', 'FLOWAI publicada en EUIPO — Periodo oposición abierto',
 'Estimado Alejandro, FLOWAI publicada. Periodo oposición: 3 meses hasta 28/02/2026.',
 'FLOWAI publicada. Periodo oposición: 3 meses...',
 'sofia@meridian-ip.com', ARRAY['alejandro.ruiz@techflow.es'],
 '2025-11-29 09:30:00+00', '2025-11-29'),

-- Panel Solar 2025/PT/001
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0003-0000-0000-000000000001',
 'email', 'outbound', '¡Patente Panel Solar concedida por EPO!',
 'Estimado Roberto, la patente ha sido concedida por la Oficina Europea de Patentes.',
 'La patente ha sido concedida por EPO...',
 'carlos@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-09-22 10:00:00+00', '2025-09-22'),

-- OLIVAR GOLD 2025/TM/007
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0009-0000-0000-000000000001',
 'email', 'outbound', 'Requerimiento EUIPO — OLIVAR PREMIUM GOLD',
 'Estimado Francisco, EUIPO solicita ampliar descripción clase 30. Plazo: 2 meses.',
 'EUIPO solicita ampliar descripción clase 30...',
 'miguel@meridian-ip.com', ARRAY['fmorales@olivar-premium.com'],
 '2025-12-06 11:00:00+00', '2025-12-06'),

-- NORDIKHAUS 2025/TM/008
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0011-0000-0000-000000000001',
 'email', 'outbound', 'NORDIKHAUS filed at OEPM Spain',
 'Dear Klaus, we confirm filing of NORDIKHAUS at OEPM. Classes 20, 35.',
 'We confirm filing of NORDIKHAUS at OEPM...',
 'miguel@meridian-ip.com', ARRAY['k.bergmann@nordikhaus.de'],
 '2025-06-16 10:00:00+00', '2025-06-16'),

-- NORDIK LIVING 2025/TM/009
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0012-0000-0000-000000000001',
 'email', 'outbound', 'NORDIK LIVING filed at INPI Portugal',
 'Dear Klaus, NORDIK LIVING filed at INPI. Ref: PT-2025-012345.',
 'NORDIK LIVING filed at INPI...',
 'miguel@meridian-ip.com', ARRAY['k.bergmann@nordikhaus.de'],
 '2025-07-02 09:00:00+00', '2025-07-02'),

-- SABORES 2025/TM/010
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0013-0000-0000-000000000001',
 'email', 'outbound', 'Bienvenida — Expediente SABORES DEL MEDITERRÁNEO',
 'Estimada Valentina, confirmamos apertura expediente marca SABORES DEL MEDITERRÁNEO.',
 'Confirmamos apertura expediente marca SABORES...',
 'carlos@meridian-ip.com', ARRAY['vgarcia@saboresmed.es'],
 '2025-08-02 10:00:00+00', '2025-08-02'),

-- BioVoss-7 2025/PT/003
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0010-0000-0000-000000000001',
 'email', 'outbound', 'Informe patentabilidad BioVoss-7 — Favorable',
 'Estimada Dra. Voss, el informe es favorable. Recomendamos solicitar la patente.',
 'El informe es favorable. Recomendamos solicitar...',
 'sofia@meridian-ip.com', ARRAY['elena.voss@gmail.com'],
 '2025-05-22 11:00:00+00', '2025-05-22'),

-- ECOFLOW 2025/TM/011
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0014-0000-0000-000000000001',
 'email', 'outbound', 'Oposición ECOFLOW SOLAR — Resultado favorable',
 'Estimado Roberto, la oposición ha sido estimada parcialmente.',
 'La oposición ha sido estimada parcialmente...',
 'carlos@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-11-16 10:00:00+00', '2025-11-16'),

-- vs GREENTECH 2025/OPP/001
(gen_random_uuid(), 'd0000001-0000-0000-0000-000000000001', '10000001-0015-0000-0000-000000000001',
 'email', 'outbound', 'Oposición presentada contra GREENTECH ENERGY',
 'Estimado Roberto, hemos presentado oposición contra GREENTECH ENERGY.',
 'Hemos presentado oposición contra GREENTECH...',
 'sofia@meridian-ip.com', ARRAY['roberto.casas@greenpower-energy.es'],
 '2025-10-02 09:00:00+00', '2025-10-02');