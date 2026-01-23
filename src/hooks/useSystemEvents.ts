import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type SystemEventSeverity = 'debug' | 'info' | 'warning' | 'error' | 'critical';

export interface SystemEventFilters {
  search?: string;
  category?: string | null;
  severity?: SystemEventSeverity | null;
  source?: string | null;
  organizationId?: string | null;
  requiresAction?: boolean;
  startDate?: Date;
  endDate?: Date;
}

export function useSystemEvents(filters: SystemEventFilters = {}) {
  return useInfiniteQuery({
    queryKey: ['system-events', filters],
    queryFn: async ({ pageParam = 0 }) => {
      let query = supabase
        .from('system_events')
        .select('*, organizations(name)')
        .order('created_at', { ascending: false })
        .range(pageParam, pageParam + 49);

      if (filters.search?.trim()) {
        query = query.textSearch('search_vector', filters.search.trim());
      }
      if (filters.category) query = query.eq('event_category', filters.category);
      if (filters.severity) query = query.eq('severity', filters.severity);
      if (filters.source) query = query.eq('source', filters.source);
      if (filters.organizationId) query = query.eq('organization_id', filters.organizationId);
      if (filters.requiresAction) {
        query = query.eq('requires_action', true).in('action_status', ['pending', 'in_progress']);
      }
      if (filters.startDate) query = query.gte('created_at', filters.startDate.toISOString());
      if (filters.endDate) query = query.lte('created_at', filters.endDate.toISOString());

      const { data, error } = await query;
      if (error) throw error;
      return data ?? [];
    },
    getNextPageParam: (lastPage, pages) => {
      if (!lastPage || lastPage.length < 50) return undefined;
      return pages.length * 50;
    },
    initialPageParam: 0,
  });
}

export function usePendingEvents() {
  return useQuery({
    queryKey: ['pending-events'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_pending_events')
        .select('*')
        .limit(50);
      if (error) throw error;
      return data ?? [];
    },
    refetchInterval: 30_000,
  });
}

export function usePendingEventsCount() {
  return useQuery({
    queryKey: ['pending-events-count'],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('v_pending_events')
        .select('*', { count: 'exact', head: true });
      if (error) throw error;
      return count ?? 0;
    },
    refetchInterval: 30_000,
  });
}

export function useEventStats() {
  return useQuery({
    queryKey: ['event-stats'],
    queryFn: async () => {
      const { data, error } = await supabase.from('v_event_stats').select('*');
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useResolveEvent() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, notes }: { eventId: string; notes?: string }) => {
      const { data, error } = await supabase.rpc('resolve_event', {
        p_event_id: eventId,
        p_resolution_notes: notes ?? null,
      });
      if (error) throw error;
      return data as boolean;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['system-events'] });
      qc.invalidateQueries({ queryKey: ['pending-events'] });
      qc.invalidateQueries({ queryKey: ['pending-events-count'] });
    },
  });
}
