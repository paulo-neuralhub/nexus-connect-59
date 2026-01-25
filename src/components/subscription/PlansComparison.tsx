// ============================================================
// IP-NEXUS - Plans Comparison Component
// ============================================================

import { Check, X, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/lib/format';

interface PlanFeature {
  name: string;
  starter: boolean | string;
  professional: boolean | string;
  enterprise: boolean | string;
}

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
  priceYearly: number;
  description: string;
  features: Record<string, boolean | string>;
  highlighted?: boolean;
}

interface Props {
  plans: Plan[];
  currentPlanId?: string;
  billingCycle: 'monthly' | 'yearly';
  onChangePlan: (planId: string, priceId: string) => void;
}

const defaultPlans: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    priceMonthly: 29,
    priceYearly: 278,
    description: 'Para empezar',
    features: {
      users: '1 usuario',
      matters: 'Ilimitados',
      offices: 'OEPM',
      crm: false,
      api: false,
      genius: false,
    },
  },
  {
    id: 'professional',
    name: 'Professional',
    priceMonthly: 99,
    priceYearly: 950,
    description: 'Para equipos',
    highlighted: true,
    features: {
      users: '5 usuarios',
      matters: 'Ilimitados',
      offices: 'OEPM + EUIPO',
      crm: true,
      api: true,
      genius: false,
    },
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    priceMonthly: 299,
    priceYearly: 2868,
    description: 'Para grandes organizaciones',
    features: {
      users: 'Ilimitados',
      matters: 'Ilimitados',
      offices: 'Todas incluidas',
      crm: true,
      api: true,
      genius: true,
    },
  },
];

const featureLabels: Record<string, string> = {
  users: 'Usuarios',
  matters: 'Expedientes',
  offices: 'Oficinas',
  crm: 'CRM',
  api: 'API',
  genius: 'IP-GENIUS',
};

export function PlansComparison({
  plans = defaultPlans,
  currentPlanId,
  billingCycle,
  onChangePlan,
}: Props) {
  const renderFeatureValue = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="h-5 w-5 text-primary" />
      ) : (
        <X className="h-5 w-5 text-muted-foreground" />
      );
    }
    return <span className="text-sm">{value}</span>;
  };

  return (
    <div className="grid md:grid-cols-3 gap-6">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentPlanId;
        const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
        const monthlyEquivalent = billingCycle === 'yearly' ? Math.round(plan.priceYearly / 12) : plan.priceMonthly;

        return (
          <Card
            key={plan.id}
            className={cn(
              'relative',
              plan.highlighted && 'border-primary shadow-lg',
              isCurrent && 'ring-2 ring-primary'
            )}
          >
            {plan.highlighted && (
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <Badge className="bg-primary">
                  <Star className="h-3 w-3 mr-1" />
                  Popular
                </Badge>
              </div>
            )}

            {isCurrent && (
              <div className="absolute -top-3 right-4">
                <Badge variant="secondary">Actual</Badge>
              </div>
            )}

            <CardHeader className="text-center pb-2">
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <p className="text-sm text-muted-foreground">{plan.description}</p>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="text-center">
                <span className="text-4xl font-bold">
                  {formatCurrency(monthlyEquivalent, 'EUR')}
                </span>
                <span className="text-muted-foreground">/mes</span>
                {billingCycle === 'yearly' && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Facturado anualmente ({formatCurrency(price, 'EUR')})
                  </p>
                )}
              </div>

              <div className="space-y-3 pt-4 border-t">
                {Object.entries(plan.features).map(([key, value]) => (
                  <div key={key} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {featureLabels[key] || key}
                    </span>
                    {renderFeatureValue(value)}
                  </div>
                ))}
              </div>

              <div className="pt-4">
                {isCurrent ? (
                  <Button disabled className="w-full">
                    Plan actual
                  </Button>
                ) : currentPlanId && plans.findIndex(p => p.id === plan.id) < plans.findIndex(p => p.id === currentPlanId) ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => onChangePlan(plan.id, plan.id)}
                  >
                    Downgrade
                  </Button>
                ) : (
                  <Button
                    className="w-full"
                    onClick={() => onChangePlan(plan.id, plan.id)}
                  >
                    Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
