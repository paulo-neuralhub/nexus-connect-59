// ============================================================
// useJurisdictionRequirements Hook
// Fetch and manage jurisdiction document requirements
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { 
  JurisdictionDocumentRequirement, 
  DocumentValidationRule,
  ValidationResult,
  ValidationError 
} from '@/types/jurisdiction-requirements';

// ============================================================
// FETCH REQUIREMENTS
// ============================================================

export function useJurisdictionRequirements(
  jurisdictionCode?: string,
  officeCode?: string,
  documentType?: string
) {
  return useQuery({
    queryKey: ['jurisdiction-requirements', jurisdictionCode, officeCode, documentType],
    queryFn: async () => {
      let query = supabase
        .from('jurisdiction_document_requirements')
        .select('*')
        .eq('is_active', true)
        .order('jurisdiction_code')
        .order('document_type');

      if (jurisdictionCode) {
        query = query.eq('jurisdiction_code', jurisdictionCode);
      }
      if (officeCode) {
        query = query.eq('office_code', officeCode);
      }
      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error } = await query;
      if (error) throw error;
      
      // Parse JSONB fields - cast to unknown first for type safety
      return (data || []).map(r => ({
        ...r,
        required_fields: Array.isArray(r.required_fields) ? r.required_fields : [],
        validation_rules: Array.isArray(r.validation_rules) ? r.validation_rules : [],
        warnings: Array.isArray(r.warnings) ? r.warnings : [],
        tips: Array.isArray(r.tips) ? r.tips : [],
        accepted_languages: Array.isArray(r.accepted_languages) ? r.accepted_languages : [],
        accepted_file_formats: Array.isArray(r.accepted_file_formats) ? r.accepted_file_formats : [],
      })) as unknown as JurisdictionDocumentRequirement[];
    },
  });
}

// ============================================================
// FETCH SINGLE REQUIREMENT
// ============================================================

export function useJurisdictionRequirement(
  jurisdictionCode: string,
  officeCode: string,
  documentType: string
) {
  return useQuery({
    queryKey: ['jurisdiction-requirement', jurisdictionCode, officeCode, documentType],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction_document_requirements')
        .select('*')
        .eq('jurisdiction_code', jurisdictionCode)
        .eq('office_code', officeCode)
        .eq('document_type', documentType)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }
      
      // Cast to unknown first for type safety with JSONB fields
      return {
        ...data,
        required_fields: Array.isArray(data.required_fields) ? data.required_fields : [],
        validation_rules: Array.isArray(data.validation_rules) ? data.validation_rules : [],
        warnings: Array.isArray(data.warnings) ? data.warnings : [],
        tips: Array.isArray(data.tips) ? data.tips : [],
        accepted_languages: Array.isArray(data.accepted_languages) ? data.accepted_languages : [],
        accepted_file_formats: Array.isArray(data.accepted_file_formats) ? data.accepted_file_formats : [],
      } as unknown as JurisdictionDocumentRequirement;
    },
    enabled: !!jurisdictionCode && !!officeCode && !!documentType,
  });
}

// ============================================================
// FETCH VALIDATION RULES
// ============================================================

export function useValidationRules(requirementId?: string) {
  return useQuery({
    queryKey: ['validation-rules', requirementId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_validation_rules')
        .select('*')
        .eq('requirement_id', requirementId)
        .eq('is_active', true);

      if (error) throw error;
      return data as DocumentValidationRule[];
    },
    enabled: !!requirementId,
  });
}

// ============================================================
// GET AVAILABLE OFFICES
// ============================================================

export function useAvailableOffices() {
  return useQuery({
    queryKey: ['available-offices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction_document_requirements')
        .select('jurisdiction_code, office_code')
        .eq('is_active', true);

      if (error) throw error;
      
      // Get unique offices
      const offices = new Map<string, { jurisdictionCode: string; officeCode: string }>();
      data?.forEach(r => {
        if (!offices.has(r.office_code)) {
          offices.set(r.office_code, {
            jurisdictionCode: r.jurisdiction_code,
            officeCode: r.office_code,
          });
        }
      });
      
      return Array.from(offices.values());
    },
  });
}

// ============================================================
// GET DOCUMENT TYPES FOR OFFICE
// ============================================================

export function useDocumentTypesForOffice(officeCode?: string) {
  return useQuery({
    queryKey: ['document-types-for-office', officeCode],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jurisdiction_document_requirements')
        .select('document_type')
        .eq('office_code', officeCode)
        .eq('is_active', true);

      if (error) throw error;
      
      // Get unique document types
      const types = [...new Set(data?.map(r => r.document_type) || [])];
      return types;
    },
    enabled: !!officeCode,
  });
}

// ============================================================
// SAVE VALIDATION RESULT
// ============================================================

export function useSaveValidationResult() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (params: {
      generatedDocumentId: string;
      requirementId: string;
      result: ValidationResult;
      validationMethod?: 'auto' | 'manual' | 'ai';
    }) => {
      const { data: userData } = await supabase.auth.getUser();
      
      const insertData = {
        generated_document_id: params.generatedDocumentId,
        requirement_id: params.requirementId,
        is_valid: params.result.isValid,
        errors: params.result.errors as unknown,
        warnings: params.result.warnings as unknown,
        validated_by: userData?.user?.id || null,
        validation_method: params.validationMethod || 'auto',
      };
      
      const { data, error } = await (supabase as any)
        .from('document_validation_results')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['validation-results'] });
    },
  });
}

// ============================================================
// GET REQUIREMENT SUMMARY (for display)
// ============================================================

export function getRequirementSummary(req: JurisdictionDocumentRequirement | null): {
  poaInfo: string;
  signatureInfo: string;
  languageInfo: string;
  notarizationInfo: string;
} {
  if (!req) {
    return {
      poaInfo: '-',
      signatureInfo: '-',
      languageInfo: '-',
      notarizationInfo: '-',
    };
  }

  const poaInfo = req.poa_required 
    ? `Required${req.poa_required_condition ? ` (${req.poa_required_condition.replace(/_/g, ' ')})` : ''}`
    : 'Not required';

  const signatureInfo = req.signature_type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  
  const languageInfo = req.official_language.toUpperCase() + 
    (req.accepted_languages.length > 1 ? ` (+${req.accepted_languages.length - 1} more)` : '');

  const notarizationInfo = req.notarization_required 
    ? `Required${req.notarization_required_condition ? ` (${req.notarization_required_condition.replace(/_/g, ' ')})` : ''}`
    : 'Not required';

  return { poaInfo, signatureInfo, languageInfo, notarizationInfo };
}
