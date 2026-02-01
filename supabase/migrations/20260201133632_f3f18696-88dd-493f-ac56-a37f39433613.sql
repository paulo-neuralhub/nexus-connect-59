-- ════════════════════════════════════════════════════════════════════════════
-- CREATE INDIA JURISDICTION + INSERT FIELDS FOR KR AND IN
-- ════════════════════════════════════════════════════════════════════════════

-- Crear India si no existe
INSERT INTO jurisdictions (
  code, name, name_en, jurisdiction_type, tier, region,
  ipo_name, office_acronym, supports_trademarks, supports_patents,
  supports_utility_models, supports_designs, is_madrid_member, is_pct_member,
  is_hague_member, is_paris_member, requires_local_agent, is_active, price_monthly
)
VALUES (
  'IN', 'India', 'India', 'country', 2, 'Asia',
  'Indian Patent Office', 'IPO', true, true,
  false, true, true, true,
  false, true, true, true, 0
)
ON CONFLICT (code) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- COREA DEL SUR (KR) - KIPO
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO jurisdiction_field_configs (
  jurisdiction_id, right_type, field_key, field_label_en, field_label_es,
  field_description, field_type, field_options, is_required, 
  visible_condition, field_group, display_order, grid_column
)
SELECT j.id, v.right_type, v.field_key, v.field_label_en, v.field_label_es,
       v.field_description, v.field_type, v.field_options::jsonb, v.is_required,
       v.visible_condition, v.field_group, v.display_order, v.grid_column
FROM jurisdictions j
CROSS JOIN (VALUES
  ('trademark', 'kr_korean_name', 'Korean Name', 'Nombre en Coreano',
   'Hangul representation', 'text', null,
   false, null, 'translation', 10, 'half'),
   
  ('trademark', 'kr_romanization', 'Romanization', 'Romanización',
   null, 'text', null,
   false, 'kr_korean_name', 'translation', 11, 'half'),
   
  ('trademark', 'kr_accelerated', 'Accelerated Examination', 'Examen Acelerado',
   'K-BranDi priority examination', 'checkbox', null,
   false, null, 'examination', 20, 'half'),
   
  ('trademark', 'kr_use_in_korea', 'Mark in Use in Korea', 'Marca en Uso en Corea',
   'Required for accelerated examination', 'checkbox', null,
   false, 'kr_accelerated === true', 'examination', 21, 'half'),
   
  ('patent', 'kr_examination_requested', 'Examination Requested', 'Examen Solicitado',
   'Must be requested within 3 years', 'checkbox', null,
   false, null, 'examination', 10, 'half'),
   
  ('patent', 'kr_accelerated_exam', 'Accelerated Examination', 'Examen Acelerado',
   null, 'checkbox', null,
   false, null, 'examination', 20, 'half'),
   
  ('patent', 'kr_pph', 'Patent Prosecution Highway', 'PPH',
   null, 'checkbox', null,
   false, null, 'examination', 21, 'half')
) AS v(right_type, field_key, field_label_en, field_label_es, field_description, 
       field_type, field_options, is_required, visible_condition, field_group, 
       display_order, grid_column)
WHERE j.code = 'KR'
ON CONFLICT (jurisdiction_id, right_type, field_key) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- INDIA (IN) - IPO
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO jurisdiction_field_configs (
  jurisdiction_id, right_type, field_key, field_label_en, field_label_es,
  field_description, field_type, field_options, is_required, 
  visible_condition, field_group, display_order, grid_column
)
SELECT j.id, v.right_type, v.field_key, v.field_label_en, v.field_label_es,
       v.field_description, v.field_type, v.field_options::jsonb, v.is_required,
       v.visible_condition, v.field_group, v.display_order, v.grid_column
FROM jurisdictions j
CROSS JOIN (VALUES
  ('trademark', 'in_user_affidavit', 'User Affidavit Filed', 'Declaración Jurada Usuario',
   'Required if claiming prior use', 'checkbox', null,
   false, null, 'filing', 10, 'half'),
   
  ('trademark', 'in_proposed_to_be_used', 'Proposed to be Used', 'Propuesto para Uso',
   'Mark not yet in use', 'checkbox', null,
   false, null, 'filing', 11, 'half'),
   
  ('trademark', 'in_expedited', 'Expedited Examination', 'Examen Expedito',
   'Available for startups and SMEs', 'checkbox', null,
   false, null, 'examination', 20, 'half'),
   
  ('patent', 'in_working_statement', 'Working Statement Filed', 'Declaración Explotación',
   'Annual working statement required', 'checkbox', null,
   false, null, 'compliance', 10, 'half'),
   
  ('patent', 'in_working_statement_due', 'Working Statement Due', 'Vencimiento Declaración',
   'Due annually by 31st March', 'date', null,
   false, null, 'compliance', 11, 'half'),
   
  ('patent', 'in_pre_grant_opposition', 'Pre-Grant Opposition Filed', 'Oposición Pre-Concesión',
   'Opposition before grant', 'checkbox', null,
   false, null, 'opposition', 20, 'half'),
   
  ('patent', 'in_post_grant_opposition', 'Post-Grant Opposition Filed', 'Oposición Post-Concesión',
   'Within 1 year of grant', 'checkbox', null,
   false, null, 'opposition', 21, 'half'),
   
  ('patent', 'in_convention_country', 'Convention Country', 'País Convenio',
   'Country of priority application', 'country_select', null,
   false, null, 'priority', 30, 'half')
) AS v(right_type, field_key, field_label_en, field_label_es, field_description, 
       field_type, field_options, is_required, visible_condition, field_group, 
       display_order, grid_column)
WHERE j.code = 'IN'
ON CONFLICT (jurisdiction_id, right_type, field_key) DO NOTHING;