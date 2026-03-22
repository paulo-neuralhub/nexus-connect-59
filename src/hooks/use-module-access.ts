import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useAuth } from '@/contexts/auth-context';

export type ModuleCode = 
  | 'core' 
  | 'docket' 
  | 'spider' 
  | 'crm' 
  | 'marketing' 
  | 'market' 
  | 'genius' 
  | 'finance'
  | 'datahub'
  | 'analytics'
  | 'legalops'
  | 'migrator'
  | 'api';

export type TierCode = 'basic' | 'pro' | 'enterprise';

export interface ModuleLicense {
  module_code: ModuleCode;
  module_name: string;
  tier_code: TierCode;
  tier_name: string;
  license_type: 'included' | 'addon' | 'standalone' | 'trial';
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  expires_at: string | null;
  trial_ends_at: string | null;
  features: string[];
  limits: Record<string, number>;
}

export interface PlatformModule {
  id: string;
  code: string;
  name: string;
  description: string | null;
  tagline: string | null;
  category: string;
  is_standalone_available: boolean;
  is_addon_available: boolean;
  tiers: Array<{
    code: string;
    name: string;
    price: number;
    features: string[];
  }>;
  icon: string | null;
  color: string | null;
  base_price_monthly: number | null;
  base_price_yearly: number | null;
}

// Mapping from ModuleCode to tenant_feature_flags column
const MODULE_FLAG_MAP: Record<string, string> = {
  crm: 'has_crm',
  docket: 'has_docket',
  spider: 'has_spider',
  genius: 'has_genius',
  market: 'has_market',
  finance: 'has_finance_basic',
  analytics: 'has_analytics',
  api: 'has_api_access',
};

// Hook to check if current user is a superadmin (bypasses all module gates)
function useIsSuperadminForModules() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['is-superadmin-modules', user?.id],
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
}

// Hook to get tenant feature flags (the REAL source of truth)
export function useTenantFeatureFlags() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['tenant-feature-flags', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_feature_flags')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 1000 * 60 * 5,
  });
}

// Hook para verificar acceso a un módulo específico
// Now uses tenant_feature_flags (which actually exists) instead of organization_module_licenses
// SUPER ADMINS bypass all module checks
export function useModuleAccess(moduleCode: ModuleCode) {
  const { data: flags, isLoading: flagsLoading } = useTenantFeatureFlags();
  const { data: isSuperadmin, isLoading: superLoading } = useIsSuperadminForModules();

  const flagColumn = MODULE_FLAG_MAP[moduleCode];
  
  // Super admins always have access to everything
  const hasAccess = isSuperadmin
    ? true
    : !flagColumn
      ? true
      : flags
        ? (flags as any)[flagColumn] === true
        : false;

  return {
    hasAccess,
    license: null as ModuleLicense | null,
    isLoading: flagsLoading || superLoading,
    tier: null as TierCode | null,
    features: [] as string[],
    isTrialing: flags?.is_in_trial === true,
    trialDaysLeft: flags?.trial_ends_at
      ? Math.ceil((new Date(flags.trial_ends_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : null,
  };
}

// Hook para verificar si puede usar una feature específica
export function useFeatureAccess(moduleCode: ModuleCode, featureKey: string) {
  const { license, hasAccess } = useModuleAccess(moduleCode);

  if (!hasAccess || !license) {
    return { hasFeature: false, limit: 0, isUnlimited: false };
  }

  const feature = license.features.find(f => f.includes(featureKey));
  
  if (!feature) {
    return { hasFeature: false, limit: 0, isUnlimited: false };
  }

  // Extraer límite numérico si existe (ej: "25_watchlists" -> 25)
  const limitMatch = feature.match(/^(\d+)_/);
  const limit = limitMatch ? parseInt(limitMatch[1]) : -1;

  return {
    hasFeature: true,
    limit,
    isUnlimited: feature.startsWith('unlimited') || limit === -1,
  };
}

// Verificar límite en servidor
export async function checkResourceLimit(
  organizationId: string,
  moduleCode: ModuleCode,
  resourceType: string
): Promise<{ canCreate: boolean; limit: number }> {
  const { data: limit, error } = await supabase.rpc('get_module_limit', {
    p_organization_id: organizationId,
    p_module_code: moduleCode,
    p_limit_key: resourceType,
  });

  if (error) throw error;

  return {
    canCreate: limit === -1 || limit > 0,
    limit: limit || 0,
  };
}
