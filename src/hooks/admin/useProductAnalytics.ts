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
// SUMMARY HOOK
// =====================================================
export function useAnalyticsSummary(filter: AnalyticsFilter) {
  const { start, end } = getDateRange(filter);
  
  return useQuery<AnalyticsSummary>({
    queryKey: ['product-analytics-summary', filter.period, start.toISOString(), end.toISOString()],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('*')
        .gte('metric_date', format(start, 'yyyy-MM-dd'))
        .lte('metric_date', format(end, 'yyyy-MM-dd'))
        .order('metric_date', { ascending: false });

      if (error) throw error;

      const metrics = data || [];
      
      // Aggregate metrics
      const totalDAU = metrics.reduce((sum, d) => sum + (d.daily_active_users || 0), 0);
      const avgDAU = Math.round(totalDAU / (metrics.length || 1));
      const latestWAU = metrics[0]?.weekly_active_users || 0;
      const latestMAU = metrics[0]?.monthly_active_users || 0;
      const totalSessions = metrics.reduce((sum, d) => sum + (d.total_sessions || 0), 0);
      const totalAIQueries = metrics.reduce((sum, d) => sum + (d.ai_queries || 0), 0);
      const avgBounceRate = metrics.length
        ? (metrics.reduce((sum, d) => sum + (d.bounce_rate || 0), 0) / metrics.length).toFixed(1)
        : '0';

      return {
        avgDAU,
        latestWAU,
        latestMAU,
        totalSessions,
        totalAIQueries,
        avgBounceRate,
        trend: metrics as unknown as AnalyticsSummary['trend'],
      };
    },
  });
}

// =====================================================
// TREND HOOK
// =====================================================
export function useAnalyticsTrend(filter: AnalyticsFilter, metric: string) {
  const { start, end } = getDateRange(filter);

  return useQuery<TrendDataPoint[]>({
    queryKey: ['product-analytics-trend', filter.period, metric],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_daily_metrics')
        .select('metric_date, daily_active_users, weekly_active_users, monthly_active_users, total_sessions, ai_queries')
        .gte('metric_date', format(start, 'yyyy-MM-dd'))
        .lte('metric_date', format(end, 'yyyy-MM-dd'))
        .order('metric_date', { ascending: true });

      if (error) throw error;
      return (data || []) as TrendDataPoint[];
    },
  });
}

// =====================================================
// TOP PAGES HOOK
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
        .limit(1000); // Limit to avoid heavy queries

      if (error) throw error;

      // Aggregate by page
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
  });
}

// =====================================================
// FEATURE USAGE HOOK
// =====================================================
export function useFeatureUsage(filter: AnalyticsFilter) {
  const { start, end } = getDateRange(filter);

  return useQuery<TopFeature[]>({
    queryKey: ['product-analytics-feature-usage', filter.period],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('analytics_feature_usage')
        .select('feature_key')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .limit(1000);

      if (error) throw error;

      const counts: Record<string, number> = {};
      (data || []).forEach((e) => {
        counts[e.feature_key] = (counts[e.feature_key] || 0) + 1;
      });

      return Object.entries(counts)
        .map(([feature, uses]) => ({ feature, uses }))
        .sort((a, b) => b.uses - a.uses);
    },
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
    refetchInterval: 30000, // Every 30 seconds
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
  });
}
