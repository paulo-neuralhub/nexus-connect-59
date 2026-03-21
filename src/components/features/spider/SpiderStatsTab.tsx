/**
 * Spider Stats Tab — 4 Recharts visualizations from real DB
 * All queries scoped by organization_id
 */
import { useOrganization } from '@/contexts/organization-context';
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Skeleton } from '@/components/ui/skeleton';
import { BarChart3 } from 'lucide-react';

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#F59E0B',
  low: '#22C55E',
};

const STATUS_COLORS: Record<string, string> = {
  new: '#3B82F6',
  reviewing: '#F59E0B',
  actioned: '#22C55E',
  false_positive: '#94A3B8',
  dismissed: '#6B7280',
  escalated: '#8B5CF6',
};

export function SpiderStatsTab() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data, isLoading } = useQuery({
    queryKey: ['spider-stats-charts', orgId],
    queryFn: async () => {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      const [alertsRes, allAlertsRes] = await Promise.all([
        fromTable('spider_alerts')
          .select('created_at, severity, status, action_taken, detected_at, actioned_at, detected_jurisdiction')
          .eq('organization_id', orgId)
          .gte('created_at', sixMonthsAgo.toISOString()),
        fromTable('spider_alerts')
          .select('status, action_taken, detected_jurisdiction, detected_at, actioned_at')
          .eq('organization_id', orgId),
      ]);

      const recentAlerts = (alertsRes.data || []) as any[];
      const allAlerts = (allAlertsRes.data || []) as any[];

      // 1. Alerts by month (stacked by severity)
      const monthMap = new Map<string, Record<string, number>>();
      for (const a of recentAlerts) {
        const d = new Date(a.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
        if (!monthMap.has(key)) monthMap.set(key, { critical: 0, high: 0, medium: 0, low: 0 });
        const sev = a.severity || 'low';
        monthMap.get(key)![sev] = (monthMap.get(key)![sev] || 0) + 1;
      }
      const alertsByMonth = Array.from(monthMap.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, counts]) => ({ month, ...counts }));

      // 2. By jurisdiction (top 5)
      const jurMap = new Map<string, number>();
      for (const a of allAlerts) {
        const j = a.detected_jurisdiction || 'Sin jurisdicción';
        jurMap.set(j, (jurMap.get(j) || 0) + 1);
      }
      const byJurisdiction = Array.from(jurMap.entries())
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .map(([jurisdiction, count]) => ({ jurisdiction, count }));

      // 3. Resolution donut
      const resMap = new Map<string, number>();
      for (const a of allAlerts) {
        const cat = a.action_taken || a.status || 'new';
        resMap.set(cat, (resMap.get(cat) || 0) + 1);
      }
      const resolution = Array.from(resMap.entries())
        .map(([name, value]) => ({ name, value }));

      // 4. Avg response time
      let totalDays = 0;
      let countActioned = 0;
      for (const a of allAlerts) {
        if (a.actioned_at && a.detected_at) {
          const diff = (new Date(a.actioned_at).getTime() - new Date(a.detected_at).getTime()) / 86400000;
          if (diff >= 0) {
            totalDays += diff;
            countActioned++;
          }
        }
      }
      const avgResponseDays = countActioned > 0 ? Math.round(totalDays / countActioned) : null;

      return { alertsByMonth, byJurisdiction, resolution, avgResponseDays, totalAlerts: allAlerts.length };
    },
    enabled: !!orgId,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl" />)}
      </div>
    );
  }

  if (!data?.totalAlerts) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <BarChart3 className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Sin datos estadísticos</p>
        <p className="text-sm mt-1">Las estadísticas aparecerán cuando se generen alertas</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* 1. Alerts by month */}
      <ChartCard title="Alertas por mes" subtitle="Últimos 6 meses, por severidad">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.alertsByMonth}>
            <XAxis dataKey="month" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="critical" stackId="a" fill={SEVERITY_COLORS.critical} name="Crítica" radius={[0, 0, 0, 0]} />
            <Bar dataKey="high" stackId="a" fill={SEVERITY_COLORS.high} name="Alta" />
            <Bar dataKey="medium" stackId="a" fill={SEVERITY_COLORS.medium} name="Media" />
            <Bar dataKey="low" stackId="a" fill={SEVERITY_COLORS.low} name="Baja" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 2. By jurisdiction */}
      <ChartCard title="Por jurisdicción" subtitle="Top 5 jurisdicciones">
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={data.byJurisdiction} layout="vertical">
            <XAxis type="number" tick={{ fontSize: 10 }} allowDecimals={false} />
            <YAxis type="category" dataKey="jurisdiction" tick={{ fontSize: 10 }} width={60} />
            <Tooltip />
            <Bar dataKey="count" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Alertas" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 3. Resolution donut */}
      <ChartCard title="Resolución" subtitle="Distribución por estado/acción">
        <ResponsiveContainer width="100%" height={220}>
          <PieChart>
            <Pie data={data.resolution} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2}>
              {data.resolution.map((entry: any, i: number) => (
                <Cell key={i} fill={STATUS_COLORS[entry.name] || `hsl(${i * 60}, 60%, 55%)`} />
              ))}
            </Pie>
            <Tooltip />
            <Legend iconSize={8} wrapperStyle={{ fontSize: 10 }} />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      {/* 4. Avg response time */}
      <ChartCard title="Tiempo medio de respuesta" subtitle="Días entre detección y acción">
        <div className="flex items-center justify-center h-[220px]">
          {data.avgResponseDays !== null ? (
            <div className="text-center space-y-3">
              <NeoBadge value={data.avgResponseDays} color="#8B5CF6" size="lg" />
              <p className="text-sm text-muted-foreground">días de media</p>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Sin datos de respuesta</p>
          )}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-[10px] text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
