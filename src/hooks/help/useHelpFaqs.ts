// ============================================================
// IP-NEXUS HELP - FAQ HOOKS (P77)
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { HelpFAQ } from '@/types/help';

export function useHelpFAQs(category?: string) {
  return useQuery({
    queryKey: ['help-faqs', category],
    queryFn: async () => {
      let query = supabase
        .from('help_faqs')
        .select('*')
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (category && category !== 'all') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data || []) as HelpFAQ[];
    },
    staleTime: 1000 * 60 * 10,
  });
}
