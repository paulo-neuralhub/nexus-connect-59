// ============================================================
// Hook for Internal Reference Configuration
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface InternalReferenceConfig {
  id: string;
  organization_id: string;
  template: string;
  seq_padding: number;
  seq_scope: 'YEAR' | 'TYPE_YEAR' | 'GLOBAL';
  seq_start: number;
  separator: string;
  uppercase: boolean;
  include_client_code: boolean;
  preview_example: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useInternalReferenceConfig() {
  const { currentOrganization } = useOrganization();
  
  return useQuery({
    queryKey: ['internal-reference-config', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      
      const { data, error } = await supabase
        .from('internal_reference_config')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();
      
      if (error) throw error;
      return data as InternalReferenceConfig | null;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useUpdateInternalReferenceConfig() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (config: Partial<InternalReferenceConfig>) => {
      if (!currentOrganization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('internal_reference_config')
        .upsert({
          organization_id: currentOrganization.id,
          ...config,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data as InternalReferenceConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ 
        queryKey: ['internal-reference-config', currentOrganization?.id] 
      });
      toast.success('Configuración guardada');
    },
    onError: (error: Error) => {
      toast.error('Error al guardar: ' + error.message);
    },
  });
}

export function useGenerateInternalReference() {
  const { currentOrganization } = useOrganization();
  
  return useMutation({
    mutationFn: async (params: {
      typeCode: string;
      jurisdictionCode?: string;
      clientCode?: string;
    }) => {
      if (!currentOrganization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase.rpc('generate_internal_reference', {
        p_organization_id: currentOrganization.id,
        p_type_code: params.typeCode,
        p_jurisdiction_code: params.jurisdictionCode || null,
        p_client_code: params.clientCode || null,
      });
      
      if (error) throw error;
      return data as string;
    },
  });
}

// Template variable helpers
export const TEMPLATE_VARIABLES = [
  { var: '{YEAR}', desc: 'Año completo (2026)', example: '2026' },
  { var: '{YEAR2}', desc: 'Año corto (26)', example: '26' },
  { var: '{MONTH}', desc: 'Mes (01-12)', example: '01' },
  { var: '{TYPE}', desc: 'Tipo de expediente', example: 'TM' },
  { var: '{JUR}', desc: 'Jurisdicción', example: 'ES' },
  { var: '{SEQ}', desc: 'Secuencia numérica', example: '001' },
  { var: '{CLIENT}', desc: 'Código del cliente', example: 'ABC' },
] as const;

export const PRESET_FORMATS = [
  { name: 'Año/Tipo/Secuencia', template: '{YEAR}/{TYPE}/{SEQ}', example: '2026/TM/001' },
  { name: 'Tipo-Año-Secuencia', template: '{TYPE}-{YEAR}-{SEQ}', example: 'TM-2026-001' },
  { name: 'Año.Mes.Secuencia', template: '{YEAR}.{MONTH}.{SEQ}', example: '2026.01.001' },
  { name: 'Tipo/Jurisdicción/Año/Seq', template: '{TYPE}/{JUR}/{YEAR2}/{SEQ}', example: 'TM/ES/26/001' },
  { name: 'Cliente-Tipo-Seq', template: '{CLIENT}-{TYPE}-{SEQ}', example: 'ABC-TM-001' },
] as const;

export function generatePreview(
  template: string, 
  seqPadding: number = 3, 
  uppercase: boolean = true
): string {
  let result = template;
  result = result.replace('{YEAR}', '2026');
  result = result.replace('{YEAR2}', '26');
  result = result.replace('{MONTH}', '01');
  result = result.replace('{TYPE}', 'TM');
  result = result.replace('{JUR}', 'ES');
  result = result.replace('{SEQ}', '1'.padStart(seqPadding, '0'));
  result = result.replace('{CLIENT}', 'ABC');
  
  // Clean up empty separators
  result = result.replace(/\/{2,}/g, '/');
  result = result.replace(/-{2,}/g, '-');
  result = result.replace(/^\/|\/$/g, '');
  result = result.replace(/^-|-$/g, '');
  
  if (uppercase) result = result.toUpperCase();
  return result;
}
