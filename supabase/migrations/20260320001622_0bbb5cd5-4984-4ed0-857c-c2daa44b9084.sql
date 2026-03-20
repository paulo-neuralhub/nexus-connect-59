
-- Enrich ipo_offices with data from static catalog
-- Update all offices with timezone, languages, currency, website_search, api_type, tier, treaty memberships, IP types

-- INTERNATIONAL
UPDATE ipo_offices SET code_alt='WIPO', name_short='WIPO', office_acronym='WIPO', timezone='Europe/Zurich', languages=ARRAY['en','es','fr','ar','zh','ru']::text[], currency='CHF', tier='1', automation_percentage=75, website_search='https://www.wipo.int/madrid/monitor/', api_type='REST', handles_trademarks=true, handles_patents=true, handles_designs=true, supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=60, tm_filing_fee=653, tm_fee_currency='CHF' WHERE code='WO';
UPDATE ipo_offices SET code_alt='EPO', name_short='EPO', office_acronym='EPO', timezone='Europe/Munich', languages=ARRAY['en','de','fr']::text[], currency='EUR', tier='1', automation_percentage=100, website_search='https://worldwide.espacenet.com', api_type='REST', handles_patents=true, supported_ip_types=ARRAY['patent']::text[], data_completeness_score=60 WHERE code='EP';
UPDATE ipo_offices SET code_alt='EUIPO', name_short='EUIPO', office_acronym='EUIPO', timezone='Europe/Madrid', languages=ARRAY['en','es','de','fr','it']::text[], currency='EUR', tier='1', automation_percentage=100, website_search='https://euipo.europa.eu/eSearch/', api_type='REST', handles_trademarks=true, handles_designs=true, supported_ip_types=ARRAY['trademark','design']::text[], data_completeness_score=70, tm_filing_fee=850, tm_fee_currency='EUR' WHERE code='EM';
UPDATE ipo_offices SET code_alt='BOIP', name_short='BOIP', office_acronym='BOIP', timezone='Europe/Amsterdam', languages=ARRAY['nl','fr','en']::text[], currency='EUR', tier='2', automation_percentage=50, website_search='https://www.boip.int/en/trademark-search', data_completeness_score=50 WHERE code='BX';
UPDATE ipo_offices SET code_alt='EAPO', name_short='EAPO', office_acronym='EAPO', timezone='Europe/Moscow', languages=ARRAY['ru','en']::text[], currency='USD', tier='2', automation_percentage=25, data_completeness_score=40 WHERE code='EA';
UPDATE ipo_offices SET code_alt='ARIPO', name_short='ARIPO', office_acronym='ARIPO', timezone='Africa/Harare', languages=ARRAY['en']::text[], currency='USD', tier='2', automation_percentage=25, data_completeness_score=40 WHERE code='AP';
UPDATE ipo_offices SET code_alt='OAPI', name_short='OAPI', office_acronym='OAPI', timezone='Africa/Douala', languages=ARRAY['fr']::text[], currency='XAF', tier='2', automation_percentage=0, data_completeness_score=35 WHERE code='OA';
UPDATE ipo_offices SET code_alt='GCCPO', name_short='GCCPO', office_acronym='GCCPO', timezone='Asia/Riyadh', languages=ARRAY['ar','en']::text[], currency='SAR', tier='2', automation_percentage=0, data_completeness_score=30 WHERE code='GC';

