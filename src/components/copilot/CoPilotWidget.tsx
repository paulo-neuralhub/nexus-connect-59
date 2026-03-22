// ============================================================
// CoPilotWidget — Self-contained CoPilot UI
// States: minimized (avatar) → bubble (tooltip) → open (chat)
// ============================================================

import { useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass, Sparkles, X, Maximize2, Minimize2, Send,
  ChevronRight, FileText, Search, Zap, BarChart3, HelpCircle,
  AlertTriangle, Clock, DollarSign, MessageSquare, CheckCircle,
  Brain, Settings,
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useCopilot, type CopilotPanelState } from '@/hooks/use-copilot';
import { CoPilotMemoryPanel } from './CoPilotMemoryPanel';
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

type WidgetState = 'minimized' | 'bubble' | 'open';

// ── Main Widget ─────────────────────────────────────────────
export function CoPilotWidget() {
  const copilot = useCopilot();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bubbleRef = useRef<HTMLButtonElement>(null);
  const hasLanded = useRef(false);

  const [chatState, setChatState] = useState<WidgetState>('minimized');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [showGreeting, setShowGreeting] = useState(false);

  // ── Drag state ──
  const [position, setPosition] = useState({ right: 24, bottom: 24 });
  const isDragging = useRef(false);
  const didDrag = useRef(false);
  const dragStart = useRef({ x: 0, y: 0, right: 0, bottom: 0 });

  const {
    isPro, mode, name, avatarUrl,
    urgentCount, briefing, hasBriefing, markBriefingRead,
    dismissBriefing, alerts, pageSuggestion, sendMessage,
    isThinking, features, queriesRemaining, queriesLimit,
    activeSuggestion, actOnSuggestion, dismissSuggestion,
    trackEvent, currentPage,
    memoryExplanation, isLoadingMemory, fetchMemoryExplanation,
  } = copilot;

  // Contextual placeholder based on current page
  const inputPlaceholder = currentPage.includes('/matters/')
    ? 'Pregunta sobre este expediente...'
    : currentPage.includes('/spider')
    ? 'Analiza esta alerta de similitud...'
    : currentPage.includes('/crm/')
    ? '¿Qué me dices de este cliente?'
    : currentPage.includes('/dashboard')
    ? '¿En qué puedo ayudarte hoy?'
    : 'Pregunta lo que necesites...';

  // ── Landing animation ──
  useEffect(() => {
    if (hasLanded.current || !bubbleRef.current) return;
    hasLanded.current = true;
    const el = bubbleRef.current;
    el.style.animation = 'none';
    void el.offsetWidth;
    el.style.animation = 'copilotLand 1.4s cubic-bezier(0.22,1,0.36,1) forwards';
    el.addEventListener('animationend', () => {
      el.style.animation = 'copilotBreath 3.5s ease-in-out infinite';
    }, { once: true });
  }, []);

  // ── Load saved position ──
  useEffect(() => {
    try {
      const saved = localStorage.getItem('copilot_pos');
      if (saved) setPosition(JSON.parse(saved));
    } catch {}
  }, []);

  // ── Drag handlers ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[data-no-drag]')) return;
    isDragging.current = true;
    didDrag.current = false;
    dragStart.current = {
      x: e.clientX, y: e.clientY,
      right: position.right, bottom: position.bottom,
    };
  };

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      didDrag.current = true;
      const dx = dragStart.current.x - e.clientX;
      const dy = dragStart.current.y - e.clientY;
      setPosition({
        right: Math.max(8, dragStart.current.right + dx),
        bottom: Math.max(8, dragStart.current.bottom + dy),
      });
    };
    const onUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      setPosition(p => {
        localStorage.setItem('copilot_pos', JSON.stringify(p));
        return p;
      });
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, []);

  // ── Daily greeting ──
  useEffect(() => {
    const today = new Date().toDateString();
    if (localStorage.getItem('copilot_greeted') === today) return;
    const t = setTimeout(() => {
      localStorage.setItem('copilot_greeted', today);
      setShowGreeting(true);
      setChatState('bubble');
      setTimeout(() => setShowGreeting(false), 8000);
    }, 1500);
    return () => clearTimeout(t);
  }, []);

  // Auto-focus input when opening chat
  useEffect(() => {
    if (chatState === 'open' && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [chatState]);

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

  // Greeting text
  const greetingText = (() => {
    const hour = new Date().getHours();
    const saludo = hour < 12 ? 'Buenos días ☀️'
                 : hour < 20 ? 'Buenas tardes 🌤️'
                 : 'Buenas noches 🌙';
    return `${saludo} Soy Nexus, tu asistente de PI.`;
  })();

  // Don't show on help pages
  if (copilot.currentPage.startsWith('/app/help')) return null;

  const handleBubbleClick = () => {
    if (didDrag.current) { didDrag.current = false; return; }
    setChatState('bubble');
  };

  const breathStyle = `
    @keyframes copilotBreath {
      0%, 100% { opacity: 0.85; transform: scale(1); }
      50% { opacity: 1; transform: scale(1.06); }
    }
    @keyframes copilotLand {
      0% { opacity: 0; transform: translateY(40px) scale(0.8); }
      60% { opacity: 1; transform: translateY(-8px) scale(1.05); }
      80% { transform: translateY(4px) scale(0.97); }
      100% { opacity: 1; transform: translateY(0) scale(1); }
    }
  `;

  return (
    <>
    <style>{breathStyle}</style>
    <div
      style={{ position: 'fixed', bottom: position.bottom, right: position.right, zIndex: 9998 }}
      onMouseDown={handleMouseDown}
    >
      {/* ESTADO MINIMIZADO — Avatar circular */}
      {chatState === 'minimized' && (
        <div
          style={{
            animation: 'copilotBreath 3.5s ease-in-out infinite',
            display: 'inline-block',
            borderRadius: '50%',
          }}
        >
          <button
            ref={bubbleRef}
            onClick={handleBubbleClick}
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2.5px solid #1E293B',
              boxShadow: '0 4px 14px rgba(30,41,59,0.35)',
              cursor: 'pointer',
              padding: 0,
              background: '#E2E8F0',
              display: 'block',
            }}
          >
            <img
              src="/assets/copilot-nexus-avatar.jpeg"
              alt="Nexus"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => {
                e.currentTarget.style.display = 'none';
              }}
            />
          </button>
        </div>
      )}

      {/* ESTADO BUBBLE — Avatar + tooltip */}
      {chatState === 'bubble' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 8 }}>
          <div style={{
            background: 'white',
            borderRadius: 16,
            boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
            padding: '12px 16px',
            maxWidth: 240,
            border: '1px solid rgba(30,41,59,0.12)',
            animation: 'copilotSlideUp 0.3s ease-out',
          }}>
            <p style={{ margin: 0, fontSize: 13, color: '#374151' }}>
              {showGreeting ? greetingText : '¿En qué puedo ayudarte? 👋'}
            </p>
            <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
              <button
                data-no-drag
                onClick={() => setChatState('open')}
                style={{
                  background: '#1E293B', color: 'white',
                  border: 'none', borderRadius: 8,
                  padding: '6px 14px', fontSize: 12,
                  fontWeight: 600, cursor: 'pointer',
                }}
              >
                Abrir chat →
              </button>
              <button
                data-no-drag
                onClick={() => setChatState('minimized')}
                style={{
                  background: 'transparent', color: '#9CA3AF',
                  border: '1px solid #E5E7EB', borderRadius: 8,
                  padding: '6px 12px', fontSize: 12, cursor: 'pointer',
                }}
              >
                Más tarde
              </button>
            </div>
          </div>

          <button
            onClick={() => { if (!didDrag.current) setChatState('minimized'); didDrag.current = false; }}
            style={{
              width: 64, height: 64, borderRadius: '50%',
              overflow: 'hidden',
              border: '2.5px solid #1E293B',
              boxShadow: '0 4px 14px rgba(30,41,59,0.35)',
              cursor: 'pointer', padding: 0,
              background: '#E2E8F0',
              display: 'block',
            }}
          >
            <img
              src="/assets/copilot-nexus-avatar.jpg"
              alt="Nexus"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.currentTarget.style.display = 'none'; }}
            />
          </button>
        </div>
      )}
      {/* ESTADO OPEN — Panel de chat completo */}
      {chatState === 'open' && (
        <CopilotExpanded
          isPro={isPro}
          name={name}
          avatarUrl={avatarUrl}
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
          inputPlaceholder={inputPlaceholder}
          memoryExplanation={memoryExplanation}
          isLoadingMemory={isLoadingMemory}
          onFetchMemory={fetchMemoryExplanation}
          onInputChange={setInputValue}
          onSend={handleSend}
          onCollapse={() => setChatState('minimized')}
          onMarkBriefingRead={markBriefingRead}
          onDismissBriefing={dismissBriefing}
          onNavigate={(url) => {
            navigate(url);
            setChatState('minimized');
          }}
        />
      )}
    </div>
    </>
  );
}

