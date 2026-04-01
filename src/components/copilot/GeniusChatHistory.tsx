// ============================================================
// GENIUS Chat — History Panel (overlay inside sidebar)
// ============================================================

import { Sparkles, Plus, MessageSquare } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useGeniusConversations } from "@/hooks/use-genius-chat";
import type { AIConversation } from "@/types/genius";

interface Props {
  onSelect: (conversationId: string) => void;
  onNew: () => void;
  onClose: () => void;
  activeConversationId: string | null;
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

export function GeniusChatHistory({ onSelect, onNew, onClose, activeConversationId }: Props) {
  const { data: conversations, isLoading } = useGeniusConversations();

  return (
    <div className="absolute inset-0 bg-white z-10 flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#E7E5E4]">
        <span className="text-[14px] font-semibold" style={{ color: "#0F1729" }}>
          Historial
        </span>
        <div className="flex items-center gap-2">
          <button
            onClick={onNew}
            className="flex items-center gap-1 text-[12px] font-medium text-[#B8860B] hover:bg-amber-50 px-2 py-1 rounded transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Nueva
          </button>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-600 transition-colors text-[12px] px-2 py-1"
          >
            Cerrar
          </button>
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto px-2 py-2">
        {isLoading ? (
          <div className="space-y-2 px-2">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[56px] w-full rounded-lg" />
            ))}
          </div>
        ) : !conversations || conversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <MessageSquare className="w-8 h-8 text-neutral-300 mb-2" />
            <p className="text-[13px] text-neutral-500">Sin conversaciones</p>
          </div>
        ) : (
          conversations.map((conv: AIConversation) => (
            <button
              key={conv.id}
              onClick={() => {
                onSelect(conv.id);
                onClose();
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg mb-1 transition-colors ${
                conv.id === activeConversationId
                  ? "bg-blue-50 border border-blue-200"
                  : "hover:bg-neutral-50"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#0F1729] truncate">
                    {conv.title || "Sin título"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[11px] text-neutral-400">
                      {conv.message_count} msgs
                    </span>
                    {conv.matter && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-600">
                        {conv.matter.reference}
                      </span>
                    )}
                  </div>
                </div>
                <span className="text-[11px] text-neutral-400 whitespace-nowrap">
                  {conv.last_message_at ? relativeTime(conv.last_message_at) : ""}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
