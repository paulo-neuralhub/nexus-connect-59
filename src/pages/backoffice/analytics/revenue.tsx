import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, TrendingDown, DollarSign, Users, Package } from 'lucide-react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { useState } from 'react';
import { useMRRBreakdown, useRevenueByPlan, useRevenueByAddon, useARPUEvolution } from '@/hooks/backoffice/useAnalyticsRevenue';
import { Spinner } from '@/components/ui/spinner';

export default function AnalyticsRevenuePage() {
  const [period, setPeriod] = useState('year');
  const { data: mrrBreakdown, isLoading: loadingMRR } = useMRRBreakdown();
  const { data: revenueByPlan, isLoading: loadingPlan } = useRevenueByPlan();
  const { data: revenueByAddon, isLoading: loadingAddon } = useRevenueByAddon();
  const { data: arpu, isLoading: loadingARPU } = useARPUEvolution();
  
  const isLoading = loadingMRR || loadingPlan || loadingAddon || loadingARPU;

  const waterfallData = [
    { name: 'Inicio mes', value: 12960, fill: 'hsl(var(--primary))' },
    { name: '+ Nuevo', value: 542, fill: 'hsl(var(--success))' },
    { name: '+ Expansión', value: 400, fill: 'hsl(var(--success))' },
    { name: '- Contracción', value: -98, fill: 'hsl(var(--destructive))' },
    { name: '- Churn', value: -100, fill: 'hsl(var(--destructive))' },
    { name: '= Fin mes', value: 13704, fill: 'hsl(var(--primary))' },
  ];

  const planData = [
    { name: 'Enterprise', value: 3600, color: 'hsl(var(--chart-1))' },
    { name: 'Professional', value: 8800, color: 'hsl(var(--chart-2))' },
    { name: 'Starter', value: 1300, color: 'hsl(var(--chart-3))' },
  ];

  const addonData = [
    { name: 'USPTO', value: 1200 },
    { name: 'WIPO', value: 580 },
    { name: 'EPO', value: 320 },
    { name: 'EUIPO', value: 190 },
    { name: 'Otros', value: 50 },
  ];

  const arpuTrend = [
    { month: 'Jul', arpu: 85 },
    { month: 'Ago', arpu: 87 },
    { month: 'Sep', arpu: 89 },
    { month: 'Oct', arpu: 91 },
    { month: 'Nov', arpu: 92 },
    { month: 'Dic', arpu: 93 },
    { month: 'Ene', arpu: 94 },
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
          <h1 className="text-2xl font-bold">Análisis de Ingresos</h1>
          <p className="text-muted-foreground">Desglose detallado de MRR, ARR y métricas financieras</p>
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

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">ARR</p>
                <p className="text-2xl font-bold">€164,448</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">MRR</p>
                <p className="text-2xl font-bold">€13,704</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Net New MRR</p>
                <p className="text-2xl font-bold">€942</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-success/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Churned MRR</p>
                <p className="text-2xl font-bold">€198</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <TrendingDown className="h-5 w-5 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* MRR Waterfall */}
      <Card>
        <CardHeader>
          <CardTitle>MRR Breakdown (Waterfall)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={waterfallData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" tickFormatter={(v) => `€${Math.abs(v).toLocaleString()}`} />
                <YAxis type="category" dataKey="name" width={100} />
                <Tooltip formatter={(value: number) => [`€${Math.abs(value).toLocaleString()}`, 'Valor']} />
                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                  {waterfallData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Revenue by Plan & Addon */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Ingresos por Plan
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {planData.map((plan) => (
                <div key={plan.name} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{plan.name}</span>
                    <span className="text-muted-foreground">€{plan.value.toLocaleString()}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(plan.value / 13700) * 100}%`,
                        backgroundColor: plan.color,
                      }}
                    />
                  </div>
                </div>
              ))}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between font-bold">
                  <span>Total</span>
                  <span>€13,700</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Ingresos por Add-on
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={addonData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                  <XAxis type="number" tickFormatter={(v) => `€${v}`} />
                  <YAxis type="category" dataKey="name" width={60} />
                  <Tooltip formatter={(value: number) => [`€${value}`, 'Ingresos']} />
                  <Bar dataKey="value" fill="hsl(var(--chart-4))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between font-bold">
                <span>Total Add-ons</span>
                <span>€2,340</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ARPU & LTV */}
      <Card>
        <CardHeader>
          <CardTitle>ARPU & LTV</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-4">Evolución ARPU</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={arpuTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(v) => `€${v}`} />
                    <Tooltip formatter={(value: number) => [`€${value}`, 'ARPU']} />
                    <Area
                      type="monotone"
                      dataKey="arpu"
                      stroke="hsl(var(--primary))"
                      fill="hsl(var(--primary))"
                      fillOpacity={0.2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
              <p className="text-center text-muted-foreground mt-2">Promedio actual: €93.86</p>
            </div>
            <div>
              <h4 className="font-medium mb-4">LTV por Plan</h4>
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Enterprise</span>
                    <span className="text-lg font-bold">€14,350</span>
                  </div>
                  <p className="text-sm text-muted-foreground">48 meses promedio</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Professional</span>
                    <span className="text-lg font-bold">€4,752</span>
                  </div>
                  <p className="text-sm text-muted-foreground">48 meses promedio</p>
                </div>
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Starter</span>
                    <span className="text-lg font-bold">€1,044</span>
                  </div>
                  <p className="text-sm text-muted-foreground">36 meses promedio</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
