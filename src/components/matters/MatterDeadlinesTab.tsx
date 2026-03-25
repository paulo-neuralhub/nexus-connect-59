/**
 * MatterDeadlinesTab - Redesigned deadlines tab for matter detail
 */

import { useState, useMemo } from 'react';
import {
  Calendar, Clock, Plus, Check, AlertTriangle, Zap,
  RotateCcw, FileText, Shield, Upload, MessageSquare,
  Settings, ChevronDown, ChevronUp, MoreVertical, Timer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/empty-state';
import { useMatterDeadlines, useCompleteMatterDeadline, useExtendMatterDeadline } from '@/hooks/use-matter-deadlines';
import { useGenerateDeadlines } from '@/hooks/use-generate-deadlines';
import { DeadlineDataModal } from '@/components/features/matters/DeadlineDataModal';
import { useOrganization } from '@/contexts/organization-context';
import { format, isPast, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { AddDeadlineModal } from './AddDeadlineModal';
import { useToast } from '@/hooks/use-toast';
import { CompleteDeadlineModal } from './CompleteDeadlineModal';
import { ExtendDeadlineModal } from './ExtendDeadlineModal';
import type { MatterDeadline } from '@/hooks/use-matter-deadlines';

// ── Type configs ──────────────────────────────────────────
const DEADLINE_TYPE_ICONS: Record<string, React.ReactNode> = {
  renewal: <RotateCcw className="h-4 w-4" />,
  prosecution: <FileText className="h-4 w-4" />,
  opposition: <Shield className="h-4 w-4" />,
  filing: <Upload className="h-4 w-4" />,
  office_action_response: <MessageSquare className="h-4 w-4" />,
  maintenance: <Settings className="h-4 w-4" />,
};

const DEADLINE_TYPE_LABELS: Record<string, string> = {
  prosecution: 'Prosecution',
  renewal: 'Renovación',
  opposition: 'Oposición',
  filing: 'Presentación',
  office_action_response: 'Office Action',
  maintenance: 'Mantenimiento',
  other: 'Otro',
};

const PRIORITY_CONFIG: Record<string, { label: string; bg: string; text: string }> = {
  critical: { label: '● CRÍTICO', bg: 'hsl(0 84% 95%)', text: 'hsl(0 72% 51%)' },
  high: { label: '● ALTO', bg: 'hsl(45 93% 94%)', text: 'hsl(32 95% 44%)' },
  normal: { label: '● NORMAL', bg: 'hsl(210 20% 96%)', text: 'hsl(215 16% 47%)' },
};

// ── Urgency calculator ────────────────────────────────────
function getUrgency(deadline: MatterDeadline) {
  if (deadline.status === 'completed') {
    return { color: '#22C55E', borderColor: '#22C55E', label: '', progress: 0, textClass: 'text-green-600' };
  }
  const days = differenceInDays(new Date(deadline.deadline_date), new Date());
  if (days < 0) {
    return { color: '#EF4444', borderColor: '#EF4444', label: `Venció hace ${Math.abs(days)} días`, progress: 100, textClass: 'text-red-600 font-semibold' };
  }
  if (days === 0) {
    return { color: '#EF4444', borderColor: '#EF4444', label: '⚠️ Vence HOY', progress: 99, textClass: 'text-red-600 font-bold animate-pulse' };
  }
  if (days <= 3) {
    return { color: '#EF4444', borderColor: '#F97316', label: `🔴 En ${days} días`, progress: 92, textClass: 'text-red-600' };
  }
  if (days <= 7) {
    return { color: '#F97316', borderColor: '#F59E0B', label: `⚠️ En ${days} días`, progress: 80, textClass: 'text-orange-600' };
  }
  if (days <= 30) {
    return { color: '#F59E0B', borderColor: '#3B82F6', label: `En ${days} días`, progress: 60, textClass: 'text-amber-600' };
  }
  return { color: '#3B82F6', borderColor: '#3B82F6', label: `En ${days} días`, progress: 30, textClass: 'text-blue-600' };
}

function getBorderColor(deadline: MatterDeadline): string {
  if (deadline.status === 'completed') return '#22C55E';
  const days = differenceInDays(new Date(deadline.deadline_date), new Date());
  if (days < 0) return '#EF4444';
  if (deadline.priority === 'critical') return '#F97316';
  if (deadline.priority === 'high') return '#F59E0B';
  return '#3B82F6';
}

// ── Filter type ───────────────────────────────────────────
type FilterType = 'pending' | 'overdue' | 'completed' | 'all';

// ── Main Component ────────────────────────────────────────
interface MatterDeadlinesTabProps {
  matterId: string;
}

export function MatterDeadlinesTab({ matterId }: MatterDeadlinesTabProps) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filter, setFilter] = useState<FilterType>('pending');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [completeTarget, setCompleteTarget] = useState<MatterDeadline | null>(null);
  const [extendTarget, setExtendTarget] = useState<MatterDeadline | null>(null);
  const { toast } = useToast();
  const { currentOrganization } = useOrganization();

  const { data: deadlines, isLoading } = useMatterDeadlines(matterId);
  const completeDeadline = useCompleteMatterDeadline();
  const extendDeadline = useExtendMatterDeadline();
  const { generate, modalData, closeModal, onModalComplete } = useGenerateDeadlines();

  const handleGenerateDeadlines = () => {
    if (currentOrganization?.id) {
      generate(matterId, currentOrganization.id, 'created');
    }
  };

  // ── Counts ──────────────────────────────────────────────
  const counts = useMemo(() => {
    const all = deadlines || [];
    const pending = all.filter(d => d.status !== 'completed' && !isPast(new Date(d.deadline_date)));
    const overdue = all.filter(d => d.status !== 'completed' && isPast(new Date(d.deadline_date)));
    const completed = all.filter(d => d.status === 'completed');
    return { pending: pending.length, overdue: overdue.length, completed: completed.length, all: all.length };
  }, [deadlines]);

  // ── Filtered & sorted ──────────────────────────────────
  const filtered = useMemo(() => {
    const all = deadlines || [];
    let result: MatterDeadline[];
    switch (filter) {
      case 'pending':
        result = all.filter(d => d.status !== 'completed' && !isPast(new Date(d.deadline_date)));
        break;
      case 'overdue':
        result = all.filter(d => d.status !== 'completed' && isPast(new Date(d.deadline_date)));
        break;
      case 'completed':
        result = all.filter(d => d.status === 'completed');
        break;
      default:
        result = [...all];
    }
    return result.sort((a, b) => {
      if (a.status === 'completed' && b.status !== 'completed') return 1;
      if (a.status !== 'completed' && b.status === 'completed') return -1;
      return new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
    });
  }, [deadlines, filter]);

  const hasAutoGenerated = (deadlines || []).some(d => d.auto_generated);

  // ── Empty state ─────────────────────────────────────────
  if (!isLoading && (!deadlines || deadlines.length === 0)) {
    return (
      <div className="space-y-4">
        <EmptyState
          icon={<Clock className="h-16 w-16" />}
          title="Sin plazos definidos"
          description="Genera los plazos automáticamente desde las reglas del directorio IP o añade uno manualmente."
          action={
            <div className="flex gap-3">
              <Button onClick={handleGenerateDeadlines} variant="default">
                <Zap className="h-4 w-4 mr-2" />
                Generar automáticamente
              </Button>
              <Button onClick={() => setShowAddModal(true)} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Añadir plazo
              </Button>
            </div>
          }
        />
        <AddDeadlineModal open={showAddModal} onOpenChange={setShowAddModal} matterId={matterId} />
        {modalData && (
          <DeadlineDataModal
            open={!!modalData} onOpenChange={(open) => !open && closeModal()}
            officeCode={modalData.officeCode} officeName={modalData.officeName}
            officeId={modalData.officeId} countryCode={modalData.countryCode}
            missingFields={modalData.missingFields} availableData={modalData.availableData}
            geniusSuggestions={modalData.geniusSuggestions} matterId={modalData.matterId}
            organizationId={modalData.organizationId} onComplete={onModalComplete}
          />
        )}
      </div>
    );
  }

  return (
    <div data-copilot="matter-deadlines" className="space-y-4">
      {/* ── Header ───────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-foreground">Plazos</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {counts.pending} pendientes · {counts.overdue > 0 && <span className="text-destructive font-medium">{counts.overdue} vencidos</span>}
            {counts.overdue === 0 && '0 vencidos'}
          </p>
        </div>
        <div className="flex gap-2">
          {!hasAutoGenerated && (
            <Button size="sm" variant="ghost" onClick={handleGenerateDeadlines}>
              <Zap className="h-3.5 w-3.5 mr-1.5" />
              Generar automáticamente
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => setShowAddModal(true)}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Añadir plazo
          </Button>
        </div>
      </div>

      {/* ── Filter pills ─────────────────────────────────── */}
      <div className="flex gap-2">
        {([
          { key: 'pending' as FilterType, label: 'Pendientes', count: counts.pending, variant: 'default' },
          { key: 'overdue' as FilterType, label: 'Vencidos', count: counts.overdue, variant: 'destructive' },
          { key: 'completed' as FilterType, label: 'Completados', count: counts.completed, variant: 'default' },
          { key: 'all' as FilterType, label: 'Todos', count: counts.all, variant: 'default' },
        ]).map(f => (
          <Button
            key={f.key}
            size="sm"
            variant={filter === f.key ? (f.key === 'overdue' ? 'destructive' : 'default') : 'outline'}
            onClick={() => setFilter(f.key)}
            className="text-xs"
          >
            {f.label}
            <span className="ml-1.5 text-[10px] opacity-80">{f.count}</span>
          </Button>
        ))}
      </div>

      {/* ── Deadline list ─────────────────────────────────── */}
      {isLoading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Cargando plazos...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
          {filter === 'overdue' ? 'Sin plazos vencidos' : filter === 'completed' ? 'Sin plazos completados' : 'Sin plazos pendientes'}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(deadline => (
            <DeadlineCard
              key={deadline.id}
              deadline={deadline}
              isExpanded={expandedId === deadline.id}
              onToggleExpand={() => setExpandedId(expandedId === deadline.id ? null : deadline.id)}
              onComplete={() => setCompleteTarget(deadline)}
              onExtend={() => setExtendTarget(deadline)}
            />
          ))}
        </div>
      )}

      {/* ── Modals ────────────────────────────────────────── */}
      <AddDeadlineModal open={showAddModal} onOpenChange={setShowAddModal} matterId={matterId} />

      {completeTarget && (
        <CompleteDeadlineModal
          open={!!completeTarget}
          onOpenChange={(open) => !open && setCompleteTarget(null)}
          deadlineTitle={completeTarget.title}
          onConfirm={async (notes) => {
            await completeDeadline.mutateAsync({ id: completeTarget.id, notes });
            toast({ title: '✅ Plazo completado' });
            setCompleteTarget(null);
          }}
          isPending={completeDeadline.isPending}
        />
      )}

      {extendTarget && (
        <ExtendDeadlineModal
          open={!!extendTarget}
          onOpenChange={(open) => !open && setExtendTarget(null)}
          deadlineTitle={extendTarget.title}
          currentDate={extendTarget.deadline_date}
          extensionCount={extendTarget.extension_count || 0}
          onConfirm={async (newDate, reason) => {
            await extendDeadline.mutateAsync({
              id: extendTarget.id,
              newDate,
              reason,
              currentDate: extendTarget.deadline_date,
              currentExtensionCount: extendTarget.extension_count || 0,
            });
            toast({ title: `⏰ Plazo prorrogado hasta ${format(new Date(newDate), 'dd MMM yyyy', { locale: es })}` });
            setExtendTarget(null);
          }}
          isPending={extendDeadline.isPending}
        />
      )}

      {modalData && (
        <DeadlineDataModal
          open={!!modalData} onOpenChange={(open) => !open && closeModal()}
          officeCode={modalData.officeCode} officeName={modalData.officeName}
          officeId={modalData.officeId} countryCode={modalData.countryCode}
          missingFields={modalData.missingFields} availableData={modalData.availableData}
          geniusSuggestions={modalData.geniusSuggestions} matterId={modalData.matterId}
          organizationId={modalData.organizationId} onComplete={onModalComplete}
        />
      )}
    </div>
  );
}

