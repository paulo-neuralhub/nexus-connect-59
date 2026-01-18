export type SourceSystem = 
  | 'patsnap' 
  | 'anaqua' 
  | 'cpa_global' 
  | 'dennemeyer' 
  | 'ipan' 
  | 'thomson_compumark' 
  | 'corsearch' 
  | 'orbit' 
  | 'darts_ip' 
  | 'clarivate' 
  | 'spreadsheet' 
  | 'custom';

export type MigrationStatus = 
  | 'draft' 
  | 'mapping' 
  | 'validating' 
  | 'ready' 
  | 'migrating' 
  | 'completed' 
  | 'failed' 
  | 'cancelled';

export type MigrationEntityType = 
  | 'matters' 
  | 'contacts' 
  | 'companies' 
  | 'deadlines' 
  | 'documents' 
  | 'invoices' 
  | 'costs' 
  | 'renewals' 
  | 'notes' 
  | 'history' 
  | 'relationships' 
  | 'mixed';

export type MigrationValidationStatus = 
  | 'pending' 
  | 'analyzing' 
  | 'analyzed' 
  | 'validated' 
  | 'has_errors';

export interface MigrationProject {
  id: string;
  organization_id: string;
  name: string;
  description: string | null;
  source_system: SourceSystem;
  source_system_version: string | null;
  status: MigrationStatus;
  current_step: number;
  total_steps: number;
  uploaded_files: UploadedMigrationFile[];
  field_mapping: Record<string, Record<string, string>>;
  config: MigrationConfig;
  stats: MigrationStats;
  errors: MigrationError[];
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UploadedMigrationFile {
  name: string;
  url: string;
  type: MigrationEntityType;
  rows: number;
}

export interface MigrationConfig {
  date_format?: string;
  duplicate_handling?: 'skip' | 'update' | 'create_new';
  preserve_ids?: boolean;
  migrate_documents?: boolean;
  migrate_history?: boolean;
}

export interface MigrationStats {
  [entityType: string]: {
    total: number;
    migrated: number;
    failed: number;
  };
}

export interface MigrationError {
  row?: number;
  entity_type?: string;
  source_id?: string;
  field?: string;
  error: string;
  value?: string;
}

export interface MigrationFile {
  id: string;
  project_id: string;
  organization_id: string;
  file_name: string;
  file_url: string;
  file_size: number | null;
  file_format: 'xlsx' | 'csv' | 'json' | 'xml' | 'zip' | null;
  entity_type: MigrationEntityType;
  analysis: FileAnalysis;
  column_mapping: Record<string, string>;
  transformations: Record<string, Record<string, string>>;
  validation_status: MigrationValidationStatus;
  validation_errors: MigrationValidationError[];
  validation_warnings: MigrationValidationWarning[];
  total_rows: number;
  processed_rows: number;
  migrated_rows: number;
  failed_rows: number;
  skipped_rows: number;
  created_at: string;
}

export interface FileAnalysis {
  total_rows: number;
  columns: string[];
  sample_data: any[];
  detected_types: Record<string, string>;
  null_counts: Record<string, number>;
  unique_counts: Record<string, number>;
}

export interface MigrationValidationError {
  row: number;
  column: string;
  error: string;
  value: string;
}

export interface MigrationValidationWarning {
  row?: number;
  column?: string;
  warning: string;
  suggestion?: string;
}

export interface MigrationTemplate {
  id: string;
  source_system: SourceSystem;
  source_system_version: string | null;
  entity_type: MigrationEntityType;
  default_mapping: {
    columns: Record<string, string>;
    value_transformations: Record<string, Record<string, string>>;
  };
  validation_rules: any[];
  is_verified: boolean;
  use_count: number;
  last_used_at: string | null;
  created_at: string;
}

export interface MigrationLog {
  id: string;
  project_id: string;
  file_id: string | null;
  log_type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details: Record<string, any>;
  entity_type: string | null;
  row_number: number | null;
  source_id: string | null;
  target_id: string | null;
  created_at: string;
}

// Información de sistemas origen
export const SOURCE_SYSTEMS: Record<SourceSystem, {
  name: string;
  logo?: string;
  description: string;
  exportFormats: string[];
}> = {
  patsnap: {
    name: 'PatSnap',
    description: 'Plataforma de inteligencia de patentes',
    exportFormats: ['xlsx', 'csv'],
  },
  anaqua: {
    name: 'Anaqua',
    description: 'Software de gestión de PI enterprise',
    exportFormats: ['xlsx', 'csv', 'xml'],
  },
  cpa_global: {
    name: 'CPA Global',
    description: 'Servicios de renovación y gestión de PI',
    exportFormats: ['xlsx', 'csv'],
  },
  dennemeyer: {
    name: 'Dennemeyer',
    description: 'Servicios de PI y gestión de portfolio',
    exportFormats: ['xlsx', 'csv'],
  },
  ipan: {
    name: 'IPAN',
    description: 'Sistema de gestión de marcas',
    exportFormats: ['xlsx'],
  },
  thomson_compumark: {
    name: 'Thomson CompuMark',
    description: 'Búsquedas y vigilancia de marcas',
    exportFormats: ['xlsx', 'csv'],
  },
  corsearch: {
    name: 'Corsearch',
    description: 'Protección de marcas y dominios',
    exportFormats: ['xlsx', 'csv'],
  },
  orbit: {
    name: 'Questel Orbit',
    description: 'Inteligencia de patentes y análisis',
    exportFormats: ['xlsx', 'csv', 'xml'],
  },
  darts_ip: {
    name: 'Darts-IP',
    description: 'Base de datos de litigios de PI',
    exportFormats: ['xlsx', 'csv'],
  },
  clarivate: {
    name: 'Clarivate',
    description: 'Analítica de PI y gestión de portfolio',
    exportFormats: ['xlsx', 'csv'],
  },
  spreadsheet: {
    name: 'Excel / CSV',
    description: 'Hojas de cálculo genéricas',
    exportFormats: ['xlsx', 'csv'],
  },
  custom: {
    name: 'Otro Sistema',
    description: 'Sistema personalizado o propietario',
    exportFormats: ['xlsx', 'csv', 'json', 'xml'],
  },
};

// Entity types para migración
export const MIGRATION_ENTITY_TYPES: Record<MigrationEntityType, {
  label: string;
  description: string;
  icon: string;
}> = {
  matters: {
    label: 'Expedientes',
    description: 'Marcas, patentes, diseños',
    icon: 'FileText',
  },
  contacts: {
    label: 'Contactos',
    description: 'Clientes y agentes',
    icon: 'Users',
  },
  companies: {
    label: 'Empresas',
    description: 'Compañías y organizaciones',
    icon: 'Building2',
  },
  deadlines: {
    label: 'Plazos',
    description: 'Fechas límite y renovaciones',
    icon: 'Calendar',
  },
  documents: {
    label: 'Documentos',
    description: 'Archivos y adjuntos',
    icon: 'File',
  },
  invoices: {
    label: 'Facturas',
    description: 'Facturas emitidas',
    icon: 'Receipt',
  },
  costs: {
    label: 'Costes',
    description: 'Gastos y honorarios',
    icon: 'DollarSign',
  },
  renewals: {
    label: 'Renovaciones',
    description: 'Historial de renovaciones',
    icon: 'RefreshCw',
  },
  notes: {
    label: 'Notas',
    description: 'Notas y comentarios',
    icon: 'MessageSquare',
  },
  history: {
    label: 'Historial',
    description: 'Registro de cambios',
    icon: 'History',
  },
  relationships: {
    label: 'Relaciones',
    description: 'Vínculos entre entidades',
    icon: 'Link',
  },
  mixed: {
    label: 'Mixto',
    description: 'Múltiples tipos de datos',
    icon: 'Layers',
  },
};

// Target fields para matters
export const MATTER_TARGET_FIELDS = [
  { value: 'reference', label: 'Referencia', required: true },
  { value: 'title', label: 'Título', required: true },
  { value: 'type', label: 'Tipo (marca/patente/diseño)', required: true },
  { value: 'status', label: 'Estado', required: false },
  { value: 'jurisdiction', label: 'Jurisdicción', required: false },
  { value: 'application_number', label: 'Número de solicitud', required: false },
  { value: 'registration_number', label: 'Número de registro', required: false },
  { value: 'filing_date', label: 'Fecha de solicitud', required: false },
  { value: 'registration_date', label: 'Fecha de registro', required: false },
  { value: 'expiry_date', label: 'Fecha de vencimiento', required: false },
  { value: 'next_renewal_date', label: 'Próxima renovación', required: false },
  { value: 'mark_name', label: 'Nombre de marca', required: false },
  { value: 'mark_type', label: 'Tipo de marca', required: false },
  { value: 'nice_classes', label: 'Clases de Niza', required: false },
  { value: 'goods_services', label: 'Productos/Servicios', required: false },
  { value: 'owner_name', label: 'Titular', required: false },
  { value: 'notes', label: 'Notas', required: false },
  { value: 'tags', label: 'Etiquetas', required: false },
];

// Target fields para contacts
export const CONTACT_TARGET_FIELDS = [
  { value: 'name', label: 'Nombre', required: true },
  { value: 'email', label: 'Email', required: false },
  { value: 'phone', label: 'Teléfono', required: false },
  { value: 'mobile', label: 'Móvil', required: false },
  { value: 'company_name', label: 'Empresa', required: false },
  { value: 'job_title', label: 'Cargo', required: false },
  { value: 'address_line1', label: 'Dirección', required: false },
  { value: 'city', label: 'Ciudad', required: false },
  { value: 'state', label: 'Provincia/Estado', required: false },
  { value: 'postal_code', label: 'Código Postal', required: false },
  { value: 'country', label: 'País', required: false },
  { value: 'notes', label: 'Notas', required: false },
  { value: 'tags', label: 'Etiquetas', required: false },
];
