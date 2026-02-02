-- =====================================================
-- JURISDICTION DOCUMENT REQUIREMENTS SYSTEM
-- Complete requirements catalog for 8 IP offices
-- =====================================================

-- =====================================================
-- 1. JURISDICTION DOCUMENT REQUIREMENTS
-- Stores requirements per jurisdiction/office
-- =====================================================
CREATE TABLE IF NOT EXISTS jurisdiction_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identification
  jurisdiction_code VARCHAR(10) NOT NULL, -- ES, EU, US, WO, CN, BR, JP, DE
  office_code VARCHAR(20) NOT NULL, -- OEPM, EUIPO, USPTO, WIPO, CNIPA, INPI, JPO, DPMA, EPO
  document_type VARCHAR(50) NOT NULL, -- power_of_attorney, application, assignment, etc.
  
  -- Basic requirements
  official_language VARCHAR(10) NOT NULL, -- es, en, de, zh, pt, ja, multi
  accepted_languages TEXT[] DEFAULT '{}', -- Additional accepted languages
  
  -- Power of Attorney requirements
  poa_required BOOLEAN DEFAULT false,
  poa_required_condition TEXT, -- 'foreign_applicant', 'always', 'never', etc.
  poa_form_code VARCHAR(50), -- Official form number if any
  poa_general_allowed BOOLEAN DEFAULT true,
  poa_specific_required BOOLEAN DEFAULT false,
  
  -- Signature requirements
  signature_type VARCHAR(30) NOT NULL DEFAULT 'simple',
  -- 'simple', 'electronic', 's_signature', 'qualified', 'seal', 'wet_signature'
  signature_notes TEXT,
  electronic_signature_accepted BOOLEAN DEFAULT true,
  seal_accepted BOOLEAN DEFAULT false, -- For CN, JP
  seal_preferred BOOLEAN DEFAULT false,
  
  -- Notarization & Legalization
  notarization_required BOOLEAN DEFAULT false,
  notarization_required_condition TEXT, -- When exactly required
  legalization_required BOOLEAN DEFAULT false,
  apostille_accepted BOOLEAN DEFAULT true,
  
  -- Document format
  paper_size VARCHAR(10) DEFAULT 'A4',
  image_max_size_mb NUMERIC(4,2) DEFAULT 8.00,
  image_min_dpi INT DEFAULT 300,
  image_max_dimensions VARCHAR(20), -- e.g., '8cm x 8cm'
  accepted_file_formats TEXT[] DEFAULT ARRAY['pdf', 'jpg', 'png'],
  
  -- Official forms
  has_official_form BOOLEAN DEFAULT false,
  official_form_url TEXT,
  official_form_number VARCHAR(50),
  
  -- Timing & Deadlines
  submission_deadline_days INT, -- Days after filing to submit
  validity_months INT, -- How long POA is valid
  
  -- Required fields (JSONB schema)
  required_fields JSONB DEFAULT '[]',
  /*
  [
    { "key": "applicant_name", "label_en": "Applicant Name", "label_es": "Nombre del solicitante", "required": true },
    { "key": "applicant_id", "label_en": "ID Number", "type": "text" },
    { "key": "representative_id", "label_en": "Registration Number", "type": "text" }
  ]
  */
  
  -- Validation rules (JSONB)
  validation_rules JSONB DEFAULT '[]',
  /*
  [
    { "field": "signature", "rule": "s_signature_format", "pattern": "/[A-Za-z ]+/" },
    { "field": "language", "rule": "must_be", "value": "zh" }
  ]
  */
  
  -- Notes and tips
  notes_en TEXT,
  notes_es TEXT,
  warnings TEXT[], -- Important warnings to display
  tips TEXT[], -- Best practices
  
  -- Reference URLs
  official_guidelines_url TEXT,
  form_download_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_verified_at TIMESTAMPTZ,
  verified_by UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(jurisdiction_code, office_code, document_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jdr_jurisdiction ON jurisdiction_document_requirements(jurisdiction_code);
CREATE INDEX IF NOT EXISTS idx_jdr_office ON jurisdiction_document_requirements(office_code);
CREATE INDEX IF NOT EXISTS idx_jdr_doc_type ON jurisdiction_document_requirements(document_type);
CREATE INDEX IF NOT EXISTS idx_jdr_active ON jurisdiction_document_requirements(is_active) WHERE is_active = true;

-- =====================================================
-- 2. DOCUMENT VALIDATION RULES
-- Detailed validation rules per requirement
-- =====================================================
CREATE TABLE IF NOT EXISTS document_validation_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requirement_id UUID NOT NULL REFERENCES jurisdiction_document_requirements(id) ON DELETE CASCADE,
  
  rule_code VARCHAR(50) NOT NULL, -- 'signature_format', 'language_check', 'field_required', etc.
  rule_type VARCHAR(30) NOT NULL, -- 'format', 'content', 'signature', 'language', 'field'
  
  -- Rule definition
  field_key VARCHAR(100), -- Which field to validate
  validation_type VARCHAR(30) NOT NULL, -- 'regex', 'required', 'length', 'enum', 'custom'
  validation_value TEXT, -- Regex pattern, min/max, enum values JSON
  
  -- Error messages
  error_message_en TEXT NOT NULL,
  error_message_es TEXT,
  
  -- Severity
  severity VARCHAR(20) DEFAULT 'error', -- 'error', 'warning', 'info'
  is_blocking BOOLEAN DEFAULT true, -- If true, document cannot be generated
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dvr_requirement ON document_validation_rules(requirement_id);
CREATE INDEX IF NOT EXISTS idx_dvr_active ON document_validation_rules(is_active) WHERE is_active = true;

-- =====================================================
-- 3. OFFICE-SPECIFIC DOCUMENT TEMPLATES
-- Templates linked to requirements
-- =====================================================
-- We'll link existing document_templates to requirements
ALTER TABLE document_templates 
ADD COLUMN IF NOT EXISTS jurisdiction_requirement_id UUID REFERENCES jurisdiction_document_requirements(id);

CREATE INDEX IF NOT EXISTS idx_dt_jurisdiction_req ON document_templates(jurisdiction_requirement_id);

-- =====================================================
-- 4. DOCUMENT VALIDATION RESULTS
-- Track validation history
-- =====================================================
CREATE TABLE IF NOT EXISTS document_validation_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Links
  generated_document_id UUID REFERENCES generated_documents(id) ON DELETE CASCADE,
  requirement_id UUID REFERENCES jurisdiction_document_requirements(id),
  
  -- Validation outcome
  is_valid BOOLEAN NOT NULL,
  validation_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Results
  errors JSONB DEFAULT '[]',
  warnings JSONB DEFAULT '[]',
  
  -- Context
  validated_by UUID,
  validation_method VARCHAR(30), -- 'auto', 'manual', 'ai'
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dvres_document ON document_validation_results(generated_document_id);
CREATE INDEX IF NOT EXISTS idx_dvres_valid ON document_validation_results(is_valid);

-- =====================================================
-- 5. ENABLE RLS
-- =====================================================
ALTER TABLE jurisdiction_document_requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_validation_results ENABLE ROW LEVEL SECURITY;

-- Requirements are public read (system data)
CREATE POLICY "Anyone can read jurisdiction requirements"
ON jurisdiction_document_requirements FOR SELECT
USING (true);

CREATE POLICY "Anyone can read validation rules"
ON document_validation_rules FOR SELECT
USING (true);

-- Validation results are tenant-scoped
CREATE POLICY "Users can read own validation results"
ON document_validation_results FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM generated_documents gd
    WHERE gd.id = document_validation_results.generated_document_id
    AND gd.organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can insert own validation results"
ON document_validation_results FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM generated_documents gd
    WHERE gd.id = document_validation_results.generated_document_id
    AND gd.organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  )
);

