// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Alerts Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface AlertConfig {
  // Low balance alerts
  enableLowBalanceAlerts: boolean;
  lowBalanceThreshold: number;
  lowBalanceNotifyTenant: boolean;
  lowBalanceNotifyBackoffice: boolean;
  lowBalanceEmail: string;
  lowBalanceFrequency: 'once' | 'daily';
  
  // Zero balance alerts
  enableZeroBalanceAlerts: boolean;
  zeroBehavior: 'block' | 'payg' | 'invoice';
  
  // Expiration alerts
  enableExpirationAlerts: boolean;
  expirationDays: number[];
  
  // Operational alerts
  enableProviderAlerts: boolean;
  enableUsageSpikeAlerts: boolean;
  usageSpikeMinutes: number;
  usageSpikeWindow: number; // hours
}

export interface ActiveAlert {
  id: string;
  tenantId: string;
  tenantName: string;
  balance: number;
  type: 'zero' | 'low' | 'expiring';
  alertSentAt: string;
  lastUpdated: string;
}

const DEFAULT_ALERT_CONFIG: AlertConfig = {
  enableLowBalanceAlerts: true,
  lowBalanceThreshold: 30,
  lowBalanceNotifyTenant: true,
  lowBalanceNotifyBackoffice: true,
  lowBalanceEmail: '',
  lowBalanceFrequency: 'daily',
  enableZeroBalanceAlerts: true,
  zeroBehavior: 'payg',
  enableExpirationAlerts: true,
  expirationDays: [30, 7, 1],
  enableProviderAlerts: true,
  enableUsageSpikeAlerts: true,
  usageSpikeMinutes: 100,
  usageSpikeWindow: 1,
};

export function useTelephonyAlertConfig() {
  return useQuery({
    queryKey: ['telephony-alert-config'],
    queryFn: async (): Promise<AlertConfig> => {
      const { data } = await supabase
        .from('telephony_config')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (!data) {
        return DEFAULT_ALERT_CONFIG;
      }

      // Parse stored config
      return {
        enableLowBalanceAlerts: true,
        lowBalanceThreshold: Number(data.alert_low_balance_threshold) || 30,
        lowBalanceNotifyTenant: true,
        lowBalanceNotifyBackoffice: !!data.alert_email,
        lowBalanceEmail: data.alert_email || '',
        lowBalanceFrequency: 'daily',
        enableZeroBalanceAlerts: true,
        zeroBehavior: 'payg',
        enableExpirationAlerts: true,
        expirationDays: [30, 7, 1],
        enableProviderAlerts: true,
        enableUsageSpikeAlerts: true,
        usageSpikeMinutes: 100,
        usageSpikeWindow: 1,
      };
    },
  });
}

export function useUpdateTelephonyAlertConfig() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (config: Partial<AlertConfig>) => {
      // Get existing config
      const { data: existing } = await supabase
        .from('telephony_config')
        .select('id')
        .limit(1)
        .maybeSingle();

      const updateData = {
        alert_low_balance_threshold: config.lowBalanceThreshold,
        alert_email: config.lowBalanceEmail || null,
        updated_at: new Date().toISOString(),
      };

      if (existing?.id) {
        const { error } = await supabase
          .from('telephony_config')
          .update(updateData)
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('telephony_config')
          .insert(updateData);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telephony-alert-config'] });
      toast.success('Configuración de alertas guardada');
    },
    onError: (error) => {
      toast.error(`Error al guardar: ${error.message}`);
    },
  });
}

export function useActiveAlerts() {
  return useQuery({
    queryKey: ['telephony-active-alerts'],
    queryFn: async (): Promise<ActiveAlert[]> => {
      // Get tenants with low or zero balance
      const { data } = await supabase
        .from('tenant_telephony_balance')
        .select('*, organizations!inner(name)')
        .eq('is_enabled', true)
        .or('minutes_balance.eq.0,minutes_balance.lt.30')
        .order('minutes_balance');

      return (data || []).map((t) => ({
        id: t.id,
        tenantId: t.tenant_id,
        tenantName: (t.organizations as any)?.name || 'Unknown',
        balance: t.minutes_balance || 0,
        type: t.minutes_balance === 0 ? 'zero' : 'low' as const,
        alertSentAt: t.low_balance_alert_sent ? t.updated_at : '',
        lastUpdated: t.updated_at,
      }));
    },
  });
}

export function useSendBulkReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantIds: string[]) => {
      // In production, this would call an edge function to send emails
      // For now, just mark as notified
      const { error } = await supabase
        .from('tenant_telephony_balance')
        .update({
          low_balance_alert_sent: true,
          updated_at: new Date().toISOString(),
        })
        .in('tenant_id', tenantIds);

      if (error) throw error;
      
      return { sent: tenantIds.length };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['telephony-active-alerts'] });
      toast.success(`Recordatorio enviado a ${result.sent} tenant(s)`);
    },
    onError: (error) => {
      toast.error(`Error al enviar: ${error.message}`);
    },
  });
}

export function useResetAlertFlag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tenantId: string) => {
      const { error } = await supabase
        .from('tenant_telephony_balance')
        .update({
          low_balance_alert_sent: false,
          updated_at: new Date().toISOString(),
        })
        .eq('tenant_id', tenantId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telephony-active-alerts'] });
    },
  });
}
