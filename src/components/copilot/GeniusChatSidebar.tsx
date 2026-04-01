// ============================================================
// GENIUS Chat Sidebar — Main component
// ============================================================

import { useState, useRef, useEffect, useCallback } from "react";
import { useLocation, useParams } from "react-router-dom";
import {
  X, Minus, ClipboardList, Send, Paperclip, AlertTriangle,
} from "lucide-react";
import { GeniusAvatar } from "./GeniusAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useGeniusChat, useGeniusFeedback } from "@/hooks/use-genius-chat";
import { useAuth } from "@/contexts/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { useGeniusSidebar } from "@/contexts/genius-sidebar-context";
import { GeniusChatBubble } from "./GeniusChatBubble";
import { GeniusChatHistory } from "./GeniusChatHistory";
import { toast } from "sonner";

// ── CSS injection ─────────────────────────────────────────
const CSS_ID = "genius-sidebar-css";
const CSS = `
  @keyframes genius-slide-in {
    from { transform: translateX(100%); }
    to   { transform: translateX(0); }
  }
  @keyframes genius-slide-out {
    from { transform: translateX(0); }
    to   { transform: translateX(100%); }
  }
  @keyframes genius-dots {
    0%, 60%, 100% { opacity: 0.3; transform: translateY(0); }
    30% { opacity: 1; transform: translateY(-4px); }
  }
  .genius-sidebar-enter { animation: genius-slide-in 0.3s ease-out; }
  .genius-dot { animation: genius-dots 1.2s ease-in-out infinite; }
  .genius-dot:nth-child(2) { animation-delay: 0.2s; }
  .genius-dot:nth-child(3) { animation-delay: 0.4s; }
  @media (prefers-reduced-motion: reduce) {
    .genius-sidebar-enter { animation: none !important; }
    .genius-dot { animation: none !important; opacity: 1 !important; }
  }
`;

const TEMPLATES = [
  { label: "Analizar riesgo", text: "Analiza el riesgo de conflicto para " },
  { label: "Redactar", text: "Redacta un borrador de " },
  { label: "Clasificar", text: "Clasifica según la clasificación de Niza: " },
  { label: "Comparar", text: "Compara las marcas " },
  { label: "Resumir", text: "Resume el estado actual de " },
];

const EMPTY_SUGGESTIONS = [
  { icon: "🔍", label: "Analizar marca", text: "Analiza la registrabilidad de la marca " },
  { icon: "📑", label: "Buscar precedentes", text: "Busca precedentes jurisprudenciales sobre " },
  { icon: "📅", label: "Revisar plazos", text: "¿Qué plazos tengo pendientes esta semana?" },
  { icon: "✉️", label: "Redactar email", text: "Redacta un email al cliente sobre " },
  { icon: "📋", label: "Clasificar", text: "Clasifica los siguientes productos/servicios según Niza: " },
  { icon: "⚖️", label: "Comparar marcas", text: "Compara la similitud entre las marcas " },
];

