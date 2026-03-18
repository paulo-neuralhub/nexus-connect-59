import { useState, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface GeniusMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
  model?: string;
  tokensUsed?: number;
}

export interface GeniusConversation {
  id: string;
  title: string;
  agentType: string;
  messageCount: number;
  lastMessageAt: string;
  matterId?: string;
  contactId?: string;
}

// Stream chat with Genius Pro
export function useGeniusProChat() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedContent, setStreamedContent] = useState('');
  const queryClient = useQueryClient();

  const streamChat = useCallback(async ({
    messages,
    agentType = 'nexus_ops',
    matterId,
    contactId,
    onDelta,
    onDone,
  }: {
    messages: Array<{ role: 'user' | 'assistant'; content: string }>;
    agentType?: string;
    matterId?: string;
    contactId?: string;
    onDelta?: (delta: string) => void;
    onDone?: () => void;
  }) => {
    setIsStreaming(true);
    setStreamedContent('');

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/genius-pro-chat`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            messages,
            agentType,
            matterId,
            contactId,
            stream: true,
          }),
        }
      );

      if (!response.ok) {
        if (response.status === 429) {
          throw new Error('Límite de uso excedido. Intenta más tarde.');
        }
        if (response.status === 402) {
          throw new Error('Sin créditos de IA. Actualiza tu plan.');
        }
        throw new Error('Error en la solicitud');
      }

      if (!response.body) throw new Error('No response body');

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = buffer.indexOf('\n')) !== -1) {
          let line = buffer.slice(0, newlineIndex);
          buffer = buffer.slice(newlineIndex + 1);

          if (line.endsWith('\r')) line = line.slice(0, -1);
          if (line.startsWith(':') || line.trim() === '') continue;
          if (!line.startsWith('data: ')) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              fullContent += content;
              setStreamedContent(fullContent);
              onDelta?.(content);
            }
          } catch {
            // Incomplete JSON, wait for more data
            buffer = line + '\n' + buffer;
            break;
          }
        }
      }

      setIsStreaming(false);
      onDone?.();
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
      
      return fullContent;

    } catch (error) {
      setIsStreaming(false);
      const message = error instanceof Error ? error.message : 'Error desconocido';
      toast.error(message);
      throw error;
    }
  }, [queryClient]);

  return {
    streamChat,
    isStreaming,
    streamedContent,
  };
}

// Non-streaming chat for quick responses
export function useGeniusProMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      messages,
      agentType = 'nexus_ops',
      matterId,
      contactId,
    }: {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      agentType?: string;
      matterId?: string;
      contactId?: string;
    }) => {
      const { data, error } = await supabase.functions.invoke('genius-pro-chat', {
        body: {
          messages,
          agentType,
          matterId,
          contactId,
          stream: false,
        },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['ai-usage'] });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error en la respuesta de IA');
    },
  });
}

// Get AI usage stats
export function useAIUsage() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['ai-usage', currentOrganization?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ai_usage')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .gte('period_start', new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
        .order('period_start', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      
      return data || {
        tokens_input: 0,
        tokens_output: 0,
        messages_count: 0,
        estimated_cost_cents: 0,
      };
    },
    enabled: !!currentOrganization?.id,
  });
}

// Get conversation history
export function useGeniusConversations(agentType?: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['genius-conversations', currentOrganization?.id, agentType],
    queryFn: async (): Promise<GeniusConversation[]> => {
      let query = supabase
        .from('ai_conversations')
        .select('*')
        .eq('organization_id', currentOrganization!.id)
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (agentType) {
        query = query.eq('agent_type', agentType);
      }

      const { data, error } = await query;
      if (error) throw error;

      return (data || []).map(c => ({
        id: c.id,
        title: c.title || 'Sin título',
        agentType: c.agent_type,
        messageCount: c.message_count || 0,
        lastMessageAt: c.last_message_at || c.created_at || '',
        matterId: c.matter_id || undefined,
        contactId: c.contact_id || undefined,
      }));
    },
    enabled: !!currentOrganization?.id,
  });
}

// Get messages for a conversation
export function useGeniusMessages(conversationId: string) {
  return useQuery({
    queryKey: ['genius-messages', conversationId],
    queryFn: async (): Promise<GeniusMessage[]> => {
      const { data, error } = await supabase
        .from('ai_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      return (data || []).map(m => ({
        id: m.id,
        role: m.role as 'user' | 'assistant',
        content: m.content,
        createdAt: m.created_at || '',
        model: m.model_used || undefined,
        tokensUsed: m.tokens_used || undefined,
      }));
    },
    enabled: !!conversationId,
  });
}

// Available agent types
export const GENIUS_AGENTS = {
  nexus_guide: {
    name: 'NEXUS Guide',
    description: 'Asistente de ayuda y navegación',
    icon: 'HelpCircle',
  },
  nexus_ops: {
    name: 'NEXUS Ops',
    description: 'Operaciones y gestión de expedientes',
    icon: 'Briefcase',
  },
  nexus_legal: {
    name: 'NEXUS Legal',
    description: 'Análisis legal avanzado',
    icon: 'Scale',
  },
  nexus_watch: {
    name: 'NEXUS Watch',
    description: 'Vigilancia y análisis de amenazas',
    icon: 'Eye',
  },
  nexus_strategist: {
    name: 'NEXUS Strategist',
    description: 'Estrategia de marca y posicionamiento',
    icon: 'Target',
  },
} as const;
