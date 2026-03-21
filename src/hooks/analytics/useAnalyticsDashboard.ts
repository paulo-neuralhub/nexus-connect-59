// =============================================
// ANALYTICS-01 Fase 2: Real Data Hooks
// Todos los hooks usan queries reales a Supabase.
// Columnas verificadas contra schema real:
//   invoices: total, invoice_date, paid_date, paid_amount
//   matter_deadlines: deadline_date (NOT due_date)
//   ai_usage: estimated_cost_cents (NOT cost_eur)
//   time_entries: duration_minutes, hourly_rate, is_billable
// =============================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

const STALE_TIME = 5 * 60 * 1000; // 5 minutes

// =============================================
// 1. useDailyMetrics
// =============================================
export function useDailyMetrics(dateRange?: { from: string; to: string }) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['daily-metrics', orgId, dateRange],
    queryFn: async () => {
      if (!orgId) return [];

      let query = supabase
        .from('analytics_daily_metrics')
        .select('*')
        .eq('organization_id', orgId)
        .order('metric_date', { ascending: false });

      if (dateRange?.from) {
        query = query.gte('metric_date', dateRange.from);
      }
      if (dateRange?.to) {
        query = query.lte('metric_date', dateRange.to);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 2. useMatterProfitability
// =============================================
export function useMatterProfitability(limit: number = 10) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['matter-profitability', orgId, limit],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('analytics_matter_metrics')
        .select(`
          *,
          matter:matters!inner(id, title, type, status, jurisdiction)
        `)
        .eq('organization_id', orgId)
        .order('margin_eur', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 3. useDeadlineCompliance
// =============================================
export interface DeadlineComplianceData {
  on_time: number;
  overdue: number;
  missed: number;
  compliance_rate: number;
  total_due: number;
}

export function useDeadlineCompliance() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery<DeadlineComplianceData>({
    queryKey: ['deadline-compliance', orgId],
    queryFn: async () => {
      if (!orgId) return { on_time: 0, overdue: 0, missed: 0, compliance_rate: 100, total_due: 0 };

      // Use deadline_date (verified column name)
      const { data, error } = await supabase
        .from('matter_deadlines')
        .select('status, completed_at, deadline_date')
        .eq('organization_id', orgId);

      if (error) throw error;

      const now = new Date().toISOString();
      const rows = data || [];

      const on_time = rows.filter(r => 
        r.status === 'completed' && r.completed_at && r.deadline_date && r.completed_at <= r.deadline_date
      ).length;

      const overdue = rows.filter(r => 
        r.status !== 'completed' && r.status !== 'cancelled' && r.deadline_date && r.deadline_date < now
      ).length;

      const missed = rows.filter(r => r.status === 'missed').length;

      const total_due = rows.filter(r => r.deadline_date && r.deadline_date <= now).length;

      const compliance_rate = total_due > 0
        ? Math.round((on_time / total_due) * 10000) / 100
        : 100;

      return { on_time, overdue, missed, compliance_rate, total_due };
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 4. useJurisdictionAnalysis
// =============================================
export interface JurisdictionData {
  jurisdiction: string;
  total: number;
  registered: number;
  success_rate: number;
}

export function useJurisdictionAnalysis() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery<JurisdictionData[]>({
    queryKey: ['jurisdiction-analysis', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('matters')
        .select('jurisdiction, status')
        .eq('organization_id', orgId)
        .not('jurisdiction', 'is', null);

      if (error) throw error;

      const groups: Record<string, { total: number; registered: number }> = {};
      (data || []).forEach(m => {
        const j = m.jurisdiction!;
        if (!groups[j]) groups[j] = { total: 0, registered: 0 };
        groups[j].total++;
        if (m.status === 'registered') groups[j].registered++;
      });

      return Object.entries(groups)
        .map(([jurisdiction, g]) => ({
          jurisdiction,
          total: g.total,
          registered: g.registered,
          success_rate: g.total > 0 ? Math.round((g.registered / g.total) * 10000) / 100 : 0,
        }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 15);
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 5. useRevenueAnalysis
// Uses: invoices.total, invoices.invoice_date, invoices.paid_date
// =============================================
export interface RevenueMonthData {
  month: string;
  invoiced: number;
  collected: number;
}

export function useRevenueAnalysis(months: number = 6) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery<RevenueMonthData[]>({
    queryKey: ['revenue-analysis', orgId, months],
    queryFn: async () => {
      if (!orgId) return [];

      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - months);

      const { data, error } = await supabase
        .from('invoices')
        .select('total, invoice_date, paid_date, paid_amount')
        .eq('organization_id', orgId)
        .gte('invoice_date', cutoffDate.toISOString().split('T')[0]);

      if (error) throw error;

      const monthMap: Record<string, { invoiced: number; collected: number }> = {};

      (data || []).forEach(inv => {
        if (!inv.invoice_date) return;
        const monthKey = inv.invoice_date.substring(0, 7); // YYYY-MM
        if (!monthMap[monthKey]) monthMap[monthKey] = { invoiced: 0, collected: 0 };
        monthMap[monthKey].invoiced += Number(inv.total) || 0;
        if (inv.paid_date) {
          monthMap[monthKey].collected += Number(inv.paid_amount) || 0;
        }
      });

      return Object.entries(monthMap)
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 6. useProductivityStats
// Uses: time_entries.duration_minutes, hourly_rate, is_billable
// =============================================
export interface ProductivityUserData {
  user_name: string;
  total_hours: number;
  billable_hours: number;
  billable_amount: number;
  utilization_rate: number;
}

export function useProductivityStats() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery<ProductivityUserData[]>({
    queryKey: ['productivity-stats', orgId],
    queryFn: async () => {
      if (!orgId) return [];

      const monthStart = new Date();
      monthStart.setDate(1);
      const monthStartStr = monthStart.toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('time_entries')
        .select('user_id, duration_minutes, is_billable, hourly_rate')
        .eq('organization_id', orgId)
        .gte('date', monthStartStr);

      if (error) throw error;

      // Get unique user IDs
      const userIds = [...new Set((data || []).map(te => te.user_id).filter(Boolean))] as string[];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const profileMap: Record<string, string> = {};
      (profiles || []).forEach(p => {
        profileMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre';
      });

      const userStats: Record<string, { total_min: number; billable_min: number; billable_amount: number }> = {};

      (data || []).forEach(te => {
        if (!te.user_id) return;
        if (!userStats[te.user_id]) userStats[te.user_id] = { total_min: 0, billable_min: 0, billable_amount: 0 };
        const mins = te.duration_minutes || 0;
        userStats[te.user_id].total_min += mins;
        if (te.is_billable) {
          userStats[te.user_id].billable_min += mins;
          userStats[te.user_id].billable_amount += (mins / 60) * (te.hourly_rate || 0);
        }
      });

      return Object.entries(userStats)
        .map(([userId, s]) => ({
          user_name: profileMap[userId] || userId,
          total_hours: Math.round((s.total_min / 60) * 100) / 100,
          billable_hours: Math.round((s.billable_min / 60) * 100) / 100,
          billable_amount: Math.round(s.billable_amount * 100) / 100,
          utilization_rate: s.total_min > 0
            ? Math.round((s.billable_min / s.total_min) * 10000) / 100
            : 0,
        }))
        .sort((a, b) => b.total_hours - a.total_hours);
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 7. useAnalyticsOverview
// Replaces the broken useAnalyticsStats RPC
// Queries real data directly from matters + deadlines + invoices
// =============================================
export interface AnalyticsOverview {
  total_matters: number;
  total_trademarks: number;
  total_patents: number;
  total_designs: number;
  registered: number;
  pending: number;
  expiring_30d: number;
  reports_generated: number;
}

export function useAnalyticsOverview() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery<AnalyticsOverview>({
    queryKey: ['analytics-overview', orgId],
    queryFn: async () => {
      if (!orgId) return {
        total_matters: 0, total_trademarks: 0, total_patents: 0, total_designs: 0,
        registered: 0, pending: 0, expiring_30d: 0, reports_generated: 0,
      };

      // Matters stats
      const { data: matters, error: mErr } = await supabase
        .from('matters')
        .select('type, status')
        .eq('organization_id', orgId);
      if (mErr) throw mErr;

      const m = matters || [];

      // Deadlines expiring in 30 days
      const in30d = new Date();
      in30d.setDate(in30d.getDate() + 30);
      const { count: expiring30d } = await supabase
        .from('matter_deadlines')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .lte('deadline_date', in30d.toISOString().split('T')[0])
        .gte('deadline_date', new Date().toISOString().split('T')[0])
        .in('status', ['pending', 'upcoming']);

      // Generated reports count
      const { count: reportsCount } = await supabase
        .from('generated_reports')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId);

      return {
        total_matters: m.length,
        total_trademarks: m.filter(x => x.type === 'trademark').length,
        total_patents: m.filter(x => x.type === 'patent').length,
        total_designs: m.filter(x => x.type === 'design').length,
        registered: m.filter(x => x.status === 'registered').length,
        pending: m.filter(x => x.status === 'pending' || x.status === 'filed').length,
        expiring_30d: expiring30d || 0,
        reports_generated: reportsCount || 0,
      };
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// =============================================
// 8. useMattersByMonth (for bar charts)
// =============================================
export function useMattersByMonth(months: number = 6) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['matters-by-month', orgId, months],
    queryFn: async () => {
      if (!orgId) return [];

      const cutoff = new Date();
      cutoff.setMonth(cutoff.getMonth() - months);

      const { data, error } = await supabase
        .from('matters')
        .select('created_at')
        .eq('organization_id', orgId)
        .gte('created_at', cutoff.toISOString());

      if (error) throw error;

      const monthMap: Record<string, number> = {};
      (data || []).forEach(m => {
        const key = m.created_at.substring(0, 7);
        monthMap[key] = (monthMap[key] || 0) + 1;
      });

      return Object.entries(monthMap)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}
