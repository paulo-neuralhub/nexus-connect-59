import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, TrendingUp, Users, Percent, DollarSign, BarChart3 } from 'lucide-react';
import {
  useMrrSnapshots,
  usePlatformCosts,
  usePlatformRevenue,
  usePendingReviewCount,
  useCaptureFinanceData,
} from '@/hooks/backoffice/usePlatformFinance';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  PieChart, Pie, Cell, BarChart, Bar,
} from 'recharts';
import { Spinner } from '@/components/ui/spinner';
import { Link } from 'react-router-dom';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))'];

const COST_CATEGORY_LABELS: Record<string, string> = {
  ai_inference: 'AI Inference',
  telephony: 'Telefonía',
  infrastructure: 'Infraestructura',
  communications: 'Comunicaciones',
  stripe_fees: 'Comisiones Stripe',
  third_party_apis: 'APIs externas',
  personnel: 'Personal',
  legal_compliance: 'Legal',
  marketing: 'Marketing',
  other: 'Otros',
};

export function PlatformDashboardTab() {
  const [period] = useState<string>('year');
  const { data: snapshots = [], isLoading: snapsLoading } = useMrrSnapshots(12);
  const { data: costs = [] } = usePlatformCosts('confirmed');
  const { data: revenue = [] } = usePlatformRevenue('confirmed');
  const { data: pendingCount = 0 } = usePendingReviewCount();
  const capture = useCaptureFinanceData();

  const latestSnapshot = snapshots[0];

  // P&L chart data (reverse for chronological order)
  const plData = [...snapshots].reverse().map(s => ({
    month: s.period_month,
    ingresos: s.mrr_total + s.marketplace_revenue,
    costes: s.total_costs_month,
    margen: s.gross_profit,
  }));

  // Revenue distribution pie
  const revByType = revenue.reduce((acc, r) => {
    const key = r.revenue_type || 'other';
    acc[key] = (acc[key] || 0) + (r.net_amount || r.gross_amount);
    return acc;
  }, {} as Record<string, number>);
  const pieData = Object.entries(revByType).map(([name, value]) => ({ name, value }));

  // Costs by category bar
  const costsByCategory = costs.reduce((acc, c) => {
    const key = c.cost_category || 'other';
    acc[key] = (acc[key] || 0) + (c.amount_eur || c.amount);
    return acc;
  }, {} as Record<string, number>);
  const costBarData = Object.entries(costsByCategory)
    .map(([category, amount]) => ({
      category: COST_CATEGORY_LABELS[category] || category,
      amount,
    }))
    .sort((a, b) => b.amount - a.amount);

  if (snapsLoading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Header actions */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Badge variant="outline">{period === 'year' ? 'Últimos 12 meses' : period}</Badge>
        </div>
        <Button
          onClick={() => capture.mutate()}
          disabled={capture.isPending}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${capture.isPending ? 'animate-spin' : ''}`} />
          Capturar datos del periodo
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <DollarSign className="h-4 w-4" /> MRR
            </div>
            <p className="text-2xl font-bold">
              €{(latestSnapshot?.mrr_total || 0).toLocaleString('es-ES')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <TrendingUp className="h-4 w-4" /> ARR
            </div>
            <p className="text-2xl font-bold">
              €{(latestSnapshot?.arr_total || 0).toLocaleString('es-ES')}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Users className="h-4 w-4" /> Tenants activos
            </div>
            <p className="text-2xl font-bold">{latestSnapshot?.tenants_total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <Percent className="h-4 w-4" /> Churn rate
            </div>
            <p className="text-2xl font-bold">{latestSnapshot?.churn_rate_pct || 0}%</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4" /> Margen bruto
            </div>
            <p className="text-2xl font-bold">{latestSnapshot?.gross_margin_pct || 0}%</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert if pending */}
      {pendingCount > 0 && (
        <Card className="border-warning/50 bg-warning/5">
          <CardContent className="p-4 flex items-center justify-between">
            <span className="text-sm font-medium">
              ⚠️ {pendingCount} entradas pendientes de confirmación
            </span>
            <Link to="/backoffice/finance/pending">
              <Button variant="outline" size="sm">Ver pendientes</Button>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* P&L Chart */}
      <Card>
        <CardHeader><CardTitle>P&L — Últimos 12 meses</CardTitle></CardHeader>
        <CardContent>
          {plData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={plData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString('es-ES')}`} />
                <Legend />
                <Line type="monotone" dataKey="ingresos" stroke="hsl(var(--primary))" strokeWidth={2} name="Ingresos" />
                <Line type="monotone" dataKey="margen" stroke="hsl(var(--success))" strokeWidth={2} name="Margen bruto" />
                <Line type="monotone" dataKey="costes" stroke="hsl(var(--destructive))" strokeWidth={2} name="Costes" />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sin datos aún. Ejecuta una captura para comenzar.</p>
          )}
        </CardContent>
      </Card>

      {/* Revenue + Costs side by side */}
      <div className="grid grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Distribución de Ingresos</CardTitle></CardHeader>
          <CardContent>
            {pieData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                    {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString('es-ES')}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin ingresos confirmados</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Costes por Categoría</CardTitle></CardHeader>
          <CardContent>
            {costBarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={costBarData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="category" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: number) => `€${v.toLocaleString('es-ES')}`} />
                  <Bar dataKey="amount" fill="hsl(var(--destructive))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-muted-foreground text-center py-8">Sin costes confirmados</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
