// ============================================================
// GENIUS Quick Action — Reusable ✦ sparkle button + response card
// ============================================================

import { useState, useRef, useCallback, useEffect } from "react";
import { Sparkles, X, Copy, Mail, Paperclip, ArrowRight, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/hooks/useOrganization";
import { toast } from "sonner";
import { OutputClassificationBadge, classifyContent } from "./OutputClassificationBadge";
import { FeedbackInline } from "./FeedbackInline";

// ── Types ─────────────────────────────────────────────────
export type QuickActionVariant = "inline" | "card" | "floating";

export interface QuickActionConfig {
  label: string;
  actionType: string;
  variant?: QuickActionVariant;
  matterId?: string;
  entityId?: string;
  entityType?: string;
  contextData?: Record<string, unknown>;
}

interface QuickActionResult {
  title: string;
  body: string;
  classification: "info" | "analysis" | "advice";
  confidence: number;
  sources?: string[];
  tokens?: number;
  cost?: number;
  latency?: number;
  model?: string;
  actions?: { label: string; icon?: string; action: string }[];
}

// ── CSS ───────────────────────────────────────────────────
const CSS_ID = "genius-quick-action-css";
const CSS = `
  @keyframes genius-sparkle-spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  @keyframes genius-card-slide {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .genius-sparkle-loading {
    animation: genius-sparkle-spin 1.2s linear infinite;
  }
  .genius-response-card {
    animation: genius-card-slide 0.2s ease-out;
  }
  @media (prefers-reduced-motion: reduce) {
    .genius-sparkle-loading { animation: none !important; }
    .genius-response-card { animation: none !important; }
  }
`;

function confidenceColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

// ── Response Card ─────────────────────────────────────────
function ResponseCard({
  result,
  onClose,
  actionType,
}: {
  result: QuickActionResult;
  onClose: () => void;
  actionType: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [onClose]);

  const handleCopy = () => {
    navigator.clipboard.writeText(result.body);
    toast.success("Copiado al portapapeles");
  };

  return (
    <div
      ref={ref}
      className="genius-response-card bg-white rounded-lg shadow-md max-w-[480px] w-full"
      style={{ borderLeft: "3px solid #B8860B", padding: 16 }}
      aria-live="polite"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
          <span className="text-[13px] font-medium" style={{ color: "#B8860B" }}>
            GENIUS
          </span>
          <OutputClassificationBadge type={result.classification} />
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Title */}
      {result.title && (
        <h4 className="text-[14px] font-semibold text-[#0F1729] mb-1">{result.title}</h4>
      )}

      {/* Body */}
      <div className="text-[14px] leading-relaxed text-[#1C1917] whitespace-pre-wrap mb-3">
        {result.body}
      </div>

      {/* Confidence */}
      {result.confidence > 0 && (
        <div className="mb-3">
          <Progress
            value={result.confidence}
            className="h-1"
            stateColor={confidenceColor(result.confidence)}
          />
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            {Math.round(result.confidence)}% confianza
          </span>
        </div>
      )}

      {/* Sources */}
      {result.sources && result.sources.length > 0 && (
        <p className="text-[11px] text-neutral-400 mb-3">
          Fuentes: {result.sources.join(", ")}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-1.5 mb-3">
        <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={handleCopy}>
          <Copy className="w-3 h-3 mr-1" /> Copiar
        </Button>
        {actionType === "resumir" && (
          <>
            <Button variant="ghost" size="sm" className="h-7 text-[12px]">
              <Mail className="w-3 h-3 mr-1" /> Enviar por email
            </Button>
            <Button variant="ghost" size="sm" className="h-7 text-[12px]">
              <Paperclip className="w-3 h-3 mr-1" /> Adjuntar al expediente
            </Button>
          </>
        )}
        {(actionType === "evaluar_riesgo" || actionType === "analizar_riesgo") && (
          <Button variant="ghost" size="sm" className="h-7 text-[12px]">
            <ArrowRight className="w-3 h-3 mr-1" /> Ver análisis completo
          </Button>
        )}
        {result.actions?.map((a, i) => (
          <Button key={i} variant="ghost" size="sm" className="h-7 text-[12px]">
            ✦ {a.label}
          </Button>
        ))}
      </div>

      {/* Feedback */}
      <FeedbackInline contextId={actionType} contextType="quick_action" />

      {/* Disclaimer */}
      <p className="text-[10px] text-neutral-400 mt-2">
        🤖 Generado por IA — revisión profesional requerida
      </p>

      {/* Cost footer */}
      {(result.tokens || result.cost != null) && (
        <p
          className="text-[10px] text-neutral-300 mt-1"
          style={{ fontFamily: "'Geist Mono', monospace" }}
        >
          ✦ {result.model || "Sonnet"} · {result.tokens || 0} tokens
          {result.cost != null ? ` · €${result.cost.toFixed(4)}` : ""}
          {result.latency ? ` · ${(result.latency / 1000).toFixed(1)}s` : ""}
        </p>
      )}
    </div>
  );
}

// ── Error Card ────────────────────────────────────────────
function ErrorCard({ onRetry, onClose }: { onRetry: () => void; onClose: () => void }) {
  return (
    <div
      className="genius-response-card bg-white rounded-lg shadow-md max-w-[480px] w-full p-4"
      style={{ borderLeft: "3px solid #DC2626" }}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-[13px] font-medium text-red-600">Error</span>
        <button onClick={onClose} className="p-1 rounded hover:bg-neutral-100 text-neutral-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      <p className="text-[13px] text-neutral-600 mb-3">No se pudo completar la acción.</p>
      <Button variant="ghost" size="sm" className="h-7 text-[12px] text-red-600" onClick={onRetry}>
        <RotateCcw className="w-3 h-3 mr-1" /> Reintentar
      </Button>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────
export function GeniusQuickAction({
  label,
  actionType,
  variant = "inline",
  matterId,
  entityId,
  entityType,
  contextData,
}: QuickActionConfig) {
  const { organizationId } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QuickActionResult | null>(null);
  const [error, setError] = useState(false);

  // Inject CSS
  useEffect(() => {
    if (document.getElementById(CSS_ID)) return;
    const s = document.createElement("style");
    s.id = CSS_ID;
    s.textContent = CSS;
    document.head.appendChild(s);
  }, []);

  const execute = useCallback(async () => {
    if (loading || !organizationId) return;
    setLoading(true);
    setError(false);
    setResult(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("genius-chat-v2", {
        body: {
          conversationId: null,
          message: `[QUICK_ACTION:${actionType}] ${label}`,
          contextMatterId: matterId,
          quickAction: {
            type: actionType,
            entityId,
            entityType,
            ...contextData,
          },
        },
      });

      if (fnError) throw fnError;

      const content = data?.message || data?.content || "";
      const classification = classifyContent(content);

      setResult({
        title: label,
        body: content,
        classification,
        confidence: data?.confidence ?? 75,
        sources: data?.sources?.map((s: any) => s.title) || [],
        tokens: (data?.tokensInput || 0) + (data?.tokensOutput || 0),
        cost: data?.cost,
        latency: data?.responseTimeMs,
        model: data?.model || "Claude Sonnet",
        actions: data?.suggestedActions,
      });
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [loading, organizationId, actionType, label, matterId, entityId, entityType, contextData]);

  const close = useCallback(() => {
    setResult(null);
    setError(false);
  }, []);

  // ── Button styles by variant ──────────────────────────
  const buttonClasses = (() => {
    switch (variant) {
      case "inline":
        return "opacity-0 group-hover:opacity-100 md:opacity-0 max-md:opacity-100 h-7 px-2.5 text-[12px] font-medium rounded-md border border-dashed border-[#B8860B] text-[#B8860B] bg-transparent hover:bg-[rgba(184,134,11,0.08)] hover:border-solid transition-all duration-150";
      case "card":
        return "h-8 px-3.5 text-[12px] font-medium rounded-md border border-[#E7E5E4] bg-[#FAFAF9] text-[#0F1729] hover:shadow-sm hover:border-[#B8860B] transition-all duration-150";
      case "floating":
        return "h-6 px-2 text-[11px] font-medium rounded-full border border-[#B8860B] text-[#B8860B] bg-white/90 backdrop-blur-sm hover:bg-amber-50 transition-all duration-150";
      default:
        return "";
    }
  })();

  return (
    <div className="relative inline-block">
      <button
        onClick={execute}
        disabled={loading}
        className={`inline-flex items-center gap-1 whitespace-nowrap ${buttonClasses}`}
        aria-label={`Acción IA: ${label}`}
      >
        <Sparkles
          className={`w-3 h-3 ${variant === "card" ? "text-[#B8860B]" : ""} ${
            loading ? "genius-sparkle-loading" : ""
          }`}
          style={{ width: 12, height: 12 }}
        />
        {loading ? "Analizando..." : label}
      </button>

      {/* Response / Error */}
      {(result || error) && (
        <div
          className="absolute z-30 mt-2"
          style={{
            left: variant === "inline" ? 0 : "auto",
            right: variant === "inline" ? "auto" : 0,
            minWidth: 320,
          }}
        >
          {error ? (
            <ErrorCard onRetry={execute} onClose={close} />
          ) : result ? (
            <ResponseCard result={result} onClose={close} actionType={actionType} />
          ) : null}
        </div>
      )}
    </div>
  );
}
