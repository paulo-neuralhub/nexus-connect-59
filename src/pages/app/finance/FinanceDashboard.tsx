import { Link } from 'react-router-dom';
import { ArrowRight, Plus, AlertTriangle, Settings } from 'lucide-react';
import { formatCurrency, INVOICE_STATUSES } from '@/lib/constants/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NeoBadge } from '@/components/ui/neo-badge';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  useFinanceDashboardKPIs,
  useRevenueVsExpenses,
  useServiceTypeBreakdown,
  useUrgentInvoices,
  useMatterProfitability,
} from '@/hooks/finance/useFinanceDashboard';
import { useFiscalConfig } from '@/hooks/finance/useFiscalConfig';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';

function formatShortCurrency(value: number) {
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `${(value / 1000).toFixed(1)}K`;
  return value.toFixed(0);
}

export default function FinanceDashboard() {
  const { data: fiscalConfig, isLoading: loadingFiscal } = useFiscalConfig();
  const { data: kpis } = useFinanceDashboardKPIs();
  const { data: revenueExpenses = [] } = useRevenueVsExpenses();
  const { data: serviceBreakdown = [] } = useServiceTypeBreakdown();
  const { data: urgentInvoices = [] } = useUrgentInvoices();
  const { data: profitability = [] } = useMatterProfitability();

  const hasOverdue = (kpis?.overdueCount || 0) > 0;
  const showFiscalBanner = !loadingFiscal && !fiscalConfig;

  return (
    <div className="p-6 space-y-6">
      {/* Fiscal config banner */}
      {showFiscalBanner && (
        <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800 dark:text-amber-200">Configura tu información fiscal</p>
              <p className="text-sm text-amber-700 dark:text-amber-300">Necesitas completar la configuración fiscal para usar el módulo de finanzas.</p>
            </div>
          </div>
          <Button asChild size="sm">
            <Link to="/app/finance/setup">
              <Settings className="w-4 h-4 mr-2" /> Configurar ahora
            </Link>
          </Button>
        </div>
      )}
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Finance Dashboard</h1>
          <p className="text-muted-foreground">Gestión financiera y facturación</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <Link to="/app/finance/costs/new">
              <Plus className="w-4 h-4 mr-2" /> Nuevo coste
            </Link>
          </Button>
          <Button asChild>
            <Link to="/app/finance/invoices/new">
              <Plus className="w-4 h-4 mr-2" /> Nueva factura
            </Link>
          </Button>
        </div>
      </div>

      {/* KPI NeoBadges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <KPICard
          label="Facturado este mes"
          value={formatShortCurrency(kpis?.invoicedThisMonth || 0)}
          suffix="€"
          color="#10b981"
        />
        <KPICard
          label="Cobrado este mes"
          value={formatShortCurrency(kpis?.collectedThisMonth || 0)}
          suffix="€"
          color="#3B82F6"
        />
        <KPICard
          label="Pendiente cobro"
          value={formatShortCurrency(kpis?.pendingCollection || 0)}
          suffix="€"
          color="#F59E0B"
        />
        <KPICard
          label="Vencidas"
          value={kpis?.overdueCount || 0}
          color="#EF4444"
          isAlert={hasOverdue}
        />
      </div>

      {/* Charts row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Revenue vs Expenses */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Ingresos vs Gastos</CardTitle>
            <p className="text-xs text-muted-foreground">Últimos 6 meses</p>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={revenueExpenses} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="label" fontSize={12} tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis fontSize={11} tick={{ fill: 'hsl(var(--muted-foreground))' }} tickFormatter={v => `${(v / 1000).toFixed(0)}K`} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8 }}
                />
                <Legend />
                <Bar dataKey="revenue" name="Ingresos" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" name="Gastos" fill="#EF4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Service type breakdown */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Por tipo de servicio</CardTitle>
            <p className="text-xs text-muted-foreground">Este año</p>
          </CardHeader>
          <CardContent>
            {serviceBreakdown.length === 0 ? (
              <div className="flex items-center justify-center h-[260px] text-muted-foreground text-sm">
                Sin datos de facturación este año
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie
                    data={serviceBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={90}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                    fontSize={11}
                  >
                    {serviceBreakdown.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Urgent invoices */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Facturas urgentes</CardTitle>
              <Link to="/app/finance/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {urgentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay facturas urgentes 🎉</p>
            ) : (
              <div className="space-y-2">
                {urgentInvoices.map(inv => {
                  const isOverdue = inv.days_overdue > 0;
                  return (
                    <Link
                      key={inv.id}
                      to={`/app/finance/invoices/${inv.id}`}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        {isOverdue && (
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-destructive" />
                          </span>
                        )}
                        <div>
                          <p className="text-sm font-medium">{inv.client_name}</p>
                          <p className="text-xs text-muted-foreground">{inv.invoice_number}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold">{formatCurrency(inv.total - inv.paid_amount)}</p>
                        <p className={`text-xs ${isOverdue ? 'text-destructive font-medium' : 'text-muted-foreground'}`}>
                          {isOverdue ? `${inv.days_overdue}d vencida` : `${-inv.days_overdue}d restantes`}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Profitability table */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Rentabilidad por expediente</CardTitle>
            <p className="text-xs text-muted-foreground">Este trimestre</p>
          </CardHeader>
          <CardContent className="p-0">
            {profitability.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Sin datos este trimestre</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-xs">Expediente</TableHead>
                    <TableHead className="text-xs text-right">Facturado</TableHead>
                    <TableHead className="text-xs text-right">Costes</TableHead>
                    <TableHead className="text-xs text-right">Margen</TableHead>
                    <TableHead className="text-xs text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {profitability.slice(0, 8).map(row => (
                    <TableRow key={row.matter_id}>
                      <TableCell className="py-2">
                        <Link to={`/app/docket/${row.matter_id}`} className="text-sm font-medium hover:text-primary">
                          {row.reference}
                        </Link>
                        <p className="text-xs text-muted-foreground truncate max-w-[160px]">{row.title}</p>
                      </TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(row.invoiced)}</TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {formatCurrency(row.hours_cost + row.expenses)}
                      </TableCell>
                      <TableCell className={`text-right text-sm font-medium ${row.margin >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {formatCurrency(row.margin)}
                      </TableCell>
                      <TableCell className={`text-right text-sm ${row.margin_pct >= 0 ? 'text-green-600' : 'text-destructive'}`}>
                        {row.margin_pct.toFixed(0)}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ label, value, suffix, color, isAlert }: {
  label: string;
  value: number | string;
  suffix?: string;
  color: string;
  isAlert?: boolean;
}) {
  return (
    <div
      className="relative overflow-hidden transition-all duration-300 hover:shadow-md"
      style={{
        padding: '20px',
        borderRadius: '14px',
        border: isAlert ? `1px solid ${color}40` : '1px solid hsl(var(--border))',
        borderLeft: isAlert ? `4px solid ${color}` : undefined,
        background: 'hsl(var(--card))',
      }}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-[11px] font-semibold uppercase tracking-wider mb-2 text-muted-foreground">
            {label}
          </p>
          <p style={{ fontSize: '24px', fontWeight: 800, color, letterSpacing: '-0.02em' }}>
            {value}{suffix}
          </p>
        </div>
        <div className="flex-shrink-0">
          <NeoBadge
            value={isAlert && typeof value === 'number' && value > 0 ? '!' : '€'}
            color={color}
            size="md"
            active={isAlert}
          />
        </div>
      </div>
      {/* LED pulse for overdue */}
      {isAlert && (
        <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: color }} />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
        </span>
      )}
    </div>
  );
}
