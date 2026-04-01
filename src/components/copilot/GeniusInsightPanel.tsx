// ============================================================
// GENIUS Ambient — InsightPanel (flyout)
// ============================================================

import { useState, useCallback, useMemo } from "react";
import { X, Sparkles, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeniusSidebar } from "@/contexts/genius-sidebar-context";
import { GeniusInsightCard } from "./GeniusInsightCard";
import type { CopilotSuggestion } from "@/hooks/copilot/useGeniusAmbient";

interface Props {
  suggestions: CopilotSuggestion[];
  isLoading: boolean;
  suggestionsEnabled: boolean;
  onClose: () => void;
  onDismiss: (id: string) => void;
  onAction: (id: string) => void;
  onShown: (id: string) => void;
}

const FILTERS = [
  { key: "all", label: "Todos" },
  { key: "urgent", label: "Urgente" },
  { key: "suggestion", label: "Sugerencia" },
  { key: "analysis", label: "Análisis" },
] as const;

export function GeniusInsightPanel({
  suggestions,
  isLoading,
  suggestionsEnabled,
  onClose,
  onDismiss,
  onAction,
  onShown,
}: Props) {
  const [filter, setFilter] = useState<string>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return suggestions;
    return suggestions.filter((s) => s.suggestion_type === filter);
  }, [suggestions, filter]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose]
  );

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="GENIUS Insights"
      onKeyDown={handleKeyDown}
      className="w-[380px] max-h-[70vh] flex flex-col bg-white border border-[#E7E5E4] rounded-xl shadow-lg overflow-hidden animate-fade-in md:w-[380px] max-md:w-full max-md:max-h-[80vh] max-md:rounded-t-xl max-md:rounded-b-none"
      style={{
        boxShadow: "0 8px 30px rgba(0,0,0,0.12), 0 2px 8px rgba(0,0,0,0.06)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4]">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B8860B]" />
          <span
            className="text-[16px] font-semibold"
            style={{ color: "#0F1729", fontFamily: "Inter, sans-serif" }}
          >
            GENIUS Insights
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-neutral-100 text-neutral-500 transition-colors"
          aria-label="Cerrar panel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Filter chips */}
      <div className="flex gap-1.5 px-4 py-2 border-b border-[#E7E5E4] overflow-x-auto">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`text-[12px] font-medium px-3 py-1 rounded-full whitespace-nowrap transition-colors ${
              filter === f.key
                ? "bg-[#0F1729] text-white"
                : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        {!suggestionsEnabled ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-sm text-neutral-500">
              Sugerencias desactivadas.
            </p>
            <p className="text-xs text-neutral-400 mt-1">
              Activa en Configuración &gt; IA.
            </p>
          </div>
        ) : isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-[120px] w-full rounded-lg" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center mb-3">
              <Sparkles className="w-8 h-8 text-[#B8860B]" />
            </div>
            <h3
              className="text-[16px] font-semibold mb-1"
              style={{ color: "#0F1729" }}
            >
              Todo en orden ✦
            </h3>
            <p className="text-[13px] text-neutral-500 max-w-[240px]">
              No hay insights pendientes. GENIUS está vigilando tu portfolio.
            </p>
          </div>
        ) : (
          filtered.map((s) => (
            <GeniusInsightCard
              key={s.id}
              suggestion={s}
              onDismiss={onDismiss}
              onAction={onAction}
              onShown={onShown}
            />
          ))
        )}
      </div>
    </div>
  );
}
