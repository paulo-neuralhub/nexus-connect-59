/**
 * Hook para mensajes del Portal Cliente — V2
 * Uses portal_chat_messages + portal_chat_sessions
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { fromTable } from '@/lib/supabase';
import { usePortalAuth } from './usePortalAuth';
import { toast } from 'sonner';
import { useEffect } from 'react';

export interface PortalMessage {
  id: string;
  sender_type: string;
  sender_name: string | null;
  content: string;
  content_type: string;
  attachments: any[];
  read_by_client: boolean;
  read_by_agent: boolean;
  created_at: string;
  direction: 'inbound' | 'outbound';
  body: string;
  status: string;
}

export interface PortalThread {
  thread_id: string;
  subject: string;
  last_message: string;
  last_message_date: string;
  unread_count: number;
  message_count: number;
  participants: string[];
  matter_id: string | null;
  matter_reference: string | null;
  mode: string;
}

interface SendMessageParams {
  subject?: string;
  body: string;
  matter_id?: string;
  thread_id?: string;
  attachments?: Array<{ name: string; url: string }>;
}

export function usePortalThreads() {
  const { user, org } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-threads', user?.contactId],
    queryFn: async (): Promise<PortalThread[]> => {
      if (!user?.contactId || !org?.id) return [];

      const { data: sessions, error } = await fromTable('portal_chat_sessions')
        .select('*')
        .eq('crm_account_id', user.contactId)
        .eq('organization_id', org.id)
        .order('updated_at', { ascending: false });

      if (error || !sessions) return [];

      const threads: PortalThread[] = [];

      for (const session of sessions) {
        // Get last message
        const { data: lastMsg } = await fromTable('portal_chat_messages')
          .select('content, created_at, sender_type, read_by_client')
          .eq('organization_id', org.id)
          .eq('crm_account_id', user.contactId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Count unread
        const { count: unreadCount } = await fromTable('portal_chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', org.id)
          .eq('crm_account_id', user.contactId)
          .eq('read_by_client', false)
          .neq('sender_type', 'client');

        threads.push({
          thread_id: session.id,
          subject: session.ai_context_summary || 'Conversación',
          last_message: lastMsg?.content?.substring(0, 100) || '',
          last_message_date: lastMsg?.created_at || session.created_at,
          unread_count: unreadCount || 0,
          message_count: 0,
          participants: [],
          matter_id: null,
          matter_reference: null,
          mode: session.mode || 'ai',
        });
      }

      return threads;
    },
    enabled: !!user?.contactId && !!org?.id,
    staleTime: 30000,
  });
}

export function usePortalThreadMessages(threadId: string | null) {
  const { user, org } = usePortalAuth();

  return useQuery({
    queryKey: ['portal-thread-messages', threadId],
    queryFn: async (): Promise<PortalMessage[]> => {
      if (!user?.contactId || !org?.id) return [];

      // Get all messages for this account (session-based)
      const { data, error } = await fromTable('portal_chat_messages')
        .select('*')
        .eq('organization_id', org.id)
        .eq('crm_account_id', user.contactId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map((msg: any) => ({
        id: msg.id,
        sender_type: msg.sender_type,
        sender_name: msg.sender_name,
        content: msg.content,
        content_type: msg.content_type || 'text',
        attachments: msg.attachments || [],
        read_by_client: msg.read_by_client || false,
        read_by_agent: msg.read_by_agent || false,
        created_at: msg.created_at,
        // Map to old interface for compatibility
        direction: msg.sender_type === 'client' ? 'inbound' as const : 'outbound' as const,
        body: msg.content,
        status: msg.read_by_client ? 'read' : 'sent',
      }));
    },
    enabled: !!user?.contactId && !!org?.id && !!threadId,
    staleTime: 10000,
  });
}

export function useSendPortalMessage() {
  const queryClient = useQueryClient();
  const { user, org } = usePortalAuth();

  return useMutation({
    mutationFn: async (params: SendMessageParams) => {
      if (!user?.contactId || !org?.id) throw new Error('Not authenticated');

      const { error } = await fromTable('portal_chat_messages')
        .insert({
          organization_id: org.id,
          crm_account_id: user.contactId,
          sender_type: 'client',
          sender_user_id: user.id,
          sender_name: user.name,
          content: params.body,
          content_type: 'text',
          attachments: params.attachments || [],
          matter_id: params.matter_id || null,
          read_by_client: true,
          read_by_agent: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Mensaje enviado');
      queryClient.invalidateQueries({ queryKey: ['portal-threads'] });
      queryClient.invalidateQueries({ queryKey: ['portal-thread-messages'] });
    },
    onError: () => {
      toast.error('Error al enviar el mensaje');
    },
  });
}

export function useMarkMessagesRead() {
  const queryClient = useQueryClient();
  const { user, org } = usePortalAuth();

  return useMutation({
    mutationFn: async (_threadId: string) => {
      if (!user?.contactId || !org?.id) return;

      await fromTable('portal_chat_messages')
        .update({
          read_by_client: true,
          read_at_client: new Date().toISOString(),
        })
        .eq('organization_id', org.id)
        .eq('crm_account_id', user.contactId)
        .eq('read_by_client', false)
        .neq('sender_type', 'client');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-threads'] });
    },
  });
}

/**
 * Hook for realtime subscription on portal_chat_messages
 */
export function usePortalMessagesRealtime() {
  const { user, org } = usePortalAuth();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.contactId || !org?.id) return;

    const channel = supabase
      .channel('portal-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'portal_chat_messages',
          filter: `crm_account_id=eq.${user.contactId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['portal-thread-messages'] });
          queryClient.invalidateQueries({ queryKey: ['portal-threads'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.contactId, org?.id, queryClient]);
}
