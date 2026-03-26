import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/hooks/useOrganization';

export function useBriefingBadge() {
  const { user } = useAuth();
  const { organizationId: orgId } = useOrganization();
  const currentUserId = user?.id;

  return useQuery({
    queryKey: ['briefing-badge', orgId, currentUserId],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('genius_daily_briefings')
        .select('urgent_items')
        .eq('organization_id', orgId!)
        .eq('user_id', currentUserId!)
        .eq('briefing_date', today)
        .maybeSingle();
      return data?.urgent_items || 0;
    },
    enabled: !!orgId && !!currentUserId,
    refetchInterval: 5 * 60 * 1000,
  });
}
