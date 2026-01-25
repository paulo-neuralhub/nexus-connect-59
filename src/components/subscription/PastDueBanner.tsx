// ============================================================
// IP-NEXUS - Past Due Banner Component
// ============================================================

import { AlertTriangle, CreditCard, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/format';

interface Props {
  amount: number;
  currency: string;
  retryAttempts?: number;
  maxRetries?: number;
  nextRetryDate?: string;
  onUpdatePayment: () => void;
  onRetryPayment: () => void;
}

export function PastDueBanner({
  amount,
  currency,
  retryAttempts = 1,
  maxRetries = 3,
  nextRetryDate,
  onUpdatePayment,
  onRetryPayment,
}: Props) {
  return (
    <Card className="border-warning bg-warning/5">
      <CardContent className="pt-6">
        <div className="flex items-start gap-4">
          <div className="p-2 rounded-lg bg-warning/10">
            <AlertTriangle className="h-6 w-6 text-warning" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-warning">Pago Pendiente</h3>
            <p className="text-muted-foreground mt-1">
              Tu último pago de <strong>{formatCurrency(amount, currency)}</strong> no se pudo procesar.
            </p>
            <p className="text-muted-foreground mt-1">
              Actualiza tu método de pago para evitar la suspensión.
            </p>

            <div className="mt-4 space-y-1">
              <p className="text-sm">
                <strong>Intentos:</strong> {retryAttempts}/{maxRetries}
              </p>
              {nextRetryDate && (
                <p className="text-sm text-muted-foreground">
                  Próximo reintento: {nextRetryDate}
                </p>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Button onClick={onUpdatePayment}>
                <CreditCard className="h-4 w-4 mr-2" />
                Actualizar método de pago
              </Button>
              <Button variant="outline" onClick={onRetryPayment}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Reintentar pago ahora
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
