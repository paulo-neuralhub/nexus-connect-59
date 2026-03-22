import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Check, X, CheckCheck } from 'lucide-react';
import {
  usePlatformCosts,
  usePlatformRevenue,
  useConfirmPlatformCost,
  useRejectPlatformCost,
  useConfirmPlatformRevenue,
  useRejectPlatformRevenue,
  useConfirmAllPending,
} from '@/hooks/backoffice/usePlatformFinance';
import { Spinner } from '@/components/ui/spinner';

export function PlatformPendingTab() {
  const { data: pendingCosts = [], isLoading: costsLoading } = usePlatformCosts('pending_review');
  const { data: pendingRevenue = [], isLoading: revLoading } = usePlatformRevenue('pending_review');
  const confirmCost = useConfirmPlatformCost();
  const rejectCost = useRejectPlatformCost();
  const confirmRevenue = useConfirmPlatformRevenue();
  const rejectRevenue = useRejectPlatformRevenue();
  const confirmAll = useConfirmAllPending();

  if (costsLoading || revLoading) {
    return <div className="flex justify-center py-12"><Spinner className="h-8 w-8" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending Costs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Costes pendientes ({pendingCosts.length})</CardTitle>
          {pendingCosts.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => confirmAll.mutate('costs')}
              disabled={confirmAll.isPending}
            >
              <CheckCheck className="h-4 w-4" /> Confirmar todos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingCosts.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">✅ Sin costes pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingCosts.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Auto-capturado</Badge>
                      <span className="text-sm font-medium">{c.cost_category}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{c.description}</p>
                    <p className="text-xs text-muted-foreground">{c.period_start} → {c.period_end}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold">
                      €{(c.amount_eur || c.amount).toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                    </span>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => confirmCost.mutate({ id: c.id })}
                        disabled={confirmCost.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectCost.mutate(c.id)}
                        disabled={rejectCost.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pending Revenue */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Ingresos pendientes ({pendingRevenue.length})</CardTitle>
          {pendingRevenue.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => confirmAll.mutate('revenue')}
              disabled={confirmAll.isPending}
            >
              <CheckCheck className="h-4 w-4" /> Confirmar todos
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {pendingRevenue.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">✅ Sin ingresos pendientes</p>
          ) : (
            <div className="space-y-3">
              {pendingRevenue.map(r => (
                <div key={r.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="secondary">Auto-capturado</Badge>
                      <span className="text-sm font-medium">{r.revenue_type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.description || '—'}</p>
                    <p className="text-xs text-muted-foreground">{r.period_month || r.revenue_date}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-mono font-bold">€{r.gross_amount.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                      {r.stripe_fee > 0 && (
                        <p className="text-xs text-muted-foreground">Stripe: -€{r.stripe_fee.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => confirmRevenue.mutate(r.id)}
                        disabled={confirmRevenue.isPending}
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => rejectRevenue.mutate(r.id)}
                        disabled={rejectRevenue.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
