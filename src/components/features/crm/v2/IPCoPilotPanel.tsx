/**
 * IP-CoPilot Panel — AI suggestions widget for account detail
 */

import { useState, useEffect } from "react";
import {
  Bot, RefreshCw, X, ChevronRight, AlertTriangle,
  Lightbulb, TrendingUp, FileEdit, Clock, Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { cn } from "@/lib/utils";
import { useIPCoPilot, type CoPilotSuggestion } from "@/hooks/crm/v2/copilot";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

interface IPCoPilotPanelProps {
  accountId: string;
  accountName?: string;
}

const TYPE_CONFIG: Record<string, { icon: typeof AlertTriangle; label: string; color: string; badgeBg: string }> = {
  urgent: { icon: AlertTriangle, label: "URGENTE", color: "text-red-600", badgeBg: "bg-red-100 text-red-700 border-red-200" },
  opportunity: { icon: TrendingUp, label: "OPORTUNIDAD", color: "text-amber-600", badgeBg: "bg-amber-100 text-amber-700 border-amber-200" },
  insight: { icon: Lightbulb, label: "INSIGHT", color: "text-emerald-600", badgeBg: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  draft_text: { icon: FileEdit, label: "BORRADOR", color: "text-blue-600", badgeBg: "bg-blue-100 text-blue-700 border-blue-200" },
};

const PRIORITY_ORDER: Record<string, number> = { high: 0, medium: 1, low: 2 };

export function IPCoPilotPanel({ accountId, accountName }: IPCoPilotPanelProps) {
  const {
    suggestions,
    isLoading,
    isGenerating,
    lastUpdated,
    generate,
    dismiss,
    markActioned,
  } = useIPCoPilot("account", accountId);

  const [expandedDraft, setExpandedDraft] = useState<string | null>(null);

  // Auto-generate on mount if no suggestions
  useEffect(() => {
    if (!isLoading && suggestions.length === 0 && !isGenerating) {
      generate(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading]);

  const sorted = [...suggestions].sort((a, b) => {
    const typeOrder: Record<string, number> = { urgent: 0, opportunity: 1, insight: 2, draft_text: 3 };
    const td = (typeOrder[a.suggestion_type] ?? 4) - (typeOrder[b.suggestion_type] ?? 4);
    if (td !== 0) return td;
    return (PRIORITY_ORDER[a.priority] ?? 2) - (PRIORITY_ORDER[b.priority] ?? 2);
  });

  return (
    <Card className="border border-slate-200 rounded-xl bg-white">
      {/* Header */}
      <div
        className="rounded-t-xl px-4 py-3 flex items-center justify-between"
        style={{ background: "linear-gradient(135deg, #0F172A, #1E40AF)" }}
      >
        <div className="flex items-center gap-2 text-white">
          <Bot className="w-5 h-5" />
          <div>
            <h3 className="text-sm font-semibold">IP-CoPilot</h3>
            <p className="text-[11px] text-white/70 truncate max-w-[200px]">
              {accountName ? `Análisis de ${accountName}` : "Análisis de cuenta"}
            </p>
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 text-white/80 hover:text-white hover:bg-white/10"
          onClick={() => generate(true)}
          disabled={isGenerating}
        >
          <RefreshCw className={cn("w-4 h-4", isGenerating && "animate-spin")} />
        </Button>
      </div>

      <CardContent className="p-3 space-y-2">
        {/* Loading */}
        {(isLoading || isGenerating) && suggestions.length === 0 && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            ))}
            <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3" /> Analizando portfolio y actividad…
            </p>
          </div>
        )}

        {/* Empty state */}
        {!isLoading && !isGenerating && sorted.length === 0 && (
          <div className="py-6 text-center">
            <Bot className="w-8 h-8 mx-auto text-muted-foreground/40 mb-2" />
            <p className="text-xs text-muted-foreground">
              Sin sugerencias disponibles
            </p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => generate(true)}
            >
              <Sparkles className="w-3 h-3 mr-1" /> Generar análisis
            </Button>
          </div>
        )}

        {/* Suggestions list */}
        {sorted.map((s) => (
          <SuggestionCard
            key={s.id}
            suggestion={s}
            isExpanded={expandedDraft === s.id}
            onToggleExpand={() =>
              setExpandedDraft(expandedDraft === s.id ? null : s.id)
            }
            onDismiss={() => dismiss(s.id)}
            onAction={() => markActioned(s.id)}
          />
        ))}

        {/* Footer */}
        {lastUpdated > 0 && sorted.length > 0 && (
          <div className="pt-1 flex items-center justify-between text-[10px] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              Generado{" "}
              {formatDistanceToNow(new Date(lastUpdated), { addSuffix: true, locale: es })}
            </span>
            <Button
              variant="ghost"
              size="sm"
              className="h-5 px-2 text-[10px]"
              onClick={() => generate(true)}
              disabled={isGenerating}
            >
              <RefreshCw className={cn("w-3 h-3 mr-1", isGenerating && "animate-spin")} />
              Regenerar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function SuggestionCard({
  suggestion: s,
  isExpanded,
  onToggleExpand,
  onDismiss,
  onAction,
}: {
  suggestion: CoPilotSuggestion;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onDismiss: () => void;
  onAction: () => void;
}) {
  const config = TYPE_CONFIG[s.suggestion_type] ?? TYPE_CONFIG.insight;
  const Icon = config.icon;

  return (
    <div className="border border-slate-200 rounded-lg p-2.5 space-y-1.5 hover:border-slate-300 transition-colors">
      {/* Type badge + priority */}
      <div className="flex items-center justify-between">
        <Badge variant="outline" className={cn("text-[10px] px-1.5 py-0 h-5", config.badgeBg)}>
          <Icon className="w-3 h-3 mr-1" />
          {config.label}
        </Badge>
        <div className="flex items-center gap-1">
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5">
            {s.priority === "high" ? "alta" : s.priority === "medium" ? "media" : "baja"}
          </Badge>
          <Button variant="ghost" size="icon" className="h-5 w-5" onClick={onDismiss}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Title + body */}
      <p className="text-xs font-medium leading-snug">{s.title}</p>
      <p className="text-[11px] text-muted-foreground leading-relaxed">{s.body}</p>

      {/* CTA */}
      {s.action_label && s.suggestion_type !== "draft_text" && (
        <Button
          variant="outline"
          size="sm"
          className="h-6 text-[11px] w-full justify-between"
          onClick={onAction}
        >
          {s.action_label}
          <ChevronRight className="w-3 h-3" />
        </Button>
      )}

      {/* Draft expand */}
      {s.suggestion_type === "draft_text" && (
        <Collapsible open={isExpanded} onOpenChange={onToggleExpand}>
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 text-[11px] w-full">
              <FileEdit className="w-3 h-3 mr-1" />
              {isExpanded ? "Ocultar borrador" : "Ver borrador"}
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="mt-2">
            <div className="bg-muted/50 rounded-md p-2 text-xs whitespace-pre-wrap border">
              {(s.action_data as any)?.draft_text || s.body}
            </div>
            <div className="flex gap-1 mt-1.5">
              <Button
                variant="outline"
                size="sm"
                className="h-6 text-[10px] flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(
                    (s.action_data as any)?.draft_text || s.body
                  );
                }}
              >
                Copiar texto
              </Button>
              <Button
                variant="default"
                size="sm"
                className="h-6 text-[10px] flex-1"
                onClick={onAction}
              >
                Usar en email
              </Button>
            </div>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
