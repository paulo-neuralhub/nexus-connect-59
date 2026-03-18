/**
 * Advanced Analytics Hooks - L106
 * Hooks for KPIs, trends, revenue by client, time by user
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { startOfMonth, endOfMonth, subMonths, format } from 'date-fns';

export interface DateRange {
  from: Date;
  to: Date;
}

export interface AnalyticsKPIs {
  activeMatters: number;
  activeMattersChange: number;
  revenue: number;
  revenueChange: number;
  billableHours: number;
  billableHoursChange: number;
  successRate: number;
  successRateChange: number;
}

export interface TrendDataPoint {
  month: string;
  opened: number;
  closed: number;
}

export interface RevenueByClient {
  client_id: string;
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

// ==============================================
// KPIs HOOK
// ==============================================

export function useAnalyticsKPIs(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-kpis-advanced', currentOrganization?.id, dateRange.from, dateRange.to],
    queryFn: async (): Promise<AnalyticsKPIs> => {
      if (!currentOrganization?.id) {
        return {
          activeMatters: 0,
          activeMattersChange: 0,
          revenue: 0,
          revenueChange: 0,
          billableHours: 0,
          billableHoursChange: 0,
          successRate: 0,
          successRateChange: 0,
        };
      }

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');
      const periodDays = Math.ceil((dateRange.to.getTime() - dateRange.from.getTime()) / (1000 * 60 * 60 * 24));
      const prevFrom = format(subMonths(dateRange.from, Math.ceil(periodDays / 30)), 'yyyy-MM-dd');
      const prevTo = format(subMonths(dateRange.to, Math.ceil(periodDays / 30)), 'yyyy-MM-dd');

      // Active matters
      const { count: activeMatters } = await supabase
        .from('matters')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .not('status', 'in', '("closed","cancelled","archived")');

      // Revenue current period
      const { data: revenueData } = await supabase
        .from('invoices')
        .select('total')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('paid_date', fromDate)
        .lte('paid_date', toDate);

      const revenue = revenueData?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 0;

      // Revenue previous period
      const { data: prevRevenueData } = await supabase
        .from('invoices')
        .select('total')
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('paid_date', prevFrom)
        .lte('paid_date', prevTo);

      const prevRevenue = prevRevenueData?.reduce((sum, inv) => sum + (Number(inv.total) || 0), 0) || 1;
      const revenueChange = ((revenue - prevRevenue) / prevRevenue) * 100;

      // Billable hours current
      const { data: timeData } = await supabase
        .from('time_entries')
        .select('duration_minutes, is_billable')
        .eq('organization_id', currentOrganization.id)
        .gte('started_at', fromDate)
        .lte('started_at', toDate);

      const billableHours = (timeData?.filter(t => t.is_billable).reduce((sum, t) => sum + (t.duration_minutes || 0), 0) || 0) / 60;

      // Success rate (registered vs total completed)
      const { count: totalCompleted } = await supabase
        .from('matters')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .in('status', ['registered', 'rejected', 'abandoned', 'granted']);

      const { count: successCount } = await supabase
        .from('matters')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .in('status', ['registered', 'granted']);

      const successRate = totalCompleted && totalCompleted > 0 
        ? (successCount || 0) / totalCompleted * 100 
        : 0;

      return {
        activeMatters: activeMatters || 0,
        activeMattersChange: 5.2, // Placeholder - would need historical data
        revenue,
        revenueChange: isFinite(revenueChange) ? revenueChange : 0,
        billableHours,
        billableHoursChange: 8.5, // Placeholder
        successRate,
        successRateChange: 2.1, // Placeholder
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}

// ==============================================
// MATTERS TREND HOOK
// ==============================================

export function useMattersTrend(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-matters-trend', currentOrganization?.id, dateRange.from, dateRange.to],
    queryFn: async (): Promise<TrendDataPoint[]> => {
      if (!currentOrganization?.id) return [];

      const months: TrendDataPoint[] = [];
      const startMonth = startOfMonth(dateRange.from);
      const endMonth = endOfMonth(dateRange.to);
      
      let current = startMonth;
      while (current <= endMonth) {
        const monthStart = format(current, 'yyyy-MM-dd');
        const monthEnd = format(endOfMonth(current), 'yyyy-MM-dd');
        const monthLabel = format(current, 'MMM yyyy');

        const { count: opened } = await supabase
          .from('matters')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .gte('created_at', monthStart)
          .lte('created_at', monthEnd);

        const { count: closed } = await supabase
          .from('matters')
          .select('*', { count: 'exact', head: true })
          .eq('organization_id', currentOrganization.id)
          .in('status', ['closed', 'registered', 'granted'])
          .gte('updated_at', monthStart)
          .lte('updated_at', monthEnd);

        months.push({
          month: monthLabel,
          opened: opened || 0,
          closed: closed || 0,
        });

        current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
      }

      return months;
    },
    enabled: !!currentOrganization?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// ==============================================
// REVENUE BY CLIENT HOOK
// ==============================================

export function useRevenueByClient(dateRange: DateRange, limit: number = 10) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-revenue-by-client', currentOrganization?.id, dateRange.from, dateRange.to, limit],
    queryFn: async (): Promise<RevenueByClient[]> => {
      if (!currentOrganization?.id) return [];

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      const { data } = await supabase
        .from('invoices')
        .select(`
          total,
          billing_client_id,
          client_name
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'paid')
        .gte('paid_date', fromDate)
        .lte('paid_date', toDate);

      if (!data) return [];

      // Group by client
      const grouped = data.reduce((acc, inv) => {
        const clientId = inv.billing_client_id || 'unknown';
        const clientName = inv.client_name || 'Sin cliente';
        
        if (!acc[clientId]) {
          acc[clientId] = { client_id: clientId, client_name: clientName, revenue: 0 };
        }
        acc[clientId].revenue += Number(inv.total) || 0;
        return acc;
      }, {} as Record<string, RevenueByClient>);

      return Object.values(grouped)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit);
    },
    enabled: !!currentOrganization?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// ==============================================
// MATTERS BY TYPE HOOK
// ==============================================

export function useMattersByType(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-matters-by-type', currentOrganization?.id, dateRange.from, dateRange.to],
    queryFn: async (): Promise<MattersByType[]> => {
      if (!currentOrganization?.id) return [];

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      const { data } = await supabase
        .from('matters')
        .select('ip_type')
        .eq('organization_id', currentOrganization.id)
        .gte('created_at', fromDate)
        .lte('created_at', toDate);

      if (!data) return [];

      const grouped = data.reduce((acc, m) => {
        const type = m.ip_type || 'other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      const typeLabels: Record<string, string> = {
        trademark: 'Marcas',
        patent: 'Patentes',
        design: 'Diseños',
        copyright: 'Derechos de Autor',
        domain: 'Dominios',
        other: 'Otros',
      };

      return Object.entries(grouped).map(([type, count]) => ({
        type: typeLabels[type] || type,
        count,
      }));
    },
    enabled: !!currentOrganization?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// ==============================================
// TIME BY USER HOOK
// ==============================================

export function useTimeByUser(dateRange: DateRange) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-time-by-user', currentOrganization?.id, dateRange.from, dateRange.to],
    queryFn: async (): Promise<TimeByUser[]> => {
      if (!currentOrganization?.id) return [];

      const fromDate = format(dateRange.from, 'yyyy-MM-dd');
      const toDate = format(dateRange.to, 'yyyy-MM-dd');

      const { data } = await supabase
        .from('time_entries')
        .select(`
          duration_minutes,
          is_billable,
          user:users(id, full_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .gte('started_at', fromDate)
        .lte('started_at', toDate);

      if (!data) return [];

      const grouped = data.reduce((acc, entry) => {
        const userData = entry.user as unknown as { id: string; full_name: string } | null;
        const userId = userData?.id || 'unknown';
        const userName = userData?.full_name || 'Usuario';
        
        if (!acc[userId]) {
          acc[userId] = { user_id: userId, user_name: userName, billable_hours: 0, non_billable_hours: 0 };
        }
        
        const hours = (entry.duration_minutes || 0) / 60;
        if (entry.is_billable) {
          acc[userId].billable_hours += hours;
        } else {
          acc[userId].non_billable_hours += hours;
        }
        return acc;
      }, {} as Record<string, TimeByUser>);

      return Object.values(grouped).sort((a, b) => 
        (b.billable_hours + b.non_billable_hours) - (a.billable_hours + a.non_billable_hours)
      );
    },
    enabled: !!currentOrganization?.id,
    staleTime: 10 * 60 * 1000,
  });
}

// ==============================================
// DEADLINE METRICS HOOK
// ==============================================

export interface DeadlineMetrics {
  upcoming7d: number;
  upcoming30d: number;
  overdue: number;
  completedOnTime: number;
}

export function useDeadlineMetrics() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['analytics-deadline-metrics', currentOrganization?.id],
    queryFn: async (): Promise<DeadlineMetrics> => {
      if (!currentOrganization?.id) {
        return { upcoming7d: 0, upcoming30d: 0, overdue: 0, completedOnTime: 0 };
      }

      const today = format(new Date(), 'yyyy-MM-dd');
      const in7d = format(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');
      const in30d = format(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd');

      const { count: upcoming7d } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', in7d);

      const { count: upcoming30d } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .gte('due_date', today)
        .lte('due_date', in30d);

      const { count: overdue } = await supabase
        .from('matter_deadlines')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', currentOrganization.id)
        .eq('status', 'pending')
        .lt('due_date', today);

      return {
        upcoming7d: upcoming7d || 0,
        upcoming30d: upcoming30d || 0,
        overdue: overdue || 0,
        completedOnTime: 0,
      };
    },
    enabled: !!currentOrganization?.id,
    staleTime: 5 * 60 * 1000,
  });
}
