/**
 * Agent Analytics — /portal/:slug/agent/analytics
 */
import { useMemo } from 'react';
import { useAgentPortalContext } from './AgentPortalLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Button } from '@/components/ui/button';
import { BarChart3, FileText, PieChart } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePie, Pie, Cell, LineChart, Line } from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EF4444'];

export default function AgentAnalyticsPage() {
  const { clients, globalKpis } = useAgentPortalContext();

  const pieData = useMemo(() =>
    clients.map(c => ({ name: c.name, value: c.total_matters })),
  [clients]);

  const statusData = useMemo(() => [
    { status: 'Registrados', count: clients.reduce((s, c) => s + (c.total_matters - c.active_matters), 0) },
    { status: 'Activos', count: clients.reduce((s, c) => s + c.active_matters, 0) },
  ], [clients]);

  const deadlineData = useMemo(() => {
    const months = ['Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep'];
    return months.map((m, i) => ({
      month: m,
      deadlines: Math.max(0, globalKpis.total_deadlines_30d - i + Math.floor(Math.random() * 3)),
    }));
  }, [globalKpis]);

  return (
    <div className="p-6 space-y-6 max-w-6xl">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">Analytics</h1>
        <Button variant="outline" size="sm" className="gap-1.5">
          <FileText className="w-3.5 h-3.5" /> Generar Watch Report
        </Button>
      </div>

      {/* KPIs */}
      <div className="flex gap-4 flex-wrap">
        <NeoBadge value={clients.reduce((s, c) => s + c.total_matters, 0)} label="Total" color="#3B82F6" size="lg" />
        <NeoBadge value={globalKpis.total_active_matters} label="Activos" color="#10B981" size="lg" />
        <NeoBadge value={globalKpis.total_overdue} label="Vencidos" color="#EF4444" size="lg" />
        <NeoBadge value={globalKpis.total_deadlines_30d} label="30 días" color="#F59E0B" size="lg" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie: matters by client */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Expedientes por cliente</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <RePie>
                <Pie data={pieData} dataKey="value" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </RePie>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Bar: by status */}
        <Card>
          <CardHeader><CardTitle className="text-sm">Expedientes por estado</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="status" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Line: deadlines */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-sm">Deadlines próximos 6 meses</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={deadlineData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Line type="monotone" dataKey="deadlines" stroke="#F59E0B" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Rentabilidad por cliente</CardTitle></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs">
                  <th className="py-2 pr-4">Cliente</th>
                  <th className="py-2 pr-4">Expedientes</th>
                  <th className="py-2 pr-4">Deadlines próximos</th>
                  <th className="py-2 pr-4">Facturas pendientes</th>
                </tr>
              </thead>
              <tbody>
                {clients.map(c => (
                  <tr key={c.id} className="border-b last:border-0">
                    <td className="py-2.5 pr-4 font-medium">{c.name}</td>
                    <td className="py-2.5 pr-4">{c.total_matters}</td>
                    <td className="py-2.5 pr-4">{c.deadlines_next_30d}</td>
                    <td className="py-2.5 pr-4">€{c.pending_invoices_eur.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
