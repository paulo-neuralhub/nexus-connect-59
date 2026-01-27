import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { toast } from "sonner";

export interface TenantOffice {
  id: string;
  office_code: string;
  office_name: string;
  office_name_short?: string;
  country_code?: string;
  region?: string;
  office_type?: string;
  source_type: 'included' | 'addon';
  is_active: boolean;
  operational_status?: 'operational' | 'degraded' | 'maintenance' | 'down';
  last_sync_at?: string;
  matters_count: number;
  price_monthly?: number;
  flag_emoji?: string;
  // Automation fields
  automation_level?: 'A' | 'B' | 'C' | 'D' | 'E';
  automation_percentage?: number;
  capabilities?: Record<string, { available: boolean; method: 'api' | 'web' | 'manual'; notes?: string }>;
}

export interface OfficeAddon {
  id: string;
  office_code: string;
  office_name: string;
  office_name_short?: string;
  country_code?: string;
  region?: string;
  description?: string;
  price_monthly: number;
  currency: string;
  features: string[];
  operational_status?: 'operational' | 'degraded' | 'maintenance' | 'down';
  data_source_type?: string;
  flag_emoji?: string;
}

export interface CheckoutResult {
  success: boolean;
  checkoutUrl?: string;
  error?: string;
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

// Helper: Get included offices by plan
function getIncludedOfficesForPlan(plan: string): string[] {
  switch (plan) {
    case 'enterprise':
      return ['EUIPO', 'OEPM', 'USPTO', 'WIPO', 'EPO', 'UKIPO', 'DPMA', 'INPI_FR', 'JPO', 'CNIPA', 'INPI_BR'];
    case 'business':
      return ['EUIPO', 'OEPM', 'USPTO', 'WIPO', 'EPO'];
    case 'professional':
      return ['EUIPO', 'OEPM'];
    case 'starter':
    default:
      return ['OEPM'];
  }
}

// Helper: Get office price
function getOfficePrice(officeCode: string): number {
  const prices: Record<string, number> = {
    'USPTO': 39,
    'WIPO': 29,
    'EPO': 29,
    'UKIPO': 19,
    'DPMA': 19,
    'INPI_FR': 19,
    'JPO': 39,
    'CNIPA': 49,
    'INPI_BR': 29,
  };
  return prices[officeCode] || 29;
}

export function useTenantOffices() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  // Get offices included in plan + active addons
  const { data: myOffices = [], isLoading: loadingMyOffices } = useQuery({
    queryKey: ['tenant-offices', currentOrganization?.id],
    queryFn: async (): Promise<TenantOffice[]> => {
      if (!currentOrganization?.id) return [];

      // Get all IP offices
      const { data: allOffices, error: officesError } = await supabase
        .from('ipo_offices')
        .select('*')
        .eq('is_active', true);

      if (officesError) throw officesError;

      // Get matters count per office (jurisdiction)
      const { data: matters, error: mattersError } = await supabase
        .from('matters')
        .select('jurisdiction')
        .eq('organization_id', currentOrganization.id);

      if (mattersError) throw mattersError;

      const mattersByOffice: Record<string, number> = {};
      matters?.forEach(m => {
        if (m.jurisdiction) {
          mattersByOffice[m.jurisdiction] = (mattersByOffice[m.jurisdiction] || 0) + 1;
        }
      });

      // Determine included offices based on plan
      const plan = currentOrganization.plan || 'starter';
      const includedOfficeCodes = getIncludedOfficesForPlan(plan);

      // Build tenant offices list (included in plan)
      const tenantOffices: TenantOffice[] = [];

      allOffices?.forEach((office: any) => {
        if (includedOfficeCodes.includes(office.code)) {
          tenantOffices.push({
            id: office.id,
            office_code: office.code,
            office_name: office.name_official,
            office_name_short: office.name_short || undefined,
            country_code: office.country_code || undefined,
            region: office.region || undefined,
            office_type: office.office_type || undefined,
            source_type: 'included',
            is_active: true,
            operational_status: (office.operational_status as TenantOffice['operational_status']) || 'operational',
            last_sync_at: office.last_health_check || undefined,
            matters_count: mattersByOffice[office.code] || 0,
            flag_emoji: office.flag_emoji || getFlagEmoji(office.country_code || undefined),
            automation_level: office.automation_level || 'E',
            automation_percentage: office.automation_percentage ?? 0,
            capabilities: office.capabilities || {},
          });
        }
      });

      // TODO: When tenant_office_addons table exists, also fetch addon offices
      // For now, we simulate an addon (USPTO) for demo purposes if plan is professional
      if (plan === 'professional') {
        const usptOffice = allOffices?.find((o: any) => o.code === 'USPTO') as any;
        if (usptOffice) {
          tenantOffices.push({
            id: usptOffice.id,
            office_code: usptOffice.code,
            office_name: usptOffice.name_official,
            office_name_short: usptOffice.name_short || undefined,
            country_code: usptOffice.country_code || undefined,
            region: usptOffice.region || undefined,
            office_type: usptOffice.office_type || undefined,
            source_type: 'addon',
            is_active: true,
            operational_status: (usptOffice.operational_status as TenantOffice['operational_status']) || 'operational',
            last_sync_at: usptOffice.last_health_check || undefined,
            matters_count: mattersByOffice['USPTO'] || 0,
            price_monthly: 39,
            flag_emoji: usptOffice.flag_emoji || getFlagEmoji(usptOffice.country_code || undefined),
            automation_level: usptOffice.automation_level || 'C',
            automation_percentage: usptOffice.automation_percentage ?? 50,
            capabilities: usptOffice.capabilities || {},
          });
        }
      }

      return tenantOffices;
    },
    enabled: !!currentOrganization?.id,
  });