-- MAJOR EUROPE
UPDATE ipo_offices SET code_alt='DPMA', name_short='DPMA', office_acronym='DPMA', timezone='Europe/Berlin', languages=ARRAY['de']::text[], currency='EUR', website_search='https://register.dpma.de', api_type='REST', handles_utility_models=true, supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=65, tm_filing_fee=290, tm_fee_currency='EUR', tm_class_extra_fee=100, tm_renewal_fee=750 WHERE code='DE';
UPDATE ipo_offices SET code_alt='INPI-FR', name_short='INPI France', office_acronym='INPI-FR', timezone='Europe/Paris', languages=ARRAY['fr']::text[], currency='EUR', website_search='https://bases-marques.inpi.fr', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=65, tm_filing_fee=190, tm_fee_currency='EUR', tm_class_extra_fee=40, tm_renewal_fee=290 WHERE code='FR';
UPDATE ipo_offices SET code_alt='UKIPO', name_short='UKIPO', office_acronym='UKIPO', timezone='Europe/London', languages=ARRAY['en']::text[], currency='GBP', website_search='https://trademarks.ipo.gov.uk/ipo-tmcase', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=65, tm_filing_fee=170, tm_fee_currency='GBP', tm_class_extra_fee=50, tm_renewal_fee=200 WHERE code='GB';
UPDATE ipo_offices SET code_alt='UIBM', name_short='UIBM', office_acronym='UIBM', timezone='Europe/Rome', languages=ARRAY['it']::text[], currency='EUR', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=55, tm_filing_fee=101, tm_fee_currency='EUR', tm_class_extra_fee=34 WHERE code='IT';
UPDATE ipo_offices SET code_alt='OEPM', name_short='OEPM', office_acronym='OEPM', timezone='Europe/Madrid', languages=ARRAY['es']::text[], currency='EUR', website_search='https://consultas2.oepm.es/LocalizadorWeb/', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=70, tm_filing_fee=154.23, tm_fee_currency='EUR', tm_class_extra_fee=96.15, tm_renewal_fee=154.23, tm_opposition_fee=0 WHERE code='ES';
UPDATE ipo_offices SET code_alt='IPI', name_short='IPI', office_acronym='IPI', timezone='Europe/Zurich', languages=ARRAY['de','fr','it']::text[], currency='CHF', data_completeness_score=55, tm_filing_fee=550, tm_fee_currency='CHF' WHERE code='CH';
UPDATE ipo_offices SET code_alt='PRV', name_short='PRV', office_acronym='PRV', timezone='Europe/Stockholm', languages=ARRAY['sv']::text[], currency='SEK', data_completeness_score=50, tm_filing_fee=2000, tm_fee_currency='SEK' WHERE code='SE';
UPDATE ipo_offices SET code_alt='INPI-PT', name_short='INPI Portugal', office_acronym='INPI-PT', timezone='Europe/Lisbon', languages=ARRAY['pt']::text[], currency='EUR', data_completeness_score=55, tm_filing_fee=127.04, tm_fee_currency='EUR' WHERE code='PT';

-- NORTH AMERICA
UPDATE ipo_offices SET code_alt='USPTO', name_short='USPTO', office_acronym='USPTO', timezone='America/New_York', languages=ARRAY['en']::text[], currency='USD', website_search='https://tmsearch.uspto.gov', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=75, tm_filing_fee=250, tm_fee_currency='USD', tm_class_extra_fee=250, tm_renewal_fee=300, tm_opposition_fee=600 WHERE code='US';
UPDATE ipo_offices SET code_alt='CIPO', name_short='CIPO', office_acronym='CIPO', timezone='America/Toronto', languages=ARRAY['en','fr']::text[], currency='CAD', website_search='https://ised-isde.canada.ca/app/opic-cipo/trdmrks/srch/home', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=60, tm_filing_fee=347.35, tm_fee_currency='CAD', tm_class_extra_fee=105.26, tm_renewal_fee=400 WHERE code='CA';
UPDATE ipo_offices SET code_alt='IMPI', name_short='IMPI', office_acronym='IMPI', timezone='America/Mexico_City', languages=ARRAY['es']::text[], currency='MXN', website_search='https://marcanet.impi.gob.mx', handles_utility_models=true, supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=60, tm_filing_fee=2813.73, tm_fee_currency='MXN' WHERE code='MX';

