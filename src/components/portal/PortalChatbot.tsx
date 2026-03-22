/**
 * Floating Chatbot for Portal Client
 * AI chatbot with handoff support
 */

import { useState, useRef, useEffect } from 'react';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { useIsImpersonating } from '@/components/portal/PortalLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, X, Minimize2, Loader2, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

export default function PortalChatbot() {
  const { user, org, permissions, isImpersonating } = usePortalAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [mode, setMode] = useState<'ai' | 'waiting_human' | 'human'>('ai');
  const [agentName, setAgentName] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const chatbotName = org?.portal_chatbot_name || 'Asistente';

  // Don't show chatbot if impersonating or no permission
  if (isImpersonating || !permissions?.can_use_chatbot) return null;

  const suggestions = [
    '¿Cuál es el estado de mis marcas?',
    '¿Tengo facturas pendientes?',
    '¿Qué documentos necesitan mi firma?',
  ];

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const handleSend = async (text?: string) => {
    const message = text || input.trim();
    if (!message || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    scrollToBottom();

    try {
      const { data, error } = await supabase.functions.invoke('portal-chatbot', {
        body: { message, session_id: sessionId },
      });

      if (error) throw error;

      if (data?.session_id) setSessionId(data.session_id);

      if (data?.handoff_required) {
        // Request handoff
        setMessages(prev => [...prev, {
          id: Date.now().toString() + '-sys',
          role: 'system',
          content: 'Conectando con un agente humano...',
          timestamp: new Date(),
        }]);

        const { data: handoffData } = await supabase.functions.invoke('portal-handoff', {
          body: { session_id: data.session_id, reason: message },
        });

        if (handoffData?.status === 'connected') {
          setMode('human');
          setAgentName(handoffData.agent_name);
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-connected',
            role: 'system',
            content: `✅ Conectado con ${handoffData.agent_name}`,
            timestamp: new Date(),
          }]);
        } else {
          setMode('waiting_human');
          setMessages(prev => [...prev, {
            id: Date.now().toString() + '-waiting',
            role: 'system',
            content: 'Todos los agentes están ocupados. Te atenderán en breve.',
            timestamp: new Date(),
          }]);
        }
      } else {
        const aiMsg: ChatMessage = {
          id: Date.now().toString() + '-ai',
          role: 'assistant',
          content: data?.response || 'No pude procesar tu consulta.',
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, aiMsg]);
      }
    } catch (err) {
      setMessages(prev => [...prev, {
        id: Date.now().toString() + '-err',
        role: 'system',
        content: 'Error al procesar tu consulta. Intenta de nuevo.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-transform hover:scale-110"
        style={{ backgroundColor: org?.primary_color || 'hsl(var(--primary))' }}
      >
        <MessageSquare className="w-6 h-6 text-white" />
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[380px] max-h-[550px] bg-background rounded-xl shadow-2xl border flex flex-col overflow-hidden">
      {/* Header */}
      <div 
        className="flex items-center justify-between px-4 py-3 text-white"
        style={{ backgroundColor: org?.primary_color || 'hsl(var(--primary))' }}
      >
        <div className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          <div>
            <p className="font-medium text-sm">{chatbotName}</p>
            <p className="text-xs opacity-80">
              {mode === 'human' ? `${agentName} conectado` : mode === 'waiting_human' ? 'Esperando agente...' : 'En línea'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {mode === 'human' && (
            <Badge className="bg-white/20 text-white text-xs">
              <User className="w-3 h-3 mr-1" />
              Humano
            </Badge>
          )}
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3 max-h-[380px]">
        {messages.length === 0 ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ¡Hola {user?.name?.split(' ')[0] || ''}! Soy {chatbotName}. ¿En qué puedo ayudarte?
            </p>
            <div className="space-y-2">
              {suggestions.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(s)}
                  className="block w-full text-left text-sm px-3 py-2 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                msg.role === 'user' ? 'bg-primary text-primary-foreground' :
                msg.role === 'system' ? 'bg-muted text-muted-foreground text-center w-full text-xs italic' :
                'bg-muted'
              }`}>
                {msg.role === 'assistant' ? (
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                )}
              </div>
            </div>
          ))
        )}
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg px-3 py-2 text-sm flex items-center gap-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span className="text-muted-foreground">
                {mode === 'ai' ? 'Analizando...' : 'Enviando...'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t">
        {isImpersonating ? (
          <Input disabled placeholder="Chat desactivado en modo vista" className="opacity-50" />
        ) : (
          <div className="flex gap-2">
            <Input
              placeholder="Escribe tu pregunta..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              disabled={isLoading}
            />
            <Button size="icon" onClick={() => handleSend()} disabled={!input.trim() || isLoading}>
              <Send className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
