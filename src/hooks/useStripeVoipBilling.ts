import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export function useVoipStripeCheckout() {
  return useMutation({
    mutationFn: async (payload: { voipPlanId: string; billingCycle?: 'monthly' | 'yearly' }) => {
      const { data, error } = await supabase.functions.invoke('stripe-create-checkout', {
        body: {
          voip_plan_id: payload.voipPlanId,
          billing_cycle: payload.billingCycle || 'monthly',
          success_url: `${window.location.origin}/app/settings/voip?success=true`,
          cancel_url: `${window.location.origin}/app/settings/voip?canceled=true`,
        },
      });
      if (error) throw error;
      return data as { url?: string; session_id?: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo iniciar el checkout');
    },
  });
}

export function useVoipStripePortal() {
  return useMutation({
    mutationFn: async (returnUrl?: string) => {
      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: { return_url: returnUrl || window.location.href },
      });
      if (error) throw error;
      return data as { url?: string };
    },
    onSuccess: (data) => {
      if (data?.url) window.location.href = data.url;
    },
    onError: (err: Error) => {
      toast.error(err.message || 'No se pudo abrir el portal');
    },
  });
}
