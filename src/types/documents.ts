// Document types for the storage system

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
