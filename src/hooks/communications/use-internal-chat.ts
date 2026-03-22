// ============================================================
// IP-NEXUS — Internal Chat Hooks (INTERNAL-CHAT-01 Phase 3)
// All queries strictly filtered by organization_id
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useCallback } from 'react';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { toast } from 'sonner';

// ── Types ──────────────────────────────────────────────────
export interface InternalChannel {
  id: string;
  organization_id: string;
  channel_type: string;
  name: string;
  slug: string;
  description: string | null;
  matter_id: string | null;
  crm_account_id: string | null;
  is_archived: boolean;
  last_message_at: string | null;
  message_count: number;
  created_by: string;
  created_at: string;
}

export interface InternalMsg {
  id: string;
  organization_id: string;
  channel_id: string;
  sender_id: string;
  sender_role_snapshot: string;
  content: string;
  content_type: string;
  attachments: unknown[];
  mentions: Record<string, unknown>;
  is_edited: boolean;
  is_deleted: boolean;
  reply_to_message_id: string | null;
  referenced_matter_id: string | null;
  ai_classification: string | null;
  ai_confidence: number | null;
  user_indexing_decision: string | null;
  indexed_to_matter_id: string | null;
  created_at: string;
  // Joined
  sender?: { id: string; first_name: string; last_name: string; avatar_url: string | null; chat_status: string | null } | null;
}

export interface StaffNotification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  action_url: string | null;
  priority: string;
  is_read: boolean;
  created_at: string;
}

// ── Current User Profile ───────────────────────────────────
export function useCurrentProfile() {
  return useQuery({
    queryKey: ['current-profile-full'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      const { data } = await fromTable('profiles')
        .select('id, first_name, last_name, avatar_url, role, organization_id, chat_status, last_seen_at')
        .eq('id', user.id)
        .single();
      return data;
    },
    staleTime: 60_000,
  });
}

// ── Channels ───────────────────────────────────────────────
export function useInternalChannels() {
  const { organizationId } = useOrganization();

  return useQuery<InternalChannel[]>({
    queryKey: ['internal-channels', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await fromTable('internal_channels')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_archived', false)
        .order('channel_type', { ascending: true })
        .order('name', { ascending: true });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
  });
}

// ── Messages for a channel ─────────────────────────────────
export function useInternalMessages(channelId: string | null) {
  const { organizationId } = useOrganization();

  return useQuery<InternalMsg[]>({
    queryKey: ['internal-messages', organizationId, channelId],
    queryFn: async () => {
      if (!organizationId || !channelId) return [];
      const { data, error } = await fromTable('internal_messages')
        .select(`
          *,
          sender:profiles!internal_messages_sender_id_fkey(
            id, first_name, last_name, avatar_url, chat_status
          )
        `)
        .eq('organization_id', organizationId)
        .eq('channel_id', channelId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && !!channelId,
  });
}

// ── Send Message (via Edge Function) ───────────────────────
export function useSendInternalMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      channel_id: string;
      content: string;
      content_type?: string;
      attachments?: unknown[];
      referenced_matter_id?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('internal-chat-send', {
        body: payload,
        headers: {
          'X-App-Context': JSON.stringify({
            page: window.location.pathname,
          }),
        },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (_data, variables) => {
      qc.invalidateQueries({ queryKey: ['internal-messages'] });
      qc.invalidateQueries({ queryKey: ['internal-channels'] });
    },
    onError: (e: Error) => toast.error('Error al enviar: ' + e.message),
  });
}

// ── Index Message (via Edge Function) ──────────────────────
export function useIndexMessage() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (payload: {
      message_id: string;
      matter_id: string;
      decision: 'indexed' | 'rejected';
    }) => {
      const { data, error } = await supabase.functions.invoke('internal-chat-index', {
        body: payload,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      if (data?.decision === 'indexed') {
        toast.success('Mensaje indexado al expediente');
      } else {
        toast.info('Sugerencia descartada');
      }
      qc.invalidateQueries({ queryKey: ['internal-messages'] });
      qc.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
    onError: (e: Error) => toast.error('Error al indexar: ' + e.message),
  });
}

// ── Heartbeat ──────────────────────────────────────────────
export function useHeartbeat(status?: string) {
  const intervalRef = useRef<ReturnType<typeof setInterval>>();

  const send = useCallback(async () => {
    try {
      await supabase.functions.invoke('internal-chat-heartbeat', {
        body: status ? { status } : {},
      });
    } catch {
      // Silent fail — heartbeat is non-critical
    }
  }, [status]);

  useEffect(() => {
    send(); // initial
    intervalRef.current = setInterval(send, 30_000); // every 30s
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [send]);
}

// ── Staff Notifications ────────────────────────────────────
export function useStaffNotifications() {
  const { organizationId } = useOrganization();

  return useQuery<StaffNotification[]>({
    queryKey: ['staff-notifications', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];
      const { data, error } = await fromTable('staff_notifications')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    refetchInterval: 15_000,
  });
}

// ── Mark notification read ─────────────────────────────────
export function useMarkNotificationRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await fromTable('staff_notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['staff-notifications'] });
    },
  });
}

// ── Realtime for internal chat ─────────────────────────────
export function useInternalChatRealtime(orgId: string | undefined, activeChannelId: string | null) {
  const qc = useQueryClient();

  useEffect(() => {
    if (!orgId) return;

    const channel = supabase
      .channel(`internal-chat:${orgId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'internal_messages',
          filter: `organization_id=eq.${orgId}`,
        },
        (payload) => {
          // Refresh messages for the active channel
          if (activeChannelId && (payload.new as any).channel_id === activeChannelId) {
            qc.invalidateQueries({ queryKey: ['internal-messages', orgId, activeChannelId] });
          }
          // Always refresh channel list for counters
          qc.invalidateQueries({ queryKey: ['internal-channels', orgId] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'staff_notifications',
          filter: `organization_id=eq.${orgId}`,
        },
        () => {
          qc.invalidateQueries({ queryKey: ['staff-notifications', orgId] });
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [orgId, activeChannelId, qc]);
}

// ── Online members ─────────────────────────────────────────
export function useOnlineMembers() {
  const { organizationId } = useOrganization();

  return useQuery({
    queryKey: ['online-members', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { data, error } = await fromTable('profiles')
        .select('id, first_name, last_name, avatar_url, chat_status, last_seen_at')
        .eq('organization_id', organizationId)
        .gte('last_seen_at', fiveMinAgo);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId,
    refetchInterval: 30_000,
  });
}
