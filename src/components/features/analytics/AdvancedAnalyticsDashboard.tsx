/**
 * Advanced Analytics Dashboard - L106
 * Interactive charts, KPIs, trends for law firm performance
 */

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import {
  Briefcase,
  DollarSign,
  Clock,
  TrendingUp,
  TrendingDown,
  CalendarDays,
  Users,
  AlertTriangle,
  CheckCircle,
  Loader2,
} from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useAnalyticsKPIs,
  useMattersTrend,
  useRevenueByClient,
  useMattersByType,
  useTimeByUser,
  useDeadlineMetrics,
  type DateRange,
} from '@/hooks/analytics/useAdvancedAnalytics';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--accent))', '#f59e0b', '#8b5cf6', '#ec4899', '#06b6d4'];

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// ==============================================
// KPI CARD COMPONENT
// ==============================================

interface KPICardProps {
  title: string;
  value: string | number;
  change?: number;
  icon: React.ElementType;
  positive?: boolean;
  isLoading?: boolean;
}

function KPICard({ title, value, change, icon: Icon, positive = true, isLoading }: KPICardProps) {
  const isPositiveChange = change !== undefined && change > 0;
  const isGoodChange = positive ? isPositiveChange : !isPositiveChange;

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            {isLoading ? (
              <Skeleton className="h-9 w-24 mt-1" />
            ) : (
              <p className="text-3xl font-bold mt-1">{value}</p>
            )}
            
            {change !== undefined && !isLoading && (
              <div className={cn(
                "flex items-center gap-1 mt-2 text-sm",
                isGoodChange ? "text-accent-foreground" : "text-destructive"
              )}>
                {isPositiveChange ? (
                  <TrendingUp className="h-4 w-4" />
                ) : (
                  <TrendingDown className="h-4 w-4" />
                )}
                <span>{Math.abs(change).toFixed(1)}%</span>
                <span className="text-muted-foreground text-xs">vs anterior</span>
              </div>
            )}
          </div>
          
          <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ==============================================
// DATE RANGE PICKER
// ==============================================

interface DateRangePickerProps {
  value: DateRange;
  onChange: (range: DateRange) => void;
}

function DateRangePicker({ value, onChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);

  const presets = [
    { 
      label: 'Último mes', 
      range: { from: subMonths(new Date(), 1), to: new Date() } 
    },
    { 
      label: 'Últimos 3 meses', 
      range: { from: subMonths(new Date(), 3), to: new Date() } 
    },
    { 
      label: 'Últimos 6 meses', 
      range: { from: subMonths(new Date(), 6), to: new Date() } 
    },
    { 
      label: 'Último año', 
      range: { from: subMonths(new Date(), 12), to: new Date() } 
    },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="min-w-[240px] justify-start">
          <CalendarDays className="h-4 w-4 mr-2" />
          {format(value.from, 'd MMM yyyy', { locale: es })} - {format(value.to, 'd MMM yyyy', { locale: es })}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-4" align="end">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <Button
                key={preset.label}
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(preset.range);
                  setOpen(false);
                }}
              >
                {preset.label}
              </Button>
            ))}
          </div>
          <div className="border-t pt-4">
            <Calendar
              mode="range"
              selected={{ from: value.from, to: value.to }}
              onSelect={(range) => {
                if (range?.from && range?.to) {
                  onChange({ from: range.from, to: range.to });
                }
              }}
              numberOfMonths={2}
              className="pointer-events-auto"
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// ==============================================
// MAIN DASHBOARD
// ==============================================

