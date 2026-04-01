// ============================================================
// GENIUS Chat — Premium Message Bubble
// ============================================================

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown, Copy, Mail, ChevronDown, ChevronRight } from "lucide-react";
import { GeniusAvatar } from "./GeniusAvatar";
import type { AIMessage } from "@/types/genius";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toast } from "sonner";

interface Props {
  message: AIMessage;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  onActionClick?: (action: string, data?: Record<string, unknown>) => void;
}

function classifyOutput(content: string): { label: string; bg: string; text: string; border: string } {
  const lower = content.toLowerCase();
  if (
    lower.includes("recomiendo") || lower.includes("sugiero") ||
    lower.includes("aconsejo") || lower.includes("debería")
  ) {
    return { label: "⚠️ CONSEJO", bg: "bg-red-50", text: "text-red-700", border: "border-red-200" };
  }
  if (
    lower.includes("análisis") || lower.includes("analizado") ||
    lower.includes("evaluación") || lower.includes("riesgo")
  ) {
    return { label: "⚖️ ANÁLISIS", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200" };
  }
  return { label: "ℹ️ INFO", bg: "bg-blue-50", text: "text-blue-700", border: "border-blue-200" };
}

function getConfidence(msg: AIMessage): number | null {
  if (msg.tokens_output && msg.tokens_output > 0) return 75;
  return null;
}

function SourcesBlock({ sources }: { sources: AIMessage["sources"] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2.5 pt-2 border-t border-border/30">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[11px] text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Fuentes ({sources.length})
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
              <span className="text-[10px]">📄</span>
              <span className="truncate flex-1">{s.title}</span>
              {s.relevance && (
                <span className="text-[10px] opacity-60">{Math.round(s.relevance * 100)}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function formatTime(dateStr?: string) {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleTimeString("es", { hour: "2-digit", minute: "2-digit" });
  } catch { return ""; }
}

export function GeniusChatBubble({ message, onFeedback, onActionClick }: Props) {
  const [hovering, setHovering] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(message.content).then(() => {
      toast.success("Copiado al portapapeles");
    });
  }, [message.content]);

  if (isSystem) return null;

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div className="max-w-[80%]">
          <div
            className="px-4 py-2.5 rounded-2xl rounded-br-sm text-[14px] leading-relaxed text-white"
            style={{ background: "#0F1729" }}
          >
            {message.content}
          </div>
          <div className="text-[11px] text-muted-foreground/50 mt-1 text-right">
            {formatTime(message.created_at)}
          </div>
        </div>
      </div>
    );
  }

  // Assistant message
  const classification = classifyOutput(message.content);
  const confidence = getConfidence(message);

  return (
    <div
      className="flex gap-2.5 mb-4"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 mt-0.5">
        <GeniusAvatar variant="genius" size="xs" state="idle" showSparkle={false} />
      </div>

      <div className="flex-1 min-w-0 max-w-[85%]">
        {/* Bubble */}
        <div className="bg-white border border-border/50 rounded-2xl rounded-bl-sm p-3.5">
          {/* Classification badge */}
          <div className="mb-2">
            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${classification.bg} ${classification.text} border ${classification.border}`}>
              {classification.label}
            </span>
          </div>

          {/* Markdown content */}
          <div className="text-[14px] leading-relaxed text-foreground genius-markdown">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Sources */}
          <SourcesBlock sources={message.sources} />

          {/* Confidence bar */}
          {confidence !== null && (
            <div className="mt-2.5 pt-2 border-t border-border/30">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-[3px] rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${confidence}%`,
                      background: confidence > 80 ? "#059669" : confidence > 50 ? "#D97706" : "#DC2626",
                    }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground">{confidence}%</span>
              </div>
            </div>
          )}
        </div>

        {/* Actions row */}
        <div className={`flex items-center gap-0.5 mt-1 transition-opacity duration-200 ${hovering ? "opacity-100" : "opacity-0"}`}>
          <button
            onClick={handleCopy}
            className="p-1 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
            title="Copiar"
          >
            <Copy className="w-3.5 h-3.5" />
          </button>
          {onFeedback && (
            <>
              <button
                onClick={() => onFeedback(message.id, "positive")}
                className={`p-1 rounded hover:bg-green-50 transition-colors ${
                  message.feedback === "positive" ? "text-green-600" : "text-muted-foreground"
                }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => onFeedback(message.id, "negative")}
                className={`p-1 rounded hover:bg-red-50 transition-colors ${
                  message.feedback === "negative" ? "text-red-600" : "text-muted-foreground"
                }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          <span className="text-[10px] text-muted-foreground/40 ml-auto">
            {formatTime(message.created_at)}
          </span>
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-muted-foreground/50 mt-0.5">
          ✦ Generado por IA — revisión profesional requerida
        </p>
      </div>
    </div>
  );
}
