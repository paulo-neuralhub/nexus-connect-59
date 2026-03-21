// src/hooks/finance/usePortfolioValuation.ts
// REWRITTEN: Safely returns empty state since finance_portfolios/finance_portfolio_assets
// tables don't exist. This is an Advanced feature that requires feature_valuation=true.

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import type { FinancePortfolio, PortfolioAsset, PortfolioMetrics } from '@/types/ip-finance.types';
import { toast } from 'sonner';

// All portfolio hooks return empty state safely — no crash
// These will be connected to real tables when the Valuation module is fully implemented

export function usePortfolios() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['finance-portfolios', currentOrganization?.id],
    queryFn: async (): Promise<FinancePortfolio[]> => {
      // Tables don't exist yet — return empty
      return [];
    },
    enabled: !!currentOrganization?.id,
  });
}

export function usePortfolio(portfolioId: string | undefined) {
  return useQuery({
    queryKey: ['finance-portfolio', portfolioId],
    queryFn: async (): Promise<FinancePortfolio | null> => {
      return null;
    },
    enabled: !!portfolioId,
  });
}

export function useCreatePortfolio() {
  return useMutation({
    mutationFn: async (_data: Partial<FinancePortfolio>): Promise<FinancePortfolio> => {
      toast.info('Módulo de valoración no disponible', {
        description: 'Requiere el nivel Advanced del módulo financiero',
      });
      throw new Error('Valuation module not available');
    },
  });
}

export function useUpdatePortfolio() {
  return useMutation({
    mutationFn: async (_: { id: string; data: Partial<FinancePortfolio> }) => {
      throw new Error('Valuation module not available');
    },
  });
}

export function useDeletePortfolio() {
  return useMutation({
    mutationFn: async (_id: string) => {
      throw new Error('Valuation module not available');
    },
  });
}

// Portfolio Assets
export function usePortfolioAssets(portfolioId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-assets', portfolioId],
    queryFn: async (): Promise<PortfolioAsset[]> => {
      return [];
    },
    enabled: !!portfolioId,
  });
}

export function useAddAssetToPortfolio() {
  return useMutation({
    mutationFn: async (_: { portfolioId: string; asset: Partial<PortfolioAsset> }) => {
      throw new Error('Valuation module not available');
    },
  });
}

export function useUpdatePortfolioAsset() {
  return useMutation({
    mutationFn: async (_: { id: string; portfolioId: string; data: Partial<PortfolioAsset> }) => {
      throw new Error('Valuation module not available');
    },
  });
}

export function useRemoveAssetFromPortfolio() {
  return useMutation({
    mutationFn: async (_: { id: string; portfolioId: string }) => {
      throw new Error('Valuation module not available');
    },
  });
}

// Valuation History
export function usePortfolioValuationHistory(portfolioId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio-valuations', portfolioId],
    queryFn: async () => {
      return [];
    },
    enabled: !!portfolioId,
  });
}

// Portfolio Metrics
export function usePortfolioMetrics(_portfolioId: string | undefined): PortfolioMetrics | null {
  return null;
}
