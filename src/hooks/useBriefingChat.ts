import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export type ChatError =
  | 'genius_not_active'
  | 'disclaimer_required'
  | 'limit_reached'
  | 'generic'
  | null;

export function useBriefingChat(organizationId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<ChatError>(null);
  const conversationIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!organizationId) return;
    const stored = localStorage.getItem(`briefing_chat_conv_${organizationId}`);
    if (stored) conversationIdRef.current = stored;
  }, [organizationId]);

  async function buildContextPage(): Promise<string> {
    if (!organizationId) return 'briefing/history';

    const { data: briefings } = await (supabase as any)
      .from('genius_daily_briefings')
      .select('briefing_date, content_json, total_items, urgent_items')
      .eq('organization_id', organizationId)
      .is('user_id', null)
      .order('briefing_date', { ascending: false })
      .limit(7);

    if (!briefings?.length) {
      return 'briefing/history — Sin datos de briefings disponibles aún.';
    }

    const lines = briefings.map((b: any) => {
      const health = Math.max(0, 100 - (b.urgent_items * 15) - (b.total_items * 3));
      const items = (b.content_json?.items ?? []) as any[];
      const itemLines = items.length
        ? items
            .map(
              (i: any) =>
                `    · [${i.type}|${i.priority}] ${i.title}` +
                (i.description ? `: ${i.description.substring(0, 120)}` : ''),
            )
            .join('\n')
        : '    · (sin items este día)';

      return (
        `  ${b.briefing_date} | health:${health}% | urgentes:${b.urgent_items} | total:${b.total_items}\n` +
        itemLines
      );
    }).join('\n\n');

    return `briefing/history\n\nHISTÓRICO DE MORNING BRIEFINGS (últimos ${briefings.length} días):\n${lines}\n\nEl usuario consulta el histórico de briefings de su organización.\nResponde basándote ÚNICAMENTE en los datos anteriores.\nSi preguntan por una persona búscala en los campos description.\nSi no hay datos suficientes indícalo claramente sin inventar.`;
  }

  async function sendMessage(userMessage: string) {
    if (!userMessage.trim() || isLoading || !organizationId) return;

    setError(null);
    setMessages((prev) => [
      ...prev,
      { role: 'user', content: userMessage, timestamp: new Date() },
    ]);
    setIsLoading(true);

    try {
      const contextPage = await buildContextPage();

      const { data, error: fnError } = await supabase.functions.invoke('genius-chat', {
        body: {
          message: userMessage,
          conversation_id: conversationIdRef.current ?? undefined,
          context_page: contextPage,
          stream: false,
        },
      });

      if (fnError) {
        setError('generic');
        return;
      }

      if (data?.error) {
        if (data.error === 'genius_not_active') setError('genius_not_active');
        else if (data.error === 'disclaimer_required') setError('disclaimer_required');
        else if (data.error === 'monthly_query_limit_reached') setError('limit_reached');
        else setError('generic');
        return;
      }

      if (data?.conversation_id) {
        conversationIdRef.current = data.conversation_id;
        localStorage.setItem(`briefing_chat_conv_${organizationId}`, data.conversation_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data?.message?.content ?? 'Sin respuesta del asistente.',
          timestamp: new Date(),
        },
      ]);
    } catch {
      setError('generic');
    } finally {
      setIsLoading(false);
    }
  }

  function clearChat() {
    setMessages([]);
    setError(null);
    conversationIdRef.current = null;
    if (organizationId) {
      localStorage.removeItem(`briefing_chat_conv_${organizationId}`);
    }
  }

  return { messages, isLoading, error, sendMessage, clearChat };
}
