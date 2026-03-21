/**
 * AccountCommunicationsTabV2 — Uses comm_threads/comm_messages (COMM-01)
 * For CRM Account detail / Client360 pages
 */

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail, MessageCircle, Phone, MessageSquare, Plus,
  Shield, AlertTriangle, ExternalLink, Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { fromTable } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { cn } from '@/lib/utils';
import type { CommThread, CommMessage, CommChannel } from '@/types/communications';

interface Props {
  accountId: string;
  accountName?: string;
}

interface MatterOption {
  id: string;
  reference_number?: string;
  title?: string;
}

const CHANNEL_ICON: Record<string, React.ElementType> = {
  email: Mail, whatsapp: MessageCircle, call: Phone, sms: MessageSquare,
};
const CHANNEL_COLOR: Record<string, string> = {
  email: 'text-primary', whatsapp: 'text-green-500', call: 'text-violet-500', sms: 'text-amber-500',
};

export function AccountCommunicationsTabV2({ accountId, accountName }: Props) {
  const { organizationId } = useOrganization();
  const navigate = useNavigate();
  const [channelFilter, setChannelFilter] = useState<CommChannel | 'all'>('all');
  const [matterFilter, setMatterFilter] = useState<string>('all');
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [selectedMatter, setSelectedMatter] = useState<string>('');

  // Fetch threads for this account
  const { data: threads = [], isLoading: threadsLoading } = useQuery<CommThread[]>({
    queryKey: ['account-comm-threads', organizationId, accountId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data, error } = await fromTable('comm_threads')
        .select('*, matter:matters!comm_threads_matter_id_fkey(id, reference_number, title)')
        .eq('organization_id', organizationId)
        .eq('crm_account_id', accountId)
        .order('last_message_at', { ascending: false, nullsFirst: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!organizationId && !!accountId,
  });

  // Fetch messages
  const threadIds = threads.map(t => t.id);
  const { data: messages = [], isLoading: msgsLoading } = useQuery<CommMessage[]>({
    queryKey: ['account-comm-messages', organizationId, threadIds],
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

  // Fetch matters for this account (for filter dropdown + new comm dialog)
  const { data: accountMatters = [] } = useQuery<MatterOption[]>({
    queryKey: ['account-matters', organizationId, accountId],
    queryFn: async () => {
      if (!organizationId) return [];
      const { data } = await fromTable('matters')
        .select('id, reference_number, title')
        .eq('organization_id', organizationId)
        .eq('client_id', accountId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!organizationId && !!accountId,
  });

  // Thread→matter map
  const threadMatterMap = useMemo(() => {
    const map = new Map<string, CommThread['matter']>();
    threads.forEach(t => { if (t.matter) map.set(t.id, t.matter); });
    return map;
  }, [threads]);

  // Filter messages
  const filtered = useMemo(() => {
    let result = messages;
    if (channelFilter !== 'all') {
      result = result.filter(m => m.channel === channelFilter);
    }
    if (matterFilter !== 'all') {
      const matchThreadIds = matterFilter === 'none'
        ? threads.filter(t => !t.matter_id).map(t => t.id)
        : threads.filter(t => t.matter_id === matterFilter).map(t => t.id);
      result = result.filter(m => matchThreadIds.includes(m.thread_id));
    }
    return result;
  }, [messages, channelFilter, matterFilter, threads]);

  const isLoading = threadsLoading || msgsLoading;

  const handleNewComm = () => {
    setShowNewDialog(true);
  };

  const confirmNewComm = () => {
    const params = new URLSearchParams();
    params.set('account', accountId);
    if (selectedMatter && selectedMatter !== 'none') {
      params.set('matter', selectedMatter);
    }
    navigate(`/app/communications?${params.toString()}`);
    setShowNewDialog(false);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold text-foreground">
          Comunicaciones
          <Badge variant="secondary" className="ml-2 text-xs">{messages.length}</Badge>
        </h3>
        <Button size="sm" onClick={handleNewComm}>
          <Plus className="h-4 w-4 mr-1.5" />
          Nueva comunicación
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Matter filter */}
        <Select value={matterFilter} onValueChange={setMatterFilter}>
          <SelectTrigger className="w-[200px] h-8 text-xs">
            <Filter className="h-3 w-3 mr-1.5" />
            <SelectValue placeholder="Expediente" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los expedientes</SelectItem>
            <SelectItem value="none">⚠️ Sin expediente</SelectItem>
            {accountMatters.map(m => (
              <SelectItem key={m.id} value={m.id}>
                {m.reference_number || m.title || m.id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Channel filter */}
        <div className="flex gap-1">
          {(['all', 'email', 'whatsapp', 'call', 'sms'] as const).map(ch => (
            <button
              key={ch}
              onClick={() => setChannelFilter(ch)}
              className={cn(
                'px-2 py-1 rounded-md text-xs font-medium transition-colors',
                channelFilter === ch
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              )}
            >
              {ch === 'all' ? 'Todos' : ch === 'email' ? '✉️' : ch === 'whatsapp' ? '💬' : ch === 'call' ? '📞' : '📱'}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12">
          <Mail className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-sm font-medium text-foreground">Sin comunicaciones</p>
          <p className="text-xs text-muted-foreground mt-1">
            Las comunicaciones con {accountName || 'este cliente'} aparecerán aquí
          </p>
        </div>
      ) : (
        <ScrollArea className="h-[500px]">
          <div className="space-y-2 pr-3">
            {filtered.map(msg => {
              const Icon = CHANNEL_ICON[msg.channel] || MessageSquare;
              const colorClass = CHANNEL_COLOR[msg.channel] || 'text-muted-foreground';
              const matter = threadMatterMap.get(msg.thread_id);

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
                          {msg.sender_name}
                        </span>
                        <span className="text-[11px] text-muted-foreground flex-shrink-0">
                          {formatDistanceToNow(new Date(msg.created_at), { locale: es, addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                        {msg.body || msg.body_html?.replace(/<[^>]*>/g, '').slice(0, 150) || '—'}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1.5">
                        {matter ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5">
                            📋 {matter.reference_number || matter.title}
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-600">
                            ⚠️ Sin expediente
                          </Badge>
                        )}
                        {msg.is_legally_critical && (
                          <Badge variant="outline" className="text-[10px] h-4 px-1.5 border-amber-300 text-amber-600">
                            <Shield className="h-2.5 w-2.5 mr-0.5" /> Legal
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </ScrollArea>
      )}

      {/* New Communication Dialog — MUST ask for matter */}
      <Dialog open={showNewDialog} onOpenChange={setShowNewDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nueva comunicación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <p className="text-sm text-muted-foreground">
              ¿A qué expediente corresponde esta comunicación?
            </p>
            <Select value={selectedMatter} onValueChange={setSelectedMatter}>
              <SelectTrigger>
                <SelectValue placeholder="Selecciona un expediente" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin expediente (consulta general)</SelectItem>
                {accountMatters.map(m => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.reference_number || m.title || m.id.slice(0, 8)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewDialog(false)}>Cancelar</Button>
            <Button onClick={confirmNewComm}>Continuar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
