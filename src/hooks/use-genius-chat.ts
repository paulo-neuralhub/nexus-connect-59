import { useState, useCallback, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/auth-context';
import { useOrganization } from '@/contexts/organization-context';
import type { AIConversation, AIMessage, AgentType, ConversationContextType } from '@/types/genius';

// ===== TYPES =====
interface SendMessageParams {
  message: string;
  matterId?: string;
  helpContext?: {
    currentPage: string;
    userLevel?: 'beginner' | 'intermediate' | 'advanced';
    recentActions?: string[];
  };
}

interface ChatState {
  conversationId: string | null;
  messages: AIMessage[];
  isLoading: boolean;
  error: Error | null;
}

// ===== HOOK: Enhanced Chat with Context =====
export function useGeniusChat(agentType: AgentType) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { currentOrganization } = useOrganization();
  
  const [state, setState] = useState<ChatState>({
    conversationId: null,
    messages: [],
    isLoading: false,
    error: null,
  });
  
  const contextMatterRef = useRef<string | undefined>(undefined);
  // Use refs to avoid stale closures in sendMessage
  const stateRef = useRef(state);
  stateRef.current = state;
  const isSendingRef = useRef(false);

  // Create new conversation
  const createConversation = useCallback(async (
    contextType: ConversationContextType = 'general',
    contextId?: string
  ): Promise<string> => {
    if (!user?.id || !currentOrganization?.id) {
      throw new Error('User or organization not found');
    }

    const { data, error } = await supabase
      .from('ai_conversations')
      .insert({
        organization_id: currentOrganization.id,
        user_id: user.id,
        agent_type: agentType,
        context_type: contextType,
        context_id: contextId,
        matter_id: contextType === 'matter' ? contextId : null,
        status: 'active',
        is_starred: false,
        message_count: 0,
        token_count: 0,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }, [user?.id, currentOrganization?.id, agentType]);

  // Send message
  const sendMessage = useCallback(async ({ message, matterId, helpContext }: SendMessageParams) => {
    // Prevent double-send
    if (isSendingRef.current) return;
    isSendingRef.current = true;

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // Read from ref to avoid stale closure
      let conversationId = stateRef.current.conversationId;

      // Create conversation BEFORE anything else
      if (!conversationId) {
        const contextType: ConversationContextType = matterId ? 'matter' : 'general';
        conversationId = await createConversation(contextType, matterId);
        // Update state AND ref immediately
        setState(prev => ({ ...prev, conversationId }));
        stateRef.current = { ...stateRef.current, conversationId };
        contextMatterRef.current = matterId;
      }

      // Add optimistic user message to UI immediately
      const userMessage: AIMessage = {
        id: `temp-user-${Date.now()}`,
        conversation_id: conversationId,
        role: 'user',
        content: message,
        created_at: new Date().toISOString(),
      };
      
      setState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage],
      }));

      // Build history from current messages (use ref for fresh data)
      const currentMessages = stateRef.current.messages;
      const history = currentMessages.slice(-8).map(m => ({
        role: m.role,
        content: m.content,
      }));

      const functionName = agentType === 'guide' && helpContext ? 'genius-help' : 'genius-chat-v2';

      // Call Edge Function with conversationId guaranteed
      const { data, error } = await supabase.functions.invoke(functionName, {
        body:
          functionName === 'genius-help'
            ? {
                conversationId,
                message,
                history,
                context: {
                  currentPage: helpContext!.currentPage,
                  userLevel: helpContext!.userLevel || 'beginner',
                  recentActions: helpContext!.recentActions || [],
                },
              }
            : {
                conversationId,
                message,
                contextMatterId: matterId || contextMatterRef.current,
                history,
              },
      });

      if (error) throw error;

      // Add assistant message — always show even if conversationId state was late
      const assistantContent = data?.message ?? data?.content ?? '';
      const assistantMessage: AIMessage = {
        id: `temp-assistant-${Date.now()}`,
        conversation_id: conversationId,
        role: 'assistant',
        content: assistantContent,
        model_used: data?.model,
        actions_taken: data?.actions ?? [],
        sources: data?.sources ?? [],
        response_time_ms: data?.usage?.duration_ms,
        created_at: new Date().toISOString(),
      };

      setState(prev => ({
        ...prev,
        messages: [...prev.messages, assistantMessage],
        isLoading: false,
      }));

      // If title was auto-generated, refresh sidebar
      if (data?.title_generated || data?.generated_title) {
        queryClient.invalidateQueries({ queryKey: ['genius-conversations'] });
        queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });
      }

      // Always invalidate conversations list
      queryClient.invalidateQueries({ queryKey: ['ai-conversations'] });

      // Return data AND the conversationId so callers can sync AFTER response
      return { ...data, _conversationId: conversationId };
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setState(prev => ({ ...prev, isLoading: false, error }));
      throw error;
    } finally {
      isSendingRef.current = false;
    }
  }, [createConversation, queryClient, agentType]);

  // Load existing conversation — fetch BOTH user AND assistant messages
  const loadConversation = useCallback(async (id: string) => {
    setState(prev => ({ ...prev, isLoading: true, conversationId: id }));

    try {
      // Fetch all messages (user + assistant) ordered chronologically
      const { data, error } = await supabase
        .from('ai_messages')
        .select('id, conversation_id, role, content, model, created_at, metadata')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const { data: conv } = await supabase
        .from('ai_conversations')
        .select('context_type, context_id, matter_id')
        .eq('id', id)
        .single();

      if (conv?.matter_id) {
        contextMatterRef.current = conv.matter_id;
      }

      // Map DB columns to AIMessage interface
      const messages: AIMessage[] = (data || []).map((m) => ({
        id: m.id,
        conversation_id: m.conversation_id ?? '',
        role: (m.role ?? 'user') as AIMessage['role'],
        content: m.content || '',
        model_used: m.model ?? undefined,
        created_at: m.created_at ?? new Date().toISOString(),
        sources: (m.metadata as Record<string, unknown> | null)?.sources as AIMessage['sources'],
        actions_taken: (m.metadata as Record<string, unknown> | null)?.actions_taken as AIMessage['actions_taken'],
        feedback: (m.metadata as Record<string, unknown> | null)?.feedback as AIMessage['feedback'],
      }));

      setState(prev => ({
        ...prev,
        messages,
        isLoading: false,
      }));
    } catch (err) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err : new Error('Unknown error'),
      }));
    }
  }, []);

  // Start new conversation
  const startNewConversation = useCallback(() => {
    setState({
      conversationId: null,
      messages: [],
      isLoading: false,
      error: null,
    });
    contextMatterRef.current = undefined;
  }, []);

  // Set context matter
  const setContextMatter = useCallback((matterId: string | undefined) => {
    contextMatterRef.current = matterId;
  }, []);

  // Link conversation to matter
  const linkConversationToMatter = useCallback(
    async (matterId: string, matterRef: string) => {
      if (!stateRef.current.conversationId || !currentOrganization?.id) return;
      const convId = stateRef.current.conversationId;

      const { data: matter } = await supabase
        .from('matters')
        .select('crm_account_id')
        .eq('id', matterId)
        .eq('organization_id', currentOrganization.id)
        .single();

      const { data: contact } = matter?.crm_account_id
        ? await supabase
            .from('contacts')
            .select('id')
            .eq('organization_id', currentOrganization.id)
            .eq('crm_account_id', matter.crm_account_id)
            .limit(1)
            .single()
        : { data: null };

      await Promise.allSettled([
        supabase
          .from('ai_conversations')
          .update({
            matter_id: matterId,
            context_type: 'matter',
            context_id: matterId,
            updated_at: new Date().toISOString(),
          })
          .eq('id', convId)
          .eq('organization_id', currentOrganization.id),

        supabase.from('matter_timeline_events').insert({
          organization_id: currentOrganization.id,
          matter_id: matterId,
          event_type: 'ai_conversation',
          title: 'Consulta IP-GENIUS vinculada al expediente',
          description: `Conversación de IP-GENIUS indexada al expediente ${matterRef}`,
          source_table: 'ai_conversations',
          source_id: convId,
          actor_type: 'staff',
          is_visible_in_portal: false,
          created_by: user?.id,
        }),

        supabase.from('activities').insert({
          organization_id: currentOrganization.id,
          type: 'ai_consultation',
          subject: `Consulta IP-GENIUS — expediente ${matterRef}`,
          content: 'Consulta de IA vinculada al expediente desde IP-GENIUS',
          contact_id: contact?.id ?? null,
          is_completed: true,
          created_by: user?.id,
          owner_type: 'staff',
        }),
      ]);

      setContextMatter(matterId);
      toast.success(`Consulta indexada al expediente ${matterRef}`, {
        description: 'La conversación forma parte del historial del expediente',
      });
    },
    [currentOrganization?.id, user?.id, setContextMatter]
  );

  return {
    ...state,
    sendMessage,
    loadConversation,
    startNewConversation,
    setContextMatter,
    linkConversationToMatter,
    contextMatterId: contextMatterRef.current,
  };
}

// ===== HOOK: Conversations List =====
export function useGeniusConversations(agentType?: AgentType) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['genius-conversations', user?.id, agentType],
    queryFn: async () => {
      let query = supabase
        .from('ai_conversations')
        .select(`
          *,
          matter:matters(id, reference, title)
        `)
        .eq('user_id', user!.id)
        .eq('status', 'active')
        .order('is_pinned', { ascending: false })
        .order('last_message_at', { ascending: false });

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;
      return data as unknown as AIConversation[];
    },
    enabled: !!user?.id,
  });
}

// ===== HOOK: Pin Conversation =====
export function usePinConversation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, pinned }: { id: string; pinned: boolean }) => {
      const { error } = await supabase
        .from('ai_conversations')
        .update({ is_pinned: pinned })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['genius-conversations'] });
    },
  });
}

// ===== HOOK: Message Feedback =====
export function useGeniusFeedback() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messageId,
      feedback,
      comment,
    }: {
      messageId: string;
      feedback: 'positive' | 'negative';
      comment?: string;
    }) => {
      const { error } = await supabase
        .from('ai_messages')
        .update({
          feedback,
          feedback_comment: comment || null,
        })
        .eq('id', messageId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-messages'] });
    },
  });
}
