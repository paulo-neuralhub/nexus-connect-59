// Document types for the storage system
// ============================================================
// Extended for PROMPT 5: Document & Template Management
// ============================================================

// Original DocumentType (for backwards compatibility)
export type DocumentType = 
  | 'application'
  | 'certificate'
  | 'logo'
  | 'correspondence'
  | 'invoice'
  | 'contract'
  | 'power_of_attorney'
  | 'search_report'
  | 'office_action'
  | 'response'
  | 'other';

// Extended category for PI document templates
export type DocumentCategory =
  | 'power_of_attorney'
  | 'assignment'
  | 'declaration'
  | 'filing'
  | 'correspondence'
  | 'official'
  | 'invoice'
  | 'report'
  | 'contract'
  | 'certificate'
  | 'evidence'
  | 'other';

// Document workflow type
export type MatterDocumentType =
  | 'generated'
  | 'uploaded'
  | 'received'
  | 'sent'
  | 'internal';

// Document status
export type DocumentStatus =
  | 'draft'
  | 'active'
  | 'superseded'
  | 'archived'
  | 'deleted';

// Signature status
export type SignatureStatus =
  | 'pending'
  | 'signed'
  | 'rejected'
  | 'not_required';

// Template format
export type TemplateFormat = 'docx' | 'pdf' | 'html' | 'txt' | 'xlsx';

// Signature type
export type SignatureType = 'client' | 'attorney' | 'both' | 'none';

// ============================================================
// PI Document Template
// ============================================================
export interface PIDocumentTemplate {
  id: string;
  code: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  category: DocumentCategory;
  right_type: string | null;
  jurisdiction_id: string | null;
  typical_phase: string | null;
  format: TemplateFormat;
  template_content: string | null;
  template_file_url: string | null;
  variable_codes: string[];
  is_required_for: string[];
  auto_generate_on_phase: string | null;
  requires_signature: boolean;
  signature_type: SignatureType | null;
  available_languages: string[];
  tags: string[];
  is_active: boolean;
  display_order: number;
  
  // Joined
  jurisdiction?: {
    id: string;
    code: string;
    name_en: string;
  };
}

// ============================================================
// Matter Document (extended for workflow)
// ============================================================
export interface MatterDocument {
  id: string;
  matter_id: string;
  organization_id: string;
  template_id: string | null;
  name: string;
  description: string | null;
  category: DocumentCategory | string;
  document_type: MatterDocumentType;
  storage_path: string;
  file_path?: string; // Legacy alias
  file_name: string;
  file_size: number | null;
  mime_type: string | null;
  file_extension: string | null;
  file_hash: string | null;
  status: DocumentStatus;
  created_in_phase: string | null;
  document_date: string | null;
  received_date: string | null;
  sent_date: string | null;
  requires_signature: boolean;
  signature_status: SignatureStatus | null;
  signed_by: string | null;
  signed_at: string | null;
  correspondent: string | null;
  correspondent_reference: string | null;
  language: string;
  tags: string[];
  notes: string | null;
  internal_notes: string | null;
  version: number;
  parent_document_id: string | null;
  is_confidential: boolean;
  visible_to_client: boolean;
  created_by: string | null;
  uploaded_by?: string | null; // Legacy alias
  created_at: string;
  updated_at: string;
  
  // OCR/Extraction
  extraction_id?: string | null;
  extraction_status?: string | null;
  ocr_text?: string | null;
  is_official?: boolean;
  expiry_date?: string | null;
  
  // Joined
  template?: PIDocumentTemplate;
  creator?: {
    id: string;
    full_name: string;
  };
}

// ============================================================
// Document Version (for history)
// ============================================================
export interface DocumentVersion {
  id: string;
  document_id: string;
  version_number: number;
  storage_path: string;
  file_name: string;
  file_size: number | null;
  file_hash: string | null;
  change_summary: string | null;
  created_by: string | null;
  created_at: string;
}

// ============================================================
// Template Variable (for substitution)
// ============================================================
export interface TemplateVariable {
  id: string;
  code: string;
  name_en: string;
  name_es: string;
  description_en: string | null;
  description_es: string | null;
  category: string;
  source_table: string | null;
  source_field: string | null;
  source_path: string | null;
  format_type: 'text' | 'date' | 'number' | 'currency' | 'list' | 'boolean';
  format_pattern: string | null;
  transform: string | null;
  default_value: string | null;
  example_value: string | null;
  is_active: boolean;
}

// ============================================================
// Document Filters
// ============================================================
export interface DocumentFilters {
  category?: DocumentCategory[];
  documentType?: MatterDocumentType[];
  status?: DocumentStatus[];
  search?: string;
  dateFrom?: string;
  dateTo?: string;
}

