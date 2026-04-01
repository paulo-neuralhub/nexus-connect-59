import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

export interface Opposition {
  id: string;
  organization_id: string;
  opposition_type: 'offensive' | 'defensive' | 'coexistence';
  status: string;
  title: string;
  description: string | null;
  matter_id: string | null;
  spider_alert_id: string | null;
  grounds: string[] | null;
  grounds_detail: string | null;
  opponent_name: string | null;
  opponent_representative: string | null;
  opponent_country: string | null;
  opposed_mark_name: string | null;
  opposed_mark_number: string | null;
  opposed_mark_jurisdiction: string | null;
  opposed_nice_classes: number[] | null;
  filing_date: string | null;
  notification_date: string | null;
  response_deadline: string | null;
  hearing_date: string | null;
  resolution_date: string | null;
  outcome: string | null;
  outcome_notes: string | null;
  coexistence_terms: string | null;
  coexistence_expiry_date: string | null;
  coexistence_territory: string[] | null;
  estimated_cost: number | null;
  actual_cost: number | null;
  currency: string | null;
  assigned_to: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined
  matter_ref?: string;
  mark_name?: string;
}

export function useOppositions(type?: 'offensive' | 'defensive' | 'coexistence') {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['oppositions', organizationId, type],
    queryFn: async () => {
      let query = (supabase as any)
        .from('oppositions')
        .select('*, matters!oppositions_matter_id_fkey(reference, mark_name)')
        .eq('organization_id', organizationId);

      if (type) query = query.eq('opposition_type', type);
      query = query.order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map((o: any) => ({
        ...o,
        matter_ref: o.matters?.reference,
        mark_name: o.matters?.mark_name,
      })) as Opposition[];
    },
    enabled: !!organizationId,
  });
}

export function useOppositionStats() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['opposition-stats', organizationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('oppositions')
        .select('opposition_type, status, outcome')
        .eq('organization_id', organizationId);

      if (error) throw error;
      const all = data || [];

      const offensive = all.filter((o: any) => o.opposition_type === 'offensive');
      const defensive = all.filter((o: any) => o.opposition_type === 'defensive');
      const coexistence = all.filter((o: any) => o.opposition_type === 'coexistence');

      const activeStatuses = ['draft', 'filed', 'examining', 'received', 'defending', 'hearing', 'negotiating'];
      const offensiveActive = offensive.filter((o: any) => activeStatuses.includes(o.status)).length;
      const defensiveActive = defensive.filter((o: any) => activeStatuses.includes(o.status)).length;
      const coexistenceActive = coexistence.filter((o: any) => o.status === 'active' || o.status === 'negotiating').length;

      const offResolved = offensive.filter((o: any) => o.outcome);
      const offWon = offResolved.filter((o: any) => o.outcome === 'won' || o.outcome === 'agreement').length;
      const offSuccessRate = offResolved.length > 0 ? Math.round((offWon / offResolved.length) * 100) : 0;

      const defResolved = defensive.filter((o: any) => o.outcome);
      const defMaintained = defResolved.filter((o: any) => o.outcome === 'maintained' || o.outcome === 'partial').length;
      const defSuccessRate = defResolved.length > 0 ? Math.round((defMaintained / defResolved.length) * 100) : 0;

      return {
        offensiveActive,
        defensiveActive,
        coexistenceActive,
        offensiveSuccessRate: offSuccessRate,
        defensiveSuccessRate: defSuccessRate,
        total: all.length,
      };
    },
    enabled: !!organizationId,
  });
}
