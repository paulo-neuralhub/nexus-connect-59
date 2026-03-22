import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ──
export interface PlatformCost {
  id: string;
  cost_category: string;
  cost_subcategory: string | null;
  description: string;
  period_start: string;
  period_end: string;
  amount: number;
  currency: string;
  amount_eur: number | null;
  source_type: string;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  journal_entry_id: string | null;
  vendor_name: string | null;
  notes: string | null;
  auto_captured_at: string | null;
  created_at: string;
}

export interface PlatformRevenue {
  id: string;
  revenue_type: string;
  source_organization_id: string | null;
  gross_amount: number;
  stripe_fee: number;
  net_amount: number | null;
  currency: string;
  revenue_date: string;
  period_month: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  journal_entry_id: string | null;
  description: string | null;
  notes: string | null;
  created_at: string;
}

export interface MrrSnapshot {
  id: string;
  snapshot_date: string;
  period_month: string;
  mrr_total: number;
  mrr_new: number;
  mrr_expansion: number;
  mrr_contraction: number;
  mrr_churn: number;
  mrr_net_new: number;
  arr_total: number;
  tenants_total: number;
  tenants_new: number;
  tenants_churned: number;
  tenants_by_plan: Record<string, number>;
  churn_rate_pct: number;
  avg_revenue_per_tenant: number;
  marketplace_gmv: number;
  marketplace_revenue: number;
  total_costs_month: number;
  gross_profit: number;
  gross_margin_pct: number;
  calculated_at: string;
}

export interface CaptureResult {
  period_month: string;
  costs_captured: { ai: number; telephony: number; total: number };
  revenue_captured: { marketplace: number; subscriptions: number; total: number };
  mrr_snapshot: { mrr: number; arr: number; tenants: number };
  pending_review_count: number;
}

// ── Hooks ──

export function usePlatformCosts(status?: string, periodMonth?: string) {
  return useQuery({
    queryKey: ['platform-costs', status, periodMonth],
    queryFn: async () => {
      let q = supabase
        .from('platform_costs')
        .select('*')
        .order('created_at', { ascending: false });
      if (status) q = q.eq('status', status);
      if (periodMonth) {
        q = q.gte('period_start', `${periodMonth}-01`)
             .lte('period_end', `${periodMonth}-31`);
      }
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PlatformCost[];
    },
  });
}

export function usePlatformRevenue(status?: string, periodMonth?: string) {
  return useQuery({
    queryKey: ['platform-revenue', status, periodMonth],
    queryFn: async () => {
      let q = supabase
        .from('platform_revenue')
        .select('*')
        .order('revenue_date', { ascending: false });
      if (status) q = q.eq('status', status);
      if (periodMonth) q = q.eq('period_month', periodMonth);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as PlatformRevenue[];
    },
  });
}

export function useMrrSnapshots(limit = 12) {
  return useQuery({
    queryKey: ['platform-mrr-snapshots', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_mrr_snapshots')
        .select('*')
        .order('period_month', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data || []) as MrrSnapshot[];
    },
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ['platform-pending-review-count'],
    queryFn: async () => {
      const { count: costs } = await supabase
        .from('platform_costs')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      const { count: revenue } = await supabase
        .from('platform_revenue')
        .select('id', { count: 'exact', head: true })
        .eq('status', 'pending_review');
      return (costs || 0) + (revenue || 0);
    },
    refetchInterval: 60_000,
  });
}

export function useConfirmPlatformCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, amount }: { id: string; amount?: number }) => {
      const updates: Record<string, any> = {
        status: 'confirmed',
        reviewed_at: new Date().toISOString(),
      };
      if (amount !== undefined) updates.amount = amount;
      if (amount !== undefined) updates.amount_eur = amount;
      const { error } = await supabase
        .from('platform_costs')
        .update(updates)
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-costs'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success('Coste confirmado');
    },
  });
}

export function useRejectPlatformCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_costs')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-costs'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success('Coste rechazado');
    },
  });
}

export function useConfirmPlatformRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_revenue')
        .update({
          status: 'confirmed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-revenue'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success('Ingreso confirmado');
    },
  });
}

export function useRejectPlatformRevenue() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('platform_revenue')
        .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-revenue'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success('Ingreso rechazado');
    },
  });
}

export function useConfirmAllPending() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (type: 'costs' | 'revenue') => {
      const table = type === 'costs' ? 'platform_costs' : 'platform_revenue';
      const { error } = await supabase
        .from(table)
        .update({
          status: 'confirmed',
          reviewed_at: new Date().toISOString(),
        })
        .eq('status', 'pending_review');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-costs'] });
      qc.invalidateQueries({ queryKey: ['platform-revenue'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success('Todos confirmados');
    },
  });
}

export function useCreateManualCost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cost: Partial<PlatformCost>) => {
      const { error } = await supabase.from('platform_costs').insert({
        cost_category: cost.cost_category || 'other',
        description: cost.description || '',
        period_start: cost.period_start || new Date().toISOString().slice(0, 10),
        period_end: cost.period_end || new Date().toISOString().slice(0, 10),
        amount: cost.amount || 0,
        currency: cost.currency || 'EUR',
        amount_eur: cost.amount || 0,
        source_type: 'manual',
        status: 'confirmed',
        vendor_name: cost.vendor_name,
        notes: cost.notes,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['platform-costs'] });
      toast.success('Coste registrado');
    },
  });
}

export function useCaptureFinanceData() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (periodMonth?: string) => {
      const { data, error } = await supabase.functions.invoke(
        'platform-finance-capture',
        { body: { period_month: periodMonth } }
      );
      if (error) throw error;
      return data as CaptureResult;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['platform-costs'] });
      qc.invalidateQueries({ queryKey: ['platform-revenue'] });
      qc.invalidateQueries({ queryKey: ['platform-mrr-snapshots'] });
      qc.invalidateQueries({ queryKey: ['platform-pending-review-count'] });
      toast.success(
        `Captura completada: ${data.costs_captured.total} costes y ${data.revenue_captured.total} ingresos pendientes de revisión`
      );
    },
    onError: (err: any) => {
      toast.error('Error en captura: ' + (err.message || 'Error desconocido'));
    },
  });
}
