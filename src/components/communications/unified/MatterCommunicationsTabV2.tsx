/**
 * MatterCommunicationsTabV2 — Uses comm_threads/comm_messages tables (COMM-01)
 * Replaces legacy MatterCommunicationsTabEnhanced
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail, MessageCircle, Phone, MessageSquare, Plus,
  Shield, AlertTriangle, ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';
import type { CommThread, CommMessage, CommChannel } from '@/types/communications';

interface Props {
  matterId: string;
  matterReference?: string;
}

type ChannelFilter = 'all' | CommChannel;

const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail, whatsapp: MessageCircle, call: Phone, sms: MessageSquare,
};
const CHANNEL_COLOR: Record<string, string> = {
  email: 'text-primary', whatsapp: 'text-green-500', call: 'text-violet-500', sms: 'text-amber-500',
};
const CHANNEL_LABEL: Record<string, string> = {
  email: '✉️ Email', whatsapp: '💬 WhatsApp', call: '📞 Llamada', sms: '📱 SMS',
};

export function MatterCommunicationsTabV2({ matterId, matterReference }: Props) {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const [filter, setFilter] = useState<ChannelFilter>('all');

  // Fetch threads linked to this matter (direct + additional_matter_ids)
  const { data: threads = [], isLoading: threadsLoading } = useQuery<CommThread[]>({
    queryKey: ['matter-comm-threads', organizationId, matterId],
    queryFn: async () => {
      if (!organizationId) return [];
      // Direct binding
      const { data: direct } = await fromTable('comm_threads')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('matter_id', matterId)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // Additional binding via array contains
      const { data: additional } = await fromTable('comm_threads')
        .select('*')
        .eq('organization_id', organizationId)
        .contains('additional_matter_ids', [matterId])
        .order('last_message_at', { ascending: false, nullsFirst: false });

      const allThreads = [...(direct || []), ...(additional || [])];
      // Deduplicate
      const seen = new Set<string>();
      return allThreads.filter(t => {
        if (seen.has(t.id)) return false;
        seen.add(t.id);
        return true;
      });
    },
    enabled: !!organizationId && !!matterId,
  });

  // Fetch all messages for these threads
  const threadIds = threads.map(t => t.id);
  const { data: messages = [], isLoading: msgsLoading } = useQuery<CommMessage[]>({
    queryKey: ['matter-comm-messages', organizationId, threadIds],
    queryFn: async () => {
      if (!organizationId || threadIds.length === 0) return [];
      const { data, error } = await fromTable('comm_messages')
        .select('*')
        .eq('organization_id', organizationId)
        .in('thread_id', threadIds)
        .order('created_at', { ascending: false })
        .limit(200);
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && threadIds.length > 0,
  });

  // Filter
  const filteredMessages = useMemo(() => {
    if (filter === 'all') return messages;
    return messages.filter(m => m.channel === filter);
  }, [messages, filter]);

  // Counts
  const counts = useMemo(() => {
    const c: Record<string, number> = { all: messages.length };
    messages.forEach(m => { c[m.channel] = (c[m.channel] || 0) + 1; });
    return c;
  }, [messages]);

  const isLoading = threadsLoading || msgsLoading;

  const filters: { value: ChannelFilter; label: string }[] = [
    { value: 'all', label: `Todos (${counts.all || 0})` },
    { value: 'email', label: `✉️ ${counts.email || 0}` },
    { value: 'whatsapp', label: `💬 ${counts.whatsapp || 0}` },
    { value: 'call', label: `📞 ${counts.call || 0}` },
    { value: 'sms', label: `📱 ${counts.sms || 0}` },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-foreground">Comunicaciones</h3>
          <Badge variant="secondary" className="text-xs">{messages.length}</Badge>
        </div>
        <Button
          size="sm"
          onClick={() => navigate(`/app/communications?matter=${matterId}`)}
        >
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva comunicación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex gap-1.5 flex-wrap">
        {filters.map(f => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={cn(
              'px-2.5 py-1 rounded-md text-xs font-medium transition-colors',
              filter === f.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:text-foreground'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Timeline */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filteredMessages.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Sin comunicaciones</p>
          <p className="text-xs text-muted-foreground mt-1">
            Las comunicaciones de este expediente aparecerán aquí
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-3">
            {filteredMessages.map(msg => {
              const Icon = CHANNEL_ICON[msg.channel] || MessageSquare;
              const colorClass = CHANNEL_COLOR[msg.channel] || 'text-muted-foreground';
              const isOutbound = msg.sender_type === 'user';
              const isCall = msg.channel === 'call';

              return (
                <button
                  key={msg.id}
                  onClick={() => navigate(`/app/communications?thread=${msg.thread_id}`)}
                  className="w-full text-left rounded-xl border p-3.5 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center bg-muted', colorClass)}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-medium truncate text-foreground">
                          {isCall ? (isOutbound ? 'Llamada saliente' : 'Llamada entrante') : msg.sender_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(msg.created_at), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {msg.body || msg.body_html?.replace(/<[^>]*>/g, '').slice(0, 150) || '—'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                          {CHANNEL_LABEL[msg.channel] || msg.channel}
                        </Badge>
                        {msg.is_legally_critical && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-600">
                            <Shield className="h-2.5 w-2.5 mr-0.5" /> Legal
                          </Badge>
                        )}
                        <ExternalLink className="h-3 w-3 text-muted-foreground ml-auto" />
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}
    </div>
  );
}
