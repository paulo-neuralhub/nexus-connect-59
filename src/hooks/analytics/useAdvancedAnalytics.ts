/**
 * Advanced Analytics Hooks
 * Real Supabase data with correct column names:
 *   invoices: total, invoice_date, paid_date
 *   matter_deadlines: deadline_date (NOT due_date)
 *   time_entries: date, duration_minutes, is_billable, hourly_rate
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

const STALE_TIME = 5 * 60 * 1000;

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsKPIs {
  activeMatters: number;
  activeMattersChange?: number;
  revenue: number;
  revenueChange?: number;
  billableHours: number;
  billableHoursChange?: number;
  successRate: number;
  successRateChange?: number;
}

export interface TrendDataPoint {
  month: string;
  opened: number;
  closed: number;
}

export interface RevenueByClient {
  client_name: string;
  revenue: number;
}

export interface MattersByType {
  type: string;
  count: number;
}

export interface TimeByUser {
  user_id: string;
  user_name: string;
  billable_hours: number;
  non_billable_hours: number;
}

export interface DeadlineMetrics {
  upcoming7d: number;
  upcoming30d: number;
  overdue: number;
  completedOnTime: number;
}

// KPIs
export function useAnalyticsKPIs(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-kpis-advanced', orgId, dateRange.from.toISOString(), dateRange.to.toISOString()],
    queryFn: async (): Promise<AnalyticsKPIs> => {
      if (!orgId) return { activeMatters: 0, revenue: 0, billableHours: 0, successRate: 0 };

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      const { count: activeMatters } = await supabase
        .from('matters')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .not('status', 'in', '("closed","cancelled","archived")');

      // Revenue: invoices.total, invoices.invoice_date
      const { data: revenueData } = await supabase
        .from('invoices')
        .select('total')
        .eq('organization_id', orgId)
        .gte('invoice_date', fromDate)
        .lte('invoice_date', toDate);

      const revenue = (revenueData || []).reduce((sum, inv) => sum + (Number(inv.total) || 0), 0);

      // Billable hours: time_entries.date (NOT started_at)
      const { data: timeData } = await supabase
        .from('time_entries')
        .select('duration_minutes, is_billable')
        .eq('organization_id', orgId)
        .gte('date', fromDate)
        .lte('date', toDate);

      const billableHours = ((timeData || []).filter(t => t.is_billable).reduce((sum, t) => sum + (t.duration_minutes || 0), 0)) / 60;

      // Success rate
      const { count: totalCompleted } = await supabase
        .from('matters')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['registered', 'rejected', 'abandoned', 'granted', 'refused']);

      const { count: successCount } = await supabase
        .from('matters')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('status', ['registered', 'granted']);

      const successRate = totalCompleted && totalCompleted > 0
        ? ((successCount || 0) / totalCompleted) * 100 : 0;

      return { activeMatters: activeMatters || 0, revenue, billableHours, successRate };
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}

// Matters trend
export function useMattersTrend(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-matters-trend', orgId, dateRange.from.toISOString()],
    queryFn: async (): Promise<TrendDataPoint[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from('matters')
        .select('created_at, status, closed_at')
        .eq('organization_id', orgId)
        .gte('created_at', dateRange.from.toISOString());

      if (error) throw error;

      const monthMap: Record<string, { opened: number; closed: number }> = {};
      (data || []).forEach(m => {
        const openMonth = format(new Date(m.created_at), 'MMM yyyy');
        if (!monthMap[openMonth]) monthMap[openMonth] = { opened: 0, closed: 0 };
        monthMap[openMonth].opened++;
        if (m.closed_at) {
          const closeMonth = format(new Date(m.closed_at), 'MMM yyyy');
          if (!monthMap[closeMonth]) monthMap[closeMonth] = { opened: 0, closed: 0 };
          monthMap[closeMonth].closed++;
        }
      });

      return Object.entries(monthMap)
        .map(([month, v]) => ({ month, ...v }))
        .sort((a, b) => a.month.localeCompare(b.month));
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

// Revenue by client
export function useRevenueByClient(dateRange: DateRange, limit: number = 10) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-revenue-by-client', orgId, dateRange.from.toISOString(), limit],
    queryFn: async (): Promise<RevenueByClient[]> => {
      if (!orgId) return [];

      const { data } = await supabase
        .from('invoices')
        .select('total, client_name')
        .eq('organization_id', orgId)
        .gte('invoice_date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('invoice_date', format(dateRange.to, 'yyyy-MM-dd'));

      if (!data) return [];

      const grouped: Record<string, number> = {};
      data.forEach(inv => {
        const name = inv.client_name || 'Sin cliente';
        grouped[name] = (grouped[name] || 0) + (Number(inv.total) || 0);
      });

      return Object.entries(grouped)
        .map(([client_name, revenue]) => ({ client_name, revenue }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

// Matters by type
export function useMattersByType(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-matters-by-type', orgId, dateRange.from.toISOString()],
    queryFn: async (): Promise<MattersByType[]> => {
      if (!orgId) return [];

      const { data } = await supabase
        .from('matters')
        .select('type')
        .eq('organization_id', orgId)
        .gte('created_at', format(dateRange.from, 'yyyy-MM-dd'));

      if (!data) return [];

      const labels: Record<string, string> = {
        trademark: 'Marcas', patent: 'Patentes', design: 'Diseños',
        copyright: 'Copyright', domain: 'Dominios',
      };

      const grouped: Record<string, number> = {};
      data.forEach(m => {
        const t = m.type || 'other';
        grouped[t] = (grouped[t] || 0) + 1;
      });

      return Object.entries(grouped).map(([type, count]) => ({
        type: labels[type] || type, count,
      }));
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

// Time by user — uses time_entries.date (NOT started_at)
export function useTimeByUser(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-time-by-user', orgId, dateRange.from.toISOString()],
    queryFn: async (): Promise<TimeByUser[]> => {
      if (!orgId) return [];

      const { data } = await supabase
        .from('time_entries')
        .select('user_id, duration_minutes, is_billable')
        .eq('organization_id', orgId)
        .gte('date', format(dateRange.from, 'yyyy-MM-dd'))
        .lte('date', format(dateRange.to, 'yyyy-MM-dd'));

      if (!data) return [];

      const userIds = [...new Set(data.map(e => e.user_id).filter(Boolean))] as string[];
      if (userIds.length === 0) return [];

      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .in('id', userIds);

      const nameMap: Record<string, string> = {};
      (profiles || []).forEach(p => {
        nameMap[p.id] = `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Sin nombre';
      });

      const grouped: Record<string, { billable: number; nonBillable: number }> = {};
      data.forEach(entry => {
        if (!entry.user_id) return;
        if (!grouped[entry.user_id]) grouped[entry.user_id] = { billable: 0, nonBillable: 0 };
        const hours = (entry.duration_minutes || 0) / 60;
        if (entry.is_billable) grouped[entry.user_id].billable += hours;
        else grouped[entry.user_id].nonBillable += hours;
      });

      return Object.entries(grouped)
        .map(([user_id, s]) => ({
          user_id,
          user_name: nameMap[user_id] || user_id,
          billable_hours: Math.round(s.billable * 100) / 100,
          non_billable_hours: Math.round(s.nonBillable * 100) / 100,
        }))
        .sort((a, b) => (b.billable_hours + b.non_billable_hours) - (a.billable_hours + a.non_billable_hours));
    },
    enabled: !!orgId,
    staleTime: 10 * 60 * 1000,
  });
}

// Deadline metrics — uses deadline_date (NOT due_date)
export function useDeadlineMetrics() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  return useQuery({
    queryKey: ['analytics-deadline-metrics', orgId],
    queryFn: async (): Promise<DeadlineMetrics> => {
      if (!orgId) return { upcoming7d: 0, upcoming30d: 0, overdue: 0, completedOnTime: 0 };

      const today = format(new Date(), 'yyyy-MM-dd');
      const in7d = format(new Date(Date.now() + 7 * 86400000), 'yyyy-MM-dd');
      const in30d = format(new Date(Date.now() + 30 * 86400000), 'yyyy-MM-dd');

      const { data, error } = await supabase
        .from('matter_deadlines')
        .select('status, deadline_date, completed_at')
        .eq('organization_id', orgId);

      if (error) throw error;

      const rows = data || [];
      return {
        upcoming7d: rows.filter(r => r.deadline_date >= today && r.deadline_date <= in7d && r.status !== 'completed' && r.status !== 'cancelled').length,
        upcoming30d: rows.filter(r => r.deadline_date >= today && r.deadline_date <= in30d && r.status !== 'completed' && r.status !== 'cancelled').length,
        overdue: rows.filter(r => r.deadline_date < today && r.status !== 'completed' && r.status !== 'cancelled').length,
        completedOnTime: rows.filter(r => r.status === 'completed' && r.completed_at && r.deadline_date && r.completed_at <= r.deadline_date).length,
      };
    },
    enabled: !!orgId,
    staleTime: STALE_TIME,
  });
}
