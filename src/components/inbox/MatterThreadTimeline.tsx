// ============================================================
// IP-NEXUS — Matter Thread Timeline (mini-timeline above message)
// ============================================================

import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { InboxMessage } from '@/hooks/use-inbox';

interface MatterThreadTimelineProps {
  messages: InboxMessage[];
  selectedMessageId: string | null;
  matterReference?: string;
  matterTitle?: string;
  onSelectMessage: (id: string) => void;
}

export function MatterThreadTimeline({
  messages, selectedMessageId, matterReference, matterTitle, onSelectMessage,
}: MatterThreadTimelineProps) {
  // Sort chronologically (oldest first)
  const sorted = [...messages].sort((a, b) => (a.created_at || '').localeCompare(b.created_at || ''));

  return (
    <div className="border-b border-[#F1F5F9] bg-[#FAFBFC] px-6 py-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
          Hilo — {matterReference} {matterTitle}
        </span>
      </div>
      <div className="max-h-[160px] overflow-y-auto space-y-0">
        {sorted.map((msg, idx) => {
          const isSelected = msg.id === selectedMessageId;
          const isLast = idx === sorted.length - 1;
          const timeAgo = msg.created_at
            ? formatDistanceToNow(new Date(msg.created_at), { addSuffix: true, locale: es })
            : '';

          return (
            <button
              key={msg.id}
              onClick={() => onSelectMessage(msg.id)}
              className={cn(
                'w-full text-left flex items-start gap-3 py-1.5 px-2 rounded-md transition-colors cursor-pointer',
                isSelected ? 'bg-[#EFF6FF]' : 'hover:bg-[#F1F5F9]',
              )}
            >
              {/* Timeline dot + line */}
              <div className="flex flex-col items-center pt-1 flex-shrink-0">
                <div className={cn(
                  'w-2.5 h-2.5 rounded-full border-2',
                  isSelected
                    ? 'bg-[#2563EB] border-[#2563EB]'
                    : 'bg-white border-[#CBD5E1]',
                )} />
                {!isLast && (
                  <div className="w-px h-6 bg-[#E2E8F0] mt-0.5" />
                )}
              </div>
              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    'text-xs truncate',
                    isSelected ? 'font-semibold text-[#0a2540]' : 'font-medium text-[#475569]'
                  )}>
                    {msg.sender_name || 'Desconocido'}
                  </span>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{timeAgo}</span>
                </div>
                <p className="text-[11px] text-muted-foreground truncate">
                  {msg.subject || msg.ai_summary || (msg.body || '').slice(0, 60)}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
