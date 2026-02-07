
-- IP-MARKET COMPLETE SEED DATA (single transaction)

-- 1. Update existing agents
UPDATE market_users SET company_name = 'López & Asociados IP', bio = 'Despacho especializado en marcas y patentes con 15 años de experiencia ante OEPM y EUIPO.', specializations = ARRAY['trademarks','patents','opposition','renewals'], years_experience = 15, hourly_rate = 120, rating_avg = 4.8, ratings_count = 47, successful_transactions = 156, total_transactions = 165, success_rate = 94.55, response_time_avg = 7200, reputation_score = 92, is_public_profile = true WHERE id = '2d23bfdf-f5be-4085-a153-b71ceae2b436';
UPDATE market_users SET company_name = 'Martin Brevets & Marques', bio = 'Cabinet français spécialisé en PI. Mandataire agréé INPI, EUIPO et OMPI.', specializations = ARRAY['trademarks','patents','opposition','legal_opinion'], jurisdictions = ARRAY['FR','EU','WIPO'], years_experience = 12, hourly_rate = 140, rating_avg = 4.6, ratings_count = 38, successful_transactions = 112, total_transactions = 120, success_rate = 93.33, response_time_avg = 5400, reputation_score = 88, is_public_profile = true WHERE id = '35df751c-f08f-415a-a0f7-65ee1abcea08';
UPDATE market_users SET company_name = 'Schmidt IP GmbH', bio = 'Deutsche Kanzlei für gewerblichen Rechtsschutz vor DPMA, EUIPO und EPA.', specializations = ARRAY['patents','trademarks','designs','litigation'], jurisdictions = ARRAY['DE','EU','AT'], years_experience = 18, hourly_rate = 160, rating_avg = 4.9, ratings_count = 63, successful_transactions = 234, total_transactions = 245, success_rate = 95.51, response_time_avg = 3600, reputation_score = 95, is_public_profile = true WHERE id = 'e9ba842c-0fbb-46d0-a1ac-ab204191f589';
UPDATE market_users SET company_name = 'Taylor & Partners Patent Attorneys', bio = 'UK-based patent and trademark firm. Technology, pharma and life sciences.', specializations = ARRAY['patents','trademarks','designs','legal_opinion'], jurisdictions = ARRAY['GB','EU','US'], years_experience = 20, hourly_rate = 180, rating_avg = 4.7, ratings_count = 55, successful_transactions = 198, total_transactions = 210, success_rate = 94.29, response_time_avg = 4200, reputation_score = 90, is_public_profile = true WHERE id = 'db59c32c-dcc2-4667-9280-e606188b9194';
UPDATE market_users SET display_name = 'Paulo Chalaca', company_name = 'Meridian IP Consulting S.L.', is_public_profile = true WHERE id = '87d40bf6-7f54-40fa-87fc-d8c987159aed';

-- 2. New agents
INSERT INTO market_users (id, email, display_name, country, languages, is_agent, agent_type, company_name, bio, jurisdictions, specializations, years_experience, hourly_rate, rate_currency, rating_avg, ratings_count, successful_transactions, total_transactions, success_rate, response_time_avg, reputation_score, is_verified_agent, is_public_profile, user_type, badges) VALUES
('a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1','tanaka@demo.ip-nexus.local','Yuki Tanaka','JP',ARRAY['ja','en'],true,'trademark_attorney','Tanaka IP Office','Japanese IP firm for Asia-Pacific trademarks and designs.',ARRAY['JP','CN','KR'],ARRAY['trademarks','designs','search','surveillance'],14,130,'EUR',4.7,31,89,95,93.68,14400,85,true,true,'external_agent',ARRAY['verified_pro']),
('a2a2a2a2-a2a2-4a2a-a2a2-a2a2a2a2a2a2','silva@demo.ip-nexus.local','Ricardo Silva','BR',ARRAY['pt','es','en'],true,'trademark_attorney','Silva Propriedade Industrial','Escritório brasileiro de marcas e patentes.',ARRAY['BR','CO','AR'],ARRAY['trademarks','patents','designs','opposition'],10,90,'EUR',4.5,22,67,75,89.33,10800,78,true,true,'external_agent',ARRAY['verified_pro']),
('a3a3a3a3-a3a3-4a3a-a3a3-a3a3a3a3a3a3','chen@demo.ip-nexus.local','Wei Chen','CN',ARRAY['zh','en'],true,'trademark_attorney','Chen & Wang IP Consulting','CNIPA-registered agency. Over 500 filings.',ARRAY['CN','HK','SG'],ARRAY['trademarks','patents','designs','search'],11,100,'EUR',4.4,19,45,52,86.54,21600,75,true,true,'external_agent',ARRAY['verified_pro']),
('a4a4a4a4-a4a4-4a4a-a4a4-a4a4a4a4a4a4','rodriguez@demo.ip-nexus.local','Carmen Rodríguez','CO',ARRAY['es','en'],true,'trademark_attorney','Rodríguez PI','Firma colombiana. Comunidad Andina.',ARRAY['CO','PE','EC','CL'],ARRAY['trademarks','surveillance','renewals','search'],8,80,'EUR',4.3,14,38,44,86.36,18000,72,true,true,'external_agent',ARRAY['verified_pro']);

