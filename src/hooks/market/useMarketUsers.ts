import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { MarketUser, MarketUserFilters } from '@/types/market-users';

const PAGE_SIZE = 20;

// =====================================================
// LISTA DE USUARIOS CON PAGINACIÓN INFINITA
// =====================================================

export function useMarketUsers(filters: MarketUserFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['market-users', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('market_users')
        .select('*')
        .eq('is_active', true)
        .eq('is_public_profile', true)
        .order('reputation_score', { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);
      
      // Filtro de búsqueda
      if (filters.search) {
        query = query.or(
          `display_name.ilike.%${filters.search}%,company_name.ilike.%${filters.search}%,bio.ilike.%${filters.search}%`
        );
      }
      
      // Filtros de tipo
      if (filters.user_types?.length) {
        query = query.in('user_type', filters.user_types);
      }
      if (filters.agent_types?.length) {
        query = query.in('agent_type', filters.agent_types);
      }
      
      // Filtros geográficos
      if (filters.countries?.length) {
        query = query.in('country', filters.countries);
      }
      if (filters.jurisdictions?.length) {
        query = query.overlaps('jurisdictions', filters.jurisdictions);
      }
      if (filters.specializations?.length) {
        query = query.overlaps('specializations', filters.specializations);
      }
      
      // Filtros de calidad
      if (filters.min_rating) {
        query = query.gte('rating_avg', filters.min_rating);
      }
      if (filters.min_reputation) {
        query = query.gte('reputation_score', filters.min_reputation);
      }
      if (filters.is_verified_only) {
        query = query.eq('is_verified_agent', true);
      }
      if (filters.accepts_new_clients) {
        query = query.eq('accepts_new_clients', true);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      
      return {
        users: data as unknown as MarketUser[],
        nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined,
      };
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    initialPageParam: 0,
  });
}

// =====================================================
// USUARIO INDIVIDUAL
// =====================================================

export function useMarketUser(userId: string | undefined) {
  return useQuery({
    queryKey: ['market-user', userId],
    queryFn: async () => {
      if (!userId) throw new Error('User ID required');
      
      const { data, error } = await supabase
        .from('market_users')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUser;
    },
    enabled: !!userId,
  });
}

// =====================================================
// USUARIO ACTUAL DEL MARKETPLACE
// =====================================================

export function useCurrentMarketUser() {
  return useQuery({
    queryKey: ['current-market-user'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from('market_users')
        .select('*')
        .eq('auth_user_id', user.id)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data as unknown as MarketUser | null;
    },
  });
}

// =====================================================
// TOP AGENTES
// =====================================================

export function useTopAgents(limit: number = 10) {
  return useQuery({
    queryKey: ['top-agents', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_users')
        .select('*')
        .eq('is_agent', true)
        .eq('is_active', true)
        .eq('is_public_profile', true)
        .eq('is_verified_agent', true)
        .order('reputation_score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as unknown as MarketUser[];
    },
  });
}

// =====================================================
// AGENTES POR JURISDICCIÓN
// =====================================================

export function useAgentsByJurisdiction(jurisdiction: string, limit: number = 10) {
  return useQuery({
    queryKey: ['agents-by-jurisdiction', jurisdiction, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('market_users')
        .select('*')
        .eq('is_agent', true)
        .eq('is_active', true)
        .eq('is_public_profile', true)
        .contains('jurisdictions', [jurisdiction])
        .order('reputation_score', { ascending: false })
        .limit(limit);
      
      if (error) throw error;
      return data as unknown as MarketUser[];
    },
    enabled: !!jurisdiction,
  });
}

// =====================================================
// CREAR/ACTUALIZAR PERFIL
// =====================================================

export function useCreateMarketUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: Partial<MarketUser>) => {
      const { data, error } = await supabase
        .from('market_users')
        .insert(userData as any)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['market-users'] });
      queryClient.invalidateQueries({ queryKey: ['current-market-user'] });
    },
  });
}

export function useUpdateMarketUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<MarketUser> & { id: string }) => {
      const { data, error } = await supabase
        .from('market_users')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data as unknown as MarketUser;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['market-user', data.id] });
      queryClient.invalidateQueries({ queryKey: ['market-users'] });
      queryClient.invalidateQueries({ queryKey: ['current-market-user'] });
    },
  });
}

// =====================================================
// ESTADÍSTICAS
// =====================================================

export function useMarketUserStats() {
  return useQuery({
    queryKey: ['market-user-stats'],
    queryFn: async () => {
      const [totalResult, agentsResult, verifiedResult] = await Promise.all([
        supabase.from('market_users').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('market_users').select('id', { count: 'exact', head: true }).eq('is_agent', true).eq('is_active', true),
        supabase.from('market_users').select('id', { count: 'exact', head: true }).eq('is_verified_agent', true).eq('is_active', true),
      ]);
      
      return {
        totalUsers: totalResult.count || 0,
        totalAgents: agentsResult.count || 0,
        verifiedAgents: verifiedResult.count || 0,
      };
    },
  });
}
