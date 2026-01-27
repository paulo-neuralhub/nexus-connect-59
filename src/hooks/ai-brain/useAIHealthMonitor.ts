// ============================================================
// IP-NEXUS AI BRAIN - HEALTH MONITOR HOOK
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const QUERY_KEY = 'ai-health-monitor';

export interface ProviderHealthStats {
  id: string;
  code: string;
  name: string;
  health_status: 'healthy' | 'degraded' | 'down' | 'unknown';
  consecutive_failures: number;
  error_count_1h: number;
  success_count_1h: number;
  avg_latency_1h: number | null;
  health_latency_ms: number | null;
  last_error_at: string | null;
  last_error_message: string | null;
  circuit_open: boolean;
  circuit_opened_at: string | null;
  circuit_half_open_at: string | null;
  last_health_check_at: string | null;
}

export interface HealthLogEntry {
  id: string;
  provider_id: string;
  checked_at: string;
  is_healthy: boolean;
  latency_ms: number | null;
  error_code: string | null;
  error_message: string | null;
  check_type: string;
}

// Get all providers with health stats
export function useProviderHealthStats() {
  return useQuery({
    queryKey: [QUERY_KEY, 'providers'],
    queryFn: async (): Promise<ProviderHealthStats[]> => {
      const { data, error } = await supabase
        .from('ai_providers')
        .select(`
          id, code, name, health_status, consecutive_failures,
          error_count_1h, success_count_1h, avg_latency_1h,
          health_latency_ms, last_error_at, last_error_message,
          circuit_open, circuit_opened_at, circuit_half_open_at,
          last_health_check_at
        `)
        .order('name');

      if (error) throw error;
      return data as ProviderHealthStats[];
    },
    refetchInterval: 30000, // Refresh every 30 seconds
  });
}

// Get health log for a specific provider
export function useProviderHealthLog(providerId: string, limit = 50) {
  return useQuery({
    queryKey: [QUERY_KEY, 'log', providerId],
    queryFn: async (): Promise<HealthLogEntry[]> => {
      if (!providerId) return [];

      const { data, error } = await supabase
        .from('ai_provider_health_log')
        .select('*')
        .eq('provider_id', providerId)
        .order('checked_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data as HealthLogEntry[];
    },
    enabled: !!providerId,
    refetchInterval: 10000,
  });
}

// Toggle circuit breaker
export function useToggleCircuitBreaker() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ providerId, open }: { providerId: string; open: boolean }) => {
      const { error } = await supabase.rpc('toggle_circuit_breaker', {
        p_provider_id: providerId,
        p_open: open,
      });

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success(`Circuit breaker ${variables.open ? 'opened' : 'closed'}`);
    },
    onError: (error: Error) => {
      toast.error(`Failed to toggle circuit: ${error.message}`);
    },
  });
}

// Reset provider health
export function useResetProviderHealth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (providerId: string) => {
      const { error } = await supabase.rpc('reset_provider_health', {
        p_provider_id: providerId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
      queryClient.invalidateQueries({ queryKey: ['ai-providers'] });
      toast.success('Provider health reset');
    },
    onError: (error: Error) => {
      toast.error(`Failed to reset health: ${error.message}`);
    },
  });
}

// Report execution result (for use in edge functions/API calls)
export function useReportExecution() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      providerCode,
      success,
      latencyMs,
      errorCode,
      errorMessage,
    }: {
      providerCode: string;
      success: boolean;
      latencyMs?: number;
      errorCode?: string;
      errorMessage?: string;
    }) => {
      const { error } = await supabase.rpc('update_provider_health_after_execution', {
        p_provider_code: providerCode,
        p_success: success,
        p_latency_ms: latencyMs,
        p_error_code: errorCode,
        p_error_message: errorMessage,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY] });
    },
  });
}

// Get health summary for dashboard
export function useHealthSummary() {
  return useQuery({
    queryKey: [QUERY_KEY, 'summary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_providers')
        .select('health_status, circuit_open');

      if (error) throw error;

      const healthy = data?.filter(p => p.health_status === 'healthy' && !p.circuit_open).length || 0;
      const degraded = data?.filter(p => p.health_status === 'degraded').length || 0;
      const down = data?.filter(p => p.health_status === 'down' || p.circuit_open).length || 0;
      const unknown = data?.filter(p => p.health_status === 'unknown').length || 0;

      return {
        total: data?.length || 0,
        healthy,
        degraded,
        down,
        unknown,
        overallStatus: down > 0 ? 'critical' : degraded > 0 ? 'warning' : 'healthy',
      };
    },
    refetchInterval: 30000,
  });
}
