// ============================================================
// HOOK: useTemplatePreferences
// Gestiona el estilo por defecto y plantillas activas del tenant
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

export interface TemplatePreferences {
  id: string;
  organization_id: string;
  default_style_id: string | null;
  disabled_document_types: string[];
  updated_at: string;
}

// Local storage key for disabled types (until DB migration)
const getDisabledTypesKey = (orgId: string) => `ipnexus_disabled_doc_types_${orgId}`;

// Obtener preferencias de plantillas del tenant
export function useTemplatePreferences() {
  const { currentOrganization } = useOrganization();
  const [localDisabledTypes, setLocalDisabledTypes] = useState<string[]>([]);
  
  // Load from localStorage
  useEffect(() => {
    if (currentOrganization?.id) {
      const saved = localStorage.getItem(getDisabledTypesKey(currentOrganization.id));
      if (saved) {
        try {
          setLocalDisabledTypes(JSON.parse(saved));
        } catch {
          setLocalDisabledTypes([]);
        }
      }
    }
  }, [currentOrganization?.id]);
  
  const query = useQuery({
    queryKey: ['template-preferences', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;
      
      const { data, error } = await supabase
        .from('tenant_document_preferences')
        .select('id, organization_id, default_style_id, updated_at')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();
      
      if (error && error.code !== 'PGRST116') throw error;
      
      // Si no existe, retornar defaults
      if (!data) {
        return {
          id: '',
          organization_id: currentOrganization.id,
          default_style_id: null,
          disabled_document_types: localDisabledTypes,
          updated_at: new Date().toISOString(),
        } as TemplatePreferences;
      }
      
      return {
        id: data.id,
        organization_id: data.organization_id,
        default_style_id: data.default_style_id,
        disabled_document_types: localDisabledTypes, // From localStorage for now
        updated_at: data.updated_at || new Date().toISOString(),
      } as TemplatePreferences;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 1000 * 60 * 5, // 5 min cache
  });
  
  return {
    ...query,
    data: query.data ? { ...query.data, disabled_document_types: localDisabledTypes } : query.data,
  };
}

// Actualizar estilo por defecto
export function useSetDefaultStyle() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (styleId: string) => {
      if (!currentOrganization?.id) throw new Error('No organization');
      
      const { data, error } = await supabase
        .from('tenant_document_preferences')
        .upsert({
          organization_id: currentOrganization.id,
          default_style_id: styleId,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'organization_id' })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['template-preferences'] });
      toast.success('Estilo por defecto actualizado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Toggle documento activo/inactivo (usando localStorage por ahora)
export function useToggleDocumentType() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ typeId, enabled }: { typeId: string; enabled: boolean }) => {
      if (!currentOrganization?.id) throw new Error('No organization');
      
      const key = getDisabledTypesKey(currentOrganization.id);
      const saved = localStorage.getItem(key);
      let currentDisabled: string[] = [];
      
      if (saved) {
        try {
          currentDisabled = JSON.parse(saved);
        } catch {
          currentDisabled = [];
        }
      }
      
      let newDisabled: string[];
      
      if (enabled) {
        // Remover de deshabilitados
        newDisabled = currentDisabled.filter(id => id !== typeId);
      } else {
        // Añadir a deshabilitados
        newDisabled = [...new Set([...currentDisabled, typeId])];
      }
      
      // Save to localStorage
      localStorage.setItem(key, JSON.stringify(newDisabled));
      
      return { disabled: newDisabled };
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['template-preferences'] });
      toast.success(variables.enabled ? 'Plantilla activada' : 'Plantilla desactivada');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// Obtener tipos de documento activos (excluye deshabilitados)
export function useActiveDocumentTypes() {
  const { currentOrganization } = useOrganization();
  const [disabledTypes, setDisabledTypes] = useState<string[]>([]);
  
  useEffect(() => {
    if (currentOrganization?.id) {
      const key = getDisabledTypesKey(currentOrganization.id);
      const saved = localStorage.getItem(key);
      if (saved) {
        try {
          setDisabledTypes(JSON.parse(saved));
        } catch {
          setDisabledTypes([]);
        }
      }
    }
  }, [currentOrganization?.id]);
  
  // Listen for storage changes
  useEffect(() => {
    const handleStorage = () => {
      if (currentOrganization?.id) {
        const key = getDisabledTypesKey(currentOrganization.id);
        const saved = localStorage.getItem(key);
        if (saved) {
          try {
            setDisabledTypes(JSON.parse(saved));
          } catch {
            setDisabledTypes([]);
          }
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [currentOrganization?.id]);
  
  const disabledSet = new Set(disabledTypes);
  
  return {
    isTypeEnabled: (typeId: string) => !disabledSet.has(typeId),
    disabledCount: disabledSet.size,
  };
}
