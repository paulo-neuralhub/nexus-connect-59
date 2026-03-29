import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';
import type { TenantFlags } from './useBillingData';

export function useBillingLimits() {
  const { currentOrganization } = useOrganization();
  const { user } = useAuth();

  const { data: flags, isLoading } = useQuery({
    queryKey: ['tenant-flags', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_feature_flags')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .single();
      if (error) throw error;
      return data as TenantFlags;
    },
    enabled: !!currentOrganization?.id,
  });

  // SuperAdmin bypass
  const { data: isSuperAdmin = false } = useQuery({
    queryKey: ['is-superadmin-billing', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('superadmins')
        .select('id')
        .eq('user_id', user!.id)
        .eq('is_active', true)
        .maybeSingle();
      if (error) return false;
      return !!data;
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 10,
  });

  const hasModule = (moduleCode: string): boolean => {
    if (isSuperAdmin) return true;
    if (!flags) return false;
    const key = `has_${moduleCode}` as keyof TenantFlags;
    return flags[key] === true;
  };

  type LimitType = 'matters' | 'contacts' | 'users' | 'storage' | 'genius_queries_monthly' | 'spider_alerts_monthly' | 'jurisdictions_docket';

  const getLimit = (limitType: LimitType): number => {
    if (!flags) return 0;
    const key = `effective_limit_${limitType}` as keyof TenantFlags;
    return (flags[key] as number) ?? 0;
  };

  const isAtLimit = (limitType: LimitType, current: number): boolean => {
    const limit = getLimit(limitType);
    if (limit === -1) return false;
    return current >= limit;
  };

  const isNearLimit = (limitType: LimitType, current: number, threshold = 0.8): boolean => {
    const limit = getLimit(limitType);
    if (limit === -1) return false;
    return current >= limit * threshold;
  };

  return { flags, loading: isLoading, hasModule, getLimit, isAtLimit, isNearLimit };
}