  // Get available addons (offices not yet subscribed)
  const { data: availableAddons = [], isLoading: loadingAddons } = useQuery({
    queryKey: ['available-office-addons', currentOrganization?.id],
    queryFn: async (): Promise<OfficeAddon[]> => {
      if (!currentOrganization?.id) return [];

      const { data: allOffices, error } = await supabase
        .from('ipo_offices')
        .select('*')
        .eq('is_active', true);

      if (error) throw error;

      // Determine included offices based on plan
      const plan = currentOrganization.plan || 'starter';
      const includedOfficeCodes = getIncludedOfficesForPlan(plan);
      
      // For demo, also exclude USPTO if professional plan (simulated addon)
      const subscribedCodes = plan === 'professional' 
        ? [...includedOfficeCodes, 'USPTO']
        : includedOfficeCodes;

      // Filter out included and already subscribed offices
      const available: OfficeAddon[] = (allOffices || [])
        .filter(office => !subscribedCodes.includes(office.code))
        .map(office => ({
          id: office.id,
          office_code: office.code,
          office_name: office.name_official,
          office_name_short: office.name_short || undefined,
          country_code: office.country_code || undefined,
          region: office.region || undefined,
          description: `${office.name_official} - ${office.region || 'Internacional'}`,
          price_monthly: getOfficePrice(office.code),
          currency: 'EUR',
          features: [
            'Consulta automática de estado',
            'Sincronización cada 6 horas',
            'Descarga de documentos oficiales',
            'Alertas de cambios',
            'Creación automática de plazos',
          ],
          operational_status: (office.operational_status as OfficeAddon['operational_status']) || 'operational',
          data_source_type: office.data_source_type || undefined,
          flag_emoji: getFlagEmoji(office.country_code || undefined),
        }));

      return available;
    },
    enabled: !!currentOrganization?.id,
  });

  // Check if tenant has access to an office
  const hasAccess = (officeCode: string): boolean => {
    return myOffices.some(o => o.office_code === officeCode && o.is_active);
  };

  // Add office addon (calls edge function / Stripe in future)
  const addAddonMutation = useMutation({
    mutationFn: async (officeId: string): Promise<CheckoutResult> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // TODO: Implement Stripe checkout for addon
      // For now, just simulate success
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return { success: true };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-offices'] });
      queryClient.invalidateQueries({ queryKey: ['available-office-addons'] });
      toast.success('Oficina añadida correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al añadir oficina: ${error.message}`);
    },
  });

  // Cancel office addon
  const cancelAddonMutation = useMutation({
    mutationFn: async (officeId: string): Promise<void> => {
      if (!currentOrganization?.id) throw new Error('No organization');

      // TODO: Implement Stripe cancellation
      await new Promise(resolve => setTimeout(resolve, 1000));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-offices'] });
      queryClient.invalidateQueries({ queryKey: ['available-office-addons'] });
      toast.success('Add-on cancelado. Será efectivo al final del período de facturación.');
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar: ${error.message}`);
    },
  });

  return {
    myOffices,
    availableAddons,
    isLoading: loadingMyOffices || loadingAddons,
    hasAccess,
    addOfficeAddon: addAddonMutation.mutateAsync,
    cancelOfficeAddon: cancelAddonMutation.mutateAsync,
    isAddingAddon: addAddonMutation.isPending,
    isCancellingAddon: cancelAddonMutation.isPending,
  };
}