// ============================================================
// Document Category Metadata
// ============================================================
export const DOCUMENT_CATEGORIES: Record<DocumentCategory, {
  label: string;
  labelEs: string;
  icon: string;
  color: string;
}> = {
  power_of_attorney: { label: 'Power of Attorney', labelEs: 'Poder', icon: '📜', color: 'blue' },
  assignment: { label: 'Assignment', labelEs: 'Cesión', icon: '📝', color: 'purple' },
  declaration: { label: 'Declaration', labelEs: 'Declaración', icon: '📋', color: 'indigo' },
  filing: { label: 'Filing Document', labelEs: 'Documento Presentación', icon: '📤', color: 'green' },
  correspondence: { label: 'Correspondence', labelEs: 'Correspondencia', icon: '✉️', color: 'cyan' },
  official: { label: 'Official Document', labelEs: 'Documento Oficial', icon: '🏛️', color: 'amber' },
  invoice: { label: 'Invoice', labelEs: 'Factura', icon: '💰', color: 'emerald' },
  report: { label: 'Report', labelEs: 'Informe', icon: '📊', color: 'violet' },
  contract: { label: 'Contract', labelEs: 'Contrato', icon: '📄', color: 'rose' },
  certificate: { label: 'Certificate', labelEs: 'Certificado', icon: '🏆', color: 'yellow' },
  evidence: { label: 'Evidence', labelEs: 'Prueba/Evidencia', icon: '🔍', color: 'orange' },
  other: { label: 'Other', labelEs: 'Otro', icon: '📁', color: 'gray' },
};

export type EntityType = 'matter' | 'client' | 'deal' | 'invoice' | 'quote';

export interface Document {
  id: string;
  organization_id: string;
  matter_id?: string | null;
  client_id?: string | null;
  storage_bucket: string;
  storage_path: string;
  original_filename: string;
  mime_type?: string | null;
  file_size?: number | null;
  document_type: DocumentType;
  title?: string | null;
  description?: string | null;
  version: number;
  is_current_version: boolean;
  previous_version_id?: string | null;
  uploaded_by?: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  uploader?: {
    full_name?: string | null;
    email?: string | null;
  } | null;
}

export interface UploadingFile {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  documentType: DocumentType;
}

export const DOCUMENT_TYPE_LABELS: Record<DocumentType, string> = {
  application: 'Solicitud',
  certificate: 'Certificado',
  logo: 'Logo',
  correspondence: 'Correspondencia',
  invoice: 'Factura',
  contract: 'Contrato',
  power_of_attorney: 'Poder',
  search_report: 'Informe de búsqueda',
  office_action: 'Acción de oficina',
  response: 'Respuesta',
  other: 'Otro',
};

export const DOCUMENT_TYPE_ICONS: Record<DocumentType, string> = {
  application: 'FileText',
  certificate: 'Award',
  logo: 'Image',
  correspondence: 'Mail',
  invoice: 'Receipt',
  contract: 'FileSignature',
  power_of_attorney: 'Scale',
  search_report: 'Search',
  office_action: 'Building2',
  response: 'Reply',
  other: 'File',
};

export const ALLOWED_MIME_TYPES = {
  documents: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  images: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
  all: [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
  ],
};

export function getBucketForEntity(entityType: EntityType): string {
  switch (entityType) {
    case 'matter':
      return 'matter-documents';
    case 'client':
      return 'client-documents';
    case 'deal':
      return 'client-documents'; // Deals use client-documents bucket
    case 'invoice':
      return 'invoices';
    case 'quote':
      return 'client-documents'; // Quotes use client-documents bucket
    default:
      return 'matter-documents';
  }
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function getMimeTypeIcon(mimeType?: string | null): string {
  if (!mimeType) return 'File';
  if (mimeType.startsWith('image/')) return 'Image';
  if (mimeType === 'application/pdf') return 'FileText';
  if (mimeType.includes('word')) return 'FileType';
  return 'File';
}

// ============================================================
// L111: Sistema de Generación de Documentos Profesionales
// ============================================================

// Estilos disponibles
export type DocumentStyleCode = 
  | 'minimalista' 
  | 'corporativo' 
  | 'elegante' 
  | 'dark' 
  | 'creativo' 
  | 'dinamico';

// Categorías de documentos generados
export type DocumentGenerationCategory = 
  | 'factura' 
  | 'contrato' 
  | 'carta' 
  | 'informe' 
  | 'oficial'
  | 'general';

// Configuración de colores por estilo
export interface StyleColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  border: string;
  headerBg?: string;
  headerText?: string;
  footerBg?: string;
  footerText?: string;
}

// Configuración de tipografía
export interface StyleTypography {
  titleFont: string;
  bodyFont: string;
  signatureFont?: string;
  titleSize: string;
  bodySize: string;
}

