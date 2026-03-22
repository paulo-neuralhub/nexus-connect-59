// ============================================================
// CoPilotWidget — Main CoPilot UI component
// Replaces HelpWidget. Supports Basic (navy) and Pro (amber) modes.
// States: bubble → compact → expanded → guide
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Sparkles, X, Maximize2, Minimize2, Send,
  ChevronRight, FileText, Search, Zap, BarChart3, HelpCircle,
  AlertTriangle, Clock, DollarSign, MessageSquare, CheckCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useCopilot, type CopilotPanelState } from '@/hooks/use-copilot';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';

// ── Chat message type ───────────────────────────────────────
interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// ── Priority icon mapping ───────────────────────────────────
function PriorityIcon({ type, priority }: { type: string; priority: string }) {
  if (priority === 'fatal') return <AlertTriangle className="h-4 w-4 text-destructive" />;
  if (type === 'spider') return <AlertTriangle className="h-4 w-4 text-amber-500" />;
  if (type === 'invoice') return <DollarSign className="h-4 w-4 text-teal-500" />;
  if (type === 'chat') return <MessageSquare className="h-4 w-4 text-blue-500" />;
  if (type === 'task') return <CheckCircle className="h-4 w-4 text-orange-500" />;
  return <Clock className="h-4 w-4 text-amber-500" />;
}