-- =====================================================
-- 6. SEED DATA - ALL 8 JURISDICTIONS
-- =====================================================

-- EUIPO (European Union)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, electronic_signature_accepted,
  notarization_required, legalization_required,
  has_official_form, official_form_url,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'EU', 'EUIPO', 'power_of_attorney',
  'en', ARRAY['en', 'fr', 'de', 'it', 'es'],
  false, 'optional_but_recommended', true,
  'simple', true,
  false, false,
  true, 'https://euipo.europa.eu/ohimportal/en/forms',
  '[
    {"key": "poa_type", "label_en": "Type", "label_es": "Tipo", "type": "select", "options": ["general", "individual"], "required": true},
    {"key": "principal_name", "label_en": "Principal Name", "label_es": "Nombre del poderdante", "required": true},
    {"key": "principal_id", "label_en": "Principal ID", "label_es": "ID del poderdante", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "label_es": "Dirección del poderdante", "required": true},
    {"key": "representative_name", "label_en": "Representative Name", "label_es": "Nombre del representante", "required": true},
    {"key": "representative_id", "label_en": "Professional List Number", "label_es": "Número de colegiado", "required": true},
    {"key": "sub_authorization", "label_en": "Sub-authorization allowed", "label_es": "Sub-autorización permitida", "type": "boolean", "required": false}
  ]'::jsonb,
  '[
    {"field": "representative_id", "rule": "required", "error_en": "Professional list number is required for EUIPO"}
  ]'::jsonb,
  'Power of Attorney is NOT mandatory for trademark applications but recommended. Simple electronic signature accepted.',
  'El Poder de Representación NO es obligatorio para solicitudes de marca pero se recomienda. Firma electrónica simple aceptada.',
  ARRAY['POA not required for filing but needed for some actions'],
  ARRAY['Use general POA to cover all future matters', 'Electronic filing via User Area preferred'],
  'https://guidelines.euipo.europa.eu'
),
(
  'EU', 'EUIPO', 'trademark_application',
  'en', ARRAY['en', 'fr', 'de', 'it', 'es'],
  false, NULL, true,
  'electronic', true,
  false, false,
  true, 'https://euipo.europa.eu/ohimportal/en/apply-now',
  '[
    {"key": "mark_type", "label_en": "Mark Type", "label_es": "Tipo de marca", "type": "select", "options": ["word", "figurative", "3d", "sound", "position", "pattern", "colour", "motion", "multimedia", "hologram"], "required": true},
    {"key": "mark_representation", "label_en": "Mark Representation", "label_es": "Representación de la marca", "type": "file", "required": true},
    {"key": "nice_classes", "label_en": "Nice Classes", "label_es": "Clases de Niza", "type": "array", "required": true},
    {"key": "goods_services", "label_en": "Goods/Services", "label_es": "Productos/Servicios", "type": "text", "required": true}
  ]'::jsonb,
  '[
    {"field": "mark_representation", "rule": "file_size", "value": "8MB", "error_en": "Image must be max 8MB"}
  ]'::jsonb,
  'Electronic filing via EUIPO User Area. No use requirement for registration.',
  'Presentación electrónica vía User Area de EUIPO. No se requiere prueba de uso.',
  ARRAY['8MB max for mark representation'],
  ARRAY['Use TMclass for goods/services descriptions', 'Pay online for faster processing'],
  'https://guidelines.euipo.europa.eu/2059742/2049265/trade-mark-guidelines'
),
(
  'EU', 'EUIPO', 'assignment',
  'en', ARRAY['en', 'fr', 'de', 'it', 'es'],
  false, NULL, true,
  'simple', true,
  false, false,
  true, 'https://euipo.europa.eu/ohimportal/en/forms',
  '[
    {"key": "assignor_name", "label_en": "Assignor Name", "label_es": "Nombre del cedente", "required": true},
    {"key": "assignee_name", "label_en": "Assignee Name", "label_es": "Nombre del cesionario", "required": true},
    {"key": "mark_number", "label_en": "Mark Number", "label_es": "Número de marca", "required": true},
    {"key": "consent", "label_en": "Both parties consent", "label_es": "Consentimiento de ambas partes", "type": "boolean", "required": true}
  ]'::jsonb,
  '[]'::jsonb,
  'Form TM16 for transfers. No notarization required.',
  'Formulario TM16 para transferencias. No requiere notarización.',
  ARRAY['Consent of both parties required'],
  ARRAY['File electronically for faster processing'],
  'https://guidelines.euipo.europa.eu'
);

