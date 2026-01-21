import { useState } from 'react';
import { Users, Activity, MousePointer, Bot, Radio } from 'lucide-react';
import { 
  useAnalyticsSummary, 
  useAnalyticsTrend, 
  useTopPages, 
  useFeatureUsage,
  useRealtimeUsers,
  useDeviceBreakdown
} from '@/hooks/admin/useProductAnalytics';
import { AnalyticsFilter, AnalyticsPeriodType } from '@/types/analytics';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { KPICard } from './KPICard';
import { DAUChart } from './DAUChart';
import { FeatureUsageChart } from './FeatureUsageChart';
import { TopPagesCard } from './TopPagesCard';
import { QuickStatsCard } from './QuickStatsCard';

export function ProductAnalyticsDashboard() {
  const [filter, setFilter] = useState<AnalyticsFilter>({ period: '30d' });
  
  const { data: summary, isLoading: summaryLoading } = useAnalyticsSummary(filter);
  const { data: dauTrend, isLoading: trendLoading } = useAnalyticsTrend(filter, 'daily_active_users');
  const { data: topPages, isLoading: pagesLoading } = useTopPages(filter, 10);
  const { data: featureUsage, isLoading: featuresLoading } = useFeatureUsage(filter);
  const { data: realtimeUsers } = useRealtimeUsers();
  const { data: devices, isLoading: devicesLoading } = useDeviceBreakdown(filter);

  const handlePeriodChange = (value: string) => {
    setFilter({ period: value as AnalyticsPeriodType });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Product Analytics</h1>
            <p className="text-muted-foreground">Métricas de uso de la plataforma</p>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Realtime indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-accent/20 text-accent-foreground rounded-full text-sm">
              <Radio className="h-3 w-3 animate-pulse" />
              <span>{realtimeUsers ?? 0} usuarios activos</span>
            </div>
            
            {/* Period selector */}
            <Select value={filter.period} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hoy</SelectItem>
                <SelectItem value="7d">Últimos 7 días</SelectItem>
                <SelectItem value="30d">Últimos 30 días</SelectItem>
                <SelectItem value="90d">Últimos 90 días</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="DAU Promedio" 
            value={summary?.avgDAU || 0} 
            icon={Users} 
            trend={5.2}
            color="blue"
            isLoading={summaryLoading}
          />
          <KPICard 
            title="Sesiones Totales" 
            value={summary?.totalSessions || 0} 
            icon={Activity} 
            trend={12.3}
            color="green"
            isLoading={summaryLoading}
          />
          <KPICard 
            title="WAU" 
            value={summary?.latestWAU || 0} 
            icon={MousePointer} 
            trend={-2.1}
            color="purple"
            isLoading={summaryLoading}
          />
          <KPICard 
            title="Consultas IA" 
            value={summary?.totalAIQueries || 0} 
            icon={Bot} 
            trend={28.5}
            color="amber"
            isLoading={summaryLoading}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <DAUChart data={dauTrend} isLoading={trendLoading} />
          <FeatureUsageChart data={featureUsage} isLoading={featuresLoading} />
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TopPagesCard data={topPages} isLoading={pagesLoading} />
          <QuickStatsCard 
            summary={summary} 
            devices={devices} 
            isLoading={summaryLoading || devicesLoading} 
          />
        </div>
      </div>
    </div>
  );
}
