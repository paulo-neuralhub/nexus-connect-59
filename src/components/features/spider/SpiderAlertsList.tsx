/**
 * SP01-B + SP01-D — Spider Alerts List with active action buttons.
 * Real DB data, filter integration, collapsible cards, mutations.
 */
import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuTrigger, DropdownMenuSub, DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from '@/components/ui/dropdown-menu';
import {
  Clock, Lightbulb, ChevronDown, ChevronUp, ShieldCheck,
  Gavel, Mail, Users, MoreHorizontal, RotateCcw, History, Loader2,
  Image as ImageIcon, Globe, Camera, Music, Youtube, Square, Filter, Flag,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';

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
          detected_mark_image_url,
          phonetic_score, visual_score, semantic_score, combined_score,
          weight_phonetic_used, weight_visual_used, weight_semantic_used,
          severity, opposition_deadline, opposition_days_remaining,
          ai_analysis, ai_recommendation, ai_key_factors,
          ai_disclaimer, status, snoozed_until,
          action_taken, action_notes, actioned_at,
          portal_visible, source_code, alert_category,
          incident_group_id, detected_at, source_url,
          social_platform, social_handle, social_followers,
          social_profile_url, commercial_intent_score,
          commercial_intent_type, commercial_intent_reason,
          workflow_step_id,
          spider_watches!watch_id (
            watch_name, nice_classes,
            weight_phonetic, weight_semantic, weight_visual,
            mark_image_url
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
    if (activeFilter === 'critical') {
      list = list.filter(a => a.severity === 'critical' && !['resolved', 'actioned'].includes(a.status));
    } else if (activeFilter === 'high') {
      list = list.filter(a => a.severity === 'high' && a.status === 'new');
    } else if (activeFilter === 'medium') {
      list = list.filter(a => a.severity === 'medium' && a.status === 'new');
    } else if (activeFilter === 'resolved') {
      list = list.filter(a => ['resolved', 'actioned'].includes(a.status));
    }
    if (statusTab === 'new') list = list.filter(a => a.status === 'new');
    else if (statusTab === 'actioned') list = list.filter(a => a.status === 'actioned');
    else if (statusTab === 'resolved') list = list.filter(a => a.status === 'resolved');
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
      {/* Toolbar */}
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
              orgId={orgId!}
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
// Alert Card (with active actions)
// ════════════════════════════════════════════

function AlertCard({
  alert,
  orgId,
  expanded,
  onToggle,
}: {
  alert: any;
  orgId: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const now = new Date();

  // Local optimistic state
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [localSnoozedUntil, setLocalSnoozedUntil] = useState<string | null>(null);
  const [localPortalVisible, setLocalPortalVisible] = useState<boolean | null>(null);

  // Dialog states
  const [oppositionOpen, setOppositionOpen] = useState(false);
  const [dismissOpen, setDismissOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');
  const [cndLoading, setCndLoading] = useState(false);
  const [cndDoc, setCndDoc] = useState<any>(null);
  const [cndDialogOpen, setCndDialogOpen] = useState(false);
  const [portalText, setPortalText] = useState('');
  const [portalEditing, setPortalEditing] = useState(false);

  const effectiveStatus = localStatus ?? alert.status;
  const effectiveSnoozed = localSnoozedUntil ?? alert.snoozed_until;
  const effectivePortalVisible = localPortalVisible ?? alert.portal_visible;

  const isSnoozed = effectiveSnoozed && new Date(effectiveSnoozed) > now;
  const isResolved = ['actioned', 'resolved'].includes(effectiveStatus);
  const isDomain = alert.alert_category === 'domain' || alert.source_code === 'domain';
  const isSocial = alert.alert_category === 'social';
  const watch = alert.spider_watches;

  // Evidence capture state (domain/social alerts)
  const [evidenceLoading, setEvidenceLoading] = useState(false);
  const [platformReportLoading, setPlatformReportLoading] = useState(false);

  let style = SEVERITY_STYLES[alert.severity] || SEVERITY_STYLES.medium;
  let cardBorder = style.border;
  let cardBg = style.bg;
  if (isResolved) { cardBorder = RESOLVED_STYLE.border; cardBg = RESOLVED_STYLE.bg; }
  if (isSnoozed) { cardBorder = SNOOZED_STYLE.border; cardBg = SNOOZED_STYLE.bg; }

  const scoreColor = alert.combined_score >= 85 ? '#EF4444'
    : alert.combined_score >= 70 ? '#F59E0B'
    : alert.combined_score >= 50 ? '#EAB308'
    : '#94a3b8';

  const daysUrgent = alert.opposition_days_remaining;

  // Extract cost from ai_recommendation
  const estimatedCost = useMemo(() => {
    if (!alert.ai_recommendation) return null;
    const match = alert.ai_recommendation.match(/(\d[\d.,]*)\s*€|€\s*(\d[\d.,]*)/);
    return match ? (match[1] || match[2]) : null;
  }, [alert.ai_recommendation]);

  // ── Mutations ──

  const snoozeMutation = useMutation({
    mutationFn: async (days: number) => {
      const snoozedUntil = addDays(new Date(), days).toISOString();
      const { error } = await supabase
        .from('spider_alerts' as any)
        .update({ snoozed_until: snoozedUntil, status: 'viewed' } as any)
        .eq('id', alert.id)
        .eq('organization_id', orgId);
      if (error) throw error;
      return { snoozedUntil, days };
    },
    onSuccess: ({ snoozedUntil, days }) => {
      setLocalSnoozedUntil(snoozedUntil);
      setLocalStatus('viewed');
      toast.success(`Alerta pospuesta hasta ${format(addDays(new Date(), days), "dd/MM/yyyy")}`);
      qc.invalidateQueries({ queryKey: ['spider-alerts-list'] });
      qc.invalidateQueries({ queryKey: ['spider-badge-counts'] });
    },
  });

  const reactivateMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('spider_alerts' as any)
        .update({ snoozed_until: null, status: 'new' } as any)
        .eq('id', alert.id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      setLocalSnoozedUntil('');
      setLocalStatus('new');
      toast.success('Alerta reactivada');
      qc.invalidateQueries({ queryKey: ['spider-alerts-list'] });
      qc.invalidateQueries({ queryKey: ['spider-badge-counts'] });
    },
  });

  const dismissMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('spider_alerts' as any)
        .update({
          status: 'resolved',
          action_taken: 'dismissed',
          action_notes: reason || null,
          actioned_at: new Date().toISOString(),
          actioned_by: user?.id || null,
        } as any)
        .eq('id', alert.id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      setLocalStatus('resolved');
      setDismissOpen(false);
      setDismissReason('');
      toast.success('Alerta descartada');
      qc.invalidateQueries({ queryKey: ['spider-alerts-list'] });
      qc.invalidateQueries({ queryKey: ['spider-badge-counts'] });
    },
  });

  const portalMutation = useMutation({
    mutationFn: async ({ visible, text }: { visible: boolean; text?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      const updates: any = { portal_visible: visible };
      if (visible) {
        updates.portal_approved_by = user?.id || null;
        updates.portal_approved_at = new Date().toISOString();
        if (text) updates.portal_despacho_analysis = text;
      }
      const { error } = await supabase
        .from('spider_alerts' as any)
        .update(updates)
        .eq('id', alert.id)
        .eq('organization_id', orgId);
      if (error) throw error;
      return visible;
    },
    onSuccess: (visible) => {
      setLocalPortalVisible(visible);
      setPortalEditing(false);
      toast.success(visible ? 'Alerta publicada en portal del cliente' : 'Alerta retirada del portal');
    },
  });

  // ── C&D handler ──
  const handleCnD = async () => {
    setCndLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('genius-generate-document', {
        body: {
          document_type: 'cease_desist',
          organization_id: orgId,
          context: {
            threat_name: alert.detected_mark_name,
            threat_applicant: alert.detected_applicant,
            threat_jurisdiction: alert.detected_jurisdiction,
            our_mark: watch?.watch_name,
            similarity_score: alert.combined_score,
            ai_analysis: alert.ai_analysis,
          },
        },
      });
      if (error) throw error;
      setCndDoc(data);
      setCndDialogOpen(true);
    } catch {
      toast.error('No se pudo generar el documento. Inténtalo de nuevo.');
    } finally {
      setCndLoading(false);
    }
  };

  // ── Evidence capture handler (domain) ──
  const handleEvidenceCapture = async () => {
    setEvidenceLoading(true);
    try {
      const { error } = await supabase.functions.invoke('spider-evidence-capture', {
        body: {
          url: alert.source_url ?? `https://${alert.detected_mark_name}`,
          alert_id: alert.id,
          organization_id: orgId,
          evidence_type: 'domain_scan',
        },
      });
      if (error) throw error;
      toast.success('Evidencia capturada y guardada');
    } catch {
      toast.error('No se pudo capturar. El dominio puede estar inactivo.');
    } finally {
      setEvidenceLoading(false);
    }
  };

  // ── Action buttons (shared between collapsed row 4 and expanded section 4) ──
  const renderActions = () => {
    if (isSnoozed) {
      return (
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1"
          onClick={() => reactivateMutation.mutate()}
          disabled={reactivateMutation.isPending}
        >
          <RotateCcw className="w-3 h-3" /> Reactivar
        </Button>
      );
    }
    if (isResolved) {
      return (
        <Button variant="outline" size="sm" className="h-7 text-xs gap-1 text-muted-foreground" disabled>
          <History className="w-3 h-3" /> Ver historial
        </Button>
      );
    }

    // Domain-specific actions
    if (isDomain) {
      return (
        <>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs gap-1 border-teal-300 text-teal-700"
            onClick={() => navigate('/app/marketplace?jurisdiction=domain&practice=udrp')}
          >
            <Globe className="w-3 h-3" /> UDRP
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs gap-1 border-blue-300 text-blue-700"
            onClick={handleCnD}
            disabled={cndLoading}
          >
            {cndLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
            {cndLoading ? 'Generando...' : 'C&D'}
          </Button>
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs gap-1 border-green-300 text-green-700"
            onClick={() => navigate(`/app/marketplace?jurisdiction=${alert.detected_jurisdiction || ''}`)}
          >
            <Users className="w-3 h-3" /> Agente
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 w-7 p-0">
                <MoreHorizontal className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>Posponer</DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {[3, 7, 14, 30].map(d => (
                    <DropdownMenuItem
                      key={d}
                      onClick={() => snoozeMutation.mutate(d)}
                      disabled={snoozeMutation.isPending}
                    >
                      {d} días
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuSubContent>
              </DropdownMenuSub>
              <DropdownMenuItem onClick={() => setDismissOpen(true)}>Descartar</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setPortalEditing(true)}>Portal cliente</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      );
    }

    // Standard trademark actions
    return (
      <>
        {alert.opposition_deadline && (
          <Button
            variant="outline" size="sm"
            className="h-7 text-xs gap-1 border-purple-300 text-purple-700"
            onClick={() => setOppositionOpen(true)}
          >
            <Gavel className="w-3 h-3" /> Oposición
          </Button>
        )}
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1 border-blue-300 text-blue-700"
          onClick={handleCnD}
          disabled={cndLoading}
        >
          {cndLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
          {cndLoading ? 'Generando...' : 'C&D'}
        </Button>
        <Button
          variant="outline" size="sm"
          className="h-7 text-xs gap-1 border-green-300 text-green-700"
          onClick={() => navigate(`/app/marketplace?jurisdiction=${alert.detected_jurisdiction || ''}`)}
        >
          <Users className="w-3 h-3" /> Agente
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="h-7 w-7 p-0">
              <MoreHorizontal className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Posponer</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {[3, 7, 14, 30].map(d => (
                  <DropdownMenuItem
                    key={d}
                    onClick={() => snoozeMutation.mutate(d)}
                    disabled={snoozeMutation.isPending}
                  >
                    {d} días
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => setDismissOpen(true)}>Descartar</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setPortalEditing(true)}>Portal cliente</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </>
    );
  };

  return (
    <>
      <div className={cn(
        'rounded-[14px] border border-border border-l-4 overflow-hidden transition-all',
        cardBorder, cardBg
      )}>
        <div className="p-4 space-y-3">
          {/* ROW 1 */}
          <div className="flex items-start justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              {isDomain && <Globe className="w-4 h-4 text-teal-600 flex-shrink-0" />}
              <span className="text-base font-bold text-foreground">{alert.detected_mark_name || '—'}</span>
              {isDomain ? (
                <>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-teal-100 text-teal-700 border border-teal-200">
                    DOMINIO
                  </span>
                  {!isResolved && !isSnoozed && alert.combined_score >= 85 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 border border-red-200">ALTO</span>
                  )}
                  {!isResolved && !isSnoozed && alert.combined_score >= 70 && alert.combined_score < 85 && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">MEDIO</span>
                  )}
                </>
              ) : (
                <>
                  {!isResolved && !isSnoozed && style.label && (
                    <span className={cn('text-[10px] font-bold px-1.5 py-0.5 rounded border', style.badgeColor)}>
                      {style.label}
                    </span>
                  )}
                  {alert.detected_jurisdiction && (
                    <Badge variant="outline" className="text-[10px] font-mono">{alert.detected_jurisdiction}</Badge>
                  )}
                  {watch?.mark_image_url && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 border border-purple-200">
                      👁 Visual
                    </span>
                  )}
                </>
              )}
              {isSnoozed && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 border border-slate-300">
                  POSPUESTA hasta {format(new Date(effectiveSnoozed), 'dd/MM/yy')}
                </span>
              )}
            </div>
            {!isDomain && daysUrgent != null && !isResolved && (
              <span className={cn(
                'inline-flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-700 border border-red-200',
                daysUrgent < 7 && 'animate-pulse'
              )}>
                <Clock className="w-3 h-3" />{daysUrgent}d
              </span>
            )}
          </div>

          {/* ROW 2 */}
          <div className="flex items-center gap-4">
            <div className="flex-1 space-y-1">
              {isDomain ? (
                <SimilarityBar label="Similitud con tu marca" score={alert.combined_score} color="bg-teal-500" />
              ) : (
                <>
                  {alert.weight_phonetic_used > 0 && <SimilarityBar label="Fonética" score={alert.phonetic_score} color="bg-blue-500" />}
                  {(alert.weight_visual_used > 0 || alert.visual_score > 0) ? (
                    <SimilarityBar label="Visual" score={alert.visual_score} color="bg-purple-500" />
                  ) : (alert.visual_score === 0 || alert.visual_score == null) && watch?.mark_image_url ? (
                    <SimilarityBar label="Visual" score={0} color="bg-slate-200" pending />
                  ) : null}
                  {alert.weight_semantic_used > 0 && <SimilarityBar label="Semántica" score={alert.semantic_score} color="bg-teal-500" />}
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

          {/* ROW 3 */}
          {alert.ai_recommendation ? (
            <div className="flex items-start gap-2">
              <Lightbulb className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-muted-foreground line-clamp-1 flex-1">{alert.ai_recommendation}</p>
              <button onClick={onToggle} className="text-xs text-primary font-medium flex items-center gap-0.5 whitespace-nowrap hover:underline">
                {expanded ? 'Ocultar' : 'Ver análisis'}
                {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          ) : (
            <button onClick={onToggle} className="text-xs text-primary font-medium flex items-center gap-0.5 hover:underline">
              {expanded ? 'Ocultar' : 'Ver detalles'}
              {expanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          )}

          {/* ROW 4 */}
          <div className="flex flex-wrap gap-2">{renderActions()}</div>
        </div>

        {/* EXPANDED */}
        {expanded && (
          <div className="border-t border-border bg-card/80 p-4 space-y-4">
            {/* Comparison — domain vs trademark */}
            {isDomain ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Tu marca vigilada</p>
                  <p className="text-sm font-bold text-foreground">{watch?.watch_name || '—'}</p>
                  {watch?.nice_classes && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {(Array.isArray(watch.nice_classes) ? watch.nice_classes : []).map((c: any) => (
                        <Badge key={c} variant="secondary" className="text-[10px] h-5">Cl. {c}</Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Dominio detectado</p>
                  <p className="text-sm font-bold text-foreground">{alert.detected_mark_name}</p>
                  {alert.detected_applicant && (
                    <p className="text-[11px] text-muted-foreground">
                      Registrado por: {alert.detected_applicant}
                      {alert.detected_applicant_country && ` (${alert.detected_applicant_country})`}
                    </p>
                  )}
                  {alert.source_url && (
                    <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="text-[11px] text-teal-600 hover:underline">
                      Ver dominio →
                    </a>
                  )}
                  <p className="text-[10px] text-muted-foreground">
                    Fuente: WHOIS · {alert.detected_at ? format(new Date(alert.detected_at), 'dd/MM/yyyy') : '—'}
                  </p>
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Tu marca</p>
                    {watch?.mark_image_url ? (
                      <img src={watch.mark_image_url} alt="Tu logo" className="w-10 h-10 object-contain rounded border border-border bg-background" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
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
                    {alert.detected_mark_image_url ? (
                      <img src={alert.detected_mark_image_url} alt="Logo detectado" className="w-10 h-10 object-contain rounded border border-border bg-background" />
                    ) : (
                      <div className="w-10 h-10 rounded border border-border bg-muted/40 flex items-center justify-center">
                        <ImageIcon className="w-4 h-4 text-muted-foreground/50" />
                      </div>
                    )}
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
                    {alert.detected_mark_status && <Badge variant="outline" className="text-[10px] mt-1">{alert.detected_mark_status}</Badge>}
                    {alert.detected_applicant && <p className="text-[11px] text-muted-foreground">{alert.detected_applicant}</p>}
                  </div>
                </div>
                {/* Visual similarity bar (both logos + score > 0) */}
                {watch?.mark_image_url && alert.detected_mark_image_url && alert.visual_score > 0 && (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-purple-700">Similitud visual: {Math.round(alert.visual_score)}%</p>
                    <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                      <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${Math.round(alert.visual_score)}%` }} />
                    </div>
                  </div>
                )}
              </>
            )}

            {/* AI Analysis */}
            {alert.ai_analysis && (
              <div className="space-y-2">
                <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Análisis IA</p>
                <p className="text-xs text-foreground whitespace-pre-line">{alert.ai_analysis}</p>
                {alert.ai_key_factors && Array.isArray(alert.ai_key_factors) && alert.ai_key_factors.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-foreground space-y-0.5 pl-1">
                    {alert.ai_key_factors.map((f: string, i: number) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            )}

            {/* Deadline / UDRP info */}
            {isDomain ? (
              <div className="rounded-lg p-3 text-xs bg-teal-50 border border-teal-200">
                <div className="flex items-start gap-2">
                  <Globe className="w-4 h-4 text-teal-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="font-semibold text-teal-800">Este dominio puede ser objeto de procedimiento UDRP</p>
                    <p className="text-teal-700">ante la OMPI si existe registro de marca válido.</p>
                    <p className="text-teal-600/70">Tiempo estimado: 60 días · Coste: ~$1.500</p>
                  </div>
                </div>
              </div>
            ) : (
              alert.opposition_deadline && (
                <div className={cn(
                  'rounded-lg p-3 text-xs',
                  daysUrgent != null && daysUrgent < 7 ? 'bg-red-50 border border-red-200' : 'bg-muted/50'
                )}>
                  <span className="font-semibold text-foreground">
                    Vence {format(new Date(alert.opposition_deadline), "dd 'de' MMMM yyyy", { locale: es })}
                  </span>
                  {daysUrgent != null && <span className="ml-2 text-muted-foreground">· Quedan {daysUrgent} días</span>}
                </div>
              )
            )}

            {/* Domain-specific actions */}
            {isDomain && !isResolved && !isSnoozed && (
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1 border-teal-300 text-teal-700"
                  onClick={() => navigate('/app/marketplace?practice=udrp')}
                >
                  <Globe className="w-3 h-3" /> Iniciar UDRP
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1 border-blue-300 text-blue-700"
                  onClick={handleCnD}
                  disabled={cndLoading}
                >
                  {cndLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                  {cndLoading ? 'Generando...' : 'Generar C&D'}
                </Button>
                <Button
                  variant="outline" size="sm"
                  className="h-7 text-xs gap-1 border-purple-300 text-purple-700"
                  onClick={handleEvidenceCapture}
                  disabled={evidenceLoading}
                >
                  {evidenceLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
                  {evidenceLoading ? 'Capturando...' : 'Capturar evidencia'}
                </Button>
              </div>
            )}

            {/* Standard expanded actions (non-domain) */}
            {!isDomain && (
              <div className="flex flex-wrap gap-2">{renderActions()}</div>
            )}

            {/* Portal toggle (in expanded only) */}
            {!isResolved && (
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={effectivePortalVisible || false}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setPortalEditing(true);
                      } else {
                        portalMutation.mutate({ visible: false });
                      }
                    }}
                  />
                  <span className="text-xs text-foreground">Aprobar para portal cliente</span>
                </div>
                {portalEditing && (
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Análisis para el cliente (lenguaje no técnico)..."
                      value={portalText}
                      onChange={e => setPortalText(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <Button
                      size="sm"
                      className="h-7 text-xs"
                      disabled={!portalText.trim() || portalMutation.isPending}
                      onClick={() => portalMutation.mutate({ visible: true, text: portalText })}
                    >
                      {portalMutation.isPending ? 'Publicando...' : 'Publicar en portal'}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Disclaimer */}
            {alert.ai_disclaimer && (
              <p className="text-[11px] text-muted-foreground/70 italic">{alert.ai_disclaimer}</p>
            )}

            {/* Link to full detail page */}
            <div className="pt-2 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs w-full"
                onClick={() => navigate(`/app/spider/alerts/${alert.id}`)}
              >
                Ver análisis completo →
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* ── OPPOSITION DIALOG ── */}
      <Dialog open={oppositionOpen} onOpenChange={setOppositionOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Iniciar proceso de oposición</DialogTitle>
            <DialogDescription>
              Marca: {alert.detected_mark_name} · {alert.detected_jurisdiction}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p>Plazo: <strong>{alert.opposition_days_remaining} días</strong></p>
            {estimatedCost && <p>Coste estimado: <strong>{estimatedCost}€</strong></p>}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="default"
              onClick={() => {
                setOppositionOpen(false);
                navigate(`/app/matters/new?type=trademark&alert_id=${alert.id}&jurisdiction=${alert.detected_jurisdiction || ''}&title=Oposición vs ${encodeURIComponent(alert.detected_mark_name || '')}`);
              }}
            >
              Crear expediente en IP-DOCKET
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setOppositionOpen(false);
                navigate(`/app/marketplace?jurisdiction=${alert.detected_jurisdiction || ''}`);
              }}
            >
              Buscar agente primero
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── DISMISS DIALOG ── */}
      <Dialog open={dismissOpen} onOpenChange={setDismissOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alerta</DialogTitle>
            <DialogDescription>
              {alert.detected_mark_name} · {alert.detected_jurisdiction}
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Razón (opcional)"
            value={dismissReason}
            onChange={e => setDismissReason(e.target.value)}
            className="min-h-[60px]"
          />
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDismissOpen(false)}>Cancelar</Button>
            <Button
              variant="destructive"
              onClick={() => dismissMutation.mutate(dismissReason)}
              disabled={dismissMutation.isPending}
            >
              {dismissMutation.isPending ? 'Descartando...' : 'Descartar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── C&D PREVIEW DIALOG ── */}
      <Dialog open={cndDialogOpen} onOpenChange={setCndDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Carta de Cese y Desistimiento</DialogTitle>
          </DialogHeader>
          {cndDoc && (
            <div className="text-xs whitespace-pre-wrap bg-muted/30 rounded-lg p-4 border border-border">
              {cndDoc.content || cndDoc.document || JSON.stringify(cndDoc, null, 2)}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setCndDialogOpen(false)}>Cerrar</Button>
            <Button onClick={() => {
              // Download as text
              const blob = new Blob([cndDoc?.content || cndDoc?.document || ''], { type: 'text/plain' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `CeD_${alert.detected_mark_name || 'documento'}.txt`;
              a.click();
              URL.revokeObjectURL(url);
            }}>
              Descargar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ════════════════════════════════════════════
function SimilarityBar({ label, score, color, pending }: { label: string; score: number | null; color: string; pending?: boolean }) {
  const pct = score != null ? Math.round(score) : 0;
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-muted-foreground w-[90px] truncate flex items-center gap-1">
        {label}
        {pending && (
          <span className="text-[8px] px-1 py-0.5 rounded bg-slate-200 text-slate-500 font-medium" title="El análisis visual se ejecuta en el siguiente scan">
            Pendiente
          </span>
        )}
      </span>
      <div className="flex-1 h-2 rounded-full bg-muted/60 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-bold tabular-nums w-8 text-right text-foreground">{pct}%</span>
    </div>
  );
}
