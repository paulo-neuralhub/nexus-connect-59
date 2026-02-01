-- ════════════════════════════════════════════════════════════════════════════
-- SEED: SERVICE_CATEGORIES - 13 Categorías principales
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO service_categories (code, name_en, name_es, description_en, description_es, right_type, icon, color, display_order) VALUES
-- MARCAS
('TM_NEW', 'New Trademark Applications', 'Nuevas Solicitudes de Marca', 
 'Filing new trademark applications nationally and internationally',
 'Presentación de nuevas solicitudes de marca nacionales e internacionales',
 'trademark', '🆕', 'blue', 10),

('TM_PROS', 'Trademark Prosecution', 'Tramitación de Marcas',
 'Prosecution, office actions, oppositions during examination',
 'Tramitación, requerimientos, oposiciones durante examen',
 'trademark', '📝', 'indigo', 20),

('TM_MAINT', 'Trademark Maintenance', 'Mantenimiento de Marcas',
 'Renewals, declarations of use, maintenance filings',
 'Renovaciones, declaraciones de uso, mantenimiento',
 'trademark', '🔄', 'green', 30),

('TM_ENF', 'Trademark Enforcement', 'Protección de Marcas',
 'Oppositions against third parties, cancellations, litigation',
 'Oposiciones contra terceros, cancelaciones, litigios',
 'trademark', '⚔️', 'red', 40),

('TM_WATCH', 'Trademark Watching', 'Vigilancia de Marcas',
 'Monitoring services, watch notices, infringement detection',
 'Servicios de vigilancia, avisos, detección de infracciones',
 'trademark', '👁️', 'purple', 50),

-- PATENTES
('PT_NEW', 'New Patent Applications', 'Nuevas Solicitudes de Patente',
 'Filing new patents nationally, PCT, and regional',
 'Presentación de nuevas patentes nacionales, PCT y regionales',
 'patent', '💡', 'amber', 60),

('PT_PROS', 'Patent Prosecution', 'Tramitación de Patentes',
 'Prosecution, examination, amendments, appeals',
 'Tramitación, examen, enmiendas, recursos',
 'patent', '🔬', 'orange', 70),

('PT_MAINT', 'Patent Maintenance', 'Mantenimiento de Patentes',
 'Annuities, validations, maintenance fees',
 'Anualidades, validaciones, tasas de mantenimiento',
 'patent', '📅', 'teal', 80),

('PT_ENF', 'Patent Enforcement', 'Protección de Patentes',
 'Infringement, licensing, oppositions, litigation',
 'Infracciones, licencias, oposiciones, litigios',
 'patent', '⚖️', 'rose', 90),

-- DISEÑOS
('DS_NEW', 'Design Applications', 'Solicitudes de Diseño',
 'Industrial design registrations nationally and internationally',
 'Registros de diseño industrial nacionales e internacionales',
 'design', '🎨', 'pink', 100),

('DS_MAINT', 'Design Maintenance', 'Mantenimiento de Diseños',
 'Renewals and maintenance of registered designs',
 'Renovaciones y mantenimiento de diseños registrados',
 'design', '🖼️', 'fuchsia', 110),

-- OTROS
('OTHER_IP', 'Other IP Services', 'Otros Servicios PI',
 'Copyright, trade secrets, domain names, utility models',
 'Derechos de autor, secretos comerciales, dominios, modelos utilidad',
 'all', '📋', 'slate', 120),

('CONSULTING', 'IP Consulting', 'Consultoría PI',
 'Strategic consulting, portfolio audits, freedom to operate',
 'Consultoría estratégica, auditorías de cartera, libertad de operación',
 'all', '💼', 'gray', 130)

ON CONFLICT (code) DO UPDATE SET
  name_en = EXCLUDED.name_en,
  name_es = EXCLUDED.name_es,
  description_en = EXCLUDED.description_en,
  description_es = EXCLUDED.description_es,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color;

-- ════════════════════════════════════════════════════════════════════════════
-- SEED: SERVICE_TEMPLATES - Plantillas principales (50+)
-- ════════════════════════════════════════════════════════════════════════════

-- MARCAS NUEVAS - NACIONALES
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, jurisdiction_id, international_system, initial_phase, applicable_phases, auto_deadlines, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = v.cat_code),
  v.right_type, 
  (SELECT id FROM jurisdictions WHERE code = v.jur_code),
  v.int_system::text, v.initial_phase, v.phases::text[], v.deadlines::text[], v.tags::text[]