-- USPTO (United States)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, signature_notes, electronic_signature_accepted,
  notarization_required, legalization_required,
  has_official_form, official_form_number, official_form_url,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'US', 'USPTO', 'power_of_attorney',
  'en', ARRAY['en'],
  true, 'required_if_represented', true,
  's_signature', 'Format: /First Last/ - Script signatures NOT accepted',
  true,
  false, false,
  true, 'PTO/AIA/82', 'https://www.uspto.gov/patents/apply/forms',
  '[
    {"key": "application_number", "label_en": "Application Number", "required": false},
    {"key": "filing_date", "label_en": "Filing Date", "type": "date", "required": false},
    {"key": "first_named_inventor", "label_en": "First Named Inventor", "required": false},
    {"key": "customer_number", "label_en": "Customer Number", "required": false},
    {"key": "practitioners", "label_en": "Practitioners (max 10)", "type": "array", "required": true},
    {"key": "correspondence_address", "label_en": "Correspondence Address", "required": true}
  ]'::jsonb,
  '[
    {"field": "signature", "rule": "s_signature", "pattern": "^/[A-Za-z .-]+/$", "error_en": "Signature must be in S-signature format: /Name/"},
    {"field": "practitioners", "rule": "max_count", "value": "10", "error_en": "Maximum 10 practitioners allowed per POA"}
  ]'::jsonb,
  'S-signature format required: /John Doe/. Max 10 practitioners per POA. Forms PTO/AIA/80, 82, 81 available.',
  'Formato S-signature requerido: /John Doe/. Máximo 10 profesionales por POA. Formularios PTO/AIA/80, 82, 81 disponibles.',
  ARRAY['Script signatures NOT accepted', 'Maximum 10 practitioners per POA'],
  ARRAY['Use Customer Number for easier management', 'Electronic filing via TEAS preferred'],
  'https://www.uspto.gov/trademarks/basics/power-attorney'
),
(
  'US', 'USPTO', 'trademark_application',
  'en', ARRAY['en'],
  true, 'if_represented', true,
  's_signature', 'S-signature required: /Name/',
  true,
  false, false,
  true, 'TEAS', 'https://www.uspto.gov/trademarks/apply',
  '[
    {"key": "mark_type", "label_en": "Mark Type", "type": "select", "options": ["standard_characters", "special_form", "sound", "3d"], "required": true},
    {"key": "basis", "label_en": "Filing Basis", "type": "select", "options": ["1a_use", "1b_intent", "44d_foreign", "44e_registration", "66a_madrid"], "required": true},
    {"key": "specimen", "label_en": "Specimen of Use", "type": "file", "required": false},
    {"key": "declaration", "label_en": "Declaration of Use", "type": "boolean", "required": false},
    {"key": "nice_classes", "label_en": "Classes", "type": "array", "required": true}
  ]'::jsonb,
  '[
    {"field": "specimen", "rule": "required_if", "condition": "basis=1a_use", "error_en": "Specimen required for use-based applications"},
    {"field": "declaration", "rule": "required_if", "condition": "basis=1a_use", "error_en": "Declaration required for use-based applications"}
  ]'::jsonb,
  'TEAS Plus ($250/class) or TEAS Standard ($350/class). Specimen required for use-based applications.',
  'TEAS Plus ($250/clase) o TEAS Standard ($350/clase). Se requiere specimen para solicitudes basadas en uso.',
  ARRAY['Specimen required for Section 1(a) applications', 'Strict ID requirements'],
  ARRAY['Use TEAS Plus for lower fees', 'File declaration of use on time'],
  'https://www.uspto.gov/trademarks/apply/trademark-applications'
);

