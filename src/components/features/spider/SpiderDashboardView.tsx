/**
 * Spider Dashboard — main view when has_spider = true
 * Usage bars, NeoBadges, critical banner, tabs
 */
import { useState } from 'react';
import { Radar } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useSpiderDashboardStats } from '@/hooks/use-spider-data';
import { SpiderAlertsTab } from './SpiderAlertsTab';
import { SpiderWatchesTab } from './SpiderWatchesTab';
import { SpiderStatsTab } from './SpiderStatsTab';
import { SpiderConfigTab } from './SpiderConfigTab';

const SPIDER_VIOLET = '#8B5CF6';

export function SpiderDashboardView() {
  const { data: stats, isLoading } = useSpiderDashboardStats();
  const [activeTab, setActiveTab] = useState('alerts');

  const scansPercent = stats?.scansLimit ? Math.round((stats.scansUsed / stats.scansLimit) * 100) : 0;
  const alertsPercent = stats?.alertsLimit ? Math.round((stats.alertsUsed / stats.alertsLimit) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <div
          className="w-12 h-12 rounded-[14px] flex items-center justify-center"
          style={{
            background: `linear-gradient(135deg, ${SPIDER_VIOLET}, #7C3AED)`,
            boxShadow: `0 4px 12px ${SPIDER_VIOLET}40`,
          }}
        >
          <Radar className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-foreground">IP-SPIDER</h1>
          <p className="text-sm text-muted-foreground">Vigilancia y monitorización de PI</p>
        </div>
      </div>

      {/* Usage bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <UsageBar
          label="Escaneos este mes"
          used={stats?.scansUsed ?? 0}
          limit={stats?.scansLimit ?? 0}
          percent={scansPercent}
          loading={isLoading}
        />
        <UsageBar
          label="Alertas este mes"
          used={stats?.alertsUsed ?? 0}
          limit={stats?.alertsLimit ?? 0}
          percent={alertsPercent}
          loading={isLoading}
        />
      </div>

      {/* KPI NeoBadges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-[14px]" />
          ))
        ) : (
          <>
            <KPICard icon="📊" label="Vigilancias" value={stats?.activeWatches ?? 0} />
            <KPICard icon="📥" label="Pendientes" value={stats?.pendingAlerts ?? 0} />
            <KPICard icon="⚠️" label="Amenazas" value={stats?.threatsActive ?? 0} />
            <KPICard icon="🔴" label="Críticas" value={stats?.criticalAlerts ?? 0} urgent />
          </>
        )}
      </div>

      {/* Critical banner */}
      {(stats?.criticalAlerts ?? 0) > 0 && (
        <div className="rounded-xl border-2 border-[#EF4444]/30 bg-[#EF4444]/5 p-4 flex items-center gap-3">
          <div className="relative">
            <div className="w-3 h-3 rounded-full bg-[#EF4444] animate-pulse" />
            <div className="absolute inset-0 w-3 h-3 rounded-full bg-[#EF4444] animate-ping opacity-50" />
          </div>
          <p className="font-medium text-[#EF4444] text-sm">
            {stats!.criticalAlerts} alerta{stats!.criticalAlerts > 1 ? 's' : ''} crítica{stats!.criticalAlerts > 1 ? 's' : ''} requiere{stats!.criticalAlerts > 1 ? 'n' : ''} atención inmediata
          </p>
        </div>
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full justify-start bg-muted/50 p-1">
          <TabsTrigger value="alerts" className="gap-1.5">
            🔔 Alertas
            {(stats?.pendingAlerts ?? 0) > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">{stats!.pendingAlerts}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="watches">🔍 Vigilancias</TabsTrigger>
          <TabsTrigger value="stats">📈 Estadísticas</TabsTrigger>
          <TabsTrigger value="config">⚙️ Config</TabsTrigger>
        </TabsList>

        <TabsContent value="alerts" className="mt-4">
          <SpiderAlertsTab />
        </TabsContent>
        <TabsContent value="watches" className="mt-4">
          <SpiderWatchesTab />
        </TabsContent>
        <TabsContent value="stats" className="mt-4">
          <SpiderStatsTab />
        </TabsContent>
        <TabsContent value="config" className="mt-4">
          <SpiderConfigTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UsageBar({ label, used, limit, percent, loading }: { label: string; used: number; limit: number; percent: number; loading: boolean }) {
  const color = percent >= 80 ? '#EF4444' : percent >= 60 ? '#F97316' : percent >= 40 ? '#F59E0B' : '#22C55E';

  if (loading) return <Skeleton className="h-16 rounded-xl" />;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <span className="text-xs font-semibold" style={{ color }}>
          {used} / {limit === 0 ? '∞' : limit}
        </span>
      </div>
      <Progress value={limit ? Math.min(percent, 100) : 0} stateColor={color} />
    </div>
  );
}

function KPICard({ icon, label, value, urgent }: { icon: string; label: string; value: number; urgent?: boolean }) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4 flex items-center gap-3">
      <div className="relative">
        {urgent && value > 0 && (
          <>
            <div className="absolute -inset-1 rounded-[14px] animate-pulse" style={{ background: '#EF444425', border: '2px solid #EF444440' }} />
            <div className="absolute -inset-1 rounded-[14px] animate-ping opacity-30" style={{ border: '2px solid #EF444430' }} />
          </>
        )}
        <NeoBadge value={value} color={urgent && value > 0 ? '#EF4444' : SPIDER_VIOLET} size="md" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-1">
          <span className="text-sm">{icon}</span>
          <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground truncate">{label}</span>
        </div>
      </div>
    </div>
  );
}
