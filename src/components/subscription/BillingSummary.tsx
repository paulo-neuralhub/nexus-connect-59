// ============================================================
// IP-NEXUS - Billing Summary Component
// ============================================================

import { CreditCard, Calendar, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Subscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/format';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface Props {
  subscription: Subscription;
  totalMonthly: number;
  onManagePayment: () => void;
  isLoadingPortal?: boolean;
}

export function BillingSummary({ subscription, totalMonthly, onManagePayment, isLoadingPortal }: Props) {
  const price = subscription.price;
  const items = subscription.items || [];

  const formatDate = (date: string | null) => {
    if (!date) return '---';
    return format(new Date(date), "d 'de' MMMM 'de' yyyy", { locale: es });
  };

  // Get payment method info from metadata
  const paymentMethodLast4 = subscription.stripe_metadata?.payment_method_last4 as string || '****';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Resumen de Facturación
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Plan {subscription.product?.name}</span>
            <span>
              {price ? formatCurrency(price.price, price.currency) : '---'}/mes
            </span>
          </div>

          {items.map((item) => (
            <div key={item.id} className="flex justify-between text-sm">
              <span>Add-on {item.product?.name}</span>
              <span>
                {item.price ? formatCurrency(item.price.price, item.price.currency || 'EUR') : '---'}/mes
              </span>
            </div>
          ))}

          <Separator className="my-2" />

          <div className="flex justify-between font-semibold">
            <span>TOTAL MENSUAL</span>
            <span className="text-primary">{formatCurrency(totalMonthly, 'EUR')}/mes</span>
          </div>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span>Próxima factura: {formatDate(subscription.next_invoice_date)}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <CreditCard className="h-4 w-4 text-muted-foreground" />
            <span>Método de pago: •••• {paymentMethodLast4}</span>
          </div>
        </div>

        <Button
          variant="outline"
          className="w-full"
          onClick={onManagePayment}
          disabled={isLoadingPortal}
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          {isLoadingPortal ? 'Abriendo...' : 'Gestionar método de pago'}
        </Button>
      </CardContent>
    </Card>
  );
}