-- 3. RFQ Requests (10 total: 2 from user, 8 from agents)
INSERT INTO rfq_requests (requester_id, organization_id, service_category, service_type, title, description, jurisdictions, nice_classes, budget_min, budget_max, budget_currency, urgency, status, published_at, deadline_response, views_count, quotes_received) VALUES
('87d40bf6-7f54-40fa-87fc-d8c987159aed','c8a6c1e7-ffba-48f3-9b09-ea8cc122c683','trademark','tm_registration','Registro de marca denominativa en 3 clases ante EUIPO','Necesitamos registrar una marca denominativa en las clases 9, 35 y 42 para empresa de software B2B. Búsqueda previa incluida.',ARRAY['EU'],ARRAY[9,35,42],800,1500,'EUR','normal','open',NOW()-INTERVAL '3 days',NOW()+INTERVAL '18 days',34,3),
('87d40bf6-7f54-40fa-87fc-d8c987159aed','c8a6c1e7-ffba-48f3-9b09-ea8cc122c683','trademark','tm_registration','Registro URGENTE de marca figurativa en China — 2 clases','Registro urgente de marca figurativa en clases 25 y 35 ante CNIPA. Plazo de prioridad vence en 15 días.',ARRAY['CN'],ARRAY[25,35],600,1200,'EUR','urgent','open',NOW()-INTERVAL '1 day',NOW()+INTERVAL '7 days',78,2),
('2d23bfdf-f5be-4085-a153-b71ceae2b436',NULL,'patent','pt_filing','Presentación de patente de utilidad — dispositivo IoT','Patente de utilidad ante USPTO. Dispositivos IoT para monitoreo industrial.',ARRAY['US'],NULL,3000,6000,'USD','normal','open',NOW()-INTERVAL '5 days',NOW()+INTERVAL '23 days',56,0),
('35df751c-f08f-415a-a0f7-65ee1abcea08',NULL,'trademark','tm_opposition','Oposición a solicitud de marca — EUIPO','Oposición contra marca publicada en boletín EUIPO. Plazo vence en 45 días.',ARRAY['EU'],NULL,1500,3000,'EUR','urgent','open',NOW()-INTERVAL '2 days',NOW()+INTERVAL '12 days',42,0),
('e9ba842c-0fbb-46d0-a1ac-ab204191f589',NULL,'trademark','tm_renewal','Renovación de 5 marcas en España — OEPM','Renovación de 5 marcas ante OEPM. Vencen en próximos 3 meses.',ARRAY['ES'],NULL,400,800,'EUR','flexible','open',NOW()-INTERVAL '7 days',NOW()+INTERVAL '25 days',18,0),
('db59c32c-dcc2-4667-9280-e606188b9194',NULL,'trademark','tm_search','Búsqueda de anterioridades multi-jurisdicción','Búsqueda exhaustiva para marca en ES, EU, US, GB, JP, CN.',ARRAY['ES','EU','US','GB','JP','CN'],NULL,1000,2500,'EUR','normal','open',NOW()-INTERVAL '4 days',NOW()+INTERVAL '17 days',29,0),
('a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1',NULL,'trademark','tm_watch','Vigilancia de marca — UE + Latinoamérica','Vigilancia continua: EUIPO + OEPM + IMPI + SIC + INPI. Informe mensual.',ARRAY['EU','ES','MX','CO','BR'],NULL,200,500,'EUR','flexible','open',NOW()-INTERVAL '6 days',NOW()+INTERVAL '24 days',15,0),
('a2a2a2a2-a2a2-4a2a-a2a2-a2a2a2a2a2a2',NULL,'design','ds_registration','Registro de diseño industrial — UKIPO','Diseño industrial para packaging ante UKIPO.',ARRAY['GB'],NULL,400,800,'GBP','normal','open',NOW()-INTERVAL '3 days',NOW()+INTERVAL '18 days',22,0),
('a3a3a3a3-a3a3-4a3a-a3a3-a3a3a3a3a3a3',NULL,'general','general_consultation','Opinión legal sobre registro de marca en España','Emprendedor busca opinión sobre viabilidad de registro de marca.',ARRAY['ES','EU'],NULL,150,400,'EUR','flexible','open',NOW()-INTERVAL '1 day',NOW()+INTERVAL '13 days',41,0),
('a4a4a4a4-a4a4-4a4a-a4a4-a4a4a4a4a4a4',NULL,'trademark','tm_registration','Registro de marca en Japón — clase 30','Marca mixta clase 30 ante JPO. Productos alimentarios. Traducción necesaria.',ARRAY['JP'],ARRAY[30],500,1000,'EUR','normal','open',NOW()-INTERVAL '2 days',NOW()+INTERVAL '19 days',27,0);

