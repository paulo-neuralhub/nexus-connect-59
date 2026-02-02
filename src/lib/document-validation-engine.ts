// ============================================================
// DOCUMENT VALIDATION ENGINE
// Validates documents against jurisdiction requirements
// ============================================================

import type {
  JurisdictionDocumentRequirement,
  ValidationRule,
  RequiredField,
  ValidationResult,
  ValidationError,
  Severity,
} from '@/types/jurisdiction-requirements';

// ============================================================
// MAIN VALIDATION FUNCTION
// ============================================================

export function validateDocument(
  documentData: Record<string, unknown>,
  requirement: JurisdictionDocumentRequirement,
  language: string = 'en'
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  const infos: ValidationError[] = [];

  // 1. Validate required fields
  for (const field of requirement.required_fields) {
    if (field.required) {
      const value = documentData[field.key];
      if (value === undefined || value === null || value === '') {
        const error: ValidationError = {
          field: field.key,
          rule: 'required',
          message: language === 'es' 
            ? `${field.label_es || field.label_en} es obligatorio`
            : `${field.label_en} is required`,
          severity: 'error',
          isBlocking: true,
        };
        errors.push(error);
      }
    }
  }

  // 2. Apply validation rules
  for (const rule of requirement.validation_rules) {
    const result = applyValidationRule(rule, documentData, language);
    if (result) {
      const severity = rule.severity || 'error';
      const validationError: ValidationError = {
        field: rule.field || 'document',
        rule: rule.rule,
        message: result,
        severity,
        isBlocking: severity === 'error',
      };

      if (severity === 'error') {
        errors.push(validationError);
      } else if (severity === 'warning') {
        warnings.push(validationError);
      } else {
        infos.push(validationError);
      }
    }
  }

  // 3. Validate language
  if (requirement.official_language) {
    const docLanguage = documentData.language as string;
    if (docLanguage && docLanguage !== requirement.official_language) {
      if (!requirement.accepted_languages.includes(docLanguage)) {
        warnings.push({
          field: 'language',
          rule: 'language_check',
          message: language === 'es'
            ? `El idioma oficial es ${requirement.official_language.toUpperCase()}`
            : `Official language is ${requirement.official_language.toUpperCase()}`,
          severity: 'warning',
          isBlocking: false,
        });
      }
    }
  }

  // 4. Validate signature type
  if (requirement.signature_type === 's_signature') {
    const signature = documentData.signature as string;
    if (signature && !isValidSSignature(signature)) {
      errors.push({
        field: 'signature',
        rule: 's_signature_format',
        message: language === 'es'
          ? 'La firma debe estar en formato S-signature: /Nombre Apellido/'
          : 'Signature must be in S-signature format: /First Last/',
        severity: 'error',
        isBlocking: true,
      });
    }
  }

  // 5. Add warnings for notarization if required
  if (requirement.notarization_required) {
    const isNotarized = documentData.is_notarized as boolean;
    if (!isNotarized) {
      warnings.push({
        field: 'notarization',
        rule: 'notarization_required',
        message: language === 'es'
          ? `Se requiere notarización${requirement.notarization_required_condition ? ` (${requirement.notarization_required_condition})` : ''}`
          : `Notarization required${requirement.notarization_required_condition ? ` (${requirement.notarization_required_condition})` : ''}`,
        severity: 'warning',
        isBlocking: false,
      });
    }
  }

  // 6. Add warnings for seal requirement (China, Japan)
  if (requirement.seal_preferred && !requirement.seal_accepted) {
    const hasSeal = documentData.has_seal as boolean;
    if (!hasSeal) {
      warnings.push({
        field: 'seal',
        rule: 'seal_preferred',
        message: language === 'es'
          ? 'Se recomienda usar sello corporativo (chop)'
          : 'Corporate seal (chop) is preferred',
        severity: 'warning',
        isBlocking: false,
      });
    }
  }

  const isValid = errors.length === 0;

  return {
    isValid,
    errors,
    warnings,
    infos,
  };
}

// ============================================================
// APPLY SINGLE VALIDATION RULE
// ============================================================