// Configuración de layout
export interface StyleLayout {
  headerStyle: 'minimal' | 'band' | 'wave' | 'diagonal' | 'organic';
  footerStyle: 'minimal' | 'band' | 'line';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  showLogo: boolean;
  showHeaderInfo: boolean;
  showFooterContact: boolean;
}

// Definición completa de un estilo
export interface DocumentStyle {
  code: DocumentStyleCode;
  name: string;
  description: string;
  colors: StyleColors;
  typography: StyleTypography;
  layout: StyleLayout;
  decorations: {
    hasShapes: boolean;
    shapeStyle?: 'geometric' | 'organic' | 'diagonal' | 'circles';
    hasTexture: boolean;
  };
}

// Configuración del tenant
export interface TenantDocumentSettings {
  id: string;
  organizationId: string;
  defaultStyleCode: DocumentStyleCode;
  logoUrl?: string;
  logoPosition: 'left' | 'center' | 'right';
  logoMaxHeight: number;
  customColors?: Partial<StyleColors>;
  customTypography?: Partial<StyleTypography>;
  companyInfo: {
    name: string;
    address?: string;
    city?: string;
    postalCode?: string;
    country?: string;
    phone?: string;
    email?: string;
    website?: string;
    cif?: string;
  };
  bankInfo?: {
    name: string;
    iban: string;
    swift?: string;
    accountHolder: string;
  };
  customTexts: {
    headerText?: string;
    footerText?: string;
    confidentialityNotice?: string;
  };
  invoiceSettings: {
    taxRate: number;
    paymentTerms: string;
    prefix: string;
    nextNumber: number;
  };
}

// Plantilla de documento (config version)
export interface DocumentTemplateConfig {
  id: string;
  organizationId: string;
  code: string;
  name: string;
  description?: string;
  category: DocumentGenerationCategory;
  preferredStyleCode: DocumentStyleCode;
  contentHtml: string;
  sections: DocumentSection[];
  availableVariables: string[];
  isActive: boolean;
  isSystemTemplate: boolean;
}

// Sección de documento (personalizable)
export interface DocumentSection {
  id: string;
  name: string;
  order: number;
  isRequired: boolean;
  isVisible: boolean;
  contentHtml: string;
}

// Variables para merge
export interface DocumentVariables {
  // Empresa
  company_name?: string;
  company_address?: string;
  company_phone?: string;
  company_email?: string;
  company_website?: string;
  company_cif?: string;
  company_logo?: string;
  
  // Cliente
  client_name?: string;
  client_company?: string;
  client_address?: string;
  client_phone?: string;
  client_email?: string;
  client_cif?: string;
  
  // Expediente
  matter_ref?: string;
  matter_title?: string;
  matter_type?: string;
  trademark_name?: string;
  trademark_classes?: string;
  filing_date?: string;
  filing_number?: string;
  registration_date?: string;
  registration_number?: string;
  jurisdiction?: string;
  office?: string;
  
  // Documento
  document_number?: string;
  document_date?: string;
  due_date?: string;
  current_date?: string;
  current_year?: string;
  
  // Facturación
  invoice_subtotal?: string;
  invoice_tax_rate?: string;
  invoice_tax_amount?: string;
  invoice_total?: string;
  payment_terms?: string;
  bank_name?: string;
  bank_iban?: string;
  
  // Personalizados
  [key: string]: string | undefined;
}

// Documento generado (versión simplificada para el sistema L111)
export interface GeneratedDocumentL111 {
  id: string;
  organizationId: string;
  matterId?: string;
  clientId?: string;
  templateId?: string;
  documentNumber: string;
  title: string;
  category: DocumentGenerationCategory;
  styleCode: DocumentStyleCode;
  contentHtml: string;
  pdfUrl?: string;
  status: 'draft' | 'final' | 'sent' | 'archived';
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  version: number;
}

// ============================================================
// Estilos predefinidos con configuración completa
// ============================================================

