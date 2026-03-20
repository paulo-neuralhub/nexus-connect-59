/**
 * MatterPhaseTimeline - Horizontal phase pipeline by matter type
 * Shows progress through IP lifecycle phases
 */

import { Check } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Phase definitions by matter type
const TRADEMARK_PHASES = [
  { key: 'filing', label: 'Solicitud', statuses: ['draft', 'pending', 'filing'] },
  { key: 'examining', label: 'Examen', statuses: ['filed', 'examining'] },
  { key: 'published', label: 'Publicación', statuses: ['published'] },
  { key: 'opposition', label: 'Oposición', statuses: ['opposed'] },
  { key: 'registered', label: 'Registro', statuses: ['registered', 'granted', 'active'] },
  { key: 'renewal', label: 'Renovación', statuses: ['renewal'] },
  { key: 'expired', label: 'Caducidad', statuses: ['expired', 'abandoned', 'cancelled'] },
];

const PATENT_PHASES = [
  { key: 'filing', label: 'Solicitud', statuses: ['draft', 'pending', 'filing'] },
  { key: 'search', label: 'Búsqueda', statuses: ['filed'] },
  { key: 'examining', label: 'Examen', statuses: ['examining'] },
  { key: 'grant', label: 'Concesión', statuses: ['granted', 'published'] },
  { key: 'validation', label: 'Validación', statuses: ['registered', 'active'] },
  { key: 'annuities', label: 'Anualidades', statuses: ['renewal'] },
];

const DESIGN_PHASES = [
  { key: 'filing', label: 'Solicitud', statuses: ['draft', 'pending', 'filing'] },
  { key: 'examining', label: 'Examen', statuses: ['filed', 'examining', 'published'] },
  { key: 'registered', label: 'Registro', statuses: ['registered', 'granted', 'active'] },
  { key: 'renewal', label: 'Renovación', statuses: ['renewal', 'expired'] },
];

const DEFAULT_PHASES = [
  { key: 'draft', label: 'Inicio', statuses: ['draft', 'pending'] },
  { key: 'active', label: 'Activo', statuses: ['filed', 'filing', 'examining', 'published', 'active'] },
  { key: 'registered', label: 'Registrado', statuses: ['registered', 'granted'] },
  { key: 'closed', label: 'Cerrado', statuses: ['expired', 'abandoned', 'cancelled', 'archived'] },
];

function getPhasesForType(matterType: string) {
  const t = matterType?.toLowerCase() || '';
  if (t.startsWith('tm') || t === 'trademark' || t === 'nc' || t === 'trade_name') return TRADEMARK_PHASES;
  if (t.startsWith('pt') || t === 'patent' || t === 'um' || t === 'utility_model') return PATENT_PHASES;
  if (t.startsWith('ds') || t === 'design') return DESIGN_PHASES;
  return DEFAULT_PHASES;
}

function getActivePhaseIndex(phases: typeof TRADEMARK_PHASES, status: string): number {
  const s = status?.toLowerCase() || 'draft';
  for (let i = phases.length - 1; i >= 0; i--) {
    if (phases[i].statuses.includes(s)) return i;
  }
  return 0;
}

interface MatterPhaseTimelineProps {
  matterType: string;
  status: string;
  dates?: Record<string, string | null>;
  className?: string;
}

export function MatterPhaseTimeline({ matterType, status, dates, className }: MatterPhaseTimelineProps) {
  const phases = getPhasesForType(matterType);
  const activeIndex = getActivePhaseIndex(phases, status);

  return (
    <div className={cn("flex items-center w-full gap-0", className)}>
      {phases.map((phase, i) => {
        const isCompleted = i < activeIndex;
        const isActive = i === activeIndex;
        const isFuture = i > activeIndex;
        const dateVal = dates?.[phase.key];

        return (
          <div key={phase.key} className="flex items-center flex-1 last:flex-none">
            {/* Node */}
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex flex-col items-center gap-1.5 cursor-default">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0",
                      isCompleted && "bg-emerald-500 text-white",
                      isActive && "bg-blue-600 text-white ring-4 ring-blue-600/20",
                      isFuture && "border-2 border-slate-300 bg-white text-slate-400"
                    )}
                  >
                    {isCompleted ? <Check className="h-4 w-4" /> : i + 1}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-medium whitespace-nowrap",
                      isCompleted && "text-emerald-600",
                      isActive && "text-blue-700 font-semibold",
                      isFuture && "text-slate-400"
                    )}
                  >
                    {phase.label}
                  </span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="font-medium">{phase.label}</p>
                {dateVal && <p className="text-xs text-muted-foreground">{dateVal}</p>}
                {isCompleted && <p className="text-xs text-emerald-500">✓ Completada</p>}
                {isActive && <p className="text-xs text-blue-500">● Fase actual</p>}
              </TooltipContent>
            </Tooltip>

            {/* Connector line */}
            {i < phases.length - 1 && (
              <div className="flex-1 h-0.5 mx-1.5 min-w-[20px]">
                <div
                  className={cn(
                    "h-full rounded-full transition-all",
                    i < activeIndex ? "bg-emerald-400" : "bg-slate-200"
                  )}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
