/**
 * SP05-A v4 — Unified Incidents View for /app/spider
 * Full incidents list with filters, cards, bulk actions, resolution dialogs,
 * lazy-loaded nested alerts, empty states, and freshness indicator.
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import {
  AlertTriangle, Shield, ShieldCheck, CheckCircle, ChevronDown,
  RefreshCw, Filter, Link2, MoreHorizontal, Loader2, Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/lib/supabase';
import { fromTable } from '@/lib/supabase';
import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const SPIDER_VIOLET = '#8B5CF6';

// ── Dimension colors ──
const DIM_COLORS = {
  registral: '#3B82F6',
  visual: '#8B5CF6',
  digital: '#14B8A6',
};

const SOURCE_BADGES: Record<string, { bg: string; text: string; label: string }> = {
  registral: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Registral' },
  similarity: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Registral' },
  visual: { bg: 'bg-violet-100', text: 'text-violet-700', label: 'Visual' },
  social: { bg: 'bg-pink-100', text: 'text-pink-700', label: 'Social' },
  domain: { bg: 'bg-teal-100', text: 'text-teal-700', label: 'Dominio' },
  marketplace: { bg: 'bg-green-100', text: 'text-green-700', label: 'Marketplace' },
};

const SEVERITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F97316',
  medium: '#EAB308',
  low: '#94a3b8',
};

const OFFICIAL_PLATFORMS = new Set(['euipo', 'uspto', 'wipo', 'tmview', 'oepm']);

type TabKey = 'active' | 'investigating' | 'resolved';

const TAB_STATUS_MAP: Record<TabKey, string[]> = {
  active: ['new', 'actioned'],
  investigating: ['investigating'],
  resolved: ['resolved'],
};

// ── Resolution options ──
const CHANNEL_OPTIONS: Record<string, { label: string; options: string[] }> = {
  registral: { label: 'Registral', options: ['Oposición presentada', 'Observación presentada', 'Solicitud de nulidad', 'Sin acción registral'] },
  similarity: { label: 'Registral', options: ['Oposición presentada', 'Observación presentada', 'Solicitud de nulidad', 'Sin acción registral'] },
  social: { label: 'Redes sociales', options: ['Perfil reportado', 'C&D enviado', 'Sin acción en redes'] },
  domain: { label: 'Dominio', options: ['UDRP presentada', 'Dominio adquirido', 'Sin acción sobre dominio'] },
  visual: { label: 'Visual', options: ['Evidencia capturada', 'Análisis completado', 'Sin acción visual'] },
};

const OUTCOME_OPTIONS = [
  'Infracción confirmada — acciones iniciadas',
  'Coexistencia — riesgo aceptable',
  'Falso positivo — sin riesgo',
  'Monitorización continua',
];

interface SpiderIncidentsViewProps {
  organizationId: string;
  incidentCounts: {
    critical: number;
    high: number;
    medium: number;
    resolved: number;
  };
  onCountsRefresh: () => void;
}

export function SpiderIncidentsView({
  organizationId,
  incidentCounts,
  onCountsRefresh,
}: SpiderIncidentsViewProps) {
  const navigate = useNavigate();

  // ── State ──
  const [activeTab, setActiveTab] = useState<TabKey>('active');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedWatchId, setSelectedWatchId] = useState<string | null>(null);

  const [incidents, setIncidents] = useState<any[]>([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Nested alerts lazy cache (LRU max 5)
  const [nestedAlerts, setNestedAlerts] = useState<Record<string, any[]>>({});
  const [cacheOrder, setCacheOrder] = useState<string[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loadingNested, setLoadingNested] = useState<Record<string, boolean>>({});

  // Selection for bulk
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Resolution dialogs
  const [resolveIncident, setResolveIncident] = useState<any | null>(null);
  const [showBulkResolve, setShowBulkResolve] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [isResolvingBulk, setIsResolvingBulk] = useState(false);
  const [isMarkingBulk, setIsMarkingBulk] = useState(false);
  const [showBulkDiscard, setShowBulkDiscard] = useState(false);

  // Resolution form
  const [channelSelections, setChannelSelections] = useState<Record<string, string>>({});
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [resolveNotes, setResolveNotes] = useState('');
  const [bulkOutcome, setBulkOutcome] = useState('');
  const [bulkNotes, setBulkNotes] = useState('');

  // Freshness
  const [lastScanned, setLastScanned] = useState<string | null>(null);

  // Watches for filter
  const [watches, setWatches] = useState<{ id: string; watch_name: string }[]>([]);

  // Auth user
  const [userId, setUserId] = useState<string | null>(null);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null));
  }, []);

  // ── Load watches ──
  useEffect(() => {
    if (!organizationId) return;
    fromTable('spider_watches')
      .select('id, watch_name')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .then(({ data }) => setWatches((data as any[]) ?? []));
  }, [organizationId]);

  // ── Load freshness ──
  useEffect(() => {
    if (!organizationId) return;
    fromTable('spider_watches')
      .select('last_scanned_at')
      .eq('organization_id', organizationId)
      .eq('is_active', true)
      .order('last_scanned_at', { ascending: false })
      .limit(1)
      .then(({ data }) => {
        const row = (data as any[])?.[0];
        setLastScanned(row?.last_scanned_at ?? null);
      });
  }, [organizationId]);

  // ── Load incidents ──
  const loadIncidents = useCallback(async (
    reset = false,
    tab: TabKey = activeTab,
    severity: string = selectedSeverity,
  ) => {
    if (isLoading && !reset) return;
    setIsLoading(true);
    const currentOffset = reset ? 0 : offset;
    try {
      let query = supabase
        .from('spider_incidents')
        .select(`id, organization_id, incident_title, entity_name,
          risk_score_unified, registral_score, visual_score,
          digital_score, alert_count, sources, platforms,
          alert_ids, status, severity, resolution_outcome,
          first_detected_at, last_updated_at`)
        .eq('organization_id', organizationId)
        .order('risk_score_unified', { ascending: false })
        .range(currentOffset, currentOffset + 19);

      const statusFilter = TAB_STATUS_MAP[tab] ?? ['new', 'actioned'];
      if (statusFilter.length === 1) {
        query = query.eq('status', statusFilter[0]);
      } else {
        query = query.in('status', statusFilter);
      }

      if (severity && severity !== 'all') {
        query = query.eq('severity', severity);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (reset) {
        setIncidents(data ?? []);
        setOffset(20);
      } else {
        setIncidents(prev => [...prev, ...(data ?? [])]);
        setOffset(currentOffset + 20);
      }
      setHasMore((data?.length ?? 0) === 20);
    } catch {
      toast.error('Error al cargar incidentes');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, offset, activeTab, selectedSeverity, isLoading]);

  // Initial load
  useEffect(() => {
    if (!organizationId) return;
    loadIncidents(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organizationId, activeTab, selectedSeverity]);

  // ── Filter by watch ──
  const filterByWatch = useCallback(async (watchId: string | null) => {
    if (!watchId) {
      setSelectedWatchId(null);
      loadIncidents(true);
      return;
    }
    setSelectedWatchId(watchId);
    setIsLoading(true);
    try {
      const { data: watchAlerts, error } = await supabase
        .from('spider_alerts')
        .select('incident_group_id')
        .eq('watch_id', watchId)
        .eq('organization_id', organizationId)
        .not('incident_group_id', 'is', null)
        .limit(100);
      if (error) { toast.error('Error al filtrar'); return; }

      const incidentIds = [...new Set(
        (watchAlerts ?? []).map((a: any) => a.incident_group_id).filter(Boolean)
      )];

      if (incidentIds.length === 0) {
        setIncidents([]);
        setHasMore(false);
        return;
      }

      const { data } = await supabase
        .from('spider_incidents')
        .select(`id, organization_id, incident_title, entity_name,
          risk_score_unified, registral_score, visual_score,
          digital_score, alert_count, sources, platforms,
          alert_ids, status, severity, resolution_outcome,
          first_detected_at, last_updated_at`)
        .eq('organization_id', organizationId)
        .in('id', incidentIds)
        .order('risk_score_unified', { ascending: false });

      setIncidents(data ?? []);
      setHasMore(false);
    } catch {
      toast.error('Error al filtrar por marca');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, loadIncidents]);

  // ── Lazy load nested alerts ──
  const MAX_CACHE = 5;
  function addToCache(id: string, data: any[]) {
    setNestedAlerts(prev => {
      const next = { ...prev, [id]: data };
      if (Object.keys(next).length > MAX_CACHE) {
        const oldest = cacheOrder[0];
        if (oldest && oldest !== id) delete next[oldest];
      }
      return next;
    });
    setCacheOrder(prev => [...prev.filter(x => x !== id), id].slice(-MAX_CACHE));
  }

  async function loadNestedAlerts(incidentId: string) {
    if (nestedAlerts[incidentId]) {
      setExpandedId(expandedId === incidentId ? null : incidentId);
      return;
    }
    setLoadingNested(prev => ({ ...prev, [incidentId]: true }));
    try {
      const { data } = await supabase
        .from('spider_alerts')
        .select(`id, detected_mark_name, alert_category,
          combined_score, severity, status,
          social_platform, detected_jurisdiction`)
        .eq('incident_group_id', incidentId)
        .eq('organization_id', organizationId)
        .order('combined_score', { ascending: false })
        .limit(10);
      addToCache(incidentId, data ?? []);
      setExpandedId(incidentId);
    } catch {
      toast.error('Error al cargar alertas');
    } finally {
      setLoadingNested(prev => ({ ...prev, [incidentId]: false }));
    }
  }

  // ── Bulk helpers ──
  async function updateInChunks(
    table: string, ids: string[], updates: any, idField = 'id'
  ) {
    for (let i = 0; i < ids.length; i += 20) {
      const chunk = ids.slice(i, i + 20);
      await supabase.from(table).update(updates)
        .in(idField, chunk)
        .eq('organization_id', organizationId);
    }
  }

  function toggleSelect(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedIds.size === incidents.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(incidents.map(i => i.id)));
    }
  }

  // ── Time without action ──
  function getTimeWithoutAction(date: string) {
    const days = Math.floor((Date.now() - new Date(date).getTime()) / 86400000);
    if (days === 0) return { label: 'Hoy', color: 'text-green-600' };
    if (days <= 7) return { label: `${days}d sin gestionar`, color: 'text-amber-600' };
    return { label: `${days}d sin gestionar`, color: 'text-red-600' };
  }

  function riskColor(score: number) {
    if (score >= 80) return '#EF4444';
    if (score >= 60) return '#F97316';
    if (score >= 40) return '#EAB308';
    return '#94a3b8';
  }

  // ── Freshness indicator ──
  function getFreshness() {
    if (!lastScanned) return { dot: '#94a3b8', label: 'Sin datos' };
    const hours = (Date.now() - new Date(lastScanned).getTime()) / 3600000;
    if (hours < 4) return { dot: '#22C55E', label: formatDistanceToNow(new Date(lastScanned), { addSuffix: true, locale: es }) };
    if (hours < 24) return { dot: '#F59E0B', label: formatDistanceToNow(new Date(lastScanned), { addSuffix: true, locale: es }) };
    return { dot: '#EF4444', label: formatDistanceToNow(new Date(lastScanned), { addSuffix: true, locale: es }) };
  }

  // ── Handle resolve single ──
  async function handleResolve() {
    if (!resolveIncident || !userId) return;
    setIsResolving(true);
    try {
      await supabase.from('spider_incidents').update({
        status: 'resolved',
        resolution_outcome: selectedOutcome,
        resolution_notes: resolveNotes,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      }).eq('id', resolveIncident.id).eq('organization_id', organizationId);

      await supabase.from('spider_alerts').update({
        status: 'resolved',
        action_taken: 'incident_resolved',
        actioned_at: new Date().toISOString(),
        actioned_by: userId,
      }).eq('incident_group_id', resolveIncident.id).eq('organization_id', organizationId);

      setResolveIncident(null);
      setChannelSelections({});
      setSelectedOutcome('');
      setResolveNotes('');
      onCountsRefresh();
      setOffset(0);
      setIncidents([]);
      await loadIncidents(true);
      toast.success('Incidente resuelto');
    } catch {
      toast.error('Error al resolver');
    } finally {
      setIsResolving(false);
    }
  }

  // ── Handle resolve bulk ──
  async function handleBulkResolve() {
    if (!userId) return;
    setIsResolvingBulk(true);
    try {
      const ids = [...selectedIds];
      await updateInChunks('spider_incidents', ids, {
        status: 'resolved',
        resolution_outcome: bulkOutcome,
        resolution_notes: bulkNotes,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      });
      await updateInChunks('spider_alerts', ids, {
        status: 'resolved',
        action_taken: 'incident_resolved',
        actioned_at: new Date().toISOString(),
        actioned_by: userId,
      }, 'incident_group_id');

      setShowBulkResolve(false);
      setBulkOutcome('');
      setBulkNotes('');
      setSelectedIds(new Set());
      onCountsRefresh();
      setOffset(0);
      setIncidents([]);
      await loadIncidents(true);
      toast.success(`${ids.length} incidentes resueltos`);
    } catch {
      toast.error('Error al resolver en bloque');
    } finally {
      setIsResolvingBulk(false);
    }
  }

  // ── Bulk mark investigating ──
  async function handleBulkInvestigating() {
    setIsMarkingBulk(true);
    try {
      const ids = [...selectedIds];
      await updateInChunks('spider_incidents', ids, { status: 'investigating' });
      setSelectedIds(new Set());
      onCountsRefresh();
      setOffset(0);
      setIncidents([]);
      await loadIncidents(true);
      toast.success(`${ids.length} incidentes marcados como investigando`);
    } catch {
      toast.error('Error al actualizar');
    } finally {
      setIsMarkingBulk(false);
    }
  }

  // ── Bulk discard ──
  async function handleBulkDiscard() {
    setIsMarkingBulk(true);
    try {
      const ids = [...selectedIds];
      await updateInChunks('spider_incidents', ids, { status: 'resolved', resolution_outcome: 'Descartado en bloque' });
      await updateInChunks('spider_alerts', ids, {
        status: 'resolved',
        action_taken: 'discarded_bulk',
      }, 'incident_group_id');
      setShowBulkDiscard(false);
      setSelectedIds(new Set());
      onCountsRefresh();
      setOffset(0);
      setIncidents([]);
      await loadIncidents(true);
      toast.success('Incidentes descartados');
    } catch {
      toast.error('Error al descartar');
    } finally {
      setIsMarkingBulk(false);
    }
  }

  // ── Scan now ──
  const [scanDisabled, setScanDisabled] = useState(false);
  async function handleScanNow() {
    setScanDisabled(true);
    try {
      await supabase.functions.invoke('spider-incident-engine', {
        body: { run_for_org: true, organization_id: organizationId },
      });
      toast.success('Escaneando... Actualiza en breve');
    } catch {
      toast.error('Error al escanear');
    }
    setTimeout(() => setScanDisabled(false), 30000);
  }

  // ── Tab counts ──
  const activeCount = incidentCounts.critical + incidentCounts.high + incidentCounts.medium;
  const tabConfig: { key: TabKey; label: string; count: number }[] = [
    { key: 'active', label: 'Activos', count: activeCount },
    { key: 'investigating', label: 'Investigando', count: 0 },
    { key: 'resolved', label: 'Resueltos', count: incidentCounts.resolved },
  ];

  // We need investigating count — compute from loaded data or use a simple approach
  // For now show all tabs, hide if count=0 handled below

  const freshness = getFreshness();

  // ── Resolution dialog: check all selects filled ──
  const resolveChannels = resolveIncident?.sources?.filter((s: string) => CHANNEL_OPTIONS[s]) ?? [];
  const allSelectsFilled = resolveChannels.every((s: string) => channelSelections[s]) && !!selectedOutcome;

  return (
    <div className="space-y-4 relative">
      {/* ── Freshness indicator ── */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: freshness.dot }} />
        <span>Última actualización: {freshness.label}</span>
        <span>·</span>
        <button
          onClick={handleScanNow}
          disabled={scanDisabled}
          className="text-xs font-medium hover:underline disabled:opacity-50"
          style={{ color: SPIDER_VIOLET }}
        >
          {scanDisabled ? 'Escaneando...' : 'Escanear ahora'}
        </button>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status tabs */}
        <div className="flex gap-1 bg-muted/50 rounded-full p-0.5">
          {tabConfig.map(t => {
            if (t.count === 0 && t.key !== activeTab && t.key !== 'active') return null;
            return (
              <button
                key={t.key}
                onClick={() => {
                  setActiveTab(t.key);
                  setSelectedIds(new Set());
                }}
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-medium transition-all',
                  activeTab === t.key
                    ? 'bg-violet-600 text-white'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {t.label} ({t.count})
              </button>
            );
          })}
        </div>

        {/* Watch dropdown */}
        <Select
          value={selectedWatchId ?? 'all'}
          onValueChange={v => filterByWatch(v === 'all' ? null : v)}
        >
          <SelectTrigger className="h-7 text-xs w-[160px]">
            <SelectValue placeholder="Marca" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas las marcas</SelectItem>
            {watches.map(w => (
              <SelectItem key={w.id} value={w.id}>{w.watch_name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Severity dropdown */}
        <Select
          value={selectedSeverity}
          onValueChange={v => {
            setSelectedSeverity(v);
            setSelectedIds(new Set());
          }}
        >
          <SelectTrigger className="h-7 text-xs w-[120px]">
            <SelectValue placeholder="Severidad" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="critical">Crítica</SelectItem>
            <SelectItem value="high">Alta</SelectItem>
            <SelectItem value="medium">Media</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* ── Loading state ── */}
      {isLoading && incidents.length === 0 && (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-[160px] rounded-xl" />
          ))}
        </div>
      )}

      {/* ── Empty states ── */}
      {!isLoading && incidents.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          {activeTab === 'active' && (
            <>
              <ShieldCheck className="w-12 h-12" style={{ color: SPIDER_VIOLET, opacity: 0.5 }} />
              <p className="text-sm font-semibold text-muted-foreground">Sin incidentes activos</p>
              <div className="flex gap-2">
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">Registral ✓</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-violet-100 text-violet-700">Visual ✓</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">Digital ✓</span>
              </div>
            </>
          )}
          {activeTab === 'investigating' && (
            <>
              <Shield className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">Sin incidentes en revisión</p>
            </>
          )}
          {activeTab === 'resolved' && (
            <>
              <CheckCircle className="w-12 h-12 text-muted-foreground/40" />
              <p className="text-sm font-semibold text-muted-foreground">Sin incidentes resueltos aún</p>
            </>
          )}
        </div>
      )}

      {/* ── Incident cards ── */}
      {incidents.length > 0 && (
        <div className="space-y-3">
          {incidents.map(inc => {
            const sevColor = SEVERITY_COLORS[inc.severity] || '#94a3b8';
            const timeAction = getTimeWithoutAction(inc.first_detected_at || inc.last_updated_at || new Date().toISOString());
            const isOrganized = (inc.sources?.length ?? 0) >= 3 && (inc.alert_count ?? 0) >= 3;
            const isSelected = selectedIds.has(inc.id);
            const isExpanded = expandedId === inc.id;
            const nested = nestedAlerts[inc.id];
            const isLoadingNested = loadingNested[inc.id];

            return (
              <div key={inc.id} className="space-y-0">
                <div
                  className={cn(
                    'rounded-xl border bg-card p-3 space-y-2 transition-all max-h-[160px] overflow-hidden',
                    isSelected && 'ring-2 ring-violet-400'
                  )}
                  style={{ borderLeft: `4px solid ${SPIDER_VIOLET}` }}
                >
                  {/* Row 1 — Header */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2 flex-wrap min-w-0">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelect(inc.id)}
                        className="w-3.5 h-3.5 rounded accent-violet-600 flex-shrink-0"
                      />
                      <span className="text-[15px] font-bold text-foreground truncate">
                        {inc.incident_title || inc.entity_name || 'Sin título'}
                      </span>
                      {inc.status === 'investigating' && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                          EN REVISIÓN
                        </span>
                      )}
                      {isOrganized && (
                        <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" />
                          Actor organizado
                        </span>
                      )}
                      <span
                        className="text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0"
                        style={{ background: `${SPIDER_VIOLET}15`, color: SPIDER_VIOLET, borderColor: `${SPIDER_VIOLET}30` }}
                      >
                        MULTI
                      </span>
                      <span className={cn('text-[11px] font-medium', timeAction.color)}>
                        {timeAction.label}
                      </span>
                    </div>
                    <div
                      className="text-[28px] font-bold tabular-nums leading-none px-2 py-1 rounded-lg flex-shrink-0"
                      style={{
                        color: riskColor(inc.risk_score_unified ?? 0),
                        background: `${riskColor(inc.risk_score_unified ?? 0)}12`,
                      }}
                    >
                      {inc.risk_score_unified ?? '—'}
                    </div>
                  </div>

                  {/* Row 2 — R/V/D bars */}
                  <div className="space-y-1">
                    {(inc.registral_score ?? 0) > 0 && (
                      <DimensionBar label="R" score={inc.registral_score} color={DIM_COLORS.registral} />
                    )}
                    {(inc.visual_score ?? 0) > 0 && (
                      <DimensionBar label="V" score={inc.visual_score} color={DIM_COLORS.visual} />
                    )}
                    {(inc.digital_score ?? 0) > 0 && (
                      <DimensionBar label="D" score={inc.digital_score} color={DIM_COLORS.digital} />
                    )}
                  </div>

                  {/* Row 3 — Platform pills */}
                  {inc.platforms?.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {inc.platforms.map((p: string) => {
                        const isOfficial = OFFICIAL_PLATFORMS.has(p.toLowerCase());
                        return (
                          <span
                            key={p}
                            className={cn(
                              'text-[10px] font-medium px-1.5 py-0.5 rounded',
                              isOfficial
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-300 text-slate-600 bg-transparent'
                            )}
                          >
                            {isOfficial && '✓ '}{p}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* Row 4 — Metrics */}
                  <div className="flex items-center justify-between">
                    <p className="text-[11px] text-muted-foreground">
                      <strong>{inc.alert_count}</strong> alertas
                      {inc.first_detected_at && (
                        <> · detectado {formatDistanceToNow(new Date(inc.first_detected_at), { addSuffix: true, locale: es })}</>
                      )}
                    </p>
                  </div>

                  {/* Row 5 — Actions */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <Button
                      variant="outline" size="sm"
                      className="h-7 text-xs gap-1"
                      style={{ borderColor: `${SPIDER_VIOLET}40`, color: SPIDER_VIOLET }}
                      onClick={() => {
                        const firstAlertId = inc.alert_ids?.[0];
                        if (firstAlertId) navigate(`/app/spider/alerts/${firstAlertId}`);
                      }}
                    >
                      Ver incidente →
                    </Button>

                    <Button
                      variant="ghost" size="sm"
                      className="h-7 text-xs gap-1 text-muted-foreground"
                      onClick={() => loadNestedAlerts(inc.id)}
                      disabled={isLoadingNested}
                    >
                      {isLoadingNested ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <ChevronDown className={cn('w-3 h-3 transition-transform', isExpanded && 'rotate-180')} />
                      )}
                      Alertas
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={async () => {
                          await supabase.from('spider_incidents')
                            .update({ status: 'investigating' })
                            .eq('id', inc.id)
                            .eq('organization_id', organizationId);
                          onCountsRefresh();
                          loadIncidents(true);
                          toast.success('Marcado como investigando');
                        }}>
                          Investigando
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => {
                          setResolveIncident(inc);
                          setChannelSelections({});
                          setSelectedOutcome('');
                          setResolveNotes('');
                        }}>
                          Resolver
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Nested alerts */}
                {isExpanded && nested && (
                  <div className="ml-6 border-l-2 border-violet-200 pl-3 pt-2 space-y-1.5">
                    {nested.map((a: any) => (
                      <button
                        key={a.id}
                        onClick={() => navigate(`/app/spider/alerts/${a.id}`)}
                        className="w-full text-left rounded-lg border border-border bg-card/60 p-2 flex items-center gap-2 hover:bg-accent/30 transition-colors"
                      >
                        <span className="text-xs font-medium text-foreground truncate flex-1">
                          {a.detected_mark_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{a.alert_category}</span>
                        {a.detected_jurisdiction && (
                          <span className="text-[10px] text-muted-foreground">{a.detected_jurisdiction}</span>
                        )}
                        <span
                          className="text-[10px] font-bold px-1 rounded"
                          style={{
                            color: riskColor(a.combined_score ?? 0),
                            background: `${riskColor(a.combined_score ?? 0)}15`,
                          }}
                        >
                          {a.combined_score ?? '—'}%
                        </span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Load more ── */}
      {hasMore && !isLoading && (
        <div className="flex justify-center pt-2">
          <Button variant="ghost" size="sm" onClick={() => loadIncidents(false)} className="text-xs">
            Cargar más
          </Button>
        </div>
      )}
      {isLoading && incidents.length > 0 && (
        <div className="flex justify-center py-2">
          <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* ── Bulk actions bar ── */}
      {selectedIds.size >= 2 && (
        <div className="sticky bottom-0 z-50 bg-card border-t border-border shadow-lg rounded-t-xl px-4 py-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs font-medium text-foreground">
            {selectedIds.size} seleccionados
          </span>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs"
            onClick={toggleSelectAll}
          >
            {selectedIds.size === incidents.length ? 'Deseleccionar todo' : 'Seleccionar todo'}
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs border-amber-300 text-amber-700"
            onClick={handleBulkInvestigating}
            disabled={isMarkingBulk}
          >
            {isMarkingBulk ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
            Investigando
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs border-green-300 text-green-700"
            onClick={() => {
              setShowBulkResolve(true);
              setBulkOutcome('');
              setBulkNotes('');
            }}
          >
            Resolver
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs border-red-300 text-red-700"
            onClick={() => setShowBulkDiscard(true)}
          >
            Descartar
          </Button>
        </div>
      )}

      {/* ══ DIALOG: Single resolution ══ */}
      <Dialog
        open={!!resolveIncident}
        onOpenChange={(open) => {
          if (!open && !isResolving) setResolveIncident(null);
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { if (isResolving) e.preventDefault(); }}
          className="max-w-lg"
        >
          <DialogHeader>
            <DialogTitle className="text-base">
              Resolver: {resolveIncident?.incident_title || resolveIncident?.entity_name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Completa la resolución para cada canal detectado
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2">
            {resolveChannels.map((src: string) => {
              const ch = CHANNEL_OPTIONS[src];
              if (!ch) return null;
              return (
                <div key={src}>
                  <label className="text-xs font-medium text-foreground mb-1 block">{ch.label}</label>
                  <Select
                    value={channelSelections[src] ?? ''}
                    onValueChange={v => setChannelSelections(prev => ({ ...prev, [src]: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Selecciona acción..." />
                    </SelectTrigger>
                    <SelectContent>
                      {ch.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Resolución global</label>
              <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Resultado..." />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Notas (opcional)</label>
              <Textarea
                value={resolveNotes}
                onChange={e => setResolveNotes(e.target.value)}
                rows={2}
                className="text-xs"
                placeholder="Observaciones adicionales..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline" size="sm"
              onClick={() => setResolveIncident(null)}
              disabled={isResolving}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleResolve}
              disabled={!allSelectsFilled || isResolving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isResolving ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG: Bulk resolution ══ */}
      <Dialog
        open={showBulkResolve}
        onOpenChange={(open) => {
          if (!open && !isResolvingBulk) setShowBulkResolve(false);
        }}
      >
        <DialogContent
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { if (isResolvingBulk) e.preventDefault(); }}
          className="max-w-md"
        >
          <DialogHeader>
            <DialogTitle className="text-base">
              Resolver {selectedIds.size} incidentes seleccionados
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Resolución</label>
              <Select value={bulkOutcome} onValueChange={setBulkOutcome}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Resultado..." />
                </SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1 block">Notas (opcional)</label>
              <Textarea value={bulkNotes} onChange={e => setBulkNotes(e.target.value)} rows={2} className="text-xs" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowBulkResolve(false)} disabled={isResolvingBulk}>
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={handleBulkResolve}
              disabled={!bulkOutcome || isResolvingBulk}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              {isResolvingBulk ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Resolver {selectedIds.size}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ══ DIALOG: Bulk discard ══ */}
      <Dialog open={showBulkDiscard} onOpenChange={setShowBulkDiscard}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-base">¿Descartar {selectedIds.size} incidentes?</DialogTitle>
            <DialogDescription className="text-xs">
              Los incidentes y sus alertas se marcarán como resueltos.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setShowBulkDiscard(false)}>Cancelar</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={handleBulkDiscard}
              disabled={isMarkingBulk}
            >
              {isMarkingBulk ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
              Descartar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Dimension bar component ──
function DimensionBar({ label, score, color }: { label: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span
        className="text-[10px] font-bold w-4 text-center"
        style={{ color }}
      >
        [{label}]
      </span>
      <div className="flex-1 h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${Math.min(score, 100)}%`, background: color }}
        />
      </div>
      <span className="text-[10px] font-medium tabular-nums w-8 text-right" style={{ color }}>
        {score}%
      </span>
    </div>
  );
}