export const DOCUMENT_STYLES: Record<DocumentStyleCode, DocumentStyle> = {
  minimalista: {
    code: 'minimalista',
    name: 'Minimalista Clásico',
    description: 'Limpio y profesional, ideal para documentos oficiales',
    colors: {
      primary: '#1a1a1a',
      secondary: '#666666',
      accent: '#000000',
      background: '#ffffff',
      text: '#1a1a1a',
      border: '#e5e5e5',
      headerBg: '#ffffff',
      headerText: '#1a1a1a',
      footerBg: '#f5f5f5',
      footerText: '#666666',
    },
    typography: {
      titleFont: 'Georgia, serif',
      bodyFont: 'Georgia, serif',
      titleSize: '24px',
      bodySize: '12px',
    },
    layout: {
      headerStyle: 'minimal',
      footerStyle: 'line',
      margins: { top: 25, right: 20, bottom: 20, left: 25 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: false,
      hasTexture: false,
    },
  },
  corporativo: {
    code: 'corporativo',
    name: 'Corporativo Azul',
    description: 'Profesional con acentos azules, ideal para contratos',
    colors: {
      primary: '#1e3a5f',
      secondary: '#3b82f6',
      accent: '#2563eb',
      background: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0',
      headerBg: '#1e3a5f',
      headerText: '#ffffff',
      footerBg: '#f0f4f8',
      footerText: '#475569',
    },
    typography: {
      titleFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      titleSize: '22px',
      bodySize: '11px',
    },
    layout: {
      headerStyle: 'band',
      footerStyle: 'band',
      margins: { top: 0, right: 20, bottom: 0, left: 25 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: false,
      hasTexture: false,
    },
  },
  elegante: {
    code: 'elegante',
    name: 'Elegante Dorado',
    description: 'Sofisticado con tonos beige y dorado, ideal para despachos boutique',
    colors: {
      primary: '#2c2c2c',
      secondary: '#8b7355',
      accent: '#c9a961',
      background: '#fffdf9',
      text: '#2c2c2c',
      border: '#e8e0d4',
      headerBg: '#f5f0e8',
      headerText: '#2c2c2c',
      footerBg: '#f5f0e8',
      footerText: '#8b7355',
    },
    typography: {
      titleFont: 'Playfair Display, Georgia, serif',
      bodyFont: 'Lora, Georgia, serif',
      signatureFont: 'Great Vibes, cursive',
      titleSize: '26px',
      bodySize: '11px',
    },
    layout: {
      headerStyle: 'minimal',
      footerStyle: 'minimal',
      margins: { top: 30, right: 25, bottom: 25, left: 30 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: true,
      shapeStyle: 'organic',
      hasTexture: true,
    },
  },
  dark: {
    code: 'dark',
    name: 'Dark Professional',
    description: 'Moderno con header oscuro, ideal para informes',
    colors: {
      primary: '#0f172a',
      secondary: '#334155',
      accent: '#6366f1',
      background: '#ffffff',
      text: '#1e293b',
      border: '#e2e8f0',
      headerBg: '#0f172a',
      headerText: '#f8fafc',
      footerBg: '#1e293b',
      footerText: '#94a3b8',
    },
    typography: {
      titleFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      titleSize: '22px',
      bodySize: '11px',
    },
    layout: {
      headerStyle: 'band',
      footerStyle: 'band',
      margins: { top: 0, right: 20, bottom: 0, left: 25 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: true,
      shapeStyle: 'geometric',
      hasTexture: false,
    },
  },
  creativo: {
    code: 'creativo',
    name: 'Creativo Colorido',
    description: 'Dinámico con formas orgánicas, ideal para agencias',
    colors: {
      primary: '#7c3aed',
      secondary: '#ec4899',
      accent: '#06b6d4',
      background: '#fefefe',
      text: '#1e1b4b',
      border: '#e0e7ff',
      headerBg: 'linear-gradient(135deg, #7c3aed 0%, #ec4899 100%)',
      headerText: '#ffffff',
      footerBg: '#f5f3ff',
      footerText: '#6b7280',
    },
    typography: {
      titleFont: 'Poppins, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      titleSize: '24px',
      bodySize: '11px',
    },
    layout: {
      headerStyle: 'wave',
      footerStyle: 'minimal',
      margins: { top: 0, right: 20, bottom: 20, left: 25 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: true,
      shapeStyle: 'organic',
      hasTexture: false,
    },
  },
  dinamico: {
    code: 'dinamico',
    name: 'Dinámico Moderno',
    description: 'Contemporáneo con franjas diagonales, ideal para tech',
    colors: {
      primary: '#059669',
      secondary: '#10b981',
      accent: '#34d399',
      background: '#ffffff',
      text: '#1e293b',
      border: '#d1fae5',
      headerBg: '#059669',
      headerText: '#ffffff',
      footerBg: '#ecfdf5',
      footerText: '#065f46',
    },
    typography: {
      titleFont: 'Inter, system-ui, sans-serif',
      bodyFont: 'Inter, system-ui, sans-serif',
      titleSize: '22px',
      bodySize: '11px',
    },
    layout: {
      headerStyle: 'diagonal',
      footerStyle: 'line',
      margins: { top: 0, right: 20, bottom: 20, left: 25 },
      showLogo: true,
      showHeaderInfo: true,
      showFooterContact: true,
    },
    decorations: {
      hasShapes: true,
      shapeStyle: 'diagonal',
      hasTexture: false,
    },
  },
};

// Lista de estilos para selector
export const STYLE_OPTIONS = Object.values(DOCUMENT_STYLES).map(style => ({
  value: style.code,
  label: style.name,
  description: style.description,
}));
