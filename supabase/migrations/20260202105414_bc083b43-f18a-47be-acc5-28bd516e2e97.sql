-- =====================================================
-- OFFICE DOCUMENT REQUIREMENTS & TEMPLATE FIELD VALIDATIONS
-- Complete system for office-specific document generation
-- =====================================================

-- Add new columns to document_templates if not exist
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS office_code TEXT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS official_form_number TEXT;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS bilingual_content JSONB;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS validation_rules JSONB DEFAULT '{}';
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS applicable_offices TEXT[] DEFAULT '{}';
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS requires_signature BOOLEAN DEFAULT false;
ALTER TABLE document_templates ADD COLUMN IF NOT EXISTS signature_positions JSONB DEFAULT '[]';

-- Create index for office lookup
CREATE INDEX IF NOT EXISTS idx_document_templates_office ON document_templates(office_code) WHERE office_code IS NOT NULL;

-- =====================================================
-- OFFICE DOCUMENT REQUIREMENTS
-- =====================================================
CREATE TABLE IF NOT EXISTS office_document_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identification
  office_code TEXT NOT NULL,
  document_type TEXT NOT NULL,
  
  -- Requirements (JSONB for flexibility)
  requirements JSONB NOT NULL DEFAULT '{}',
  
  -- Associated template
  default_template_id UUID REFERENCES document_templates(id) ON DELETE SET NULL,
  
  -- Official form info
  official_form_number TEXT,
  official_form_url TEXT,
  last_verified_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(organization_id, office_code, document_type)
);

