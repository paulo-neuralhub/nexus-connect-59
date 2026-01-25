// ============================================================
// IP-NEXUS BACKOFFICE - Product Addons Config Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProductAddon, Product, ProductPrice } from './useProducts';

export interface AddonWithDetails extends ProductAddon {
  product: Product;
  prices: ProductPrice[];
}

export function useProductAddonsConfig() {
  return useQuery({
    queryKey: ['backoffice-product-addons-config'],
    queryFn: async () => {
      // Get all addon products with their configurations
      const { data: addons, error } = await supabase
        .from('products')
        .select(`
          *,
          product_addons(*),
          product_prices(*)
        `)
        .in('product_type', ['addon', 'module_standalone'])
        .eq('is_active', true)
        .order('sort_order');

      if (error) throw error;

      return (addons ?? []).map((addon: any) => ({
        product: {
          id: addon.id,
          code: addon.code,
          name: addon.name,
          description: addon.description,
          product_type: addon.product_type,
          module_code: addon.module_code,
          icon: addon.icon,
          color: addon.color,
          image_url: addon.image_url,
          is_active: addon.is_active,
          is_visible: addon.is_visible,
          is_popular: addon.is_popular,
          sort_order: addon.sort_order,
          landing_url: addon.landing_url,
          created_at: addon.created_at,
          updated_at: addon.updated_at,
        } as Product,
        prices: (addon.product_prices ?? []) as ProductPrice[],
        ...(addon.product_addons?.[0] ?? {
          id: '',
          addon_product_id: addon.id,
          available_for_plans: [],
          included_in_plans: [],
          requires_product_id: null,
          incompatible_with: [],
          min_plan_required: null,
          created_at: addon.created_at,
          updated_at: addon.updated_at,
        }),
      })) as AddonWithDetails[];
    },
  });
}

export function useUpsertAddonConfig() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<ProductAddon> & { addon_product_id: string }) => {
      const { data: config, error } = await supabase
        .from('product_addons')
        .upsert(data as any, {
          onConflict: 'addon_product_id',
        })
        .select()
        .single();

      if (error) throw error;
      return config as ProductAddon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-addons-config'] });
      toast.success('Configuración de addon guardada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