// ── Expanded Panel ──────────────────────────────────────────

function CopilotExpanded({
  isPro, name, avatarUrl, mode, briefing, hasBriefing, messages, inputValue,
  isThinking, queriesRemaining, queriesLimit, features,
  inputRef, scrollRef, inputPlaceholder, onInputChange, onSend, onCollapse,
  onMarkBriefingRead, onDismissBriefing, onNavigate,
  memoryExplanation, isLoadingMemory, onFetchMemory,
}: {
  isPro: boolean;
  name: string;
  avatarUrl: string;
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
  inputPlaceholder: string;
  memoryExplanation: any;
  isLoadingMemory: boolean;
  onFetchMemory: () => void;
  onInputChange: (v: string) => void;
  onSend: () => void;
  onCollapse: () => void;
  onMarkBriefingRead: () => void;
  onDismissBriefing: () => void;
  onNavigate: (url: string) => void;
}) {
  const [briefingOpen, setBriefingOpen] = useState(true);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const width = isPro ? 420 : 400;
  const height = isPro ? 620 : 580;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className="bg-background border border-border rounded-xl shadow-2xl overflow-hidden flex flex-col"
      style={{ width, height, position: 'absolute', bottom: 0, right: 0 }}
    >
      {/* Header */}
      <div className={cn(
        'flex items-center justify-between px-4 py-3 flex-shrink-0',
        isPro
          ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'
          : 'bg-[#1E293B] text-white'
      )}>
        <div className="flex items-center gap-2.5">
          <CompactAvatar src={avatarUrl} name={name} size={32} />
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
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowMemoryPanel(!showMemoryPanel)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="¿Qué sé de ti?"
          >
            <Brain className="h-4 w-4" />
          </button>
          <button
            onClick={onCollapse}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Memory panel (replaces chat when open) */}
      {showMemoryPanel ? (
        <div className="flex-1 overflow-y-auto p-4">
          <CoPilotMemoryPanel
            isPro={isPro}
            isLoading={isLoadingMemory}
            data={memoryExplanation}
            onFetch={onFetchMemory}
            onBack={() => setShowMemoryPanel(false)}
          />
        </div>
      ) : (
        <>
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
                <CompactAvatar src={avatarUrl} name={name} size={48} className="mx-auto mb-3" />
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
                {msg.role === 'assistant' && (
                  <CompactAvatar src={avatarUrl} name={name} size={24} className="mr-2 mt-1 flex-shrink-0" />
                )}
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
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '10px 14px',
                  background: '#F8FAFC',
                  borderRadius: '12px 12px 12px 4px',
                  maxWidth: 200,
                  marginTop: 8,
                }}>
                  <img
                    src={isPro
                      ? '/assets/copilot-genius-avatar.jpeg'
                      : '/assets/copilot-nexus-avatar.jpeg'}
                    style={{ width: 22, height: 22, borderRadius: '50%', objectFit: 'cover' }}
                    alt=""
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <span style={{ fontSize: 12, color: '#6B7280' }}>
                    {isPro ? 'Genius' : 'Nexus'} está pensando
                  </span>
                  <div style={{ display: 'flex', gap: 3 }}>
                    <span className="copilot-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#9CA3AF' }} />
                    <span className="copilot-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#9CA3AF' }} />
                    <span className="copilot-dot" style={{ width: 5, height: 5, borderRadius: '50%', background: '#9CA3AF' }} />
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
              placeholder={inputPlaceholder}
              className="flex-1 text-sm bg-transparent border-none outline-none placeholder:text-muted-foreground"
              disabled={isThinking}
            />
            <Button
              size="icon"
              variant="ghost"
              className={cn(
                'h-8 w-8 rounded-full',
                isPro ? 'hover:bg-amber-100 text-amber-600' : 'hover:bg-muted'
              )}
              onClick={onSend}
              disabled={!inputValue.trim() || isThinking}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>

          {/* Query counter (Basic) */}
          {!isPro && queriesLimit > 0 && (() => {
            const pct = Math.round((queriesRemaining / queriesLimit) * 100);
            const isLow = queriesRemaining < 10;
            const isEmpty = queriesRemaining === 0;
            return (
              <div style={{
                padding: '8px 14px',
                borderTop: '1px solid #F1F5F9',
                background: isEmpty ? '#FEF2F2' : '#F8FAFC',
                flexShrink: 0,
              }}>
                {!isEmpty ? (
                  <>
                    <div style={{
                      display: 'flex', justifyContent: 'space-between',
                      marginBottom: 4, fontSize: 11,
                      color: isLow ? '#D97706' : '#9CA3AF',
                    }}>
                      <span>{queriesRemaining} consultas restantes</span>
                      <span>{queriesLimit}/mes</span>
                    </div>
                    <div style={{ height: 3, borderRadius: 2, background: '#E5E7EB', overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', width: `${pct}%`,
                        background: isLow ? '#F59E0B' : '#1E293B',
                        borderRadius: 2, transition: 'width 0.3s ease',
                      }} />
                    </div>
                    {isLow && (
                      <div style={{ fontSize: 10, color: '#D97706', marginTop: 4, textAlign: 'center' }}>
                        <button
                          onClick={() => onNavigate('/app/settings/billing')}
                          style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 'inherit' }}
                        >
                          Actualiza a Pro para consultas ilimitadas →
                        </button>
                      </div>
                    )}
                  </>
                ) : (
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: 12, color: '#EF4444', fontWeight: 600 }}>
                      Límite mensual alcanzado
                    </div>
                    <button
                      onClick={() => onNavigate('/app/settings/billing')}
                      style={{
                        marginTop: 6, background: '#F59E0B', color: 'white',
                        border: 'none', borderRadius: 8, padding: '6px 16px',
                        fontSize: 12, fontWeight: 600, cursor: 'pointer', width: '100%',
                      }}
                    >
                      Actualizar a Pro →
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </>
      )}
    </motion.div>
  );
}

// ── Compact Avatar helper ───────────────────────────────────

function CompactAvatar({
  src,
  name,
  size,
  className,
}: {
  src: string;
  name: string;
  size: number;
  className?: string;
}) {
  const [error, setError] = useState(false);
  const initials = name.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase();

  if (error || !src) {
    return (
      <div
        className={cn('rounded-full bg-white/20 flex items-center justify-center text-white font-medium', className)}
        style={{ width: size, height: size, fontSize: size * 0.35 }}
      >
        {initials}
      </div>
    );
  }

  return (
    <div
      className={cn('rounded-full overflow-hidden flex-shrink-0', className)}
      style={{ width: size, height: size }}
    >
      <img
        src={src}
        alt={name}
        className="w-full h-full object-cover"
        onError={() => setError(true)}
        draggable={false}
      />
    </div>
  );
}
