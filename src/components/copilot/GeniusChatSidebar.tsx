// ============================================================
// GENIUS Chat — Floating Panel (Premium AI CoPilot)
// ============================================================

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  X, Minus, Clock, Send, Paperclip, AlertTriangle, ArrowLeft,
} from "lucide-react";
import { GeniusAvatar } from "./GeniusAvatar";
import { Button } from "@/components/ui/button";
import { useGeniusChat, useGeniusFeedback } from "@/hooks/use-genius-chat";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGeniusSidebar } from "@/contexts/genius-sidebar-context";
import { GeniusChatBubble } from "./GeniusChatBubble";
import { GeniusChatHistory } from "./GeniusChatHistory";
import { toast } from "sonner";

// ── CSS ─────────────────────────────────────────
const CSS_ID = "genius-panel-css";
const CSS = `
  @keyframes genius-panel-in {
    from { opacity: 0; transform: scale(0.95) translateY(20px); }
    to   { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes genius-panel-out {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to   { opacity: 0; transform: scale(0.95) translateY(20px); }
  }
  @keyframes genius-dots {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-4px); }
  }
  .genius-panel-enter { animation: genius-panel-in 0.25s ease-out forwards; }
  .genius-panel-exit  { animation: genius-panel-out 0.2s ease-in forwards; }
  .genius-dot { animation: genius-dots 1.2s ease-in-out infinite; }
  .genius-dot:nth-child(2) { animation-delay: 0.2s; }
  .genius-dot:nth-child(3) { animation-delay: 0.4s; }

  .genius-markdown h1, .genius-markdown h2, .genius-markdown h3 {
    font-weight: 600; margin-top: 0.75em; margin-bottom: 0.25em;
  }
  .genius-markdown h1 { font-size: 1.1em; }
  .genius-markdown h2 { font-size: 1.05em; }
  .genius-markdown h3 { font-size: 1em; }
  .genius-markdown p { margin-bottom: 0.5em; }
  .genius-markdown ul, .genius-markdown ol { padding-left: 1.25em; margin-bottom: 0.5em; }
  .genius-markdown li { margin-bottom: 0.15em; }
  .genius-markdown code {
    background: hsl(var(--muted)); padding: 0.15em 0.35em; border-radius: 4px; font-size: 0.9em;
  }
  .genius-markdown pre { background: hsl(var(--muted)); padding: 0.75em; border-radius: 8px; overflow-x: auto; margin: 0.5em 0; }
  .genius-markdown pre code { background: none; padding: 0; }
  .genius-markdown table { width: 100%; border-collapse: collapse; margin: 0.5em 0; font-size: 0.9em; }
  .genius-markdown th, .genius-markdown td { border: 1px solid hsl(var(--border)); padding: 0.35em 0.5em; text-align: left; }
  .genius-markdown th { background: hsl(var(--muted)); font-weight: 600; }
  .genius-markdown strong { font-weight: 600; }
  .genius-markdown blockquote {
    border-left: 3px solid #B8860B; padding-left: 0.75em; margin: 0.5em 0; color: hsl(var(--muted-foreground));
  }

  @media (prefers-reduced-motion: reduce) {
    .genius-panel-enter, .genius-panel-exit { animation: none !important; }
    .genius-dot { animation: none !important; opacity: 1 !important; }
  }
`;

