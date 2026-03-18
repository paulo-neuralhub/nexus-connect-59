import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import { useCurrentSubscription } from '@/hooks/use-subscription';
import type { FeatureFlag } from '@/types/backoffice';

export function useFeatureFlags() {
  return useQuery({
    queryKey: ['feature-flags'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feature_flags')
        .select('*');
      if (error) throw error;
      return data as FeatureFlag[];
    },
    staleTime: 1000 * 60 * 5, // 5 minutos
  });
}

export function useFeatureFlag(code: string): boolean {
  const { data: flags } = useFeatureFlags();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  const { data: subscription } = useCurrentSubscription();
  
  if (!flags) return false;
  
  const flag = flags.find(f => f.code === code);
  if (!flag) return false;
  
  // Globalmente deshabilitado
  if (!flag.is_enabled) return false;
  
  // Usuario específico
  if (user && flag.enabled_for_users.includes(user.id)) return true;
  
  // Organización específica
  if (currentOrganization && flag.enabled_for_orgs.includes(currentOrganization.id)) return true;
  
  // Plan específico
  if (subscription?.plan?.code && flag.enabled_for_plans.includes(subscription.plan.code)) return true;
  
  // Rollout porcentual
  if (flag.rollout_percentage > 0 && flag.rollout_percentage < 100) {
    if (user) {
      const hash = user.id.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0);
      const userPercentage = Math.abs(hash % 100);
      return userPercentage < flag.rollout_percentage;
    }
  }
  
  // Si rollout es 100%, está habilitado para todos
  if (flag.rollout_percentage === 100) return true;
  
  // Si no hay targeting específico pero is_enabled
  if (flag.enabled_for_plans.length === 0 && 
      flag.enabled_for_orgs.length === 0 && 
      flag.enabled_for_users.length === 0 &&
      flag.rollout_percentage === 0) {
    return flag.is_enabled;
  }
  
  return false;
}
