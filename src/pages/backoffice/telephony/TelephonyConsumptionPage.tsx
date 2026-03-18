// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Consumption Analysis
// ============================================================

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Download, 
  Phone,
  Clock,
  TrendingUp,
  Euro,
  Building2,
  Globe,
  PhoneOutgoing,
  PhoneIncoming,
  AlertTriangle,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { StatCard } from '@/components/ui/charts';
import { CallLogsTable } from '@/components/backoffice/telephony/CallLogsTable';
import {
  useTelephonyGlobalMetrics,
  useTelephonyDailyMetrics,
  useTenantConsumption,
  useCountryBreakdown,
  useCallLogs,
  useExportConsumption,
  type DateRangeType,
} from '@/hooks/backoffice/useTelephonyAnalytics';
import { toast } from 'sonner';

export default function TelephonyConsumptionPage() {
  const [dateRange, setDateRange] = useState<DateRangeType>('month');
  const [searchTenant, setSearchTenant] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const { data: metrics, isLoading: loadingMetrics } = useTelephonyGlobalMetrics(dateRange);
  const { data: dailyMetrics, isLoading: loadingDaily } = useTelephonyDailyMetrics(dateRange);
  const { data: tenants, isLoading: loadingTenants } = useTenantConsumption(dateRange);
  const { data: countries, isLoading: loadingCountries } = useCountryBreakdown(dateRange);
  const { data: callLogs, isLoading: loadingLogs } = useCallLogs({ limit: 50 });
  const { exportToCSV } = useExportConsumption();

  const handleExport = async () => {
    try {
      const blob = await exportToCSV(dateRange);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `consumo-telefonia-${dateRange}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Exportación completada');
    } catch (error) {
      toast.error('Error al exportar');
    }
  };

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(value);

  const filteredTenants = tenants?.filter((t) =>
    t.tenantName.toLowerCase().includes(searchTenant.toLowerCase())
  ) || [];

  // Calculate type breakdown (outbound vs inbound)
  const totalOutbound = dailyMetrics?.reduce((sum, m) => sum + m.callsOutbound, 0) || 0;
  const totalInbound = dailyMetrics?.reduce((sum, m) => sum + m.callsInbound, 0) || 0;
  const totalCalls = totalOutbound + totalInbound;
  const outboundPercentage = totalCalls > 0 ? (totalOutbound / totalCalls) * 100 : 0;
  const inboundPercentage = totalCalls > 0 ? (totalInbound / totalCalls) * 100 : 0;

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
          <Select value={dateRange} onValueChange={(v) => setDateRange(v as DateRangeType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Última semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Últimos 90 días</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      {loadingMetrics ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            title="Llamadas totales"
            value={metrics?.totalCalls.toLocaleString() || '0'}
            icon={Phone}
            color="#3B82F6"
          />
          <StatCard
            title="Horas totales"
            value={metrics?.totalHours || '0:00'}
            icon={Clock}
            color="#8B5CF6"
          />
          <StatCard
            title="Ingresos"
            value={formatCurrency(metrics?.totalRevenue || 0)}
            isFormatted
            icon={Euro}
            color="#10B981"
          />
          <StatCard
            title="Coste proveedor"
            value={formatCurrency(metrics?.totalCost || 0)}
            isFormatted
            icon={TrendingUp}
            color="#F59E0B"
            subtitle={`Margen: ${metrics?.marginPercentage.toFixed(0)}%`}
          />
        </div>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Evolución</TabsTrigger>
          <TabsTrigger value="tenants">Por Tenant</TabsTrigger>
          <TabsTrigger value="destinations">Por Destino</TabsTrigger>
          <TabsTrigger value="logs">Detalle Llamadas</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Monthly Evolution */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Evolución de Ingresos vs Costes</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingDaily ? (
                <Skeleton className="h-[350px]" />
              ) : dailyMetrics && dailyMetrics.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={dailyMetrics}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis
                      dataKey="date"
                      tickFormatter={(val) => format(new Date(val), 'd MMM', { locale: es })}
                      className="text-xs"
                    />
                    <YAxis className="text-xs" tickFormatter={(v) => `€${v}`} />
                    <Tooltip
                      labelFormatter={(val) => format(new Date(val), 'EEEE d MMM', { locale: es })}
                      formatter={(value: number) => formatCurrency(value)}
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="revenue" name="Ingresos" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="cost" name="Coste proveedor" fill="hsl(var(--warning))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                  No hay datos para el período seleccionado
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tenants Tab */}
        <TabsContent value="tenants" className="space-y-4">
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
              {loadingTenants ? (
                <Skeleton className="h-[400px]" />
              ) : filteredTenants.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-muted-foreground">
                        <th className="text-left py-3 font-medium">Tenant</th>
                        <th className="text-right py-3 font-medium">Minutos usados</th>
                        <th className="text-right py-3 font-medium">Gastado</th>
                        <th className="text-right py-3 font-medium">Saldo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTenants.map((tenant) => (
                        <tr key={tenant.id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="py-3">
                            <div className="flex items-center gap-2">
                              <Building2 className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">{tenant.tenantName}</span>
                            </div>
                          </td>
                          <td className="py-3 text-right font-mono">
                            {tenant.formattedMinutes}
                          </td>
                          <td className="py-3 text-right">
                            {formatCurrency(tenant.spent)}
                          </td>
                          <td className="py-3 text-right">
                            {tenant.isZeroBalance ? (
                              <Badge variant="destructive" className="gap-1">
                                <XCircle className="h-3 w-3" />
                                0 min
                              </Badge>
                            ) : tenant.isLowBalance ? (
                              <Badge variant="secondary" className="gap-1 bg-warning/10 text-warning">
                                <AlertTriangle className="h-3 w-3" />
                                {tenant.balance} min
                              </Badge>
                            ) : (
                              <Badge variant="secondary">{tenant.balance} min</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  No hay tenants con consumo
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Destinations Tab */}
        <TabsContent value="destinations" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* By Country */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="h-5 w-5 text-primary" />
                  Por País
                </CardTitle>
              </CardHeader>
              <CardContent>
                {loadingCountries ? (
                  <Skeleton className="h-[300px]" />
                ) : countries && countries.length > 0 ? (
                  <div className="space-y-3">
                    {countries.map((country) => (
                      <div key={country.countryCode} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{country.flag}</span>
                            <span className="font-medium">{country.country}</span>
                          </div>
                          <div className="text-right">
                            <span className="font-medium">{country.calls.toLocaleString()}</span>
                            <span className="text-muted-foreground ml-1">llamadas</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Progress value={country.percentage} className="h-2 flex-1" />
                          <span className="text-xs text-muted-foreground w-10 text-right">
                            {country.percentage.toFixed(0)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    No hay datos de destinos
                  </div>
                )}
              </CardContent>
            </Card>

            {/* By Type */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-primary" />
                  Por Tipo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <PhoneOutgoing className="h-4 w-4 text-primary" />
                        <span>Salientes</span>
                      </div>
                      <span className="font-medium">{totalOutbound.toLocaleString()}</span>
                    </div>
                    <Progress value={outboundPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{outboundPercentage.toFixed(0)}%</p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <PhoneIncoming className="h-4 w-4 text-success" />
                        <span>Entrantes</span>
                      </div>
                      <span className="font-medium">{totalInbound.toLocaleString()}</span>
                    </div>
                    <Progress value={inboundPercentage} className="h-2" />
                    <p className="text-xs text-muted-foreground">{inboundPercentage.toFixed(0)}%</p>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Duración promedio</span>
                    <span className="font-medium">
                      {metrics?.avgCallDuration
                        ? `${Math.floor(metrics.avgCallDuration / 60)}:${Math.round(metrics.avgCallDuration % 60).toString().padStart(2, '0')}`
                        : '0:00'}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Call Logs Tab */}
        <TabsContent value="logs">
          <Card>
            <CardHeader>
              <CardTitle>Detalle de Llamadas</CardTitle>
            </CardHeader>
            <CardContent>
              <CallLogsTable logs={callLogs || []} isLoading={loadingLogs} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