// ── Deadline Card ─────────────────────────────────────────
function DeadlineCard({
  deadline,
  isExpanded,
  onToggleExpand,
  onComplete,
  onExtend,
}: {
  deadline: MatterDeadline;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onComplete: () => void;
  onExtend: () => void;
}) {
  const isCompleted = deadline.status === 'completed';
  const urgency = getUrgency(deadline);
  const borderColor = getBorderColor(deadline);
  const priority = PRIORITY_CONFIG[deadline.priority || 'normal'] || PRIORITY_CONFIG.normal;
  const typeLabel = DEADLINE_TYPE_LABELS[deadline.deadline_type || 'other'] || deadline.deadline_type || 'Otro';
  const typeIcon = DEADLINE_TYPE_ICONS[deadline.deadline_type || ''] || <Clock className="h-4 w-4" />;
  const canExtend = !isCompleted && (deadline.extension_count || 0) < 3;

  return (
    <div
      className="rounded-xl border bg-card transition-all duration-200 hover:shadow-md"
      style={{
        borderLeftWidth: '4px',
        borderLeftColor: borderColor,
        opacity: isCompleted ? 0.7 : 1,
      }}
    >
      <div className="p-4">
        {/* Row 1: Icon + badges + menu */}
        <div className="flex items-center gap-2 mb-2">
          <span className="text-muted-foreground">{typeIcon}</span>
          <span
            className="text-[10px] font-bold uppercase px-2 py-0.5 rounded"
            style={{ background: priority.bg, color: priority.text }}
          >
            {priority.label}
          </span>
          <span className="text-[10px] uppercase font-medium px-2 py-0.5 rounded bg-muted text-muted-foreground">
            {typeLabel}
          </span>
          {deadline.auto_generated && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Auto</span>
          )}
          {deadline.source === 'manual' && (
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">Manual</span>
          )}
        </div>

        {/* Row 2: Title */}
        <h3 className={`text-[15px] font-semibold text-foreground mb-1 ${isCompleted ? 'line-through opacity-60' : ''}`}>
          {deadline.title}
        </h3>

        {/* Row 3: Description (truncated) */}
        {deadline.description && !isExpanded && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{deadline.description}</p>
        )}

        {/* Row 4: Date + urgency bar */}
        <div className="flex items-center gap-3 mt-2">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {format(new Date(deadline.deadline_date), 'dd MMM yyyy', { locale: es })}
          </span>
          {!isCompleted && (
            <>
              <span className={`text-xs font-medium ${urgency.textClass}`}>{urgency.label}</span>
              <div className="flex-1 max-w-[120px]">
                <Progress value={urgency.progress} stateColor={urgency.color} className="h-[3px]" />
              </div>
            </>
          )}
          {isCompleted && deadline.completed_at && (
            <span className="text-xs text-green-600">
              ✓ Completado el {format(new Date(deadline.completed_at), 'dd MMM yyyy', { locale: es })}
            </span>
          )}
        </div>

        {/* Row 5: Actions */}
        <div className="flex items-center gap-2 mt-3">
          {!isCompleted && (
            <>
              <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onComplete(); }}>
                <Check className="h-3 w-3 mr-1" />
                Completar
              </Button>
              {canExtend && (
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={(e) => { e.stopPropagation(); onExtend(); }}>
                  <Timer className="h-3 w-3 mr-1" />
                  Prorrogar
                </Button>
              )}
            </>
          )}
          <Button
            size="sm" variant="ghost" className="h-7 text-xs ml-auto"
            onClick={onToggleExpand}
          >
            {isExpanded ? <ChevronUp className="h-3 w-3 mr-1" /> : <ChevronDown className="h-3 w-3 mr-1" />}
            {isExpanded ? 'Menos' : 'Ver más'}
          </Button>
        </div>
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="border-t px-4 py-3 bg-muted/30 space-y-2 text-xs text-muted-foreground">
          {deadline.description && (
            <div>
              <span className="font-medium text-foreground">Descripción:</span>
              <p className="mt-0.5">{deadline.description}</p>
            </div>
          )}
          {deadline.rule_code && (
            <div><span className="font-medium text-foreground">Regla:</span> {deadline.rule_code}</div>
          )}
          {(deadline.extension_count || 0) > 0 && (
            <div>
              <span className="font-medium text-foreground">Prórrogas:</span> {deadline.extension_count}
              {deadline.extension_reason && <span> — {deadline.extension_reason}</span>}
              {deadline.original_deadline && (
                <span className="ml-2 opacity-70">(Original: {format(new Date(deadline.original_deadline), 'dd MMM yyyy', { locale: es })})</span>
              )}
            </div>
          )}
          {deadline.completion_notes && (
            <div><span className="font-medium text-foreground">Notas:</span> {deadline.completion_notes}</div>
          )}
          {deadline.metadata && (
            <div>
              <span className="font-medium text-foreground">Metadata:</span>
              {deadline.metadata.office_code && <span className="ml-1">Oficina: {deadline.metadata.office_code}</span>}
              {deadline.metadata.office_timezone && <span className="ml-2">TZ: {deadline.metadata.office_timezone}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
