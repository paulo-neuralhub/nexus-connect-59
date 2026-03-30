import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Globe, Shield, Eye, AlertTriangle, ExternalLink } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

// Country flag emoji from 2-letter code
function flagEmoji(code: string) {
  return code
    .toUpperCase()
    .replace(/./g, (c) => String.fromCodePoint(127397 + c.charCodeAt(0)));
}

export default function SpiderGlobalPage() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Fetch watches
  const { data: watches = [], isLoading: loadingWatches } = useQuery({
    queryKey: ['spider-global-watches', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_watches')
        .select('id, watch_name, watch_type, is_active, jurisdictions, created_at, last_scanned_at, active_alerts_count')
        .eq('organization_id', orgId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  // Fetch recent alerts
  const { data: alerts = [], isLoading: loadingAlerts } = useQuery({
    queryKey: ['spider-global-alerts', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_alerts')
        .select('id, title, severity, status, detected_at, watch_id')
        .eq('organization_id', orgId)
        .in('status', ['new', 'active'])
        .order('detected_at', { ascending: false })
        .limit(10);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  // Computed stats
  const allJurisdictions = new Set<string>();
  watches.forEach((w: any) => {
    if (Array.isArray(w.jurisdictions)) {
      w.jurisdictions.forEach((j: string) => allJurisdictions.add(j));
    }
  });

  const cards = [
    {
      icon: Globe,
      value: allJurisdictions.size,
      label: 'Jurisdicciones monitoreadas',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      icon: Eye,
      value: watches.length,
      label: 'Vigilancias activas',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Shield,
      value: new Set(watches.map((w: any) => w.watch_name)).size,
      label: 'Marcas protegidas',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      value: alerts.length,
      label: 'Alertas pendientes',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  const severityColor: Record<string, string> = {
    critical: 'bg-red-100 text-red-700',
    high: 'bg-orange-100 text-orange-700',
    medium: 'bg-amber-100 text-amber-700',
    low: 'bg-blue-100 text-blue-700',
  };

  const isLoading = loadingWatches || loadingAlerts;

  return (
    <PageContainer>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vigilancia Global</h1>
          <p className="text-sm text-muted-foreground">
            Monitoreo internacional de marcas y activos de propiedad intelectual
          </p>
        </div>
        <Button asChild>
          <Link to="/app/spider">
            <Eye className="h-4 w-4 mr-2" />
            Ir a IP-Spider
          </Link>
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-6 flex items-center gap-3">
              <div className={`p-2 rounded-lg ${card.iconBg}`}>
                <card.icon className={`h-5 w-5 ${card.iconColor}`} />
              </div>
              <div>
                {isLoading ? (
                  <Skeleton className="h-8 w-12" />
                ) : (
                  <p className="text-2xl font-bold">{card.value}</p>
                )}
                <p className="text-xs text-muted-foreground">{card.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Jurisdictions Map */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base">Jurisdicciones</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-8" />)}
              </div>
            ) : allJurisdictions.size === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No hay jurisdicciones configuradas
              </p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {Array.from(allJurisdictions).sort().map(code => {
                  const watchCount = watches.filter((w: any) =>
                    Array.isArray(w.jurisdictions) && w.jurisdictions.includes(code)
                  ).length;
                  return (
                    <div
                      key={code}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted/50 border border-border"
                    >
                      <span className="text-base">{flagEmoji(code)}</span>
                      <span className="text-xs font-medium">{code}</span>
                      <Badge variant="secondary" className="text-[10px] px-1 py-0 h-4">
                        {watchCount}
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Active Watches */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Vigilancias Activas</CardTitle>
            <Button variant="outline" size="sm" asChild>
              <Link to="/app/spider">Ver todas</Link>
            </Button>
          </CardHeader>
          <CardContent>
            {loadingWatches ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-14" />)}
              </div>
            ) : watches.length === 0 ? (
              <div className="text-center py-8">
                <Eye className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
                <p className="text-sm text-muted-foreground mb-3">No hay vigilancias activas</p>
                <Button asChild size="sm">
                  <Link to="/app/spider">Configurar vigilancias</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {watches.map((watch: any) => (
                  <div
                    key={watch.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex items-center gap-1">
                        {(watch.jurisdictions || []).slice(0, 3).map((j: string) => (
                          <span key={j} className="text-sm">{flagEmoji(j)}</span>
                        ))}
                        {(watch.jurisdictions || []).length > 3 && (
                          <span className="text-[10px] text-muted-foreground">
                            +{watch.jurisdictions.length - 3}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{watch.watch_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {watch.watch_type} · {watch.jurisdictions?.length || 0} jurisdicciones
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      {watch.active_alerts_count > 0 && (
                        <Badge variant="destructive" className="text-[10px]">
                          {watch.active_alerts_count} alertas
                        </Badge>
                      )}
                      <span className="text-[10px] text-muted-foreground">
                        {watch.last_scanned_at
                          ? `Escaneado ${format(new Date(watch.last_scanned_at), "d MMM", { locale: es })}`
                          : 'Sin escanear'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Alerts */}
      <Card className="mt-6">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base">Alertas Recientes</CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/app/spider">Ver en Spider</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {loadingAlerts ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => <Skeleton key={i} className="h-12" />)}
            </div>
          ) : alerts.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-40" />
              <p className="text-sm text-muted-foreground">No hay alertas pendientes</p>
            </div>
          ) : (
            <div className="space-y-2">
              {alerts.map((alert: any) => {
                const watch = watches.find((w: any) => w.id === alert.watch_id);
                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Badge className={`text-[10px] ${severityColor[alert.severity] || severityColor.low}`}>
                        {alert.severity}
                      </Badge>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{alert.title}</p>
                        {watch && (
                          <p className="text-xs text-muted-foreground truncate">
                            Vigilancia: {watch.watch_name}
                          </p>
                        )}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground flex-shrink-0">
                      {format(new Date(alert.detected_at), "d MMM HH:mm", { locale: es })}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </PageContainer>
  );
}