export function GeniusChatSidebar() {
  const { isOpen, closeChat, initialMatterId } = useGeniusSidebar();
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
  const [sidebarWidth, setSidebarWidth] = useState(420);
  const [isResizing, setIsResizing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const sidebarRef = useRef<HTMLDivElement>(null);

  // Inject CSS
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Set context matter from route or prop
  useEffect(() => {
    const matterId = initialMatterId || params.matterId || params.id;
    if (matterId && isOpen) {
      setContextMatter(matterId);
    }
  }, [initialMatterId, params.matterId, params.id, isOpen, setContextMatter]);

  // Auto-focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300);
    }
  }, [isOpen]);

  // Context chips from current route
  const contextChips = (() => {
    const chips: { label: string; removable: boolean }[] = [];
    const path = location.pathname;
    if (path.includes("/matters/") && (params.matterId || params.id)) {
      chips.push({ label: `Expediente: ${params.matterId || params.id}`, removable: true });
    }
    if (path.includes("/crm/")) {
      chips.push({ label: "CRM", removable: false });
    }
    if (path.includes("/deadlines")) {
      chips.push({ label: "Plazos", removable: false });
    }
    return chips;
  })();

  // Resize handler
  const startResize = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = sidebarWidth;

    const onMove = (ev: MouseEvent) => {
      const delta = startX - ev.clientX;
      const newWidth = Math.max(360, Math.min(600, startWidth + delta));
      setSidebarWidth(newWidth);
    };
    const onUp = () => {
      setIsResizing(false);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }, [sidebarWidth]);

  // Send handler
  const handleSend = useCallback(async () => {
    const trimmed = input.trim();
    if (!trimmed || chatLoading) return;
    setInput("");
    try {
      await sendMessage({ message: trimmed, matterId: initialMatterId || params.matterId || params.id });
    } catch {
      toast.error("No se pudo enviar. Intenta de nuevo.");
    }
  }, [input, chatLoading, sendMessage, initialMatterId, params.matterId, params.id]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  const handleFeedback = useCallback(
    (messageId: string, feedback: "positive" | "negative") => {
      feedbackMutation.mutate({ messageId, feedback });
    },
    [feedbackMutation]
  );

  const handleTemplate = useCallback((text: string) => {
    setInput(text);
    textareaRef.current?.focus();
  }, []);

  if (!isOpen) return null;

  const firstName = user?.user_metadata?.first_name || user?.email?.split("@")[0] || "usuario";
  const isEmpty = messages.length === 0 && !chatLoading;

  return (
    <div
      ref={sidebarRef}
      role="complementary"
      aria-label="GENIUS chat"
      className={`fixed top-0 right-0 h-screen flex flex-col bg-white border-l border-[#E7E5E4] z-40 genius-sidebar-enter ${
        isMobile ? "w-full" : ""
      }`}
      style={{
        width: isMobile ? "100%" : sidebarWidth,
        boxShadow: "-4px 0 24px rgba(0,0,0,0.08)",
      }}
    >
      {/* Resize handle */}
      {!isMobile && (
        <div
          className="absolute left-0 top-0 bottom-0 w-1 cursor-col-resize hover:bg-blue-300 transition-colors z-10"
          onMouseDown={startResize}
          style={{ background: isResizing ? "#3B82F6" : "transparent" }}
        />
      )}

      {/* ── HEADER ────────────────────────────────────── */}
      <div className="flex-shrink-0 border-b border-[#E7E5E4]">
        {/* Top row */}
        <div className="flex items-center justify-between px-4 py-2.5">
          <div className="flex items-center gap-2">
            <GeniusAvatar variant="genius" size="sm" state={chatLoading ? "thinking" : "idle"} showSparkle />
            <span className="text-[16px] font-semibold" style={{ color: "#0F1729" }}>
              ✦ GENIUS
            </span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setShowHistory(true)}
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
              title="Historial"
            >
              <ClipboardList className="w-4 h-4" />
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
              title="Minimizar"
            >
              <Minus className="w-4 h-4" />
            </button>
            <button
              onClick={closeChat}
              className="p-1.5 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Context chips */}
        {contextChips.length > 0 && (
          <div className="flex gap-1.5 px-4 pb-2 overflow-x-auto">
            {contextChips.map((chip, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 text-[12px] font-medium px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 whitespace-nowrap"
              >
                {chip.label}
                {chip.removable && (
                  <button className="ml-0.5 text-blue-400 hover:text-blue-600">×</button>
                )}
              </span>
            ))}
          </div>
        )}

        {/* Autonomy level */}
        <div className="flex items-center justify-between px-4 pb-2">
          <span
            className="text-[11px] text-neutral-400"
            style={{ fontFamily: "'Geist Mono', monospace" }}
          >
            Claude Sonnet · Nivel 1: Borradores
          </span>
          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
            Nivel 1
          </span>
        </div>
      </div>

      {/* ── MESSAGES AREA ─────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-4 py-3 relative">
        {/* History overlay */}
        {showHistory && (
          <GeniusChatHistory
            onSelect={(id) => loadConversation(id)}
            onNew={() => {
              startNewConversation();
              setShowHistory(false);
            }}
            onClose={() => setShowHistory(false)}
            activeConversationId={conversationId}
          />
        )}

        {/* Error state */}
        {chatError && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 mb-3">
            <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-[13px] text-red-700 flex-1">
              No se pudieron cargar los insights.
            </p>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-[12px] text-red-600"
              onClick={() => window.location.reload()}
            >
              Reintentar
            </Button>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center justify-center h-full py-8">
            <div className="mb-4">
              <GeniusAvatar variant="genius" size="lg" state="greeting" showSparkle />
            </div>
            <h3 className="text-[16px] font-semibold mb-1" style={{ color: "#0F1729" }}>
              Hola, {firstName}.
            </h3>
            <p className="text-[13px] text-neutral-500 mb-6 text-center max-w-[260px]">
              ¿En qué puedo ayudarte? Soy tu asistente de propiedad intelectual.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full max-w-[320px]">
              {EMPTY_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => handleTemplate(s.text)}
                  className="flex items-center gap-2 p-2.5 rounded-lg border border-neutral-200 hover:border-[#B8860B] hover:bg-amber-50/50 transition-all text-left"
                >
                  <span className="text-[16px]">{s.icon}</span>
                  <span className="text-[12px] font-medium text-neutral-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.map((msg) => (
          <GeniusChatBubble
            key={msg.id}
            message={msg}
            onFeedback={handleFeedback}
          />
        ))}

        {/* Streaming / loading indicator */}
        {chatLoading && (
          <div className="flex gap-2 mb-4">
            <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#0F1729] to-[#1E293B] flex items-center justify-center mt-0.5">
              <Sparkles className="w-3 h-3 text-[#B8860B]" />
            </div>
            <div className="flex-1">
              <span className="text-[13px] font-medium" style={{ color: "#B8860B" }}>
                ✦ GENIUS
              </span>
              <div className="bg-white rounded-lg p-3 mt-1" style={{ borderLeft: "2px dashed rgba(59,130,246,0.3)" }}>
                <p className="text-[13px] text-neutral-500 mb-2">
                  ✦ GENIUS está analizando...
                </p>
                <div className="flex gap-1.5">
                  <span className="genius-dot w-2 h-2 rounded-full bg-[#B8860B]" />
                  <span className="genius-dot w-2 h-2 rounded-full bg-[#B8860B]" />
                  <span className="genius-dot w-2 h-2 rounded-full bg-[#B8860B]" />
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* ── INPUT AREA ────────────────────────────────── */}
      <div className="flex-shrink-0 border-t border-[#E7E5E4] bg-white">
        {/* Template buttons */}
        <div className="flex gap-1.5 px-4 pt-2 pb-1.5 overflow-x-auto">
          {TEMPLATES.map((t, i) => (
            <button
              key={i}
              onClick={() => handleTemplate(t.text)}
              className="text-[12px] font-medium px-2.5 py-1 rounded-md bg-neutral-50 border border-neutral-200 text-neutral-600 hover:border-[#B8860B] hover:text-[#B8860B] transition-colors whitespace-nowrap"
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Input row */}
        <div className="flex items-end gap-2 px-4 pb-3">
          <button
            className="p-2 rounded text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 transition-colors flex-shrink-0"
            title="Adjuntar archivo"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribe aquí o usa una plantilla..."
            rows={1}
            className="flex-1 resize-none text-[14px] leading-relaxed border border-neutral-200 rounded-lg px-3 py-2 focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition-colors"
            style={{
              minHeight: 40,
              maxHeight: 120,
              color: "#1C1917",
            }}
          />

          <button
            onClick={handleSend}
            disabled={!input.trim() || chatLoading}
            className={`p-2 rounded-lg flex-shrink-0 transition-colors ${
              input.trim() && !chatLoading
                ? "bg-[#0F1729] text-white hover:bg-[#1E293B]"
                : "bg-neutral-200 text-neutral-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>

        {/* Model cost info */}
        <div className="px-4 pb-2">
          <span className="text-[10px] text-neutral-400" style={{ fontFamily: "'Geist Mono', monospace" }}>
            ✦ Claude Sonnet · ~€0.02/consulta
          </span>
        </div>
      </div>
    </div>
  );
}