-- 4. Quotes for user's requests (get IDs via subquery)
INSERT INTO rfq_quotes (request_id, agent_id, total_price, currency, price_breakdown, estimated_duration_days, proposal_summary, relevant_experience, similar_cases_count, status, submitted_at, valid_until)
SELECT r.id, '2d23bfdf-f5be-4085-a153-b71ceae2b436', 1900, 'EUR',
 '{"professional_fees":850,"official_fees":1050,"breakdown_items":[{"item":"Búsqueda anterioridades","amount":200},{"item":"Preparación y presentación","amount":400},{"item":"Seguimiento","amount":250}]}'::jsonb,
 25, 'Amplia experiencia con marcas tecnológicas ante EUIPO. Más de 200 marcas en clases 9, 35 y 42.', 'Especialistas en marcas B2B: TechFlow, InnoSoft, DataBridge.', 45,
 'submitted', NOW()-INTERVAL '2 days', NOW()+INTERVAL '14 days'
FROM rfq_requests r WHERE r.title LIKE '%3 clases ante EUIPO%' AND r.requester_id = '87d40bf6-7f54-40fa-87fc-d8c987159aed' LIMIT 1;

INSERT INTO rfq_quotes (request_id, agent_id, total_price, currency, price_breakdown, estimated_duration_days, proposal_summary, relevant_experience, similar_cases_count, status, submitted_at, valid_until)
SELECT r.id, '35df751c-f08f-415a-a0f7-65ee1abcea08', 2000, 'EUR',
 '{"professional_fees":950,"official_fees":1050,"breakdown_items":[{"item":"Recherche antériorité","amount":250},{"item":"Rédaction et dépôt","amount":450},{"item":"Suivi intégral","amount":250}]}'::jsonb,
 20, 'Expertise reconnue en marques européennes. 3 mois de veille post-enregistrement offerts.', 'Plus de 300 marques EU. Spécialité SaaS et tech.', 62,
 'submitted', NOW()-INTERVAL '1 day', NOW()+INTERVAL '14 days'
FROM rfq_requests r WHERE r.title LIKE '%3 clases ante EUIPO%' AND r.requester_id = '87d40bf6-7f54-40fa-87fc-d8c987159aed' LIMIT 1;

INSERT INTO rfq_quotes (request_id, agent_id, total_price, currency, price_breakdown, estimated_duration_days, proposal_summary, relevant_experience, similar_cases_count, status, submitted_at, valid_until)
SELECT r.id, 'e9ba842c-0fbb-46d0-a1ac-ab204191f589', 1830, 'EUR',
 '{"professional_fees":780,"official_fees":1050,"breakdown_items":[{"item":"Anterioridades EUIPO","amount":180},{"item":"Presentación","amount":350},{"item":"Seguimiento","amount":250}]}'::jsonb,
 30, 'Wettbewerbsfähige Preise. Über 500 EU-Marken registriert.', 'Fokus: Technologie und Automotive. 500+ EU-Marken.', 78,
 'submitted', NOW()-INTERVAL '12 hours', NOW()+INTERVAL '14 days'
FROM rfq_requests r WHERE r.title LIKE '%3 clases ante EUIPO%' AND r.requester_id = '87d40bf6-7f54-40fa-87fc-d8c987159aed' LIMIT 1;

-- Quotes for China urgent request
INSERT INTO rfq_quotes (request_id, agent_id, total_price, currency, price_breakdown, estimated_duration_days, proposal_summary, relevant_experience, similar_cases_count, status, submitted_at, valid_until)
SELECT r.id, 'a1a1a1a1-a1a1-4a1a-a1a1-a1a1a1a1a1a1', 1150, 'EUR',
 '{"professional_fees":700,"official_fees":450,"breakdown_items":[{"item":"Verificación CNIPA","amount":100},{"item":"Presentación prioritaria","amount":400},{"item":"Seguimiento","amount":200}]}'::jsonb,
 10, 'Direct filing with CNIPA. Urgent filings within 48 hours. Paris Convention priority claims.', 'Over 200 CNIPA filings. Cross-border Asia specialist.', 35,
 'submitted', NOW()-INTERVAL '18 hours', NOW()+INTERVAL '7 days'
FROM rfq_requests r WHERE r.title LIKE '%China%' AND r.requester_id = '87d40bf6-7f54-40fa-87fc-d8c987159aed' LIMIT 1;

INSERT INTO rfq_quotes (request_id, agent_id, total_price, currency, price_breakdown, estimated_duration_days, proposal_summary, relevant_experience, similar_cases_count, status, submitted_at, valid_until)
SELECT r.id, 'a3a3a3a3-a3a3-4a3a-a3a3-a3a3a3a3a3a3', 1000, 'EUR',
 '{"professional_fees":550,"official_fees":450,"breakdown_items":[{"item":"Búsqueda express","amount":80},{"item":"Traducción + Presentación","amount":350},{"item":"Seguimiento","amount":120}]}'::jsonb,
 7, 'CNIPA direct agency. 24h urgent filing. Chinese translation included at no extra cost.', '500+ CNIPA filings. Direct agency registration.', 52,
 'submitted', NOW()-INTERVAL '6 hours', NOW()+INTERVAL '5 days'
FROM rfq_requests r WHERE r.title LIKE '%China%' AND r.requester_id = '87d40bf6-7f54-40fa-87fc-d8c987159aed' LIMIT 1;
