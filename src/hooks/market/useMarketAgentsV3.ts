/**
 * Hooks for the new market_agents table (Phase 1 v3 schema)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface MarketAgentProfile {
  id: string;
  user_id: string;
  organization_id?: string;
  display_name: string;
  firm_name?: string;
  slug: string;
  bio?: string;
  avatar_url?: string;
  cover_image_url?: string;
  website?: string;
  linkedin_url?: string;
  country_code: string;
  city?: string;
  timezone?: string;
  jurisdictions: string[];
  specializations: string[];
  languages: string[];
  years_experience: number;
  license_number?: string;
  bar_association?: string;
  market_plan: string;
  is_verified: boolean;
  is_active: boolean;
  is_featured: boolean;
  accepts_new_clients: boolean;
  stripe_account_id?: string;
  stripe_onboarding_complete: boolean;
  stripe_charges_enabled: boolean;
  stripe_payouts_enabled: boolean;
  rating_avg: number;
  ratings_count: number;
  completed_services: number;
  success_rate: number;
  avg_response_hours?: number;
  reputation_score: number;
  default_revisions_included: number;
  extra_revision_fee_eur: number;
  created_at: string;
}

export interface MarketAgentService {
  id: string;
  agent_id: string;
  service_type: string;
  jurisdiction_code: string;
  title?: string;
  description?: string;
  base_price_eur?: number;
  official_fees_eur?: number;
  price_includes_official_fees: boolean;
  additional_class_fee_eur?: number;
  currency: string;
  available_payment_plans: string[];
  estimated_days_min?: number;
  estimated_days_max?: number;
  revisions_included: number;
  includes: string[];
  excludes: string[];
  is_active: boolean;
  sort_order: number;
}

export interface MarketPriceRegulation {
  id: string;
  jurisdiction_code: string;
  jurisdiction_name: string;
  price_display_allowed: boolean;
  price_regulation_type: string;
  legal_basis?: string;
  price_display_note?: string;
}

// ─── Public: list agents with filters ───
export interface AgentFilters {
  search?: string;
  jurisdiction?: string;
  service_type?: string;
  verified_only?: boolean;
  min_rating?: number;
  language?: string;
  featured_only?: boolean;
}

export function useMarketAgentsList(filters: AgentFilters = {}, limit = 20) {
  return useQuery({
    queryKey: ['market-agents-list', filters, limit],
    queryFn: async (): Promise<MarketAgentProfile[]> => {
      let query = (supabase as any)
        .from('market_agents')
        .select('*')
        .eq('is_active', true)
        .order('reputation_score', { ascending: false })
        .limit(limit);

      if (filters.verified_only) query = query.eq('is_verified', true);
      if (filters.featured_only) query = query.eq('is_featured', true);
      if (filters.min_rating) query = query.gte('rating_avg', filters.min_rating);
      if (filters.jurisdiction) query = query.contains('jurisdictions', [filters.jurisdiction]);
      if (filters.language) query = query.contains('languages', [filters.language]);

      const { data, error } = await query;
      if (error) { console.warn('[useMarketAgentsList]', error.message); return []; }
      return data || [];
    },
    staleTime: 1000 * 60 * 3,
  });
}

// ─── Public: single agent by slug ───
export function useMarketAgentBySlug(slug?: string) {
  return useQuery({
    queryKey: ['market-agent-slug', slug],
    queryFn: async (): Promise<MarketAgentProfile | null> => {
      const { data, error } = await (supabase as any)
        .from('market_agents')
        .select('*')
        .eq('slug', slug)
        .eq('is_active', true)
        .maybeSingle();
      if (error) { console.warn('[useMarketAgentBySlug]', error.message); return null; }
      return data;
    },
    enabled: !!slug,
  });
}

// ─── Agent services ───
export function useAgentServices(agentId?: string) {
  return useQuery({
    queryKey: ['market-agent-services', agentId],
    queryFn: async (): Promise<MarketAgentService[]> => {
      const { data, error } = await (supabase as any)
        .from('market_agent_services')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_active', true)
        .order('sort_order');
      if (error) { console.warn('[useAgentServices]', error.message); return []; }
      return data || [];
    },
    enabled: !!agentId,
  });
}

// ─── Price regulations ───
export function usePriceRegulations() {
  return useQuery({
    queryKey: ['market-price-regulations'],
    queryFn: async (): Promise<MarketPriceRegulation[]> => {
      const { data, error } = await (supabase as any)
        .from('market_price_regulations')
        .select('*');
      if (error) { console.warn('[usePriceRegulations]', error.message); return []; }
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });
}

// ─── Agent portfolio ───
export function useAgentPortfolio(agentId?: string) {
  return useQuery({
    queryKey: ['market-agent-portfolio', agentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('market_agent_portfolio')
        .select('*')
        .eq('agent_id', agentId)
        .eq('is_public', true);
      if (error) return [];
      return data || [];
    },
    enabled: !!agentId,
  });
}

// ─── Agent reviews (published) ───
export function useAgentReviews(agentId?: string) {
  return useQuery({
    queryKey: ['market-agent-reviews', agentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('market_reviews')
        .select('*')
        .eq('agent_id', agentId)
        .eq('status', 'published')
        .order('created_at', { ascending: false });
      if (error) return [];
      return data || [];
    },
    enabled: !!agentId,
  });
}

// ─── Agent credentials (verified only for public) ───
export function useAgentCredentials(agentId?: string) {
  return useQuery({
    queryKey: ['market-agent-credentials', agentId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('market_agent_credentials')
        .select('*')
        .eq('agent_id', agentId)
        .eq('verified', true);
      if (error) return [];
      return data || [];
    },
    enabled: !!agentId,
  });
}

// ─── Market stats (real counts) ───
export function useMarketPublicStats() {
  return useQuery({
    queryKey: ['market-public-stats'],
    queryFn: async () => {
      const [agents, verified, services] = await Promise.all([
        (supabase as any).from('market_agents').select('id', { count: 'exact', head: true }).eq('is_active', true),
        (supabase as any).from('market_agents').select('id', { count: 'exact', head: true }).eq('is_active', true).eq('is_verified', true),
        (supabase as any).from('market_service_requests').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);
      return {
        totalAgents: agents.count || 0,
        verifiedAgents: verified.count || 0,
        completedServices: services.count || 0,
      };
    },
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Save/unsave agent ───
export function useSaveAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ agentId, save }: { agentId: string; save: boolean }) => {
      if (save) {
        await (supabase as any).from('market_saved_agents').insert({ agent_id: agentId, user_id: (await supabase.auth.getUser()).data.user?.id });
      } else {
        const userId = (await supabase.auth.getUser()).data.user?.id;
        await (supabase as any).from('market_saved_agents').delete().eq('agent_id', agentId).eq('user_id', userId);
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['market-saved-agents'] }),
  });
}

// ─── My agent profile (for agent area) ───
export function useMyAgentProfile() {
  return useQuery({
    queryKey: ['my-agent-profile'],
    queryFn: async (): Promise<MarketAgentProfile | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data, error } = await (supabase as any)
        .from('market_agents')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      if (error) return null;
      return data;
    },
  });
}

// ─── My service requests (agent) ───
export function useAgentServiceRequests(agentId?: string, status?: string) {
  return useQuery({
    queryKey: ['agent-service-requests', agentId, status],
    queryFn: async () => {
      let query = (supabase as any)
        .from('market_service_requests')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });
      if (status) query = query.eq('status', status);
      const { data, error } = await query;
      if (error) return [];
      return data || [];
    },
    enabled: !!agentId,
  });
}

// ─── Create service request ───
export function useCreateServiceRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await (supabase as any)
        .from('market_service_requests')
        .insert({ ...payload, client_user_id: user.id })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['agent-service-requests'] }),
  });
}
