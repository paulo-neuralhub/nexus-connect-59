/**
 * Spider Alerts Tab — expandable cards with 3 internal tabs
 */
import { useState } from 'react';
import { ChevronDown, ChevronRight, ExternalLink, FileText, Link2, Bell, Clock, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useSpiderAlerts, useUpdateSpiderAlert } from '@/hooks/use-spider-data';
import { toast } from 'sonner';

function getScoreColor(score: number): string {
  if (score >= 80) return '#EF4444';
  if (score >= 60) return '#F97316';
  if (score >= 40) return '#F59E0B';
  return '#22C55E';
}

function getSeverityConfig(s: string) {
  switch (s) {
    case 'critical': return { label: 'Crítica', color: '#EF4444' };
    case 'high': return { label: 'Alta', color: '#F97316' };
    case 'medium': return { label: 'Media', color: '#F59E0B' };
    default: return { label: 'Baja', color: '#22C55E' };
  }
}

export function SpiderAlertsTab() {
  const { data: alerts, isLoading } = useSpiderAlerts({ status: 'new' });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-24 rounded-xl bg-muted animate-pulse" />)}</div>;
  }

  if (!alerts?.length) {
    return (
      <div className="text-center py-16 text-muted-foreground">
        <Bell className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p className="font-medium">Sin alertas pendientes</p>
        <p className="text-sm mt-1">Las alertas aparecerán aquí cuando se detecten conflictos</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert: any) => (
        <AlertCard
          key={alert.id}
          alert={alert}
          isExpanded={expandedId === alert.id}
          onToggle={() => setExpandedId(expandedId === alert.id ? null : alert.id)}
        />
      ))}
    </div>
  );
}

