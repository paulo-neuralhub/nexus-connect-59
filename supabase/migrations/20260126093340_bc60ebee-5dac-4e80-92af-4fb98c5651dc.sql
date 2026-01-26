-- ============================================================
-- IP-NEXUS - LEGAL DEADLINES SEED
-- Trademark deadlines for America & Asia
-- Verified: 2026-01-26
-- ============================================================

-- 1. USPTO (United States) Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, days_offset, months_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable, max_extension_months,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Opposition
('USPTO_TM_OPPOSITION_PERIOD',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'opposition',
 'Plazo de oposición marca USA', 'US trademark opposition period',
 'Período de 30 días para presentar oposición o solicitar extensión.',
 'publication', 30, NULL, NULL, false,
 NULL, false, NULL, true, NULL,
 '15 U.S.C. §1063', 'https://www.uspto.gov/trademarks',
 '2026-01-26', 'USPTO TMEP', '2026-07-01'),

-- Opposition extension
('USPTO_TM_OPPOSITION_EXTENSION',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'opposition',
 'Extensión plazo oposición', 'Opposition extension',
 'Extensiones posibles de 30 días cada una, hasta 180 días total.',
 'publication', 30, NULL, NULL, false,
 NULL, false, NULL, true, 6,
 'TTAB Rules', 'https://www.uspto.gov',
 '2026-01-26', 'USPTO TMEP', '2026-07-01'),

-- Section 8 (5-6 years)
('USPTO_TM_SECTION_8_FIRST',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'declaration',
 'Declaración de uso Section 8 (5-6 años)', 'Section 8 Declaration (5-6 years)',
 'Declaración obligatoria de uso continuado entre el 5º y 6º año desde registro.',
 'registration', NULL, NULL, 5, false,
 6, true, NULL, false, NULL,
 '15 U.S.C. §1058', 'https://www.uspto.gov/trademarks/maintain',
 '2026-01-26', 'USPTO Official', '2026-07-01'),

-- Section 8+9 (9-10 years and every 10)
('USPTO_TM_SECTION_8_9',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'renewal',
 'Renovación Section 8+9 (cada 10 años)', 'Section 8+9 Renewal (every 10 years)',
 'Declaración de uso + renovación entre 9º y 10º año, y cada 10 años después.',
 'registration', NULL, NULL, 9, false,
 6, true, 12, false, NULL,
 '15 U.S.C. §§1058, 1059', 'https://www.uspto.gov/trademarks/maintain',
 '2026-01-26', 'USPTO Official', '2026-07-01'),

-- Section 15 Incontestability
('USPTO_TM_SECTION_15',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'declaration',
 'Declaración de incontestabilidad Section 15', 'Section 15 Incontestability',
 'Declaración opcional para hacer la marca incontestable (5 años uso continuo).',
 'registration', NULL, NULL, 5, false,
 NULL, false, NULL, false, NULL,
 '15 U.S.C. §1065', 'https://www.uspto.gov',
 '2026-01-26', 'USPTO Official', '2026-07-01'),

-- Office Action response
('USPTO_TM_OFFICE_ACTION',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'response',
 'Respuesta a Office Action', 'Office Action response',
 'Plazo de 6 meses para responder a requerimiento del examinador.',
 'notification', NULL, 6, NULL, false,
 NULL, false, NULL, false, NULL,
 'TMEP', 'https://www.uspto.gov',
 '2026-01-26', 'USPTO Official', '2026-07-01'),

-- Statement of Use
('USPTO_TM_SOU',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'declaration',
 'Statement of Use (Intent-to-Use)', 'Statement of Use',
 'Plazo de 6 meses para presentar declaración de uso tras Notice of Allowance.',
 'notice_of_allowance', NULL, 6, NULL, false,
 NULL, false, NULL, true, 30,
 '15 U.S.C. §1051(d)', 'https://www.uspto.gov',
 '2026-01-26', 'USPTO Official', '2026-07-01'),

