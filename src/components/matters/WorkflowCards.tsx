// ============================================================
// IP-NEXUS - Workflow Cards (SILK Design System)
// Phase bars with neumorphic badges - line-defined style
// ============================================================

import { useState, useRef } from 'react';
import { format, differenceInDays } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Check,
  Circle,
  ChevronRight,
  ChevronLeft,
  Clock,
  AlertCircle,
  Zap,
  History,
  ListTodo,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { NeoBadge } from '@/components/ui/neo-badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { AdvancePhaseModal } from './AdvancePhaseModal';

// Configuración de fases
const PHASES_CONFIG = [
  { key: 'F0', label: 'Apertura', description: 'Recepción y registro del expediente' },
  { key: 'F1', label: 'Análisis', description: 'Estudio de viabilidad y búsqueda de anterioridades' },
  { key: 'F2', label: 'Presupuesto', description: 'Elaboración y envío de presupuesto al cliente' },
  { key: 'F3', label: 'Contratación', description: 'Aceptación y formalización del encargo' },
  { key: 'F4', label: 'Preparación', description: 'Preparación de documentación para presentación' },
  { key: 'F5', label: 'Presentación', description: 'Presentación ante la oficina correspondiente' },
  { key: 'F6', label: 'Examen', description: 'Examen de forma y fondo por la oficina' },
  { key: 'F7', label: 'Publicación', description: 'Publicación en boletín oficial' },
  { key: 'F8', label: 'Resolución', description: 'Resolución final de concesión o denegación' },
  { key: 'F9', label: 'Seguimiento', description: 'Mantenimiento y renovaciones' },
];

interface PhaseHistoryEntry {
  phase: string;
  enteredAt: string;
  completedAt?: string;
}

interface WorkflowCardsProps {
  currentPhase: string;
  phaseHistory?: PhaseHistoryEntry[];
  expedienteId: string;
  matterReference?: string;
  tasksPerPhase?: Record<string, number>;
  phaseEnteredAt?: string;
  typeColor?: string;
  onAdvancePhase?: () => void;
  onPhaseClick?: (phase: string) => void;
}