// ── Main Widget ─────────────────────────────────────────────
export function CoPilotWidget() {
  const copilot = useCopilot();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');

  const {
    isPro, mode, name, panelState, setPanelState,
    urgentCount, briefing, hasBriefing, markBriefingRead,
    dismissBriefing, alerts, pageSuggestion, sendMessage,
    isThinking, features, queriesRemaining, queriesLimit,
  } = copilot;

  // Auto-focus input when expanding
  useEffect(() => {
    if (panelState === 'expanded' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [panelState]);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isThinking]);

  const handleSend = useCallback(async () => {
    const msg = inputValue.trim();
    if (!msg || isThinking) return;
    setInputValue('');

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);

    try {
      const result = await sendMessage(msg);
      if (result?.message?.content) {
        const assistantMsg: ChatMessage = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: result.message.content,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, assistantMsg]);
      }
    } catch {
      toast.error('Error al comunicar con el CoPilot');
    }
  }, [inputValue, isThinking, sendMessage]);

  // Don't show on help pages
  if (copilot.currentPage.startsWith('/app/help')) return null;
  if (panelState === 'hidden') return null;

  return (
    <div className="fixed bottom-6 right-6 z-40">
      <AnimatePresence mode="wait">
        {panelState === 'bubble' && (
          <CopilotBubble
            key="bubble"
            isPro={isPro}
            urgentCount={urgentCount}
            name={name}
            onClick={() => setPanelState('compact')}
          />
        )}

        {panelState === 'compact' && (
          <CopilotCompact
            key="compact"
            isPro={isPro}
            name={name}
            urgentCount={urgentCount}
            briefing={briefing}
            hasBriefing={hasBriefing}
            pageSuggestion={pageSuggestion}
            alerts={alerts}
            features={features}
            onExpand={() => setPanelState('expanded')}
            onCollapse={() => setPanelState('bubble')}
            onInputClick={() => {
              setPanelState('expanded');
            }}
            onNavigate={(url) => {
              navigate(url);
              setPanelState('bubble');
            }}
          />
        )}

        {panelState === 'expanded' && (
          <CopilotExpanded
            key="expanded"
            isPro={isPro}
            name={name}
            mode={mode}
            briefing={briefing}
            hasBriefing={hasBriefing}
            messages={messages}
            inputValue={inputValue}
            isThinking={isThinking}
            queriesRemaining={queriesRemaining}
            queriesLimit={queriesLimit}
            features={features}
            inputRef={inputRef}
            scrollRef={scrollRef}
            onInputChange={setInputValue}
            onSend={handleSend}
            onCollapse={() => setPanelState('bubble')}
            onMarkBriefingRead={markBriefingRead}
            onDismissBriefing={dismissBriefing}
            onNavigate={(url) => {
              navigate(url);
              setPanelState('bubble');
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Bubble ──────────────────────────────────────────────────

function CopilotBubble({
  isPro, urgentCount, name, onClick,
}: {
  isPro: boolean;
  urgentCount: number;
  name: string;
  onClick: () => void;
}) {
  return (
    <motion.button
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      title={name}
      className={cn(
        'relative rounded-full shadow-lg flex items-center justify-center transition-shadow',
        isPro
          ? 'h-14 w-14 bg-gradient-to-br from-amber-500 to-orange-500 hover:shadow-amber-500/30 hover:shadow-xl'
          : 'h-[52px] w-[52px] bg-[#1E293B] hover:shadow-xl'
      )}
      style={{
        animation: 'copilot-breathe 3s ease-in-out infinite',
      }}
    >
      {isPro ? (
        <Sparkles className="h-6 w-6 text-white" />
      ) : (
        <Compass className="h-5 w-5 text-white" />
      )}

      {/* PRO badge */}
      {isPro && (
        <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold bg-amber-300 text-amber-900 rounded-full shadow-sm">
          PRO
        </span>
      )}

      {/* Urgent badge */}
      {urgentCount > 0 && (
        <span className="absolute -top-1 -left-1 flex h-5 w-5 items-center justify-center">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-60" />
          <span className="relative inline-flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
            {urgentCount > 9 ? '9+' : urgentCount}
          </span>
        </span>
      )}

      {/* Breathing animation */}
      <style>{`
        @keyframes copilot-breathe {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
      `}</style>
    </motion.button>
  );
}

// ── Compact Panel ───────────────────────────────────────────

function CopilotCompact({
  isPro, name, urgentCount, briefing, hasBriefing, pageSuggestion,
  alerts, features, onExpand, onCollapse, onInputClick, onNavigate,
}: {
  isPro: boolean;
  name: string;
  urgentCount: number;
  briefing: any;
  hasBriefing: boolean;
  pageSuggestion: string;
  alerts: any;
  features: any;
  onExpand: () => void;
  onCollapse: () => void;
  onInputClick: () => void;
  onNavigate: (url: string) => void;
}) {
  const width = isPro ? 400 : 360;
  const height = isPro ? 320 : 280;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-0 right-0 bg-background border border-border rounded-xl shadow-2xl overflow-hidden"
      style={{ width, maxHeight: height }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-2.5',
        isPro
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-[#1E293B] text-white'
      )}>
        <div className="flex items-center gap-2">
          <div className={cn(
            'h-2.5 w-2.5 rounded-full',
            isPro ? 'bg-amber-200' : 'bg-blue-400'
          )} />
          <span className="text-sm font-semibold">{name}</span>
          <Badge variant="secondary" className={cn(
            'text-[10px] px-1.5 py-0',
            isPro
              ? 'bg-amber-200/20 text-amber-100 border-amber-200/30'
              : 'bg-white/10 text-white/70 border-white/20'
          )}>
            {isPro ? 'PRO' : 'BASIC'}
          </Badge>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={onExpand} className="p-1 hover:bg-white/10 rounded transition-colors" title="Expandir">
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          <button onClick={onCollapse} className="p-1 hover:bg-white/10 rounded transition-colors" title="Cerrar">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      <div className="p-3 space-y-2.5 overflow-y-auto" style={{ maxHeight: height - 44 }}>
        {/* Briefing alert */}
        {hasBriefing && briefing?.content_json?.items?.length > 0 && (
          <div className="rounded-lg border-2 border-amber-300 bg-amber-50 dark:bg-amber-900/10 p-3">
            <p className="text-sm font-medium text-amber-800 dark:text-amber-200 mb-1.5">
              📋 {briefing.urgent_items} items requieren atención
            </p>
            <div className="space-y-1">
              {briefing.content_json.items.slice(0, isPro ? 3 : 2).map((item: any, i: number) => (
                <button
                  key={i}
                  onClick={() => item.action_url && onNavigate(item.action_url)}
                  className="flex items-center gap-2 text-xs text-foreground/80 hover:text-foreground w-full text-left"
                >
                  <PriorityIcon type={item.type} priority={item.priority} />
                  <span className="truncate">{item.title}</span>
                </button>
              ))}
            </div>
            <button
              onClick={onExpand}
              className="flex items-center gap-1 mt-2 text-xs font-medium text-amber-700 dark:text-amber-300 hover:text-amber-900"
            >
              Ver todo <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* No alerts state */}
        {(!hasBriefing || briefing?.urgent_items === 0) && urgentCount === 0 && (
          <div className="text-center py-3">
            <p className="text-sm text-muted-foreground">Todo en orden ✅</p>
            <p className="text-xs text-muted-foreground mt-1">{pageSuggestion}</p>
          </div>
        )}

        {/* Pro quick actions */}
        {isPro && (
          <div className="flex gap-1.5">
            {[
              { icon: FileText, label: 'Documento', action: onExpand },
              { icon: Search, label: 'Analizar', action: onExpand },
              { icon: BarChart3, label: 'Portfolio', action: onExpand },
            ].map(({ icon: Icon, label, action }) => (
              <button
                key={label}
                onClick={action}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-medium bg-muted hover:bg-muted/80 transition-colors"
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <button
          onClick={onInputClick}
          className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg bg-muted/50 border border-border text-sm text-muted-foreground hover:bg-muted transition-colors text-left"
        >
          <Send className="h-3.5 w-3.5 flex-shrink-0" />
          Pregúntame algo...
        </button>
      </div>
    </motion.div>
  );
}

// ── Expanded Panel ──────────────────────────────────────────

function CopilotExpanded({
  isPro, name, mode, briefing, hasBriefing, messages, inputValue,
  isThinking, queriesRemaining, queriesLimit, features,
  inputRef, scrollRef, onInputChange, onSend, onCollapse,
  onMarkBriefingRead, onDismissBriefing, onNavigate,
}: {
  isPro: boolean;
  name: string;
  mode: string;
  briefing: any;
  hasBriefing: boolean;
  messages: ChatMessage[];
  inputValue: string;
  isThinking: boolean;
  queriesRemaining: number;
  queriesLimit: number;
  features: any;
  inputRef: React.RefObject<HTMLInputElement>;
  scrollRef: React.RefObject<HTMLDivElement>;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onCollapse: () => void;
  onMarkBriefingRead: () => void;
  onDismissBriefing: () => void;
  onNavigate: (url: string) => void;
}) {
  const [briefingOpen, setBriefingOpen] = useState(true);
  const width = isPro ? 420 : 400;
  const height = isPro ? 620 : 580;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="absolute bottom-0 right-0 bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ width, height }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 flex-shrink-0',
        isPro
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-[#1E293B] text-white'
      )}>
        <div className="flex items-center gap-2.5">
          <div className={cn(
            'h-8 w-8 rounded-full flex items-center justify-center',
            isPro ? 'bg-white/20' : 'bg-white/10'
          )}>
            {isPro ? (
              <Sparkles className="h-4 w-4" />
            ) : (
              <Compass className="h-4 w-4" />
            )}
          </div>
          <div>
            <span className="text-sm font-semibold">{name}</span>
            <div className="flex items-center gap-1.5 mt-0.5">
              <Badge variant="secondary" className={cn(
                'text-[9px] px-1 py-0',
                isPro
                  ? 'bg-amber-200/20 text-amber-100'
                  : 'bg-white/10 text-white/70'
              )}>
                {isPro ? 'PRO' : 'BASIC'}
              </Badge>
              <span className="text-[10px] opacity-70">
                {queriesLimit === -1 ? '∞' : `${queriesRemaining}/${queriesLimit}`}
              </span>
            </div>
          </div>
        </div>
        <button
          onClick={onCollapse}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Briefing section */}
      {hasBriefing && briefing?.content_json && (
        <div className={cn(
          'flex-shrink-0 border-b',
          isPro ? 'bg-orange-50/50 dark:bg-orange-900/5' : 'bg-muted/30'
        )}>
          <button
            onClick={() => setBriefingOpen(!briefingOpen)}
            className="w-full flex items-center justify-between px-4 py-2 text-xs font-medium hover:bg-muted/20 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              📋 Briefing del día
              {briefing.urgent_items > 0 && (
                <Badge variant="destructive" className="text-[9px] px-1 py-0">
                  {briefing.urgent_items}
                </Badge>
              )}
            </span>
            <ChevronRight className={cn(
              'h-3 w-3 transition-transform',
              briefingOpen && 'rotate-90'
            )} />
          </button>

          <AnimatePresence>
            {briefingOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={cn(
                  'px-4 pb-3 space-y-1.5 border-l-[3px] mx-3 pl-3',
                  isPro ? 'border-l-amber-500' : 'border-l-[#1E293B]'
                )}>
                  <p className="text-xs text-muted-foreground">
                    {briefing.content_json.summary}
                  </p>
                  <div className="space-y-1">
                    {briefing.content_json.items?.slice(0, 5).map((item: any, i: number) => (
                      <button
                        key={i}
                        onClick={() => item.action_url && onNavigate(item.action_url)}
                        className={cn(
                          'flex items-center gap-2 text-xs w-full text-left py-0.5 hover:text-foreground transition-colors',
                          item.priority === 'fatal' ? 'text-destructive font-medium' :
                          item.priority === 'high' ? 'text-amber-600 dark:text-amber-400' :
                          'text-foreground/70'
                        )}
                      >
                        <PriorityIcon type={item.type} priority={item.priority} />
                        <span className="truncate">{item.title}</span>
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={onMarkBriefingRead}
                      className="text-[10px] font-medium text-primary hover:underline"
                    >
                      Marcar como leído
                    </button>
                    <span className="text-muted-foreground">·</span>
                    <button
                      onClick={onDismissBriefing}
                      className="text-[10px] text-muted-foreground hover:text-foreground"
                    >
                      Descartar
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3" ref={scrollRef}>
        {messages.length === 0 && (
          <div className="text-center py-8">
            <div className={cn(
              'h-12 w-12 mx-auto rounded-full flex items-center justify-center mb-3',
              isPro ? 'bg-amber-100 dark:bg-amber-900/20' : 'bg-[#1E293B]/10 dark:bg-white/5'
            )}>
              {isPro ? (
                <Sparkles className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              ) : (
                <Compass className="h-6 w-6 text-[#1E293B] dark:text-white/60" />
              )}
            </div>
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {isPro ? 'Análisis legal, documentos y acciones' : '¿En qué puedo ayudarte?'}
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={cn(
              'flex',
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            )}
          >
            <div className={cn(
              'max-w-[85%] rounded-xl px-3 py-2 text-sm',
              msg.role === 'user'
                ? isPro
                  ? 'bg-amber-500 text-white'
                  : 'bg-[#1E293B] text-white'
                : 'bg-muted'
            )}>
              {msg.role === 'assistant' ? (
                <div className="prose prose-sm dark:prose-invert max-w-none">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}

        {isThinking && (
          <div className="flex justify-start">
            <div className="bg-muted rounded-xl px-4 py-3">
              <div className="flex gap-1">
                <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="h-2 w-2 rounded-full bg-foreground/30 animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Pro quick actions */}
      {isPro && (
        <div className="flex items-center gap-1 px-3 py-1.5 border-t bg-muted/30 flex-shrink-0">
          {[
            { icon: FileText, label: 'Doc', disabled: !features.documentGeneration },
            { icon: Search, label: 'Analizar' },
            { icon: Zap, label: 'Acción', disabled: !features.appActions },
            { icon: BarChart3, label: 'Portfolio' },
            { icon: HelpCircle, label: 'Ayuda' },
          ].map(({ icon: Icon, label, disabled }) => (
            <button
              key={label}
              disabled={disabled}
              className="flex-1 flex flex-col items-center gap-0.5 py-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <Icon className="h-4 w-4" />
              <span className="text-[9px]">{label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Input area */}
      <div className="flex items-center gap-2 px-3 py-2.5 border-t bg-background flex-shrink-0">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && onSend()}
          placeholder="Escribe tu pregunta..."
          className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
          disabled={isThinking}
        />
        <Button
          size="icon"
          variant="ghost"
          className={cn(
            'h-8 w-8 rounded-full',
            isPro ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-[#1E293B]/10'
          )}
          onClick={onSend}
          disabled={!inputValue.trim() || isThinking}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>

      {/* Upgrade footer (Basic only) */}
      {!isPro && (
        <div className="px-3 py-2 border-t bg-muted/20 flex-shrink-0">
          <button
            onClick={() => onNavigate('/app/settings/billing')}
            className="text-[10px] text-muted-foreground hover:text-primary transition-colors w-full text-center"
          >
            Actualiza a IP-Genius Pro para análisis legal profundo →
          </button>
        </div>
      )}
    </motion.div>
  );
}
