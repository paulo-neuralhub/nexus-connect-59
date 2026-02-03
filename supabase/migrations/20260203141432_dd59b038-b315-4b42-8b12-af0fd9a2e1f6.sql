-- ============================================================
-- SISTEMA DE TEMPLATES DE DOCUMENTOS - EXTENSIÓN DE TABLAS EXISTENTES
-- ============================================================

-- 1. Extender document_styles con nuevos campos
ALTER TABLE document_styles 
ADD COLUMN IF NOT EXISTS pack VARCHAR(20) DEFAULT 'Classic',
ADD COLUMN IF NOT EXISTS head_font VARCHAR(100) DEFAULT 'Plus Jakarta Sans, sans-serif',
ADD COLUMN IF NOT EXISTS body_font VARCHAR(100) DEFAULT 'Plus Jakarta Sans, sans-serif',
ADD COLUMN IF NOT EXISTS header_layout VARCHAR(20) DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_dark BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Renombrar css_variables a colors para consistencia (si existe css_variables)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.columns 
             WHERE table_name = 'document_styles' AND column_name = 'css_variables') THEN
    -- Añadir colors si no existe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'document_styles' AND column_name = 'colors') THEN
      ALTER TABLE document_styles ADD COLUMN colors JSONB;
    END IF;
    -- Copiar datos
    UPDATE document_styles SET colors = css_variables WHERE colors IS NULL;
  END IF;
END $$;

-- 2. Crear tabla document_types (si no existe)
CREATE TABLE IF NOT EXISTS document_types (
  id VARCHAR(30) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  name_en VARCHAR(50),
  icon VARCHAR(10),
  category VARCHAR(20) NOT NULL,
  description TEXT,
  fields_schema JSONB,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Crear tabla tenant_document_preferences
CREATE TABLE IF NOT EXISTS tenant_document_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  default_style_id UUID REFERENCES document_styles(id),
  company_name VARCHAR(200),
  company_legal_name VARCHAR(200),
  company_cif VARCHAR(30),
  company_address TEXT,
  company_city VARCHAR(100),
  company_postal_code VARCHAR(20),
  company_country VARCHAR(50),
  company_phone VARCHAR(30),
  company_email VARCHAR(100),
  company_website VARCHAR(200),
  company_iban VARCHAR(40),
  company_bank_name VARCHAR(100),
  company_logo_url TEXT,
  footer_text TEXT,
  payment_terms TEXT DEFAULT 'Pago a 30 días desde la fecha de emisión',
  legal_notice TEXT,
  invoice_prefix VARCHAR(20) DEFAULT 'INV',
  invoice_next_number INTEGER DEFAULT 1,
  quote_prefix VARCHAR(20) DEFAULT 'PRE',
  quote_next_number INTEGER DEFAULT 1,
  credit_note_prefix VARCHAR(20) DEFAULT 'NC',
  credit_note_next_number INTEGER DEFAULT 1,
  receipt_prefix VARCHAR(20) DEFAULT 'REC',
  receipt_next_number INTEGER DEFAULT 1,
  default_tax_rate DECIMAL(5,2) DEFAULT 21.00,
  tax_label VARCHAR(20) DEFAULT 'IVA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- 4. Extender generated_documents con campos faltantes
ALTER TABLE generated_documents
ADD COLUMN IF NOT EXISTS document_type_id VARCHAR(30) REFERENCES document_types(id),
ADD COLUMN IF NOT EXISTS style_id UUID REFERENCES document_styles(id),
ADD COLUMN IF NOT EXISTS contact_id UUID REFERENCES contacts(id),
ADD COLUMN IF NOT EXISTS invoice_id UUID,
ADD COLUMN IF NOT EXISTS document_data JSONB,
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS discount_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS total_amount DECIMAL(12,2),
ADD COLUMN IF NOT EXISTS currency VARCHAR(3) DEFAULT 'EUR',
ADD COLUMN IF NOT EXISTS document_date DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

-- Índices
CREATE INDEX IF NOT EXISTS idx_gen_docs_org ON generated_documents(organization_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_type ON generated_documents(document_type_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_matter ON generated_documents(matter_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_contact ON generated_documents(contact_id);
CREATE INDEX IF NOT EXISTS idx_gen_docs_number ON generated_documents(document_number);
CREATE INDEX IF NOT EXISTS idx_gen_docs_status ON generated_documents(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- document_types: catálogo público
ALTER TABLE document_types ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "types_public_read" ON document_types;
CREATE POLICY "types_public_read" ON document_types 
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "types_admin_manage" ON document_types;
CREATE POLICY "types_admin_manage" ON document_types 
  FOR ALL TO authenticated USING (is_backoffice_admin());

-- tenant_document_preferences: multi-tenant
ALTER TABLE tenant_document_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tenant_doc_prefs_select" ON tenant_document_preferences;
CREATE POLICY "tenant_doc_prefs_select" ON tenant_document_preferences
  FOR SELECT TO authenticated
  USING (organization_id = ANY(get_user_organization_ids()) OR is_backoffice_admin());

DROP POLICY IF EXISTS "tenant_doc_prefs_insert" ON tenant_document_preferences;
CREATE POLICY "tenant_doc_prefs_insert" ON tenant_document_preferences
  FOR INSERT TO authenticated
  WITH CHECK (organization_id = ANY(get_user_organization_ids()));

DROP POLICY IF EXISTS "tenant_doc_prefs_update" ON tenant_document_preferences;
CREATE POLICY "tenant_doc_prefs_update" ON tenant_document_preferences
  FOR UPDATE TO authenticated
  USING (organization_id = ANY(get_user_organization_ids()) OR is_backoffice_admin())
  WITH CHECK (organization_id = ANY(get_user_organization_ids()));

DROP POLICY IF EXISTS "tenant_doc_prefs_delete" ON tenant_document_preferences;
CREATE POLICY "tenant_doc_prefs_delete" ON tenant_document_preferences
  FOR DELETE TO authenticated
  USING (organization_id = ANY(get_user_organization_ids()) OR is_backoffice_admin());