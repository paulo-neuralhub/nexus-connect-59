import { useParams, useNavigate } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Breadcrumb, BreadcrumbList, BreadcrumbItem,
  BreadcrumbLink, BreadcrumbSeparator, BreadcrumbPage,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ArrowLeft, AlertTriangle, Shield, ShieldCheck, Camera,
  Globe, User, FileText, ChevronRight, ExternalLink,
  Loader2, Eye, Keyboard,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const BLUE = '#3B82F6';
const VIOLET = '#8B5CF6';
const TEAL = '#14B8A6';

const SEVERITY_COLORS: Record<string, string> = {
  critical: 'bg-red-600 text-white',
  high: 'bg-orange-500 text-white',
  medium: 'bg-amber-500 text-white',
  low: 'bg-slate-400 text-white',
};

const SEVERITY_SCORE_BG: Record<string, string> = {
  critical: 'bg-red-100 text-red-700 border-red-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  medium: 'bg-amber-100 text-amber-700 border-amber-300',
  low: 'bg-slate-100 text-slate-600 border-slate-300',
};

function getSeverityForScore(score: number): string {
  if (score >= 80) return 'critical';
  if (score >= 60) return 'high';
  if (score >= 40) return 'medium';
  return 'low';
}

const ALERT_CATEGORY_ICONS: Record<string, any> = {
  registral: Shield,
  similarity: Shield,
  domain: Globe,
  social: User,
  visual: Eye,
};

const EVIDENCE_ICONS: Record<string, any> = {
  screenshot: Camera,
  whois: Globe,
  social_profile: User,
  registry_extract: FileText,
};

const CHANNEL_OPTIONS: Record<string, { label: string; options: string[] }> = {
  registral: {
    label: 'Canal Registral',
    options: ['Oposición presentada', 'Coexistencia acordada', 'Vigilancia continua', 'Sin acción requerida'],
  },
  similarity: {
    label: 'Canal Registral',
    options: ['Oposición presentada', 'Coexistencia acordada', 'Vigilancia continua', 'Sin acción requerida'],
  },
  social: {
    label: 'Canal Social',
    options: ['Reporte a plataforma', 'C&D enviado', 'Sin acción requerida'],
  },
  domain: {
    label: 'Canal Dominio',
    options: ['UDRP iniciado', 'C&D enviado', 'Sin acción requerida'],
  },
  visual: {
    label: 'Canal Visual',
    options: ['Oposición por logo', 'C&D enviado', 'Sin acción requerida'],
  },
};

const OUTCOME_OPTIONS = [
  'Oposición exitosa',
  'Acuerdo de coexistencia',
  'C&D aceptado',
  'UDRP resuelto',
  'Reporte aceptado',
  'Monitorización continua',
  'Amenaza descartada',
];

