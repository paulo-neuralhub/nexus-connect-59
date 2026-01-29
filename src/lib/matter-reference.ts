/**
 * Matter Reference Utilities
 * Helpers para gestionar referencias de expedientes en comunicaciones
 * 
 * Reference Format: [TYPE]-[COUNTRY]-[DATE]-[ORG]-[SEQ]-[CHECK]
 * Example: TM-ES-20260127-A7K-0001-X9
 */

// ============================================================
// PATTERNS
// ============================================================

/**
 * Full reference pattern with check digit
 * Matches: TM-ES-20260127-A7K-0001-X9
 */
const FULL_REFERENCE_PATTERN = /\[?([A-Z]{2})-([A-Z]{2})-(\d{8})-([A-Z0-9]{3})-(\d{4})-([A-Z0-9]{2})\]?/i;

/**
 * Simple reference pattern (legacy format)
 * Matches: TM-2024-0001, TM-ES-2024-0001
 */
const SIMPLE_REFERENCE_PATTERN = /\[?([A-Z]{2,}-\d{4}-\d+(?:-[A-Z0-9]+)*)\]?/;

// ============================================================
// CHECK DIGIT CALCULATION (Modified Luhn Algorithm)
// ============================================================

/**
 * Calculate check digit for a reference base string
 * Uses modified Luhn algorithm for alphanumeric characters
 */
export function calculateCheckDigit(base: string): string {
  // Remove hyphens and uppercase
  const chars = base.replace(/-/g, '').toUpperCase();
  let sum = 0;
  
  for (let i = 0; i < chars.length; i++) {
    // Convert char to value (A=10, B=11, ... Z=35, 0=0, ... 9=9)
    const char = chars[i];
    let value = char >= '0' && char <= '9' 
      ? parseInt(char, 10) 
      : char.charCodeAt(0) - 55; // A=65, so A=10
    
    // Double every other digit
    if (i % 2 === 0) {
      value *= 2;
      if (value > 35) value -= 9;
    }
    
    sum += value;
  }
  
  // Generate 2 characters: letter + digit
  const check1 = String.fromCharCode(65 + (sum % 26)); // A-Z
  const check2 = (sum % 10).toString(); // 0-9
  
  return check1 + check2;
}

/**
 * Validate the check digit of a full reference
 */
export function validateCheckDigit(reference: string): boolean {
  const parsed = parseFullReference(reference);
  if (!parsed) return false;
  
  // Rebuild base without check digit
  const base = `${parsed.type}-${parsed.country}-${parsed.date}-${parsed.org}-${parsed.sequence}`;
  const expectedCheck = calculateCheckDigit(base);
  
  return expectedCheck === parsed.checkDigit;
}

/**
 * Parse a full format reference into components
 */
export function parseFullReference(reference: string): {
  type: string;
  country: string;
  date: string;
  org: string;
  sequence: string;
  checkDigit: string;
} | null {
  const cleaned = reference.replace(/[\[\]]/g, '').trim();
  const match = cleaned.match(FULL_REFERENCE_PATTERN);
  
  if (!match) return null;
  
  return {
    type: match[1].toUpperCase(),
    country: match[2].toUpperCase(),
    date: match[3],
    org: match[4].toUpperCase(),
    sequence: match[5],
    checkDigit: match[6].toUpperCase(),
  };
}

/**
 * Generate a full reference with check digit
 */
export function generateFullReference(params: {
  type: 'TM' | 'PT' | 'DS' | 'UT' | 'CP' | 'OP';
  country: string;
  orgCode: string;
  sequence: number;
  date?: Date;
}): string {
  const dateStr = (params.date || new Date()).toISOString().slice(0, 10).replace(/-/g, '');
  const seq = params.sequence.toString().padStart(4, '0');
  const base = `${params.type}-${params.country.toUpperCase()}-${dateStr}-${params.orgCode.toUpperCase()}-${seq}`;
  const check = calculateCheckDigit(base);
  
  return `${base}-${check}`;
}

// ============================================================
// REFERENCE EXTRACTION FROM TEXT
// ============================================================

/**
 * Extract reference from email subject or body
 * Cleans RE:, FWD:, etc. prefixes first
 */
export function extractReferenceFromSubject(text: string): {
  reference: string;
  isFullFormat: boolean;
  isValid: boolean;
} | null {
  if (!text) return null;
  
  // Clean common email prefixes (may be multiple)
  let cleaned = text;
  for (let i = 0; i < 5; i++) {
    cleaned = cleaned
      .replace(/^(RE:|FW:|FWD:|RV:|ENC:|AW:|R:|SV:)\s*/gi, '')
      .trim();
  }
  
  // Try full format first
  const fullMatch = cleaned.match(FULL_REFERENCE_PATTERN);
  if (fullMatch) {
    const reference = fullMatch[0].replace(/[\[\]]/g, '');
    return {
      reference,
      isFullFormat: true,
      isValid: validateCheckDigit(reference),
    };
  }
  
  // Try simple format
  const simpleMatch = cleaned.match(SIMPLE_REFERENCE_PATTERN);
  if (simpleMatch) {
    return {
      reference: simpleMatch[1],
      isFullFormat: false,
      isValid: true, // Simple format has no check digit to validate
    };
  }
  
  return null;
}

/**
 * Legacy function - extracts reference without validation info
 * @deprecated Use extractReferenceFromSubject for new code
 */
export function extractMatterReference(text: string): string | null {
  const result = extractReferenceFromSubject(text);
  return result?.reference || null;
}

// ============================================================
// REFERENCE PREFIX HELPERS
// ============================================================

/**
 * Genera el prefijo de referencia para comunicaciones
 * @param matterReference - Número de expediente (ej: "TM-2024-0015")
 * @returns Prefijo formateado (ej: "[TM-2024-0015] ")
 */
export function getMatterPrefix(matterReference: string | null | undefined): string {
  if (!matterReference) return '';
  return `[${matterReference}] `;
}

/**
 * Añade referencia al asunto del email si no existe
 */
export function addReferenceToSubject(subject: string, matterReference: string | null | undefined): string {
  if (!matterReference) return subject;
  const prefix = `[${matterReference}]`;
  // No duplicar si ya tiene la referencia
  if (subject.startsWith(prefix)) return subject;
  if (subject.includes(prefix)) return subject;
  return `${prefix} ${subject}`;
}

/**
 * Añade referencia al inicio del mensaje
 */
export function addReferenceToMessage(message: string, matterReference: string | null | undefined): string {
  if (!matterReference) return message;
  const prefix = `[${matterReference}]`;
  // No duplicar si ya tiene la referencia
  if (message.startsWith(prefix)) return message;
  return `${prefix} ${message}`;
}

/**
 * Verifica si un texto ya contiene una referencia de expediente
 */
export function hasReference(text: string, matterReference: string | null | undefined): boolean {
  if (!matterReference || !text) return false;
  return text.includes(`[${matterReference}]`) || text.includes(`[REF: ${matterReference}]`);
}
