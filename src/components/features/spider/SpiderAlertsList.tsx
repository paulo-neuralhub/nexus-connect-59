/**
 * SP01-B — Spider Alerts List (left 70% column)
 * Real DB data, filter integration, collapsible cards.
 */
import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Clock, Lightbulb, ChevronDown, ChevronUp, ShieldCheck,
  Gavel, Mail, Users, MoreHorizontal, RotateCcw, History,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

type SeverityFilter = 'critical' | 'high' | 'medium' | 'resolved' | null;

interface SpiderAlertsListProps {
  activeFilter: SeverityFilter;
}

const SEVERITY_STYLES: Record<string, { border: string; bg: string; label: string; badgeColor: string }> = {
  critical: { border: 'border-l-red-500', bg: 'bg-red-50', label: 'CRÍTICO', badgeColor: 'bg-red-100 text-red-700 border-red-200' },
  high: { border: 'border-l-amber-500', bg: 'bg-amber-50', label: 'ALTO', badgeColor: 'bg-amber-100 text-amber-700 border-amber-200' },
  medium: { border: 'border-l-yellow-400', bg: 'bg-yellow-50', label: 'MEDIO', badgeColor: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
};

const RESOLVED_STYLE = { border: 'border-l-green-500', bg: 'bg-green-50' };
const SNOOZED_STYLE = { border: 'border-l-slate-300', bg: 'bg-slate-50' };

export function SpiderAlertsList({ activeFilter }: SpiderAlertsListProps) {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;
  const [statusTab, setStatusTab] = useState('all');
  const [severityDropdown, setSeverityDropdown] = useState<string>('all');
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['spider-alerts-list', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_alerts')
        .select(`
          id, watch_id, detected_mark_name, detected_jurisdiction,
          detected_application_number, detected_applicant,
          detected_applicant_country, detected_nice_classes,
          detected_mark_status, detected_goods_services,
          phonetic_score, visual_score, semantic_score, combined_score,
          weight_phonetic_used, weight_visual_used, weight_semantic_used,
          severity, opposition_deadline, opposition_days_remaining,
          ai_analysis, ai_recommendation, ai_key_factors,
          ai_disclaimer, status, snoozed_until,
          action_taken, action_notes, actioned_at,
          portal_visible, source_code, alert_category,
          spider_watches!watch_id (
            watch_name, nice_classes,
            weight_phonetic, weight_semantic, weight_visual
          )
        `)
        .eq('organization_id', orgId!)
        .order('combined_score', { ascending: false })
        .order('opposition_days_remaining', { ascending: true, nullsFirst: false });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
    staleTime: 1000 * 60 * 2,
  });

  const filtered = useMemo(() => {
    if (!alerts) return [];
    let list = [...alerts];

    // Badge filter from header
    if (activeFilter === 'critical') {
      list = list.filter(a => a.severity === 'critical' && !['resolved', 'actioned'].includes(a.status));
    } else if (activeFilter === 'high') {
      list = list.filter(a => a.severity === 'high' && a.status === 'new');
    } else if (activeFilter === 'medium') {
      list = list.filter(a => a.severity === 'medium' && a.status === 'new');
    } else if (activeFilter === 'resolved') {
      list = list.filter(a => ['resolved', 'actioned'].includes(a.status));
    }

    // Status tab filter
    if (statusTab === 'new') list = list.filter(a => a.status === 'new');
    else if (statusTab === 'actioned') list = list.filter(a => a.status === 'actioned');
    else if (statusTab === 'resolved') list = list.filter(a => a.status === 'resolved');

    // Severity dropdown
    if (severityDropdown !== 'all') {
      list = list.filter(a => a.severity === severityDropdown);
    }

    return list;
  }, [alerts, activeFilter, statusTab, severityDropdown]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-[140px] rounded-[14px]" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center gap-3">
        <Tabs value={statusTab} onValueChange={setStatusTab}>
          <TabsList className="h-8 bg-muted/50">
            <TabsTrigger value="all" className="text-xs h-7 px-3">Todas</TabsTrigger>
            <TabsTrigger value="new" className="text-xs h-7 px-3">Nuevas</TabsTrigger>
            <TabsTrigger value="actioned" className="text-xs h-7 px-3">En acción</TabsTrigger>
            <TabsTrigger value="resolved" className="text-xs h-7 px-3">Resueltas</TabsTrigger>
          </TabsList>
        </Tabs>

        <select
          value={severityDropdown}
          onChange={e => setSeverityDropdown(e.target.value)}
          className="text-xs h-8 px-2 rounded-md border border-border bg-card text-foreground"
        >
          <option value="all">Todas severidades</option>
          <option value="critical">Crítica</option>
          <option value="high">Alta</option>
          <option value="medium">Media</option>
        </select>
      </div>

      {/* ── Alert Cards ── */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
          <ShieldCheck className="w-12 h-12 opacity-40" />
          <p className="font-semibold text-sm">Sin alertas en esta categoría</p>
          <p className="text-xs">Tu portfolio está siendo monitorizado activamente</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(alert => (
            <AlertCard
              key={alert.id}
              alert={alert}
              expanded={expandedIds.has(alert.id)}
              onToggle={() => toggleExpand(alert.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// Alert Card
// ════════════════════════════════════════════

function AlertCard({
  alert,
  expanded,
  onToggle,
}: {
  alert: any;
  expanded: boolean;
  onToggle: () => void;
}) {
  const now = new Date();
  const isSnoozed = alert.snoozed_until && new Date(alert.snoozed_until) > now;
  const isResolved = ['actioned', 'resolved'].includes(alert.status);
  const isDomain = alert.source_code === 'domain' || alert.alert_category === 'online';
  const watch = alert.spider_watches;

  // Style
  let style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
  let cardBorder = style.border;
  let cardBg = style.bg;
  if (isResolved) { cardBorder = RESOLVED_STYLE.border; cardBg = RESOLVED_STYLE.bg; }
  if (isSnoozed) { cardBorder = SNOOZED_STYLE.border; cardBg = SNOOZED_STYLE.bg; }

  // Score color
  const scoreColor = alert.combined_score >= 85 ? '#EF4444'
    : alert.combined_score >= 70 ? '#F59E0B'
    : alert.combined_score >= 50 ? '#EAB308'
    : '#94a3b8';

  const daysUrgent = alert.opposition_days_remaining;

  return (
    <div className={cn(
      'rounded-[14px] border border-border border-l-4 overflow-hidden transition-all',
      cardBorder, cardBg
    )}>
      <div className="p-4 space-y-3">
        {/* ── ROW 1: Name + severity + jurisdiction + deadline ── */}
        <div className="flex items-start justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base font-bold text-foreground">{alert.detected_mark_name || '—'}</span>
            {!isResolved && !isSnoozed && style.label && (
              <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', style.badgeColor)}>
                {style.label}
              </span>
            )}
            {alert.detected_jurisdiction && (
              <Badge variant="outline" className="text-[10px] font-mono">
                {alert.detected_jurisdiction}
              </Badge>
            )}
            {isSnoozed && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                POSPUESTA hasta {format(new Date(alert.snoozed_until), 'dd/MM/yy')}
              </span>
            )}
          </div>
          {daysUrgent != null && !isResolved && (
            <span className={cn(
              'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200',
              daysUrgent < 7 && 'animate-pulse'
            )}>
              <Clock className="w-3 h-3" />
              {daysUrgent}d
            </span>
          )}
        </div>

        {/* ── ROW 2: Similarity bars + combined score ── */}
        <div className="flex items-center gap-4">
          <div className="flex-1 space-y-1">
            {isDomain ? (
              // Domain: only semantic
              alert.weight_semantic_used > 0 && (
                <SimilarityBar label="Similitud conceptual" score={alert.semantic_score} color="bg-teal-500" />
              )
            ) : (
              <>
                {alert.weight_phonetic_used > 0 && (
                  <SimilarityBar label="Fonética" score={alert.phonetic_score} color="bg-blue-500" />
                )}
                {alert.weight_visual_used > 0 && (
                  <SimilarityBar label="Visual" score={alert.visual_score} color="bg-purple-500" />
                )}
                {alert.weight_semantic_used > 0 && (
                  <SimilarityBar label="Semántica" score={alert.semantic_score} color="bg-teal-500" />
                )}
              </>
            )}
          </div>
          <div className="flex-shrink-0 text-right">
            <span className="text-[36px] font-bold leading-none tabular-nums" style={{ color: scoreColor }}>
              {alert.combined_score != null ? Math.round(alert.combined_score) : '—'}
            </span>
            {alert.combined_score != null && (
              <span className="text-[10px] block text-muted-foreground">score</span>
            )}
          </div>
        </div>

        {/* ── ROW 3: AI recommendation ── */}
        {alert.ai_recommendation && (
          <div className="flex items-start gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{alert.ai_recommendation}</p>
            <button
              onClick={onToggle}
              className="text-xs text-primary font-medium flex items-center gap-0.5 whitespace-nowrap hover:underline"
            >
              {expanded ? 'Ocultar' : 'Ver análisis'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
        )}
        {!alert.ai_recommendation && (
          <button
            onClick={onToggle}
            className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline"
          >
            {expanded ? 'Ocultar' : 'Ver detalles'}
            {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        )}

        {/* ── ROW 4: Quick actions ── */}
        <div className="flex flex-wrap gap-2">
          {isSnoozed ? (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1" disabled>
              <RotateCcw className="w-3 h-3" /> Reactivar
            </Button>
          ) : isResolved ? (
            <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" disabled>
              <History className="w-3 h-3" /> Ver historial
            </Button>
          ) : (
            <>
              {alert.opposition_deadline && (
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-purple-300 text-purple-700" disabled>
                  <Gavel className="w-3 h-3" /> Oposición
                </Button>
              )}
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-300 text-blue-700" disabled>
                <Mail className="w-3 h-3" /> C&D
              </Button>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-300 text-green-700" disabled>
                <Users className="w-3 h-3" /> Agente
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                    <MoreHorizontal className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem disabled>Posponer</DropdownMenuItem>
                  <DropdownMenuItem disabled>Descartar</DropdownMenuItem>
                  <DropdownMenuItem disabled>Portal cliente</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
        </div>
      </div>

      {/* ── EXPANDED SECTION ── */}
      {expanded && (
        <div className="border-t border-border bg-card/80 p-4 space-y-4">
          {/* Section 1: Comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Tu marca</p>
              <p className="text-sm font-bold text-foreground">{watch?.watch_name || '—'}</p>
              {watch?.nice_classes && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(watch.nice_classes) ? watch.nice_classes : []).map((c: any) => (
                    <Badge key={c} variant="secondary" className="text-[10px] h-5">{c}</Badge>
                  ))}
                </div>
              )}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Marca detectada</p>
              <p className="text-sm font-bold text-foreground">{alert.detected_mark_name}</p>
              {alert.detected_application_number && (
                <p className="text-[11px] text-muted-foreground font-mono">{alert.detected_application_number}</p>
              )}
              {alert.detected_nice_classes && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {(Array.isArray(alert.detected_nice_classes) ? alert.detected_nice_classes : []).map((c: any) => (
                    <Badge key={c} variant="secondary" className="text-[10px] h-5">{c}</Badge>
                  ))}
                </div>
              )}
              {alert.detected_mark_status && (
                <Badge variant="outline" className="text-[10px] mt-1">{alert.detected_mark_status}</Badge>
              )}
              {alert.detected_applicant && (
                <p className="text-[11px] text-muted-foreground">{alert.detected_applicant}</p>
              )}
            </div>
          </div>

          {/* Section 2: AI Analysis */}
          {alert.ai_analysis && (
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Análisis IA</p>
              <p className="text-xs text-foreground whitespace-pre-line">{alert.ai_analysis}</p>
              {alert.ai_key_factors && Array.isArray(alert.ai_key_factors) && alert.ai_key_factors.length > 0 && (
                <ul className="list-disc list-inside text-xs text-foreground space-y-0.5 pl-1">
                  {alert.ai_key_factors.map((f: string, i: number) => (
                    <li key={i}>{f}</li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Section 3: Deadline */}
          {alert.opposition_deadline && (
            <div className={cn(
              'rounded-lg p-3 text-xs',
              daysUrgent != null && daysUrgent < 7 ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
            )}>
              <span className="font-semibold text-foreground">
                Vence {format(new Date(alert.opposition_deadline), "dd 'de' MMMM yyyy", { locale: es })}
              </span>
              {daysUrgent != null && (
                <span className="ml-2 text-muted-foreground">· Quedan {daysUrgent} días</span>
              )}
            </div>
          )}

          {/* Section 4: Expanded actions (same as row 4, visual only) */}
          <div className="flex flex-wrap gap-2">
            {isResolved ? (
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" disabled>
                <History className="w-3 h-3" /> Ver historial
              </Button>
            ) : (
              <>
                {alert.opposition_deadline && (
                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-purple-300 text-purple-700" disabled>
                    <Gavel className="w-3 h-3" /> Oposición
                  </Button>
                )}
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-blue-300 text-blue-700" disabled>
                  <Mail className="w-3 h-3" /> C&D
                </Button>
                <Button variant="outline" size="sm" className="h-7 text-xs gap-1 border-green-300 text-green-700" disabled>
                  <Users className="w-3 h-3" /> Agente
                </Button>
              </>
            )}
          </div>

          {/* Section 5: Disclaimer */}
          {alert.ai_disclaimer && (
            <p className="text-[11px] text-muted-foreground/70 italic">{alert.ai_disclaimer}</p>
          )}
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════
// Similarity Bar
// ════════════════════════════════════════════

function SimilarityBar({ label, score, color }: { label: string; score: number | null; color: string }) {
  const pct = score != null ? Math.round(score) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-[90px] truncate">{label}</span>
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums w-8 text-right text-foreground">{pct}%</span>
    </div>
  );
}