-- OEPM (Spain)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, electronic_signature_accepted,
  notarization_required, legalization_required,
  has_official_form, official_form_number, official_form_url,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'ES', 'OEPM', 'power_of_attorney',
  'es', ARRAY['es'],
  true, 'required_for_non_eu_residents', true,
  'electronic', true,
  false, false,
  true, '3411', 'https://sede.oepm.gob.es/eSede/es/formularios',
  '[
    {"key": "principal_name", "label_en": "Principal Name", "label_es": "Apellidos y Nombre / Denominación Social", "required": true},
    {"key": "principal_nif", "label_en": "NIF/NIE/Passport", "label_es": "NIF/NIE/Pasaporte", "required": true},
    {"key": "principal_address", "label_en": "Full Address", "label_es": "Domicilio completo", "required": true},
    {"key": "principal_phone", "label_en": "Phone", "label_es": "Teléfono", "required": false},
    {"key": "principal_email", "label_en": "Email", "label_es": "Email", "required": false},
    {"key": "representative_type", "label_en": "Representative Type", "label_es": "Tipo de representante", "type": "select", "options": ["api", "other"], "required": true},
    {"key": "representative_number", "label_en": "Professional Number", "label_es": "Nº Colegiado", "required": false},
    {"key": "poa_scope", "label_en": "Scope", "label_es": "Alcance del poder", "type": "select", "options": ["general", "limited"], "required": true},
    {"key": "revoke_previous", "label_en": "Revoke Previous", "label_es": "Revoca poderes anteriores", "type": "boolean", "required": false}
  ]'::jsonb,
  '[
    {"field": "principal_nif", "rule": "spanish_id", "error_en": "Valid Spanish ID (NIF/NIE) or passport required", "error_es": "NIF/NIE español o pasaporte válido requerido"}
  ]'::jsonb,
  'Form 3411 for POA. Digital certificate required for electronic filing. 15% discount for e-filing.',
  'Formulario 3411 para Poder. Certificado digital requerido para presentación electrónica. 15% descuento por presentación electrónica.',
  ARRAY['Digital certificate required for e-filing'],
  ARRAY['Use general POA to cover all matters', '15% discount for electronic filing'],
  'https://www.oepm.es/es/signos_distintivos/marcas_nacionales/'
),
(
  'ES', 'OEPM', 'trademark_application',
  'es', ARRAY['es'],
  true, 'for_non_residents', true,
  'electronic', true,
  false, false,
  true, '4101', 'https://sede.oepm.gob.es/eSede/es/formularios',
  '[
    {"key": "mark_type", "label_en": "Mark Type", "label_es": "Tipo de marca", "type": "select", "options": ["denominativa", "grafica", "mixta", "tridimensional", "sonora", "posicion", "patron", "color", "movimiento", "multimedia", "holograma"], "required": true},
    {"key": "denomination", "label_en": "Denomination", "label_es": "Denominación", "required": false},
    {"key": "graphic_representation", "label_en": "Graphic Representation", "label_es": "Representación gráfica", "type": "file", "required": false},
    {"key": "nice_classes", "label_en": "Nice Classes", "label_es": "Clases de Niza", "type": "array", "required": true},
    {"key": "priority_claim", "label_en": "Priority Claim", "label_es": "Reivindicación de prioridad", "type": "boolean", "required": false}
  ]'::jsonb,
  '[
    {"field": "graphic_representation", "rule": "image_specs", "value": {"max_size": "8cm x 8cm", "min_dpi": 300}, "error_en": "Image must be max 8cm x 8cm, min 300 dpi", "error_es": "La imagen debe ser máx. 8cm x 8cm, mín. 300 dpi"}
  ]'::jsonb,
  'Form 4101 for trademark application. Image max 8cm x 8cm, min 300 dpi. Accepted formats: JPEG, TIFF, PDF.',
  'Formulario 4101 para solicitud de marca. Imagen máx. 8cm x 8cm, mín. 300 dpi. Formatos aceptados: JPEG, TIFF, PDF.',
  ARRAY['Image specifications strictly enforced'],
  ARRAY['File electronically for 15% fee discount', 'Use TMClass for goods/services'],
  'https://www.oepm.es/es/signos_distintivos/marcas_nacionales/'
);

