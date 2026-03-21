// ============================================================
// IP-NEXUS — Channel Sidebar with live counters
// ============================================================

import { Mail, MessageSquare, Phone, MessageCircle, Inbox, AlertCircle, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import type { CommChannel, ChannelStats } from '@/types/communications';

interface Props {
  stats: ChannelStats[];
  activeChannel: CommChannel | null;
  onChannelChange: (ch: CommChannel | null) => void;
}

const CHANNELS: { key: CommChannel | null; label: string; icon: React.ElementType }[] = [
  { key: null, label: 'Todos', icon: Inbox },
  { key: 'email', label: 'Email', icon: Mail },
  { key: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'call', label: 'Llamadas', icon: Phone },
  { key: 'sms', label: 'SMS', icon: MessageSquare },
];

export function CommSidebar({ stats, activeChannel, onChannelChange }: Props) {
  const totalUnread = stats.reduce((acc, s) => acc + s.unread, 0);
  const totalThreads = stats.reduce((acc, s) => acc + s.total, 0);

  const getStats = (ch: CommChannel | null) => {
    if (ch === null) return { total: totalThreads, unread: totalUnread };
    const s = stats.find(s => s.channel === ch);
    return { total: s?.total || 0, unread: s?.unread || 0 };
  };

  return (
    <div className="flex flex-col h-full p-3 space-y-1">
      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Canales
      </h3>

      {CHANNELS.map(({ key, label, icon: Icon }) => {
        const { total, unread } = getStats(key);
        const isActive = activeChannel === key;

        return (
          <button
            key={label}
            onClick={() => onChannelChange(key)}
            className={cn(
              'flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm transition-colors text-left',
              isActive
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            <Icon className="h-4 w-4 flex-shrink-0" />
            <span className="flex-1 truncate">{label}</span>
            {unread > 0 && (
              <Badge variant="destructive" className="h-5 min-w-[20px] text-[10px] px-1.5">
                {unread}
              </Badge>
            )}
            {unread === 0 && total > 0 && (
              <span className="text-xs text-muted-foreground">{total}</span>
            )}
          </button>
        );
      })}

      <Separator className="my-3" />

      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-2">
        Filtros rápidos
      </h3>
      <button
        className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
      >
        <User className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Asignados a mí</span>
      </button>
      <button
        className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
      >
        <AlertCircle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1">Sin expediente</span>
      </button>
    </div>
  );
}
