-- =====================================================================
-- PROMPT STABILITY-01: RLS AUDIT FIX
-- Aplicar políticas RLS a las 5 tablas sin policies (TIPO D - Catálogos)
-- =====================================================================

-- 1. _backup_organization_offices (backup table - admin only)
ALTER TABLE _backup_organization_offices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "backup_org_offices_admin_only" ON _backup_organization_offices
  FOR ALL TO authenticated
  USING (is_backoffice_admin());

-- 2. correction_reason_codes (catálogo - lectura pública, gestión admin)
ALTER TABLE correction_reason_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "correction_reason_codes_public_read" ON correction_reason_codes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "correction_reason_codes_admin_manage" ON correction_reason_codes
  FOR ALL TO authenticated
  USING (is_backoffice_admin());

-- 3. document_styles (catálogo - lectura pública, gestión admin)
ALTER TABLE document_styles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "document_styles_public_read" ON document_styles
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "document_styles_admin_manage" ON document_styles
  FOR ALL TO authenticated
  USING (is_backoffice_admin());

-- 4. payment_method_codes (catálogo - lectura pública, gestión admin)
ALTER TABLE payment_method_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "payment_method_codes_public_read" ON payment_method_codes
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "payment_method_codes_admin_manage" ON payment_method_codes
  FOR ALL TO authenticated
  USING (is_backoffice_admin());

-- 5. relationship_to_party_mapping (catálogo - lectura pública, gestión admin)
ALTER TABLE relationship_to_party_mapping ENABLE ROW LEVEL SECURITY;

CREATE POLICY "relationship_to_party_mapping_public_read" ON relationship_to_party_mapping
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "relationship_to_party_mapping_admin_manage" ON relationship_to_party_mapping
  FOR ALL TO authenticated
  USING (is_backoffice_admin());