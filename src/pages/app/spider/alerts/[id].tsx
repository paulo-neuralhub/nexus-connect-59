/**
 * SP01-E1 + SP01-E2 — Spider Alert Decision View
 * /app/spider/alerts/:id — 6 blocks + Action Ladder + Portal Preview + Keyboard shortcuts
 */
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
import { fromTable } from '@/lib/supabase';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ArrowLeft, ChevronRight, Clock, ExternalLink, Check, ShieldAlert,
  AlertTriangle, Eye, Keyboard, Sparkles, Image as ImageIcon, Loader2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, addDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

const SEVERITY_CONFIG: Record<string, { label: string; cls: string; portalLabel: string }> = {
  critical: { label: 'CRÍTICO', cls: 'bg-red-100 text-red-700 border-red-200', portalLabel: 'Amenaza urgente' },
  high: { label: 'ALTO', cls: 'bg-amber-100 text-amber-700 border-amber-200', portalLabel: 'Amenaza importante' },
  medium: { label: 'MEDIO', cls: 'bg-yellow-100 text-yellow-700 border-yellow-200', portalLabel: 'Amenaza a revisar' },
};

export default function SpiderAlertDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Dialog states
  const [advanceDialogOpen, setAdvanceDialogOpen] = useState(false);
  const [dismissDialogOpen, setDismissDialogOpen] = useState(false);
  const [portalPreviewOpen, setPortalPreviewOpen] = useState(false);
  const [dismissReason, setDismissReason] = useState('');

  const hasDialogOpen = advanceDialogOpen || dismissDialogOpen || portalPreviewOpen;

  const { data: alert, isLoading, error } = useQuery({
    queryKey: ['spider-alert-detail', orgId, id],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_alerts')
        .select(`
          *,
          spider_watches!watch_id (
            watch_name, nice_classes, jurisdictions,
            weight_phonetic, weight_semantic, weight_visual,
            goods_services_description, mark_image_url
          ),
          spider_workflow_steps!workflow_step_id (
            step_order, step_name, assignee_role, sla_hours,
            actions_available
          )
        `)
        .eq('id', id)
        .eq('organization_id', orgId)
        .single();
      if (error) throw error;
      return data as any;
    },
    enabled: !!orgId && !!id,
  });

  const { data: allSteps } = useQuery({
    queryKey: ['spider-workflow-steps', orgId],
    queryFn: async () => {
      const { data, error } = await fromTable('spider_workflow_steps')
        .select('id, step_order, step_name, assignee_role, sla_hours, actions_available')
        .eq('organization_id', orgId)
        .order('step_order', { ascending: true });
      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!orgId,
  });

  // Mutations
  const advanceMutation = useMutation({
    mutationFn: async (nextStepId: string) => {
      const { error } = await fromTable('spider_alerts')
        .update({ workflow_step_id: nextStepId })
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['spider-alert-detail'] });
      toast.success(`Nivel actualizado: ${nextStep?.step_name}`);
      setAdvanceDialogOpen(false);
    },
    onError: () => toast.error('No se pudo avanzar el nivel'),
  });

  const dismissMutation = useMutation({
    mutationFn: async (reason: string) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await fromTable('spider_alerts')
        .update({
          status: 'resolved',
          action_taken: 'dismissed',
          action_notes: reason || null,
          actioned_at: new Date().toISOString(),
          actioned_by: user?.id || null,
        })
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta descartada');
      navigate('/app/spider');
    },
    onError: () => toast.error('No se pudo descartar la alerta'),
  });

  const snoozeMutation = useMutation({
    mutationFn: async () => {
      const { error } = await fromTable('spider_alerts')
        .update({
          snoozed_until: addDays(new Date(), 7).toISOString(),
          status: 'viewed',
        })
        .eq('id', id)
        .eq('organization_id', orgId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Alerta pospuesta 7 días');
      navigate('/app/spider');
    },
    onError: () => toast.error('No se pudo posponer la alerta'),
  });

  // Derived data
  const currentStep = alert?.spider_workflow_steps;
  const currentStepOrder = currentStep?.step_order ?? 1;
  const nextStep = allSteps?.find((s: any) => s.step_order === currentStepOrder + 1);

  // Keyboard shortcuts
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    const tag = (document.activeElement?.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
    if (hasDialogOpen && e.key !== 'Escape') return;

    if (e.key === 'Escape') {
      if (hasDialogOpen) return; // Dialog handles its own Escape
      navigate('/app/spider');
      return;
    }
    if (!alert) return;

    const key = e.key.toLowerCase();
    if (key === 'a' && nextStep) {
      e.preventDefault();
      setAdvanceDialogOpen(true);
    } else if (key === 'i') {
      e.preventDefault();
      setDismissDialogOpen(true);
    } else if (key === 'm') {
      e.preventDefault();
      snoozeMutation.mutate();
    } else if (key === 'o') {
      e.preventDefault();
      if (alert.opposition_deadline) {
        navigate(`/app/matters/new?type=trademark&alert_id=${id}&jurisdiction=${alert.detected_jurisdiction}&title=${encodeURIComponent(`Oposición vs ${alert.detected_mark_name}`)}`);
      } else {
        toast.warning('Esta alerta no tiene plazo de oposición registrado');
      }
    }
  }, [alert, hasDialogOpen, nextStep, id, navigate, snoozeMutation]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  if (isLoading) return <LoadingSkeleton />;

  if (error || !alert) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-4">
        <ShieldAlert className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Alerta no encontrada</p>
        <Button variant="outline" onClick={() => navigate('/app/spider')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Volver a IP-SPIDER
        </Button>
      </div>
    );
  }

  const watch = alert.spider_watches;
  const severity = SEVERITY_CONFIG[alert.severity] || SEVERITY_CONFIG.medium;
  const daysRemaining = alert.opposition_days_remaining;

  // Priority Engine calculations
  const legalRisk = alert.combined_score != null ? Math.round(alert.combined_score) : 50;

  let commercialImpact = 50;
  if (['US', 'CN', 'DE', 'GB', 'FR', 'JP'].includes(alert.detected_applicant_country)) commercialImpact += 20;
  if (Array.isArray(alert.detected_nice_classes) && alert.detected_nice_classes.length >= 5) commercialImpact += 15;
  if (alert.detected_mark_status === 'registered') commercialImpact += 20;
  else if (alert.detected_mark_status === 'published') commercialImpact += 10;
  commercialImpact = Math.min(commercialImpact, 99);

  let proceduralUrgency = 20;
  if (daysRemaining != null) {
    if (daysRemaining <= 7) proceduralUrgency = 95;
    else if (daysRemaining <= 14) proceduralUrgency = 80;
    else if (daysRemaining <= 30) proceduralUrgency = 65;
    else if (daysRemaining <= 60) proceduralUrgency = 40;
  }

  let dataConfidence = 60;
  if (alert.source_reliability === 'high') dataConfidence = 90;
  else if (alert.source_reliability === 'medium') dataConfidence = 70;
  else if (alert.source_reliability === 'low') dataConfidence = 50;

  const priorityIndex = Math.round(legalRisk * 0.40 + commercialImpact * 0.25 + proceduralUrgency * 0.25 + dataConfidence * 0.10);
  const priorityColor = priorityIndex > 75 ? 'text-red-600' : priorityIndex > 50 ? 'text-amber-600' : 'text-green-600';

  return (
    <div className="max-w-[900px] mx-auto px-6 py-6 space-y-4">
      {/* BREADCRUMB + HEADER */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link to="/app/spider" className="hover:text-foreground transition-colors">IP-SPIDER</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-foreground">{alert.detected_mark_name || 'Alerta'}</span>
        </div>
        {/* Keyboard shortcuts indicator */}
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground text-[10px] cursor-default">
                <Keyboard className="w-3 h-3" />
                <span className="font-mono">A · I · M · O</span>
              </div>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs space-y-1 max-w-[200px]">
              <p><strong>A</strong> — Actuar (avanzar nivel)</p>
              <p><strong>I</strong> — Ignorar (descartar)</p>
              <p><strong>M</strong> — Monitorizar (posponer 7d)</p>
              <p><strong>O</strong> — Oponer (iniciar oposición)</p>
              <p><strong>Esc</strong> — Volver a Spider</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Badge className={cn('text-[11px] font-bold border', severity.cls)}>{severity.label}</Badge>
            {alert.visual_score > 0 && (
              <Badge className="text-[10px] font-bold bg-purple-100 text-purple-700 border-purple-200">Visual {Math.round(alert.visual_score)}%</Badge>
            )}
            <h1 className="text-2xl font-bold text-foreground">{alert.detected_mark_name}</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {alert.detected_jurisdiction}{alert.detected_application_number ? ` · ${alert.detected_application_number}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {daysRemaining != null && daysRemaining < 30 && (
            <Badge className={cn('bg-red-100 text-red-700 border-red-200 font-bold', daysRemaining < 7 && 'animate-pulse')}>
              <Clock className="w-3 h-3 mr-1" /> {daysRemaining} días para actuar
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={() => navigate('/app/spider')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> Volver
          </Button>
        </div>
      </div>

      {/* BLOCK 1 — DETECTION */}
      <Card>
        <CardHeader><CardTitle>Marca detectada</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {/* Logo comparison section */}
          <LogoComparison alert={alert} watch={watch} orgId={orgId!} alertId={id!} />

          {/* Text comparison */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Tu marca</p>
              <p className="text-lg font-bold text-foreground">{watch?.watch_name || '—'}</p>
              {watch?.nice_classes && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(watch.nice_classes) ? watch.nice_classes : []).map((c: any) => (
                    <Badge key={c} variant="secondary" className="text-[10px] bg-violet-100 text-violet-700 border-violet-200">Cl. {c}</Badge>
                  ))}
                </div>
              )}
              {watch?.goods_services_description && (
                <p className="text-xs text-muted-foreground line-clamp-2">{watch.goods_services_description}</p>
              )}
              <Badge className="text-[10px] bg-green-100 text-green-700 border-green-200">Registrada</Badge>
            </div>
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Marca detectada</p>
              <p className="text-lg font-bold text-foreground">{alert.detected_mark_name}</p>
              {alert.detected_application_number && (
                <p className="text-xs text-muted-foreground font-mono">{alert.detected_application_number}</p>
              )}
              {alert.detected_nice_classes && (
                <div className="flex flex-wrap gap-1">
                  {(Array.isArray(alert.detected_nice_classes) ? alert.detected_nice_classes : []).map((c: any) => (
                    <Badge key={c} variant="secondary" className="text-[10px]">Cl. {c}</Badge>
                  ))}
                </div>
              )}
              {alert.detected_goods_services && (
                <p className="text-xs text-muted-foreground line-clamp-2">{alert.detected_goods_services}</p>
              )}
              {alert.detected_mark_status && <Badge variant="outline" className="text-[10px]">{alert.detected_mark_status}</Badge>}
              {alert.detected_applicant && (
                <p className="text-xs text-muted-foreground">
                  {alert.detected_applicant}{alert.detected_applicant_country ? ` · ${alert.detected_applicant_country}` : ''}
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BLOCK 2 — PRIORITY ENGINE 4D */}
      <Card>
        <CardHeader><CardTitle>Análisis de prioridad</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <PriorityBar label="Riesgo Legal" value={legalRisk} color="bg-red-500"
            detail={`${legalRisk}% · ${alert.ai_key_factors?.[0] || 'Score combinado de similitud'}`} />
          <PriorityBar label="Impacto Comercial" value={commercialImpact} color="bg-amber-500"
            detail={`${commercialImpact}% · estimado por actividad del solicitante`} />
          <PriorityBar label="Urgencia Procesal" value={proceduralUrgency} color="bg-violet-500"
            detail={`${proceduralUrgency}% · ${daysRemaining != null ? `${daysRemaining} días` : 'Sin plazo inmediato'}`} />
          <PriorityBar label="Confianza del dato" value={dataConfidence} color="bg-blue-500"
            detail={`${dataConfidence}% · ${alert.source_code || 'fuente no especificada'}`} />
          <div className="text-center pt-4 border-t border-border">
            <span className={cn('text-5xl font-bold tabular-nums', priorityColor)}>{priorityIndex}</span>
            <p className="text-xs text-muted-foreground mt-1">Índice de Prioridad</p>
          </div>
        </CardContent>
      </Card>

      {/* BLOCK 3 — AI ANALYSIS */}
      <Card>
        <CardHeader><CardTitle>Análisis IP-GENIUS</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {alert.ai_analysis ? (
            <p className="text-sm text-foreground whitespace-pre-line">{alert.ai_analysis}</p>
          ) : (
            <p className="text-sm text-muted-foreground">Sin análisis disponible.</p>
          )}
          {alert.ai_key_factors && Array.isArray(alert.ai_key_factors) && alert.ai_key_factors.length > 0 && (
            <ul className="space-y-1 pl-1">
              {alert.ai_key_factors.map((f: string, i: number) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <span className="w-2 h-2 rounded-full bg-violet-500 mt-1.5 flex-shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          )}
          {alert.ai_disclaimer && (
            <>
              <hr className="border-border" />
              <p className="text-[11px] text-muted-foreground/70 italic">{alert.ai_disclaimer}</p>
            </>
          )}
        </CardContent>
      </Card>

      {/* BLOCK 4 — DEADLINES */}
      <Card>
        <CardHeader><CardTitle>Plazos procesales</CardTitle></CardHeader>
        <CardContent>
          {alert.opposition_deadline ? (
            <div className={cn('rounded-lg p-4 space-y-3', daysRemaining != null && daysRemaining < 7 ? 'bg-red-50' : 'bg-muted/30')}>
              <p className="text-sm font-semibold text-foreground">
                Vence el {format(new Date(alert.opposition_deadline), "d 'de' MMMM 'de' yyyy", { locale: es })}
              </p>
              {daysRemaining != null && (
                <>
                  <span className={cn(
                    'text-4xl font-bold tabular-nums',
                    daysRemaining < 7 ? 'text-red-600' : daysRemaining < 30 ? 'text-amber-600' : 'text-foreground'
                  )}>
                    {daysRemaining}
                  </span>
                  <span className="text-sm text-muted-foreground ml-2">días restantes</span>
                  <Progress value={Math.max(0, 100 - (daysRemaining / 90) * 100)} className="h-2 mt-2" />
                </>
              )}
            </div>
          ) : (
            <div className="text-center py-6 space-y-1">
              <p className="text-sm text-muted-foreground">Sin plazo inmediato registrado</p>
              <p className="text-xs text-muted-foreground/70">Monitorizar evolución del expediente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ACTION LADDER (SP01-E2) — between Block 4 and Block 5 */}
      <Card>
        <CardHeader><CardTitle>Action Ladder — ¿Qué hacer ahora?</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {allSteps && allSteps.length > 0 ? (
            <>
              <div className="space-y-2">
                {allSteps.map((step: any) => {
                  const isCompleted = step.step_order < currentStepOrder;
                  const isCurrent = step.step_order === currentStepOrder;
                  const isCeaseDesist = step.step_order === 6;
                  const actions: string[] = Array.isArray(step.actions_available) ? step.actions_available : [];

                  return (
                    <div
                      key={step.id}
                      className={cn(
                        'flex items-start gap-3 rounded-lg border p-3 transition-colors',
                        isCurrent && 'bg-violet-50 border-violet-300',
                        isCompleted && 'bg-green-50 border-green-200',
                        !isCurrent && !isCompleted && 'bg-background border-border',
                      )}
                    >
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border-2',
                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-violet-500 border-violet-500 text-white' :
                        'bg-background border-muted-foreground/30 text-muted-foreground'
                      )}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_order}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={cn('text-sm font-semibold', isCurrent ? 'text-violet-700' : 'text-foreground')}>
                            {step.step_name}
                          </span>
                          <Badge variant="outline" className="text-[10px] h-5">{step.assignee_role}</Badge>
                          <span className="text-[10px] text-muted-foreground">SLA: {step.sla_hours}h</span>
                          {isCurrent && <Badge className="text-[10px] bg-violet-100 text-violet-700 border-violet-200 h-5">ACTUAL</Badge>}
                        </div>
                        {isCeaseDesist && !isCurrent && (
                          <div className="flex items-center gap-1 mt-1 text-[10px] text-amber-700">
                            <AlertTriangle className="w-3 h-3" />
                            <span>⚠ Verificar registro válido antes de activar</span>
                          </div>
                        )}
                        {actions.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {actions.map((a, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {nextStep ? (
                <Button
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white"
                  onClick={() => setAdvanceDialogOpen(true)}
                  disabled={advanceMutation.isPending}
                >
                  {advanceMutation.isPending ? 'Avanzando...' : `Avanzar al siguiente nivel →`}
                </Button>
              ) : (
                <Button className="w-full" disabled>Nivel máximo alcanzado</Button>
              )}
            </>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin pasos de workflow definidos</p>
          )}
        </CardContent>
      </Card>

      {/* BLOCK 5 — WORKFLOW */}
      <Card>
        <CardHeader><CardTitle>Estado del proceso</CardTitle></CardHeader>
        <CardContent>
          {allSteps && allSteps.length > 0 ? (
            <div className="space-y-0">
              {allSteps.map((step: any, i: number) => {
                const isCompleted = step.step_order < currentStepOrder;
                const isCurrent = step.step_order === currentStepOrder;
                return (
                  <div key={step.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={cn(
                        'w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold border-2',
                        isCompleted ? 'bg-green-500 border-green-500 text-white' :
                        isCurrent ? 'bg-violet-500 border-violet-500 text-white' :
                        'bg-background border-muted-foreground/30 text-muted-foreground'
                      )}>
                        {isCompleted ? <Check className="w-3.5 h-3.5" /> : step.step_order}
                      </div>
                      {i < allSteps.length - 1 && (
                        <div className={cn('w-0.5 flex-1 min-h-[24px]', isCompleted ? 'bg-green-300' : 'bg-muted')} />
                      )}
                    </div>
                    <div className="pb-4 pt-0.5">
                      <p className={cn('text-sm font-semibold', isCurrent ? 'text-violet-600' : 'text-foreground')}>
                        {step.step_name}
                      </p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Badge variant="outline" className="text-[10px] h-5">{step.assignee_role}</Badge>
                        <span className="text-[10px] text-muted-foreground">SLA: {step.sla_hours}h</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Sin pasos de workflow definidos</p>
          )}
        </CardContent>
      </Card>

      {/* BLOCK 6 — SOURCE & TRACEABILITY */}
      <Card>
        <CardHeader><CardTitle>Fuente y evidencia</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <InfoRow label="Fuente" value={alert.source_code || '—'} />
            <InfoRow label="Tipo de alerta" value={alert.alert_category || '—'} />
            <InfoRow label="Detectada" value={alert.detected_at ? format(new Date(alert.detected_at), "dd/MM/yyyy HH:mm", { locale: es }) : '—'} />
            <InfoRow label="Vista por primera vez" value={alert.viewed_at ? format(new Date(alert.viewed_at), "dd/MM/yyyy HH:mm", { locale: es }) : 'No vista aún'} />
            <InfoRow label="Tipo de evidencia" value={alert.evidence_type || '—'} />
            <div>
              <span className="text-xs text-muted-foreground">Portal cliente</span>
              <div className="flex items-center gap-2">
                <p className="text-sm text-foreground">{alert.portal_visible ? 'Publicada' : 'No publicada'}</p>
                {alert.portal_visible && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 text-[10px] px-2 text-primary"
                    onClick={() => setPortalPreviewOpen(true)}
                  >
                    <Eye className="w-3 h-3 mr-1" /> Previsualizar como cliente →
                  </Button>
                )}
              </div>
            </div>
            {alert.actioned_at && (
              <div className="col-span-2">
                <InfoRow label="Accionada" value={`${format(new Date(alert.actioned_at), "dd/MM/yyyy", { locale: es })} · ${alert.action_taken || ''}`} />
              </div>
            )}
          </div>
          {alert.source_url && (
            <a
              href={alert.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4"
            >
              Ver fuente original <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </CardContent>
      </Card>

      {/* ═══ ADVANCE LEVEL DIALOG ═══ */}
      <Dialog open={advanceDialogOpen} onOpenChange={setAdvanceDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Avanzar a: {nextStep?.step_name}</DialogTitle>
            <DialogDescription>Confirma el avance al siguiente nivel del workflow.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 text-sm">
            <p><strong>Responsable:</strong> {nextStep?.assignee_role}</p>
            <p><strong>SLA:</strong> {nextStep?.sla_hours} horas</p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAdvanceDialogOpen(false)}>Cancelar</Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => nextStep && advanceMutation.mutate(nextStep.id)}
              disabled={advanceMutation.isPending}
            >
              {advanceMutation.isPending ? 'Avanzando...' : 'Confirmar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ═══ DISMISS DIALOG ═══ */}
      <Dialog open={dismissDialogOpen} onOpenChange={setDismissDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Descartar alerta</DialogTitle>
            <DialogDescription>¿Descartar esta alerta? Esta acción marcará la alerta como resuelta.</DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Razón (opcional)"
            value={dismissReason}
            onChange={e => setDismissReason(e.target.value)}
            className="min-h-[60px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDismissDialogOpen(false)}>Cancelar</Button>
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

      {/* ═══ PORTAL PREVIEW DIALOG ═══ */}
      <Dialog open={portalPreviewOpen} onOpenChange={setPortalPreviewOpen}>
        <DialogContent className="max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Vista del portal cliente</DialogTitle>
            <DialogDescription>Así verá el cliente esta alerta</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 border border-border rounded-lg p-4 bg-muted/20">
            <Badge className={cn('text-xs font-bold border', severity.cls)}>
              {severity.portalLabel}
            </Badge>
            <p className="text-xl font-bold text-foreground">{alert.detected_mark_name}</p>
            <p className="text-sm text-muted-foreground">{alert.detected_jurisdiction}</p>
            <div className="space-y-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Análisis del despacho</p>
              <p className="text-sm text-foreground">
                {alert.portal_despacho_analysis || 'El despacho no ha añadido análisis aún'}
              </p>
            </div>
            {alert.ai_recommendation && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Recomendación</p>
                <p className="text-sm text-foreground">{alert.ai_recommendation}</p>
              </div>
            )}
            {alert.action_taken && (
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">¿Qué hacemos?</p>
                <p className="text-sm text-foreground">{alert.action_taken}</p>
              </div>
            )}
          </div>
          <DialogFooter className="flex-col items-stretch gap-2 sm:flex-row sm:items-center">
            <p className="text-[10px] text-muted-foreground/70 italic flex-1">
              Esta es una simulación. El cliente ve su versión white-label.
            </p>
            <Button variant="outline" onClick={() => setPortalPreviewOpen(false)}>Cerrar preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function PriorityBar({ label, value, color, detail }: { label: string; value: number; color: string; detail: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-baseline">
        <span className="text-xs font-semibold text-foreground">{label}</span>
      </div>
      <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)} style={{ width: `${value}%` }} />
      </div>
      <p className="text-[11px] text-muted-foreground">{detail}</p>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="text-sm text-foreground">{value}</p>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="max-w-[900px] mx-auto px-6 py-6 space-y-4">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="h-8 w-72" />
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-48 w-full rounded-xl" />
      ))}
    </div>
  );
}

// ════════════════════════════════════════════
// Logo Comparison (SP02-C)
// ════════════════════════════════════════════

function LogoComparison({ alert, watch, orgId, alertId }: { alert: any; watch: any; orgId: string; alertId: string }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [imgError1, setImgError1] = useState(false);
  const [imgError2, setImgError2] = useState(false);
  const qc = useQueryClient();

  const watchLogo = watch?.mark_image_url;
  const detectedLogo = alert.detected_mark_image_url;
  const visualScore = alert.visual_score;
  const bothLogos = !!watchLogo && !!detectedLogo;

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('trademark-comparison', {
        body: {
          image_url_1: watchLogo,
          image_url_2: detectedLogo,
          watch_id: alert.watch_id,
          alert_id: alertId,
        },
      });
      if (error) throw error;
      const score = data?.visual_score ?? data?.similarity_score ?? 0;
      await fromTable('spider_alerts')
        .update({ visual_score: score })
        .eq('id', alertId)
        .eq('organization_id', orgId);
      qc.invalidateQueries({ queryKey: ['spider-alert-detail'] });
      toast.success(`Análisis visual completado: ${Math.round(score)}%`);
    } catch {
      toast.error('No se pudo analizar. Comprueba que ambos logos sean imágenes accesibles públicamente.');
    } finally {
      setAnalyzing(false);
    }
  };

  const scoreLabel = visualScore >= 85 ? 'Muy alta — posible copia del logotipo'
    : visualScore >= 70 ? 'Alta — elementos visuales similares detectados'
    : visualScore >= 50 ? 'Media — revisar manualmente'
    : 'Baja — diferencias visuales significativas';

  // CASE: no logos at all
  if (!watchLogo && !detectedLogo) return null;

  // CASE: only watch logo
  if (watchLogo && !detectedLogo) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
        {!imgError1 ? (
          <img src={watchLogo} alt="Tu logo" className="w-20 h-20 object-contain rounded-lg border border-border bg-background" onError={() => setImgError1(true)} />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-border bg-muted/40 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/50" /></div>
        )}
        <div>
          <p className="text-sm font-medium text-foreground">Logo del cliente cargado</p>
          <p className="text-xs text-muted-foreground">La marca detectada no tiene imagen en el registro</p>
        </div>
      </div>
    );
  }

  // CASE: only detected logo
  if (!watchLogo && detectedLogo) {
    return (
      <div className="flex items-center gap-4 p-4 rounded-lg border border-border bg-muted/20">
        {!imgError2 ? (
          <img src={detectedLogo} alt="Logo detectado" className="w-20 h-20 object-contain rounded-lg border border-border bg-background" onError={() => setImgError2(true)} />
        ) : (
          <div className="w-20 h-20 rounded-lg border border-border bg-muted/40 flex items-center justify-center"><ImageIcon className="w-6 h-6 text-muted-foreground/50" /></div>
        )}
        <div>
          <p className="text-xs text-muted-foreground">Añade tu logo al watch para activar análisis visual</p>
          <Link to="/app/spider" className="text-xs text-primary hover:underline">→ Configurar watch</Link>
        </div>
      </div>
    );
  }

  // CASE: both logos
  return (
    <div className="rounded-lg border border-border bg-muted/10 p-5 space-y-4">
      <div className="flex items-center justify-center gap-8">
        <div className="text-center space-y-2">
          {!imgError1 ? (
            <img src={watchLogo} alt="Tu logo" className="w-[120px] h-[120px] object-contain rounded-lg border border-border bg-background mx-auto" onError={() => setImgError1(true)} />
          ) : (
            <div className="w-[120px] h-[120px] rounded-lg border border-border bg-muted/40 flex items-center justify-center mx-auto"><ImageIcon className="w-8 h-8 text-muted-foreground/50" /></div>
          )}
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Tu marca</p>
        </div>
        <div className="text-center space-y-2">
          {!imgError2 ? (
            <img src={detectedLogo} alt="Logo detectado" className="w-[120px] h-[120px] object-contain rounded-lg border border-border bg-background mx-auto" onError={() => setImgError2(true)} />
          ) : (
            <div className="w-[120px] h-[120px] rounded-lg border border-border bg-muted/40 flex items-center justify-center mx-auto"><ImageIcon className="w-8 h-8 text-muted-foreground/50" /></div>
          )}
          <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wide">Marca detectada</p>
        </div>
      </div>

      {visualScore > 0 ? (
        <div className="space-y-1.5">
          <p className="text-sm font-bold text-purple-700 text-center">
            Similitud visual: {Math.round(visualScore)}%
          </p>
          <div className="h-2.5 rounded-full bg-muted/60 overflow-hidden">
            <div className="h-full rounded-full bg-purple-500 transition-all" style={{ width: `${Math.round(visualScore)}%` }} />
          </div>
          <p className="text-xs text-muted-foreground text-center">{scoreLabel}</p>
        </div>
      ) : (
        <div className="text-center space-y-2">
          <Button
            variant="outline"
            className="gap-2 border-purple-300 text-purple-700 hover:bg-purple-50"
            onClick={handleAnalyze}
            disabled={analyzing}
          >
            {analyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {analyzing ? 'Analizando logos...' : 'Analizar similitud visual'}
          </Button>
          <p className="text-[10px] text-muted-foreground">Compara los logotipos usando IA visual</p>
        </div>
      )}
    </div>
  );
}
