import React, { useState, useRef, useEffect } from 'react';
import { Sparkles, Send, Trash2, AlertTriangle, Lock, Gauge } from 'lucide-react';
import { useBriefingChat } from '@/hooks/useBriefingChat';

const SUGGESTED_PROMPTS = [
  { icon: '📊', text: 'Resumen de la semana' },
  { icon: '🔴', text: 'Alertas sin resolver' },
  { icon: '📅', text: 'Plazos más urgentes' },
  { icon: '💰', text: 'Estado de facturas' },
];

/* Minimal markdown: bold only */
function MarkdownText({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        if (line.trim() === '') return <div key={i} className="h-2" />;
        const isBullet = line.startsWith('- ') || line.startsWith('· ') || line.startsWith('• ');
        const text = isBullet ? line.slice(2) : line;
        const html = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        return (
          <div key={i} className={`text-sm leading-relaxed ${isBullet ? 'flex gap-1.5' : ''}`}>
            {isBullet && <span className="text-muted-foreground shrink-0">·</span>}
            <span dangerouslySetInnerHTML={{ __html: html }} />
          </div>
        );
      })}
    </div>
  );
}

interface BriefingChatTabProps {
  organizationId: string;
}

export function BriefingChatTab({ organizationId }: BriefingChatTabProps) {
  const { messages, isLoading, error, sendMessage, clearChat } =
    useBriefingChat(organizationId);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    if (!textareaRef.current) return;
    textareaRef.current.style.height = 'auto';
    textareaRef.current.style.height =
      Math.min(textareaRef.current.scrollHeight, 120) + 'px';
  }, [input]);

  function handleSend() {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  /* ── Blocking error states ── */
  if (error === 'genius_not_active') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-xs space-y-3">
          <Lock className="w-10 h-10 mx-auto text-muted-foreground" />
          <p className="font-semibold text-foreground">IP-GENIUS no está activo</p>
          <p className="text-sm text-muted-foreground">
            Contacta con el administrador para activarlo en Configuración → IP-GENIUS.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'disclaimer_required') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-xs space-y-3">
          <AlertTriangle className="w-10 h-10 mx-auto text-amber-500" />
          <p className="font-semibold text-foreground">Aceptación requerida</p>
          <p className="text-sm text-muted-foreground">
            Ve a Configuración → IP-GENIUS para aceptar los términos de uso del asistente.
          </p>
        </div>
      </div>
    );
  }

  if (error === 'limit_reached') {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center max-w-xs space-y-3">
          <Gauge className="w-10 h-10 mx-auto text-red-500" />
          <p className="font-semibold text-foreground">Límite mensual alcanzado</p>
          <p className="text-sm text-muted-foreground">
            El contador se reinicia el 1 de cada mes.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col"
      style={{
        height: 'calc(100vh - 200px)',
        minHeight: 420,
        fontFamily: "'Plus Jakarta Sans', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div
            className="flex items-center justify-center rounded-lg"
            style={{
              width: 36,
              height: 36,
              background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">IP-GENIUS</p>
            <p className="text-xs text-muted-foreground">Consulta tu histórico de briefings</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
            Últimos 7 días
          </span>
          <button
            onClick={clearChat}
            className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {/* Suggested prompts */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-col items-center justify-center py-10 space-y-5">
            <p className="text-sm text-muted-foreground font-medium">
              ¿En qué puedo ayudarte hoy?
            </p>
            <div className="grid grid-cols-2 gap-2 max-w-sm w-full">
              {SUGGESTED_PROMPTS.map(({ icon, text }) => (
                <button
                  key={text}
                  onClick={() => sendMessage(text)}
                  className="flex items-center gap-2 p-3 bg-background border border-border rounded-xl text-sm text-muted-foreground hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                >
                  <span>{icon}</span>
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message bubbles */}
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.role === 'assistant' && (
              <div
                className="shrink-0 flex items-center justify-center rounded-lg mt-0.5"
                style={{
                  width: 28,
                  height: 28,
                  background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
                }}
              >
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
            )}
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted/60 text-foreground'
              }`}
            >
              {msg.role === 'assistant' ? (
                <MarkdownText content={msg.content} />
              ) : (
                <p className="text-sm leading-relaxed">{msg.content}</p>
              )}
              <p
                className={`text-[10px] mt-1.5 ${
                  msg.role === 'user' ? 'text-primary-foreground/60' : 'text-muted-foreground'
                }`}
              >
                {msg.timestamp.toLocaleTimeString('es-ES', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </p>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex gap-2.5">
            <div
              className="shrink-0 flex items-center justify-center rounded-lg"
              style={{
                width: 28,
                height: 28,
                background: 'linear-gradient(135deg, #3B82F6, #8B5CF6)',
              }}
            >
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="bg-muted/60 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-1.5">
                {[0, 1, 2].map((j) => (
                  <div
                    key={j}
                    className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce"
                    style={{ animationDelay: `${j * 150}ms` }}
                  />
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-1">IP-GENIUS está analizando...</p>
            </div>
          </div>
        )}

        {/* Generic error (non-blocking) */}
        {error === 'generic' && (
          <div className="text-center py-2">
            <p className="text-xs text-destructive">
              No se pudo conectar con IP-GENIUS. Inténtalo de nuevo.
            </p>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 border-t border-border bg-background">
        <div className="flex items-end gap-2">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Pregunta sobre tu histórico de PI..."
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none rounded-xl border border-border text-sm px-3 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent bg-muted/30 min-h-[40px] max-h-[120px] transition-all disabled:opacity-50"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2.5 bg-primary hover:bg-primary/90 disabled:bg-muted disabled:cursor-not-allowed text-primary-foreground rounded-xl transition-colors shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground mt-1.5 pl-1">
          Enter para enviar · Shift+Enter para nueva línea
        </p>
      </div>
    </div>
  );
}
