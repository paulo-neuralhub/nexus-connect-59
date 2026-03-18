import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type VoipPlan = {
  id: string;
  name: string;
  code: string;
  description: string | null;
  plan_type: string;
  included_minutes: number | null;
  monthly_price_cents: number;
  price_per_minute_cents: number;
  overage_price_per_minute_cents: number | null;
  cost_per_minute_cents: number;
  features: Record<string, unknown> | null;
  max_concurrent_calls: number;
  max_call_duration_minutes: number;
  is_active: boolean;
  is_default: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
};

export function useVoipPlans() {
  return useQuery({
    queryKey: ['voip-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_pricing_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order');

      if (error) throw error;
      return (data ?? []) as VoipPlan[];
    },
  });
}
