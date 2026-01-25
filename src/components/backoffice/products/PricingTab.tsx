// ============================================================
// IP-NEXUS BACKOFFICE - Pricing Overview Tab
// ============================================================

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProducts } from '@/hooks/backoffice';
import { formatCurrency } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

interface ProductWithPrices {
  id: string;
  code: string;
  name: string;
  product_type: string;
  product_prices: {
    billing_period: string;
    price: number;
    currency: string;
    stripe_price_id: string | null;
  }[];
}

export function PricingTab() {
  const { data: productsWithPrices, isLoading } = useQuery({
    queryKey: ['backoffice-pricing-overview'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          product_type,
          product_prices(billing_period, price, currency, stripe_price_id)
        `)
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as unknown as ProductWithPrices[];
    },
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  const plans = productsWithPrices?.filter(p => p.product_type === 'plan') ?? [];
  const modules = productsWithPrices?.filter(p => p.product_type === 'module_standalone') ?? [];
  const addons = productsWithPrices?.filter(p => p.product_type === 'addon') ?? [];

  const getPrice = (product: ProductWithPrices, period: string) => {
    const priceInfo = product.product_prices?.find(p => p.billing_period === period);
    return priceInfo?.price ?? 0;
  };

  const hasStripeId = (product: ProductWithPrices, period: string) => {
    const priceInfo = product.product_prices?.find(p => p.billing_period === period);
    return !!priceInfo?.stripe_price_id;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-semibold">Resumen de Precios</h2>
        <p className="text-sm text-muted-foreground">
          Vista general de todos los precios configurados
        </p>
      </div>

      {/* Plans Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Planes</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="p-3">Plan</th>
                <th className="p-3 text-right">Mensual</th>
                <th className="p-3 text-right">Anual</th>
                <th className="p-3 text-center">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {plans.map(plan => (
                <tr key={plan.id} className="border-b">
                  <td className="p-3 font-medium">{plan.name}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(getPrice(plan, 'monthly'))}/mes
                  </td>
                  <td className="p-3 text-right">
                    {formatCurrency(getPrice(plan, 'yearly'))}/año
                    <span className="text-xs text-muted-foreground ml-1">
                      ({formatCurrency(getPrice(plan, 'yearly') / 12)}/mes)
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {hasStripeId(plan, 'monthly') && hasStripeId(plan, 'yearly') ? (
                      <Badge variant="default" className="bg-green-500">Conectado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Modules Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Módulos Standalone</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="p-3">Módulo</th>
                <th className="p-3 text-right">Precio</th>
                <th className="p-3 text-center">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {modules.map(module => (
                <tr key={module.id} className="border-b">
                  <td className="p-3 font-medium">{module.name}</td>
                  <td className="p-3 text-right">
                    {formatCurrency(getPrice(module, 'monthly'))}/mes
                  </td>
                  <td className="p-3 text-center">
                    {hasStripeId(module, 'monthly') ? (
                      <Badge variant="default" className="bg-green-500">Conectado</Badge>
                    ) : (
                      <Badge variant="secondary">Pendiente</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Addons Pricing */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add-ons</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-muted-foreground border-b">
                <th className="p-3">Add-on</th>
                <th className="p-3 text-right">Precio</th>
                <th className="p-3 text-center">Stripe</th>
              </tr>
            </thead>
            <tbody>
              {addons.map(addon => (
                <tr key={addon.id} className="border-b">
                  <td className="p-3 font-medium">{addon.name}</td>
                  <td className="p-3 text-right">
                    {getPrice(addon, 'monthly') > 0 
                      ? `${formatCurrency(getPrice(addon, 'monthly'))}/mes`
                      : '-'
                    }
                  </td>
                  <td className="p-3 text-center">
                    {hasStripeId(addon, 'monthly') ? (
                      <Badge variant="default" className="bg-green-500">Conectado</Badge>
                    ) : getPrice(addon, 'monthly') > 0 ? (
                      <Badge variant="secondary">Pendiente</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
