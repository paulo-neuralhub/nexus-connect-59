import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useMrrSnapshots } from '@/hooks/backoffice/usePlatformFinance';
import { Spinner } from '@/components/ui/spinner';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, Line, ComposedChart,
} from 'recharts';

export function PlatformMrrTab() {
  const { data: snapshots = [], isLoading } = useMrrSnapshots(12);

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const latest = snapshots[0];
  const chronological = [...snapshots].reverse();

  // Waterfall data
  const waterfallData = chronological.slice(-6).map(s => ({
    month: s.period_month,
    nuevo: s.mrr_new,
    expansion: s.mrr_expansion,
    contraccion: Math.abs(s.mrr_contraction),
    churn: Math.abs(s.mrr_churn),
    mrr_total: s.mrr_total,
  }));

  // Tenants by plan table
  const byPlan = latest?.tenants_by_plan || {};
  const planPrices: Record<string, number> = { free_trial: 0, starter: 149, professional: 399, enterprise: 999 };
  const planRows = Object.entries(byPlan).map(([plan, count]) => ({
    plan,
    count: count as number,
    mrr: (count as number) * (planPrices[plan] || 0),
    pct: latest && latest.mrr_total > 0
      ? Math.round(((count as number) * (planPrices[plan] || 0) / latest.mrr_total) * 100)
      : 0,
  }));

  // Quality metrics
  const churnRate = latest?.churn_rate_pct || 0;
  const arpt = latest?.avg_revenue_per_tenant || 0;
  const ltv = churnRate > 0 ? arpt / (churnRate / 100) : 0;

  return (
    <div className="space-y-6">
      {/* MRR Waterfall */}
      <Card>
        <CardHeader><CardTitle>MRR Waterfall — Últimos 6 meses</CardTitle></CardHeader>
        <CardContent>
          {waterfallData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <ComposedChart data={waterfallData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `€${v.toLocaleString('es-ES')}`} />
                <Legend />
                <Bar dataKey="nuevo" stackId="a" fill="hsl(var(--success))" name="Nuevo" />
                <Bar dataKey="expansion" stackId="a" fill="hsl(var(--primary))" name="Expansión" />
                <Bar dataKey="contraccion" stackId="b" fill="hsl(var(--warning))" name="Contracción" />
                <Bar dataKey="churn" stackId="b" fill="hsl(var(--destructive))" name="Churn" />
                <Line type="monotone" dataKey="mrr_total" stroke="hsl(var(--foreground))" strokeWidth={2} name="MRR Total" dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-muted-foreground text-center py-8">Sin snapshots disponibles</p>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-2 gap-6">
        {/* Tenants by plan */}
        <Card>
          <CardHeader><CardTitle>Tenants por Plan</CardTitle></CardHeader>
          <CardContent>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Plan</th>
                    <th className="text-right p-3">Tenants</th>
                    <th className="text-right p-3">MRR</th>
                    <th className="text-right p-3">% Total</th>
                  </tr>
                </thead>
                <tbody>
                  {planRows.map(r => (
                    <tr key={r.plan} className="border-t">
                      <td className="p-3 capitalize">{r.plan.replace('_', ' ')}</td>
                      <td className="p-3 text-right">{r.count}</td>
                      <td className="p-3 text-right font-mono">€{r.mrr.toLocaleString('es-ES')}</td>
                      <td className="p-3 text-right">{r.pct}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Quality metrics */}
        <Card>
          <CardHeader><CardTitle>Métricas de Calidad</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">LTV estimado</span>
              <span className="font-bold">€{ltv.toLocaleString('es-ES', { maximumFractionDigits: 0 })}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">ARPT (Ingreso medio/tenant)</span>
              <span className="font-bold">€{arpt.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Churn rate</span>
              <span className="font-bold">{churnRate}%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
              <span className="text-sm text-muted-foreground">Marketplace GMV</span>
              <span className="font-bold">€{(latest?.marketplace_gmv || 0).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
