import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePlatformRevenue } from '@/hooks/backoffice/usePlatformFinance';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  pending_review: { label: 'Pendiente', variant: 'secondary' },
  confirmed: { label: 'Confirmado', variant: 'default' },
  posted: { label: 'Contabilizado', variant: 'outline' },
  rejected: { label: 'Rechazado', variant: 'destructive' },
};

const TYPE_LABELS: Record<string, string> = {
  subscription: 'Suscripción',
  marketplace_commission: 'Comisión Marketplace',
  addon_purchase: 'Add-on',
  professional_services: 'Servicios profesionales',
  other: 'Otro',
};

export function PlatformRevenueTab() {
  const { data: revenue = [], isLoading } = usePlatformRevenue();

  if (isLoading) return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;

  const totalGross = revenue.filter(r => r.status !== 'rejected').reduce((s, r) => s + r.gross_amount, 0);
  const totalNet = revenue.filter(r => r.status !== 'rejected').reduce((s, r) => s + (r.net_amount || r.gross_amount), 0);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos brutos</p>
            <p className="text-2xl font-bold">€{totalGross.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Ingresos netos</p>
            <p className="text-2xl font-bold">€{totalNet.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Registros</p>
            <p className="text-2xl font-bold">{revenue.length}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Todos los ingresos</CardTitle></CardHeader>
        <CardContent>
          {revenue.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Sin ingresos registrados</p>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-3">Tipo</th>
                    <th className="text-left p-3">Descripción</th>
                    <th className="text-left p-3">Periodo</th>
                    <th className="text-right p-3">Bruto</th>
                    <th className="text-right p-3">Neto</th>
                    <th className="text-center p-3">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {revenue.map(r => {
                    const badge = STATUS_BADGE[r.status] || STATUS_BADGE.pending_review;
                    return (
                      <tr key={r.id} className="border-t">
                        <td className="p-3">{TYPE_LABELS[r.revenue_type] || r.revenue_type}</td>
                        <td className="p-3 text-muted-foreground">{r.description || '—'}</td>
                        <td className="p-3">{r.period_month || format(new Date(r.revenue_date), 'yyyy-MM')}</td>
                        <td className="p-3 text-right font-mono">€{r.gross_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-right font-mono">€{(r.net_amount || r.gross_amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}</td>
                        <td className="p-3 text-center">
                          <Badge variant={badge.variant}>{badge.label}</Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
