// ============================================================
// IP-NEXUS - Subscription Hook for Clients
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { toast } from 'sonner';

export interface Subscription {
  id: string;
  organization_id: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  product_id: string | null;
  price_id: string | null;
  status: 'trialing' | 'active' | 'past_due' | 'canceled' | 'unpaid' | 'incomplete';
  trial_start: string | null;
  trial_end: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  canceled_at: string | null;
  cancel_at_period_end: boolean;
  billing_cycle: 'monthly' | 'yearly' | null;
  next_invoice_date: string | null;
  stripe_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  product?: {
    id: string;
    name: string;
    description: string | null;
  };
  price?: {
    id: string;
    price: number;
    currency: string;
    billing_period: string;
  };
  items?: SubscriptionItem[];
}

export interface SubscriptionItem {
  id: string;
  subscription_id: string;
  stripe_subscription_item_id: string | null;
  product_id: string | null;
  price_id: string | null;
  quantity: number;
  status: string;
  product?: {
    id: string;
    name: string;
    description: string | null;
    product_type: string;
  };
  price?: {
    id: string;
    price: number;
    currency: string;
    billing_period: string;
  };
}

export interface SubscriptionInvoice {
  id: string;
  organization_id: string | null;
  stripe_invoice_id: string | null;
  invoice_number: string | null;
  hosted_invoice_url: string | null;
  invoice_pdf_url: string | null;
  subtotal_cents: number | null;
  tax_cents: number | null;
  total_cents: number | null;
  amount_paid_cents: number | null;
  amount_due_cents: number | null;
  currency: string;
  status: string | null;
  period_start: string | null;
  period_end: string | null;
  due_date: string | null;
  paid_at: string | null;
  lines: Record<string, unknown> | null;
  created_at: string;
}