-- Petition to Revive
('USPTO_TM_PETITION_REVIVE',
 (SELECT id FROM public.ip_offices WHERE code = 'USPTO'),
 'trademark', 'restoration',
 'Petition to Revive', 'Petition to Revive abandoned application',
 'Solicitud para revivir solicitud abandonada (estándar: unintentional).',
 'abandonment_notice', NULL, 2, NULL, false,
 NULL, false, NULL, false, NULL,
 '37 CFR §2.66', 'https://www.uspto.gov',
 '2026-01-26', 'USPTO TMEP 1714', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;

-- 2. WIPO (Madrid System) Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, months_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Dependency period
('WIPO_TM_DEPENDENCY',
 (SELECT id FROM public.ip_offices WHERE code = 'WIPO'),
 'trademark', 'response',
 'Período de dependencia', 'Dependency period',
 'Durante 5 años, el registro internacional depende de la marca base.',
 'international_registration', NULL, 5, false,
 NULL, false, NULL, false,
 'Madrid Protocol Art. 6', 'https://www.wipo.int/madrid/en/',
 '2026-01-26', 'WIPO Madrid Guide', '2026-07-01'),

-- International renewal
('WIPO_TM_RENEWAL',
 (SELECT id FROM public.ip_offices WHERE code = 'WIPO'),
 'trademark', 'renewal',
 'Renovación marca internacional', 'International trademark renewal',
 'Renovación cada 10 años del registro internacional.',
 'international_registration', NULL, 10, false,
 6, true, 6, false,
 'Madrid Protocol Art. 7', 'https://www.wipo.int/madrid/en/',
 '2026-01-26', 'WIPO Official', '2026-07-01'),

-- Examination 12 months
('WIPO_TM_EXAMINATION_12M',
 (SELECT id FROM public.ip_offices WHERE code = 'WIPO'),
 'trademark', 'response',
 'Plazo examen país (12 meses)', 'Examination period (12 months)',
 'Plazo para que oficina designada emita denegación provisional (Madrid Agreement).',
 'designation_notification', 12, NULL, false,
 NULL, false, NULL, false,
 'Madrid Agreement', 'https://www.wipo.int/madrid/en/',
 '2026-01-26', 'WIPO Madrid Guide', '2026-07-01'),

-- Examination 18 months
('WIPO_TM_EXAMINATION_18M',
 (SELECT id FROM public.ip_offices WHERE code = 'WIPO'),
 'trademark', 'response',
 'Plazo examen país (18 meses)', 'Examination period (18 months)',
 'Plazo para que oficina designada emita denegación provisional (Madrid Protocol).',
 'designation_notification', 18, NULL, false,
 NULL, false, NULL, false,
 'Madrid Protocol Art. 5(2)', 'https://www.wipo.int/madrid/en/',
 '2026-01-26', 'WIPO Madrid Guide', '2026-07-01'),

-- Response to provisional refusal
('WIPO_TM_REFUSAL_RESPONSE',
 (SELECT id FROM public.ip_offices WHERE code = 'WIPO'),
 'trademark', 'response',
 'Respuesta a denegación provisional', 'Provisional refusal response',
 'Plazo para responder a denegación provisional (varía según oficina designada).',
 'provisional_refusal', 3, NULL, false,
 NULL, false, NULL, false,
 'Madrid Protocol', 'https://www.wipo.int/madrid/en/',
 '2026-01-26', 'WIPO Madrid Guide', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;

-- 3. CNIPA (China) Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, months_offset, days_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Opposition
('CNIPA_TM_OPPOSITION',
 (SELECT id FROM public.ip_offices WHERE code = 'CNIPA'),
 'trademark', 'opposition',
 'Plazo oposición marca China', 'China trademark opposition period',
 'Período de 3 meses para presentar oposición.',
 'publication', 3, NULL, NULL, false,
 NULL, false, NULL, false,
 'China Trademark Law Art. 33', 'https://english.cnipa.gov.cn/',
 '2026-01-26', 'CNIPA Official', '2026-07-01'),

-- Renewal
('CNIPA_TM_RENEWAL',
 (SELECT id FROM public.ip_offices WHERE code = 'CNIPA'),
 'trademark', 'renewal',
 'Renovación marca China', 'China trademark renewal',
 'Renovación cada 10 años desde fecha de registro.',
 'registration', NULL, NULL, 10, false,
 6, true, 12, false,
 'China Trademark Law Art. 40', 'https://english.cnipa.gov.cn/',
 '2026-01-26', 'CNIPA Official', '2026-07-01'),

-- Invalidation
('CNIPA_TM_INVALIDATION',
 (SELECT id FROM public.ip_offices WHERE code = 'CNIPA'),
 'trademark', 'response',
 'Solicitud invalidación', 'Invalidation request',
 'Plazo de 5 años para solicitar invalidación por derechos anteriores.',
 'registration', NULL, NULL, 5, false,
 NULL, false, NULL, false,
 'China Trademark Law Art. 45', 'https://english.cnipa.gov.cn/',
 '2026-01-26', 'CNIPA Official', '2026-07-01'),

-- Opposition response
('CNIPA_TM_OPPOSITION_RESPONSE',
 (SELECT id FROM public.ip_offices WHERE code = 'CNIPA'),
 'trademark', 'response',
 'Respuesta a oposición China', 'China opposition response',
 'Plazo de 30 días para responder a oposición.',
 'opposition_notification', NULL, 30, NULL, false,
 NULL, false, NULL, false,
 'China Trademark Law', 'https://english.cnipa.gov.cn/',
 '2026-01-26', 'CNIPA Official', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;

-- 4. JPO (Japan) Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, months_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Opposition
('JPO_TM_OPPOSITION',
 (SELECT id FROM public.ip_offices WHERE code = 'JPO'),
 'trademark', 'opposition',
 'Plazo oposición marca Japón', 'Japan trademark opposition period',
 'Período de 2 meses para presentar oposición tras publicación de registro.',
 'registration_publication', 2, NULL, false,
 NULL, false, NULL, false,
 'Japan Trademark Act Art. 43-2', 'https://www.jpo.go.jp/e/',
 '2026-01-26', 'JPO Official', '2026-07-01'),

-- Renewal
('JPO_TM_RENEWAL',
 (SELECT id FROM public.ip_offices WHERE code = 'JPO'),
 'trademark', 'renewal',
 'Renovación marca Japón', 'Japan trademark renewal',
 'Renovación cada 10 años desde fecha de registro.',
 'registration', NULL, 10, false,
 6, true, 6, false,
 'Japan Trademark Act Art. 19-20', 'https://www.jpo.go.jp/e/',
 '2026-01-26', 'JPO Official', '2026-07-01'),

-- Restoration
('JPO_TM_RESTORATION',
 (SELECT id FROM public.ip_offices WHERE code = 'JPO'),
 'trademark', 'restoration',
 'Restauración marca Japón', 'Japan trademark restoration',
 'Solicitud de restauración tras vencimiento no renovado.',
 'expiry', 6, NULL, false,
 NULL, false, NULL, false,
 'Japan Trademark Act', 'https://www.jpo.go.jp/e/',
 '2026-01-26', 'JPO Official', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;

-- 5. INPI Brazil Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, days_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Opposition
('INPI_BR_TM_OPPOSITION',
 (SELECT id FROM public.ip_offices WHERE code = 'INPI_BR'),
 'trademark', 'opposition',
 'Plazo oposición marca Brasil', 'Brazil trademark opposition period',
 'Período de 60 días para presentar oposición.',
 'publication', 60, NULL, false,
 NULL, false, NULL, false,
 'Lei 9.279/96 Art. 158', 'https://www.gov.br/inpi/',
 '2026-01-26', 'INPI Brasil', '2026-07-01'),

-- Renewal
('INPI_BR_TM_RENEWAL',
 (SELECT id FROM public.ip_offices WHERE code = 'INPI_BR'),
 'trademark', 'renewal',
 'Renovación marca Brasil', 'Brazil trademark renewal',
 'Renovación cada 10 años desde concesión. Solicitud desde 1 año antes.',
 'grant', NULL, 10, false,
 6, true, 12, false,
 'Lei 9.279/96 Art. 133', 'https://www.gov.br/inpi/',
 '2026-01-26', 'INPI Brasil', '2026-07-01'),

-- Office action response
('INPI_BR_TM_OFFICE_ACTION',
 (SELECT id FROM public.ip_offices WHERE code = 'INPI_BR'),
 'trademark', 'response',
 'Respuesta a exigencia INPI', 'INPI office action response',
 'Plazo de 60 días para responder a exigencias del examinador.',
 'notification', 60, NULL, false,
 NULL, false, NULL, false,
 'Lei 9.279/96', 'https://www.gov.br/inpi/',
 '2026-01-26', 'INPI Brasil', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;

-- 6. IMPI (Mexico) Deadlines
INSERT INTO public.legal_deadlines (
  code, office_id, right_type, deadline_category, name, name_en, description,
  trigger_event, months_offset, days_offset, years_offset, is_before_event,
  grace_period_months, grace_has_surcharge, window_start_months,
  is_extendable,
  legal_basis, legal_basis_url,
  last_verified_at, verified_source, next_review_at
) VALUES
-- Opposition
('IMPI_TM_OPPOSITION',
 (SELECT id FROM public.ip_offices WHERE code = 'IMPI'),
 'trademark', 'opposition',
 'Plazo oposición marca México', 'Mexico trademark opposition period',
 'Período de 1 mes para presentar oposición.',
 'publication', 1, NULL, NULL, false,
 NULL, false, NULL, false,
 'Ley Federal de Protección a la PI', 'https://www.gob.mx/impi',
 '2026-01-26', 'IMPI Oficial', '2026-07-01'),

-- Renewal
('IMPI_TM_RENEWAL',
 (SELECT id FROM public.ip_offices WHERE code = 'IMPI'),
 'trademark', 'renewal',
 'Renovación marca México', 'Mexico trademark renewal',
 'Renovación cada 10 años desde solicitud.',
 'filing', NULL, NULL, 10, false,
 6, true, 6, false,
 'Ley Federal de Protección a la PI', 'https://www.gob.mx/impi',
 '2026-01-26', 'IMPI Oficial', '2026-07-01'),

-- Use declaration (every 3 years)
('IMPI_TM_USE_DECLARATION',
 (SELECT id FROM public.ip_offices WHERE code = 'IMPI'),
 'trademark', 'declaration',
 'Declaración de uso México', 'Mexico use declaration',
 'Declaración de uso obligatoria cada 3 años desde concesión.',
 'registration', NULL, NULL, 3, false,
 NULL, false, NULL, false,
 'Ley Federal de Protección a la PI Art. 233', 'https://www.gob.mx/impi',
 '2026-01-26', 'IMPI Oficial', '2026-07-01'),

-- Response to office action
('IMPI_TM_OFFICE_ACTION',
 (SELECT id FROM public.ip_offices WHERE code = 'IMPI'),
 'trademark', 'response',
 'Respuesta a requerimiento IMPI', 'IMPI office action response',
 'Plazo de 2 meses para responder a requerimientos del examinador.',
 'notification', 2, NULL, NULL, false,
 NULL, false, NULL, false,
 'Ley Federal de Protección a la PI', 'https://www.gob.mx/impi',
 '2026-01-26', 'IMPI Oficial', '2026-07-01')

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  last_verified_at = EXCLUDED.last_verified_at;