export default function SpiderIncidentView() {
  const { incidentId } = useParams<{ incidentId: string }>();
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const organizationId = currentOrganization?.id;

  const [incident, setIncident] = useState<any>(null);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [evidences, setEvidences] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  // Resolution dialog
  const [showResolveDialog, setShowResolveDialog] = useState(false);
  const [isResolving, setIsResolving] = useState(false);
  const [channelSelects, setChannelSelects] = useState<Record<string, string>>({});
  const [selectedOutcome, setSelectedOutcome] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');

  // Actions
  const [isAdvancing, setIsAdvancing] = useState(false);
  const [isMarking, setIsMarking] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);

  const loadData = useCallback(async () => {
    if (!organizationId || !incidentId) return;
    setLoading(true);
    setError(false);

    try {
      // Query 1 — Incident
      const { data: inc, error: incErr } = await fromTable('spider_incidents')
        .select('*')
        .eq('id', incidentId)
        .eq('organization_id', organizationId)
        .single();

      if (incErr || !inc) { setError(true); setLoading(false); return; }
      setIncident(inc);

      // Query 2 — Alerts (guard empty)
      const alertIds: string[] = inc.alert_ids ?? [];
      let alertsData: any[] = [];
      if (alertIds.length > 0) {
        const { data } = await fromTable('spider_alerts')
          .select('*')
          .in('id', alertIds)
          .eq('organization_id', organizationId)
          .order('combined_score', { ascending: false });
        alertsData = data ?? [];
      }
      setAlerts(alertsData);

      // Query 3 — Workflow steps
      if (alertsData.length > 0) {
        const { data: steps } = await fromTable('spider_workflow_steps')
          .select('id, step_order, step_name, assignee_role, sla_hours, actions_available')
          .eq('organization_id', organizationId)
          .order('step_order', { ascending: true });
        setWorkflowSteps(steps ?? []);
      }

      // Query 4 — Evidence
      const { data: evData } = await fromTable('spider_evidence')
        .select('id, evidence_type, source_url, file_url, file_hash, captured_at, is_legally_certified, chain_of_custody')
        .eq('incident_id', incidentId)
        .eq('organization_id', organizationId)
        .order('captured_at', { ascending: false });
      setEvidences(evData ?? []);

    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [organizationId, incidentId]);

  useEffect(() => { loadData(); }, [loadData]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!incident || incident.status === 'resolved') return;
    function handleKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target instanceof HTMLSelectElement) return;
      if (showResolveDialog) return;
      switch (e.key.toLowerCase()) {
        case 'a': handleAdvanceAll(); break;
        case 'i': setShowResolveDialog(true); break;
        case 'm': handlePostponeAll(); break;
        case 'escape': navigate('/app/spider'); break;
      }
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [incident, alerts, workflowSteps, showResolveDialog]);

  // Derived
  const isOrganizedActor = (incident?.sources?.length ?? 0) >= 3 && (incident?.alert_count ?? 0) >= 3;
  const riskScore = incident?.risk_score_unified ?? 0;
  const scoreSeverity = getSeverityForScore(riskScore);

  // Current workflow step = max step_order among alerts
  const currentStepOrder = alerts.reduce((max, a) => {
    const step = workflowSteps.find((s: any) => s.id === a.workflow_step_id);
    return step ? Math.max(max, step.step_order) : max;
  }, 0);
  const currentStep = workflowSteps.find((s: any) => s.step_order === currentStepOrder);

  // Unique channels from alerts
  const uniqueChannels = [...new Set(alerts.map(a => a.alert_category).filter(Boolean))];

  // --- Actions ---
  async function handleAdvanceAll() {
    if (isAdvancing || !currentStep || alerts.length === 0) return;
    const nextStep = workflowSteps.find((s: any) => s.step_order === currentStep.step_order + 1);
    if (!nextStep) { toast.info('Ya está en el último nivel'); return; }
    setIsAdvancing(true);
    try {
      const alertIds = alerts.map(a => a.id);
      await fromTable('spider_alerts')
        .update({ workflow_step_id: nextStep.id })
        .in('id', alertIds)
        .eq('organization_id', organizationId);
      toast.success(`Todas las alertas avanzadas a: ${nextStep.step_name}`);
      await loadData();
    } catch { toast.error('Error al avanzar'); }
    finally { setIsAdvancing(false); }
  }

  async function handlePostponeAll() {
    if (alerts.length === 0) return;
    const postponeDate = new Date();
    postponeDate.setDate(postponeDate.getDate() + 7);
    try {
      await fromTable('spider_alerts')
        .update({ snoozed_until: postponeDate.toISOString() })
        .in('id', alerts.map(a => a.id))
        .eq('organization_id', organizationId);
      toast.success('Todas las alertas pospuestas 7 días');
    } catch { toast.error('Error al posponer'); }
  }

  async function handleMarkInvestigating() {
    if (isMarking) return;
    setIsMarking(true);
    try {
      await fromTable('spider_incidents')
        .update({ status: 'investigating' })
        .eq('id', incidentId)
        .eq('organization_id', organizationId);
      toast.success('Incidente marcado como investigando');
      await loadData();
    } catch { toast.error('Error al actualizar'); }
    finally { setIsMarking(false); }
  }

  async function handleResolve() {
    setIsResolving(true);
    try {
      const userId = (await supabase.auth.getUser()).data.user?.id;
      await fromTable('spider_incidents').update({
        status: 'resolved',
        resolution_outcome: selectedOutcome,
        resolution_notes: resolutionNotes,
        resolved_by: userId,
        resolved_at: new Date().toISOString(),
      }).eq('id', incidentId).eq('organization_id', organizationId);

      const alertIds = alerts.map(a => a.id);
      for (let i = 0; i < alertIds.length; i += 20) {
        const chunk = alertIds.slice(i, i + 20);
        await fromTable('spider_alerts').update({
          status: 'resolved',
          action_taken: 'incident_resolved',
          actioned_at: new Date().toISOString(),
          actioned_by: userId,
        }).in('id', chunk).eq('organization_id', organizationId);
      }

      setShowResolveDialog(false);
      toast.success('Incidente resuelto');
      navigate('/app/spider');
    } catch { toast.error('Error al resolver'); }
    finally { setIsResolving(false); }
  }

  async function handleCaptureEvidence() {
    if (isCapturing) return;
    setIsCapturing(true);
    try {
      const alertsWithUrl = alerts.filter(a => a.source_url);
      for (const alert of alertsWithUrl) {
        await supabase.functions.invoke('spider-evidence-capture', {
          body: {
            url: alert.source_url,
            alert_id: alert.id,
            incident_id: incidentId,
            organization_id: organizationId,
            evidence_type: 'screenshot',
          },
        });
      }
      toast.success('Capturando evidencias...');
      setTimeout(() => loadData(), 3000);
    } catch { toast.error('Error al capturar evidencia'); }
    finally { setIsCapturing(false); }
  }

  async function handleVisualAnalysis() {
    const alertsWithLogo = alerts.filter(a => a.mark_image_url);
    if (alertsWithLogo.length === 0) return;
    try {
      for (const alert of alertsWithLogo) {
        await supabase.functions.invoke('trademark-comparison', {
          body: {
            alert_id: alert.id,
            organization_id: organizationId,
          },
        });
      }
      toast.success('Análisis visual iniciado');
      setTimeout(() => loadData(), 5000);
    } catch { toast.error('Error al analizar'); }
  }

  const allSelectsFilled = uniqueChannels.every(ch => channelSelects[ch]) && !!selectedOutcome;

  // ── LOADING ──
  if (loading) {
    return (
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-16 w-full" />
        {[1, 2, 3, 4, 5, 6].map(i => (
          <Skeleton key={i} className="h-40 w-full" />
        ))}
      </div>
    );
  }

  // ── ERROR ──
  if (error || !incident) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <Shield className="w-16 h-16 text-muted-foreground" />
        <p className="text-lg text-muted-foreground">Incidente no encontrado</p>
        <Button onClick={() => navigate('/app/spider')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver
        </Button>
      </div>
    );
  }

  const daysToResolve = incident.resolved_at && incident.first_detected_at
    ? Math.floor((new Date(incident.resolved_at).getTime() - new Date(incident.first_detected_at).getTime()) / 86400000)
    : null;

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {/* BREADCRUMB */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/app/spider">IP-SPIDER</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink href="/app/spider">Incidentes</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>{incident.entity_name || 'Incidente'}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      {/* HEADER */}
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-2">
          <div className="flex items-center gap-3 flex-wrap">
            <Badge className={cn('text-sm px-3 py-1', SEVERITY_COLORS[incident.severity] || SEVERITY_COLORS.medium)}>
              {incident.severity?.toUpperCase()}
            </Badge>
            <h1 className="text-2xl font-bold text-foreground">{incident.incident_title}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Detectado en: {(incident.sources ?? []).join(' · ') || '—'}
          </p>
          {isOrganizedActor && (
            <Badge variant="destructive" className="gap-1">
              <AlertTriangle className="w-3 h-3" /> Actor organizado
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <div className={cn('flex flex-col items-center justify-center w-20 h-20 rounded-xl border-2', SEVERITY_SCORE_BG[scoreSeverity])}>
            <span className="text-[48px] leading-none font-bold">{riskScore}</span>
          </div>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/spider')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
        </div>
      </div>

      {/* BLOQUE 1 — RISK SCORE 4D */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Análisis de prioridad unificado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {(incident.registral_score ?? 0) > 0 && (
            <ScoreBar label="R" labelFull="Riesgo registral" score={incident.registral_score} color={BLUE} />
          )}
          {(incident.visual_score ?? 0) > 0 ? (
            <ScoreBar label="V" labelFull="Riesgo visual" score={incident.visual_score} color={VIOLET} />
          ) : alerts.some(a => a.mark_image_url) ? (
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold w-4 text-center" style={{ color: VIOLET }}>V</span>
              <div className="flex-1 h-1.5 bg-muted rounded-full" />
              <Badge variant="outline" className="text-xs">Análisis visual pendiente</Badge>
              <Button size="sm" variant="outline" className="h-6 text-xs" onClick={handleVisualAnalysis}>
                Analizar ahora
              </Button>
            </div>
          ) : null}
          {(incident.digital_score ?? 0) > 0 && (
            <ScoreBar label="D" labelFull="Riesgo digital" score={incident.digital_score} color={TEAL} />
          )}
          <div className="pt-4 border-t flex flex-col items-center">
            <span className="text-[48px] leading-none font-bold" style={{ color: VIOLET }}>{riskScore}</span>
            <span className="text-sm text-muted-foreground mt-1">Índice de Prioridad Unificado</span>
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 2 — ALERTAS */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Alertas detectadas</CardTitle>
            <Badge variant="secondary">{alerts.length}</Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {alerts.map(alert => {
            const Icon = ALERT_CATEGORY_ICONS[alert.alert_category] || Shield;
            const oppDays = alert.opposition_days_remaining;
            return (
              <div key={alert.id} className="flex items-center gap-3 p-3 rounded-lg border" style={{ borderLeftWidth: 4, borderLeftColor: SEVERITY_COLORS_HEX[alert.severity] || '#94a3b8' }}>
                <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
                <span className="font-medium text-sm truncate">{alert.detected_mark_name || alert.id.slice(0, 8)}</span>
                <Badge variant="outline" className="text-xs shrink-0">
                  {alert.detected_jurisdiction || alert.social_platform || '—'}
                </Badge>
                <span className="text-xs font-semibold ml-auto shrink-0" style={{ color: (alert.combined_score ?? 0) >= 80 ? '#dc2626' : (alert.combined_score ?? 0) >= 60 ? '#ea580c' : '#64748b' }}>
                  {alert.combined_score ?? '—'}%
                </span>
                <Badge variant="outline" className="text-xs">{alert.status}</Badge>
                {oppDays != null && oppDays <= 30 && (
                  <Badge variant="destructive" className={cn('text-xs', oppDays < 7 && 'animate-pulse')}>
                    {oppDays}d
                  </Badge>
                )}
                {alert.media_screenshot_url && (
                  <a href={alert.media_screenshot_url} target="_blank" rel="noopener noreferrer">
                    <img src={alert.media_screenshot_url} alt="" className="w-10 h-10 rounded object-cover border" />
                  </a>
                )}
                <Button size="sm" variant="ghost" className="h-7 text-xs shrink-0" onClick={() => navigate(`/app/spider/alerts/${alert.id}`)}>
                  Ver detalle <ChevronRight className="w-3 h-3" />
                </Button>
              </div>
            );
          })}
          {alerts.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">Sin alertas vinculadas</p>
          )}
        </CardContent>
      </Card>

      {/* BLOQUE 3 — ACTION LADDER */}
      {workflowSteps.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Plan de acción recomendado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-1">
              {workflowSteps.map((step: any) => {
                const isActive = step.step_order === currentStepOrder;
                const isPast = step.step_order < currentStepOrder;
                return (
                  <div key={step.id} className={cn(
                    'flex items-center gap-3 p-2 rounded-md text-sm transition-colors',
                    isActive && 'bg-violet-50 border border-violet-200',
                    isPast && 'text-muted-foreground',
                  )}>
                    <div className={cn(
                      'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                      isActive ? 'bg-violet-600 text-white' : isPast ? 'bg-muted text-muted-foreground' : 'border border-muted-foreground/30 text-muted-foreground',
                    )}>
                      {isPast ? '✓' : step.step_order}
                    </div>
                    <span className={cn('font-medium', isActive && 'text-violet-700')}>{step.step_name}</span>
                    {step.assignee_role && <Badge variant="outline" className="text-xs ml-auto">{step.assignee_role}</Badge>}
                    {step.sla_hours && <span className="text-xs text-muted-foreground">{step.sla_hours}h SLA</span>}
                  </div>
                );
              })}
            </div>
            {incident.status !== 'resolved' && (
              <Button
                className="w-full"
                style={{ backgroundColor: VIOLET }}
                onClick={handleAdvanceAll}
                disabled={isAdvancing}
              >
                {isAdvancing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                Avanzar todas las alertas
              </Button>
            )}
            <div className="flex items-center gap-2 text-xs text-muted-foreground pt-1">
              <Keyboard className="w-3 h-3" />
              <span>A: Avanzar · I: Resolver · M: Posponer 7d · Esc: Volver</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* BLOQUE 4 — EVIDENCE VAULT */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Bóveda de evidencias</CardTitle>
        </CardHeader>
        <CardContent>
          {evidences.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {evidences.map((ev: any) => {
                const EvIcon = EVIDENCE_ICONS[ev.evidence_type] || FileText;
                return (
                  <div key={ev.id} className="flex items-center gap-3 p-3 rounded-lg border">
                    <EvIcon className="w-5 h-5 text-muted-foreground shrink-0" />
                    <div className="flex-1 min-w-0">
                      <Badge variant="outline" className="text-xs mb-1">{ev.evidence_type}</Badge>
                      <p className="text-xs text-muted-foreground">
                        {ev.captured_at ? new Date(ev.captured_at).toLocaleDateString() : '—'}
                      </p>
                      {ev.file_hash && (
                        <p className="text-xs font-mono text-muted-foreground">{ev.file_hash.slice(0, 8)}…</p>
                      )}
                    </div>
                    {ev.is_legally_certified && (
                      <Badge className="bg-green-100 text-green-700 text-xs">Certificada</Badge>
                    )}
                    {ev.file_url && (
                      <a href={ev.file_url} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="ghost" className="h-7 text-xs">
                          Ver <ExternalLink className="w-3 h-3 ml-1" />
                        </Button>
                      </a>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-6 space-y-3">
              <p className="text-sm text-muted-foreground">Sin evidencias capturadas aún</p>
              <Button
                style={{ backgroundColor: VIOLET }}
                className="text-white"
                onClick={handleCaptureEvidence}
                disabled={isCapturing}
              >
                {isCapturing ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Camera className="w-4 h-4 mr-2" />}
                Capturar evidencia
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* BLOQUE 5 — PLATAFORMAS */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Canales de detección</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {alerts.map(alert => {
              const Icon = ALERT_CATEGORY_ICONS[alert.alert_category] || Shield;
              return (
                <div key={alert.id} className="p-3 rounded-lg border space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" style={{ color: VIOLET }} />
                    <span className="font-medium text-sm">{alert.detected_mark_name || '—'}</span>
                    <span className="text-xs text-muted-foreground ml-auto">
                      {alert.combined_score ?? 0}%
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {alert.source_code || alert.detected_jurisdiction || alert.social_platform || '—'}
                  </p>
                  {alert.alert_category === 'social' && (
                    <div className="text-xs space-y-0.5">
                      {alert.social_handle && <p>@{alert.social_handle}</p>}
                      {alert.social_followers != null && <p>{alert.social_followers.toLocaleString()} seguidores</p>}
                      {alert.social_profile_url && (
                        <a href={alert.social_profile_url} target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">
                          Ver perfil <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      )}
                    </div>
                  )}
                  {alert.alert_category === 'domain' && alert.detected_mark_name && (
                    <a href={`https://${alert.detected_mark_name}`} target="_blank" rel="noopener noreferrer" className="text-xs text-teal-600 hover:underline">
                      {alert.detected_mark_name} <ExternalLink className="w-3 h-3 inline" />
                    </a>
                  )}
                  {(alert.alert_category === 'registral' || alert.alert_category === 'similarity') && (
                    <div className="text-xs space-y-0.5">
                      {alert.detected_application_number && <p>Nº {alert.detected_application_number}</p>}
                      {alert.source_url && (
                        <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          Ver registro <ExternalLink className="w-3 h-3 inline" />
                        </a>
                      )}
                    </div>
                  )}
                  <Button size="sm" variant="ghost" className="h-7 text-xs w-full mt-1" onClick={() => navigate(`/app/spider/alerts/${alert.id}`)}>
                    Ver alerta completa →
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* BLOQUE 6 — RESOLUCIÓN */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Gestionar incidente</CardTitle>
        </CardHeader>
        <CardContent>
          {incident.status === 'resolved' ? (
            <div className="space-y-2 text-center py-4">
              <Badge className="bg-green-100 text-green-700 text-lg px-4 py-1">{incident.resolution_outcome}</Badge>
              {incident.resolution_notes && <p className="text-sm text-muted-foreground">{incident.resolution_notes}</p>}
              <p className="text-xs text-muted-foreground">
                Resuelto el {new Date(incident.resolved_at).toLocaleDateString()}
              </p>
              {daysToResolve !== null && (
                <p className="text-xs text-muted-foreground">Gestionado en {daysToResolve} días</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="destructive"
                onClick={() => {
                  setChannelSelects({});
                  setSelectedOutcome('');
                  setResolutionNotes('');
                  setShowResolveDialog(true);
                }}
              >
                Resolver incidente
              </Button>
              {incident.status !== 'investigating' && (
                <Button
                  variant="outline"
                  className="border-amber-400 text-amber-600"
                  onClick={handleMarkInvestigating}
                  disabled={isMarking}
                >
                  {isMarking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Marcar como investigando
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* RESOLVE DIALOG */}
      <Dialog open={showResolveDialog} onOpenChange={(open) => { if (!open && !isResolving) setShowResolveDialog(false); }}>
        <DialogContent
          className="max-w-lg"
          onInteractOutside={(e) => e.preventDefault()}
          onEscapeKeyDown={(e) => { if (isResolving) e.preventDefault(); }}
        >
          <DialogHeader>
            <DialogTitle>Resolver incidente</DialogTitle>
            <DialogDescription>Completa la resolución por cada canal afectado.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {uniqueChannels.map(ch => {
              const opts = CHANNEL_OPTIONS[ch] || { label: ch, options: ['Sin acción requerida'] };
              return (
                <div key={ch} className="space-y-1.5">
                  <Label className="text-sm font-medium">{opts.label}</Label>
                  <Select value={channelSelects[ch] || ''} onValueChange={(v) => setChannelSelects(prev => ({ ...prev, [ch]: v }))}>
                    <SelectTrigger><SelectValue placeholder="Seleccionar acción..." /></SelectTrigger>
                    <SelectContent>
                      {opts.options.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Resultado global</Label>
              <Select value={selectedOutcome} onValueChange={setSelectedOutcome}>
                <SelectTrigger><SelectValue placeholder="Seleccionar resultado..." /></SelectTrigger>
                <SelectContent>
                  {OUTCOME_OPTIONS.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Notas (opcional)</Label>
              <Textarea value={resolutionNotes} onChange={e => setResolutionNotes(e.target.value)} rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowResolveDialog(false)} disabled={isResolving}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleResolve} disabled={!allSelectsFilled || isResolving}>
              {isResolving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Resolver
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Helper Components ──

const SEVERITY_COLORS_HEX: Record<string, string> = {
  critical: '#dc2626',
  high: '#ea580c',
  medium: '#f59e0b',
  low: '#94a3b8',
};

function ScoreBar({ label, labelFull, score, color }: { label: string; labelFull: string; score: number; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs font-bold w-4 text-center" style={{ color }}>[{label}]</span>
      <span className="text-xs text-muted-foreground w-28 truncate">{labelFull}</span>
      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${score}%`, backgroundColor: color }} />
      </div>
      <span className="text-xs font-semibold w-10 text-right">{score}%</span>
    </div>
  );
}