-- ASIA PACIFIC
UPDATE ipo_offices SET code_alt='CNIPA', name_short='CNIPA', office_acronym='CNIPA', timezone='Asia/Shanghai', languages=ARRAY['zh']::text[], currency='CNY', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=60, tm_filing_fee=270, tm_fee_currency='CNY', tm_renewal_fee=500 WHERE code='CN';
UPDATE ipo_offices SET code_alt='JPO', name_short='JPO', office_acronym='JPO', timezone='Asia/Tokyo', languages=ARRAY['ja']::text[], currency='JPY', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=65, tm_filing_fee=12000, tm_fee_currency='JPY', tm_class_extra_fee=8600 WHERE code='JP';
UPDATE ipo_offices SET code_alt='KIPO', name_short='KIPO', office_acronym='KIPO', timezone='Asia/Seoul', languages=ARRAY['ko']::text[], currency='KRW', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=60, tm_filing_fee=62000, tm_fee_currency='KRW' WHERE code='KR';
UPDATE ipo_offices SET code_alt='IP-AU', name_short='IP Australia', office_acronym='IP-AU', timezone='Australia/Sydney', languages=ARRAY['en']::text[], currency='AUD', api_type='REST', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=60, tm_filing_fee=250, tm_fee_currency='AUD', tm_class_extra_fee=250, tm_renewal_fee=400 WHERE code='AU';
UPDATE ipo_offices SET code_alt='CGPDTM', name_short='IP India', office_acronym='CGPDTM', timezone='Asia/Kolkata', languages=ARRAY['en','hi']::text[], currency='INR', supported_ip_types=ARRAY['trademark','patent','design']::text[], data_completeness_score=55, tm_filing_fee=4500, tm_fee_currency='INR', tm_renewal_fee=9000 WHERE code='IN';

-- SOUTH AMERICA
UPDATE ipo_offices SET code_alt='INPI-BR', name_short='INPI Brazil', office_acronym='INPI-BR', timezone='America/Sao_Paulo', languages=ARRAY['pt']::text[], currency='BRL', supported_ip_types=ARRAY['trademark','patent','design','utility_model']::text[], data_completeness_score=60, tm_filing_fee=355, tm_fee_currency='BRL', tm_renewal_fee=745 WHERE code='BR';
UPDATE ipo_offices SET code_alt='INAPI', name_short='INAPI', office_acronym='INAPI', timezone='America/Santiago', languages=ARRAY['es']::text[], currency='CLP', data_completeness_score=55 WHERE code='CL';
UPDATE ipo_offices SET code_alt='SIC', name_short='SIC', office_acronym='SIC', timezone='America/Bogota', languages=ARRAY['es']::text[], currency='COP', data_completeness_score=55, tm_filing_fee=961000, tm_fee_currency='COP' WHERE code='CO';
UPDATE ipo_offices SET code_alt='INPI-AR', name_short='INPI Argentina', office_acronym='INPI-AR', timezone='America/Argentina/Buenos_Aires', languages=ARRAY['es']::text[], currency='ARS', data_completeness_score=50, tm_filing_fee=7000, tm_fee_currency='ARS' WHERE code='AR';
UPDATE ipo_offices SET code_alt='INDECOPI', name_short='INDECOPI', office_acronym='INDECOPI', timezone='America/Lima', languages=ARRAY['es']::text[], currency='PEN', data_completeness_score=55, tm_filing_fee=534.99, tm_fee_currency='PEN' WHERE code='PE';

