/**
 * Analytics Tenant Dashboard — 4 tabs con datos reales
 * TAB 1: Resumen (KPIs + gauge compliance + portfolio pie + activity)
 * TAB 2: Expedientes (bar chart + jurisdictions + profitability table)
 * TAB 3: Financiero (revenue line + 4 KPIs)
 * TAB 4: Productividad (stacked bar + utilization)
 */

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import {
  PieChart, Pie, Cell,
  BarChart, Bar,
  LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer, RadialBarChart, RadialBar,
} from 'recharts';
import {
  Briefcase, Calendar, Euro, Shield, Clock, TrendingUp,
  FileText, BarChart3, AlertTriangle, CheckCircle, Activity,
  Globe, Users, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useOrganization } from '@/contexts/organization-context';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import {
  useDeadlineCompliance,
  useMattersByMonth,
  useJurisdictionAnalysis,
  useMatterProfitability,
  useRevenueAnalysis,
  useProductivityStats,
  useAnalyticsOverview,
} from '@/hooks/analytics/useAnalyticsDashboard';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--accent))',
  '#f59e0b',
  '#8b5cf6',
  '#ec4899',
  '#06b6d4',
  '#10b981',
  '#ef4444',
];

const STATUS_LABELS: Record<string, string> = {
  registered: 'Registrado', pending: 'Pendiente', filed: 'Presentado',
  published: 'Publicado', granted: 'Concedido', expired: 'Expirado',
  abandoned: 'Abandonado', opposed: 'En oposición', examining: 'En examen',
  archived: 'Archivado', cancelled: 'Cancelado',
};

function formatCurrency(v: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);
}