export function AdvancedAnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subMonths(new Date(), 3),
    to: new Date(),
  });

  const { data: kpis, isLoading: loadingKPIs } = useAnalyticsKPIs(dateRange);
  const { data: mattersTrend, isLoading: loadingTrend } = useMattersTrend(dateRange);
  const { data: revenueByClient, isLoading: loadingRevenue } = useRevenueByClient(dateRange);
  const { data: mattersByType, isLoading: loadingTypes } = useMattersByType(dateRange);
  const { data: timeByUser, isLoading: loadingTime } = useTimeByUser(dateRange);
  const { data: deadlines, isLoading: loadingDeadlines } = useDeadlineMetrics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Dashboard Analítico</h1>
          <p className="text-muted-foreground">
            Métricas y rendimiento del despacho
          </p>
        </div>
        
        <DateRangePicker value={dateRange} onChange={setDateRange} />
      </div>

      {/* KPIs principales */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Expedientes activos"
          value={kpis?.activeMatters || 0}
          change={kpis?.activeMattersChange}
          icon={Briefcase}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Ingresos"
          value={formatCurrency(kpis?.revenue || 0)}
          change={kpis?.revenueChange}
          icon={DollarSign}
          positive
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Horas facturables"
          value={`${Math.round(kpis?.billableHours || 0)}h`}
          change={kpis?.billableHoursChange}
          icon={Clock}
          isLoading={loadingKPIs}
        />
        <KPICard
          title="Tasa de éxito"
          value={`${Math.round(kpis?.successRate || 0)}%`}
          change={kpis?.successRateChange}
          icon={TrendingUp}
          isLoading={loadingKPIs}
        />
      </div>

      {/* Alertas de plazos */}
      {deadlines && (deadlines.overdue > 0 || deadlines.upcoming7d > 0) && (
        <div className="flex gap-4">
          {deadlines.overdue > 0 && (
            <Card className="border-destructive bg-destructive/5">
              <CardContent className="p-4 flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <div>
                  <p className="font-medium text-destructive">
                    {deadlines.overdue} plazos vencidos
                  </p>
                  <p className="text-sm text-muted-foreground">Requieren atención inmediata</p>
                </div>
              </CardContent>
            </Card>
          )}
          {deadlines.upcoming7d > 0 && (
            <Card className="border-warning bg-warning/5">
              <CardContent className="p-4 flex items-center gap-3">
                <Clock className="h-5 w-5 text-warning" />
                <div>
                  <p className="font-medium">
                    {deadlines.upcoming7d} plazos próximos (7 días)
                  </p>
                  <p className="text-sm text-muted-foreground">Próximos a vencer</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tendencia de expedientes */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Expedientes por mes</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTrend ? (
              <Skeleton className="h-[300px]" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mattersTrend || []}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="month" className="text-xs" />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Area 
                    type="monotone" 
                    dataKey="opened" 
                    stroke="hsl(var(--primary))" 
                    fill="hsl(var(--primary) / 0.3)" 
                    name="Abiertos"
                  />
                  <Area 
                    type="monotone" 
                    dataKey="closed" 
                    stroke="hsl(var(--accent))" 
                    fill="hsl(var(--accent) / 0.3)"
                    name="Cerrados"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Ingresos por cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top 10 clientes por ingresos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingRevenue ? (
              <Skeleton className="h-[300px]" />
            ) : revenueByClient && revenueByClient.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={revenueByClient} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    type="number" 
                    tickFormatter={(v) => formatCurrency(v)} 
                    className="text-xs"
                  />
                  <YAxis 
                    type="category" 
                    dataKey="client_name" 
                    width={120} 
                    className="text-xs"
                    tickFormatter={(v) => v.length > 15 ? v.slice(0, 15) + '...' : v}
                  />
                  <Tooltip 
                    formatter={(v) => formatCurrency(v as number)}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No hay datos de facturación en este período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribución por tipo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Por tipo de PI</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTypes ? (
              <Skeleton className="h-[250px]" />
            ) : mattersByType && mattersByType.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={mattersByType}
                    dataKey="count"
                    nameKey="type"
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {mattersByType.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay expedientes en este período
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tiempo por usuario */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Horas por usuario</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingTime ? (
              <Skeleton className="h-[250px]" />
            ) : timeByUser && timeByUser.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={timeByUser}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis 
                    dataKey="user_name" 
                    className="text-xs"
                    tickFormatter={(v) => v.split(' ')[0]}
                  />
                  <YAxis className="text-xs" />
                  <Tooltip 
                    formatter={(v) => `${Number(v).toFixed(1)}h`}
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--background))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                  />
                  <Legend />
                  <Bar 
                    dataKey="billable_hours" 
                    fill="hsl(var(--accent))" 
                    name="Facturables" 
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar 
                    dataKey="non_billable_hours" 
                    fill="hsl(var(--muted))" 
                    name="No facturables" 
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[250px] flex items-center justify-center text-muted-foreground">
                No hay registros de tiempo en este período
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Métricas detalladas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Métricas detalladas</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview">
            <TabsList>
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="deadlines">Plazos</TabsTrigger>
              <TabsTrigger value="team">Equipo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="overview" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Expedientes período</p>
                  <p className="text-2xl font-bold">
                    {mattersTrend?.reduce((sum, m) => sum + m.opened, 0) || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Cerrados período</p>
                  <p className="text-2xl font-bold">
                    {mattersTrend?.reduce((sum, m) => sum + m.closed, 0) || 0}
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Total horas</p>
                  <p className="text-2xl font-bold">
                    {Math.round(timeByUser?.reduce((sum, u) => sum + u.billable_hours + u.non_billable_hours, 0) || 0)}h
                  </p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Clientes activos</p>
                  <p className="text-2xl font-bold">{revenueByClient?.length || 0}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="deadlines" className="mt-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                    <p className="text-sm text-destructive">Vencidos</p>
                  </div>
                  <p className="text-2xl font-bold text-destructive">{deadlines?.overdue || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-warning" />
                    <p className="text-sm">Próximos 7 días</p>
                  </div>
                  <p className="text-2xl font-bold">{deadlines?.upcoming7d || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm text-muted-foreground">Próximos 30 días</p>
                  </div>
                  <p className="text-2xl font-bold">{deadlines?.upcoming30d || 0}</p>
                </div>
                <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-accent-foreground" />
                    <p className="text-sm text-accent-foreground">Completados a tiempo</p>
                  </div>
                  <p className="text-2xl font-bold">{deadlines?.completedOnTime || 0}</p>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="team" className="mt-4">
              {timeByUser && timeByUser.length > 0 ? (
                <div className="space-y-3">
                  {timeByUser.map((user) => (
                    <div 
                      key={user.user_id} 
                      className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <Users className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{user.user_name}</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{user.billable_hours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">Facturable</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm">{user.non_billable_hours.toFixed(1)}h</p>
                          <p className="text-xs text-muted-foreground">No facturable</p>
                        </div>
                        <Badge variant="outline">
                          {((user.billable_hours / (user.billable_hours + user.non_billable_hours)) * 100).toFixed(0)}% fact.
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No hay datos de equipo para este período
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
