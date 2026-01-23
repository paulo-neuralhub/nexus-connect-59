import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

export type VoipUsageRecord = {
  id: string;
  call_sid: string | null;
  direction: string;
  from_number: string | null;
  to_number: string | null;
  started_at: string;
  ended_at: string | null;
  duration_seconds: number;
  billable_minutes: number;
  minute_type: string;
  total_price_cents: number;
  status: string;
  created_at: string;
};

export function useVoipUsage() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['voip-usage', currentOrganization?.id],
    enabled: !!currentOrganization?.id,
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('voip_usage_records')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('started_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      return (data ?? []) as VoipUsageRecord[];
    },
  });
}
