// ============================================================
// IP-NEXUS — Thread List with @tanstack/react-virtual
// ============================================================

import { useState, useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Search, Mail, MessageCircle, Phone, MessageSquare } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import type { CommThread, CommChannel, ChannelStats } from '@/types/communications';

interface Props {
  threads: CommThread[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  channelFilter: CommChannel | null;
  onChannelChange?: (ch: CommChannel | null) => void;
  stats?: ChannelStats[];
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail,
  whatsapp: MessageCircle,
  call: Phone,
  sms: MessageSquare,
  internal: MessageSquare,
  portal: MessageSquare,
};

const CHANNEL_COLOR: Record<string, string> = {
  email: 'text-primary',
  whatsapp: 'text-green-500',
  call: 'text-violet-500',
  sms: 'text-amber-500',
};

export function CommThreadList({
  threads,
  selectedId,
  onSelect,
  isLoading,
  channelFilter,
  onChannelChange,
  stats,
}: Props) {
  const [search, setSearch] = useState('');
  const parentRef = useRef<HTMLDivElement>(null);

  const filtered = threads.filter(t => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      t.subject?.toLowerCase().includes(q) ||
      t.last_message_preview?.toLowerCase().includes(q) ||
      t.last_message_sender?.toLowerCase().includes(q)
    );
  });

  const virtualizer = useVirtualizer({
    count: filtered.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 88,
    overscan: 10,
  });

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-3 border-b bg-card space-y-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar conversaciones..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>

        {/* Channel tabs for tablet */}
        {onChannelChange && stats && (
          <div className="flex gap-1 overflow-x-auto">
            {[
              { key: null, label: 'Todos' },
              { key: 'email' as CommChannel, label: '✉️' },
              { key: 'whatsapp' as CommChannel, label: '💬' },
              { key: 'call' as CommChannel, label: '📞' },
              { key: 'sms' as CommChannel, label: '📱' },
            ].map(({ key, label }) => (
              <button
                key={label}
                onClick={() => onChannelChange(key)}
                className={cn(
                  'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
                  channelFilter === key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Thread list - virtualized */}
      {isLoading ? (
        <div className="p-3 space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
              <Skeleton className="h-3 w-full" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-6 text-center">
          <div>
            <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">
              {search ? 'Sin resultados' : 'No hay conversaciones'}
            </p>
          </div>
        </div>
      ) : (
        <div ref={parentRef} className="flex-1 overflow-auto">
          <div
            style={{ height: `${virtualizer.getTotalSize()}px`, position: 'relative' }}
          >
            {virtualizer.getVirtualItems().map(vItem => {
              const thread = filtered[vItem.index];
              const Icon = CHANNEL_ICON[thread.channel] || MessageSquare;
              const colorClass = CHANNEL_COLOR[thread.channel] || 'text-muted-foreground';
              const isUnread = thread.unread_count > 0;
              const isSelected = thread.id === selectedId;

              return (
                <div
                  key={thread.id}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${vItem.size}px`,
                    transform: `translateY(${vItem.start}px)`,
                  }}
                >
                  <button
                    onClick={() => onSelect(thread.id)}
                    className={cn(
                      'w-full text-left px-4 py-3 border-b transition-colors',
                      isSelected && 'bg-primary/5',
                      isUnread && !isSelected && 'bg-blue-50/50 dark:bg-blue-950/20',
                      !isSelected && !isUnread && 'hover:bg-muted/50'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Unread dot */}
                      <div className="pt-1.5">
                        {isUnread ? (
                          <div className="h-2 w-2 rounded-full bg-primary" />
                        ) : (
                          <div className="h-2 w-2" />
                        )}
                      </div>

                      {/* Channel icon */}
                      <Icon className={cn('h-4 w-4 mt-0.5 flex-shrink-0', colorClass)} />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className={cn(
                            'text-sm truncate',
                            isUnread ? 'font-semibold text-foreground' : 'font-medium text-foreground/80'
                          )}>
                            {thread.subject || 'Sin asunto'}
                          </span>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {thread.last_message_at
                              ? formatDistanceToNow(new Date(thread.last_message_at), { locale: es, addSuffix: false })
                              : ''}
                          </span>
                        </div>

                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {thread.last_message_sender && (
                            <span className="font-medium">{thread.last_message_sender}: </span>
                          )}
                          {thread.last_message_preview || '—'}
                        </p>

                        {/* Matter & account badges */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          {thread.matter && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              📋 {thread.matter.reference_number || thread.matter.title}
                            </Badge>
                          )}
                          {thread.crm_account && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                              🏢 {thread.crm_account.name}
                            </Badge>
                          )}
                          {!thread.matter_id && (
                            <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-600">
                              ⚠️ Sin exp.
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