-- EPO / DPMA (Europe/Germany)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, signature_notes, electronic_signature_accepted,
  notarization_required, notarization_required_condition, legalization_required,
  has_official_form, official_form_url,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'EP', 'EPO', 'power_of_attorney',
  'en', ARRAY['en', 'fr', 'de'],
  true, 'recommended', true,
  'wet_signature', 'Wet signature recommended for assignments and POAs. Text/facsimile signatures accepted with limitations.',
  false,
  false, 'recommended_for_assignments', false,
  false, 'https://www.epo.org/applying/forms-fees/forms.html',
  '[
    {"key": "principal_name", "label_en": "Principal Name", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "required": true},
    {"key": "representative_name", "label_en": "Representative Name", "required": true},
    {"key": "representative_number", "label_en": "EPI Number", "required": false},
    {"key": "scope", "label_en": "Scope", "type": "select", "options": ["general", "individual"], "required": true}
  ]'::jsonb,
  '[
    {"field": "signature", "rule": "wet_signature_recommended", "severity": "warning", "error_en": "Wet signature recommended for EPO POAs"}
  ]'::jsonb,
  'Text signature and facsimile signature accepted (OJ EPO 2021, A42). Wet signature recommended for assignments. Keep originals.',
  'Firma de texto y firma facsímil aceptadas (OJ EPO 2021, A42). Firma manuscrita recomendada para cesiones. Conservar originales.',
  ARRAY['Keep original signed documents', 'Wet signature recommended for important acts'],
  ARRAY['Professional Representatives can use enhanced e-signature', 'Keep originals for potential requests'],
  'https://www.epo.org/applying/online-services/signature-authentic.html'
),
(
  'DE', 'DPMA', 'power_of_attorney',
  'de', ARRAY['de'],
  true, 'required_for_non_residents', true,
  'wet_signature', 'Notarization required for irrevocable POAs. Certification of signature sufficient for revocable POAs.',
  false,
  true, 'irrevocable_powers_and_real_estate', false,
  true, 'https://www.dpma.de/marken/formulare/',
  '[
    {"key": "principal_name", "label_en": "Principal Name", "label_de": "Name des Vollmachtgebers", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "label_de": "Adresse des Vollmachtgebers", "required": true},
    {"key": "representative_name", "label_en": "Representative Name", "label_de": "Name des Vertreters", "required": true},
    {"key": "scope", "label_en": "Scope", "type": "select", "options": ["general", "specific"], "required": true}
  ]'::jsonb,
  '[
    {"field": "notarization", "rule": "required_if", "condition": "irrevocable=true", "error_en": "Notarization required for irrevocable powers"}
  ]'::jsonb,
  'German law (BGB) requires full notarization for irrevocable POAs. Revocable POAs need signature certification only.',
  'La ley alemana (BGB) requiere notarización completa para poderes irrevocables. Poderes revocables solo requieren certificación de firma.',
  ARRAY['Notarization required for irrevocable POAs', 'Language must be German'],
  ARRAY['Signature certification is sufficient for most cases', 'Use revocable POA when possible'],
  'https://www.dpma.de/service/formulare/'
);

