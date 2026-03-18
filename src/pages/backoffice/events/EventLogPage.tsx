import { useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  RefreshCw,
  Search,
  ScrollText,
} from 'lucide-react';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  usePendingEventsCount,
  useResolveEvent,
  useSystemEvents,
  type SystemEventSeverity,
} from '@/hooks/useSystemEvents';

type Category =
  | 'payment'
  | 'subscription'
  | 'voip'
  | 'user'
  | 'organization'
  | 'crm'
  | 'system'
  | 'support'
  | 'ai';

const CATEGORY_EMOJI: Record<Category, string> = {
  payment: '💳',
  subscription: '📦',
  voip: '📞',
  user: '👤',
  organization: '🏢',
  crm: '📇',
  system: '⚙️',
  support: '🎫',
  ai: '🤖',
};

const SEVERITIES: Array<{ value: SystemEventSeverity; label: string }> = [
  { value: 'critical', label: 'Crítico' },
  { value: 'error', label: 'Error' },
  { value: 'warning', label: 'Warning' },
  { value: 'info', label: 'Info' },
  { value: 'debug', label: 'Debug' },
];

function severityBadgeClass(sev: SystemEventSeverity) {
  switch (sev) {
    case 'critical':
      return 'bg-[hsl(var(--destructive))] text-[hsl(var(--destructive-foreground))]';
    case 'error':
      return 'bg-[hsl(var(--destructive))/0.12] text-[hsl(var(--destructive))]';
    case 'warning':
      return 'bg-[hsl(var(--warning))/0.12] text-[hsl(var(--warning))]';
    case 'info':
      return 'bg-[hsl(var(--primary))/0.12] text-[hsl(var(--primary))]';
    case 'debug':
    default:
      return 'bg-muted text-muted-foreground';
  }
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? '' : String(v);
    const safe = s.split('"').join('""');
    return `"${safe}"`;
  };
  const lines = [headers.map(escape).join(',')];
  rows.forEach((r) => {
    lines.push(headers.map((h) => escape(r[h])).join(','));
  });
  return lines.join('\n');
}

function downloadText(filename: string, content: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export default function EventLogPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('all');
  const [severity, setSeverity] = useState<string>('all');
  const [showOnlyPending, setShowOnlyPending] = useState(false);

  const { data: pendingCount } = usePendingEventsCount();

  const filters = useMemo(
    () => ({
      search,
      category: category === 'all' ? null : category,
      severity: (severity === 'all' ? null : (severity as SystemEventSeverity)) ?? null,
      requiresAction: showOnlyPending,
    }),
    [search, category, severity, showOnlyPending]
  );

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch, isRefetching } =
    useSystemEvents(filters);

  const resolveEvent = useResolveEvent();

  const events = useMemo(() => data?.pages.flat() ?? [], [data]);

  const exportCsv = () => {
    const rows = events.map((e: any) => ({
      created_at: e.created_at,
      severity: e.severity,
      category: e.event_category,
      event_type: e.event_type,
      title: e.title,
      description: e.description,
      source: e.source,
      organization_name: e.organizations?.name ?? null,
      requires_action: e.requires_action,
      action_status: e.action_status,
      related_entity_type: e.related_entity_type,
      related_entity_id: e.related_entity_id,
    }));
    downloadText(`ip-nexus-event-log-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-start gap-3">
          <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-xl bg-muted">
            <ScrollText className="h-5 w-5 text-foreground" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Event Log</h1>
            <p className="text-sm text-muted-foreground">Registro completo de actividad del sistema</p>
          </div>
          {pendingCount ? (
            <Badge className="ml-2 bg-[hsl(var(--warning))/0.12] text-[hsl(var(--warning))]">
              <AlertTriangle className="mr-1 h-3.5 w-3.5" />
              {pendingCount} pendientes
            </Badge>
          ) : null}
        </div>

        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={() => refetch()} disabled={isRefetching}>
            <RefreshCw className={cn('h-4 w-4', isRefetching && 'animate-spin')} />
            Actualizar
          </Button>
          <Button type="button" variant="outline" onClick={exportCsv} disabled={!events.length}>
            Exportar CSV
          </Button>
        </div>
      </header>

      <Card className="p-4">
        <div className="grid gap-3 md:grid-cols-12 md:items-center">
          <div className="md:col-span-6">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, descripción o data..."
                className="pl-9"
              />
            </div>
          </div>

          <div className="md:col-span-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {(Object.keys(CATEGORY_EMOJI) as Category[]).map((c) => (
                  <SelectItem key={c} value={c}>
                    {CATEGORY_EMOJI[c]} {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-3">
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger>
                <SelectValue placeholder="Severidad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {SEVERITIES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-12 flex items-center gap-2 text-sm">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <Button
              type="button"
              variant={showOnlyPending ? 'default' : 'outline'}
              size="sm"
              onClick={() => setShowOnlyPending((v) => !v)}
            >
              {showOnlyPending ? 'Mostrando pendientes' : 'Solo pendientes'}
            </Button>
          </div>
        </div>
      </Card>

      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      ) : events.length === 0 ? (
        <Card className="p-10 text-center">
          <p className="text-sm text-muted-foreground">No hay eventos que mostrar</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {events.map((event: any) => {
            const sev = (event.severity ?? 'info') as SystemEventSeverity;
            const orgName = event.organizations?.name ?? event.organization_name;

            return (
              <Card key={event.id} className="p-4">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0 space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge className={cn('border-0', severityBadgeClass(sev))}>{sev}</Badge>
                      <Badge variant="outline">
                        {(CATEGORY_EMOJI[event.event_category as Category] ?? '📋') + ' ' + (event.event_category ?? '—')}
                      </Badge>
                      {event.requires_action && event.action_status !== 'resolved' ? (
                        <Badge className="bg-[hsl(var(--warning))/0.12] text-[hsl(var(--warning))]">
                          <Clock className="mr-1 h-3.5 w-3.5" />
                          Requiere acción
                        </Badge>
                      ) : null}
                      {event.action_status === 'resolved' ? (
                        <Badge className="bg-[hsl(var(--success))/0.12] text-[hsl(var(--success))]">
                          <CheckCircle2 className="mr-1 h-3.5 w-3.5" />
                          Resuelto
                        </Badge>
                      ) : null}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{event.title}</p>
                      {event.description ? (
                        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{event.description}</p>
                      ) : null}
                    </div>

                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        {formatDistanceToNow(new Date(event.created_at), { addSuffix: true, locale: es })}
                      </span>
                      <span>{event.event_type}</span>
                      <span>via {event.source}</span>
                      {orgName ? <span>🏢 {orgName}</span> : null}
                    </div>
                  </div>

                  {event.requires_action && event.action_status !== 'resolved' ? (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => resolveEvent.mutate({ eventId: event.id })}
                      disabled={resolveEvent.isPending}
                    >
                      Marcar resuelto
                    </Button>
                  ) : null}
                </div>
              </Card>
            );
          })}

          {hasNextPage ? (
            <Button
              type="button"
              variant="outline"
              onClick={() => fetchNextPage()}
              disabled={isFetchingNextPage}
              className="w-full"
            >
              {isFetchingNextPage ? 'Cargando…' : 'Cargar más'}
            </Button>
          ) : null}
        </div>
      )}
    </div>
  );
}
