/**
 * Hook for managing phone/VoIP tenant configuration
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase, fromTable } from '@/lib/supabase';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface PhoneConfig {
  id: string;
  organization_id: string;
  provider: string;
  // IP-Nexus
  ip_nexus_enabled: boolean;
  ip_nexus_phone_number: string | null;
  ip_nexus_extension: string | null;
  ip_nexus_activated_at: string | null;
  // Twilio
  account_sid: string | null;
  auth_token: string | null;
  primary_number: string | null;
  // Vonage
  vonage_api_key: string | null;
  vonage_api_secret: string | null;
  vonage_phone_number: string | null;
  // Aircall
  aircall_api_id: string | null;
  aircall_api_token: string | null;
  // Other
  other_provider_name: string | null;
  other_provider_config: Record<string, unknown> | null;
  // General
  default_country_code: string;
  recording_enabled: boolean;
  voicemail_enabled: boolean;
  voicemail_email: string | null;
  business_hours: Record<string, unknown> | null;
  // Status
  status?: string;
  created_at: string;
  updated_at: string;
}

export interface TenantBalance {
  id: string;
  tenant_id: string;
  minutes_balance: number;
  sms_balance: number;
  credit_balance: number;
  is_enabled: boolean;
  outbound_caller_id: string | null;
  total_minutes_used: number;
  total_sms_sent: number;
  total_spent: number;
}

export type PhoneProvider = 'ip_nexus' | 'twilio' | 'vonage' | 'aircall' | 'other' | 'none';

export function usePhoneSettings() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch phone config
  const configQuery = useQuery({
    queryKey: ['phone-config', orgId],
    queryFn: async (): Promise<PhoneConfig | null> => {
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('voip_settings')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();

      if (error) throw error;
      return data as PhoneConfig | null;
    },
    enabled: !!orgId,
  });

  // Fetch tenant balance
  const balanceQuery = useQuery({
    queryKey: ['phone-balance', orgId],
    queryFn: async (): Promise<TenantBalance | null> => {
      if (!orgId) return null;

      const { data, error } = await supabase
        .from('tenant_telephony_balance')
        .select('*')
        .eq('tenant_id', orgId)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;
      return data as TenantBalance | null;
    },
    enabled: !!orgId,
  });

  // Check if org has phone module in subscription
  const subscriptionQuery = useQuery({
    queryKey: ['org-subscription-modules', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      // Check tenant_modules for phone module
      const { data } = await fromTable('tenant_modules')
        .select('module_code, is_active')
        .eq('tenant_id', orgId)
        .eq('is_active', true);

      return data || [];
    },
    enabled: !!orgId,
  });

  const hasPhoneModule = (): boolean => {
    const modules = subscriptionQuery.data || [];
    return modules.some((m: any) => 
      m.module_code === 'phone' || 
      m.module_code === 'telefono' ||
      m.module_code === 'voip'
    );
  };

  // Update config
  const updateConfig = useMutation({
    mutationFn: async (updates: Partial<PhoneConfig>) => {
      if (!orgId) throw new Error('No organization');

      const { error } = await supabase
        .from('voip_settings')
        .upsert({
          organization_id: orgId,
          ...updates,
          updated_at: new Date().toISOString(),
        } as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración guardada');
      queryClient.invalidateQueries({ queryKey: ['phone-config', orgId] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Activate IP-Nexus
  const activateIPNexus = useMutation({
    mutationFn: async () => {
      if (!orgId) throw new Error('No organization');
      if (!hasPhoneModule()) throw new Error('Módulo de teléfono no contratado');

      // Assign a phone number (in production this would come from backend)
      const areaCode = Math.floor(100 + Math.random() * 900);
      const number = Math.floor(1000 + Math.random() * 9000);
      const assignedNumber = `+34 91 ${areaCode} ${number}`;

      const { error } = await supabase
        .from('voip_settings')
        .upsert({
          organization_id: orgId,
          provider: 'ip_nexus',
          ip_nexus_enabled: true,
          ip_nexus_phone_number: assignedNumber,
          ip_nexus_activated_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        } as any);

      if (error) throw error;

      // Also enable tenant balance
      await supabase
        .from('tenant_telephony_balance')
        .upsert({
          tenant_id: orgId,
          is_enabled: true,
          minutes_balance: 100, // Initial free minutes
          updated_at: new Date().toISOString(),
        } as any);

      return assignedNumber;
    },
    onSuccess: (phoneNumber) => {
      toast.success('¡IP-Nexus Phone activado!', {
        description: `Tu número asignado es: ${phoneNumber}`
      });
      queryClient.invalidateQueries({ queryKey: ['phone-config', orgId] });
      queryClient.invalidateQueries({ queryKey: ['phone-balance', orgId] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Save external provider config
  const saveProviderConfig = useMutation({
    mutationFn: async (data: {
      provider: PhoneProvider;
      twilio?: { account_sid: string; auth_token: string; phone_number: string };
      vonage?: { api_key: string; api_secret: string; phone_number: string };
      aircall?: { api_id: string; api_token: string };
      other?: { name: string; config?: Record<string, unknown> };
      general?: { 
        default_country_code: string;
        recording_enabled: boolean;
        voicemail_enabled: boolean;
        voicemail_email?: string;
      };
    }) => {
      if (!orgId) throw new Error('No organization');

      const configData: Record<string, unknown> = {
        organization_id: orgId,
        provider: data.provider,
        updated_at: new Date().toISOString(),
      };

      if (data.twilio) {
        configData.account_sid = data.twilio.account_sid;
        configData.auth_token = data.twilio.auth_token;
        configData.primary_number = data.twilio.phone_number;
      }

      if (data.vonage) {
        configData.vonage_api_key = data.vonage.api_key;
        configData.vonage_api_secret = data.vonage.api_secret;
        configData.vonage_phone_number = data.vonage.phone_number;
      }

      if (data.aircall) {
        configData.aircall_api_id = data.aircall.api_id;
        configData.aircall_api_token = data.aircall.api_token;
      }

      if (data.other) {
        configData.other_provider_name = data.other.name;
        configData.other_provider_config = data.other.config || {};
      }

      if (data.general) {
        configData.default_country_code = data.general.default_country_code;
        configData.recording_enabled = data.general.recording_enabled;
        configData.voicemail_enabled = data.general.voicemail_enabled;
        configData.voicemail_email = data.general.voicemail_email || null;
      }

      const { error } = await supabase
        .from('voip_settings')
        .upsert(configData as any);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Configuración de proveedor guardada');
      queryClient.invalidateQueries({ queryKey: ['phone-config', orgId] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    config: configQuery.data,
    balance: balanceQuery.data,
    subscription: subscriptionQuery.data,
    isLoading: configQuery.isLoading || subscriptionQuery.isLoading,
    hasPhoneModule,
    updateConfig,
    activateIPNexus,
    saveProviderConfig,
    refetch: () => {
      configQuery.refetch();
      balanceQuery.refetch();
    },
  };
}