-- WIPO Madrid System
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, electronic_signature_accepted,
  notarization_required, legalization_required,
  has_official_form, official_form_number, official_form_url,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'WO', 'WIPO', 'representative_appointment',
  'en', ARRAY['en', 'fr', 'es'],
  false, 'not_mandatory_but_only_one', false,
  'electronic', true,
  false, false,
  true, 'MM12', 'https://www.wipo.int/madrid/en/forms/',
  '[
    {"key": "registration_number", "label_en": "International Registration Number", "label_es": "Número de registro internacional", "required": true},
    {"key": "representative_name", "label_en": "Representative Name", "label_es": "Nombre del representante", "required": true},
    {"key": "representative_address", "label_en": "Representative Address", "label_es": "Dirección del representante", "required": true},
    {"key": "representative_email", "label_en": "Email (mandatory)", "label_es": "Email (obligatorio)", "type": "email", "required": true}
  ]'::jsonb,
  '[
    {"field": "representative_email", "rule": "required", "error_en": "Email is mandatory for WIPO representatives"}
  ]'::jsonb,
  'POA not mandatory. Only ONE representative at a time. Appointing new representative automatically cancels previous.',
  'El poder no es obligatorio. Solo UN representante a la vez. Nombrar nuevo representante cancela automáticamente el anterior.',
  ARRAY['Only ONE representative allowed', 'New appointment cancels previous'],
  ARRAY['Use eMadrid for electronic filing', 'Email is mandatory for representatives'],
  'https://www.wipo.int/madrid/en/members/rights.html'
),
(
  'WO', 'WIPO', 'international_application',
  'en', ARRAY['en', 'fr', 'es'],
  false, NULL, true,
  'electronic', true,
  false, false,
  true, 'MM2', 'https://www.wipo.int/madrid/en/forms/',
  '[
    {"key": "basic_mark_number", "label_en": "Basic Mark Number", "label_es": "Número de marca base", "required": true},
    {"key": "basic_mark_office", "label_en": "Office of Origin", "label_es": "Oficina de origen", "required": true},
    {"key": "designated_contracting_parties", "label_en": "Designated Parties", "label_es": "Partes designadas", "type": "array", "required": true},
    {"key": "goods_services", "label_en": "Goods/Services", "label_es": "Productos/Servicios", "required": true}
  ]'::jsonb,
  '[]'::jsonb,
  'Form MM2 submitted via Office of Origin. Each designated country may have additional requirements.',
  'Formulario MM2 presentado a través de la Oficina de origen. Cada país designado puede tener requisitos adicionales.',
  ARRAY['Submit through Office of Origin', 'Each designated country may require local representative'],
  ARRAY['Use Madrid Monitor for tracking', 'Check individual country requirements'],
  'https://www.wipo.int/madrid/en/how_to_file/'
);

