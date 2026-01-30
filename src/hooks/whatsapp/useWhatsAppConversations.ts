/**
 * Hook for managing WhatsApp conversations and messages
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';
import { transformConversation, transformMessage } from '@/lib/whatsapp-utils';
import type { 
  WhatsAppConversation, 
  WhatsAppMessage,
  SendWhatsAppMessageParams,
  WhatsAppConversationRow,
  WhatsAppMessageRow,
} from '@/types/whatsapp';

export function useWhatsAppConversations() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Fetch all conversations
  const conversationsQuery = useQuery({
    queryKey: ['whatsapp-conversations', orgId],
    queryFn: async (): Promise<WhatsAppConversation[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          client:client_id (
            id, name, company_name
          ),
          assigned_user:assigned_to (
            id, full_name, avatar_url
          )
        `)
        .eq('organization_id', orgId)
        .order('last_message_at', { ascending: false });

      if (error) throw error;
      
      return (data || []).map(row => transformConversation(row as unknown as WhatsAppConversationRow & {
        client?: { id: string; name: string; company_name?: string } | null;
        assigned_user?: { id: string; full_name: string; avatar_url?: string } | null;
      }));
    },
    enabled: !!orgId,
    refetchInterval: 30000,
  });

  // Stats
  const stats = {
    total: conversationsQuery.data?.length || 0,
    unread: conversationsQuery.data?.filter(c => c.unreadCount > 0).length || 0,
    open: conversationsQuery.data?.filter(c => c.status === 'open').length || 0,
  };

  return {
    conversations: conversationsQuery.data || [],
    isLoading: conversationsQuery.isLoading,
    stats,
    refetch: conversationsQuery.refetch,
  };
}

export function useWhatsAppConversation(conversationId: string | null) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const orgId = currentOrganization?.id;

  // Fetch single conversation
  const conversationQuery = useQuery({
    queryKey: ['whatsapp-conversation', conversationId],
    queryFn: async (): Promise<WhatsAppConversation | null> => {
      if (!conversationId) return null;

      const { data, error } = await supabase
        .from('whatsapp_conversations')
        .select(`
          *,
          client:client_id (
            id, name, company_name, phone, email
          ),
          assigned_user:assigned_to (
            id, full_name, avatar_url
          )
        `)
        .eq('id', conversationId)
        .single();

      if (error) throw error;
      
      return transformConversation(data as unknown as WhatsAppConversationRow & {
        client?: { id: string; name: string; company_name?: string } | null;
        assigned_user?: { id: string; full_name: string; avatar_url?: string } | null;
      });
    },
    enabled: !!conversationId,
  });

  // Fetch messages for conversation
  const messagesQuery = useQuery({
    queryKey: ['whatsapp-messages', conversationId],
    queryFn: async (): Promise<WhatsAppMessage[]> => {
      if (!conversationId || !conversationQuery.data) return [];

      const { data, error } = await supabase
        .from('whatsapp_messages')
        .select('*')
        .eq('organization_id', orgId)
        .eq('contact_phone', conversationQuery.data.contactPhone)
        .order('timestamp', { ascending: true });

      if (error) throw error;
      return (data || []).map(row => transformMessage(row as WhatsAppMessageRow));
    },
    enabled: !!conversationId && !!conversationQuery.data,
    refetchInterval: 10000,
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async () => {
      if (!conversationId) return;

      const { error } = await supabase.rpc('mark_whatsapp_conversation_read', {
        p_conversation_id: conversationId,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (params: SendWhatsAppMessageParams) => {
      if (!orgId) throw new Error('No organization');

      const { data, error } = await supabase.functions.invoke('send-whatsapp', {
        body: {
          organization_id: orgId,
          to_phone: params.recipientPhone,
          message_type: params.mediaType || 'text',
          text_content: params.content,
          media_url: params.mediaUrl,
          contact_id: params.contactId,
        },
      });

      if (error) throw error;
      if ((data as Record<string, unknown>)?.error) {
        throw new Error((data as Record<string, unknown>)?.message as string || 'Error sending');
      }
      return data;
    },
    onSuccess: () => {
      toast.success('Mensaje enviado');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-messages', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // Update conversation status
  const updateStatus = useMutation({
    mutationFn: async (status: 'open' | 'closed' | 'archived') => {
      if (!conversationId) return;

      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  // Assign to user
  const assignTo = useMutation({
    mutationFn: async (userId: string | null) => {
      if (!conversationId) return;

      const { error } = await supabase
        .from('whatsapp_conversations')
        .update({ assigned_to: userId, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Conversación asignada');
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversation', conversationId] });
      queryClient.invalidateQueries({ queryKey: ['whatsapp-conversations'] });
    },
  });

  return {
    conversation: conversationQuery.data,
    messages: messagesQuery.data || [],
    isLoading: conversationQuery.isLoading || messagesQuery.isLoading,
    
    markAsRead,
    sendMessage,
    updateStatus,
    assignTo,
    
    refetchMessages: messagesQuery.refetch,
  };
}
