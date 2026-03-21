/**
 * Backoffice Product Analytics — Connected to real platform metrics
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Users, Activity, Bot, Radio, Building2,
  Briefcase, Euro, BarChart3,
} from 'lucide-react';
import {
  useAnalyticsSummary,
  useAnalyticsTrend,
  useTopPages,
  useFeatureUsage,
  useRealtimeUsers,
  usePlatformMetrics,
} from '@/hooks/admin/useProductAnalytics';
import { AnalyticsFilter, AnalyticsPeriodType } from '@/types/analytics';
import {
  LineChart, Line, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  ResponsiveContainer,
} from 'recharts';

function PlatformKPI({ label, value, icon: Icon, variant = 'default' }: {
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
      <CardContent className="p-5">
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${colors[variant]}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            <p className="text-xs text-muted-foreground">{label}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function ProductAnalyticsDashboard() {
  const [filter, setFilter] = useState<AnalyticsFilter>({ period: '30d' });
  const { data: platform, isLoading: loadingPlatform } = usePlatformMetrics();
  const { data: realtimeUsers } = useRealtimeUsers();
  const { data: trend, isLoading: loadingTrend } = useAnalyticsTrend(filter, 'matters_active');
  const { data: topPages, isLoading: loadingPages } = useTopPages(filter, 10);
  const { data: featureUsage, isLoading: loadingFeatures } = useFeatureUsage(filter);

  const handlePeriodChange = (value: string) => {
    setFilter({ period: value as AnalyticsPeriodType });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(v);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Product Analytics</h1>
            <p className="text-muted-foreground">Métricas de toda la plataforma (superadmin)</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 text-accent-foreground rounded-full text-sm">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>{realtimeUsers ?? 0} activos</span>
            </div>
            <Select value={filter.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="7d">7 días</SelectItem>
                <SelectItem value="30d">30 días</SelectItem>
                <SelectItem value="90d">90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Platform KPIs */}
        {loadingPlatform ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <PlatformKPI
              label="Tenants activos"
              value={platform?.total_tenants || 0}
              icon={Building2}
            />
            <PlatformKPI
              label="Expedientes totales"
              value={platform?.total_matters_platform || 0}
              icon={Briefcase}
            />
            <PlatformKPI
              label="Revenue plataforma (mes)"
              value={formatCurrency(platform?.total_revenue_platform || 0)}
              icon={Euro}
              variant="success"
            />
            <PlatformKPI
              label="Coste IA plataforma (mes)"
              value={formatCurrency(platform?.total_ai_cost_platform || 0)}
              icon={Bot}
              variant="warning"
            />
          </div>
        )}

        {platform && platform.total_tenants === 0 && !loadingPlatform && (
          <Card className="border-dashed">
            <CardContent className="p-6">
              <EmptyState
                icon={<BarChart3 className="h-10 w-10" />}
                title="Sin datos de métricas"
                description="Ejecuta calculate_daily_metrics() para poblar las métricas de la plataforma"
              />
            </CardContent>
          </Card>
        )}

        {/* Trend chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Tendencia de métricas</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingTrend ? (
                <Skeleton className="h-[280px]" />
              ) : trend && trend.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <LineChart data={trend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="metric_date" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Legend />
                    <Line type="monotone" dataKey="matters_active" stroke="hsl(var(--primary))" strokeWidth={2} name="Exp. Activos" dot={false} />
                    <Line type="monotone" dataKey="deadline_compliance_rate" stroke="#10b981" strokeWidth={2} name="Compliance %" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="Sin tendencias" description="Los datos aparecerán cuando haya métricas diarias" />
              )}
            </CardContent>
          </Card>

          {/* Feature usage */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Uso de funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingFeatures ? (
                <Skeleton className="h-[280px]" />
              ) : featureUsage && featureUsage.length > 0 ? (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={featureUsage.slice(0, 8)} layout="vertical">
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis type="number" className="text-xs" />
                    <YAxis type="category" dataKey="feature" width={100} className="text-xs" />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))', border: '1px solid hsl(var(--border))', borderRadius: '8px' }} />
                    <Bar dataKey="uses" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Usos" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <EmptyState icon={<Activity className="h-8 w-8" />} title="Sin uso registrado" description="Se registrará cuando los usuarios interactúen con la plataforma" />
              )}
            </CardContent>
          </Card>
        </div>

        {/* Top pages */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Páginas más visitadas</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingPages ? (
              <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-10" />)}</div>
            ) : topPages && topPages.length > 0 ? (
              <div className="space-y-2">
                {topPages.map((page, i) => (
                  <div key={page.path} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}</span>
                      <span className="text-sm font-medium">{page.path}</span>
                    </div>
                    <Badge variant="secondary">{page.views} visitas</Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={<Activity className="h-8 w-8" />}
                title="Sin datos de navegación"
                description="Los page views se registrarán automáticamente"
              />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
