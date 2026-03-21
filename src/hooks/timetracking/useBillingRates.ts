/**
 * Billing Rates Hooks
 * UPDATED: Matches real billing_rates schema (rate_name, valid_from, valid_until)
 * Joins profiles instead of users table
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export type RateType = 'user' | 'matter_type' | 'client' | 'default';

export interface BillingRate {
  id: string;
  organization_id: string;
  rate_type: string;
  user_id?: string | null;
  matter_type?: string | null;
  crm_account_id?: string | null;
  activity_type?: string | null;
  rate_name: string;
  hourly_rate: number;
  currency: string;
  is_default: boolean;
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  user?: { id: string; first_name: string; last_name: string } | null;
  account?: { id: string; name: string } | null;
}

// Get all billing rates
export function useBillingRates() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['billing-rates', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('billing_rates')
        .select(`
          *,
          user:profiles!billing_rates_user_id_fkey(id, first_name, last_name),
          account:crm_accounts!billing_rates_crm_account_id_fkey(id, name)
        `)
        .eq('organization_id', currentOrganization.id)
        .order('rate_type', { ascending: true })
        .order('is_default', { ascending: false });

      if (error) throw error;
      return data as BillingRate[];
    },
    enabled: !!currentOrganization?.id,
  });
}

// Create billing rate
export function useCreateBillingRate() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  return useMutation({
    mutationFn: async (data: {
      rate_type: RateType;
      rate_name: string;
      hourly_rate: number;
      currency?: string;
      user_id?: string;
      matter_type?: string;
      crm_account_id?: string;
      activity_type?: string;
      is_default?: boolean;
      valid_from?: string;
      valid_until?: string;
    }) => {
      if (!currentOrganization?.id) {
        throw new Error('No organization');
      }

      const { data: rate, error } = await supabase
        .from('billing_rates')
        .insert({
          organization_id: currentOrganization.id,
          rate_type: data.rate_type,
          rate_name: data.rate_name,
          hourly_rate: data.hourly_rate,
          currency: data.currency || 'EUR',
          user_id: data.user_id || null,
          matter_type: data.matter_type || null,
          crm_account_id: data.crm_account_id || null,
          activity_type: data.activity_type || null,
          is_default: data.is_default || false,
          valid_from: data.valid_from || new Date().toISOString().split('T')[0],
          valid_until: data.valid_until || null,
        })
        .select()
        .single();

      if (error) throw error;
      return rate as BillingRate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-rates'] });
    },
  });
}

// Update billing rate
export function useUpdateBillingRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: Partial<BillingRate> & { id: string }) => {
      const { user, account, ...cleanUpdates } = updates as any;
      const { data, error } = await supabase
        .from('billing_rates')
        .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data as BillingRate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-rates'] });
    },
  });
}

// Delete billing rate
export function useDeleteBillingRate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('billing_rates')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing-rates'] });
    },
  });
}

// Get applicable rate for a user/matter (simplified without RPC)
export function useApplicableRate(matterId: string | undefined) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['applicable-rate', currentOrganization?.id, matterId],
    queryFn: async (): Promise<number | null> => {
      if (!currentOrganization?.id) return null;

      // Get default rate for the org
      const { data } = await supabase
        .from('billing_rates')
        .select('hourly_rate')
        .eq('organization_id', currentOrganization.id)
        .eq('is_default', true)
        .limit(1)
        .maybeSingle();

      return data?.hourly_rate ?? null;
    },
    enabled: !!currentOrganization?.id,
  });
}