export function useSubscription() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['my-subscription', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return null;

      const { data, error } = await supabase
        .from('tenant_subscriptions')
        .select(`
          *,
          product:products(id, name, description),
          price:product_prices(id, price, currency, billing_period)
        `)
        .eq('organization_id', currentOrganization.id)
        .maybeSingle();

      if (error) throw error;
      if (!data) return null;

      // Fetch subscription items (add-ons)
      const { data: items } = await supabase
        .from('subscription_items')
        .select(`
          *,
          product:products(id, name, description, product_type),
          price:product_prices(id, price, currency, billing_period)
        `)
        .eq('subscription_id', data.id)
        .eq('status', 'active');

      return {
        ...data,
        items: items || [],
      } as unknown as Subscription;
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useSubscriptionStatus() {
  const { data: subscription } = useSubscription();

  const isTrialing = subscription?.status === 'trialing';
  const isActive = subscription?.status === 'active';
  const isPastDue = subscription?.status === 'past_due';
  const isCanceled = subscription?.status === 'canceled' || subscription?.cancel_at_period_end;
  const isUnpaid = subscription?.status === 'unpaid';

  const trialDaysRemaining = () => {
    if (!isTrialing || !subscription?.trial_end) return 0;
    const endDate = new Date(subscription.trial_end);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const periodDaysRemaining = () => {
    if (!subscription?.current_period_end) return 0;
    const endDate = new Date(subscription.current_period_end);
    const now = new Date();
    const diff = endDate.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  const trialProgress = () => {
    if (!isTrialing || !subscription?.trial_start || !subscription?.trial_end) return 0;
    const start = new Date(subscription.trial_start).getTime();
    const end = new Date(subscription.trial_end).getTime();
    const now = new Date().getTime();
    const total = end - start;
    const elapsed = now - start;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  const getTotalMonthly = () => {
    if (!subscription) return 0;
    let total = 0;

    // Base plan price
    if (subscription.price?.price) {
      if (subscription.price.billing_period === 'yearly') {
        total += Math.round(subscription.price.price / 12);
      } else {
        total += subscription.price.price;
      }
    }

    // Add-ons
    subscription.items?.forEach((item) => {
      if (item.price?.price) {
        if (item.price.billing_period === 'yearly') {
          total += Math.round(item.price.price / 12);
        } else {
          total += item.price.price * (item.quantity || 1);
        }
      }
    });

    return total;
  };

  return {
    subscription,
    isTrialing,
    isActive,
    isPastDue,
    isCanceled,
    isUnpaid,
    trialDaysRemaining: trialDaysRemaining(),
    periodDaysRemaining: periodDaysRemaining(),
    trialProgress: trialProgress(),
    totalMonthly: getTotalMonthly(),
  };
}

export function useSubscriptionInvoices() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['my-subscription-invoices', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('stripe_invoices')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []) as unknown as SubscriptionInvoice[];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function useSubscriptionActions() {
  const queryClient = useQueryClient();
  const { currentOrganization } = useOrganization();

  const changePlan = useMutation({
    mutationFn: async ({ newPriceId }: { newPriceId: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-change-plan', {
        body: { tenantId: currentOrganization?.id, newPriceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Plan actualizado correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al cambiar el plan: ${error.message}`);
    },
  });

  const addAddon = useMutation({
    mutationFn: async ({ addonPriceId }: { addonPriceId: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-add-addon', {
        body: { tenantId: currentOrganization?.id, addonPriceId },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Add-on añadido correctamente');
    },
    onError: (error: Error) => {
      toast.error(`Error al añadir add-on: ${error.message}`);
    },
  });

  const cancelAddon = useMutation({
    mutationFn: async ({ addonId, cancelAtPeriodEnd = true }: { addonId: string; cancelAtPeriodEnd?: boolean }) => {
      const { data, error } = await supabase.functions.invoke('stripe-cancel-addon', {
        body: { tenantId: currentOrganization?.id, addonId, cancelAtPeriodEnd },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Add-on cancelado');
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar add-on: ${error.message}`);
    },
  });

  const cancelSubscription = useMutation({
    mutationFn: async ({ reason, feedback }: { reason?: string; feedback?: string }) => {
      const { data, error } = await supabase.functions.invoke('stripe-cancel-subscription', {
        body: { tenantId: currentOrganization?.id, reason, feedback, cancelAtPeriodEnd: true },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Suscripción cancelada. Seguirás teniendo acceso hasta el final del período.');
    },
    onError: (error: Error) => {
      toast.error(`Error al cancelar: ${error.message}`);
    },
  });

  const reactivateSubscription = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-reactivate', {
        body: { tenantId: currentOrganization?.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-subscription'] });
      toast.success('Suscripción reactivada');
    },
    onError: (error: Error) => {
      toast.error(`Error al reactivar: ${error.message}`);
    },
  });

  const openCustomerPortal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('stripe-customer-portal', {
        body: { tenantId: currentOrganization?.id },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      if (data?.url) {
        window.open(data.url, '_blank');
      }
    },
    onError: (error: Error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  return {
    changePlan,
    addAddon,
    cancelAddon,
    cancelSubscription,
    reactivateSubscription,
    openCustomerPortal,
  };
}

export function useAvailablePlans() {
  return useQuery({
    queryKey: ['available-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          product_type,
          is_active,
          prices:product_prices(
            id,
            price,
            currency,
            billing_period,
            is_active,
            stripe_price_id
          ),
          features:product_features(
            id,
            feature_code,
            feature_name,
            feature_description,
            limit_value,
            limit_unit,
            is_highlighted
          )
        `)
        .eq('is_active', true)
        .eq('product_type', 'plan')
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}

export function useAvailableAddons() {
  return useQuery({
    queryKey: ['available-addons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id,
          name,
          description,
          product_type,
          is_active,
          prices:product_prices(
            id,
            price,
            currency,
            billing_period,
            is_active,
            stripe_price_id
          ),
          features:product_features(
            id,
            feature_code,
            feature_name,
            feature_description,
            limit_value,
            limit_unit,
            is_highlighted
          )
        `)
        .eq('is_active', true)
        .in('product_type', ['addon', 'jurisdiction'])
        .order('name');

      if (error) throw error;
      return data || [];
    },
  });
}
