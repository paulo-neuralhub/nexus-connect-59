import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  CheckCircle,
  Clock,
  FileText,
  Mail,
  MessageCircle,
  Phone,
  Video,
} from 'lucide-react';

import { fromTable } from '@/lib/supabase';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';

interface CommunicationHistoryProps {
  contactId: string;
  organizationId: string;
  maxHeight?: string;
}

type CommunicationType = {
  id: string;
  type: string;
  direction: string;
  subject?: string | null;
  content?: string | null;
  status: string;
  created_at: string;
};

const channelIcons: Record<string, typeof Mail> = {
  email: Mail,
  whatsapp: MessageCircle,
  call: Phone,
  meeting: Video,
  note: FileText,
};

const statusConfig: Record<string, { icon: typeof CheckCircle; className: string; label: string }> = {
  sent: { icon: CheckCircle, className: 'text-primary', label: 'Enviado' },
  completed: { icon: CheckCircle, className: 'text-primary', label: 'Completado' },
  pending: { icon: Clock, className: 'text-muted-foreground', label: 'Pendiente' },
};

export function CommunicationHistory({ contactId, organizationId, maxHeight = '400px' }: CommunicationHistoryProps) {
  const { data: communications = [], isLoading } = useQuery({
    queryKey: ['communication-history', organizationId, contactId],
    queryFn: async () => {
      const { data, error } = await fromTable('crm_activities')
        .select('id, activity_type, subject, description, outcome, activity_date, created_by')
        .eq('organization_id', organizationId)
        .eq('contact_id', contactId)
        .order('activity_date', { ascending: false })
        .limit(50);

      if (error) throw error;

      return (data ?? []).map((row: Record<string, unknown>): CommunicationType => ({
        id: row.id as string,
        type: (row.activity_type as string) || 'note',
        direction: 'outbound',
        subject: row.subject as string | null,
        content: row.description as string | null,
        status: (row.outcome as string) || 'completed',
        created_at: row.activity_date as string,
      }));
    },
    enabled: !!organizationId && !!contactId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de comunicaciones</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-start gap-3">
              <Skeleton className="h-9 w-9 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-72" />
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (communications.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historial de comunicaciones</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">No hay comunicaciones registradas.</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Historial de comunicaciones</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea style={{ maxHeight }} className="pr-4">
          <div className="space-y-3">
            {communications.map((comm) => {
              const ChannelIcon = channelIcons[comm.type] || FileText;
              const statusInfo = statusConfig[comm.status] || statusConfig.completed;
              const StatusIcon = statusInfo.icon;

              return (
                <div key={comm.id} className="rounded-lg border bg-card p-3">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg border bg-background flex items-center justify-center">
                      <ChannelIcon className="h-4 w-4 text-foreground" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{comm.type}</span>
                        <Badge variant="secondary" className="gap-1">
                          <StatusIcon className={cn('h-3 w-3', statusInfo.className)} />
                          {statusInfo.label}
                        </Badge>
                      </div>

                      {comm.subject ? <p className="text-sm font-medium text-foreground mt-1 truncate">{comm.subject}</p> : null}
                      {comm.content ? (
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap break-words line-clamp-3">
                          {comm.content}
                        </p>
                      ) : null}

                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(comm.created_at), { addSuffix: true, locale: es })}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
