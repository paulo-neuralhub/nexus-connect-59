// ============================================================
// Trust Architecture — Audit Trail Inline
// ============================================================

import { useQuery } from "@tanstack/react-query";
import { fromTable } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { Sparkles, User, CheckCircle, ChevronDown, ChevronRight } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";

interface AuditEvent {
  id: string;
  decision_type: string;
  title?: string;
  context_snapshot: Record<string, unknown> | null;
  matter_id: string | null;
  similarity_score: number | null;
  was_suggested_by_copilot: boolean;
  copilot_confidence_at_time: number | null;
  outcome: string | null;
  created_at: string;
  created_by: string | null;
}

interface Props {
  matterId: string;
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

function EventNode({ event }: { event: AuditEvent }) {
  const [expanded, setExpanded] = useState(false);

  const icon = event.was_suggested_by_copilot ? (
    <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
  ) : event.outcome === "approved" ? (
    <CheckCircle className="w-3.5 h-3.5 text-green-600" />
  ) : (
    <User className="w-3.5 h-3.5 text-neutral-500" />
  );

  const label = event.was_suggested_by_copilot
    ? `✦ GENIUS sugirió: ${event.title || event.decision_type}`
    : event.outcome === "approved"
    ? `✅ Aprobado`
    : event.outcome === "rejected"
    ? `❌ Rechazado`
    : `👤 Acción: ${event.decision_type}`;

  return (
    <div className="relative pl-6 pb-4 last:pb-0">
      {/* Vertical line */}
      <div className="absolute left-[7px] top-5 bottom-0 w-px bg-neutral-200" />

      {/* Dot */}
      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-white border-2 border-neutral-300 flex items-center justify-center">
        {icon}
      </div>

      <div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="flex items-center gap-1 text-[13px] font-medium text-[#0F1729] hover:text-[#B8860B] transition-colors"
          >
            {expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {label}
          </button>
          <span className="text-[11px] text-neutral-400">{relativeTime(event.created_at)}</span>
        </div>

        {event.copilot_confidence_at_time != null && (
          <span className="text-[11px] text-neutral-400 block mt-0.5">
            Confianza: {Math.round(event.copilot_confidence_at_time)}%
          </span>
        )}

        {expanded && event.context_snapshot && (
          <div className="mt-2 p-2 rounded bg-neutral-50 border border-neutral-200 text-[11px] text-neutral-600 overflow-x-auto animate-fade-in">
            <pre style={{ fontFamily: "'Geist Mono', monospace" }}>
              {JSON.stringify(event.context_snapshot, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}

export function AuditTrailInline({ matterId }: Props) {
  const { organizationId } = useOrganization();

  const { data: events, isLoading } = useQuery({
    queryKey: ["copilot-audit-trail", matterId],
    queryFn: async (): Promise<AuditEvent[]> => {
      if (!organizationId || !matterId) return [];
      const { data } = await fromTable("copilot_decision_log")
        .select("*")
        .eq("organization_id", organizationId)
        .eq("matter_id", matterId)
        .order("created_at", { ascending: false })
        .limit(20);
      return (data ?? []) as AuditEvent[];
    },
    enabled: !!organizationId && !!matterId,
    staleTime: 5 * 60 * 1000,
  });

  if (isLoading) {
    return (
      <div className="space-y-3 p-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="w-4 h-4 rounded-full" />
            <Skeleton className="h-4 w-48" />
          </div>
        ))}
      </div>
    );
  }

  if (!events || events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-8 text-center">
        <Sparkles className="w-6 h-6 text-neutral-300 mb-2" />
        <p className="text-[13px] text-neutral-500">Sin actividad de IA en este expediente</p>
      </div>
    );
  }

  return (
    <div className="p-4">
      <h4 className="text-[13px] font-semibold text-[#0F1729] mb-3 flex items-center gap-1.5">
        <Sparkles className="w-3.5 h-3.5 text-[#B8860B]" />
        Historial IA
      </h4>
      <div className="mt-2">
        {events.map((event) => (
          <EventNode key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}
