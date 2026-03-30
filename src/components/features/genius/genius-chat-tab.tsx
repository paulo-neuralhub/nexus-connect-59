/**
 * Genius Chat Tab — Enhanced with coverage checks
 */
import { useState, useRef, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Send, Sparkles, Bot, User, Loader2, Copy, ThumbsUp, ThumbsDown,
  Folder, RotateCcw, X, FileText, Scale, Calendar, Search, Paperclip,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { useGeniusChat, useGeniusFeedback } from '@/hooks/use-genius-chat';
import { GeniusCoverageBanner } from './genius-coverage-banner';
import { useGeniusCoverageCheck } from '@/hooks/genius/useGeniusTenantConfig';
import { ConversationSidebar } from './conversation-sidebar';
import type { AgentType, AIMessage, AIConversation } from '@/types/genius';
import { AGENTS } from '@/lib/constants/genius';
import { toast } from 'sonner';

const QUICK_PROMPTS = [
  { icon: '📝', label: 'Respuesta a Office Action', prompt: 'Necesito preparar una respuesta a un Office Action' },
  { icon: '🔍', label: 'Riesgo de confusión', prompt: '¿Cuál es el riesgo de confusión entre estas marcas?' },
  { icon: '📊', label: 'Resumen del portfolio', prompt: 'Dame un resumen del portfolio del cliente' },
  { icon: '📅', label: 'Plazos oposición EUIPO', prompt: '¿Cuáles son los plazos de oposición en EUIPO?' },
  { icon: '📄', label: 'Licencia de marca', prompt: 'Ayúdame a redactar una licencia de marca' },
  { icon: '🌍', label: 'Representante USPTO', prompt: '¿Necesito representante para registrar en USPTO?' },
];

// Detect jurisdiction from message text
function detectJurisdiction(text: string): string | undefined {
  const patterns: [RegExp, string][] = [
    [/EUIPO|UE|comunitaria|europea/i, 'EM'],
    [/USPTO|americana|estados\s*unidos/i, 'US'],
    [/OEPM|España|española|BOPI/i, 'ES'],
    [/UKIPO|Reino\s*Unido/i, 'GB'],
    [/WIPO|Madrid|internacional|PCT/i, 'WO'],
    [/JPO|Japón|japonesa/i, 'JP'],
    [/CNIPA|China|china/i, 'CN'],
  ];
  for (const [re, code] of patterns) {
    if (re.test(text)) return code;
  }
  return undefined;
}

export function GeniusChatTab() {
  const [searchParams] = useSearchParams();
  const { currentOrganization } = useOrganization();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [agentType] = useState<AgentType>('legal');
  const [conversationId, setConversationId] = useState<string | undefined>(
    searchParams.get('conversation') || undefined
  );
  const [selectedMatterId, setSelectedMatterId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [detectedJurisdiction, setDetectedJurisdiction] = useState<string | undefined>();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const agent = AGENTS[agentType];

  const {
    conversationId: chatConvId,
    messages,
    isLoading,
    sendMessage,
    startNewConversation,
    loadConversation,
    setContextMatter,
  } = useGeniusChat(agentType);

  const feedbackMutation = useGeniusFeedback();

  // Coverage check
  const { data: coverageData } = useGeniusCoverageCheck(detectedJurisdiction);

  // Matters for selector
  const { data: matters = [] } = useQuery({
    queryKey: ['matters-simple', currentOrganization?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('matters')
        .select('id, reference, title, mark_name')
        .eq('organization_id', currentOrganization!.id)
        .order('updated_at', { ascending: false })
        .limit(50);
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  useEffect(() => {
    if (conversationId) loadConversation(conversationId);
  }, [conversationId, loadConversation]);

  useEffect(() => {
    setContextMatter(selectedMatterId);
  }, [selectedMatterId, setContextMatter]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Detect jurisdiction from input
  useEffect(() => {
    const j = detectJurisdiction(input);
    if (j) setDetectedJurisdiction(j);
  }, [input]);

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!input.trim() || isLoading) return;
    const message = input.trim();
    setInput('');

    // Detect jurisdiction from message
    const j = detectJurisdiction(message);
    if (j) setDetectedJurisdiction(j);

    try {
      await sendMessage({ message, matterId: selectedMatterId });
    } catch {
      toast.error('Error al enviar mensaje');
    }
  };

  const handleSelectConversation = (conv: AIConversation) => {
    setConversationId(conv.id);
    setSidebarOpen(false);
  };

  const handleNewChat = () => {
    startNewConversation();
    setConversationId(undefined);
    setDetectedJurisdiction(undefined);
  };

  const selectedMatter = matters.find((m) => m.id === selectedMatterId);

  return (
    <div className="h-[calc(100vh-20rem)] flex rounded-xl border bg-card overflow-hidden">
      {/* Sidebar */}
      {sidebarOpen && (
        <div className="w-64 flex-shrink-0 border-r hidden lg:block">
          <ConversationSidebar
            agentType={agentType}
            selectedId={chatConvId || conversationId}
            onSelect={handleSelectConversation}
            onNewChat={handleNewChat}
          />
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="px-4 py-3 border-b flex items-center gap-3 bg-gradient-to-r from-card to-muted/30">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: `linear-gradient(135deg, ${agent.color}30, ${agent.color}10)` }}
          >
            <Sparkles className="w-5 h-5" style={{ color: agent.color }} />
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-foreground">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">{agent.description}</p>
          </div>

          {/* Matter selector */}
          <Select
            value={selectedMatterId || 'none'}
            onValueChange={(v) => setSelectedMatterId(v === 'none' ? undefined : v)}
          >
            <SelectTrigger className="w-[200px] h-9">
              <Folder className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Vincular expediente" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin vincular</SelectItem>
              {matters.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.reference} - {m.title || m.mark_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {chatConvId && (
            <Button variant="ghost" size="sm" onClick={handleNewChat}>
              <RotateCcw className="w-4 h-4 mr-1" />
              Nueva
            </Button>
          )}
        </div>

        {/* Context badge */}
        {selectedMatter && (
          <div className="px-4 py-2 bg-amber-50 dark:bg-amber-950/20 border-b flex items-center gap-2">
            <Badge variant="secondary" className="gap-1 border-amber-300 bg-amber-100 dark:bg-amber-900/30">
              <Folder className="w-3 h-3" />
              {selectedMatter.reference}
            </Badge>
            <span className="text-sm text-muted-foreground">
              {selectedMatter.title || selectedMatter.mark_name}
            </span>
            <Button
              variant="ghost"
              size="icon"
              className="h-5 w-5 ml-auto"
              onClick={() => setSelectedMatterId(undefined)}
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}

        {/* Coverage banner */}
        {detectedJurisdiction && coverageData && (
          <div className="px-4 py-2 border-b">
            <GeniusCoverageBanner coverage={coverageData} />
          </div>
        )}

        {/* Messages */}
        <ScrollArea className="flex-1 p-4">
          <div className="space-y-4 max-w-3xl mx-auto">
            {messages.length === 0 && !isLoading && (
              <EmptyState
                agentName={agent.name}
                agentColor={agent.color}
                capabilities={agent.capabilities}
                onSelect={(prompt) => {
                  setInput(prompt);
                  inputRef.current?.focus();
                }}
              />
            )}

            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                agentColor={agent.color}
                onFeedback={async (id, fb) => {
                  if (id.startsWith('temp-')) return;
                  await feedbackMutation.mutateAsync({ messageId: id, feedback: fb });
                }}
                onCopy={(c) => {
                  navigator.clipboard.writeText(c);
                  toast.success('Copiado');
                }}
              />
            ))}

            {isLoading && (
              <div className="flex gap-3">
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center"
                  style={{ background: `${agent.color}20` }}
                >
                  <Bot className="w-4 h-4 animate-pulse" style={{ color: agent.color }} />
                </div>
                <div className="bg-card rounded-xl p-4 border">
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: agent.color }} />
                    <span className="text-sm text-muted-foreground">Pensando...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        </ScrollArea>

        {/* Input */}
        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex gap-2 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder={
                selectedMatter
                  ? `Pregunta sobre ${selectedMatter.reference}...`
                  : `Pregunta a ${agent.name}...`
              }
              rows={1}
              className="flex-1 resize-none rounded-xl border px-4 py-3 focus:outline-none focus:ring-2 focus:ring-primary/20 bg-background text-sm"
              disabled={isLoading}
            />
            <Button type="submit" disabled={!input.trim() || isLoading} className="px-4 rounded-xl">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            ⚠️ Información orientativa. No constituye asesoramiento legal.
          </p>
        </form>
      </div>
    </div>
  );
}

// ===== Empty State =====
function EmptyState({
  agentName,
  agentColor,
  capabilities,
  onSelect,
}: {
  agentName: string;
  agentColor: string;
  capabilities: string[];
  onSelect: (prompt: string) => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
        style={{ background: `linear-gradient(135deg, ${agentColor}40, ${agentColor}10)` }}
      >
        <Sparkles className="w-10 h-10" style={{ color: agentColor }} />
      </div>
      <h3 className="text-2xl font-bold mb-2">¡Hola! Soy {agentName}</h3>
      <p className="text-muted-foreground mb-8 max-w-md">
        Tu asistente IA para propiedad intelectual.
      </p>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 w-full max-w-lg mb-8">
        {QUICK_PROMPTS.map((p) => (
          <Button
            key={p.label}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-1 text-xs"
            onClick={() => onSelect(p.prompt)}
          >
            <span className="text-lg">{p.icon}</span>
            {p.label}
          </Button>
        ))}
      </div>

      <div className="text-sm text-muted-foreground">
        <p className="mb-2">Puedo ayudarte con:</p>
        <ul className="space-y-1">
          {capabilities.map((c) => (
            <li key={c} className="flex items-center gap-2">
              <span className="text-primary">✓</span> {c}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ===== Message Bubble =====
function MessageBubble({
  message,
  agentColor,
  onFeedback,
  onCopy,
}: {
  message: AIMessage;
  agentColor: string;
  onFeedback: (id: string, fb: 'positive' | 'negative') => void;
  onCopy: (content: string) => void;
}) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3', isUser && 'flex-row-reverse')}>
      <div
        className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', isUser && 'bg-muted')}
        style={!isUser ? { backgroundColor: `${agentColor}20` } : undefined}
      >
        {isUser ? <User className="w-4 h-4 text-muted-foreground" /> : <Bot className="w-4 h-4" style={{ color: agentColor }} />}
      </div>

      <div className={cn('flex-1 max-w-[85%]', isUser && 'flex flex-col items-end')}>
        <div className={cn('rounded-xl p-4', isUser ? 'bg-primary text-primary-foreground' : 'bg-card border shadow-sm')}>
          {isUser ? (
            <p className="whitespace-pre-wrap text-sm">{message.content}</p>
          ) : (
            <div className="prose prose-sm max-w-none prose-headings:text-slate-800 prose-headings:font-semibold prose-p:text-slate-700 prose-p:leading-relaxed prose-strong:text-slate-800 prose-strong:font-semibold prose-ul:text-slate-700 prose-li:marker:text-amber-500 prose-ol:text-slate-700 prose-blockquote:border-l-amber-500 prose-blockquote:text-slate-600 prose-code:text-amber-700 prose-code:bg-amber-50 prose-code:px-1 prose-code:rounded prose-hr:border-slate-200">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Sources (collapsible) */}
        {!isUser && message.sources && message.sources.length > 0 && (
          <details className="mt-2">
            <summary className="text-xs text-muted-foreground cursor-pointer">
              📚 Basado en: {message.sources.map((s) => s.title).join(' · ')}
            </summary>
            <div className="mt-1 flex flex-wrap gap-1">
              {message.sources.map((s, i) => (
                <Badge key={i} variant="outline" className="text-xs">
                  📄 {s.title}
                </Badge>
              ))}
            </div>
          </details>
        )}

        {/* Action proposal */}
        {!isUser && message.actions_taken?.some((a) => a.type === 'navigate') && (
          <Card className="mt-2 border-amber-200 bg-amber-50/50 dark:bg-amber-950/10 p-3">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="text-sm font-medium">Acción propuesta</span>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs">
                ✓ Aprobar
              </Button>
              <Button size="sm" variant="ghost" className="text-xs">
                ✕ Rechazar
              </Button>
            </div>
          </Card>
        )}

        {/* Disclaimer */}
        {!isUser && (
          <p className="text-[10px] text-muted-foreground mt-1">
            ⚠️ Información orientativa. No constituye asesoramiento legal.
          </p>
        )}

        {/* Feedback + timestamp */}
        {!isUser && (
          <div className="flex items-center gap-1 mt-1">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onCopy(message.content)}>
              <Copy className="w-3 h-3" />
            </Button>
            {!message.feedback && !message.id.startsWith('temp-') && (
              <>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFeedback(message.id, 'positive')}>
                  <ThumbsUp className="w-3 h-3" />
                </Button>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => onFeedback(message.id, 'negative')}>
                  <ThumbsDown className="w-3 h-3" />
                </Button>
              </>
            )}
          </div>
        )}

        <p className="text-[10px] text-muted-foreground mt-0.5">
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: true, locale: es })}
        </p>
      </div>
    </div>
  );
}

// Import Zap for action proposals
import { Zap } from 'lucide-react';
