// ============================================================
// JURISDICTION DOCUMENT REQUIREMENTS TYPES
// Complete type definitions for office-specific document requirements
// ============================================================

export type SignatureType = 
  | 'simple' 
  | 'electronic' 
  | 's_signature' 
  | 'qualified' 
  | 'seal' 
  | 'wet_signature';

export type ValidationRuleType = 
  | 'format' 
  | 'content' 
  | 'signature' 
  | 'language' 
  | 'field';

export type ValidationType = 
  | 'regex' 
  | 'required' 
  | 'length' 
  | 'enum' 
  | 'custom' 
  | 'required_if' 
  | 'file_size'
  | 'image_specs'
  | 's_signature'
  | 'count';

export type Severity = 'error' | 'warning' | 'info';

export interface RequiredField {
  key: string;
  label_en: string;
  label_es?: string;
  label_pt?: string;
  label_de?: string;
  type?: 'text' | 'select' | 'date' | 'boolean' | 'array' | 'file' | 'email';
  options?: string[];
  required: boolean;
}

export interface ValidationRule {
  field?: string;
  rule: string;
  pattern?: string;
  value?: string | number | Record<string, unknown>;
  condition?: string;
  severity?: Severity;
  error_en: string;
  error_es?: string;
}

export interface JurisdictionDocumentRequirement {
  id: string;
  jurisdiction_code: string;
  office_code: string;
  document_type: string;
  
  // Languages
  official_language: string;
  accepted_languages: string[];
  
  // POA requirements
  poa_required: boolean;
  poa_required_condition: string | null;
  poa_form_code: string | null;
  poa_general_allowed: boolean;
  poa_specific_required: boolean;
  
  // Signature
  signature_type: SignatureType;
  signature_notes: string | null;
  electronic_signature_accepted: boolean;
  seal_accepted: boolean;
  seal_preferred: boolean;
  
  // Notarization
  notarization_required: boolean;
  notarization_required_condition: string | null;
  legalization_required: boolean;
  apostille_accepted: boolean;
  
  // Document format
  paper_size: string;
  image_max_size_mb: number | null;
  image_min_dpi: number | null;
  image_max_dimensions: string | null;
  accepted_file_formats: string[];
  
  // Official forms
  has_official_form: boolean;
  official_form_url: string | null;
  official_form_number: string | null;
  
  // Timing
  submission_deadline_days: number | null;
  validity_months: number | null;
  
  // Structured data
  required_fields: RequiredField[];
  validation_rules: ValidationRule[];
  
  // Notes
  notes_en: string | null;
  notes_es: string | null;
  warnings: string[];
  tips: string[];
  
  // References
  official_guidelines_url: string | null;
  form_download_url: string | null;
  
  // Status
  is_active: boolean;
  last_verified_at: string | null;
  verified_by: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface DocumentValidationRule {
  id: string;
  requirement_id: string;
  rule_code: string;
  rule_type: ValidationRuleType;
  field_key: string | null;
  validation_type: ValidationType;
  validation_value: string | null;
  error_message_en: string;
  error_message_es: string | null;
  severity: Severity;
  is_blocking: boolean;
  is_active: boolean;
  created_at: string;
}

export interface ValidationError {
  field: string;
  rule: string;
  message: string;
  severity: Severity;
  isBlocking: boolean;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  infos: ValidationError[];
}

export interface DocumentValidationResultRecord {
  id: string;
  generated_document_id: string | null;
  requirement_id: string | null;
  is_valid: boolean;
  validation_timestamp: string;
  errors: ValidationError[];
  warnings: ValidationError[];
  validated_by: string | null;
  validation_method: 'auto' | 'manual' | 'ai' | null;
  created_at: string;
}

// Office metadata for UI
export interface OfficeInfo {
  code: string;
  name: string;
  country: string;
  flag: string;
  color: string;
  url: string;
}

export const OFFICE_INFO: Record<string, OfficeInfo> = {
  EUIPO: { code: 'EUIPO', name: 'EUIPO', country: 'EU', flag: '🇪🇺', color: '#003399', url: 'https://euipo.europa.eu' },
  USPTO: { code: 'USPTO', name: 'USPTO', country: 'US', flag: '🇺🇸', color: '#3C3B6E', url: 'https://www.uspto.gov' },
  OEPM: { code: 'OEPM', name: 'OEPM', country: 'ES', flag: '🇪🇸', color: '#C60B1E', url: 'https://www.oepm.es' },
  EPO: { code: 'EPO', name: 'EPO', country: 'EP', flag: '🇪🇺', color: '#004494', url: 'https://www.epo.org' },
  DPMA: { code: 'DPMA', name: 'DPMA', country: 'DE', flag: '🇩🇪', color: '#DD0000', url: 'https://www.dpma.de' },
  WIPO: { code: 'WIPO', name: 'WIPO', country: 'WO', flag: '🌐', color: '#009EDB', url: 'https://www.wipo.int' },
  CNIPA: { code: 'CNIPA', name: 'CNIPA', country: 'CN', flag: '🇨🇳', color: '#DE2910', url: 'https://english.cnipa.gov.cn' },
  INPI: { code: 'INPI', name: 'INPI Brasil', country: 'BR', flag: '🇧🇷', color: '#009B3A', url: 'https://www.gov.br/inpi' },
  JPO: { code: 'JPO', name: 'JPO', country: 'JP', flag: '🇯🇵', color: '#BC002D', url: 'https://www.jpo.go.jp' },
};

// Signature type labels
export const SIGNATURE_TYPE_LABELS: Record<SignatureType, { en: string; es: string }> = {
  simple: { en: 'Simple Signature', es: 'Firma simple' },
  electronic: { en: 'Electronic Signature', es: 'Firma electrónica' },
  s_signature: { en: 'S-Signature (/Name/)', es: 'S-Signature (/Nombre/)' },
  qualified: { en: 'Qualified Electronic Signature', es: 'Firma electrónica cualificada' },
  seal: { en: 'Corporate Seal (Chop)', es: 'Sello corporativo (Chop)' },
  wet_signature: { en: 'Wet Signature (Original)', es: 'Firma manuscrita (Original)' },
};
