import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { VoipPlan } from '@/hooks/useVoipPlans';

export type BackofficeVoipPlan = VoipPlan;

export function useBackofficeVoipPlans() {
  return useQuery({
    queryKey: ['backoffice-voip-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('voip_pricing_plans')
        .select('*')
        .order('display_order');

      if (error) throw error;
      return (data ?? []) as BackofficeVoipPlan[];
    },
  });
}

export function useUpsertBackofficeVoipPlan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: Partial<BackofficeVoipPlan> & { id?: string }) => {
      const { data, error } = await supabase
        .from('voip_pricing_plans')
        // Supabase typings can be overly strict here; runtime accepts a single row object.
        .upsert([payload as any], { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;
      return data as BackofficeVoipPlan;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice-voip-plans'] });
      qc.invalidateQueries({ queryKey: ['voip-plans'] });
      toast.success('Plan guardado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
