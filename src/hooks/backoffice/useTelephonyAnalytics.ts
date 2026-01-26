// ============================================================
// IP-NEXUS BACKOFFICE - Telephony Analytics Hook
// ============================================================

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { subDays, startOfMonth, endOfMonth, format } from 'date-fns';

export type DateRangeType = 'week' | 'month' | 'quarter' | 'year';

export interface TelephonyGlobalMetrics {
  totalCalls: number;
  totalMinutes: number;
  totalHours: string;
  totalSMS: number;
  totalRevenue: number;
  totalCost: number;
  margin: number;
  marginPercentage: number;
  avgCallDuration: number;
}

export interface TenantConsumption {
  id: string;
  tenantId: string;
  tenantName: string;
  calls: number;
  minutes: number;
  formattedMinutes: string;
  spent: number;
  balance: number;
  isLowBalance: boolean;
  isZeroBalance: boolean;
}

export interface CountryBreakdown {
  country: string;
  countryCode: string;
  flag: string;
  minutes: number;
  calls: number;
  cost: number;
  percentage: number;
}

export interface CallLog {
  id: string;
  createdAt: string;
  tenantName: string;
  userName: string;
  fromNumber: string;
  toNumber: string;
  countryCode: string;
  durationSeconds: number;
  durationFormatted: string;
  usageType: string;
  status: string;
  chargedCost: number;
}

export interface DailyMetric {
  date: string;
  callsOutbound: number;
  callsInbound: number;
  totalMinutes: number;
  revenue: number;
  cost: number;
}

const COUNTRY_FLAGS: Record<string, string> = {
  'ES': '🇪🇸',
  'FR': '🇫🇷',
  'DE': '🇩🇪',
  'IT': '🇮🇹',
  'PT': '🇵🇹',
  'UK': '🇬🇧',
  'GB': '🇬🇧',
  'US': '🇺🇸',
  'MX': '🇲🇽',
  'AR': '🇦🇷',
  'CO': '🇨🇴',
  'CL': '🇨🇱',
  'BR': '🇧🇷',
  'default': '🌍',
};