export function WorkflowCards({
  currentPhase,
  phaseHistory = [],
  expedienteId,
  matterReference = '',
  tasksPerPhase = {},
  phaseEnteredAt,
  typeColor = 'text-blue-600',
  onAdvancePhase,
  onPhaseClick
}: WorkflowCardsProps) {
  const [showAdvanceModal, setShowAdvanceModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  
  const currentIndex = PHASES_CONFIG.findIndex(f => f.key === currentPhase);
  const progressPercent = Math.round(((currentIndex + 1) / PHASES_CONFIG.length) * 100);
  
  // Calcular tiempo en fase actual
  const daysInCurrentPhase = phaseEnteredAt 
    ? differenceInDays(new Date(), new Date(phaseEnteredAt))
    : 0;

  // Obtener estado de cada fase
  const getPhaseStatus = (index: number): 'completed' | 'current' | 'pending' => {
    if (index < currentIndex) return 'completed';
    if (index === currentIndex) return 'current';
    return 'pending';
  };

  // Obtener tiempo en una fase completada
  const getPhaseTime = (phaseKey: string): number | null => {
    const entry = phaseHistory.find(h => h.phase === phaseKey && h.completedAt);
    if (!entry) return null;
    return differenceInDays(new Date(entry.completedAt!), new Date(entry.enteredAt));
  };

  // Get type color for current phase (SILK palette)
  const getTypeColor = (): string => {
    // Extract color from typeColor prop or default
    if (typeColor.includes('blue')) return '#00b4d8';
    if (typeColor.includes('purple')) return '#8b5cf6';
    if (typeColor.includes('rose') || typeColor.includes('pink')) return '#ec4899';
    if (typeColor.includes('green') || typeColor.includes('emerald')) return '#10b981';
    if (typeColor.includes('amber') || typeColor.includes('orange')) return '#f59e0b';
    return '#00b4d8'; // default cyan
  };

  const accentColor = getTypeColor();

  return (
    <div 
      style={{
        padding: '16px',
        borderRadius: '14px',
        border: '1px solid rgba(0, 0, 0, 0.06)',
        background: '#f1f4f9',
      }}
    >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4" style={{ color: accentColor }} />
            <span style={{ fontSize: '13px', fontWeight: 600, color: '#0a2540' }}>
              Progreso del Expediente
            </span>
          </div>
          <span 
            style={{ 
              fontSize: '11px', 
              fontWeight: 600, 
              color: accentColor,
              padding: '4px 10px',
              borderRadius: '8px',
              background: `${accentColor}0a`
            }}
          >
            {progressPercent}% completado
          </span>
        </div>

        {/* SILK Phase Bars */}
        <div className="flex gap-2 mb-4">
          {PHASES_CONFIG.map((phase, index) => {
            const status = getPhaseStatus(index);
            const isCompleted = status === 'completed';
            const isCurrent = status === 'current';
            const isPending = status === 'pending';
            const pendingTasks = tasksPerPhase[phase.key] || 0;

            return (
              <Tooltip key={phase.key}>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => onPhaseClick?.(phase.key)}
                    className="flex-1 relative cursor-pointer transition-all duration-300"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '12px',
                      background: isCompleted 
                        ? `${accentColor}0e` 
                        : isCurrent 
                          ? `linear-gradient(135deg, ${accentColor}, ${accentColor}88)`
                          : 'rgba(0, 0, 0, 0.02)',
                      color: isCurrent ? '#ffffff' : isCompleted ? accentColor : '#d0d5dd',
                      boxShadow: isCurrent ? `0 3px 8px ${accentColor}30` : 'none',
                      textAlign: 'center',
                      minWidth: '60px',
                    }}
                  >
                    {/* Phase code */}
                    <div style={{ 
                      fontSize: '11px', 
                      fontWeight: 600, 
                      marginBottom: '2px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}>
                      {phase.key}
                      {isCompleted && <Check className="h-3 w-3" />}
                    </div>
                    
                    {/* Phase name */}
                    <div style={{ 
                      fontSize: '9px', 
                      opacity: 0.8,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis'
                    }}>
                      {phase.label}
                    </div>
                    
                    {/* Neumorphic badge for current phase */}
                    {isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: -14,
                        left: '50%',
                        transform: 'translateX(-50%)'
                      }}>
                        <NeoBadge 
                          value={phase.key} 
                          color={accentColor} 
                          size="sm" 
                        />
                      </div>
                    )}
                    
                    {/* Task count badge */}
                    {pendingTasks > 0 && isCurrent && (
                      <div style={{
                        position: 'absolute',
                        top: -6,
                        right: -6,
                        background: '#ef4444',
                        color: 'white',
                        fontSize: '9px',
                        fontWeight: 700,
                        padding: '2px 5px',
                        borderRadius: '6px',
                        minWidth: '16px'
                      }}>
                        {pendingTasks}
                      </div>
                    )}
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom" className="max-w-xs">
                  <p className="font-semibold">{phase.key}: {phase.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{phase.description}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        {/* Current phase info bar */}
        <div 
          style={{
            padding: '12px 14px',
            borderRadius: '10px',
            background: 'rgba(255, 255, 255, 0.6)',
            border: '1px solid rgba(0, 0, 0, 0.04)'
          }}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div 
                style={{ 
                  width: '36px', 
                  height: '36px',
                  borderRadius: '10px',
                  background: `${accentColor}12`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Circle className="h-4 w-4" style={{ color: accentColor, fill: accentColor }} />
              </div>

              <div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#0a2540', marginBottom: '2px' }}>
                  {PHASES_CONFIG[currentIndex]?.label} ({currentPhase})
                </div>
                <div className="flex items-center gap-3" style={{ fontSize: '11px', color: '#64748b' }}>
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {daysInCurrentPhase}d en fase
                  </span>
                  <span className="flex items-center gap-1">
                    <ListTodo className="h-3 w-3" />
                    {tasksPerPhase[currentPhase] || 0} tareas
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowHistoryModal(true)}
                style={{ fontSize: '11px', color: '#64748b' }}
              >
                <History className="h-3.5 w-3.5 mr-1.5" />
                Historial
              </Button>

              {currentIndex < PHASES_CONFIG.length - 1 && (
                <Button 
                  size="sm" 
                  onClick={() => setShowAdvanceModal(true)}
                  style={{
                    background: `linear-gradient(135deg, ${accentColor}, ${accentColor}cc)`,
                    color: 'white',
                    border: 'none',
                    fontSize: '11px',
                    fontWeight: 600,
                    boxShadow: `0 2px 8px ${accentColor}30`
                  }}
                >
                  <ArrowRight className="h-3.5 w-3.5 mr-1.5" />
                  Avanzar a {PHASES_CONFIG[currentIndex + 1]?.key}
                </Button>
              )}
            </div>
          </div>
        </div>

      {/* History Modal */}
      <Dialog open={showHistoryModal} onOpenChange={setShowHistoryModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Historial de Fases</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {phaseHistory.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Sin historial de cambios de fase
              </p>
            ) : (
              phaseHistory.map((entry, index) => (
                <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <Badge variant="outline" className="font-mono">
                      {entry.phase}
                    </Badge>
                    <div>
                      <p className="text-sm font-medium">
                        {PHASES_CONFIG.find(f => f.key === entry.phase)?.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(entry.enteredAt), "d MMM yyyy", { locale: es })}
                        {entry.completedAt && (
                          <> → {format(new Date(entry.completedAt), "d MMM yyyy", { locale: es })}</>
                        )}
                      </p>
                    </div>
                  </div>
                  {entry.completedAt ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Circle className="h-4 w-4 fill-current animate-pulse" style={{ color: accentColor }} />
                  )}
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal de avance de fase */}
      <AdvancePhaseModal
        isOpen={showAdvanceModal}
        onClose={() => setShowAdvanceModal(false)}
        matterId={expedienteId}
        matterReference={matterReference}
        currentPhase={currentPhase}
        onSuccess={(newPhase) => {
          // Trigger the phase panel for the new phase
          onPhaseClick?.(newPhase);
        }}
      />
    </div>
  );
}
