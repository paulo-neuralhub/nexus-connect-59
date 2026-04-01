// ============================================================
// GENIUS Chat — Message Bubble
// ============================================================

import { useState } from "react";
import { Sparkles, ThumbsUp, ThumbsDown, ChevronDown, ChevronRight } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import type { AIMessage } from "@/types/genius";

interface Props {
  message: AIMessage;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
  onActionClick?: (action: string, data?: Record<string, unknown>) => void;
}

function classifyOutput(content: string): { label: string; bg: string; text: string } {
  const lower = content.toLowerCase();
  if (
    lower.includes("recomiendo") || lower.includes("sugiero") ||
    lower.includes("aconsejo") || lower.includes("debería")
  ) {
    return { label: "⚠️ CONSEJO", bg: "bg-red-50", text: "text-red-700" };
  }
  if (
    lower.includes("análisis") || lower.includes("analizado") ||
    lower.includes("evaluación") || lower.includes("riesgo")
  ) {
    return { label: "⚖️ ANÁLISIS", bg: "bg-amber-50", text: "text-amber-700" };
  }
  return { label: "ℹ️ INFORMACIÓN", bg: "bg-blue-50", text: "text-blue-700" };
}

function SourcesBlock({ sources }: { sources: AIMessage["sources"] }) {
  const [open, setOpen] = useState(false);
  if (!sources || sources.length === 0) return null;

  return (
    <div className="mt-2 border-t border-neutral-100 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 text-[12px] text-neutral-500 hover:text-neutral-700 transition-colors"
      >
        {open ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
        Fuentes ({sources.length})
      </button>
      {open && (
        <div className="mt-1.5 space-y-1">
          {sources.map((s, i) => (
            <div key={i} className="flex items-center gap-2 text-[12px] text-neutral-500">
              <span className="text-[10px]">📄</span>
              <span className="truncate flex-1">{s.title}</span>
              {s.relevance && (
                <span className="text-[10px] text-neutral-400">{Math.round(s.relevance * 100)}%</span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function GeniusChatBubble({ message, onFeedback, onActionClick }: Props) {
  const [hovering, setHovering] = useState(false);
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  if (isSystem) return null;

  if (isUser) {
    return (
      <div className="flex justify-end mb-3">
        <div
          className="max-w-[85%] px-4 py-3 rounded-lg rounded-br-sm text-white text-[14px] leading-relaxed"
          style={{ background: "#0F1729" }}
        >
          {message.content}
        </div>
      </div>
    );
  }

  // Assistant message
  const classification = classifyOutput(message.content);
  const hasConfidence = message.tokens_output && message.tokens_output > 0;

  return (
    <div
      className="flex gap-2 mb-4"
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
    >
      {/* Avatar */}
      <div className="flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-br from-[#0F1729] to-[#1E293B] flex items-center justify-center mt-0.5">
        <Sparkles className="w-3 h-3 text-[#B8860B]" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Name + classification */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[13px] font-medium" style={{ color: "#B8860B" }}>
            ✦ GENIUS
          </span>
          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${classification.bg} ${classification.text}`}>
            {classification.label}
          </span>
        </div>

        {/* Content */}
        <div
          className="bg-white rounded-lg p-3 text-[14px] leading-relaxed"
          style={{
            color: "#1C1917",
            borderLeft: "2px dashed rgba(59,130,246,0.3)",
          }}
        >
          <div className="whitespace-pre-wrap">{message.content}</div>

          {/* Sources */}
          <SourcesBlock sources={message.sources} />

          {/* Actions */}
          {message.actions_taken && message.actions_taken.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3 pt-2 border-t border-neutral-100">
              {message.actions_taken.map((action, i) => (
                <Button
                  key={i}
                  variant="ghost"
                  size="sm"
                  className="h-7 text-[12px] text-neutral-600 hover:bg-blue-50"
                  onClick={() => onActionClick?.(action.type, action.data)}
                >
                  ✦ {action.title || action.type}
                </Button>
              ))}
            </div>
          )}

          {/* Confidence */}
          {hasConfidence && (
            <div className="mt-2">
              <Progress value={75} className="h-1" stateColor="#059669" />
              <span className="text-[11px] text-neutral-400 mt-0.5 block">75% confianza</span>
            </div>
          )}
        </div>

        {/* Disclaimer */}
        <p className="text-[10px] text-neutral-400 mt-1">
          🤖 Generado por IA — revisión profesional requerida
        </p>

        {/* Feedback */}
        {hovering && onFeedback && (
          <div className="flex gap-1 mt-1 animate-fade-in">
            <button
              onClick={() => onFeedback(message.id, "positive")}
              className={`p-1 rounded hover:bg-green-50 transition-colors ${
                message.feedback === "positive" ? "text-green-600" : "text-neutral-400"
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => onFeedback(message.id, "negative")}
              className={`p-1 rounded hover:bg-red-50 transition-colors ${
                message.feedback === "negative" ? "text-red-600" : "text-neutral-400"
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Model info */}
        {message.model_used && (
          <span className="text-[10px] text-neutral-400 mt-0.5 block" style={{ fontFamily: "monospace" }}>
            {message.model_used} · {(message.tokens_input || 0) + (message.tokens_output || 0)} tokens
          </span>
        )}
      </div>
    </div>
  );
}