function AlertCard({ alert, isExpanded, onToggle }: { alert: any; isExpanded: boolean; onToggle: () => void }) {
  const [internalTab, setInternalTab] = useState<'analysis' | 'application' | 'actions'>('analysis');
  const severity = getSeverityConfig(alert.severity);
  const score = alert.combined_score || alert.phonetic_score || 0;
  const scoreColor = getScoreColor(score);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header — always visible */}
      <button onClick={onToggle} className="w-full p-4 flex items-center gap-3 text-left hover:bg-muted/30 transition-colors">
        {isExpanded ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground truncate">{alert.detected_mark_name || alert.title}</span>
            <Badge variant="outline" className="text-[10px] shrink-0" style={{ borderColor: severity.color, color: severity.color }}>
              {severity.label}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 truncate">
            {alert.watch?.watch_name && `vs ${alert.watch.watch_name}`}
            {alert.detected_jurisdiction && ` · ${alert.detected_jurisdiction}`}
          </p>
        </div>
        {/* Score pill */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-16">
            <Progress value={score} stateColor={scoreColor} className="h-1.5" />
          </div>
          <span className="text-xs font-bold" style={{ color: scoreColor }}>{score}%</span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="border-t border-border">
          {/* Internal tabs */}
          <div className="flex border-b border-border bg-muted/20">
            {(['analysis', 'application', 'actions'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setInternalTab(tab)}
                className={`flex-1 py-2.5 text-xs font-medium transition-colors ${
                  internalTab === tab
                    ? 'text-foreground border-b-2 border-primary'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'analysis' ? '📊 Análisis' : tab === 'application' ? '📋 Solicitud' : '⚡ Acciones'}
              </button>
            ))}
          </div>

          <div className="p-4">
            {internalTab === 'analysis' && <AnalysisPane alert={alert} />}
            {internalTab === 'application' && <ApplicationPane alert={alert} />}
            {internalTab === 'actions' && <ActionsPane alert={alert} />}
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisPane({ alert }: { alert: any }) {
  const phoneticScore = alert.phonetic_score || 0;
  const semanticScore = alert.semantic_score || 0;
  const visualScore = alert.visual_score;
  const combinedScore = alert.combined_score || 0;

  return (
    <div className="space-y-4">
      {/* Score bars */}
      <div className="space-y-3">
        <ScoreRow label="Fonético" score={phoneticScore} />
        <ScoreRow label="Semántico" score={semanticScore} />
        {visualScore != null && <ScoreRow label="Visual" score={visualScore} />}
        <div className="pt-2 border-t border-border">
          <ScoreRow label="Combinado" score={combinedScore} bold />
        </div>
      </div>

      {/* AI recommendation */}
      {alert.ai_recommendation && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold text-foreground">Análisis IA</p>
          <p className="text-xs text-muted-foreground leading-relaxed">{alert.ai_recommendation}</p>
          <p className="text-[10px] text-muted-foreground/60 italic">
            ⚠️ Análisis orientativo. No constituye asesoramiento legal.
          </p>
        </div>
      )}
    </div>
  );
}

function ScoreRow({ label, score, bold }: { label: string; score: number; bold?: boolean }) {
  const color = getScoreColor(score);
  return (
    <div className="flex items-center gap-3">
      <span className={`text-xs w-20 ${bold ? 'font-semibold text-foreground' : 'text-muted-foreground'}`}>{label}</span>
      <div className="flex-1">
        <Progress value={score} stateColor={color} className={bold ? 'h-2' : 'h-1.5'} />
      </div>
      <span className="text-xs font-semibold w-10 text-right" style={{ color }}>{score}%</span>
    </div>
  );
}

function ApplicationPane({ alert }: { alert: any }) {
  return (
    <div className="space-y-3">
      <InfoRow label="Marca detectada" value={alert.detected_mark_name || '—'} />
      <InfoRow label="Solicitante" value={alert.detected_applicant || '—'} />
      <InfoRow label="Nº solicitud" value={alert.detected_application_number || '—'} />
      <InfoRow label="Jurisdicción" value={alert.detected_jurisdiction || '—'} />
      <InfoRow label="Clases Niza" value={alert.detected_classes?.join(', ') || '—'} />
      <InfoRow label="Fecha solicitud" value={alert.detected_filing_date || '—'} />
      <InfoRow label="Fecha detección" value={alert.detected_at ? new Date(alert.detected_at).toLocaleDateString('es-ES') : '—'} />
      {alert.opposition_deadline_date && (
        <InfoRow label="Plazo oposición" value={new Date(alert.opposition_deadline_date).toLocaleDateString('es-ES')} highlight />
      )}
      {alert.source_url && (
        <a href={alert.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
          <ExternalLink className="w-3 h-3" /> Ver en oficina
        </a>
      )}
    </div>
  );
}

function InfoRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="text-xs text-muted-foreground w-28 shrink-0">{label}</span>
      <span className={`text-xs font-medium ${highlight ? 'text-[#EF4444]' : 'text-foreground'}`}>{value}</span>
    </div>
  );
}

function ActionsPane({ alert }: { alert: any }) {
  const updateAlert = useUpdateSpiderAlert();
  const [showFPDialog, setShowFPDialog] = useState(false);
  const [fpReason, setFpReason] = useState('');

  const handleAction = async (action: string, updates: Record<string, any>) => {
    try {
      await updateAlert.mutateAsync({ id: alert.id, ...updates });
      toast.success(action);
    } catch {
      toast.error('Error al procesar acción');
    }
  };

  const handleFalsePositive = async () => {
    if (!fpReason.trim()) {
      toast.error('La razón es obligatoria');
      return;
    }
    await handleAction('Marcado como falso positivo', {
      status: 'false_positive',
      false_positive_reason: fpReason,
      reviewed_at: new Date().toISOString(),
    });
    setShowFPDialog(false);
  };

  return (
    <div className="space-y-2">
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => toast.info('Funcionalidad disponible próximamente')}>
        <FileText className="w-4 h-4" /> Crear expediente de oposición
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => toast.info('Funcionalidad disponible próximamente')}>
        <Link2 className="w-4 h-4" /> Vincular a deal CRM
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => toast.info('Funcionalidad disponible próximamente')}>
        <Bell className="w-4 h-4" /> Notificar al cliente
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2" onClick={() => handleAction('Pospuesto 30 días', { snoozed_until: new Date(Date.now() + 30 * 86400000).toISOString() })}>
        <Clock className="w-4 h-4" /> Posponer 30 días
      </Button>
      <Button variant="outline" size="sm" className="w-full justify-start gap-2 text-destructive hover:text-destructive" onClick={() => setShowFPDialog(true)}>
        <XCircle className="w-4 h-4" /> Marcar falso positivo
      </Button>

      <Dialog open={showFPDialog} onOpenChange={setShowFPDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Confirmar falso positivo
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              ¿Estás seguro? Esta alerta dejará de aparecer en la lista de pendientes.
            </p>
            <Textarea
              placeholder="Razón obligatoria: ¿por qué es falso positivo?"
              value={fpReason}
              onChange={e => setFpReason(e.target.value)}
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFPDialog(false)}>Cancelar</Button>
            <Button variant="destructive" onClick={handleFalsePositive} disabled={updateAlert.isPending}>
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
