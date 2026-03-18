import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, Users, ArrowUp, ArrowDown, RotateCcw, XCircle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useState } from 'react';
import { useConversionFunnel, useSubscriptionMovements, useChurnRate, useChurnReasons } from '@/hooks/backoffice/useAnalyticsSubscriptions';
import { Spinner } from '@/components/ui/spinner';

export default function AnalyticsSubscriptionsPage() {
  const [period, setPeriod] = useState('year');
  const { data: funnel, isLoading: loadingFunnel } = useConversionFunnel();
  const { data: movements, isLoading: loadingMovements } = useSubscriptionMovements();
  const { data: churnRate, isLoading: loadingChurn } = useChurnRate();
  const { data: churnReasons, isLoading: loadingReasons } = useChurnReasons();
  
  const isLoading = loadingFunnel || loadingMovements || loadingChurn || loadingReasons;

  const funnelData = [
    { stage: 'Visitantes', count: 12450, percent: 100 },
    { stage: 'Registros', count: 1245, percent: 10 },
    { stage: 'Trial iniciado', count: 456, percent: 36.6 },
    { stage: 'Trial → Pago', count: 298, percent: 65.4 },
    { stage: 'Activos 3+ meses', count: 178, percent: 59.7 },
  ];

  const movementsData = [
    { type: 'Nuevas suscripciones', value: 12, color: 'hsl(var(--success))' },
    { type: 'Upgrades', value: 5, color: 'hsl(var(--chart-2))' },
    { type: 'Downgrades', value: -2, color: 'hsl(var(--warning))' },
    { type: 'Reactivaciones', value: 1, color: 'hsl(var(--chart-4))' },
    { type: 'Cancelaciones', value: -3, color: 'hsl(var(--destructive))' },
  ];

  const churnTrend = [
    { month: 'Feb', rate: 2.8 },
    { month: 'Mar', rate: 3.2 },
    { month: 'Abr', rate: 2.5 },
    { month: 'May', rate: 2.1 },
    { month: 'Jun', rate: 1.9 },
    { month: 'Jul', rate: 2.3 },
    { month: 'Ago', rate: 2.0 },
    { month: 'Sep', rate: 1.8 },
    { month: 'Oct', rate: 2.2 },
    { month: 'Nov', rate: 1.9 },
    { month: 'Dic', rate: 2.0 },
    { month: 'Ene', rate: 2.1 },
  ];

  const reasonsData = [
    { reason: 'Precio muy alto', percent: 35, color: 'hsl(var(--chart-1))' },
    { reason: 'No uso suficiente', percent: 25, color: 'hsl(var(--chart-2))' },
    { reason: 'Falta funcionalidad', percent: 18, color: 'hsl(var(--chart-3))' },
    { reason: 'Cambio de negocio', percent: 12, color: 'hsl(var(--chart-4))' },
    { reason: 'Problemas técnicos', percent: 5, color: 'hsl(var(--chart-5))' },
    { reason: 'Otro', percent: 5, color: 'hsl(var(--muted))' },
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Spinner className="w-8 h-8" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Análisis de Suscripciones</h1>
          <p className="text-muted-foreground">Conversión, movimientos y análisis de churn</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">Este mes</SelectItem>
              <SelectItem value="quarter">Este trimestre</SelectItem>
              <SelectItem value="year">Este año</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Conversion Funnel */}
      <Card>
        <CardHeader>
          <CardTitle>Funnel de Conversión</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {funnelData.map((stage, index) => (
              <div key={stage.stage} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{stage.stage}</span>
                  <div className="flex items-center gap-4">
                    <span className="text-muted-foreground">{stage.count.toLocaleString()}</span>
                    {index > 0 && (
                      <span className="text-sm text-muted-foreground">({stage.percent}%)</span>
                    )}
                  </div>
                </div>
                <div className="h-8 bg-muted rounded overflow-hidden">
                  <div
                    className="h-full bg-primary rounded transition-all"
                    style={{ width: `${(stage.count / funnelData[0].count) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Movements */}
      <Card>
        <CardHeader>
          <CardTitle>Movimientos Este Mes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            <div className="p-4 bg-success/10 rounded-lg text-center">
              <ArrowUp className="h-6 w-6 text-success mx-auto mb-2" />
              <p className="text-2xl font-bold text-success">+12</p>
              <p className="text-sm text-muted-foreground">Nuevas</p>
            </div>
            <div className="p-4 bg-chart-2/10 rounded-lg text-center">
              <TrendingUp className="h-6 w-6 text-chart-2 mx-auto mb-2" />
              <p className="text-2xl font-bold">+5</p>
              <p className="text-sm text-muted-foreground">Upgrades</p>
            </div>
            <div className="p-4 bg-warning/10 rounded-lg text-center">
              <TrendingDown className="h-6 w-6 text-warning mx-auto mb-2" />
              <p className="text-2xl font-bold text-warning">-2</p>
              <p className="text-sm text-muted-foreground">Downgrades</p>
            </div>
            <div className="p-4 bg-chart-4/10 rounded-lg text-center">
              <RotateCcw className="h-6 w-6 text-chart-4 mx-auto mb-2" />
              <p className="text-2xl font-bold">+1</p>
              <p className="text-sm text-muted-foreground">Reactivaciones</p>
            </div>
            <div className="p-4 bg-destructive/10 rounded-lg text-center">
              <XCircle className="h-6 w-6 text-destructive mx-auto mb-2" />
              <p className="text-2xl font-bold text-destructive">-3</p>
              <p className="text-sm text-muted-foreground">Cancelaciones</p>
            </div>
          </div>
          <div className="p-4 bg-muted/50 rounded-lg text-center">
            <p className="text-sm text-muted-foreground">Neto</p>
            <p className="text-3xl font-bold text-success">+13</p>
          </div>
        </CardContent>
      </Card>

      {/* Churn Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Tasa de Churn Mensual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={churnTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(v) => `${v}%`} domain={[0, 5]} />
                  <Tooltip formatter={(value: number) => [`${value}%`, 'Churn Rate']} />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="hsl(var(--destructive))"
                    strokeWidth={2}
                    dot={{ fill: 'hsl(var(--destructive))' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
              <div>
                <span className="text-sm text-muted-foreground">Churn rate actual:</span>
                <span className="ml-2 font-bold">2.1%</span>
              </div>
              <div>
                <span className="text-sm text-muted-foreground">Benchmark SaaS:</span>
                <span className="ml-2 font-medium">3-5%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Razones de Cancelación</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reasonsData.map((reason) => (
                <div key={reason.reason} className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{reason.reason}</span>
                    <span className="text-sm font-medium">{reason.percent}%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${reason.percent}%`, backgroundColor: reason.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