// Route-based contextual quick actions
function getQuickActions(pathname: string): { icon: string; label: string; text: string }[] {
  if (pathname.includes("/expedientes/") || pathname.includes("/matters/")) {
    return [
      { icon: "⚖️", label: "Analizar riesgo", text: "Analiza el riesgo de conflicto para este expediente" },
      { icon: "📧", label: "Email al cliente", text: "Redacta un email al cliente sobre el estado de este expediente" },
      { icon: "📋", label: "Resumir", text: "Resume el estado actual de este expediente" },
      { icon: "📅", label: "Verificar plazos", text: "¿Qué plazos tiene pendientes este expediente?" },
    ];
  }
  if (pathname.includes("/plazos") || pathname.includes("/deadlines")) {
    return [
      { icon: "⚠️", label: "Plazos urgentes", text: "¿Qué plazos urgentes tengo esta semana?" },
      { icon: "🔄", label: "Renovaciones", text: "¿Qué renovaciones están pendientes?" },
      { icon: "📊", label: "Generar informe", text: "Genera un informe de plazos críticos" },
    ];
  }
  if (pathname.includes("/spider")) {
    return [
      { icon: "🔔", label: "Alertas", text: "¿Cuáles son las alertas más recientes del Spider?" },
      { icon: "🔍", label: "Analizar similitud", text: "Analiza la similitud con las marcas detectadas" },
      { icon: "📝", label: "Redactar oposición", text: "Redacta un borrador de oposición" },
    ];
  }
  if (pathname.includes("/crm")) {
    return [
      { icon: "👤", label: "Briefing", text: "Genera un briefing del cliente seleccionado" },
      { icon: "📊", label: "Estado cartera", text: "¿Cuál es el estado de la cartera del cliente?" },
      { icon: "📅", label: "Vencimientos", text: "¿Qué vencimientos próximos tiene este cliente?" },
    ];
  }
  return [
    { icon: "✦", label: "Analizar", text: "Analiza " },
    { icon: "📧", label: "Redactar email", text: "Redacta un email profesional sobre " },
    { icon: "📋", label: "Resumir", text: "Resume " },
    { icon: "🔍", label: "Comparar", text: "Compara las marcas " },
    { icon: "📊", label: "Portfolio", text: "Analiza mi portfolio de marcas" },
    { icon: "⚠️", label: "Plazos", text: "¿Qué plazos tengo esta semana?" },
  ];
}

const EMPTY_SUGGESTIONS = [
  { icon: "📊", label: "Analiza mi portfolio de marcas", text: "Analiza mi portfolio de marcas" },
  { icon: "⚠️", label: "¿Qué plazos tengo esta semana?", text: "¿Qué plazos tengo esta semana?" },
  { icon: "📧", label: "Redactar email de renovación", text: "Redacta un email de renovación para el cliente" },
  { icon: "🔍", label: "Comparar marcas similares", text: "Compara la similitud entre las marcas " },
  { icon: "📋", label: "Resumen del expediente actual", text: "Resume el estado del expediente actual" },
  { icon: "💡", label: "Recomendaciones proactivas", text: "¿Qué recomendaciones proactivas tienes para mi cartera?" },
];

function getContextPlaceholder(pathname: string): string {
  if (pathname.includes("/expedientes/") || pathname.includes("/matters/")) return "Pregunta a GENIUS sobre este expediente...";
  if (pathname.includes("/plazos") || pathname.includes("/deadlines")) return "Pregunta sobre plazos y vencimientos...";
  if (pathname.includes("/spider")) return "Pregunta sobre vigilancia de marcas...";
  if (pathname.includes("/crm")) return "Pregunta sobre clientes y cuentas...";
  return "Pregunta a GENIUS lo que necesites...";
}

function getThinkingText(lastMessage?: string): string {
  if (!lastMessage) return "Analizando...";
  const lower = lastMessage.toLowerCase();
  if (lower.includes("email") || lower.includes("redact")) return "Redactando borrador...";
  if (lower.includes("plazo") || lower.includes("deadline")) return "Consultando plazos...";
  if (lower.includes("compar") || lower.includes("similit")) return "Comparando marcas...";
  if (lower.includes("resum")) return "Generando resumen...";
  if (lower.includes("expedient") || lower.includes("matter")) return "Analizando expediente...";
  return "Analizando tu consulta...";
}

