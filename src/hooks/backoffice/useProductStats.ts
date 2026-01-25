// ============================================================
// IP-NEXUS BACKOFFICE - Product Stats Hook
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProductStats {
  productId: string;
  productCode: string;
  productName: string;
  productType: string;
  activeSubscribers: number;
  mrr: number;
  arr: number;
  churnRate: number;
  growthRate: number;
}

export interface OverallStats {
  totalMrr: number;
  totalArr: number;
  totalSubscribers: number;
  averageChurn: number;
  mrrByProduct: { productCode: string; productName: string; mrr: number }[];
  subscribersByPlan: { planCode: string; planName: string; count: number }[];
}

// Mock stats for now - in production these would come from actual subscription data
export function useProductStats(productId: string | undefined) {
  return useQuery({
    queryKey: ['backoffice-product-stats', productId],
    queryFn: async (): Promise<ProductStats | null> => {
      if (!productId) return null;

      // Get product info
      const { data: product, error } = await supabase
        .from('products')
        .select('id, code, name, product_type')
        .eq('id', productId)
        .single();

      if (error) throw error;

      // Get price for MRR calculation
      const { data: prices } = await supabase
        .from('product_prices')
        .select('price, billing_period')
        .eq('product_id', productId)
        .eq('billing_period', 'monthly')
        .maybeSingle();

      const monthlyPrice = prices?.price ?? 0;

      // Mock subscription counts - replace with real data
      const mockCounts: Record<string, number> = {
        'plan_starter': 45,
        'plan_professional': 89,
        'plan_enterprise': 12,
        'module_spider': 23,
        'module_docket': 34,
        'module_genius': 18,
      };

      const subscriberCount = mockCounts[product.code] ?? Math.floor(Math.random() * 50);

      return {
        productId: product.id,
        productCode: product.code,
        productName: product.name,
        productType: product.product_type,
        activeSubscribers: subscriberCount,
        mrr: subscriberCount * monthlyPrice,
        arr: subscriberCount * monthlyPrice * 12,
        churnRate: Math.random() * 5, // Mock churn 0-5%
        growthRate: Math.random() * 20 - 5, // Mock growth -5% to 15%
      };
    },
    enabled: !!productId,
  });
}

export function useAllProductStats() {
  return useQuery({
    queryKey: ['backoffice-all-product-stats'],
    queryFn: async (): Promise<OverallStats> => {
      // Get all products with prices
      const { data: products, error } = await supabase
        .from('products')
        .select(`
          id,
          code,
          name,
          product_type,
          product_prices(price, billing_period)
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Mock subscription data
      const mockCounts: Record<string, number> = {
        'plan_starter': 45,
        'plan_professional': 89,
        'plan_enterprise': 12,
        'module_spider': 23,
        'module_docket': 34,
        'module_genius': 18,
        'addon_office_euipo': 15,
        'addon_office_wipo': 8,
        'addon_office_uspto': 12,
      };

      const mrrByProduct: OverallStats['mrrByProduct'] = [];
      const subscribersByPlan: OverallStats['subscribersByPlan'] = [];
      let totalMrr = 0;
      let totalSubscribers = 0;

      for (const product of (products ?? [])) {
        const prices = product.product_prices as any[];
        const monthlyPrice = prices?.find((p: any) => p.billing_period === 'monthly')?.price ?? 0;
        const count = mockCounts[product.code] ?? 0;
        const mrr = count * monthlyPrice;

        if (mrr > 0) {
          mrrByProduct.push({
            productCode: product.code,
            productName: product.name,
            mrr,
          });
        }

        if (product.product_type === 'plan' && count > 0) {
          subscribersByPlan.push({
            planCode: product.code,
            planName: product.name,
            count,
          });
          totalSubscribers += count;
        }

        totalMrr += mrr;
      }

      // Sort by MRR descending
      mrrByProduct.sort((a, b) => b.mrr - a.mrr);
      subscribersByPlan.sort((a, b) => b.count - a.count);

      return {
        totalMrr,
        totalArr: totalMrr * 12,
        totalSubscribers,
        averageChurn: 2.1, // Mock average churn
        mrrByProduct,
        subscribersByPlan,
      };
    },
  });
}

export function useMRRByProduct() {
  const { data: stats } = useAllProductStats();
  return stats?.mrrByProduct ?? [];
}
