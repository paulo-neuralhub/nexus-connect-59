// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Consumption Analysis
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Filter,
  Phone,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Building2,
  Calendar
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--module-genius))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

export default function TelephonyConsumptionPage() {
  const [dateRange, setDateRange] = useState('month');
  const [searchTenant, setSearchTenant] = useState('');

  // Get consumption data
  const { data: consumptionData, isLoading } = useQuery({
    queryKey: ['telephony-consumption', dateRange],
    queryFn: async () => {
      let startDate: Date;
      let endDate = new Date();

      switch (dateRange) {
        case 'week':
          startDate = subDays(new Date(), 7);
          break;
        case 'month':
          startDate = startOfMonth(new Date());
          endDate = endOfMonth(new Date());
          break;
        case 'quarter':
          startDate = subDays(new Date(), 90);
          break;
        default:
          startDate = startOfMonth(new Date());
      }

      // Get daily metrics
      const { data: dailyMetrics } = await supabase
        .from('telephony_daily_metrics')
        .select('*')
        .gte('date', startDate.toISOString().split('T')[0])
        .lte('date', endDate.toISOString().split('T')[0])
        .order('date');

      // Get tenant balances
      const { data: tenantBalances } = await supabase
        .from('tenant_telephony_balance')
        .select('*, organizations!inner(name)')
        .eq('is_enabled', true)
        .order('total_minutes_used', { ascending: false });

      // Get usage logs for top destinations
      const { data: usageLogs } = await supabase
        .from('telephony_usage_logs')
        .select('country_code, duration_minutes, charged_cost')
        .gte('created_at', startDate.toISOString())
        .not('country_code', 'is', null);

      // Aggregate by country
      const countryMap = new Map<string, { minutes: number; cost: number; calls: number }>();
      usageLogs?.forEach((log: any) => {
        const country = log.country_code || 'Unknown';
        const existing = countryMap.get(country) || { minutes: 0, cost: 0, calls: 0 };
        existing.minutes += log.duration_minutes || 0;
        existing.cost += log.charged_cost || 0;
        existing.calls++;
        countryMap.set(country, existing);
      });

      // Aggregate global daily stats
      const globalDaily = dailyMetrics?.filter((m: any) => !m.tenant_id) || [];
      const tenantDaily = dailyMetrics?.filter((m: any) => m.tenant_id) || [];

      // Calculate totals
      const totals = globalDaily.reduce(
        (acc: any, m: any) => ({
          calls: acc.calls + (m.calls_outbound || 0) + (m.calls_inbound || 0),
          minutes: acc.minutes + (m.calls_total_minutes || 0),
          sms: acc.sms + (m.sms_outbound || 0) + (m.sms_inbound || 0),
          revenue: acc.revenue + (m.revenue || 0),
          cost: acc.cost + (m.provider_cost || 0),
        }),
        { calls: 0, minutes: 0, sms: 0, revenue: 0, cost: 0 }
      );

      return {
        dailyMetrics: globalDaily,
        tenantBalances: tenantBalances || [],
        countryBreakdown: Array.from(countryMap.entries()).map(([country, data]) => ({
          country,
          ...data,
        })).sort((a, b) => b.minutes - a.minutes).slice(0, 10),
        totals,
        margin: totals.revenue - totals.cost,
        marginPercent: totals.revenue > 0 ? ((totals.revenue - totals.cost) / totals.revenue * 100) : 0,
      };
    },
  });

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const filteredTenants = consumptionData?.tenantBalances.filter((t: any) =>
    t.organizations?.name?.toLowerCase().includes(searchTenant.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/backoffice/telephony">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Análisis de Consumo</h1>
            <p className="text-muted-foreground">
              Métricas detalladas de uso de telefonía
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Últimos 90 días</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <SummaryCard
            label="Llamadas"
            value={consumptionData?.totals.calls.toLocaleString() || '0'}
            icon={Phone}
            color="hsl(var(--primary))"
          />
          <SummaryCard
            label="Minutos"
            value={Math.round(consumptionData?.totals.minutes || 0).toLocaleString()}
            icon={Phone}
            color="hsl(var(--module-genius))"
          />
          <SummaryCard
            label="SMS"
            value={consumptionData?.totals.sms.toLocaleString() || '0'}
            icon={MessageSquare}
            color="hsl(var(--info))"
          />
          <SummaryCard
            label="Ingresos"
            value={formatCurrency(consumptionData?.totals.revenue || 0)}
            icon={TrendingUp}
            color="hsl(var(--success))"
          />
          <SummaryCard
            label="Margen"
            value={`${formatCurrency(consumptionData?.margin || 0)} (${consumptionData?.marginPercent.toFixed(1)}%)`}
            icon={consumptionData?.margin >= 0 ? TrendingUp : TrendingDown}
            color={consumptionData?.margin >= 0 ? 'hsl(var(--success))' : 'hsl(var(--destructive))'}
          />
        </div>
      )}

      <Tabs defaultValue="daily" className="space-y-4">
        <TabsList>
          <TabsTrigger value="daily">Actividad Diaria</TabsTrigger>
          <TabsTrigger value="tenants">Por Tenant</TabsTrigger>
          <TabsTrigger value="destinations">Por Destino</TabsTrigger>
        </TabsList>

        {/* Daily Activity */}
        <TabsContent value="daily">
          <Card>
            <CardHeader>
              <CardTitle>Actividad Diaria</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px]" />
              ) : consumptionData?.dailyMetrics && consumptionData.dailyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={consumptionData.dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(new Date(val), 'd MMM', { locale: es })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" />
                    <Tooltip
                      labelFormatter={(val) => format(new Date(val), 'EEEE d MMM yyyy', { locale: es })}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="calls_outbound" name="Llamadas salientes" fill="hsl(var(--primary))" />
                    <Bar dataKey="calls_inbound" name="Llamadas entrantes" fill="hsl(var(--module-genius))" />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[400px] flex items-center justify-center text-muted-foreground">
                  No hay datos de actividad
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Tenant */}
        <TabsContent value="tenants">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Consumo por Tenant</CardTitle>
              <Input
                placeholder="Buscar tenant..."
                value={searchTenant}
                onChange={(e) => setSearchTenant(e.target.value)}
                className="w-64"
              />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-[400px]" />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 font-medium text-muted-foreground">Tenant</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Saldo</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Total Usado</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Gastado</th>
                        <th className="text-right py-3 font-medium text-muted-foreground">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((tenant: any) => (
                        <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/50">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{tenant.organizations?.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right">
                            <Badge variant={tenant.minutes_balance < 30 ? 'destructive' : 'secondary'}>
                              {tenant.minutes_balance} min
                            </Badge>
                          </td>
                          <td className="py-3 text-right">{tenant.total_minutes_used} min</td>
                          <td className="py-3 text-right">{formatCurrency(Number(tenant.total_spent) || 0)}</td>
                          <td className="py-3 text-right">
                            <Badge variant={tenant.is_enabled ? 'default' : 'secondary'}>
                              {tenant.is_enabled ? 'Activo' : 'Inactivo'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* By Destination */}
        <TabsContent value="destinations">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Top Destinos por Minutos</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : consumptionData?.countryBreakdown && consumptionData.countryBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={consumptionData.countryBreakdown}
                        dataKey="minutes"
                        nameKey="country"
                        cx="50%"
                        cy="50%"
                        outerRadius={100}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {consumptionData.countryBreakdown.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No hay datos
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Detalle por País</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <Skeleton className="h-[300px]" />
                ) : (
                  <div className="space-y-3">
                    {consumptionData?.countryBreakdown.map((item: any, idx: number) => (
                      <div key={item.country} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                          />
                          <span className="font-medium">{item.country}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{Math.round(item.minutes)} min</p>
                          <p className="text-xs text-muted-foreground">
                            {item.calls} llamadas · {formatCurrency(item.cost)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-xl font-bold">{value}</p>
          </div>
          <div
            className="h-10 w-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="h-5 w-5" style={{ color }} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
