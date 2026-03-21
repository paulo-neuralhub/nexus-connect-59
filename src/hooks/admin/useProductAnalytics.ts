import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  AnalyticsFilter, 
  AnalyticsSummary,
  TrendDataPoint,
  TopPage,
  TopFeature 
} from '@/types/analytics';
import { subDays, startOfDay, endOfDay, format } from 'date-fns';

const STALE_TIME = 5 * 60 * 1000;

// =====================================================
// DATE RANGE HELPER
// =====================================================
function getDateRange(filter: AnalyticsFilter) {
  const now = new Date();
  
  switch (filter.period) {
    case 'today':
      return { start: startOfDay(now), end: endOfDay(now) };
    case '7d':
      return { start: startOfDay(subDays(now, 7)), end: endOfDay(now) };
    case '30d':
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
    case '90d':
      return { start: startOfDay(subDays(now, 90)), end: endOfDay(now) };
    case 'custom':
      return {
        start: filter.startDate || startOfDay(subDays(now, 30)),
        end: filter.endDate || endOfDay(now),
      };
    default:
      return { start: startOfDay(subDays(now, 30)), end: endOfDay(now) };
  }
}

// =====================================================
// SUMMARY HOOK (Backoffice — superadmin sees all tenants)
// Queries analytics_daily_metrics WITHOUT org filter
// =====================================================
export function useAnalyticsSummary(filter: AnalyticsFilter) {
  const { start, end } = getDateRange(filter);
  
  return useQuery<AnalyticsSummary>({
    queryKey: ['product-analytics-summary', filter.period, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      // Backoffice: no org filter — superadmin sees platform-wide
      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('*')
        .gte('metric_date', format(start, 'yyyy-MM-dd'))
        .lte('metric_date', format(end, 'yyyy-MM-dd'))
        .order('metric_date', { ascending: false });

      if (error) throw error;

      const metrics = data || [];
      
      // Aggregate from real analytics_daily_metrics columns
      const totalMattersActive = metrics.length > 0 ? metrics[0].matters_active || 0 : 0;
      const totalSessions = metrics.reduce((sum: number, d: any) => sum + (d.matters_created_today || 0), 0);
      const totalAIQueries = metrics.reduce((sum: number, d: any) => sum + (d.ai_queries_today || 0), 0);

      // Map to AnalyticsSummary shape for compatibility with existing components
      return {
        avgDAU: totalMattersActive,
        latestWAU: metrics.length,
        latestMAU: metrics.length,
        totalSessions,
        totalAIQueries,
        avgBounceRate: '0',
        trend: metrics as unknown as AnalyticsSummary['trend'],
      };
    },
    staleTime: STALE_TIME,
  });
}

// =====================================================
// TREND HOOK
// analytics_daily_metrics now exists with real columns
// =====================================================
export function useAnalyticsTrend(filter: AnalyticsFilter, metric: string) {
  const { start, end } = getDateRange(filter);

  return useQuery<TrendDataPoint[]>({
    queryKey: ['product-analytics-trend', filter.period, metric],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('metric_date, matters_active, matters_created_today, ai_queries_today, revenue_invoiced_month, deadline_compliance_rate')
        .gte('metric_date', format(start, 'yyyy-MM-dd'))
        .lte('metric_date', format(end, 'yyyy-MM-dd'))
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return (data || []) as TrendDataPoint[];
    },
    staleTime: STALE_TIME,
  });
}

// =====================================================
// TOP PAGES HOOK
// Uses analytics_events (now has org_id NOT NULL)
// =====================================================
export function useTopPages(filter: AnalyticsFilter, limit: number = 10) {
  const { start, end } = getDateRange(filter);

  return useQuery<TopPage[]>({
    queryKey: ['product-analytics-top-pages', filter.period, limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('page_path')
        .eq('event_category', 'page_view')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .limit(1000);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((e) => {
        if (e.page_path) {
          counts[e.page_path] = (counts[e.page_path] || 0) + 1;
        }
      });

      return Object.entries(counts)
        .map(([path, views]) => ({ path, views }))
        .sort((a, b) => b.views - a.views)
        .slice(0, limit);
    },
    staleTime: STALE_TIME,
  });
}

// =====================================================
// FEATURE USAGE HOOK
// Queries analytics_events with event_category='feature_use'
// (analytics_feature_usage table doesn't exist)
// =====================================================
export function useFeatureUsage(filter: AnalyticsFilter) {
  const { start, end } = getDateRange(filter);

  return useQuery<TopFeature[]>({
    queryKey: ['product-analytics-feature-usage', filter.period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('event_name')
        .eq('event_category', 'feature_use')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .limit(1000);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((e) => {
        if (e.event_name) {
          const feature = e.event_name.replace('feature_', '');
          counts[feature] = (counts[feature] || 0) + 1;
        }
      });

      return Object.entries(counts)
        .map(([feature, uses]) => ({ feature, uses }))
        .sort((a, b) => b.uses - a.uses);
    },
    staleTime: STALE_TIME,
  });
}

// =====================================================
// REALTIME USERS HOOK
// =====================================================
export function useRealtimeUsers() {
  return useQuery<number>({
    queryKey: ['product-analytics-realtime-users'],
    queryFn: async () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      const { count, error } = await supabase
        .from('analytics_events')
        .select('session_id', { count: 'exact', head: true })
        .gte('created_at', fiveMinutesAgo.toISOString());

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

// =====================================================
// DEVICE BREAKDOWN HOOK
// =====================================================
export function useDeviceBreakdown(filter: AnalyticsFilter) {
  const { start, end } = getDateRange(filter);

  return useQuery({
    queryKey: ['product-analytics-devices', filter.period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_events')
        .select('device_type')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .limit(1000);

      if (error) throw error;

      const counts: Record<string, number> = { desktop: 0, mobile: 0, tablet: 0 };
      (data || []).forEach((e) => {
        const type = e.device_type || 'desktop';
        counts[type] = (counts[type] || 0) + 1;
      });

      const total = Object.values(counts).reduce((a, b) => a + b, 0) || 1;
      
      return {
        desktop: Math.round((counts.desktop / total) * 100),
        mobile: Math.round((counts.mobile / total) * 100),
        tablet: Math.round((counts.tablet / total) * 100),
      };
    },
    staleTime: STALE_TIME,
  });
}

// =====================================================
// PLATFORM-WIDE METRICS (Backoffice only)
// =====================================================
export function usePlatformMetrics() {
  return useQuery({
    queryKey: ['platform-metrics'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('organization_id, matters_active, revenue_invoiced_month, ai_cost_month_eur')
        .eq('metric_date', today);

      if (error) throw error;

      const rows = data || [];
      const uniqueOrgs = new Set(rows.map(r => r.organization_id));

      return {
        total_tenants: uniqueOrgs.size,
        total_matters_platform: rows.reduce((s: number, r: any) => s + (r.matters_active || 0), 0),
        total_revenue_platform: rows.reduce((s: number, r: any) => s + Number(r.revenue_invoiced_month || 0), 0),
        total_ai_cost_platform: rows.reduce((s: number, r: any) => s + Number(r.ai_cost_month_eur || 0), 0),
      };
    },
    staleTime: STALE_TIME,
  });
}
