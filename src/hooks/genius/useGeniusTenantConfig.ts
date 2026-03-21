/**
 * Hook for genius_tenant_config management
 * Handles disclaimer acceptance, usage tracking, and feature flags
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

export interface GeniusTenantConfig {
  id: string;
  organization_id: string;
  is_active: boolean;
  plan_code: string;
  max_queries_per_month: number;
  max_documents_per_month: number;
  max_actions_per_month: number;
  current_month_queries: number;
  current_month_documents: number;
  current_month_actions: number;
  current_month_reset_at: string;
  feature_document_generation: boolean;
  feature_app_actions: boolean;
  feature_proactive_analysis: boolean;
  feature_web_search: boolean;
  preferred_language: string;
  disclaimer_accepted: boolean;
  disclaimer_accepted_at: string | null;
  disclaimer_accepted_by: string | null;
  created_at: string;
  updated_at: string;
}

export function useGeniusTenantConfig() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['genius-tenant-config', orgId],
    queryFn: async () => {
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('genius_tenant_config')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;
      return data as GeniusTenantConfig | null;
    },
    enabled: !!orgId,
  });
}

export function useAcceptGeniusDisclaimer() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ responsibleName }: { responsibleName: string }) => {
      if (!currentOrganization?.id || !user?.id) {
        throw new Error('Organization or user not found');
      }

      // Upsert: create config if not exists, update disclaimer
      const { data: existing } = await supabase
        .from('genius_tenant_config')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('genius_tenant_config')
          .update({
            disclaimer_accepted: true,
            disclaimer_accepted_at: new Date().toISOString(),
            disclaimer_accepted_by: user.id,
            updated_at: new Date().toISOString(),
          })
          .eq('organization_id', currentOrganization.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('genius_tenant_config')
          .insert({
            organization_id: currentOrganization.id,
            is_active: false,
            disclaimer_accepted: true,
            disclaimer_accepted_at: new Date().toISOString(),
            disclaimer_accepted_by: user.id,
          });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-tenant-config'] });
    },
  });
}

export function useGeniusUsageStats() {
  const { data: config } = useGeniusTenantConfig();

  if (!config) {
    return {
      queries: { used: 0, max: 0, pct: 0 },
      documents: { used: 0, max: 0, pct: 0 },
      actions: { used: 0, max: 0, pct: 0 },
    };
  }

  const pct = (used: number, max: number) =>
    max <= 0 ? 0 : Math.min(100, Math.round((used / max) * 100));

  return {
    queries: {
      used: config.current_month_queries,
      max: config.max_queries_per_month,
      pct: pct(config.current_month_queries, config.max_queries_per_month),
    },
    documents: {
      used: config.current_month_documents,
      max: config.max_documents_per_month,
      pct: pct(config.current_month_documents, config.max_documents_per_month),
    },
    actions: {
      used: config.current_month_actions,
      max: config.max_actions_per_month,
      pct: pct(config.current_month_actions, config.max_actions_per_month),
    },
  };
}

export function useGeniusCoverageCheck(jurisdictionCode?: string) {
  return useQuery({
    queryKey: ['genius-coverage', jurisdictionCode],
    queryFn: async () => {
      if (!jurisdictionCode) return null;
      const { data, error } = await supabase.rpc('genius_check_coverage', {
        p_jurisdiction_code: jurisdictionCode,
      });
      if (error) throw error;
      return data as {
        can_respond: boolean;
        coverage_level: string;
        effective_score: number;
        quality_penalty: boolean;
        supported_languages: string[];
        requires_translation: boolean;
        rep_requirement: string;
        rep_notes: string | null;
        warnings: string[];
        alerts: string[];
        disclaimer: string;
        last_verification: string | null;
      };
    },
    enabled: !!jurisdictionCode,
    staleTime: 5 * 60 * 1000,
  });
}

export function useProactiveSuggestions() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  return useQuery({
    queryKey: ['genius-proactive', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id || !user?.id) return [];

      const { data, error } = await supabase
        .from('genius_messages')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('content_type', 'proactive')
        .eq('action_status', 'pending')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id && !!user?.id,
  });
}
