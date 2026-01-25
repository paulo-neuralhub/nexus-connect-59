// ============================================================
// IP-NEXUS BACKOFFICE - Product Features Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { ProductFeature } from './useProducts';

export function useProductFeatures(productId: string | undefined) {
  return useQuery({
    queryKey: ['backoffice-product-features', productId],
    queryFn: async () => {
      if (!productId) return [];

      const { data, error } = await supabase
        .from('product_features')
        .select('*')
        .eq('product_id', productId)
        .order('sort_order');

      if (error) throw error;
      return (data ?? []) as ProductFeature[];
    },
    enabled: !!productId,
  });
}

export function useCreateProductFeature() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<ProductFeature, 'id' | 'created_at'>) => {
      const { data: feature, error } = await supabase
        .from('product_features')
        .insert(data as any)
        .select()
        .single();

      if (error) throw error;
      return feature as ProductFeature;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-features', variables.product_id] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.product_id] });
      toast.success('Feature añadida');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateProductFeature() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId, data }: { id: string; productId: string; data: Partial<ProductFeature> }) => {
      const { data: feature, error } = await supabase
        .from('product_features')
        .update(data as any)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return feature as ProductFeature;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-features', variables.productId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.productId] });
      toast.success('Feature actualizada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useDeleteProductFeature() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await supabase
        .from('product_features')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return productId;
    },
    onSuccess: (productId) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-features', productId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', productId] });
      toast.success('Feature eliminada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useUpdateProductFeatures() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      productId,
      features,
    }: {
      productId: string;
      features: Partial<ProductFeature>[];
    }) => {
      // Delete existing features
      await supabase
        .from('product_features')
        .delete()
        .eq('product_id', productId);

      // Insert new features
      if (features.length > 0) {
        const insertData = features.map((f, index) => ({
          ...f,
          product_id: productId,
          sort_order: index,
        }));

        const { error } = await supabase
          .from('product_features')
          .insert(insertData as any);

        if (error) throw error;
      }

      return features;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-product-features', variables.productId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.productId] });
      toast.success('Features actualizadas');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
