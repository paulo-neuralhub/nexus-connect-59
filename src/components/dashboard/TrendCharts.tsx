// =============================================
// COMPONENTE: TrendCharts
// Gráficos de tendencia del negocio (datos reales)
// =============================================

import { useState } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Clock } from 'lucide-react';
import { 
  useExpedientesChart, 
  useFacturacionChart, 
  useTiposChart 
} from '@/hooks/use-dashboard-charts';

// =============================================
// Empty State Component
// =============================================

function EmptyChartState({ icon: Icon, message }: { icon: React.ElementType; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-[200px] text-center">
      <Icon className="h-10 w-10 text-muted-foreground/30 mb-2" />
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

// =============================================
// Gráfico: Expedientes por mes
// =============================================

export function ExpedientesChart() {
  const { data, isLoading } = useExpedientesChart();

  const hasData = data && data.some(d => d.nuevos > 0 || d.cerrados > 0);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Expedientes por mes
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] animate-pulse bg-muted rounded" />
        ) : !hasData ? (
          <EmptyChartState icon={BarChart3} message="Sin expedientes registrados" />
        ) : (
          <>
            <div className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <YAxis tick={{ fontSize: 12 }} className="text-muted-foreground" />
                  <Tooltip 
                    contentStyle={{ 
                      borderRadius: '8px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                    }}
                  />
                  <Bar dataKey="nuevos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Nuevos" />
                  <Bar dataKey="cerrados" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} name="Cerrados" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-2 text-xs">
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-primary" />
                Nuevos
              </div>
              <div className="flex items-center gap-1.5">
                <div className="h-2.5 w-2.5 rounded-sm bg-chart-2" />
                Cerrados
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Gráfico: Facturación
// =============================================

export function FacturacionChart() {
  const [periodo, setPeriodo] = useState<'6m' | '12m'>('6m');
  const { data, isLoading } = useFacturacionChart();

  const hasData = data && data.some(d => d.valor > 0);

  return (
    <Card>
      <CardHeader className="pb-2 flex-row items-center justify-between space-y-0">
        <CardTitle className="text-base font-medium">
          Facturación
        </CardTitle>
        <Tabs value={periodo} onValueChange={(v) => setPeriodo(v as '6m' | '12m')}>
          <TabsList className="h-7">
            <TabsTrigger value="6m" className="text-xs px-2 h-6">6M</TabsTrigger>
            <TabsTrigger value="12m" className="text-xs px-2 h-6">12M</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="h-[200px] animate-pulse bg-muted rounded" />
        ) : !hasData ? (
          <EmptyChartState icon={TrendingUp} message="Sin facturas emitidas" />
        ) : (
          <div className="h-[200px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis dataKey="mes" tick={{ fontSize: 12 }} className="text-muted-foreground" />
                <YAxis 
                  tick={{ fontSize: 12 }} 
                  className="text-muted-foreground"
                  tickFormatter={(v) => `€${(v/1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => [`€${value.toLocaleString()}`, 'Facturado']}
                  contentStyle={{ 
                    borderRadius: '8px',
                    border: '1px solid hsl(var(--border))',
                    backgroundColor: 'hsl(var(--background))',
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke="hsl(var(--chart-2))" 
                  strokeWidth={2}
                  dot={{ fill: 'hsl(var(--chart-2))', strokeWidth: 2 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Gráfico: Distribución por tipo
// =============================================

export function TiposChart() {
  const { data, isLoading } = useTiposChart();

  const hasData = data && data.length > 0;

  return (
    <Card>
      <CardHeader className="pb-1 pt-3 px-4">
        <CardTitle className="text-sm font-medium">
          Por tipo
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-3 pt-0">
        {isLoading ? (
          <div className="h-[80px] animate-pulse bg-muted rounded" />
        ) : !hasData ? (
          <div className="flex flex-col items-center justify-center h-[80px] text-center">
            <PieChartIcon className="h-8 w-8 text-muted-foreground/30 mb-1" />
            <p className="text-xs text-muted-foreground">Sin datos</p>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <div className="h-[80px] w-[80px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={22}
                    outerRadius={38}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {data.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [`${value}%`, '']}
                    contentStyle={{ 
                      borderRadius: '6px',
                      border: '1px solid hsl(var(--border))',
                      backgroundColor: 'hsl(var(--background))',
                      fontSize: '11px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex-1 space-y-0.5">
              {data.map((item) => (
                <div key={item.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <div 
                      className="h-2 w-2 rounded-sm" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Gráfico: Plazos próximos (vacío por defecto)
// =============================================

export function PlazosChart() {
  // Este componente se conectará a datos reales cuando estén disponibles
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">
          Plazos próximos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <EmptyChartState icon={Clock} message="Sin plazos próximos" />
      </CardContent>
    </Card>
  );
}