-- Insert official fees for major offices
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 850, 'EUR', true FROM ipo_offices WHERE code='EM' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM 2nd class', 'additional_class', 50, 'EUR', true FROM ipo_offices WHERE code='EM' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM 3rd+ class', 'additional_class_3plus', 150, 'EUR', true FROM ipo_offices WHERE code='EM' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 850, 'EUR', true FROM ipo_offices WHERE code='EM' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Opposition', 'opposition', 320, 'EUR', true FROM ipo_offices WHERE code='EM' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 154.23, 'EUR', true FROM ipo_offices WHERE code='ES' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 96.15, 'EUR', true FROM ipo_offices WHERE code='ES' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 154.23, 'EUR', true FROM ipo_offices WHERE code='ES' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM TEAS Plus (1 class)', 'filing', 250, 'USD', true FROM ipo_offices WHERE code='US' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM TEAS Standard (1 class)', 'filing_standard', 350, 'USD', true FROM ipo_offices WHERE code='US' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal (Sec 9)', 'renewal', 300, 'USD', true FROM ipo_offices WHERE code='US' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Opposition', 'opposition', 600, 'USD', true FROM ipo_offices WHERE code='US' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 170, 'GBP', true FROM ipo_offices WHERE code='GB' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 50, 'GBP', true FROM ipo_offices WHERE code='GB' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 200, 'GBP', true FROM ipo_offices WHERE code='GB' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (up to 3 classes)', 'filing', 290, 'EUR', true FROM ipo_offices WHERE code='DE' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 100, 'EUR', true FROM ipo_offices WHERE code='DE' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 750, 'EUR', true FROM ipo_offices WHERE code='DE' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 190, 'EUR', true FROM ipo_offices WHERE code='FR' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 40, 'EUR', true FROM ipo_offices WHERE code='FR' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 290, 'EUR', true FROM ipo_offices WHERE code='FR' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 270, 'CNY', true FROM ipo_offices WHERE code='CN' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 500, 'CNY', true FROM ipo_offices WHERE code='CN' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 12000, 'JPY', true FROM ipo_offices WHERE code='JP' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 8600, 'JPY', true FROM ipo_offices WHERE code='JP' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing online', 'filing', 355, 'BRL', true FROM ipo_offices WHERE code='BR' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 745, 'BRL', true FROM ipo_offices WHERE code='BR' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing', 'filing', 2813.73, 'MXN', true FROM ipo_offices WHERE code='MX' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing online', 'filing', 4500, 'INR', true FROM ipo_offices WHERE code='IN' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 9000, 'INR', true FROM ipo_offices WHERE code='IN' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 62000, 'KRW', true FROM ipo_offices WHERE code='KR' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 250, 'AUD', true FROM ipo_offices WHERE code='AU' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 250, 'AUD', true FROM ipo_offices WHERE code='AU' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 400, 'AUD', true FROM ipo_offices WHERE code='AU' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'Madrid Basic Fee (B&W)', 'filing', 653, 'CHF', true FROM ipo_offices WHERE code='WO' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'Madrid Basic Fee (Color)', 'filing_color', 903, 'CHF', true FROM ipo_offices WHERE code='WO' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'Madrid Supplementary Fee', 'additional_class', 100, 'CHF', true FROM ipo_offices WHERE code='WO' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'Madrid Renewal', 'renewal', 653, 'CHF', true FROM ipo_offices WHERE code='WO' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing', 'filing', 961000, 'COP', true FROM ipo_offices WHERE code='CO' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 7000, 'ARS', true FROM ipo_offices WHERE code='AR' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing', 'filing', 534.99, 'PEN', true FROM ipo_offices WHERE code='PE' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 101, 'EUR', true FROM ipo_offices WHERE code='IT' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 34, 'EUR', true FROM ipo_offices WHERE code='IT' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing online', 'filing', 127.04, 'EUR', true FROM ipo_offices WHERE code='PT' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (up to 3 classes)', 'filing', 550, 'CHF', true FROM ipo_offices WHERE code='CH' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing (1 class)', 'filing', 2000, 'SEK', true FROM ipo_offices WHERE code='SE' ON CONFLICT DO NOTHING;

INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Filing', 'filing', 347.35, 'CAD', true FROM ipo_offices WHERE code='CA' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Additional class', 'additional_class', 105.26, 'CAD', true FROM ipo_offices WHERE code='CA' ON CONFLICT DO NOTHING;
INSERT INTO ipo_official_fees (office_id, ip_type, service_category, service_name, fee_type, amount, currency, is_active)
SELECT id, 'trademark', 'official', 'TM Renewal', 'renewal', 400, 'CAD', true FROM ipo_offices WHERE code='CA' ON CONFLICT DO NOTHING;

-- Insert treaty status for all offices that have treaty memberships
-- Madrid Protocol members
INSERT INTO ipo_treaty_status (office_id, treaty_code, treaty_name, treaty_full_name, status)
SELECT id, 'madrid', 'Madrid Protocol', 'Protocol Relating to the Madrid Agreement Concerning the International Registration of Marks', 'member'
FROM ipo_offices WHERE member_madrid_protocol = true
ON CONFLICT DO NOTHING;

-- PCT members (using paris_convention_member field which was mapped from isPctMember)
INSERT INTO ipo_treaty_status (office_id, treaty_code, treaty_name, treaty_full_name, status)
SELECT id, 'pct', 'PCT', 'Patent Cooperation Treaty', 'member'
FROM ipo_offices WHERE paris_convention_member = true
ON CONFLICT DO NOTHING;

-- Paris Convention (assume same as PCT for most)
INSERT INTO ipo_treaty_status (office_id, treaty_code, treaty_name, treaty_full_name, status)
SELECT id, 'paris', 'Paris Convention', 'Paris Convention for the Protection of Industrial Property', 'member'
FROM ipo_offices WHERE paris_convention_member = true
ON CONFLICT DO NOTHING;