-- CNIPA (China)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, signature_notes, electronic_signature_accepted, seal_accepted, seal_preferred,
  notarization_required, notarization_required_condition, legalization_required, apostille_accepted,
  has_official_form, official_form_url,
  submission_deadline_days,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'CN', 'CNIPA', 'power_of_attorney',
  'zh', ARRAY['zh'],
  true, 'required_for_foreigners', true,
  'seal', 'Company seal (chop) has more legal weight than signature in China',
  false, true, true,
  false, 'may_be_required_for_assignments', false, true,
  false, 'https://english.cnipa.gov.cn/',
  NULL,
  '[
    {"key": "principal_name_cn", "label_en": "Principal Name (Chinese)", "label_es": "Nombre del poderdante (chino)", "required": true},
    {"key": "principal_name_en", "label_en": "Principal Name (English)", "label_es": "Nombre del poderdante (inglés)", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "required": true},
    {"key": "agent_name", "label_en": "Chinese Agent Name", "label_es": "Nombre del agente chino", "required": true},
    {"key": "agent_license", "label_en": "Agent License Number", "required": true}
  ]'::jsonb,
  '[
    {"field": "language", "rule": "must_be", "value": "zh", "error_en": "All documents must be in Simplified Chinese"}
  ]'::jsonb,
  'All documents MUST be in Simplified Chinese. Company seal (chop) preferred over signature. Foreign companies need Chinese agent.',
  'Todos los documentos DEBEN estar en chino simplificado. Sello corporativo preferido sobre firma. Empresas extranjeras necesitan agente chino.',
  ARRAY['ALL documents must be in Simplified Chinese', 'Company seal (chop) has more legal weight than signature', 'Foreign applicants MUST use Chinese agent'],
  ARRAY['Use red company seal', 'Keep translations ready', 'China accepted Apostille in 2023'],
  'https://english.cnipa.gov.cn/'
),
(
  'CN', 'CNIPA', 'trademark_application',
  'zh', ARRAY['zh'],
  true, 'for_foreigners', true,
  'seal', 'Company seal preferred',
  false, true, true,
  false, NULL, false, true,
  true, 'https://english.cnipa.gov.cn/',
  NULL,
  '[
    {"key": "mark_type", "label_en": "Mark Type", "type": "select", "options": ["word", "device", "combination", "3d", "color", "sound"], "required": true},
    {"key": "mark_chinese", "label_en": "Chinese Characters (if any)", "required": false},
    {"key": "nice_classes", "label_en": "Classes", "type": "array", "required": true},
    {"key": "goods_services_cn", "label_en": "Goods/Services (Chinese)", "required": true}
  ]'::jsonb,
  '[
    {"field": "goods_services", "rule": "language", "value": "zh", "error_en": "Goods/services must be in Chinese"}
  ]'::jsonb,
  'CNIPA examines intent to use (Art. 4). Limited consent letters since 2021. All in Simplified Chinese.',
  'CNIPA examina intención de uso (Art. 4). Cartas de consentimiento limitadas desde 2021. Todo en chino simplificado.',
  ARRAY['Intent to use examined', 'Consent letters very limited since 2021'],
  ARRAY['Use standard Chinese descriptions when possible', 'Check for prior rights carefully'],
  'https://english.cnipa.gov.cn/'
);

-- INPI Brazil
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, signature_notes, electronic_signature_accepted,
  notarization_required, notarization_required_condition, legalization_required, apostille_accepted,
  has_official_form,
  submission_deadline_days,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'BR', 'INPI', 'power_of_attorney',
  'pt', ARRAY['pt'],
  true, 'required_for_foreigners', true,
  'simple', 'ICP-Brasil certificate required for Brazilian parties. Foreign parties: notarized + apostilled e-signature accepted.',
  true,
  false, 'not_required_for_trademark_poa', false, true,
  false,
  60,
  '[
    {"key": "principal_name", "label_en": "Principal Name", "label_es": "Nombre del poderdante", "label_pt": "Nome do outorgante", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "required": true},
    {"key": "representative_name", "label_en": "Representative Name", "label_pt": "Nome do procurador", "required": true},
    {"key": "representative_cpf_cnpj", "label_en": "CPF/CNPJ", "required": true}
  ]'::jsonb,
  '[
    {"field": "signature", "rule": "icp_brasil_or_notarized", "error_en": "Brazilian parties need ICP-Brasil certificate, foreigners need notarized + apostilled signature"}
  ]'::jsonb,
  'Simple POA for trademarks (no notarization since recent change). 60 days to submit after filing. Brazilian parties need ICP-Brasil certificate.',
  'Poder simple para marcas (sin notarización desde cambio reciente). 60 días para presentar después de la solicitud. Partes brasileñas necesitan certificado ICP-Brasil.',
  ARRAY['60 days deadline to submit POA', 'ICP-Brasil required for Brazilian signers', 'Foreign e-signatures must be notarized + apostilled'],
  ARRAY['File POA at time of application', 'Processing times are long (24-36 months)'],
  'https://www.gov.br/inpi/'
),
(
  'BR', 'INPI', 'assignment',
  'pt', ARRAY['pt'],
  true, NULL, true,
  'simple', 'Notarization + legalization/apostille required for assignment documents',
  true,
  true, 'required_for_assignment', true, true,
  false,
  NULL,
  '[
    {"key": "assignor_name", "label_en": "Assignor Name", "label_pt": "Nome do cedente", "required": true},
    {"key": "assignee_name", "label_en": "Assignee Name", "label_pt": "Nome do cessionário", "required": true},
    {"key": "mark_number", "label_en": "Mark Number", "required": true},
    {"key": "witnesses", "label_en": "Two Witnesses (with ID)", "label_pt": "Duas testemunhas (com identificação)", "required": true}
  ]'::jsonb,
  '[
    {"field": "witnesses", "rule": "count", "value": "2", "error_en": "Two witnesses with identification required"}
  ]'::jsonb,
  'Assignment requires: notarization + legalization/apostille. POA for assignee is simple (not notarized). Two witnesses required.',
  'Cesión requiere: notarización + legalización/apostilla. Poder del cesionario es simple (no notarizado). Dos testigos requeridos.',
  ARRAY['Notarization + apostille required for assignments', 'Two witnesses with ID required'],
  ARRAY['Prepare all documents in Portuguese', 'Processing time ~12 months'],
  'https://www.gov.br/inpi/'
);

