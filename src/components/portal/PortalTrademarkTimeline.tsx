/**
 * PortalTrademarkTimeline — Visual progress for each portal-visible matter
 * Shows simplified phase steps for clients
 */

import { cn } from '@/lib/utils';
import { Check, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';

interface PortalMatter {
  id: string;
  title: string;
  reference: string;
  status: string;
  type: string;
  jurisdiction?: string;
}

interface PortalTrademarkTimelineProps {
  matters: PortalMatter[];
  slug: string;
}

const PHASES = [
  { key: 'filing', label: 'Solicitud', description: 'Tu marca ha sido presentada' },
  { key: 'examining', label: 'Examen', description: 'La oficina está revisando tu marca' },
  { key: 'published', label: 'Publicación', description: 'Período de oposición abierto' },
  { key: 'opposition', label: 'Oposición', description: 'Se evalúan posibles oposiciones' },
  { key: 'registered', label: 'Registrada', description: '¡Tu marca está protegida!' },
];

const STATUS_TO_PHASE: Record<string, number> = {
  draft: 0,
  pending: 0,
  filing: 0,
  filed: 1,
  examining: 1,
  published: 2,
  opposed: 3,
  opposition_period: 3,
  registered: 4,
  granted: 4,
  active: 4,
};

const CLIENT_STATUS_LABELS: Record<string, string> = {
  draft: 'En preparación',
  pending: 'En tramitación',
  filing: 'En tramitación',
  filed: 'En tramitación',
  examining: 'En examen',
  published: 'Publicada — período de oposición',
  opposed: 'En fase de oposición',
  registered: '✓ Registrada',
  granted: '✓ Registrada',
  active: '✓ Registrada',
  expired: 'Expirada',
  abandoned: 'Abandonada',
  cancelled: 'Cancelada',
};

function getPhaseIndex(status: string): number {
  return STATUS_TO_PHASE[status?.toLowerCase()] ?? 0;
}

function getProgressPct(status: string): number {
  const map: Record<string, number> = {
    draft: 5, pending: 10, filing: 10, filed: 15,
    examining: 50, published: 70, opposed: 85,
    opposition_period: 85, registered: 100, granted: 100, active: 100,
  };
  return map[status?.toLowerCase()] ?? 5;
}

export function PortalTrademarkTimeline({ matters, slug }: PortalTrademarkTimelineProps) {
  if (!matters || matters.length === 0) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">📋 Estado de tus marcas</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {matters.map((matter) => {
          const phaseIdx = getPhaseIndex(matter.status);
          const pct = getProgressPct(matter.status);
          const clientLabel = CLIENT_STATUS_LABELS[matter.status?.toLowerCase()] || matter.status;

          return (
            <Link
              key={matter.id}
              to={`/portal/${slug}/matters/${matter.id}`}
              className="block p-4 rounded-xl border hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold">{matter.title}</p>
                  <p className="text-xs text-muted-foreground">{matter.reference} {matter.jurisdiction && `• ${matter.jurisdiction}`}</p>
                </div>
                <Badge
                  variant="outline"
                  className={cn(
                    pct >= 100
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  )}
                >
                  {clientLabel}
                </Badge>
              </div>

              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-muted mb-4">
                <div
                  className={cn(
                    'h-full rounded-full transition-all duration-700',
                    pct >= 100 ? 'bg-emerald-500' : 'bg-blue-500'
                  )}
                  style={{ width: `${pct}%` }}
                />
              </div>

              {/* Phase steps */}
              <div className="flex items-center justify-between">
                {PHASES.map((phase, i) => {
                  const isCompleted = i < phaseIdx;
                  const isActive = i === phaseIdx;
                  const isFuture = i > phaseIdx;

                  return (
                    <div key={phase.key} className="flex flex-col items-center gap-1 flex-1">
                      <div
                        className={cn(
                          'w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                          isCompleted && 'bg-emerald-500 text-white',
                          isActive && 'bg-blue-600 text-white ring-3 ring-blue-600/20',
                          isFuture && 'border-2 border-muted-foreground/20 bg-background text-muted-foreground/40'
                        )}
                      >
                        {isCompleted ? (
                          <Check className="h-3.5 w-3.5" />
                        ) : isActive ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <span className="text-[10px]">○</span>
                        )}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-medium text-center leading-tight',
                          isCompleted && 'text-emerald-600',
                          isActive && 'text-blue-700 font-semibold',
                          isFuture && 'text-muted-foreground/40'
                        )}
                      >
                        {phase.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
