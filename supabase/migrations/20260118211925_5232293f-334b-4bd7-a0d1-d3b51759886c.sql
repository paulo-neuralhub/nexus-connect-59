-- =====================================================
-- PROYECTOS DE MIGRACIÓN
-- =====================================================
CREATE TABLE migration_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Identificación
  name TEXT NOT NULL,
  description TEXT,
  
  -- Sistema origen
  source_system TEXT NOT NULL CHECK (source_system IN (
    'patsnap',
    'anaqua',
    'cpa_global',
    'dennemeyer',
    'ipan',
    'thomson_compumark',
    'corsearch',
    'orbit',
    'darts_ip',
    'clarivate',
    'spreadsheet',
    'custom'
  )),
  source_system_version TEXT,
  
  -- Estado del proyecto
  status TEXT DEFAULT 'draft' CHECK (status IN (
    'draft',
    'mapping',
    'validating',
    'ready',
    'migrating',
    'completed',
    'failed',
    'cancelled'
  )),
  
  -- Progreso
  current_step INT DEFAULT 1,
  total_steps INT DEFAULT 6,
  
  -- Archivos subidos
  uploaded_files JSONB DEFAULT '[]',
  
  -- Mapeo global
  field_mapping JSONB DEFAULT '{}',
  
  -- Configuración
  config JSONB DEFAULT '{}',
  
  -- Estadísticas
  stats JSONB DEFAULT '{}',
  
  -- Errores
  errors JSONB DEFAULT '[]',
  
  -- Tiempos
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- =====================================================
-- ARCHIVOS DE MIGRACIÓN
-- =====================================================
CREATE TABLE migration_files (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES migration_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Archivo
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INT,
  file_format TEXT CHECK (file_format IN ('xlsx', 'csv', 'json', 'xml', 'zip')),
  
  -- Tipo de entidad
  entity_type TEXT NOT NULL CHECK (entity_type IN (
    'matters',
    'contacts',
    'companies',
    'deadlines',
    'documents',
    'invoices',
    'costs',
    'renewals',
    'notes',
    'history',
    'relationships',
    'mixed'
  )),
  
  -- Análisis del archivo
  analysis JSONB DEFAULT '{}',
  
  -- Mapeo específico
  column_mapping JSONB DEFAULT '{}',
  transformations JSONB DEFAULT '{}',
  
  -- Validación
  validation_status TEXT DEFAULT 'pending' CHECK (validation_status IN (
    'pending', 'analyzing', 'analyzed', 'validated', 'has_errors'
  )),
  validation_errors JSONB DEFAULT '[]',
  validation_warnings JSONB DEFAULT '[]',
  
  -- Estadísticas de migración
  total_rows INT DEFAULT 0,
  processed_rows INT DEFAULT 0,
  migrated_rows INT DEFAULT 0,
  failed_rows INT DEFAULT 0,
  skipped_rows INT DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- MAPEOS PREDEFINIDOS POR SISTEMA
-- =====================================================
CREATE TABLE migration_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Sistema
  source_system TEXT NOT NULL,
  source_system_version TEXT,
  
  -- Tipo de entidad
  entity_type TEXT NOT NULL,
  
  -- Mapeo predefinido
  default_mapping JSONB NOT NULL,
  
  -- Validaciones
  validation_rules JSONB DEFAULT '[]',
  
  -- Metadata
  is_verified BOOLEAN DEFAULT false,
  use_count INT DEFAULT 0,
  last_used_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LOG DE MIGRACIÓN
-- =====================================================
CREATE TABLE migration_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES migration_projects(id) ON DELETE CASCADE,
  file_id UUID REFERENCES migration_files(id) ON DELETE SET NULL,
  
  -- Tipo
  log_type TEXT NOT NULL CHECK (log_type IN (
    'info', 'warning', 'error', 'success'
  )),
  
  -- Mensaje
  message TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  
  -- Contexto
  entity_type TEXT,
  row_number INT,
  source_id TEXT,
  target_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- RELACIONES MIGRADAS
-- =====================================================
CREATE TABLE migration_id_mapping (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES migration_projects(id) ON DELETE CASCADE,
  
  -- IDs
  entity_type TEXT NOT NULL,
  source_id TEXT NOT NULL,
  target_id UUID NOT NULL,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(project_id, entity_type, source_id)
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX idx_migration_projects_org ON migration_projects(organization_id);
CREATE INDEX idx_migration_projects_status ON migration_projects(status);
CREATE INDEX idx_migration_files_project ON migration_files(project_id);
CREATE INDEX idx_migration_logs_project ON migration_logs(project_id);
CREATE INDEX idx_migration_id_mapping_lookup ON migration_id_mapping(project_id, entity_type, source_id);

-- =====================================================
-- RLS
-- =====================================================
ALTER TABLE migration_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE migration_id_mapping ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "migration_projects_org" ON migration_projects
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "migration_files_org" ON migration_files
  FOR ALL USING (organization_id IN (
    SELECT organization_id FROM memberships WHERE user_id = auth.uid()
  ));

CREATE POLICY "migration_templates_read" ON migration_templates
  FOR SELECT USING (true);

CREATE POLICY "migration_logs_org" ON migration_logs
  FOR ALL USING (project_id IN (
    SELECT id FROM migration_projects WHERE organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  ));

CREATE POLICY "migration_id_mapping_org" ON migration_id_mapping
  FOR ALL USING (project_id IN (
    SELECT id FROM migration_projects WHERE organization_id IN (
      SELECT organization_id FROM memberships WHERE user_id = auth.uid()
    )
  ));

-- =====================================================
-- DATOS INICIALES - TEMPLATES DE MAPEO
-- =====================================================
INSERT INTO migration_templates (source_system, entity_type, default_mapping, is_verified) VALUES
-- PatSnap
('patsnap', 'matters', '{
  "columns": {
    "Application Number": "reference",
    "Title": "title",
    "IP Type": "ip_type",
    "Legal Status": "status",
    "Filing Date": "filing_date",
    "Registration Date": "registration_date",
    "Expiration Date": "expiry_date",
    "Nice Classification": "classes",
    "Designated Countries": "territories",
    "Applicant": "client_name",
    "Attorney": "assigned_to_name"
  },
  "value_transformations": {
    "ip_type": { "TM": "trademark", "PAT": "patent", "DES": "design", "UM": "utility_model" },
    "status": { "Active": "active", "Pending": "pending", "Registered": "registered", "Expired": "expired", "Abandoned": "abandoned" }
  }
}', true),

-- Anaqua
('anaqua', 'matters', '{
  "columns": {
    "Reference": "reference",
    "Matter Title": "title",
    "Matter Type": "ip_type",
    "Status": "status",
    "File Date": "filing_date",
    "Registration Date": "registration_date",
    "Renewal Date": "expiry_date",
    "Classes": "classes",
    "Countries": "territories",
    "Client": "client_name"
  },
  "value_transformations": {
    "ip_type": { "Trademark": "trademark", "Patent": "patent", "Design": "design" },
    "status": { "Filed": "pending", "Registered": "registered", "Granted": "granted" }
  }
}', true),

-- CPA Global
('cpa_global', 'matters', '{
  "columns": {
    "Case Ref": "reference",
    "Case Name": "title",
    "Type": "ip_type",
    "Current Status": "status",
    "Filing Date": "filing_date",
    "Grant Date": "registration_date",
    "Next Renewal": "expiry_date",
    "Class List": "classes",
    "Country List": "territories"
  },
  "value_transformations": {
    "ip_type": { "TM": "trademark", "PT": "patent", "DS": "design" }
  }
}', true),

-- Dennemeyer
('dennemeyer', 'matters', '{
  "columns": {
    "Ref No": "reference",
    "Title": "title",
    "IP Right Type": "ip_type",
    "Status": "status",
    "Application Date": "filing_date",
    "Registration Date": "registration_date",
    "Expiry Date": "expiry_date",
    "Nice Classes": "classes",
    "Designated Countries": "territories"
  },
  "value_transformations": {}
}', true),

-- Spreadsheet genérico
('spreadsheet', 'matters', '{
  "columns": {
    "Reference": "reference",
    "Referencia": "reference",
    "Ref": "reference",
    "Title": "title",
    "Título": "title",
    "Name": "title",
    "Nombre": "title",
    "Type": "ip_type",
    "Tipo": "ip_type",
    "IP Type": "ip_type",
    "Status": "status",
    "Estado": "status",
    "Filing Date": "filing_date",
    "Fecha Solicitud": "filing_date",
    "Registration Date": "registration_date",
    "Fecha Registro": "registration_date",
    "Expiry Date": "expiry_date",
    "Fecha Vencimiento": "expiry_date",
    "Classes": "classes",
    "Clases": "classes",
    "Nice Classes": "classes",
    "Countries": "territories",
    "Países": "territories",
    "Territories": "territories"
  },
  "value_transformations": {
    "ip_type": {
      "Trademark": "trademark", "Marca": "trademark", "TM": "trademark",
      "Patent": "patent", "Patente": "patent", "PAT": "patent",
      "Design": "design", "Diseño": "design", "DES": "design"
    }
  }
}', true),

-- Contacts para todos los sistemas
('spreadsheet', 'contacts', '{
  "columns": {
    "Name": "name",
    "Nombre": "name",
    "Full Name": "name",
    "Email": "email",
    "Correo": "email",
    "E-mail": "email",
    "Phone": "phone",
    "Teléfono": "phone",
    "Tel": "phone",
    "Company": "company_name",
    "Empresa": "company_name",
    "Organization": "company_name",
    "Position": "position",
    "Cargo": "position",
    "Title": "position",
    "Address": "address",
    "Dirección": "address",
    "City": "city",
    "Ciudad": "city",
    "Country": "country",
    "País": "country"
  },
  "value_transformations": {}
}', true);