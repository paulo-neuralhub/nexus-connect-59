import { PageContainer } from '@/components/layout/PageContainer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Globe, Shield, Eye, AlertTriangle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';

export default function SpiderGlobalPage() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['spider-global-stats', orgId],
    queryFn: async () => {
      const [watchesRes, alertsRes] = await Promise.all([
        fromTable('spider_watches')
          .select('id, jurisdictions')
          .eq('organization_id', orgId)
          .eq('is_active', true),
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId)
          .in('status', ['new', 'active']),
      ]);

      const watches = watchesRes.data || [];
      const jurisdictions = new Set<string>();
      watches.forEach((w: any) => {
        if (Array.isArray(w.jurisdictions)) {
          w.jurisdictions.forEach((j: string) => jurisdictions.add(j));
        }
      });

      return {
        jurisdictions: jurisdictions.size,
        activeWatches: watches.length,
        protectedBrands: new Set(watches.map((w: any) => w.id)).size,
        pendingAlerts: alertsRes.count || 0,
      };
    },
    enabled: !!orgId,
    staleTime: 30000,
  });

  const cards = [
    {
      icon: Globe,
      value: stats?.jurisdictions ?? '—',
      label: 'Jurisdicciones monitoreadas',
      iconBg: 'bg-violet-100',
      iconColor: 'text-violet-600',
    },
    {
      icon: Eye,
      value: stats?.activeWatches ?? '—',
      label: 'Vigilancias activas',
      iconBg: 'bg-blue-100',
      iconColor: 'text-blue-600',
    },
    {
      icon: Shield,
      value: stats?.protectedBrands ?? '—',
      label: 'Marcas protegidas',
      iconBg: 'bg-green-100',
      iconColor: 'text-green-600',
    },
    {
      icon: AlertTriangle,
      value: stats?.pendingAlerts ?? '—',
      label: 'Alertas pendientes',
      iconBg: 'bg-amber-100',
      iconColor: 'text-amber-600',
    },
  ];

  return (
    <PageContainer>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {cards.map((card) => (
          <Card key={card.label} className="bg-white border border-slate-200">
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

      <Card className="bg-white border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg">Vigilancia Global</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            El módulo de Vigilancia Global permite monitorear marcas y activos de propiedad intelectual
            a nivel mundial. Configura tus vigilancias desde IP-Spider para comenzar a recibir alertas.
          </p>
        </CardContent>
      </Card>
    </PageContainer>
  );
}
