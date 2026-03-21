/**
 * Spider data hooks — queries against spider_* tables
 * All queries include .eq('organization_id', orgId)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';

// ─── Tenant Config ───
export function useSpiderTenantConfig() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['spider-tenant-config', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_tenant_config')
        .select('*')
        .eq('organization_id', orgId)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });
}

// ─── Watches ───
export function useSpiderWatches(activeOnly = true) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['spider-watches', orgId, activeOnly],
    queryFn: async () => {
      let q = fromTable('spider_watches')
        .select('*')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false });
      if (activeOnly) q = q.eq('is_active', true);
      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });
}

export function useCreateSpiderWatch() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useMutation({
    mutationFn: async (payload: Record<string, any>) => {
      const { data, error } = await fromTable('spider_watches')
        .insert({ ...payload, organization_id: orgId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spider-watches'] });
    },
  });
}

// ─── Alerts ───
export function useSpiderAlerts(filters?: { status?: string; severity?: string; watch_id?: string }) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['spider-alerts-v2', orgId, filters],
    queryFn: async () => {
      let q = fromTable('spider_alerts')
        .select('*, watch:spider_watches(id, watch_name, watch_type)')
        .eq('organization_id', orgId)
        .order('detected_at', { ascending: false })
        .limit(100);

      if (filters?.status) q = q.eq('status', filters.status);
      if (filters?.severity) q = q.eq('severity', filters.severity);
      if (filters?.watch_id) q = q.eq('watch_id', filters.watch_id);

      const { data, error } = await q;
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });
}

export function useUpdateSpiderAlert() {
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: string;[k: string]: any }) => {
      const { error } = await fromTable('spider_alerts')
        .update(updates)
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spider-alerts-v2'] });
      qc.invalidateQueries({ queryKey: ['spider-dashboard-stats'] });
    },
  });
}

// ─── Dashboard Stats ───
export function useSpiderDashboardStats() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['spider-dashboard-stats', orgId],
    queryFn: async () => {
      const [configRes, watchRes, alertRes, criticalRes] = await Promise.all([
        fromTable('spider_tenant_config').select('scans_this_month, max_scans_per_month, alerts_this_month, max_alerts_per_month').eq('organization_id', orgId).maybeSingle(),
        fromTable('spider_watches').select('id', { count: 'exact' }).eq('organization_id', orgId).eq('is_active', true),
        fromTable('spider_alerts').select('id', { count: 'exact' }).eq('organization_id', orgId).in('status', ['new', 'reviewing']),
        fromTable('spider_alerts').select('id', { count: 'exact' }).eq('organization_id', orgId).eq('severity', 'critical').in('status', ['new', 'reviewing']),
      ]);

      const cfg = configRes.data || {};
      return {
        activeWatches: watchRes.count || 0,
        pendingAlerts: alertRes.count || 0,
        criticalAlerts: criticalRes.count || 0,
        scansUsed: cfg.scans_this_month || 0,
        scansLimit: cfg.max_scans_per_month || 0,
        alertsUsed: cfg.alerts_this_month || 0,
        alertsLimit: cfg.max_alerts_per_month || 0,
        threatsActive: 0,
      };
    },
    enabled: !!orgId,
    refetchInterval: 30000,
  });
}

// ─── Alerts for a specific matter ───
export function useSpiderAlertsForMatter(matterId: string) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['spider-alerts-matter', orgId, matterId],
    queryFn: async () => {
      // Get watches linked to this matter, then their alerts
      const { data: watches } = await fromTable('spider_watches')
        .select('id')
        .eq('organization_id', orgId)
        .eq('linked_matter_id', matterId);

      if (!watches?.length) return [];

      const watchIds = watches.map((w: any) => w.id);
      const { data, error } = await fromTable('spider_alerts')
        .select('*, watch:spider_watches(id, watch_name)')
        .eq('organization_id', orgId)
        .in('watch_id', watchIds)
        .order('detected_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId && !!matterId,
  });
}