function getDateRange(range: DateRangeType): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (range) {
    case 'week':
      start = subDays(end, 7);
      break;
    case 'month':
      start = startOfMonth(end);
      break;
    case 'quarter':
      start = subDays(end, 90);
      break;
    case 'year':
      start = subDays(end, 365);
      break;
    default:
      start = startOfMonth(end);
  }

  return { start, end };
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${secs.toString().padStart(2, '0')}`;
}

function formatHoursMinutes(totalMinutes: number): string {
  const hours = Math.floor(totalMinutes / 60);
  const mins = Math.round(totalMinutes % 60);
  return `${hours}:${mins.toString().padStart(2, '0')}`;
}

export function useTelephonyGlobalMetrics(dateRange: DateRangeType = 'month') {
  return useQuery({
    queryKey: ['telephony-global-metrics', dateRange],
    queryFn: async (): Promise<TelephonyGlobalMetrics> => {
      const { start, end } = getDateRange(dateRange);

      const { data: dailyMetrics } = await supabase
        .from('telephony_daily_metrics')
        .select('*')
        .is('tenant_id', null) // Global metrics only
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0]);

      const totals = (dailyMetrics || []).reduce(
        (acc, m) => ({
          calls: acc.calls + (m.calls_outbound || 0) + (m.calls_inbound || 0),
          minutes: acc.minutes + (m.calls_total_minutes || 0),
          sms: acc.sms + (m.sms_outbound || 0) + (m.sms_inbound || 0),
          revenue: acc.revenue + Number(m.revenue || 0),
          cost: acc.cost + Number(m.provider_cost || 0),
        }),
        { calls: 0, minutes: 0, sms: 0, revenue: 0, cost: 0 }
      );

      const margin = totals.revenue - totals.cost;
      const marginPercentage = totals.revenue > 0 ? (margin / totals.revenue) * 100 : 0;
      const avgCallDuration = totals.calls > 0 ? (totals.minutes * 60) / totals.calls : 0;

      return {
        totalCalls: totals.calls,
        totalMinutes: Math.round(totals.minutes),
        totalHours: formatHoursMinutes(totals.minutes),
        totalSMS: totals.sms,
        totalRevenue: totals.revenue,
        totalCost: totals.cost,
        margin,
        marginPercentage,
        avgCallDuration,
      };
    },
  });
}

export function useTelephonyDailyMetrics(dateRange: DateRangeType = 'month') {
  return useQuery({
    queryKey: ['telephony-daily-metrics', dateRange],
    queryFn: async (): Promise<DailyMetric[]> => {
      const { start, end } = getDateRange(dateRange);

      const { data } = await supabase
        .from('telephony_daily_metrics')
        .select('*')
        .is('tenant_id', null)
        .gte('date', start.toISOString().split('T')[0])
        .lte('date', end.toISOString().split('T')[0])
        .order('date');

      return (data || []).map((m) => ({
        date: m.date,
        callsOutbound: m.calls_outbound || 0,
        callsInbound: m.calls_inbound || 0,
        totalMinutes: m.calls_total_minutes || 0,
        revenue: Number(m.revenue || 0),
        cost: Number(m.provider_cost || 0),
      }));
    },
  });
}

export function useTenantConsumption(dateRange: DateRangeType = 'month') {
  return useQuery({
    queryKey: ['tenant-consumption', dateRange],
    queryFn: async (): Promise<TenantConsumption[]> => {
      // Get tenant balances with org names
      const { data: balances } = await supabase
        .from('tenant_telephony_balance')
        .select('*, organizations!inner(id, name)')
        .eq('is_enabled', true)
        .order('total_minutes_used', { ascending: false });

      return (balances || []).map((b) => ({
        id: b.id,
        tenantId: b.tenant_id,
        tenantName: (b.organizations as any)?.name || 'Unknown',
        calls: 0, // Would need to aggregate from usage logs
        minutes: b.total_minutes_used || 0,
        formattedMinutes: formatHoursMinutes(b.total_minutes_used || 0),
        spent: Number(b.total_spent || 0),
        balance: b.minutes_balance || 0,
        isLowBalance: (b.minutes_balance || 0) < 30 && (b.minutes_balance || 0) > 0,
        isZeroBalance: (b.minutes_balance || 0) === 0,
      }));
    },
  });
}

export function useCountryBreakdown(dateRange: DateRangeType = 'month') {
  return useQuery({
    queryKey: ['country-breakdown', dateRange],
    queryFn: async (): Promise<CountryBreakdown[]> => {
      const { start } = getDateRange(dateRange);

      const { data: logs } = await supabase
        .from('telephony_usage_logs')
        .select('country_code, duration_minutes, charged_cost')
        .gte('created_at', start.toISOString())
        .not('country_code', 'is', null);

      // Aggregate by country
      const countryMap = new Map<string, { minutes: number; cost: number; calls: number }>();
      let totalMinutes = 0;

      (logs || []).forEach((log) => {
        const country = log.country_code || 'Unknown';
        const existing = countryMap.get(country) || { minutes: 0, cost: 0, calls: 0 };
        const mins = Number(log.duration_minutes || 0);
        existing.minutes += mins;
        existing.cost += Number(log.charged_cost || 0);
        existing.calls++;
        totalMinutes += mins;
        countryMap.set(country, existing);
      });

      return Array.from(countryMap.entries())
        .map(([code, data]) => ({
          country: code,
          countryCode: code,
          flag: COUNTRY_FLAGS[code] || COUNTRY_FLAGS['default'],
          minutes: Math.round(data.minutes),
          calls: data.calls,
          cost: data.cost,
          percentage: totalMinutes > 0 ? (data.minutes / totalMinutes) * 100 : 0,
        }))
        .sort((a, b) => b.minutes - a.minutes)
        .slice(0, 10);
    },
  });
}

export function useCallLogs(filters?: {
  tenantId?: string;
  usageType?: string;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
}) {
  return useQuery({
    queryKey: ['call-logs', filters],
    queryFn: async (): Promise<CallLog[]> => {
      let query = supabase
        .from('telephony_usage_logs')
        .select(`
          *,
          organizations:tenant_id(name),
          users:user_id(full_name)
        `)
        .order('created_at', { ascending: false })
        .limit(filters?.limit || 50);

      if (filters?.tenantId) {
        query = query.eq('tenant_id', filters.tenantId);
      }
      if (filters?.usageType) {
        query = query.eq('usage_type', filters.usageType);
      }
      if (filters?.startDate) {
        query = query.gte('created_at', filters.startDate.toISOString());
      }
      if (filters?.endDate) {
        query = query.lte('created_at', filters.endDate.toISOString());
      }

      const { data } = await query;

      return (data || []).map((log) => ({
        id: log.id,
        createdAt: log.created_at,
        tenantName: (log.organizations as any)?.name || 'Unknown',
        userName: (log.users as any)?.full_name || 'Unknown',
        fromNumber: log.from_number || '',
        toNumber: log.to_number || '',
        countryCode: log.country_code || '',
        durationSeconds: log.duration_seconds || 0,
        durationFormatted: formatDuration(log.duration_seconds || 0),
        usageType: log.usage_type || '',
        status: log.status || '',
        chargedCost: Number(log.charged_cost || 0),
      }));
    },
  });
}

export function useTenantDetail(tenantId: string) {
  return useQuery({
    queryKey: ['tenant-telephony-detail', tenantId],
    queryFn: async () => {
      // Get balance info
      const { data: balance } = await supabase
        .from('tenant_telephony_balance')
        .select('*, organizations!inner(name)')
        .eq('tenant_id', tenantId)
        .maybeSingle();

      // Get purchase history
      const { data: purchases } = await supabase
        .from('tenant_telephony_purchases')
        .select('*, telephony_packs(name, minutes_included, price)')
        .eq('tenant_id', tenantId)
        .order('purchased_at', { ascending: false })
        .limit(10);

      // Get recent calls
      const { data: recentCalls } = await supabase
        .from('telephony_usage_logs')
        .select('*, users:user_id(full_name)')
        .eq('tenant_id', tenantId)
        .order('created_at', { ascending: false })
        .limit(20);

      return {
        balance,
        purchases: purchases || [],
        recentCalls: (recentCalls || []).map((c) => ({
          ...c,
          durationFormatted: formatDuration(c.duration_seconds || 0),
          userName: (c.users as any)?.full_name || 'Unknown',
        })),
      };
    },
    enabled: !!tenantId,
  });
}

export function useExportConsumption() {
  const exportToCSV = async (dateRange: DateRangeType): Promise<Blob> => {
    const { start, end } = getDateRange(dateRange);

    const { data } = await supabase
      .from('telephony_usage_logs')
      .select(`
        created_at,
        usage_type,
        from_number,
        to_number,
        country_code,
        duration_seconds,
        duration_minutes,
        provider_cost,
        charged_cost,
        status,
        organizations:tenant_id(name),
        users:user_id(full_name)
      `)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false });

    // Convert to CSV
    const headers = [
      'Fecha',
      'Tenant',
      'Usuario',
      'Tipo',
      'Desde',
      'Hacia',
      'País',
      'Duración (seg)',
      'Coste proveedor',
      'Coste cobrado',
      'Estado',
    ];

    const rows = (data || []).map((log) => [
      format(new Date(log.created_at), 'yyyy-MM-dd HH:mm:ss'),
      (log.organizations as any)?.name || '',
      (log.users as any)?.full_name || '',
      log.usage_type,
      log.from_number,
      log.to_number,
      log.country_code,
      log.duration_seconds,
      log.provider_cost,
      log.charged_cost,
      log.status,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    return new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  };

  return { exportToCSV };
}
