import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface SubscriptionData {
  id: string;
  status: string;
  plan: string;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

// Get current subscription
export function useSubscription() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['subscription', currentOrganization?.id],
    queryFn: async (): Promise<SubscriptionData | null> => {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null; // Not found
        throw error;
      }

      // Get plan from price_id or organization
      const { data: org } = await supabase
        .from('organizations')
        .select('plan')
        .eq('id', currentOrganization!.id)
        .single();

      return {
        id: data.id,
        status: data.status || 'inactive',
        plan: org?.plan || 'starter',
        currentPeriodStart: data.current_period_start || '',
        currentPeriodEnd: data.current_period_end || '',
        cancelAtPeriodEnd: data.cancel_at_period_end || false,
      };
    },
    enabled: !!currentOrganization?.id,
  });
}

// Create checkout session
export function useCreateCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      priceId, 
      successUrl, 
      cancelUrl 
    }: { 
      priceId: string; 
      successUrl?: string; 
      cancelUrl?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('stripe-checkout', {
        body: { 
          priceId,
          successUrl: successUrl || `${window.location.origin}/app/settings/billing?success=true`,
          cancelUrl: cancelUrl || `${window.location.origin}/pricing`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear sesión de pago');
    },
  });
}

// Open customer portal
export function useOpenPortal() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const { data, error } = await supabase.functions.invoke('stripe-portal', {
        body: { 
          returnUrl: returnUrl || `${window.location.origin}/app/settings/billing`,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.location.href = data.url;
      }
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al abrir portal de facturación');
    },
  });
}

// Get available plans/prices - using organization settings
export function useAvailablePlans() {
  return useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      // Return static plans since stripe_prices table may not exist
      return [
        { id: 'starter', name: 'Starter', price: 99, interval: 'month' },
        { id: 'professional', name: 'Professional', price: 249, interval: 'month' },
        { id: 'business', name: 'Business', price: 499, interval: 'month' },
        { id: 'enterprise', name: 'Enterprise', price: 0, interval: 'month', custom: true },
      ];
    },
  });
}

// Get billing history from payments table
export function useBillingHistory() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['billing-history', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payments')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });
}