-- JPO (Japan)
INSERT INTO jurisdiction_document_requirements (
  jurisdiction_code, office_code, document_type,
  official_language, accepted_languages,
  poa_required, poa_required_condition, poa_general_allowed,
  signature_type, signature_notes, electronic_signature_accepted, seal_accepted,
  notarization_required, notarization_required_condition, legalization_required,
  has_official_form,
  required_fields, validation_rules,
  notes_en, notes_es, warnings, tips,
  official_guidelines_url
) VALUES 
(
  'JP', 'JPO', 'power_of_attorney',
  'ja', ARRAY['ja'],
  true, 'required_for_non_residents', true,
  'wet_signature', 'Original wet signature required. If copy submitted, must be notarized. Hanko (seal) accepted.',
  false, true,
  true, 'notarization_required_for_copies', false,
  true,
  '[
    {"key": "principal_name_ja", "label_en": "Principal Name (Japanese)", "required": false},
    {"key": "principal_name_en", "label_en": "Principal Name (English/Romaji)", "required": true},
    {"key": "principal_address", "label_en": "Principal Address", "required": true},
    {"key": "representative_name", "label_en": "Japanese Representative", "required": true},
    {"key": "representative_registration", "label_en": "Registration Number", "required": true}
  ]'::jsonb,
  '[
    {"field": "signature", "rule": "original_or_notarized", "error_en": "Original wet signature required, or notarized copy"}
  ]'::jsonb,
  'Original wet signature or personal seal (Hanko) required. Copies must be notarized. Sworn translations may be required.',
  'Firma manuscrita original o sello personal (Hanko) requerido. Las copias deben estar notarizadas. Pueden requerirse traducciones juradas.',
  ARRAY['Original wet signature or Hanko required', 'Copies must be notarized', 'Sworn translations may be required'],
  ARRAY['Use Japanese patent attorney (Benrishi)', 'Keep original signed documents'],
  'https://www.jpo.go.jp/e/'
),
(
  'JP', 'JPO', 'trademark_application',
  'ja', ARRAY['ja'],
  true, 'for_non_residents', true,
  'wet_signature', 'Seal (Hanko) accepted as alternative to signature',
  false, true,
  false, NULL, false,
  true,
  '[
    {"key": "mark_type", "label_en": "Mark Type", "type": "select", "options": ["word", "device", "combined", "3d", "motion", "hologram", "color", "sound", "position"], "required": true},
    {"key": "mark_description_ja", "label_en": "Mark Description (Japanese)", "required": false},
    {"key": "nice_classes", "label_en": "Classes", "type": "array", "required": true},
    {"key": "designated_goods_ja", "label_en": "Designated Goods (Japanese)", "required": true}
  ]'::jsonb,
  '[]'::jsonb,
  'Japanese patent attorney (Benrishi) required for foreign applicants. All documents in Japanese.',
  'Se requiere abogado de patentes japonés (Benrishi) para solicitantes extranjeros. Todos los documentos en japonés.',
  ARRAY['All documents must be in Japanese', 'Japanese representative required'],
  ARRAY['Use certified Japanese patent attorney', 'Check similar marks carefully'],
  'https://www.jpo.go.jp/e/system/trademark/'
);

-- =====================================================
-- 7. UPDATE TRIGGER
-- =====================================================
CREATE OR REPLACE FUNCTION update_jurisdiction_requirements_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_jurisdiction_requirements ON jurisdiction_document_requirements;
CREATE TRIGGER trigger_update_jurisdiction_requirements
  BEFORE UPDATE ON jurisdiction_document_requirements
  FOR EACH ROW
  EXECUTE FUNCTION update_jurisdiction_requirements_timestamp();