FROM (VALUES
  -- España
  ('TM_NEW_ES', 'New Trademark - Spain', 'Nueva Marca - España', 'TM_NEW', 'trademark', 'ES', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY['ES_TM_OPP'], ARRAY['spain','national','oepm']),
  ('TM_NEW_ES_FAST', 'New Trademark - Spain Fast Track', 'Nueva Marca - España Acelerada', 'TM_NEW', 'trademark', 'ES', 'none', 'F0', ARRAY['F0','F1','F2','F3','F6','F8','F9'], ARRAY[]::text[], ARRAY['spain','national','fast']),
  
  -- EUIPO
  ('TM_NEW_EU', 'New EU Trademark (EUTM)', 'Nueva Marca UE (MUTUE)', 'TM_NEW', 'trademark', 'EU', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY['EU_TM_OPP'], ARRAY['euipo','eutm','european']),
  ('TM_NEW_EU_FAST', 'New EUTM - Fast Track', 'Nueva MUTUE - Fast Track', 'TM_NEW', 'trademark', 'EU', 'none', 'F0', ARRAY['F0','F1','F2','F3','F6','F8','F9'], ARRAY[]::text[], ARRAY['euipo','eutm','fast']),
  
  -- USPTO
  ('TM_NEW_US_1A', 'New Trademark US - Use in Commerce (1a)', 'Nueva Marca US - Uso en Comercio (1a)', 'TM_NEW', 'trademark', 'US', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY['US_TM_OPP'], ARRAY['us','national','1a','use']),
  ('TM_NEW_US_1B', 'New Trademark US - Intent to Use (1b)', 'Nueva Marca US - Intención de Uso (1b)', 'TM_NEW', 'trademark', 'US', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY['US_TM_OPP','US_TM_SOU'], ARRAY['us','national','1b','itu']),
  
  -- UK
  ('TM_NEW_GB', 'New Trademark - UK', 'Nueva Marca - Reino Unido', 'TM_NEW', 'trademark', 'GB', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY[]::text[], ARRAY['uk','national','ukipo']),
  
  -- China
  ('TM_NEW_CN', 'New Trademark - China', 'Nueva Marca - China', 'TM_NEW', 'trademark', 'CN', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY[]::text[], ARRAY['china','national','cnipa']),
  
  -- Japan
  ('TM_NEW_JP', 'New Trademark - Japan', 'Nueva Marca - Japón', 'TM_NEW', 'trademark', 'JP', 'none', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], ARRAY[]::text[], ARRAY['japan','national','jpo'])
  
) AS v(code, name_en, name_es, cat_code, right_type, jur_code, int_system, initial_phase, phases, deadlines, tags)
ON CONFLICT (code) DO NOTHING;

-- MARCAS MADRID
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, jurisdiction_id, international_system, initial_phase, applicable_phases, auto_deadlines, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = 'TM_NEW'),
  'trademark', 
  (SELECT id FROM jurisdictions WHERE code = 'WO'),
  'madrid', 'F0', ARRAY['F0','F1','F2','F3','F4','F5','F6','F8','F9'], v.deadlines::text[], v.tags::text[]
FROM (VALUES
  ('TM_MADRID_NEW', 'New International Registration (Madrid)', 'Nuevo Registro Internacional (Madrid)', ARRAY['WO_DEPENDENCY'], ARRAY['madrid','international','wipo']),
  ('TM_MADRID_SUBSEQ', 'Subsequent Designation (Madrid)', 'Designación Posterior (Madrid)', ARRAY[]::text[], ARRAY['madrid','subsequent','wipo']),
  ('TM_MADRID_RENEW', 'IR Renewal (Madrid)', 'Renovación RI (Madrid)', ARRAY['WO_RENEWAL'], ARRAY['madrid','renewal','wipo'])
) AS v(code, name_en, name_es, deadlines, tags)
ON CONFLICT (code) DO NOTHING;

-- PATENTES NUEVAS
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, jurisdiction_id, international_system, initial_phase, applicable_phases, auto_deadlines, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = 'PT_NEW'),
  'patent', 
  (SELECT id FROM jurisdictions WHERE code = v.jur_code),
  v.int_system::text, 'F0', ARRAY['F0','F1','F2','F3','F4','F6','F7','F8','F9'], v.deadlines::text[], v.tags::text[]