function applyValidationRule(
  rule: ValidationRule,
  data: Record<string, unknown>,
  language: string
): string | null {
  const fieldValue = rule.field ? data[rule.field] : null;

  switch (rule.rule) {
    case 'required':
      if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'regex':
    case 's_signature':
      if (rule.pattern && fieldValue) {
        const regex = new RegExp(rule.pattern);
        if (!regex.test(String(fieldValue))) {
          return language === 'es' ? rule.error_es : rule.error_en;
        }
      }
      break;

    case 'max_count':
      if (Array.isArray(fieldValue) && rule.value) {
        const maxCount = parseInt(String(rule.value), 10);
        if (fieldValue.length > maxCount) {
          return language === 'es' ? rule.error_es : rule.error_en;
        }
      }
      break;

    case 'required_if':
      if (rule.condition) {
        const [condField, condValue] = rule.condition.split('=');
        if (data[condField] === condValue) {
          if (fieldValue === undefined || fieldValue === null || fieldValue === '') {
            return language === 'es' ? rule.error_es : rule.error_en;
          }
        }
      }
      break;

    case 'must_be':
      if (rule.value && fieldValue !== rule.value) {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'file_size':
      // Check file size if value is a file object or size number
      if (rule.value && fieldValue) {
        const maxSize = parseFileSize(String(rule.value));
        const fileSize = typeof fieldValue === 'number' 
          ? fieldValue 
          : (fieldValue as { size?: number }).size || 0;
        if (fileSize > maxSize) {
          return language === 'es' ? rule.error_es : rule.error_en;
        }
      }
      break;

    case 'image_specs':
      // Validate image specifications
      if (rule.value && typeof rule.value === 'object') {
        const specs = rule.value as { max_size?: string; min_dpi?: number };
        // In real implementation, this would check actual image properties
        // For now, just return null (pass)
      }
      break;

    case 'language':
      if (rule.value && data.language !== rule.value) {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'spanish_id':
      if (fieldValue && !isValidSpanishId(String(fieldValue))) {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'icp_brasil_or_notarized':
      // This would check ICP-Brasil certificate or notarization
      // Complex validation that would require backend verification
      break;

    case 'original_or_notarized':
      const isOriginal = data.is_original as boolean;
      const isNotarized = data.is_notarized as boolean;
      if (!isOriginal && !isNotarized) {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'wet_signature_recommended':
      const hasWetSignature = data.has_wet_signature as boolean;
      if (!hasWetSignature) {
        return language === 'es' ? rule.error_es : rule.error_en;
      }
      break;

    case 'count':
      if (Array.isArray(fieldValue) && rule.value) {
        const requiredCount = parseInt(String(rule.value), 10);
        if (fieldValue.length < requiredCount) {
          return language === 'es' ? rule.error_es : rule.error_en;
        }
      }
      break;
  }

  return null;
}

// ============================================================
// HELPER FUNCTIONS
// ============================================================

function isValidSSignature(signature: string): boolean {
  // S-signature format: /First Last/
  const pattern = /^\/[A-Za-z][A-Za-z .\-']+\/$/;
  return pattern.test(signature.trim());
}

function isValidSpanishId(id: string): boolean {
  // NIF/NIE validation (simplified)
  const nifPattern = /^[0-9]{8}[A-Z]$/i;
  const niePattern = /^[XYZ][0-9]{7}[A-Z]$/i;
  const passportPattern = /^[A-Z]{2}[0-9]{6,7}$/i;
  
  return nifPattern.test(id) || niePattern.test(id) || passportPattern.test(id);
}

function parseFileSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(KB|MB|GB)?$/i);
  if (!match) return 0;
  
  const value = parseFloat(match[1]);
  const unit = (match[2] || 'B').toUpperCase();
  
  switch (unit) {
    case 'KB': return value * 1024;
    case 'MB': return value * 1024 * 1024;
    case 'GB': return value * 1024 * 1024 * 1024;
    default: return value;
  }
}

// ============================================================
// PRE-GENERATION VALIDATION
// Check if document can be generated before attempting
// ============================================================

export function canGenerateDocument(
  documentData: Record<string, unknown>,
  requirement: JurisdictionDocumentRequirement
): { canGenerate: boolean; missingFields: string[]; blockingErrors: string[] } {
  const missingFields: string[] = [];
  const blockingErrors: string[] = [];

  // Check required fields
  for (const field of requirement.required_fields) {
    if (field.required) {
      const value = documentData[field.key];
      if (value === undefined || value === null || value === '') {
        missingFields.push(field.label_en);
      }
    }
  }

  // Check blocking validation rules
  for (const rule of requirement.validation_rules) {
    if (rule.severity !== 'warning' && rule.severity !== 'info') {
      const error = applyValidationRule(rule, documentData, 'en');
      if (error) {
        blockingErrors.push(error);
      }
    }
  }

  return {
    canGenerate: missingFields.length === 0 && blockingErrors.length === 0,
    missingFields,
    blockingErrors,
  };
}

// ============================================================
// GET REQUIREMENT WARNINGS FOR UI
// ============================================================

export function getRequirementWarnings(
  requirement: JurisdictionDocumentRequirement,
  language: string = 'en'
): string[] {
  const warnings: string[] = [];

  // Add static warnings from requirement
  if (requirement.warnings && requirement.warnings.length > 0) {
    warnings.push(...requirement.warnings);
  }

  // Add signature-related warnings
  if (requirement.signature_type === 'wet_signature') {
    warnings.push(
      language === 'es'
        ? 'Se requiere firma manuscrita original'
        : 'Original wet signature required'
    );
  }

  if (requirement.seal_preferred) {
    warnings.push(
      language === 'es'
        ? 'Se recomienda sello corporativo sobre firma'
        : 'Corporate seal preferred over signature'
    );
  }

  // Add language warning
  if (requirement.official_language === 'zh') {
    warnings.push(
      language === 'es'
        ? 'Todos los documentos deben estar en chino simplificado'
        : 'All documents must be in Simplified Chinese'
    );
  }

  if (requirement.official_language === 'ja') {
    warnings.push(
      language === 'es'
        ? 'Todos los documentos deben estar en japonés'
        : 'All documents must be in Japanese'
    );
  }

  // Add notarization warning
  if (requirement.notarization_required) {
    warnings.push(
      language === 'es'
        ? 'Se requiere notarización'
        : 'Notarization required'
    );
  }

  return [...new Set(warnings)]; // Remove duplicates
}

// ============================================================
// GET TIPS FOR UI
// ============================================================

export function getRequirementTips(
  requirement: JurisdictionDocumentRequirement
): string[] {
  return requirement.tips || [];
}