-- Enable RLS
ALTER TABLE office_document_requirements ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view org office requirements"
  ON office_document_requirements FOR SELECT
  USING (
    organization_id IS NULL OR
    organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage office requirements"
  ON office_document_requirements FOR ALL
  USING (
    organization_id IN (
      SELECT organization_id FROM memberships 
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );

-- Indexes
CREATE INDEX idx_office_requirements_office ON office_document_requirements(office_code);
CREATE INDEX idx_office_requirements_type ON office_document_requirements(document_type);
CREATE INDEX idx_office_requirements_org ON office_document_requirements(organization_id);

-- =====================================================
-- TEMPLATE FIELD VALIDATIONS
-- =====================================================
CREATE TABLE IF NOT EXISTS template_field_validations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES document_templates(id) ON DELETE CASCADE,
  
  -- Field identification
  field_name TEXT NOT NULL,
  field_label_es TEXT NOT NULL,
  field_label_en TEXT,
  
  -- Type and validation
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN DEFAULT false,
  
  -- Options for select fields
  options JSONB,
  
  -- Validation rules
  validation_regex TEXT,
  min_length INTEGER,
  max_length INTEGER,
  error_message_es TEXT,
  error_message_en TEXT,
  
  -- Auto-fill configuration
  auto_fill_from TEXT,
  
  -- Display
  display_order INTEGER DEFAULT 0,
  field_group TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE template_field_validations ENABLE ROW LEVEL SECURITY;

-- RLS policies (inherit from template)
CREATE POLICY "Users can view field validations"
  ON template_field_validations FOR SELECT
  USING (
    template_id IN (
      SELECT id FROM document_templates WHERE 
        organization_id IS NULL OR
        organization_id IN (SELECT organization_id FROM memberships WHERE user_id = auth.uid())
    )
  );

-- Index
CREATE INDEX idx_field_validations_template ON template_field_validations(template_id);

-- =====================================================
-- SEED: OFFICE REQUIREMENTS
-- =====================================================

-- EUIPO - Power of Attorney
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'EUIPO',
  'power_of_attorney',
  '{
    "mandatory_fields": ["applicant_name", "applicant_id", "applicant_address", "representative_name"],
    "optional_fields": ["representative_id_number", "sub_authorization_allowed"],
    "notarization_required": false,
    "legalization_required": false,
    "apostille_required": false,
    "language": "en",
    "accepted_languages": ["en", "fr", "de", "it", "es"],
    "signature_type": "simple",
    "electronic_signature_accepted": true,
    "special_notes": "POA not mandatory for EUTM applications but recommended for representation.",
    "office_flag": "🇪🇺",
    "office_color": "#003399"
  }',
  'EUIPO-POA',
  'https://euipo.europa.eu/tunnel-web/secure/webdav/guest/document_library/contentPdfs/forms_filings/all_downloadable_forms/pouvoir_en.pdf'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- USPTO - Power of Attorney (PTO/AIA/82)
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'USPTO',
  'power_of_attorney',
  '{
    "mandatory_fields": ["applicant_name", "applicant_address", "practitioner_name", "practitioner_registration_number"],
    "optional_fields": ["customer_number", "application_number"],
    "notarization_required": false,
    "legalization_required": false,
    "language": "en",
    "accepted_languages": ["en"],
    "signature_type": "s_signature",
    "signature_format": "/Full Legal Name/",
    "signature_regex": "^\\/[A-Za-z .\\-'']+\\/$",
    "electronic_signature_accepted": true,
    "special_notes": "Maximum 10 practitioners per POA. S-signature format required: /Name/",
    "max_practitioners": 10,
    "office_flag": "🇺🇸",
    "office_color": "#3C3B6E"
  }',
  'PTO/AIA/82',
  'https://www.uspto.gov/sites/default/files/documents/aia0082.pdf'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- OEPM - Poder de Representación (Form 3411)
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'OEPM',
  'power_of_attorney',
  '{
    "mandatory_fields": ["poderdante_nombre", "poderdante_nif", "poderdante_direccion", "representante_nombre"],
    "optional_fields": ["representante_numero_colegiado", "alcance_limitado"],
    "notarization_required": false,
    "legalization_required": false,
    "language": "es",
    "accepted_languages": ["es"],
    "signature_type": "simple",
    "electronic_signature_accepted": true,
    "electronic_certificate_required": true,
    "special_notes": "15% fee reduction for electronic filing. Digital certificate required.",
    "office_flag": "🇪🇸",
    "office_color": "#C60B1E"
  }',
  '3411',
  'https://www.oepm.es/export/sites/portal/comun/documentos_relacionados/PDF/3411X.pdf'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- WIPO Madrid - MM12
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'WIPO',
  'power_of_attorney',
  '{
    "mandatory_fields": ["holder_name", "holder_address", "representative_name", "representative_email", "international_registration_numbers"],
    "notarization_required": false,
    "legalization_required": false,
    "language": "en",
    "accepted_languages": ["en", "fr", "es"],
    "signature_type": "simple",
    "electronic_signature_accepted": true,
    "special_notes": "Only ONE representative allowed at a time. Use eMadrid portal for submission.",
    "max_representatives": 1,
    "office_flag": "🌍",
    "office_color": "#009EDB"
  }',
  'MM12',
  'https://www.wipo.int/madrid/en/forms/'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- CNIPA China
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'CNIPA',
  'power_of_attorney',
  '{
    "mandatory_fields": ["applicant_name_cn", "applicant_name_en", "applicant_address", "agent_name"],
    "notarization_required": false,
    "legalization_required": false,
    "apostille_required": false,
    "language": "zh",
    "accepted_languages": ["zh"],
    "translation_required": true,
    "signature_type": "seal_preferred",
    "electronic_signature_accepted": false,
    "special_notes": "Company seal (chop) has stronger legal weight than signature. Mandatory for foreign applicants.",
    "mandatory_for_foreigners": true,
    "office_flag": "🇨🇳",
    "office_color": "#DE2910"
  }',
  'CNIPA-POA',
  'https://english.cnipa.gov.cn'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- INPI Brasil
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'INPI_BR',
  'power_of_attorney',
  '{
    "mandatory_fields": ["outorgante_nome", "outorgante_endereco", "procurador_nome", "procurador_endereco"],
    "notarization_required": false,
    "legalization_required": false,
    "apostille_required": false,
    "language": "pt",
    "accepted_languages": ["pt"],
    "translation_required": true,
    "signature_type": "simple",
    "electronic_signature_accepted": true,
    "electronic_signature_requirements": "ICP-Brasil for Brazilians, notarized+apostilled for foreigners",
    "special_notes": "POA must be filed within 60 days of application. Notarization NOT required (recent change 2024).",
    "filing_deadline_days": 60,
    "mandatory_for_foreigners": true,
    "office_flag": "🇧🇷",
    "office_color": "#009B3A"
  }',
  'INPI-POA',
  'https://www.gov.br/inpi'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- JPO Japan
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'JPO',
  'power_of_attorney',
  '{
    "mandatory_fields": ["applicant_name", "applicant_address", "agent_name", "agent_address"],
    "notarization_required": true,
    "legalization_required": false,
    "language": "ja",
    "accepted_languages": ["ja"],
    "translation_required": true,
    "signature_type": "wet_signature",
    "seal_accepted": true,
    "electronic_signature_accepted": false,
    "special_notes": "Original wet signature required. Hanko (personal seal) accepted as alternative. Notarization recommended for important documents.",
    "office_flag": "🇯🇵",
    "office_color": "#BC002D"
  }',
  'JPO-POA',
  'https://www.jpo.go.jp/e/'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();

-- EPO - European Patent Office
INSERT INTO office_document_requirements (
  organization_id, office_code, document_type, requirements, official_form_number, official_form_url
) VALUES (
  NULL,
  'EPO',
  'power_of_attorney',
  '{
    "mandatory_fields": ["applicant_name", "applicant_address", "representative_name", "representative_epo_number"],
    "notarization_required": false,
    "legalization_required": false,
    "language": "en",
    "accepted_languages": ["en", "fr", "de"],
    "signature_type": "wet_signature",
    "electronic_signature_accepted": true,
    "electronic_signature_type": "qualified",
    "special_notes": "Keep original signed documents for possible requests. Qualified electronic signature (QES) accepted for professional representatives.",
    "office_flag": "🇪🇺",
    "office_color": "#004494"
  }',
  'EPO-POA',
  'https://www.epo.org/applying/forms.html'
) ON CONFLICT (organization_id, office_code, document_type) DO UPDATE SET
  requirements = EXCLUDED.requirements,
  updated_at = NOW();