// ============================================================
// IP-NEXUS - Subscription Plans Page
// ============================================================

import { useState } from 'react';
import { ArrowLeft, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { PlansComparison } from '@/components/subscription';
import {
  useSubscription,
  useAvailablePlans,
  useAvailableAddons,
  useSubscriptionActions,
} from '@/hooks/useSubscription';
import { Link, useSearchParams } from 'react-router-dom';

export default function SubscriptionPlansPage() {
  const [searchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') || 'plans';
  
  const { data: subscription, isLoading: loadingSubscription } = useSubscription();
  const { data: plans = [], isLoading: loadingPlans } = useAvailablePlans();
  const { data: addons = [], isLoading: loadingAddons } = useAvailableAddons();
  const actions = useSubscriptionActions();

  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

  const isLoading = loadingSubscription || loadingPlans || loadingAddons;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  const handleChangePlan = (planId: string, priceId: string) => {
    // Find the actual price ID based on billing cycle
    const plan = plans.find((p) => p.id === planId);
    if (!plan) return;

    const price = (plan.prices as { id: string; billing_period: string }[])?.find(
      (pr) => pr.billing_period === billingCycle
    );
    
    if (price) {
      actions.changePlan.mutate({ newPriceId: price.id });
    }
  };

  const handleAddAddon = (addonId: string) => {
    const addon = addons.find((a) => a.id === addonId);
    if (!addon) return;

    const price = (addon.prices as { id: string; is_active: boolean }[])?.find((p) => p.is_active);
    if (price) {
      actions.addAddon.mutate({ addonPriceId: price.id });
    }
  };

  // Transform plans to the format expected by PlansComparison
  const formattedPlans = plans.map((plan) => {
    const monthlyPrice = (plan.prices as { price: number; billing_period: string }[])?.find(
      (p) => p.billing_period === 'monthly'
    );
    const yearlyPrice = (plan.prices as { price: number; billing_period: string }[])?.find(
      (p) => p.billing_period === 'yearly'
    );

    return {
      id: plan.id,
      name: plan.name,
      priceMonthly: monthlyPrice?.price || 0,
      priceYearly: yearlyPrice?.price || 0,
      description: plan.description || '',
      features: (plan.features as { feature_code: string; limit_value: number | null; feature_name: string }[])?.reduce(
        (acc, f) => ({
          ...acc,
          [f.feature_code]: f.limit_value !== null ? (f.limit_value > 0 ? f.limit_value.toString() : true) : f.feature_name,
        }),
        {}
      ) || {},
      highlighted: plan.name.toLowerCase().includes('professional'),
    };
  });

  // Filter addons by type
  const jurisdictionAddons = addons.filter((a) => a.product_type === 'jurisdiction');
  const moduleAddons = addons.filter((a) => a.product_type === 'addon');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/app/settings/subscription">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Planes Disponibles</h1>
          <p className="text-muted-foreground">Elige el plan que mejor se adapte a tus necesidades</p>
        </div>
      </div>

      <Tabs defaultValue={initialTab}>
        <TabsList>
          <TabsTrigger value="plans">Planes</TabsTrigger>
          <TabsTrigger value="addons">Oficinas</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
        </TabsList>

        <TabsContent value="plans" className="space-y-6 mt-6">
          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4">
            <Label
              className={billingCycle === 'monthly' ? 'font-medium' : 'text-muted-foreground'}
            >
              Mensual
            </Label>
            <Switch
              checked={billingCycle === 'yearly'}
              onCheckedChange={(checked) => setBillingCycle(checked ? 'yearly' : 'monthly')}
            />
            <div className="flex items-center gap-2">
              <Label
                className={billingCycle === 'yearly' ? 'font-medium' : 'text-muted-foreground'}
              >
                Anual
              </Label>
              <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                Ahorra 20%
              </span>
            </div>
          </div>

          {/* Plans Comparison */}
          <PlansComparison
            plans={formattedPlans}
            currentPlanId={subscription?.product_id || undefined}
            billingCycle={billingCycle}
            onChangePlan={handleChangePlan}
          />

          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="flex items-center gap-4 py-4">
              <Sparkles className="h-5 w-5 text-primary" />
              <p className="text-sm">
                💡 Ahorra <strong>20%</strong> con facturación anual. Cambia en cualquier momento.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="addons" className="space-y-6 mt-6">
          <p className="text-muted-foreground">
            Añade oficinas de propiedad intelectual adicionales para sincronizar tus expedientes.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {jurisdictionAddons.map((addon) => {
              const price = (addon.prices as { price: number; is_active: boolean }[])?.find((p) => p.is_active);
              const isActive = subscription?.items?.some((i) => i.product_id === addon.id);

              return (
                <Card key={addon.id} className={isActive ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{addon.name}</h3>
                        <p className="text-sm text-muted-foreground">{addon.description}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        +€{price?.price || 0}/mes
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      variant={isActive ? 'secondary' : 'default'}
                      disabled={isActive || actions.addAddon.isPending}
                      onClick={() => handleAddAddon(addon.id)}
                    >
                      {isActive ? 'Activo' : 'Añadir'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="modules" className="space-y-6 mt-6">
          <p className="text-muted-foreground">
            Potencia tu experiencia con módulos adicionales.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {moduleAddons.map((addon) => {
              const price = (addon.prices as { price: number; is_active: boolean }[])?.find((p) => p.is_active);
              const isActive = subscription?.items?.some((i) => i.product_id === addon.id);

              return (
                <Card key={addon.id} className={isActive ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-medium">{addon.name}</h3>
                        <p className="text-sm text-muted-foreground">{addon.description}</p>
                      </div>
                      <span className="text-lg font-bold text-primary">
                        +€{price?.price || 0}/mes
                      </span>
                    </div>
                    <Button
                      className="w-full mt-4"
                      variant={isActive ? 'secondary' : 'default'}
                      disabled={isActive || actions.addAddon.isPending}
                      onClick={() => handleAddAddon(addon.id)}
                    >
                      {isActive ? 'Activo' : 'Añadir'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
