// ============================================================
// IP-NEXUS BACKOFFICE - Product Prices Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProductPrice } from './useProducts';

export function useProductPrices(productId: string | undefined) {
  return useQuery({
    queryKey: ['backoffice-product-prices', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', productId)
        .order('billing_period');

      if (error) throw error;
      return (data ?? []) as ProductPrice[];
    },
    enabled: !!productId,
  });
}

export function useUpsertProductPrice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProductPrice> & { product_id: string }) => {
      const { data: price, error } = await supabase
        .from('product_prices')
        .upsert(data as any, { 
          onConflict: 'product_id,billing_period,currency',
        })
        .select()
        .single();

      if (error) throw error;
      return price as ProductPrice;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-prices', variables.product_id] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.product_id] });
      toast.success('Precio guardado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateProductPrices() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      productId, 
      prices 
    }: { 
      productId: string; 
      prices: Partial<ProductPrice>[] 
    }) => {
      // Upsert all prices
      const results = await Promise.all(
        prices.map(async (price) => {
          const { data, error } = await supabase
            .from('product_prices')
            .upsert({
              ...price,
              product_id: productId,
            } as any, {
              onConflict: 'product_id,billing_period,currency',
            })
            .select()
            .single();

          if (error) throw error;
          return data;
        })
      );

      return results as ProductPrice[];
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-prices', variables.productId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.productId] });
      toast.success('Precios actualizados');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteProductPrice() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_prices')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-prices', productId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', productId] });
      toast.success('Precio eliminado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
