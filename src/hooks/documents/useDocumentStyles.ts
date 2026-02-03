// ============================================================
// HOOK: useDocumentStyles
// Obtiene los 18 estilos visuales desde document_styles
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { DesignTokens, DesignColors, HeaderLayout, StylePack } from '@/lib/document-templates/designTokens';

interface RawDocumentStyle {
  id: string;
  code: string;
  name: string;
  description: string | null;
  pack: string | null;
  head_font: string | null;
  body_font: string | null;
  header_layout: string | null;
  colors: DesignColors | null;
  is_dark: boolean | null;
  sort_order: number | null;
  is_active: boolean | null;
}

function mapToDesignTokens(raw: RawDocumentStyle): DesignTokens {
  const defaultColors: DesignColors = {
    primary: '#1e293b',
    accent: '#2563eb',
    background: '#ffffff',
    backgroundAlt: '#f8fafc',
    headerBg: '#2563eb',
    headerText: '#ffffff',
    text: '#333333',
    textMuted: '#999999',
    border: '#e2e8f0',
    tableHeadBg: '#2563eb',
    tableHeadText: '#ffffff',
    totalBg: '#2563eb',
    totalText: '#ffffff',
  };

  return {
    id: raw.id,
    code: raw.code || raw.id,
    name: raw.name,
    pack: (raw.pack as StylePack) || 'Classic',
    description: raw.description || '',
    headFont: raw.head_font || 'Plus Jakarta Sans, sans-serif',
    bodyFont: raw.body_font || 'Plus Jakarta Sans, sans-serif',
    headerLayout: (raw.header_layout as HeaderLayout) || 'standard',
    colors: raw.colors || defaultColors,
    isDark: raw.is_dark || false,
    sortOrder: raw.sort_order || 0,
  };
}

export function useDocumentStyles() {
  return useQuery({
    queryKey: ['document-styles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('document_styles')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      
      return (data as unknown as RawDocumentStyle[]).map(mapToDesignTokens);
    },
    staleTime: 1000 * 60 * 60, // 1 hour cache
  });
}

export function useDocumentStyle(styleId: string | null) {
  return useQuery({
    queryKey: ['document-style', styleId],
    queryFn: async () => {
      if (!styleId) return null;
      
      const { data, error } = await supabase
        .from('document_styles')
        .select('*')
        .eq('id', styleId)
        .single();

      if (error) throw error;
      
      return mapToDesignTokens(data as unknown as RawDocumentStyle);
    },
    enabled: !!styleId,
    staleTime: 1000 * 60 * 60,
  });
}

// Group styles by pack
export function useDocumentStylesByPack() {
  const { data: styles, ...rest } = useDocumentStyles();
  
  const grouped = styles?.reduce((acc, style) => {
    const pack = style.pack || 'Classic';
    if (!acc[pack]) acc[pack] = [];
    acc[pack].push(style);
    return acc;
  }, {} as Record<StylePack, DesignTokens[]>);
  
  return { data: grouped, ...rest };
}
