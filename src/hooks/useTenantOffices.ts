// ============================================================
// TENANT OFFICES - SOLO LECTURA
// ============================================================
// Las oficinas IP son gestionadas GLOBALMENTE por IP-NEXUS.
// Los tenants VEN oficinas según su plan de suscripción.
// NO pueden configurar, añadir ni cancelar oficinas.
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";

export interface TenantOffice {
  id: string;
  code: string;
  name: string;
  name_short?: string;
  country_code?: string;
  country_name?: string;
  region?: string;
  flag_emoji?: string;
  automation_level?: 'A' | 'B' | 'C' | 'D' | 'E';
  automation_percentage?: number;
  operational_status?: 'operational' | 'degraded' | 'maintenance' | 'down';
  last_sync_at?: string;
  has_access: boolean; // Determinado por el plan
  capabilities?: Record<string, { available: boolean; method: 'api' | 'web' | 'manual'; notes?: string }>;
}

// Helper: Get included offices by plan (temporal hasta tener office_plan_inclusions)
function getIncludedOfficesForPlan(plan: string): string[] {
  switch (plan) {
    case 'enterprise':
    case 'empresarial':
      return ['EUIPO', 'OEPM', 'USPTO', 'WIPO', 'EPO', 'UKIPO', 'DPMA', 'INPI_FR', 'JPO', 'CNIPA', 'INPI_BR', 'IMPI', 'INAPI', 'INDECOPI'];
    case 'business':
      return ['EUIPO', 'OEPM', 'USPTO', 'WIPO', 'EPO', 'UKIPO'];
    case 'professional':
    case 'basico':
      return ['EUIPO', 'OEPM', 'USPTO'];
    case 'starter':
    case 'free':
    default:
      return ['OEPM'];
  }
}

// Get flag emoji from country code
function getFlagEmoji(countryCode?: string): string {
  if (!countryCode || countryCode.length !== 2) return '🌐';
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map(char => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
}

export function useTenantOffices() {
  const { currentOrganization } = useOrganization();
  const plan = currentOrganization?.plan || 'starter';

  const { data: offices = [], isLoading, error, refetch } = useQuery({
    queryKey: ['tenant-offices-readonly', currentOrganization?.id, plan],
    queryFn: async (): Promise<TenantOffice[]> => {
      if (!currentOrganization?.id) return [];

      // Intentar usar la función RPC primero
      const { data: rpcData, error: rpcError } = await supabase
        .rpc('get_offices_with_plan_access', { p_plan: plan });

      if (!rpcError && rpcData) {
        return rpcData.map((office: any) => ({
          id: office.id,
          code: office.code,
          name: office.name,
          name_short: office.name_short || undefined,
          country_code: office.country_code || undefined,
          country_name: office.country_name || undefined,
          region: office.region || undefined,
          flag_emoji: office.flag_emoji || getFlagEmoji(office.country_code || undefined),
          automation_level: office.automation_level || 'E',
          automation_percentage: office.automation_percentage ?? 0,
          operational_status: office.operational_status as TenantOffice['operational_status'],
          last_sync_at: office.last_sync_at || undefined,
          has_access: office.has_access,
          capabilities: office.capabilities || {},
        }));
      }

      // Fallback: query directo si la función RPC no existe
      const { data: allOffices, error: officesError } = await supabase
        .from('ipo_offices')
        .select('*')
        .eq('is_active', true)
        .order('tier', { ascending: true })
        .order('name_short', { ascending: true });

      if (officesError) throw officesError;

      // Determine included offices based on plan (fallback hardcoded)
      const includedOfficeCodes = getIncludedOfficesForPlan(plan);

      // Build offices list with access info
      const tenantOffices: TenantOffice[] = (allOffices || []).map((office: any) => ({
        id: office.id,
        code: office.code,
        name: office.name_official,
        name_short: office.name_short || undefined,
        country_code: office.country_code || undefined,
        country_name: office.country_name || undefined,
        region: office.region || undefined,
        flag_emoji: office.flag_emoji || getFlagEmoji(office.country_code || undefined),
        automation_level: office.automation_level || 'E',
        automation_percentage: office.automation_percentage ?? 0,
        operational_status: (office.operational_status as TenantOffice['operational_status']) || 'operational',
        last_sync_at: office.last_health_check || undefined,
        has_access: includedOfficeCodes.includes(office.code),
        capabilities: office.capabilities || {},
      }));

      // Sort: accessible offices first
      return tenantOffices.sort((a, b) => {
        if (a.has_access && !b.has_access) return -1;
        if (!a.has_access && b.has_access) return 1;
        return 0;
      });
    },
    enabled: !!currentOrganization?.id,
  });

  // Check if tenant has access to a specific office
  const hasAccess = (officeCode: string): boolean => {
    const office = offices.find(o => o.code === officeCode);
    return office?.has_access || false;
  };

  // Offices the tenant has access to
  const myOffices = offices.filter(o => o.has_access);

  // Offices the tenant does NOT have access to (for upgrade prompt)
  const lockedOffices = offices.filter(o => !o.has_access);

  return {
    offices,         // All offices with has_access info
    myOffices,       // Only accessible offices
    lockedOffices,   // Offices requiring upgrade
    isLoading,
    error,
    hasAccess,
    refetch,
  };
}