FROM (VALUES
  -- Nacionales
  ('PT_NEW_ES', 'New Patent - Spain', 'Nueva Patente - España', 'ES', 'none', ARRAY['ES_PT_SUBEXAM'], ARRAY['spain','national','oepm']),
  ('PT_NEW_US', 'New Patent - US (Utility)', 'Nueva Patente - US (Utilidad)', 'US', 'none', ARRAY['US_PT_MAINT4','US_PT_MAINT8','US_PT_MAINT12'], ARRAY['us','national','uspto','utility']),
  ('PT_NEW_US_PROV', 'Provisional Application - US', 'Solicitud Provisional - US', 'US', 'none', ARRAY[]::text[], ARRAY['us','provisional','uspto']),
  ('PT_NEW_CN', 'New Patent - China', 'Nueva Patente - China', 'CN', 'none', ARRAY[]::text[], ARRAY['china','national','cnipa']),
  ('PT_NEW_JP', 'New Patent - Japan', 'Nueva Patente - Japón', 'JP', 'none', ARRAY[]::text[], ARRAY['japan','national','jpo']),
  
  -- PCT
  ('PT_PCT_NEW', 'PCT International Application', 'Solicitud Internacional PCT', 'WO', 'pct', ARRAY['PCT_NATPHASE30'], ARRAY['pct','international','wipo']),
  ('PT_PCT_NATPHASE', 'PCT National Phase Entry', 'Entrada Fase Nacional PCT', 'WO', 'pct', ARRAY[]::text[], ARRAY['pct','national-phase']),
  
  -- EPO
  ('PT_EP_DIRECT', 'Direct EP Application', 'Solicitud EP Directa', 'EP', 'none', ARRAY['EP_EXAM_REQ','EP_VALIDATION'], ARRAY['epo','european','direct']),
  ('PT_EP_EUROPCT', 'Euro-PCT (EP National Phase)', 'Euro-PCT (Fase Nacional EP)', 'EP', 'pct', ARRAY['EP_EXAM_REQ','EP_VALIDATION'], ARRAY['epo','european','pct'])
) AS v(code, name_en, name_es, jur_code, int_system, deadlines, tags)
ON CONFLICT (code) DO NOTHING;

-- TRAMITACIÓN Y PROSECUTION
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, international_system, initial_phase, applicable_phases, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = v.cat_code),
  v.right_type, 'none', 'F3', ARRAY['F3','F4','F5','F6','F9'], v.tags::text[]
FROM (VALUES
  -- Marcas
  ('TM_RESPONSE_OA', 'Response to Office Action (TM)', 'Respuesta a Requerimiento (Marca)', 'TM_PROS', 'trademark', ARRAY['prosecution','office-action','response']),
  ('TM_OPPOSITION_DEF', 'Opposition Defense', 'Defensa de Oposición', 'TM_PROS', 'trademark', ARRAY['prosecution','opposition','defense']),
  ('TM_OPPOSITION_FILE', 'File Opposition', 'Presentar Oposición', 'TM_ENF', 'trademark', ARRAY['enforcement','opposition','attack']),
  ('TM_CANCELLATION', 'Cancellation Proceeding', 'Procedimiento de Cancelación', 'TM_ENF', 'trademark', ARRAY['enforcement','cancellation']),
  ('TM_APPEAL', 'Appeal (TM)', 'Recurso (Marca)', 'TM_PROS', 'trademark', ARRAY['prosecution','appeal']),
  
  -- Patentes
  ('PT_RESPONSE_OA', 'Response to Office Action (PT)', 'Respuesta a Requerimiento (Patente)', 'PT_PROS', 'patent', ARRAY['prosecution','office-action','response']),
  ('PT_AMENDMENT', 'Claim Amendment', 'Enmienda de Reivindicaciones', 'PT_PROS', 'patent', ARRAY['prosecution','amendment','claims']),
  ('PT_DIVISIONAL', 'Divisional Application', 'Solicitud Divisional', 'PT_PROS', 'patent', ARRAY['prosecution','divisional']),
  ('PT_APPEAL', 'Appeal (PT)', 'Recurso (Patente)', 'PT_PROS', 'patent', ARRAY['prosecution','appeal'])
) AS v(code, name_en, name_es, cat_code, right_type, tags)
ON CONFLICT (code) DO NOTHING;

-- MANTENIMIENTO Y RENOVACIONES
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, international_system, initial_phase, applicable_phases, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = v.cat_code),
  v.right_type, 'none', 'F8', ARRAY['F8','F9'], v.tags::text[]
