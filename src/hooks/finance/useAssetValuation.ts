// src/hooks/finance/useAssetValuation.ts
// REWRITTEN: Safe empty state since finance_valuations/finance_valuation_parameters
// tables don't exist. Uses placeholder logic until Advanced module is activated.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import type { 
  ValuationInput, 
  Valuation, 
  ValuationMethod, 
  ValuationResult,
  ValuationParameters 
} from '@/types/ip-finance.types';
import { toast } from 'sonner';

export function useValuationParameters(_assetType?: string) {
  return useQuery({
    queryKey: ['valuation-parameters', _assetType],
    queryFn: async (): Promise<ValuationParameters[]> => {
      // Table doesn't exist yet — return empty
      return [];
    },
  });
}

export function useCalculateValuation() {
  return useMutation({
    mutationFn: async ({
      input,
      methods,
    }: {
      input: ValuationInput;
      methods: ValuationMethod[];
    }): Promise<ValuationResult> => {
      // Simplified calculation without DB params
      const baseCost = input.acquisitionCost || 10000;
      const results: Record<string, number> = {};
      
      if (methods.includes('cost')) {
        results.cost = baseCost * 1.5;
      }
      if (methods.includes('market')) {
        results.market = baseCost * 2.0;
      }
      if (methods.includes('income')) {
        const revenue = input.projectedRevenue || baseCost;
        results.income = revenue * 5;
      }

      const values = Object.values(results);
      const avgValue = values.length > 0 
        ? values.reduce((a, b) => a + b, 0) / values.length 
        : 0;

      const minValue = values.length > 0 ? Math.min(...values) * 0.9 : 0;
      const maxValue = values.length > 0 ? Math.max(...values) * 1.1 : 0;

      const primaryMethod = Object.entries(results)
        .sort((a, b) => b[1] - a[1])[0]?.[0] as ValuationMethod || 'cost';

      return {
        estimated_value: Math.round(avgValue),
        value_range_low: Math.round(minValue),
        value_range_high: Math.round(maxValue),
        cost_approach_value: results.cost,
        market_approach_value: results.market,
        income_approach_value: results.income,
        confidence_level: values.length >= 2 ? 0.7 : 0.5,
        methods_used: methods,
        primary_method: primaryMethod,
      };
    },
  });
}

export function useSaveValuation() {
  return useMutation({
    mutationFn: async (_: {
      assetId?: string;
      portfolioId?: string;
      valuation: Partial<Valuation>;
    }) => {
      toast.info('Módulo de valoración no disponible', {
        description: 'Requiere el nivel Advanced del módulo financiero',
      });
      throw new Error('Valuation module not available');
    },
  });
}

export function useAssetValuations(assetIds: string | string[] | undefined) {
  const idsArray = Array.isArray(assetIds) ? assetIds : assetIds ? [assetIds] : [];
  
  return useQuery({
    queryKey: ['asset-valuations', idsArray],
    queryFn: async (): Promise<(Valuation & { final_value: number })[]> => {
      // Tables don't exist — return empty
      return [];
    },
    enabled: idsArray.length > 0,
  });
}

export function useApproveValuation() {
  return useMutation({
    mutationFn: async (_valuationId: string) => {
      throw new Error('Valuation module not available');
    },
  });
}
