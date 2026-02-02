// ============================================================
// IP-NEXUS - OFFICE TEMPLATE VALIDATOR
// Validates document data against office-specific requirements
// ============================================================

import { OfficeRequirements } from '@/hooks/useOfficeDocumentRequirements';

export interface ValidationError {
  field: string;
  message: string;
  type: 'required' | 'format' | 'length' | 'custom';
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  completionPercent: number;
}

export interface FieldDefinition {
  type: 'text' | 'date' | 'email' | 'boolean' | 'textarea' | 'select';
  required: boolean;
  source?: string;
  default?: string | boolean;
  placeholder?: string;
  validation?: string;
  options?: string[];
}

/**
 * Validates document data against field definitions and office requirements
 */
export function validateTemplateData(
  data: Record<string, unknown>,
  fieldDefinitions: Record<string, FieldDefinition>,
  officeRequirements?: OfficeRequirements
): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];
  let filledCount = 0;
  let requiredCount = 0;

  // Validate each field
  for (const [fieldPath, fieldDef] of Object.entries(fieldDefinitions)) {
    const value = getNestedValue(data, fieldPath);
    
    if (fieldDef.required) {
      requiredCount++;
      if (isEmpty(value)) {
        errors.push({
          field: fieldPath,
          message: `Campo obligatorio`,
          type: 'required',
          severity: 'error',
        });
      } else {
        filledCount++;
      }
    } else if (!isEmpty(value)) {
      filledCount++;
    }

    // Format validation (regex)
    if (fieldDef.validation && !isEmpty(value)) {
      try {
        const regex = new RegExp(fieldDef.validation);
        if (!regex.test(String(value))) {
          errors.push({
            field: fieldPath,
            message: `Formato inválido`,
            type: 'format',
            severity: 'error',
          });
        }
      } catch {
        // Invalid regex, skip validation
      }
    }

    // Email validation
    if (fieldDef.type === 'email' && !isEmpty(value)) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(String(value))) {
        errors.push({
          field: fieldPath,
          message: `Email inválido`,
          type: 'format',
          severity: 'error',
        });
      }
    }
  }

  // Office-specific validations
  if (officeRequirements) {
    // S-signature format for USPTO
    if (officeRequirements.signature_type === 's_signature') {
      const signatureField = data['signature_s_format'] as string | undefined;
      if (signatureField && officeRequirements.signature_regex) {
        try {
          const regex = new RegExp(officeRequirements.signature_regex);
          if (!regex.test(signatureField)) {
            errors.push({
              field: 'signature_s_format',
              message: `Formato S-signature inválido. Debe ser: /Nombre Completo/`,
              type: 'format',
              severity: 'error',
            });
          }
        } catch {
          // Invalid regex
        }
      }
    }

    // Notarization warning
    if (officeRequirements.notarization_required) {
      warnings.push({
        field: '_office',
        message: `Esta oficina requiere notarización del documento`,
        type: 'custom',
        severity: 'warning',
      });
    }

    // Electronic signature warning
    if (!officeRequirements.electronic_signature_accepted) {
      warnings.push({
        field: '_signature',
        message: `Esta oficina NO acepta firma electrónica simple`,
        type: 'custom',
        severity: 'warning',
      });
    }

    // Seal preferred warning (China)
    if (officeRequirements.signature_type === 'seal_preferred') {
      warnings.push({
        field: '_signature',
        message: `Sello corporativo (公章) recomendado para mayor validez legal`,
        type: 'custom',
        severity: 'warning',
      });
    }

    // Translation required
    if (officeRequirements.translation_required) {
      warnings.push({
        field: '_translation',
        message: `Este documento requiere traducción a ${officeRequirements.language.toUpperCase()}`,
        type: 'custom',
        severity: 'warning',
      });
    }

    // Filing deadline
    if (officeRequirements.filing_deadline_days) {
      warnings.push({
        field: '_deadline',
        message: `Presentar en máximo ${officeRequirements.filing_deadline_days} días desde la solicitud`,
        type: 'custom',
        severity: 'warning',
      });
    }
  }

  const totalFields = Object.keys(fieldDefinitions).length;
  const completionPercent = totalFields > 0 
    ? Math.round((filledCount / totalFields) * 100) 
    : 0;

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    completionPercent,
  };
}

/**
 * Validates S-signature format for USPTO
 */
export function validateSSignature(signature: string): boolean {
  // Format: /Full Legal Name/
  const regex = /^\/[A-Za-z .\-']+\/$/;
  return regex.test(signature);
}

/**
 * Gets a nested value from an object using dot notation
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object' && key in current) {
      return (current as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj as unknown);
}

/**
 * Checks if a value is empty
 */
function isEmpty(value: unknown): boolean {
  if (value === undefined || value === null) return true;
  if (typeof value === 'string' && value.trim() === '') return true;
  if (Array.isArray(value) && value.length === 0) return true;
  return false;
}

/**
 * Format signature type for display
 */
export function getSignatureTypeLabel(type: string): { es: string; en: string } {
  const labels: Record<string, { es: string; en: string }> = {
    simple: { es: 'Firma simple', en: 'Simple signature' },
    electronic: { es: 'Firma electrónica', en: 'Electronic signature' },
    s_signature: { es: 'S-Signature (/Nombre/)', en: 'S-Signature (/Name/)' },
    wet_signature: { es: 'Firma manuscrita original', en: 'Original wet signature' },
    seal_preferred: { es: 'Sello corporativo preferido', en: 'Corporate seal preferred' },
    qualified: { es: 'Firma electrónica cualificada', en: 'Qualified electronic signature' },
  };
  return labels[type] || { es: type, en: type };
}

/**
 * Get validation summary for UI display
 */
export function getValidationSummary(result: ValidationResult): {
  status: 'valid' | 'warning' | 'error';
  message: string;
  color: string;
} {
  if (result.errors.length > 0) {
    return {
      status: 'error',
      message: `${result.errors.length} error(es) que corregir`,
      color: 'text-destructive',
    };
  }
  if (result.warnings.length > 0) {
    return {
      status: 'warning',
      message: `${result.warnings.length} advertencia(s)`,
      color: 'text-warning',
    };
  }
  return {
    status: 'valid',
    message: 'Documento válido',
    color: 'text-success',
  };
}
