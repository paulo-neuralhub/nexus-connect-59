// ============================================================
// IP-NEXUS BACKOFFICE - Products Management Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export type ProductType = 'plan' | 'module_standalone' | 'addon' | 'feature';

export interface Product {
  id: string;
  code: string;
  name: string;
  description: string | null;
  product_type: ProductType;
  module_code: string | null;
  icon: string | null;
  color: string | null;
  image_url: string | null;
  is_active: boolean;
  is_visible: boolean;
  is_popular: boolean;
  sort_order: number;
  landing_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductPrice {
  id: string;
  product_id: string;
  billing_period: 'monthly' | 'yearly' | 'one_time';
  price: number;
  currency: string;
  discount_percent: number;
  stripe_price_id: string | null;
  stripe_product_id: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductFeature {
  id: string;
  product_id: string;
  feature_code: string;
  feature_name: string;
  feature_description: string | null;
  limit_value: number | null;
  limit_unit: string | null;
  is_highlighted: boolean;
  sort_order: number;
  created_at: string;
}

export interface PlanInclusion {
  id: string;
  plan_product_id: string;
  included_product_id: string;
  limit_override: number | null;
  created_at: string;
  included_product?: Product;
}

export interface ProductAddon {
  id: string;
  addon_product_id: string;
  available_for_plans: string[];
  included_in_plans: string[];
  requires_product_id: string | null;
  incompatible_with: string[];
  min_plan_required: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
  prices?: ProductPrice[];
}

export interface ProductWithDetails extends Product {
  prices: ProductPrice[];
  features: ProductFeature[];
  inclusions?: PlanInclusion[];
  addon_config?: ProductAddon;
}

interface ProductFilters {
  type?: ProductType | ProductType[];
  isActive?: boolean;
  search?: string;
}

// ============ QUERIES ============

export function useProducts(filters?: ProductFilters) {
  return useQuery({
    queryKey: ['backoffice-products', filters],
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .order('sort_order', { ascending: true });

      if (filters?.type) {
        if (Array.isArray(filters.type)) {
          query = query.in('product_type', filters.type);
        } else {
          query = query.eq('product_type', filters.type);
        }
      }

      if (filters?.isActive !== undefined) {
        query = query.eq('is_active', filters.isActive);
      }

      if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,code.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ['backoffice-product', id],
    queryFn: async () => {
      if (!id) return null;

      const { data: product, error: productError } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (productError) throw productError;

      // Fetch prices
      const { data: prices } = await supabase
        .from('product_prices')
        .select('*')
        .eq('product_id', id)
        .order('billing_period');

      // Fetch features
      const { data: features } = await supabase
        .from('product_features')
        .select('*')
        .eq('product_id', id)
        .order('sort_order');

      // Fetch inclusions if plan
      let inclusions: PlanInclusion[] = [];
      if (product.product_type === 'plan') {
        const { data: inclusionData } = await supabase
          .from('plan_inclusions')
          .select(`
            *,
            included_product:included_product_id(*)
          `)
          .eq('plan_product_id', id);
        inclusions = (inclusionData ?? []) as unknown as PlanInclusion[];
      }

      // Fetch addon config if addon
      let addon_config: ProductAddon | undefined;
      if (product.product_type === 'addon' || product.product_type === 'module_standalone') {
        const { data: addonData } = await supabase
          .from('product_addons')
          .select('*')
          .eq('addon_product_id', id)
          .maybeSingle();
        addon_config = addonData as ProductAddon | undefined;
      }

      return {
        ...product,
        prices: prices ?? [],
        features: features ?? [],
        inclusions,
        addon_config,
      } as ProductWithDetails;
    },
    enabled: !!id,
  });
}

export function usePlans() {
  return useProducts({ type: 'plan', isActive: true });
}

export function useModules() {
  return useProducts({ type: 'module_standalone' });
}

export function useAddons() {
  return useProducts({ type: 'addon' });
}

// ============ MUTATIONS ============

export function useCreateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Product>) => {
      const { data: product, error } = await supabase
        .from('products')
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return product as Product;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice-products'] });
      toast.success('Producto creado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Product> }) => {
      const { data: product, error } = await supabase
        .from('products')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return product as Product;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-products'] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.id] });
      toast.success('Producto actualizado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteProduct() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['backoffice-products'] });
      toast.success('Producto eliminado');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
