// src/lib/constants/translation.ts
// Constants for the Legal Translator feature

export const TRANSLATION_DISCLAIMER = {
  es: `⚠️ AVISO LEGAL IMPORTANTE ⚠️

Esta traducción ha sido generada mediante inteligencia artificial y tiene carácter MERAMENTE INFORMATIVO Y ORIENTATIVO.

❌ NO CONSTITUYE:
• Una traducción oficial, jurada o certificada
• Asesoramiento legal
• Un documento válido para procedimientos oficiales

✅ RECOMENDACIONES:
• Para procedimientos legales, registros oficiales o cualquier uso que requiera validez legal, obtenga una traducción realizada por un traductor jurado certificado
• Verifique siempre la terminología específica con un profesional
• Use esta traducción solo como referencia inicial

⚖️ LIMITACIÓN DE RESPONSABILIDAD:
IP-NEXUS y sus operadores NO se responsabilizan de:
• Errores, omisiones o inexactitudes en la traducción
• Pérdidas, daños o perjuicios derivados del uso de esta traducción
• Consecuencias legales por el uso de este documento
• Interpretaciones incorrectas del contenido traducido

Al utilizar este servicio, USTED RECONOCE Y ACEPTA estas limitaciones.`,

  en: `⚠️ IMPORTANT LEGAL NOTICE ⚠️

This translation has been generated using artificial intelligence and is for INFORMATIONAL AND GUIDANCE PURPOSES ONLY.

❌ THIS IS NOT:
• An official, sworn, or certified translation
• Legal advice
• A valid document for official proceedings

✅ RECOMMENDATIONS:
• For legal proceedings, official registrations, or any use requiring legal validity, obtain a translation from a certified sworn translator
• Always verify specific terminology with a professional
• Use this translation only as an initial reference

⚖️ LIMITATION OF LIABILITY:
IP-NEXUS and its operators are NOT responsible for:
• Errors, omissions, or inaccuracies in the translation
• Losses, damages, or harm arising from the use of this translation
• Legal consequences from the use of this document
• Incorrect interpretations of the translated content

By using this service, YOU ACKNOWLEDGE AND ACCEPT these limitations.`,

  fr: `⚠️ AVIS JURIDIQUE IMPORTANT ⚠️

Cette traduction a été générée par intelligence artificielle et est UNIQUEMENT À TITRE INFORMATIF ET INDICATIF.

En utilisant ce service, VOUS RECONNAISSEZ ET ACCEPTEZ ces limitations.`,

  de: `⚠️ WICHTIGER RECHTLICHER HINWEIS ⚠️

Diese Übersetzung wurde mittels künstlicher Intelligenz erstellt und dient NUR ZU INFORMATIONS- UND ORIENTIERUNGSZWECKEN.

Durch die Nutzung dieses Dienstes ERKENNEN SIE diese Einschränkungen AN und AKZEPTIEREN sie.`,
} as const;

export const SUPPORTED_LANGUAGES = [
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'pt', name: 'Português', flag: '🇵🇹' },
  { code: 'it', name: 'Italiano', flag: '🇮🇹' },
  { code: 'zh', name: '中文', flag: '🇨🇳' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' },
  { code: 'ko', name: '한국어', flag: '🇰🇷' },
] as const;

export type SupportedLanguageCode = typeof SUPPORTED_LANGUAGES[number]['code'];

export const DOCUMENT_TYPES = [
  { id: 'patent', label: { es: 'Patente', en: 'Patent' } },
  { id: 'trademark', label: { es: 'Solicitud de marca', en: 'Trademark application' } },
  { id: 'contract', label: { es: 'Contrato', en: 'Contract' } },
  { id: 'license', label: { es: 'Licencia', en: 'License' } },
  { id: 'office_action', label: { es: 'Office Action', en: 'Office Action' } },
  { id: 'legal_opinion', label: { es: 'Opinión legal', en: 'Legal opinion' } },
  { id: 'assignment', label: { es: 'Cesión', en: 'Assignment' } },
  { id: 'power_of_attorney', label: { es: 'Poder notarial', en: 'Power of Attorney' } },
  { id: 'nda', label: { es: 'Acuerdo de confidencialidad', en: 'Non-Disclosure Agreement' } },
  { id: 'coexistence', label: { es: 'Acuerdo de coexistencia', en: 'Coexistence Agreement' } },
  { id: 'opposition', label: { es: 'Escrito de oposición', en: 'Opposition brief' } },
  { id: 'other', label: { es: 'Otro documento', en: 'Other document' } },
] as const;

export type DocumentTypeId = typeof DOCUMENT_TYPES[number]['id'];

// Types for translation feature
export interface TranslationGlossary {
  id: string;
  organization_id?: string;
  user_id?: string;
  name: string;
  source_language: string;
  target_language: string;
  domain?: string;
  is_public: boolean;
  is_official: boolean;
  created_at: string;
  terms_count?: number;
}

export interface GlossaryTerm {
  id: string;
  glossary_id: string;
  source_term: string;
  target_term: string;
  context?: string;
  created_at: string;
}

export interface Translation {
  id: string;
  organization_id: string;
  user_id: string;
  source_language: string;
  target_language: string;
  document_type: string;
  source_text: string;
  translated_text?: string;
  confidence_score?: number;
  word_count?: number;
  character_count?: number;
  disclaimer_accepted: boolean;
  disclaimer_accepted_at?: string;
  glossary_id?: string;
  terms_used?: Array<{ source: string; target: string }>;
  status: 'pending' | 'processing' | 'completed' | 'error';
  processing_time_ms?: number;
  created_at: string;
  completed_at?: string;
}
