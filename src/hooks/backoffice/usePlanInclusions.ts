// ============================================================
// IP-NEXUS BACKOFFICE - Plan Inclusions Hook
// ============================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { PlanInclusion, Product } from './useProducts';

export function usePlanInclusions(planId: string | undefined) {
  return useQuery({
    queryKey: ['backoffice-plan-inclusions', planId],
    queryFn: async () => {
      if (!planId) return [];

      const { data, error } = await supabase
        .from('plan_inclusions')
        .select(`
          *,
          included_product:included_product_id(*)
        `)
        .eq('plan_product_id', planId);

      if (error) throw error;
      return (data ?? []) as unknown as PlanInclusion[];
    },
    enabled: !!planId,
  });
}

export function useUpdatePlanInclusions() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      includedProductIds,
    }: {
      planId: string;
      includedProductIds: string[];
    }) => {
      // First, remove all existing inclusions
      await supabase
        .from('plan_inclusions')
        .delete()
        .eq('plan_product_id', planId);

      // Then add new inclusions
      if (includedProductIds.length > 0) {
        const insertData = includedProductIds.map((productId) => ({
          plan_product_id: planId,
          included_product_id: productId,
        }));

        const { error } = await supabase
          .from('plan_inclusions')
          .insert(insertData as any);

        if (error) throw error;
      }

      return includedProductIds;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-plan-inclusions', variables.planId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.planId] });
      toast.success('Inclusiones actualizadas');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useAddPlanInclusion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      includedProductId,
      limitOverride,
    }: {
      planId: string;
      includedProductId: string;
      limitOverride?: number;
    }) => {
      const { data, error } = await supabase
        .from('plan_inclusions')
        .insert({
          plan_product_id: planId,
          included_product_id: includedProductId,
          limit_override: limitOverride,
        } as any)
        .select()
        .single();

      if (error) throw error;
      return data as unknown as PlanInclusion;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-plan-inclusions', variables.planId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.planId] });
      toast.success('Inclusión añadida');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}

export function useRemovePlanInclusion() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({
      planId,
      includedProductId,
    }: {
      planId: string;
      includedProductId: string;
    }) => {
      const { error } = await supabase
        .from('plan_inclusions')
        .delete()
        .eq('plan_product_id', planId)
        .eq('included_product_id', includedProductId);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      qc.invalidateQueries({ queryKey: ['backoffice-plan-inclusions', variables.planId] });
      qc.invalidateQueries({ queryKey: ['backoffice-product', variables.planId] });
      toast.success('Inclusión eliminada');
    },
    onError: (e: Error) => toast.error(`Error: ${e.message}`),
  });
}
