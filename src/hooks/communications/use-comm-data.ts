// ============================================================
// IP-NEXUS — Communications Data Hooks (COMM-01)
// All queries strictly filtered by organization_id
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import type {
  CommThread,
  CommMessage,
  CommTenantConfig,
  ChannelStats,
  CommChannel,
} from '@/types/communications';
import { toast } from 'sonner';

// ── Tenant Config ──────────────────────────────────────────
export function useCommConfig() {
  const { organizationId } = useOrganization();

  return useQuery<CommTenantConfig | null>({
    queryKey: ['comm-config', organizationId],
    queryFn: async () => {
      if (!organizationId) return null;
      const { data, error } = await fromTable('comm_tenant_config')
        .select('*')
        .eq('organization_id', organizationId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!organizationId,
  });
}

// ── Channel Stats (sidebar counters) ──────────────────────
export function useChannelStats() {
  const { organizationId } = useOrganization();

  return useQuery<ChannelStats[]>({
    queryKey: ['comm-channel-stats', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      // Use raw SQL via RPC or aggregate manually
      const { data, error } = await fromTable('comm_threads')
        .select('channel, unread_count, status')
        .eq('organization_id', organizationId)
        .in('status', ['open', 'pending']);
      if (error) throw error;

      const statsMap = new Map<string, ChannelStats>();
      for (const row of data || []) {
        const ch = row.channel as CommChannel;
        const existing = statsMap.get(ch) || { channel: ch, total: 0, unread: 0 };
        existing.total += 1;
        existing.unread += (row.unread_count || 0);
        statsMap.set(ch, existing);
      }
      return Array.from(statsMap.values());
    },
    enabled: !!organizationId,
    refetchInterval: 30000,
  });
}

// ── Thread List ────────────────────────────────────────────
export function useCommThreads(channelFilter?: CommChannel | null, statusFilter?: string) {
  const { organizationId } = useOrganization();

  return useQuery<CommThread[]>({
    queryKey: ['comm-threads', organizationId, channelFilter, statusFilter],
    queryFn: async () => {
      if (!organizationId) return [];
      let query = fromTable('comm_threads')
        .select(`
          *,
          matter:matters!comm_threads_matter_id_fkey(id, reference_number, title),
          crm_account:crm_accounts!comm_threads_crm_account_id_fkey(id, name)
        `)
        .eq('organization_id', organizationId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      if (channelFilter) {
        query = query.eq('channel', channelFilter);
      }
      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      } else {
        query = query.in('status', ['open', 'pending']);
      }

      const { data, error } = await query.limit(200);
      if (error) throw error;
      return (data || []) as CommThread[];
    },
    enabled: !!organizationId,
  });
}

// ── Thread Messages ────────────────────────────────────────
export function useCommMessages(threadId: string | null) {
  const { organizationId } = useOrganization();

  return useQuery<CommMessage[]>({
    queryKey: ['comm-messages', organizationId, threadId],
    queryFn: async () => {
      if (!organizationId || !threadId) return [];
      const { data, error } = await fromTable('comm_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []) as CommMessage[];
    },
    enabled: !!organizationId && !!threadId,
  });
}

// ── Send Email (via Edge Function) ─────────────────────────
export function useSendEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      thread_id?: string;
      matter_id?: string;
      crm_account_id?: string;
      to: string[];
      cc?: string[];
      subject: string;
      body_html: string;
      is_legally_critical?: boolean;
      reply_to_message_id?: string;
    }) => {
      const idempotency_key = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('comm-send-email', {
        body: { ...payload, idempotency_key },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Email enviado');
      qc.invalidateQueries({ queryKey: ['comm-threads'] });
      qc.invalidateQueries({ queryKey: ['comm-messages'] });
      qc.invalidateQueries({ queryKey: ['comm-channel-stats'] });
    },
    onError: (e: Error) => toast.error('Error al enviar email: ' + e.message),
  });
}

// ── Send WhatsApp (via Edge Function) ──────────────────────
export function useSendWhatsApp() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      thread_id?: string;
      matter_id?: string;
      to_phone: string;
      message_type: 'text' | 'template';
      text?: string;
      template_name?: string;
      template_params?: string[];
    }) => {
      const idempotency_key = crypto.randomUUID();
      const { data, error } = await supabase.functions.invoke('comm-send-whatsapp', {
        body: { ...payload, idempotency_key },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.error === 'whatsapp_window_expired') {
        toast.warning('Ventana 24h expirada — usa un template HSM');
      } else {
        toast.success('Mensaje WhatsApp enviado');
      }
      qc.invalidateQueries({ queryKey: ['comm-threads'] });
      qc.invalidateQueries({ queryKey: ['comm-messages'] });
      qc.invalidateQueries({ queryKey: ['comm-channel-stats'] });
    },
    onError: (e: Error) => toast.error('Error WhatsApp: ' + e.message),
  });
}

// ── WhatsApp Window Status ─────────────────────────────────
export function useWhatsAppWindow(phone: string | null) {
  const { organizationId } = useOrganization();

  return useQuery<{ open: boolean; expiresAt: string | null }>({
    queryKey: ['wa-window', organizationId, phone],
    queryFn: async () => {
      if (!organizationId || !phone) return { open: false, expiresAt: null };
      const { data } = await fromTable('comm_messages')
        .select('created_at')
        .eq('organization_id', organizationId)
        .eq('sender_type', 'contact')
        .eq('sender_phone', phone)
        .eq('channel', 'whatsapp')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (!data) return { open: false, expiresAt: null };
      const lastMsg = new Date(data.created_at);
      const expiresAt = new Date(lastMsg.getTime() + 24 * 60 * 60 * 1000);
      return {
        open: expiresAt.getTime() > Date.now(),
        expiresAt: expiresAt.toISOString(),
      };
    },
    enabled: !!organizationId && !!phone,
    refetchInterval: 60000,
  });
}

// ── Realtime subscription ──────────────────────────────────
export function useCommRealtime(orgId: string | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`comm:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'comm_messages',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['comm-threads'] });
          qc.invalidateQueries({ queryKey: ['comm-messages'] });
          qc.invalidateQueries({ queryKey: ['comm-channel-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'comm_threads',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['comm-threads'] });
          qc.invalidateQueries({ queryKey: ['comm-channel-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [orgId, qc]);
}

// ── Sync Calls ─────────────────────────────────────────────
export function useSyncCalls() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('comm-sync-call', {
        body: { mode: 'sync_all' },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      toast.success(`Llamadas sincronizadas: ${data?.synced || 0}`);
      qc.invalidateQueries({ queryKey: ['comm-threads'] });
    },
  });
}
