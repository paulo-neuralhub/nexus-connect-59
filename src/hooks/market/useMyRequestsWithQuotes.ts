/**
 * useMyRequestsWithQuotes
 * Fetches the current user's RFQ requests WITH their received quotes + agent info.
 * Used by the "Mis Solicitudes" tab in IP-Market.
 */
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { RfqRequest, RfqQuote } from '@/types/quote-request';

export interface QuoteAgentInfo {
  id: string;
  display_name: string;
  avatar_url: string | null;
  rating_avg: number;
  ratings_count: number;
  is_verified_agent: boolean;
  total_transactions: number;
  success_rate: number;
  response_time_avg: number;
  jurisdictions: string[] | null;
}

export interface QuoteWithAgent {
  id: string;
  request_id: string;
  agent_id: string;
  reference_number: string;
  total_price: number;
  currency: string;
  price_breakdown: RfqQuote['price_breakdown'];
  estimated_duration_days: number;
  proposal_summary: string;
  status: RfqQuote['status'];
  created_at: string;
  agent?: QuoteAgentInfo;
}

export interface RfqRequestWithQuotes extends Omit<RfqRequest, 'quotes'> {
  quotes: QuoteWithAgent[];
}

export function useMyRequestsWithQuotes() {
  return useQuery({
    queryKey: ['my-rfq-requests-with-quotes'],
    queryFn: async (): Promise<RfqRequestWithQuotes[]> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: marketUser } = await supabase
        .from('market_users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single();

      if (!marketUser) return [];

      const { data: requests, error: reqError } = await supabase
        .from('rfq_requests')
        .select('*')
        .eq('requester_id', marketUser.id)
        .order('created_at', { ascending: false });

      if (reqError) throw reqError;
      if (!requests?.length) return [];

      const requestIds = requests.map(r => r.id);

      const { data: quotes, error: qError } = await supabase
        .from('rfq_quotes')
        .select(`
          id, request_id, agent_id, reference_number,
          total_price, currency, price_breakdown,
          estimated_duration_days, proposal_summary, status, created_at,
          agent:market_users!rfq_quotes_agent_id_fkey(
            id, display_name, avatar_url, rating_avg, ratings_count,
            is_verified_agent, total_transactions, success_rate,
            response_time_avg, jurisdictions
          )
        `)
        .in('request_id', requestIds)
        .order('total_price', { ascending: true });

      if (qError) {
        console.warn('[useMyRequestsWithQuotes] quotes error:', qError.message);
      }

      const quotesByRequest = new Map<string, QuoteWithAgent[]>();
      for (const q of (quotes || []) as unknown as QuoteWithAgent[]) {
        const list = quotesByRequest.get(q.request_id) || [];
        list.push(q);
        quotesByRequest.set(q.request_id, list);
      }

      return (requests as unknown as RfqRequest[]).map(req => ({
        ...req,
        quotes: quotesByRequest.get(req.id) || [],
      }));
    },
    staleTime: 1000 * 60 * 2,
  });
}
