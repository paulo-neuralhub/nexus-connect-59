// ============================================================
// HOOK: useDocumentTypes
// Obtiene los 15 tipos de documento desde document_types
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DocumentType, DocumentCategory } from '@/lib/document-templates/designTokens';

interface RawDocumentType {
  id: string;
  name: string;
  name_en: string | null;
  icon: string | null;
  category: string;
  description: string | null;
  sort_order: number | null;
}

function mapToDocumentType(raw: RawDocumentType): DocumentType {
  return {
    id: raw.id,
    name: raw.name,
    nameEn: raw.name_en || raw.name,
    icon: raw.icon || '📄',
    category: raw.category as DocumentCategory,
    description: raw.description || '',
    sortOrder: raw.sort_order || 0,
  };
}

export function useDocumentTypes() {
  return useQuery({
    queryKey: ['document-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return (data as RawDocumentType[]).map(mapToDocumentType);
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

export function useDocumentType(typeId: string | null) {
  return useQuery({
    queryKey: ['document-type', typeId],
    queryFn: async () => {
      if (!typeId) return null;
      
      const { data, error } = await supabase
        .from('document_types')
        .select('*')
        .eq('id', typeId)
        .single();

      if (error) throw error;
      
      return mapToDocumentType(data as RawDocumentType);
    },
    enabled: !!typeId,
    staleTime: 1000 * 60 * 60,
  });
}

// Group types by category
export function useDocumentTypesByCategory() {
  const { data: types, ...rest } = useDocumentTypes();
  
  const grouped = types?.reduce((acc, type) => {
    const category = type.category || 'financiero';
    if (!acc[category]) acc[category] = [];
    acc[category].push(type);
    return acc;
  }, {} as Record<DocumentCategory, DocumentType[]>);
  
  return { data: grouped, ...rest };
}
