/**
 * useMarketStats - Hook para estadísticas del Market (datos reales)
 * Reemplaza datos mock con queries a la BD
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';

export interface MarketStats {
  active: { count: number; value: number };
  pending: { count: number; value: number };
  won: { count: number; value: number };
  rejected: { count: number; value: number };
}

export function useMarketStats() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['market-stats', organizationId],
    queryFn: async (): Promise<MarketStats> => {
      // Estadísticas vacías por defecto
      const stats: MarketStats = {
        active: { count: 0, value: 0 },
        pending: { count: 0, value: 0 },
        won: { count: 0, value: 0 },
        rejected: { count: 0, value: 0 },
      };

      if (!organizationId) return stats;

      try {
        // Consultar market_listings para estadísticas
        const { data: listings, error } = await (supabase
          .from('market_listings') as any)
          .select('id, status, asking_price')
          .eq('organization_id', organizationId);

        if (error) {
          console.warn('[useMarketStats] Error fetching listings:', error.message);
          return stats;
        }

        if (!listings || listings.length === 0) return stats;

        // Agrupar por status
        for (const listing of listings as any[]) {
          const price = listing.asking_price || 0;
          const status = String(listing.status);
          
          if (status === 'active') {
            stats.active.count++;
            stats.active.value += price;
          } else if (['pending', 'under_review', 'pending_verification'].includes(status)) {
            stats.pending.count++;
            stats.pending.value += price;
          } else if (['completed', 'sold', 'licensed'].includes(status)) {
            stats.won.count++;
            stats.won.value += price;
          } else if (['rejected', 'expired', 'cancelled', 'withdrawn', 'suspended'].includes(status)) {
            stats.rejected.count++;
            stats.rejected.value += price;
          }
        }

        return stats;
      } catch (err) {
        console.warn('[useMarketStats] Unexpected error:', err);
        return stats;
      }
    },
    enabled: !!organizationId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export interface RfqRequest {
  id: string;
  reference: string;
  title: string;
  service_category: string;
  jurisdictions: string[];
  budget_min: number;
  budget_max: number;
  currency: string;
  deadline: string;
  quotes_count: number;
  status: string;
  client_name: string;
  created_at: string;
}

export interface RfqQuote {
  id: string;
  rfq_request_id: string;
  request_reference: string;
  request_title: string;
  client_name: string;
  amount: number;
  currency: string;
  status: string;
  submitted_at?: string;
  created_at: string;
}

export function useRfqRequests() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['rfq-requests', organizationId],
    queryFn: async (): Promise<RfqRequest[]> => {
      if (!organizationId) return [];

      try {
        const { data, error } = await (supabase
          .from('rfq_requests') as any)
          .select('*')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('[useRfqRequests] Table may not exist:', error.message);
          return [];
        }

        return (data || []).map((r: any) => ({
          id: r.id,
          reference: r.reference || `#REQ-${r.id.substring(0, 8)}`,
          title: r.title || 'Sin título',
          service_category: r.service_category || 'other',
          jurisdictions: r.jurisdictions || [],
          budget_min: r.budget_min || 0,
          budget_max: r.budget_max || 0,
          currency: r.currency || 'EUR',
          deadline: r.deadline || new Date().toISOString(),
          quotes_count: r.quotes_count || 0,
          status: r.status || 'open',
          client_name: r.client_name || 'Cliente',
          created_at: r.created_at,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!organizationId,
  });
}

export function useRfqQuotes() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['rfq-quotes', organizationId],
    queryFn: async (): Promise<RfqQuote[]> => {
      if (!organizationId) return [];

      try {
        const { data, error } = await (supabase
          .from('rfq_quotes') as any)
          .select('*, rfq_requests(reference, title, client_name)')
          .eq('organization_id', organizationId)
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) {
          console.warn('[useRfqQuotes] Table may not exist:', error.message);
          return [];
        }

        return (data || []).map((q: any) => ({
          id: q.id,
          rfq_request_id: q.rfq_request_id,
          request_reference: q.rfq_requests?.reference || '',
          request_title: q.rfq_requests?.title || '',
          client_name: q.rfq_requests?.client_name || 'Cliente',
          amount: q.amount || 0,
          currency: q.currency || 'EUR',
          status: q.status || 'submitted',
          submitted_at: q.submitted_at,
          created_at: q.created_at,
        }));
      } catch {
        return [];
      }
    },
    enabled: !!organizationId,
  });
}
