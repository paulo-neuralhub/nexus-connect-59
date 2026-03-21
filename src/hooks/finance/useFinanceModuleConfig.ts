// src/hooks/finance/useFinanceModuleConfig.ts
// Hook for finance module configuration per tenant

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export interface FinanceModuleConfig {
  id: string;
  organization_id: string;
  finance_tier: 'basic' | 'advanced';
  primary_country: string;
  fiscal_year_start_month: number;
  functional_currency: string;
  feature_timesheet: boolean;
  feature_expenses: boolean;
  feature_provisions: boolean;
  feature_valuation: boolean;
  feature_accounting: boolean;
  feature_bank_reconciliation: boolean;
  feature_regulatory_reporting: boolean;
  default_payment_terms_days: number;
  default_invoice_language: string;
  invoice_footer_text: string | null;
  invoice_series_default: string;
  created_at: string;
  updated_at: string;
}

export function useFinanceModuleConfig() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  return useQuery({
    queryKey: ['finance-module-config', currentOrganization?.id],
    queryFn: async (): Promise<FinanceModuleConfig> => {
      const orgId = currentOrganization!.id;

      // Try to get existing config
      const { data, error } = await supabase
        .from('finance_module_config')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;
      if (data) return data as FinanceModuleConfig;

      // Auto-create with defaults (basic tier)
      const { data: created, error: createError } = await supabase
        .from('finance_module_config')
        .insert({ organization_id: orgId })
        .select()
        .single();

      if (createError) throw createError;
      return created as FinanceModuleConfig;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateFinanceModuleConfig() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (updates: Partial<FinanceModuleConfig>) => {
      const { data, error } = await supabase
        .from('finance_module_config')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('organization_id', currentOrganization!.id)
        .select()
        .single();

      if (error) throw error;
      return data as FinanceModuleConfig;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-module-config'] });
    },
  });
}

/**
 * Check if a specific Advanced feature is enabled
 */
export function useFinanceFeature(feature: keyof Pick<
  FinanceModuleConfig,
  'feature_accounting' | 'feature_bank_reconciliation' | 'feature_valuation' | 'feature_regulatory_reporting'
>) {
  const { data: config } = useFinanceModuleConfig();
  return {
    enabled: config?.[feature] ?? false,
    tier: config?.finance_tier ?? 'basic',
    isAdvanced: config?.finance_tier === 'advanced',
    isLoading: !config,
  };
}
