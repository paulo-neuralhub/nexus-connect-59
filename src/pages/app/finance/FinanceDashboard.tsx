import { Link } from 'react-router-dom';
import { ArrowRight, Plus } from 'lucide-react';
import { useFinanceStats, useUpcomingRenewals, useMatterCosts, useInvoices } from '@/hooks/use-finance';
import { formatCurrency, INVOICE_STATUSES, COST_STATUSES } from '@/lib/constants/finance';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { NeoBadge } from '@/components/ui/neo-badge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Color mapping for Finance KPIs
const FINANCE_COLORS: Record<string, string> = {
  invoiced: '#10b981',     // green
  pending: '#f59e0b',      // amber/orange
  costs: '#2563eb',        // blue
  renewals: '#00b4d8',     // accent cyan
};

function formatShortCurrency(value: number) {
  if (value >= 1000000) return `€${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `€${(value / 1000).toFixed(0)}K`;
  return `€${value.toFixed(0)}`;
}

export default function FinanceDashboard() {
  const { data: stats } = useFinanceStats();
  const { data: renewals = [] } = useUpcomingRenewals(60);
  const { data: recentCosts = [] } = useMatterCosts();
  const { data: recentInvoices = [] } = useInvoices();
  
  return (
    <div className="p-6 space-y-6">
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
      
      {/* Stats Cards with NeoBadge */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          label="Facturado este mes"
          value={formatShortCurrency(stats?.invoicedThisMonth || 0)}
          color={FINANCE_COLORS.invoiced}
        />
        <StatCard
          label="Pendiente cobro"
          value={formatShortCurrency(stats?.pendingInvoicesTotal || 0)}
          color={FINANCE_COLORS.pending}
        />
        <StatCard
          label="Costes pendientes"
          value={formatShortCurrency(stats?.pendingCostsTotal || 0)}
          color={FINANCE_COLORS.costs}
        />
        <StatCard
          label="Renovaciones próximas"
          value={stats?.renewalsDue || 0}
          color={FINANCE_COLORS.renewals}
        />
      </div>
      
      {/* Two column layout */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Facturas recientes</CardTitle>
              <Link to="/app/finance/invoices" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todas <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentInvoices.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay facturas</p>
            ) : (
              <div className="space-y-3">
                {recentInvoices.slice(0, 5).map(invoice => (
                  <Link
                    key={invoice.id}
                    to={`/app/finance/invoices/${invoice.id}`}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{invoice.invoice_number}</p>
                      <p className="text-xs text-muted-foreground">{invoice.client_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(invoice.total)}</p>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${INVOICE_STATUSES[invoice.status].color}20`,
                          color: INVOICE_STATUSES[invoice.status].color 
                        }}
                      >
                        {INVOICE_STATUSES[invoice.status].label}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
        
        {/* Recent Costs */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Costes recientes</CardTitle>
              <Link to="/app/finance/costs" className="text-sm text-primary hover:underline flex items-center gap-1">
                Ver todos <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </CardHeader>
          <CardContent>
            {recentCosts.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No hay costes registrados</p>
            ) : (
              <div className="space-y-3">
                {recentCosts.slice(0, 5).map(cost => (
                  <div
                    key={cost.id}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted"
                  >
                    <div>
                      <p className="text-sm font-medium">{cost.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {cost.matter?.reference} · {format(new Date(cost.cost_date), 'dd MMM', { locale: es })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{formatCurrency(cost.total_amount || 0)}</p>
                      <span 
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{ 
                          backgroundColor: `${COST_STATUSES[cost.status].color}20`,
                          color: COST_STATUSES[cost.status].color 
                        }}
                      >
                        {COST_STATUSES[cost.status].label}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* Upcoming Renewals */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Próximas renovaciones</CardTitle>
            <Link to="/app/finance/renewals" className="text-sm text-primary hover:underline flex items-center gap-1">
              Ver calendario <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {renewals.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No hay renovaciones próximas</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-4">
              {renewals.slice(0, 6).map(renewal => (
                <Link
                  key={renewal.id}
                  to={`/app/docket/${renewal.matter_id}`}
                  className="p-3 rounded-lg border hover:border-primary transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">{renewal.matter?.reference}</span>
                    <span className="text-sm font-bold text-green-600">{formatCurrency(renewal.total_estimate || 0)}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{renewal.matter?.mark_name || renewal.matter?.title}</p>
                  <p className="text-xs text-orange-600 mt-1">
                    Vence: {format(new Date(renewal.due_date), 'dd MMM yyyy', { locale: es })}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  color 
}: { 
  label: string; 
  value: number | string; 
  color: string;
}) {
  const numericValue = typeof value === 'number' ? value : 0;
  const hasValue = numericValue > 0 || (typeof value === 'string' && value !== '€0');
  
  return (
    <Card 
      className="border border-black/[0.06] rounded-[14px] hover:border-[rgba(0,180,216,0.15)] transition-colors"
      style={{ background: '#f1f4f9' }}
    >
      <CardContent className="pt-6">
        <div className="flex items-center gap-3">
          <NeoBadge
            value={value}
            color={hasValue ? color : '#94a3b8'}
            size="md"
          />
          <div>
            <p 
              className="text-[11px] font-semibold uppercase tracking-wide"
              style={{ color: '#0a2540' }}
            >
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