export function GeniusChatSidebar() {
  const { isOpen, closeChat, initialMatterId, badgeSide } = useGeniusSidebar();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const location = useLocation();
  const params = useParams();

  const {
    conversationId,
    messages,
    isLoading: chatLoading,
    error: chatError,
    sendMessage,
    loadConversation,
    startNewConversation,
    setContextMatter,
  } = useGeniusChat("legal");

  const feedbackMutation = useGeniusFeedback();

  const [input, setInput] = useState("");
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Inject CSS
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set context matter from route
  useEffect(() => {
    const matterId = initialMatterId || params.matterId || params.id;
    if (matterId && isOpen) setContextMatter(matterId);
  }, [initialMatterId, params.matterId, params.id, isOpen, setContextMatter]);

  // Auto-focus
  useEffect(() => {
    if (isOpen) setTimeout(() => textareaRef.current?.focus(), 300);
  }, [isOpen]);

  // Context chips
  const contextChips = useMemo(() => {
    const chips: string[] = [];
    const path = location.pathname;
    if (path.includes("/matters/") || path.includes("/expedientes/")) {
      chips.push(`📍 Expediente ${params.matterId || params.id || ""}`);
    }
    if (path.includes("/crm/")) chips.push("📍 CRM");
    if (path.includes("/deadlines") || path.includes("/plazos")) chips.push("📍 Plazos");
    if (path.includes("/spider")) chips.push("📍 Vigilancia");
    return chips;
  }, [location.pathname, params]);

  const quickActions = useMemo(() => getQuickActions(location.pathname), [location.pathname]);

  // Handlers
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || chatLoading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "44px";
    try {
      await sendMessage({ message: trimmed, matterId: initialMatterId || params.matterId || params.id });
    } catch {
      toast.error("No se pudo enviar. Intenta de nuevo.");
    }
  }, [input, chatLoading, sendMessage, initialMatterId, params.matterId, params.id]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      handleSend();
    }
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleFeedback = useCallback((messageId: string, feedback: "positive" | "negative") => {
    feedbackMutation.mutate({ messageId, feedback });
  }, [feedbackMutation]);

  const handleTemplate = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  const handleTextareaChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // Auto-grow
    const ta = e.target;
    ta.style.height = "44px";
    ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
  }, []);

  if (!isOpen) return null;

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "usuario";
  const isEmpty = messages.length === 0 && !chatLoading;
  const isLeftSide = badgeSide === "left";
  const lastUserMsg = [...messages].reverse().find(m => m.role === "user")?.content;

  // ── MOBILE: full screen ──
  if (isMobile) {
    return (
      <div className="fixed inset-0 z-[9990] bg-background flex flex-col genius-panel-enter">
        {/* Mobile header */}
        <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg, #0F1729 0%, #1a2744 100%)" }}>
          <div className="flex items-center justify-between px-4 py-3 safe-area-top">
            <div className="flex items-center gap-3">
              <button onClick={closeChat} className="text-white/60 hover:text-white transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <GeniusAvatar variant="genius" size="sm" state={chatLoading ? "thinking" : "idle"} showSparkle />
              <div>
                <span className="text-white font-semibold text-[15px]">GENIUS</span>
                <span className="ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.25)", color: "#D4A574" }}>Pro</span>
              </div>
            </div>
          </div>
          {contextChips.length > 0 && (
            <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
              {contextChips.map((chip, i) => (
                <span key={i} className="text-[11px] font-medium px-2 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {renderBody()}
      </div>
    );
  }

  // ── DESKTOP: floating panel ──
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[9989]" onClick={closeChat} />

      <div
        className="fixed z-[9990] flex flex-col genius-panel-enter"
        style={{
          width: 440,
          height: "min(75vh, 700px)",
          bottom: 24,
          [isLeftSide ? "left" : "right"]: 24,
          borderRadius: 16,
          background: "rgba(255,255,255,0.97)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 25px 50px -12px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)",
        }}
      >
        {/* ── HEADER ────────────────────────── */}
        <div className="flex-shrink-0" style={{ background: "linear-gradient(135deg, #0F1729 0%, #1a2744 100%)", borderRadius: "16px 16px 0 0" }}>
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2.5">
              <GeniusAvatar variant="genius" size="sm" state={chatLoading ? "thinking" : "idle"} showSparkle />
              <div className="flex items-center gap-1.5">
                <span className="text-white font-semibold text-[16px]">GENIUS</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background: "rgba(184,134,11,0.3)", color: "#D4A574" }}>Pro</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={() => setShowHistory(true)}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Historial"
              >
                <Clock className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Minimizar"
              >
                <Minus className="w-4 h-4" />
              </button>
              <button
                onClick={closeChat}
                className="p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          {contextChips.length > 0 && (
            <div className="flex gap-1.5 px-4 pb-2.5 overflow-x-auto">
              {contextChips.map((chip, i) => (
                <span key={i} className="text-[11px] font-medium px-2.5 py-0.5 rounded-full whitespace-nowrap" style={{ background: "rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}>
                  {chip}
                </span>
              ))}
            </div>
          )}
        </div>

        {renderBody()}
      </div>
    </>
  );

  // ── SHARED BODY ──────────────────────────────
  function renderBody() {
    return (
      <>
        {/* ── MESSAGES AREA ─────────────────── */}
        <div
          className="flex-1 overflow-y-auto px-4 py-3 relative"
          style={{
            background: "#FAFAF9",
            backgroundImage: "radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px)",
            backgroundSize: "20px 20px",
          }}
        >
          {/* History overlay */}
          {showHistory && (
            <GeniusChatHistory
              onSelect={(id) => loadConversation(id)}
              onNew={() => { startNewConversation(); setShowHistory(false); }}
              onClose={() => setShowHistory(false)}
              activeConversationId={conversationId}
            />
          )}

          {/* Error */}
          {chatError && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/20 mb-3">
              <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
              <p className="text-[13px] text-destructive flex-1">Error al cargar.</p>
              <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => window.location.reload()}>
                Reintentar
              </Button>
            </div>
          )}

          {/* Empty state */}
          {isEmpty && (
            <div className="flex flex-col items-center justify-center h-full py-6">
              <div className="mb-3">
                <GeniusAvatar variant="genius" size="lg" state="greeting" showSparkle />
              </div>
              <h3 className="text-[20px] font-semibold text-foreground mb-0.5">¡Hola! Soy GENIUS</h3>
              <p className="text-[14px] text-muted-foreground mb-5 text-center">Tu copiloto de propiedad intelectual</p>
              <div className="w-full max-w-[360px] space-y-2">
                {EMPTY_SUGGESTIONS.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => handleTemplate(s.text)}
                    className="w-full flex items-center gap-3 p-3 rounded-xl border border-border/60 hover:border-[#B8860B]/40 hover:bg-amber-50/30 transition-all text-left group"
                  >
                    <span className="text-[18px] flex-shrink-0">{s.icon}</span>
                    <span className="text-[13px] font-medium text-foreground/80 group-hover:text-foreground">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Messages */}
          {messages.map((msg) => (
            <GeniusChatBubble key={msg.id} message={msg} onFeedback={handleFeedback} />
          ))}

          {/* Typing indicator */}
          {chatLoading && (
            <div className="flex gap-2.5 mb-4">
              <div className="flex-shrink-0 mt-0.5">
                <GeniusAvatar variant="genius" size="xs" state="thinking" breathing={false} showSparkle={false} />
              </div>
              <div className="flex-1">
                <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm p-3.5 inline-block">
                  <div className="flex gap-1.5 mb-1.5">
                    <span className="genius-dot w-2 h-2 rounded-full" style={{ background: "#B8860B" }} />
                    <span className="genius-dot w-2 h-2 rounded-full" style={{ background: "#B8860B" }} />
                    <span className="genius-dot w-2 h-2 rounded-full" style={{ background: "#B8860B" }} />
                  </div>
                  <p className="text-[12px] text-muted-foreground">✦ {getThinkingText(lastUserMsg)}</p>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── INPUT AREA ────────────────────── */}
        <div className="flex-shrink-0 border-t border-border/50 bg-white" style={{ borderRadius: isMobile ? 0 : "0 0 16px 16px" }}>
          {/* Quick action chips */}
          {!isEmpty && (
            <div className="flex gap-1.5 px-4 pt-2.5 pb-1 overflow-x-auto">
              {quickActions.slice(0, 5).map((a, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplate(a.text)}
                  className="flex items-center gap-1 text-[12px] font-medium px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
                  style={{
                    border: "1px dashed #D4A574",
                    color: "#92643C",
                    background: "transparent",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(184,134,11,0.08)"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{a.icon}</span> {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2 px-4 py-3">
            <button
              className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors flex-shrink-0"
              title="Adjuntar archivo"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              placeholder={getContextPlaceholder(location.pathname)}
              rows={1}
              className="flex-1 resize-none text-[14px] leading-relaxed border border-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors bg-background text-foreground placeholder:text-muted-foreground"
              style={{ minHeight: 44, maxHeight: 120 }}
            />

            <button
              onClick={handleSend}
              disabled={!input.trim() || chatLoading}
              className="flex-shrink-0 rounded-full flex items-center justify-center transition-all"
              style={{
                width: 36,
                height: 36,
                background: input.trim() && !chatLoading ? "#0F1729" : "hsl(var(--muted))",
                color: input.trim() && !chatLoading ? "white" : "hsl(var(--muted-foreground))",
                cursor: !input.trim() || chatLoading ? "not-allowed" : "pointer",
              }}
            >
              <Send className="w-4 h-4" />
            </button>
          </div>

          {/* Hint */}
          <div className="px-4 pb-2.5">
            <span className="text-[10px] text-muted-foreground/50">⌘+Enter para enviar · ✦ Claude Sonnet</span>
          </div>
        </div>
      </>
    );
  }
}
