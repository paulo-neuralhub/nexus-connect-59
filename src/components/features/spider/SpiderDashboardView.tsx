/**
 * SP01-A — IP-SPIDER Shell: Header + 4 Filter Badges + 4 KPIs + 70/30 Layout
 * All data from real DB queries.
 */
import { useState } from 'react';
import { Eye, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NeoBadge } from '@/components/ui/neo-badge';
import { useOrganization } from '@/contexts/organization-context';
import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { SpiderAlertsList } from './SpiderAlertsList';
import { SpiderWatchesPanel } from './SpiderWatchesPanel';

const SPIDER_VIOLET = '#8B5CF6';

type SeverityFilter = 'critical' | 'high' | 'medium' | 'resolved' | null;

export function SpiderDashboardView() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>(null);

  // ── Tenant Config ──
  const { data: config, isLoading: configLoading } = useQuery({
    queryKey: ['spider-shell-config', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_tenant_config')
        .select('is_active, plan_code, alerts_this_month, max_alerts_per_month')
        .eq('organization_id', orgId!)
        .maybeSingle();
      if (error) throw error;
      return data as any;
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 5,
  });

  // ── Filter Badge Counts ──
  const { data: badgeCounts, isLoading: badgeLoading } = useQuery({
    queryKey: ['spider-badge-counts', orgId],
    queryFn: async () => {
      const [criticalRes, highRes, mediumRes, resolvedRes] = await Promise.all([
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('severity', 'critical')
          .not('status', 'in', '("resolved","actioned")'),
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('severity', 'high')
          .eq('status', 'new'),
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('severity', 'medium')
          .eq('status', 'new'),
        fromTable('spider_alerts')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .in('status', ['resolved', 'actioned']),
      ]);
      return {
        critical: criticalRes.count ?? 0,
        high: highRes.count ?? 0,
        medium: mediumRes.count ?? 0,
        resolved: resolvedRes.count ?? 0,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  // ── KPI Data ──
  const { data: kpis, isLoading: kpiLoading } = useQuery({
    queryKey: ['spider-kpis', orgId],
    queryFn: async () => {
      const [watchesRes, urgentRes, scoreRes] = await Promise.all([
        fromTable('spider_watches')
          .select('id', { count: 'exact', head: true })
          .eq('organization_id', orgId!)
          .eq('is_active', true),
        fromTable('spider_alerts')
          .select('opposition_days_remaining')
          .eq('organization_id', orgId!)
          .eq('status', 'new')
          .not('opposition_days_remaining', 'is', null)
          .order('opposition_days_remaining', { ascending: true })
          .limit(1),
        fromTable('spider_alerts')
          .select('combined_score')
          .eq('organization_id', orgId!)
          .eq('status', 'new')
          .not('combined_score', 'is', null)
          .order('combined_score', { ascending: false })
          .limit(1),
      ]);

      const urgentDays = (urgentRes.data as any)?.[0]?.opposition_days_remaining ?? null;
      const maxScore = (scoreRes.data as any)?.[0]?.combined_score ?? null;

      return {
        activeWatches: watchesRes.count ?? 0,
        alertsThisMonth: 0,  // filled from config
        maxAlerts: 0,         // filled from config
        urgentDays: urgentDays as number | null,
        maxScore: maxScore as number | null,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const isLoading = configLoading || badgeLoading || kpiLoading;

  // ── Inactive State ──
  if (!configLoading && config && config.is_active === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Eye className="w-16 h-16 text-muted-foreground/40" />
        <p className="text-lg font-semibold text-muted-foreground">IP-SPIDER no está activo</p>
        <Button asChild>
          <a href="/app/settings/subscription">Ver planes</a>
        </Button>
      </div>
    );
  }

  const alertsMonth = config?.alerts_this_month ?? kpis?.alertsThisMonth ?? 0;
  const maxAlertsMonth = config?.max_alerts_per_month ?? kpis?.maxAlerts ?? 0;

  const urgentColor = kpis?.urgentDays != null
    ? kpis.urgentDays < 30 ? '#EF4444' : kpis.urgentDays < 60 ? '#F59E0B' : '#22C55E'
    : '#94a3b8';

  const scoreColor = kpis?.maxScore != null
    ? kpis.maxScore > 84 ? '#EF4444' : kpis.maxScore > 69 ? '#F59E0B' : '#22C55E'
    : '#94a3b8';

  const filterBadges: { key: SeverityFilter; label: string; count: number; color: string }[] = [
    { key: 'critical', label: 'Críticas', count: badgeCounts?.critical ?? 0, color: '#EF4444' },
    { key: 'high', label: 'Altas', count: badgeCounts?.high ?? 0, color: '#F97316' },
    { key: 'medium', label: 'Medias', count: badgeCounts?.medium ?? 0, color: '#EAB308' },
    { key: 'resolved', label: 'Resueltas', count: badgeCounts?.resolved ?? 0, color: '#22C55E' },
  ];

  return (
    <div className="space-y-6">
      {/* ── HEADER ── */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <Eye className="w-6 h-6" style={{ color: SPIDER_VIOLET }} />
          <div>
            <h1 className="text-xl font-bold text-foreground leading-none">IP-SPIDER</h1>
            <p className="text-sm text-slate-500">Brand Defense Center</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {config?.plan_code && (
            <Badge variant="outline" className="text-xs font-mono">
              {config.plan_code}
            </Badge>
          )}
          <Button
            size="sm"
            disabled={!config?.is_active}
            className="gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Nueva Vigilancia
          </Button>
        </div>
      </div>

      {/* ── FILTER BADGES ── */}
      <div className="flex flex-wrap gap-2">
        {badgeLoading
          ? Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-8 w-24 rounded-full" />
            ))
          : filterBadges.map((b) => {
              const isActive = activeFilter === b.key;
              const isZero = b.count === 0;
              return (
                <button
                  key={b.key}
                  disabled={isZero}
                  onClick={() => setActiveFilter(isActive ? null : b.key)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-default"
                  style={{
                    background: isZero ? '#f1f5f9' : `${b.color}15`,
                    color: isZero ? '#94a3b8' : b.color,
                    border: isActive ? `2px solid ${b.color}` : `1px solid ${isZero ? '#e2e8f0' : b.color}40`,
                  }}
                >
                  <span className="w-2 h-2 rounded-full" style={{ background: isZero ? '#94a3b8' : b.color }} />
                  {b.label}
                  <span className="font-bold tabular-nums">{b.count}</span>
                </button>
              );
            })
        }
      </div>

      {/* ── 4 KPIs ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiLoading || configLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-[72px] rounded-[14px]" />
          ))
        ) : (
          <>
            <KPICard
              label="Watches activos"
              value={kpis?.activeWatches ?? 0}
              color={SPIDER_VIOLET}
            />
            <KPICard
              label="Alertas este mes"
              value={alertsMonth}
              subtitle={`de ${maxAlertsMonth === 0 ? '∞' : maxAlertsMonth}`}
              color={SPIDER_VIOLET}
            />
            <KPICard
              label="Plazo urgente"
              value={kpis?.urgentDays != null ? `${kpis.urgentDays}d` : '—'}
              color={urgentColor}
            />
            <KPICard
              label="Score máx"
              value={kpis?.maxScore != null ? `${Math.round(kpis.maxScore)}%` : '—'}
              color={scoreColor}
            />
          </>
        )}
      </div>

      {/* ── 70/30 LAYOUT ── */}
      <div className="grid grid-cols-1 md:grid-cols-[7fr_3fr] gap-6">
        {/* Left 70% — Alerts */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Alertas detectadas</h2>
          <SpiderAlertsList activeFilter={activeFilter} />
        </div>

        {/* Right 30% — Watches */}
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3">Mis Vigilancias</h2>
          <SpiderWatchesPanel />
        </div>
      </div>
    </div>
  );
}

function KPICard({
  label,
  value,
  subtitle,
  color,
}: {
  label: string;
  value: string | number;
  subtitle?: string;
  color: string;
}) {
  return (
    <div className="rounded-[14px] border border-border bg-card p-4 flex items-center gap-3">
      <NeoBadge value={value} color={color} size="md" />
      <div className="min-w-0">
        <span className="text-[11px] font-semibold uppercase tracking-wide text-foreground block truncate">
          {label}
        </span>
        {subtitle && (
          <span className="text-[10px] text-muted-foreground">{subtitle}</span>
        )}
      </div>
    </div>
  );
}