FROM (VALUES
  -- Marcas
  ('TM_RENEWAL', 'Trademark Renewal', 'Renovación de Marca', 'TM_MAINT', 'trademark', ARRAY['maintenance','renewal']),
  ('TM_RENEWAL_LATE', 'Late Trademark Renewal', 'Renovación Tardía de Marca', 'TM_MAINT', 'trademark', ARRAY['maintenance','renewal','late']),
  ('TM_DECL_USE_US', 'Declaration of Use (US §8)', 'Declaración de Uso (US §8)', 'TM_MAINT', 'trademark', ARRAY['maintenance','declaration','us','section8']),
  ('TM_INCONTESTABLE', 'Declaration of Incontestability (US §15)', 'Declaración Incontestabilidad (US §15)', 'TM_MAINT', 'trademark', ARRAY['maintenance','declaration','us','section15']),
  ('TM_ADDRESS_CHANGE', 'Change of Address', 'Cambio de Domicilio', 'TM_MAINT', 'trademark', ARRAY['maintenance','recordal','address']),
  ('TM_NAME_CHANGE', 'Change of Name', 'Cambio de Nombre', 'TM_MAINT', 'trademark', ARRAY['maintenance','recordal','name']),
  ('TM_ASSIGNMENT', 'Trademark Assignment', 'Cesión de Marca', 'TM_MAINT', 'trademark', ARRAY['maintenance','recordal','assignment']),
  ('TM_LICENSE', 'License Recordal', 'Registro de Licencia', 'TM_MAINT', 'trademark', ARRAY['maintenance','recordal','license']),
  
  -- Patentes
  ('PT_ANNUITY', 'Patent Annuity Payment', 'Pago de Anualidad de Patente', 'PT_MAINT', 'patent', ARRAY['maintenance','annuity']),
  ('PT_VALIDATION', 'EP Patent Validation', 'Validación de Patente EP', 'PT_MAINT', 'patent', ARRAY['maintenance','validation','epo']),
  ('PT_ASSIGNMENT', 'Patent Assignment', 'Cesión de Patente', 'PT_MAINT', 'patent', ARRAY['maintenance','recordal','assignment'])
) AS v(code, name_en, name_es, cat_code, right_type, tags)
ON CONFLICT (code) DO NOTHING;

-- VIGILANCIA
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, international_system, initial_phase, applicable_phases, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = 'TM_WATCH'),
  'trademark', 'none', 'F8', ARRAY['F8'], v.tags::text[]
FROM (VALUES
  ('TM_WATCH_IDENTICAL', 'Identical Mark Watch', 'Vigilancia Marca Idéntica', ARRAY['watching','identical']),
  ('TM_WATCH_SIMILAR', 'Similar Mark Watch', 'Vigilancia Marca Similar', ARRAY['watching','similar']),
  ('TM_WATCH_DOMAIN', 'Domain Name Watch', 'Vigilancia de Dominios', ARRAY['watching','domain']),
  ('TM_WATCH_COMPANY', 'Company Name Watch', 'Vigilancia de Nombres Comerciales', ARRAY['watching','company'])
) AS v(code, name_en, name_es, tags)
ON CONFLICT (code) DO NOTHING;

-- DISEÑOS
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, jurisdiction_id, international_system, initial_phase, applicable_phases, tags)
SELECT 
  v.code, v.name_en, v.name_es, 
  (SELECT id FROM service_categories WHERE code = v.cat_code),
  'design', 
  (SELECT id FROM jurisdictions WHERE code = v.jur_code),
  v.int_system::text, 'F0', ARRAY['F0','F1','F2','F3','F6','F8','F9'], v.tags::text[]
FROM (VALUES
  ('DS_NEW_ES', 'New Design - Spain', 'Nuevo Diseño - España', 'DS_NEW', 'ES', 'none', ARRAY['spain','national','oepm']),
  ('DS_NEW_EU', 'New EU Design (RCD)', 'Nuevo Diseño UE (DMC)', 'DS_NEW', 'EU', 'none', ARRAY['euipo','rcd','european']),
  ('DS_NEW_EU_DEFER', 'New EU Design - Deferred', 'Nuevo Diseño UE - Aplazado', 'DS_NEW', 'EU', 'none', ARRAY['euipo','rcd','deferred']),
  ('DS_HAGUE', 'Hague International Design', 'Diseño Internacional La Haya', 'DS_NEW', 'WO', 'hague', ARRAY['hague','international','wipo'])
) AS v(code, name_en, name_es, cat_code, jur_code, int_system, tags)
ON CONFLICT (code) DO NOTHING;

-- DESIGN RENEWAL (sin jurisdicción específica)
INSERT INTO service_templates (code, name_en, name_es, category_id, right_type, international_system, initial_phase, applicable_phases, tags)
VALUES (
  'DS_RENEWAL', 'Design Renewal', 'Renovación de Diseño', 
  (SELECT id FROM service_categories WHERE code = 'DS_MAINT'),
  'design', 'none', 'F8', ARRAY['F8','F9'], ARRAY['maintenance','renewal']
)
ON CONFLICT (code) DO NOTHING;