import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export type VoipSubscription = {
  id: string;
  organization_id: string;
  plan_id: string;
  status: string;
  billing_cycle_start: string;
  billing_cycle_end: string;
  minutes_used: number;
  minutes_included: number | null;
  total_minutes_used: number;
  total_calls: number;
  total_amount_cents: number;
  twilio_subaccount_sid: string | null;
  twilio_phone_number: string | null;
  created_at: string;
  updated_at: string;
};

export function useVoipSubscription() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['voip-subscription', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('voip_subscriptions')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      return (data ?? null) as VoipSubscription | null;
    },
  });
}
