// ============================================================
// IP-NEXUS - OFFICE DOCUMENT REQUIREMENTS HOOK
// Fetch and manage office-specific document requirements
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface OfficeRequirements {
  mandatory_fields: string[];
  optional_fields?: string[];
  notarization_required: boolean;
  legalization_required: boolean;
  apostille_required?: boolean;
  language: string;
  accepted_languages: string[];
  signature_type: 'simple' | 'electronic' | 's_signature' | 'wet_signature' | 'seal_preferred' | 'qualified';
  signature_format?: string;
  signature_regex?: string;
  electronic_signature_accepted: boolean;
  electronic_certificate_required?: boolean;
  electronic_signature_requirements?: string;
  translation_required?: boolean;
  special_notes?: string;
  max_practitioners?: number;
  max_representatives?: number;
  filing_deadline_days?: number;
  mandatory_for_foreigners?: boolean;
  seal_accepted?: boolean;
  office_flag?: string;
  office_color?: string;
}

export interface OfficeDocumentRequirement {
  id: string;
  organization_id: string | null;
  office_code: string;
  document_type: string;
  requirements: OfficeRequirements;
  default_template_id: string | null;
  official_form_number: string | null;
  official_form_url: string | null;
  last_verified_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface OfficeInfo {
  code: string;
  name: string;
  flag: string;
  color: string;
  country: string;
}

export const OFFICE_CATALOG: Record<string, OfficeInfo> = {
  EUIPO: { code: 'EUIPO', name: 'EUIPO', flag: '🇪🇺', color: '#003399', country: 'EU' },
  USPTO: { code: 'USPTO', name: 'USPTO', flag: '🇺🇸', color: '#3C3B6E', country: 'US' },
  OEPM: { code: 'OEPM', name: 'OEPM', flag: '🇪🇸', color: '#C60B1E', country: 'ES' },
  WIPO: { code: 'WIPO', name: 'WIPO Madrid', flag: '🌍', color: '#009EDB', country: 'WO' },
  CNIPA: { code: 'CNIPA', name: 'CNIPA', flag: '🇨🇳', color: '#DE2910', country: 'CN' },
  INPI_BR: { code: 'INPI_BR', name: 'INPI Brasil', flag: '🇧🇷', color: '#009B3A', country: 'BR' },
  JPO: { code: 'JPO', name: 'JPO', flag: '🇯🇵', color: '#BC002D', country: 'JP' },
  EPO: { code: 'EPO', name: 'EPO', flag: '🇪🇺', color: '#004494', country: 'EP' },
  DPMA: { code: 'DPMA', name: 'DPMA', flag: '🇩🇪', color: '#DD0000', country: 'DE' },
  UKIPO: { code: 'UKIPO', name: 'UKIPO', flag: '🇬🇧', color: '#012169', country: 'GB' },
};

export function useOfficeDocumentRequirements(officeCode?: string, documentType?: string) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch all requirements or filtered by office/type
  const { data: requirements = [], isLoading, error } = useQuery({
    queryKey: ['office-document-requirements', officeCode, documentType],
    queryFn: async () => {
      let query = supabase
        .from('office_document_requirements')
        .select('*')
        .or(`organization_id.is.null${orgId ? `,organization_id.eq.${orgId}` : ''}`);

      if (officeCode) {
        query = query.eq('office_code', officeCode);
      }
      if (documentType) {
        query = query.eq('document_type', documentType);
      }

      const { data, error: fetchError } = await query;
      if (fetchError) throw fetchError;
      
      // Parse JSONB requirements
      return (data || []).map(row => ({
        ...row,
        requirements: typeof row.requirements === 'string' 
          ? JSON.parse(row.requirements) 
          : row.requirements,
      })) as OfficeDocumentRequirement[];
    },
  });

  // Get requirement for specific office + document type
  const getRequirement = (office: string, docType: string): OfficeDocumentRequirement | undefined => {
    return requirements.find(r => r.office_code === office && r.document_type === docType);
  };

  // Get all offices with requirements
  const availableOffices = [...new Set(requirements.map(r => r.office_code))];

  // Get document types for an office
  const getDocumentTypes = (office: string): string[] => {
    return requirements
      .filter(r => r.office_code === office)
      .map(r => r.document_type);
  };

  return {
    requirements,
    isLoading,
    error,
    getRequirement,
    availableOffices,
    getDocumentTypes,
    officeCatalog: OFFICE_CATALOG,
  };
}

// Hook for fetching office templates
export function useOfficeTemplates(officeCode?: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['office-templates', officeCode, orgId],
    queryFn: async () => {
      let query = supabase
        .from('document_templates')
        .select('*')
        .eq('is_active', true)
        .or(`organization_id.is.null${orgId ? `,organization_id.eq.${orgId}` : ''}`);

      if (officeCode) {
        query = query.eq('office_code', officeCode);
      } else {
        query = query.not('office_code', 'is', null);
      }

      const { data, error } = await query.order('name');
      if (error) throw error;
      return data || [];
    },
    enabled: true,
  });

  return { templates, isLoading };
}
