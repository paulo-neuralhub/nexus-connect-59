/**
 * SP01-A — IP-SPIDER Shell: Header + 4 Filter Badges + 4 KPIs + 70/30 Layout
 * SP05-A — Incident Engine: multi-channel incidents section
 */
import { useState, useCallback } from 'react';
import { Eye, Plus, RefreshCw, AlertTriangle, ChevronDown, ChevronUp, Link2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NeoBadge } from '@/components/ui/neo-badge';
import { useOrganization } from '@/contexts/organization-context';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { SpiderAlertsList } from './SpiderAlertsList';
import { SpiderWatchesPanel } from './SpiderWatchesPanel';

const SPIDER_VIOLET = '#8B5CF6';

type SeverityFilter = 'critical' | 'high' | 'medium' | 'resolved' | null;

export function SpiderDashboardView() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [activeFilter, setActiveFilter] = useState<SeverityFilter>(null);
  const [incidentFilter, setIncidentFilter] = useState<{ ids: string[]; title: string } | null>(null);
  const [groupingDisabled, setGroupingDisabled] = useState(false);

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
        alertsThisMonth: 0,
        maxAlerts: 0,
        urgentDays: urgentDays as number | null,
        maxScore: maxScore as number | null,
      };
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Grouping handler ──
  const handleGroupAlerts = useCallback(async () => {
    if (!orgId) return;
    setGroupingDisabled(true);
    try {
      await supabase.functions.invoke('spider-incident-engine', {
        body: { run_for_org: true, organization_id: orgId },
      });
      toast.success('Agrupando alertas por actor... Actualiza en breve');
    } catch {
      toast.error('No se pudo iniciar el agrupamiento');
    }
    setTimeout(() => setGroupingDisabled(false), 30000);
  }, [orgId]);

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
            <p className="text-sm text-muted-foreground">Brand Defense Center</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {config?.plan_code && (
            <Badge variant="outline" className="text-xs font-mono">
              {config.plan_code}
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 text-xs"
            onClick={handleGroupAlerts}
            disabled={groupingDisabled || !config?.is_active}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${groupingDisabled ? 'animate-spin' : ''}`} />
            Agrupar alertas
          </Button>
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
        {/* Left 70% — Incidents + Alerts */}
        <div className="space-y-4">
          {/* Incidents Section */}
          <IncidentsSection
            orgId={orgId!}
            onFilterByIncident={(ids, title) => setIncidentFilter({ ids, title })}
          />

          {/* Incident filter banner */}
          {incidentFilter && (
            <div className="rounded-lg p-3 border flex items-center gap-2"
              style={{ background: `${SPIDER_VIOLET}08`, borderColor: `${SPIDER_VIOLET}30` }}>
              <AlertTriangle className="w-4 h-4 flex-shrink-0" style={{ color: SPIDER_VIOLET }} />
              <span className="text-xs text-foreground flex-1">
                Mostrando <strong>{incidentFilter.ids.length}</strong> alertas del incidente: <strong>{incidentFilter.title}</strong>
              </span>
              <button
                onClick={() => setIncidentFilter(null)}
                className="text-xs font-medium hover:underline"
                style={{ color: SPIDER_VIOLET }}
              >
                × Limpiar filtro
              </button>
            </div>
          )}

          <h2 className="text-sm font-semibold text-foreground">Alertas detectadas</h2>
          <SpiderAlertsList
            activeFilter={activeFilter}
            incidentFilterIds={incidentFilter?.ids ?? null}
            onFilterByIncident={(ids, title) => setIncidentFilter({ ids, title })}
          />
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

// ════════════════════════════════════════════
// Incidents Section (SP05-A)
// ════════════════════════════════════════════

const SOURCE_BADGES: Record<string, { cls: string; label: string }> = {
  registral: { cls: 'bg-blue-100 text-blue-700 border-blue-200', label: 'Registral' },
  visual: { cls: 'bg-purple-100 text-purple-700 border-purple-200', label: 'Visual' },
  social: { cls: 'bg-pink-100 text-pink-700 border-pink-200', label: 'Social' },
  domain: { cls: 'bg-teal-100 text-teal-700 border-teal-200', label: 'Dominio' },
  marketplace: { cls: 'bg-green-100 text-green-700 border-green-200', label: 'Marketplace' },
};

const INCIDENT_SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#94a3b8',
};

function IncidentsSection({
  orgId,
  onFilterByIncident,
}: {
  orgId: string;
  onFilterByIncident: (ids: string[], title: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const { data: incidents } = useQuery({
    queryKey: ['spider-incidents', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_incidents')
        .select('*')
        .eq('organization_id', orgId)
        .gt('alert_count', 1)
        .neq('status', 'resolved')
        .order('risk_score_unified', { ascending: false })
        .limit(5);
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  if (!incidents || incidents.length === 0) return null;

  const handleProcess = async (incident: any) => {
    setProcessingId(incident.id);
    try {
      await supabase.functions.invoke('spider-incident-engine', {
        body: { run_for_org: true, organization_id: orgId },
      });
      toast.success('Procesando incidentes... Actualiza en unos segundos');
    } catch {
      toast.error('No se pudo procesar');
    } finally {
      setProcessingId(null);
    }
  };

  const riskColor = (score: number) =>
    score >= 80 ? '#EF4444' : score >= 60 ? '#F97316' : score >= 40 ? '#EAB308' : '#94a3b8';

  return (
    <div className="rounded-[14px] border border-border bg-card overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-accent/30 transition-colors"
      >
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span className="text-sm font-semibold text-foreground">Incidentes multi-canal</span>
          <span
            className="text-[10px] font-bold px-1.5 py-0.5 rounded border"
            style={{ background: `${SPIDER_VIOLET}15`, color: SPIDER_VIOLET, borderColor: `${SPIDER_VIOLET}30` }}
          >
            {incidents.length} activos
          </span>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3">
          {incidents.map((inc: any) => {
            const sevColor = INCIDENT_SEVERITY_COLORS[inc.severity] || '#94a3b8';
            return (
              <div
                key={inc.id}
                className="rounded-[12px] border border-border border-l-4 p-3 space-y-2 bg-card"
                style={{ borderLeftColor: sevColor }}
              >
                {/* Row 1 */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap min-w-0">
                    <span className="text-[15px] font-bold text-foreground truncate">{inc.incident_title || inc.entity_name}</span>
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
                      style={{ background: `${SPIDER_VIOLET}15`, color: SPIDER_VIOLET, borderColor: `${SPIDER_VIOLET}30` }}
                    >
                      MULTI-CANAL
                    </span>
                  </div>
                  <span
                    className="text-lg font-bold tabular-nums flex-shrink-0"
                    style={{ color: riskColor(inc.risk_score_unified ?? 0) }}
                  >
                    {inc.risk_score_unified ?? '—'}
                  </span>
                </div>

                {/* Row 2 — Sources */}
                {inc.sources && Array.isArray(inc.sources) && inc.sources.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1">
                    {inc.sources.map((s: string) => {
                      const badge = SOURCE_BADGES[s] || { cls: 'bg-slate-100 text-slate-600 border-slate-200', label: s };
                      return (
                        <span key={s} className={`text-[10px] font-medium px-1.5 py-0.5 rounded border ${badge.cls}`}>
                          {badge.label}
                        </span>
                      );
                    })}
                  </div>
                )}

                {/* Row 3 — Platforms */}
                {inc.platforms && Array.isArray(inc.platforms) && inc.platforms.length > 0 && (
                  <p className="text-[11px] text-muted-foreground">
                    {inc.platforms.join(' · ')}
                  </p>
                )}

                {/* Row 4 — Metrics */}
                <p className="text-[11px] text-muted-foreground">
                  <strong>{inc.alert_count}</strong> alertas vinculadas
                  {inc.first_detected_at && (
                    <> · Detectado: {formatDistanceToNow(new Date(inc.first_detected_at), { addSuffix: true, locale: es })}</>
                  )}
                  {inc.last_updated_at && (
                    <> · Actualizado: {formatDistanceToNow(new Date(inc.last_updated_at), { addSuffix: true, locale: es })}</>
                  )}
                </p>

                {/* Row 5 — Actions */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs gap-1"
                    style={{ borderColor: `${SPIDER_VIOLET}40`, color: SPIDER_VIOLET }}
                    onClick={() => {
                      const ids = Array.isArray(inc.alert_ids) ? inc.alert_ids : [];
                      onFilterByIncident(ids, inc.incident_title || inc.entity_name);
                    }}
                  >
                    Ver alertas →
                  </Button>
                  <Button
                    variant="outline" size="sm"
                    className="h-7 text-xs gap-1 border-blue-300 text-blue-700"
                    onClick={() => handleProcess(inc)}
                    disabled={processingId === inc.id}
                  >
                    {processingId === inc.id ? 'Procesando...' : 'Procesar incidente'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
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