// ===== KPI BADGE =====
function KPIBadge({ label, value, icon: Icon, variant = 'default' }: {
  label: string; value: string | number; icon: React.ElementType;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const colors = {
    default: 'bg-primary/10 text-primary',
    success: 'bg-emerald-500/10 text-emerald-600',
    warning: 'bg-amber-500/10 text-amber-600',
    danger: 'bg-destructive/10 text-destructive',
  };
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className={cn('p-2.5 rounded-xl', colors[variant])}>
            <Icon className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground truncate">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== TAB 1: RESUMEN =====
function TabResumen() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const { data: overview, isLoading: loadingOverview } = useAnalyticsOverview();
  const { data: compliance, isLoading: loadingCompliance } = useDeadlineCompliance();

  // Portfolio by status
  const { data: statusData, isLoading: loadingStatus } = useQuery({
    queryKey: ['portfolio-by-status', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('matters')
        .select('status')
        .eq('organization_id', orgId);
      if (error) throw error;
      const counts: Record<string, number> = {};
      (data || []).forEach(m => {
        const s = m.status || 'unknown';
        counts[s] = (counts[s] || 0) + 1;
      });
      return Object.entries(counts).map(([name, value]) => ({
        name: STATUS_LABELS[name] || name, value,
      }));
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Spider alerts
  const { data: spiderCount } = useQuery({
    queryKey: ['spider-alerts-active', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count, error } = await supabase
        .from('spider_alerts')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'new');
      if (error) return 0;
      return count || 0;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Revenue this month
  const { data: revMonth } = useQuery({
    queryKey: ['revenue-this-month', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data, error } = await supabase
        .from('invoices')
        .select('total')
        .eq('organization_id', orgId)
        .gte('invoice_date', monthStart.toISOString().split('T')[0]);
      if (error) return 0;
      return (data || []).reduce((s, i) => s + (Number(i.total) || 0), 0);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Deadlines next 30 days
  const { data: deadlines30d } = useQuery({
    queryKey: ['deadlines-30d', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const now = new Date().toISOString().split('T')[0];
      const in30d = new Date();
      in30d.setDate(in30d.getDate() + 30);
      const { count, error } = await supabase
        .from('matter_deadlines')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .gte('deadline_date', now)
        .lte('deadline_date', in30d.toISOString().split('T')[0])
        .in('status', ['pending', 'upcoming']);
      if (error) return 0;
      return count || 0;
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Activity log
  const { data: activities, isLoading: loadingActivity } = useQuery({
    queryKey: ['recent-activity', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await supabase
        .from('activity_log')
        .select('id, action, title, description, created_at, entity_type')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(8);
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  // Compliance gauge
  const complianceRate = compliance?.compliance_rate ?? 100;
  const gaugeColor = complianceRate >= 95 ? '#10b981' : complianceRate >= 80 ? '#f59e0b' : '#ef4444';
  const gaugeData = [{ name: 'Compliance', value: complianceRate, fill: gaugeColor }];

  const activeMatterCount = overview
    ? overview.total_matters - (overview.total_matters - overview.total_trademarks - overview.total_patents - overview.total_designs > 0 ? 0 : 0)
    : 0;

  if (loadingOverview) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-32" />)}</div>;
  }

  return (
    <div className="space-y-6">
      {/* 4 KPI badges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBadge label="Expedientes activos" value={overview?.total_matters || 0} icon={Briefcase} />
        <KPIBadge
          label="Plazos próximos 30d"
          value={deadlines30d || 0}
          icon={Calendar}
          variant={(deadlines30d || 0) > 10 ? 'warning' : 'default'}
        />
        <KPIBadge label="Revenue este mes" value={formatCurrency(revMonth || 0)} icon={Euro} variant="success" />
        <KPIBadge
          label="Alertas Spider"
          value={spiderCount || 0}
          icon={Shield}
          variant={(spiderCount || 0) > 0 ? 'danger' : 'default'}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compliance gauge */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Cumplimiento de Plazos
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loadingCompliance ? (
              <Skeleton className="h-[200px]" />
            ) : (
              <div className="flex items-center gap-6">
                <div className="w-[180px] h-[180px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart
                      cx="50%" cy="50%"
                      innerRadius="70%" outerRadius="100%"
                      barSize={16}
                      data={gaugeData}
                      startAngle={180} endAngle={0}
                    >
                      <RadialBar
                        dataKey="value"
                        cornerRadius={8}
                        background={{ fill: 'hsl(var(--muted))' }}
                      />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="text-center -mt-16">
                    <span className="text-3xl font-bold" style={{ color: gaugeColor }}>
                      {complianceRate}%
                    </span>
                  </div>
                </div>
                <div className="flex-1 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">En plazo</span>
                    <span className="font-medium text-emerald-600">{compliance?.on_time || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Vencidos</span>
                    <span className="font-medium text-amber-600">{compliance?.overdue || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Perdidos</span>
                    <span className="font-medium text-destructive">{compliance?.missed || 0}</span>
                  </div>
                  {complianceRate < 80 && (
                    <div className="mt-3 p-2 rounded-lg bg-destructive/10 flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
                      <span className="text-xs text-destructive font-medium">Atención: compliance bajo</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Portfolio by status */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingStatus ? (
              <Skeleton className="h-[220px]" />
            ) : statusData && statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={statusData} dataKey="value" nameKey="name"
                    cx="50%" cy="50%" outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {statusData.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState
                icon={<Briefcase className="h-8 w-8" />}
                title="Sin expedientes"
                description="Crea tu primer expediente para ver la distribución"
              />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Actividad reciente
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingActivity ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : activities && activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Activity className="h-4 w-4 text-primary" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">{act.title || act.action}</p>
                    {act.description && (
                      <p className="text-xs text-muted-foreground truncate">{act.description}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(act.created_at), { addSuffix: true, locale: es })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Activity className="h-8 w-8" />}
              title="Sin actividad reciente"
              description="Las acciones realizadas en la plataforma aparecerán aquí"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== TAB 2: EXPEDIENTES =====
function TabExpedientes() {
  const { data: mattersByMonth, isLoading: loadingMonths } = useMattersByMonth(6);
  const { data: jurisdictions, isLoading: loadingJur } = useJurisdictionAnalysis();
  const { data: profitability, isLoading: loadingProfit } = useMatterProfitability(10);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Matters created by month */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expedientes creados por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingMonths ? (
              <Skeleton className="h-[250px]" />
            ) : mattersByMonth && mattersByMonth.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={mattersByMonth}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="count" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Expedientes" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<BarChart3 className="h-8 w-8" />} title="Sin datos" description="No hay expedientes creados en los últimos 6 meses" />
            )}
          </CardContent>
        </Card>

        {/* Top jurisdictions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top jurisdicciones</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingJur ? (
              <Skeleton className="h-[250px]" />
            ) : jurisdictions && jurisdictions.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={jurisdictions.slice(0, 10)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis type="number" className="text-xs" />
                  <YAxis type="category" dataKey="jurisdiction" width={60} className="text-xs" />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Total" />
                  <Bar dataKey="registered" fill="#10b981" radius={[0, 4, 4, 0]} name="Registrados" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={<Globe className="h-8 w-8" />} title="Sin jurisdicciones" description="Asigna jurisdicciones a tus expedientes" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profitability table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Rentabilidad por expediente (Top 10)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProfit ? (
            <Skeleton className="h-[300px]" />
          ) : profitability && profitability.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Expediente</th>
                    <th className="text-left py-2 font-medium">Tipo</th>
                    <th className="text-left py-2 font-medium">Jurisdicción</th>
                    <th className="text-right py-2 font-medium">Facturado</th>
                    <th className="text-right py-2 font-medium">Horas</th>
                    <th className="text-right py-2 font-medium">Margen €</th>
                    <th className="text-right py-2 font-medium">Margen %</th>
                  </tr>
                </thead>
                <tbody>
                  {profitability.map((row: any) => (
                    <tr key={row.id} className="border-b last:border-0">
                      <td className="py-2.5 font-medium truncate max-w-[200px]">
                        {row.matter?.title || 'Sin título'}
                      </td>
                      <td className="py-2.5">
                        <Badge variant="outline" className="text-xs">
                          {row.matter?.type || '-'}
                        </Badge>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{row.matter?.jurisdiction || '-'}</td>
                      <td className="py-2.5 text-right">{formatCurrency(Number(row.total_invoiced) || 0)}</td>
                      <td className="py-2.5 text-right">{Number(row.total_hours || 0).toFixed(1)}h</td>
                      <td className={cn('py-2.5 text-right font-medium', Number(row.margin_eur) >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                        {formatCurrency(Number(row.margin_eur) || 0)}
                      </td>
                      <td className={cn('py-2.5 text-right', Number(row.margin_pct) >= 0 ? 'text-emerald-600' : 'text-destructive')}>
                        {Number(row.margin_pct || 0).toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              icon={<TrendingUp className="h-8 w-8" />}
              title="Sin datos de rentabilidad"
              description="Registra horas y facturas para ver la rentabilidad por expediente"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== TAB 3: FINANCIERO =====
function TabFinanciero() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const { data: revenueData, isLoading: loadingRevenue } = useRevenueAnalysis(6);

  // Financial KPIs
  const { data: finKpis, isLoading: loadingFin } = useQuery({
    queryKey: ['financial-kpis', orgId],
    queryFn: async () => {
      if (!orgId) return { invoiced: 0, collected: 0, pending: 0, overdue: 0 };
      const monthStart = new Date();
      monthStart.setDate(1);
      const { data, error } = await supabase
        .from('invoices')
        .select('total, paid_amount, paid_date, status, invoice_date')
        .eq('organization_id', orgId);
      if (error) return { invoiced: 0, collected: 0, pending: 0, overdue: 0 };

      const rows = data || [];
      const thisMonth = monthStart.toISOString().split('T')[0];

      return {
        invoiced: rows.filter(i => i.invoice_date && i.invoice_date >= thisMonth).reduce((s, i) => s + (Number(i.total) || 0), 0),
        collected: rows.filter(i => i.paid_date && i.paid_date >= thisMonth).reduce((s, i) => s + (Number(i.paid_amount) || 0), 0),
        pending: rows.filter(i => i.status === 'sent' || i.status === 'partial').reduce((s, i) => s + (Number(i.total) || 0) - (Number(i.paid_amount) || 0), 0),
        overdue: rows.filter(i => i.status === 'overdue').length,
      };
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIBadge label="Facturado mes" value={formatCurrency(finKpis?.invoiced || 0)} icon={Euro} variant="success" />
        <KPIBadge label="Cobrado mes" value={formatCurrency(finKpis?.collected || 0)} icon={CheckCircle} variant="success" />
        <KPIBadge label="Pendiente cobro" value={formatCurrency(finKpis?.pending || 0)} icon={Clock} variant="warning" />
        <KPIBadge
          label="Facturas vencidas"
          value={finKpis?.overdue || 0}
          icon={AlertTriangle}
          variant={(finKpis?.overdue || 0) > 0 ? 'danger' : 'default'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Revenue: Facturado vs Cobrado (6 meses)</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingRevenue ? (
            <Skeleton className="h-[300px]" />
          ) : revenueData && revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="month" className="text-xs" />
                <YAxis className="text-xs" tickFormatter={v => `${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(v) => formatCurrency(v as number)}
                  contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="invoiced" stroke="#3b82f6" strokeWidth={2} name="Facturado" dot={{ r: 4 }} />
                <Line type="monotone" dataKey="collected" stroke="#10b981" strokeWidth={2} name="Cobrado" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Euro className="h-8 w-8" />}
              title="Sin datos financieros"
              description="Crea facturas para visualizar el revenue"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ===== TAB 4: PRODUCTIVIDAD =====
function TabProductividad() {
  const { data: productivity, isLoading } = useProductivityStats();

  const totalHours = productivity?.reduce((s, u) => s + u.total_hours, 0) || 0;
  const billableHours = productivity?.reduce((s, u) => s + u.billable_hours, 0) || 0;
  const utilizationRate = totalHours > 0 ? Math.round((billableHours / totalHours) * 100) : 0;

  const chartData = productivity?.map(u => ({
    name: u.user_name.split(' ')[0],
    'Facturables': u.billable_hours,
    'No facturables': Math.max(0, u.total_hours - u.billable_hours),
  })) || [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <KPIBadge label="Horas totales (mes)" value={`${totalHours.toFixed(1)}h`} icon={Clock} />
        <KPIBadge label="Horas facturables" value={`${billableHours.toFixed(1)}h`} icon={TrendingUp} variant="success" />
        <KPIBadge
          label="Tasa utilización"
          value={`${utilizationRate}%`}
          icon={Users}
          variant={utilizationRate >= 70 ? 'success' : utilizationRate >= 50 ? 'warning' : 'danger'}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Horas por usuario (mes actual)</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-[300px]" />
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="name" className="text-xs" />
                <YAxis className="text-xs" />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                <Legend />
                <Bar dataKey="Facturables" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                <Bar dataKey="No facturables" stackId="a" fill="hsl(var(--muted))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <EmptyState
              icon={<Users className="h-8 w-8" />}
              title="Sin registros de tiempo"
              description="Registra horas en el timesheet para ver productividad"
            />
          )}
        </CardContent>
      </Card>

      {/* Utilization table */}
      {productivity && productivity.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Utilización por usuario</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="text-left py-2 font-medium">Usuario</th>
                    <th className="text-right py-2 font-medium">Total</th>
                    <th className="text-right py-2 font-medium">Facturables</th>
                    <th className="text-right py-2 font-medium">% Utilización</th>
                    <th className="text-right py-2 font-medium">Facturado</th>
                  </tr>
                </thead>
                <tbody>
                  {productivity.map((u) => (
                    <tr key={u.user_name} className="border-b last:border-0">
                      <td className="py-2.5 font-medium">{u.user_name}</td>
                      <td className="py-2.5 text-right">{u.total_hours.toFixed(1)}h</td>
                      <td className="py-2.5 text-right">{u.billable_hours.toFixed(1)}h</td>
                      <td className="py-2.5 text-right">
                        <Badge variant={u.utilization_rate >= 70 ? 'default' : 'outline'}>
                          {u.utilization_rate.toFixed(0)}%
                        </Badge>
                      </td>
                      <td className="py-2.5 text-right">{formatCurrency(u.billable_amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// ===== MAIN EXPORT =====
export function AnalyticsTenantDashboard() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-muted-foreground">Métricas y rendimiento de tu despacho</p>
      </div>

      <Tabs defaultValue="resumen">
        <TabsList className="w-full justify-start">
          <TabsTrigger value="resumen">Resumen</TabsTrigger>
          <TabsTrigger value="expedientes">Expedientes</TabsTrigger>
          <TabsTrigger value="financiero">Financiero</TabsTrigger>
          <TabsTrigger value="productividad">Productividad</TabsTrigger>
        </TabsList>

        <TabsContent value="resumen" className="mt-6">
          <TabResumen />
        </TabsContent>
        <TabsContent value="expedientes" className="mt-6">
          <TabExpedientes />
        </TabsContent>
        <TabsContent value="financiero" className="mt-6">
          <TabFinanciero />
        </TabsContent>
        <TabsContent value="productividad" className="mt-6">
          <TabProductividad />
        </TabsContent>
      </Tabs>
    </div>
  );
}
