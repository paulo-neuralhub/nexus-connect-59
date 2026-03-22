// ============================================================
// Channel Sidebar — lists all internal channels grouped by type
// ============================================================

import { useMemo } from 'react';
import {
  Hash, Megaphone, Briefcase, Users, MessageCircle,
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import type { InternalChannel, StaffNotification } from '@/hooks/communications/use-internal-chat';

interface Props {
  channels: InternalChannel[];
  activeId: string | null;
  onSelect: (id: string) => void;
  isLoading: boolean;
  notifications: StaffNotification[];
}

const CHANNEL_TYPE_CONFIG: Record<string, { icon: typeof Hash; label: string; order: number }> = {
  general: { icon: Hash, label: 'General', order: 0 },
  announcement: { icon: Megaphone, label: 'Anuncios', order: 1 },
  matter: { icon: Briefcase, label: 'Expedientes', order: 2 },
  client: { icon: Users, label: 'Clientes', order: 3 },
  direct: { icon: MessageCircle, label: 'Directos', order: 4 },
};

export function ChannelSidebar({ channels, activeId, onSelect, isLoading, notifications }: Props) {
  const grouped = useMemo(() => {
    const groups = new Map<string, InternalChannel[]>();
    for (const ch of channels) {
      const type = ch.channel_type || 'general';
      if (!groups.has(type)) groups.set(type, []);
      groups.get(type)!.push(ch);
    }
    return Array.from(groups.entries()).sort(
      ([a], [b]) => (CHANNEL_TYPE_CONFIG[a]?.order ?? 99) - (CHANNEL_TYPE_CONFIG[b]?.order ?? 99)
    );
  }, [channels]);

  // Count unread notifications per channel (chat_mention type)
  const unreadByChannel = useMemo(() => {
    const map = new Map<string, number>();
    // For now just show notification count badge — would need channel_id in notifications
    return map;
  }, [notifications]);

  if (isLoading) {
    return (
      <div className="flex flex-col h-full p-3 space-y-3">
        <Skeleton className="h-5 w-24" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <MessageCircle className="h-4 w-4 text-primary" />
          Chat Interno
        </h3>
        {notifications.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5">
            {notifications.length} notificación{notifications.length !== 1 ? 'es' : ''}
          </p>
        )}
      </div>

      <ScrollArea className="flex-1">
        <div className="p-2 space-y-4">
          {grouped.map(([type, chans]) => {
            const config = CHANNEL_TYPE_CONFIG[type] || { icon: Hash, label: type };
            const Icon = config.icon;
            return (
              <div key={type}>
                <p className="px-2 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Icon className="h-3 w-3" />
                  {config.label}
                </p>
                <div className="space-y-0.5">
                  {chans.map(ch => {
                    const unread = unreadByChannel.get(ch.id) || 0;
                    return (
                      <button
                        key={ch.id}
                        onClick={() => onSelect(ch.id)}
                        className={cn(
                          'w-full text-left px-3 py-1.5 rounded-lg text-sm transition-colors flex items-center justify-between gap-2',
                          activeId === ch.id
                            ? 'bg-primary/10 text-primary font-medium'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        )}
                      >
                        <span className="truncate">{ch.name}</span>
                        {unread > 0 && (
                          <Badge variant="destructive" className="h-4 min-w-[16px] text-[10px] px-1 flex-shrink-0">
                            {unread}
                          </Badge>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {channels.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-8">
              No hay canales disponibles
            </p>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
