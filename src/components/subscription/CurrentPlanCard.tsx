// ============================================================
// IP-NEXUS - Current Plan Card Component
// ============================================================

import { Star, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Subscription } from '@/hooks/useSubscription';
import { formatCurrency } from '@/lib/format';

interface Props {
  subscription: Subscription;
  onChangePlan: () => void;
  onSwitchToAnnual?: () => void;
}

export function CurrentPlanCard({ subscription, onChangePlan, onSwitchToAnnual }: Props) {
  const plan = subscription.product;
  const price = subscription.price;
  const isMonthly = price?.billing_period === 'monthly';

  const planFeatures = [
    '5 usuarios',
    'Expedientes ilimitados',
    'Oficinas OEPM + EUIPO',
    'CRM completo',
    'API acceso',
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Plan Actual</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-4 p-4 rounded-lg border bg-muted/30">
          <div className="p-2 rounded-lg bg-primary/10">
            <Star className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h3 className="text-xl font-bold">{plan?.name || 'Plan'}</h3>
              <Badge variant="secondary">
                {subscription.billing_cycle === 'yearly' ? 'Anual' : 'Mensual'}
              </Badge>
            </div>
            <p className="text-2xl font-bold text-primary mt-1">
              {price ? formatCurrency(price.price, price.currency) : '---'}
              <span className="text-sm font-normal text-muted-foreground">
                /{isMonthly ? 'mes' : 'año'}
              </span>
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Facturación {isMonthly ? 'mensual' : 'anual'}
            </p>

            <div className="mt-4">
              <p className="text-sm font-medium mb-2">Incluye:</p>
              <ul className="space-y-1">
                {planFeatures.map((feature, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Check className="h-4 w-4 text-primary" />
                    {feature}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={onChangePlan}>
            Cambiar plan
          </Button>
          {isMonthly && onSwitchToAnnual && (
            <Button variant="secondary" onClick={onSwitchToAnnual}>
              Cambiar a facturación anual (20% dto)
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
