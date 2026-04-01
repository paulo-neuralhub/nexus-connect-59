// ============================================================
// GENIUS Ambient — InsightCard
// ============================================================

import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import type { CopilotSuggestion } from "@/hooks/copilot/useGeniusAmbient";

interface Props {
  suggestion: CopilotSuggestion;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
  onShown: (id: string) => void;
}

function getPriorityMeta(type: string) {
  switch (type) {
    case "urgent":
    case "deadline":
      return { icon: "⚠️", label: "URGENTE", bg: "bg-red-50", text: "text-red-700" };
    case "suggestion":
    case "opportunity":
      return { icon: "💡", label: "SUGERENCIA", bg: "bg-amber-50", text: "text-amber-700" };
    case "analysis":
      return { icon: "📊", label: "ANÁLISIS", bg: "bg-blue-50", text: "text-blue-700" };
    default:
      return { icon: "ℹ️", label: "INFORMACIÓN", bg: "bg-slate-50", text: "text-slate-600" };
  }
}

function getClassificationBadge(type: string) {
  if (type === "urgent" || type === "deadline")
    return { label: "⚠️ CONSEJO", bg: "bg-red-50", text: "text-red-700" };
  if (type === "analysis" || type === "suggestion")
    return { label: "⚖️ ANÁLISIS", bg: "bg-amber-50", text: "text-amber-700" };
  return { label: "ℹ️ INFORMACIÓN", bg: "bg-blue-50", text: "text-blue-700" };
}

function relativeTime(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "ahora";
  if (mins < 60) return `hace ${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

function confidenceColor(score: number) {
  if (score >= 80) return "#059669";
  if (score >= 50) return "#D97706";
  return "#DC2626";
}

export function GeniusInsightCard({ suggestion, onDismiss, onAction, onShown }: Props) {
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const priority = getPriorityMeta(suggestion.suggestion_type);
  const classification = getClassificationBadge(suggestion.suggestion_type);

  // Mark as shown via IntersectionObserver
  useEffect(() => {
    if (suggestion.shown_at) return;
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onShown(suggestion.id);
          obs.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [suggestion.id, suggestion.shown_at, onShown]);

  const handlePrimaryAction = () => {
    onAction(suggestion.id);
    if (suggestion.action_primary_url) {
      if (suggestion.action_primary_url.startsWith("/")) {
        navigate(suggestion.action_primary_url);
      } else {
        window.open(suggestion.action_primary_url, "_blank");
      }
    }
  };

  const handleSecondaryAction = () => {
    if (suggestion.action_secondary_url) {
      if (suggestion.action_secondary_url.startsWith("/")) {
        navigate(suggestion.action_secondary_url);
      } else {
        window.open(suggestion.action_secondary_url, "_blank");
      }
    }
  };

  return (
    <div
      ref={ref}
      className="bg-white border border-[#E7E5E4] rounded-lg p-4 mb-2 transition-all duration-200 hover:shadow-sm animate-fade-in"
    >
      {/* Top row */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center justify-center w-6 h-6 rounded text-xs ${priority.bg}`}
          >
            {priority.icon}
          </span>
          <span
            className={`text-[11px] font-semibold uppercase tracking-wider ${priority.text}`}
            style={{ letterSpacing: "0.05em" }}
          >
            {priority.label}
          </span>
        </div>
        <span className="text-[12px] text-neutral-500">
          {relativeTime(suggestion.created_at)}
        </span>
      </div>

      {/* Classification badge */}
      <div className="mb-2">
        <span
          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${classification.bg} ${classification.text}`}
        >
          {classification.label}
        </span>
      </div>

      {/* Title + body */}
      <h4 className="text-[14px] font-semibold text-[#1C1917] mb-1 leading-tight">
        {suggestion.title}
      </h4>
      {suggestion.body && (
        <p className="text-[14px] text-[#1C1917] leading-snug line-clamp-3 mb-2">
          {suggestion.body}
        </p>
      )}

      {/* Confidence bar */}
      {suggestion.confidence_score > 0 && (
        <div className="mb-3">
          <Progress
            value={suggestion.confidence_score}
            className="h-1"
            stateColor={confidenceColor(suggestion.confidence_score)}
          />
          <span className="text-[11px] text-neutral-500 mt-0.5 block">
            {Math.round(suggestion.confidence_score)}% confianza
          </span>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        {suggestion.action_primary_label && (
          <Button
            size="sm"
            className="h-7 text-[12px] px-3"
            onClick={handlePrimaryAction}
          >
            {suggestion.action_primary_label}
          </Button>
        )}
        {suggestion.action_secondary_label && (
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[12px] px-3"
            onClick={handleSecondaryAction}
          >
            {suggestion.action_secondary_label}
          </Button>
        )}
        <div className="flex-1" />
        <button
          onClick={() => onDismiss(suggestion.id)}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-400 hover:text-neutral-600 transition-colors"
          aria-label="Descartar insight"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* AI disclaimer */}
      <p className="text-[10px] text-neutral-400 mt-2">
        🤖 Generado por IA
      </p>
    </div>
  );
}
