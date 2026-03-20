import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Types ──
export interface BillingPlan {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  price_monthly_eur: number;
  price_annual_eur: number;
  annual_discount_pct: number;
  trial_days: number;
  is_active: boolean;
  is_visible_pricing: boolean;
  sort_order: number;
  highlight_label: string | null;
  highlight_color_hex: string | null;
  limit_matters: number;
  limit_contacts: number;
  limit_users: number;
  limit_storage_gb: number;
  limit_genius_queries_monthly: number;
  limit_spider_alerts_monthly: number;
  limit_jurisdictions_docket: number;
  included_modules: string[];
  created_at: string;
  updated_at: string;
}

export interface BillingAddon {
  id: string;
  code: string;
  name_es: string;
  name_en: string;
  description_es: string | null;
  category: string;
  price_monthly_eur: number;
  price_annual_eur: number;
  is_standalone: boolean;
  is_active: boolean;
  sort_order: number;
  icon_name: string | null;
  color_hex: string | null;
  module_code: string | null;
  adds_genius_queries_monthly: number;
  adds_spider_alerts_monthly: number;
  adds_users: number;
  adds_storage_gb: number;
  adds_jurisdictions: number;
  jurisdiction_codes: string[];
  compatible_plan_codes: string[];
  created_at: string;
  updated_at: string;
}

export interface TenantFlags {
  id: string;
  organization_id: string;
  has_docket: boolean;
  has_crm: boolean;
  has_finance_basic: boolean;
  has_finance_full: boolean;
  has_spider: boolean;
  has_genius: boolean;
  has_market: boolean;
  has_filing: boolean;
  has_analytics: boolean;
  has_api_access: boolean;
  has_sso: boolean;
  has_accounting_basic: boolean;
  has_accounting_advanced: boolean;
  has_communications: boolean;
  has_automations: boolean;
  effective_limit_matters: number;
  effective_limit_contacts: number;
  effective_limit_users: number;
  effective_limit_storage_gb: number;
  effective_limit_genius_queries_monthly: number;
  effective_limit_spider_alerts_monthly: number;
  effective_limit_jurisdictions_docket: number;
  active_jurisdiction_codes: string[];
  is_in_trial: boolean;
  trial_ends_at: string | null;
  is_active: boolean;
  suspension_reason: string | null;
  manual_override: Record<string, unknown>;
  current_plan_code: string;
  current_billing_cycle: string;
  current_addons: Array<{ code: string; quantity: number; price_at_purchase?: number }>;
  updated_at: string;
}

export interface BillingHistory {
  id: string;
  organization_id: string;
  changed_by_user_id: string | null;
  change_type: string;
  previous_state: unknown;
  new_state: unknown;
  notes: string | null;
  created_at: string;
}

// ── Hooks ──

export function useBillingPlans() {
  return useQuery({
    queryKey: ['billing-plans'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plans')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as BillingPlan[];
    },
  });
}

export function useBillingAddons(category?: string) {
  return useQuery({
    queryKey: ['billing-addons', category],
    queryFn: async () => {
      let q = supabase.from('billing_addons').select('*').order('sort_order');
      if (category) q = q.eq('category', category);
      const { data, error } = await q;
      if (error) throw error;
      return data as BillingAddon[];
    },
  });
}

export function useTenantFlagsList() {
  return useQuery({
    queryKey: ['tenant-flags-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tenant_feature_flags')
        .select('*')
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as TenantFlags[];
    },
  });
}

export function useBillingHistory(orgId?: string) {
  return useQuery({
    queryKey: ['billing-history', orgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('billing_plan_history')
        .select('*')
        .eq('organization_id', orgId!)
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as BillingHistory[];
    },
    enabled: !!orgId,
  });
}

export function useUpdateBillingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BillingPlan> & { id: string }) => {
      const { error } = await supabase
        .from('billing_plans')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-plans'] });
      toast.success('Plan actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useCreateBillingPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (plan: Omit<BillingPlan, 'id' | 'created_at' | 'updated_at'>) => {
      const { error } = await supabase.from('billing_plans').insert(plan as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-plans'] });
      toast.success('Plan creado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateBillingAddon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<BillingAddon> & { id: string }) => {
      const { error } = await supabase
        .from('billing_addons')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-addons'] });
      toast.success('Add-on actualizado');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useUpdateTenantFlags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...updates }: Partial<TenantFlags> & { id: string }) => {
      const { error } = await supabase
        .from('tenant_feature_flags')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tenant-flags-list'] });
      toast.success('Flags actualizados');
    },
    onError: (e: Error) => toast.error(e.message),
  });
}

export function useInsertBillingHistory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entry: Omit<BillingHistory, 'id' | 'created_at'>) => {
      const { error } = await supabase.from('billing_plan_history').insert(entry as any);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['billing-history'] });
    },
  });
}

export function useOrganizations() {
  return useQuery({
    queryKey: ['organizations-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organizations')
        .select('id, name, slug')
        .order('name');
      if (error) throw error;
      return data as Array<{ id: string; name: string; slug: string }>;
    },
  });
}
