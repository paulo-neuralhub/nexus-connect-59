// src/hooks/use-search.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import {
  searchAll,
  quickSearch,
  getSavedSearches,
  saveSearch,
  deleteSavedSearch,
  getRecentSearches,
  clearSearchHistory,
  logSearch,
  type SearchOptions,
  type SearchResponse,
  type SavedSearch,
  type RecentSearch,
  type QuickAction,
} from '@/services/search-service';
import { toast } from 'sonner';

// ==========================================
// GLOBAL SEARCH
// ==========================================

export function useSearch(options: SearchOptions) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['search', currentOrganization?.id, options.query, options.entityTypes, options.filters],
    queryFn: () => searchAll(currentOrganization!.id, options),
    enabled: !!currentOrganization?.id && !!options.query && options.query.length >= 2,
    staleTime: 30 * 1000, // 30 seconds
  });
}

// ==========================================
// QUICK SEARCH (Command Palette)
// ==========================================

export function useQuickSearch(query: string) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['quick-search', currentOrganization?.id, query],
    queryFn: () => quickSearch(currentOrganization!.id, query, user!.id),
    enabled: !!currentOrganization?.id && !!user?.id,
    staleTime: 10 * 1000,
  });
}

// ==========================================
// SAVED SEARCHES
// ==========================================

export function useSavedSearches() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['saved-searches', currentOrganization?.id, user?.id],
    queryFn: () => getSavedSearches(currentOrganization!.id, user!.id),
    enabled: !!currentOrganization?.id && !!user?.id,
  });
}

export function useSaveSearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: {
      name: string;
      description?: string;
      query: string;
      filters: Record<string, any>;
      entityTypes: string[];
      alertEnabled?: boolean;
      alertFrequency?: string;
    }) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('No organization or user');
      }
      return saveSearch(currentOrganization.id, user.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Búsqueda guardada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al guardar búsqueda');
    },
  });
}

export function useDeleteSavedSearch() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (savedSearchId: string) => {
      if (!user?.id) throw new Error('No user');
      return deleteSavedSearch(savedSearchId, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['saved-searches'] });
      toast.success('Búsqueda eliminada');
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al eliminar búsqueda');
    },
  });
}

// ==========================================
// SEARCH HISTORY
// ==========================================

export function useRecentSearches(limit: number = 10) {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['recent-searches', currentOrganization?.id, user?.id, limit],
    queryFn: () => getRecentSearches(user!.id, currentOrganization!.id, limit),
    enabled: !!currentOrganization?.id && !!user?.id,
  });
}

export function useLogSearch() {
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: {
      query: string;
      filters: Record<string, any>;
      entityTypes: string[];
      totalResults: number;
      source: string;
    }) => {
      if (!currentOrganization?.id || !user?.id) return;
      return logSearch(
        currentOrganization.id,
        user.id,
        data.query,
        data.filters,
        data.entityTypes,
        data.totalResults,
        data.source
      );
    },
  });
}

export function useClearSearchHistory() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('No organization or user');
      }
      return clearSearchHistory(user.id, currentOrganization.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recent-searches'] });
      toast.success('Historial borrado');
    },
  });
}
