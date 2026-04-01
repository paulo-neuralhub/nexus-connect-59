// ============================================================
// Plazos — Renovaciones Tab
// Filtered view for renewal deadlines with decision workflow
// ============================================================

import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { RefreshCw, Bot, Send } from 'lucide-react';
import type { MatterDeadline } from '@/hooks/useDeadlines';
import { getUrgencyLevel, URGENCY_COLORS } from './plazos-utils';

interface PlazosRenovacionesTabProps {
  deadlines: MatterDeadline[];
  isLoading: boolean;
}

export function PlazosRenovacionesTab({ deadlines, isLoading }: PlazosRenovacionesTabProps) {
  const [selectedDeadline, setSelectedDeadline] = useState<MatterDeadline | null>(null);
  const [decision, setDecision] = useState<'renovar' | 'abandonar' | ''>('');
  const [notes, setNotes] = useState('');

  const renewals = useMemo(() =>
    deadlines.filter(d =>
      d.deadline_type === 'renewal' ||
      d.deadline_type === 'maintenance_fee'
    ).sort((a, b) => new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime()),
    [deadlines]
  );

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (renewals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <RefreshCw className="h-10 w-10 text-muted-foreground/40 mb-3" />
        <p className="text-lg font-medium text-foreground">Sin renovaciones pendientes</p>
        <p className="text-sm text-muted-foreground">No hay plazos de renovación activos.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Urgencia</TableHead>
              <TableHead>Marca / Patente</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead className="hidden md:table-cell">Jurisdicción</TableHead>
              <TableHead>Vencimiento</TableHead>
              <TableHead>Días</TableHead>
              <TableHead>Estado Decisión</TableHead>
              <TableHead className="text-right">Acción</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {renewals.map(d => {
              const days = differenceInDays(new Date(d.deadline_date), new Date());
              const urgency = getUrgencyLevel(days);
              const isOverdue = days < 0;

              return (
                <TableRow key={d.id} className={cn(isOverdue && "bg-destructive/5")}>
                  <TableCell>
                    <span
                      className={cn("h-3 w-3 rounded-full block mx-auto", isOverdue && "animate-pulse")}
                      style={{ backgroundColor: URGENCY_COLORS[urgency] }}
                    />
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate">{d.title}</p>
                  </TableCell>
                  <TableCell>
                    {d.matter ? (
                      <Link
                        to={`/app/expedientes/${d.matter.id}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {d.matter.reference || d.matter.title}
                      </Link>
                    ) : '—'}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <span className="text-xs text-muted-foreground">
                      {d.matter?.jurisdiction || '—'}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {format(new Date(d.deadline_date), 'd MMM yyyy', { locale: es })}
                    </span>
                  </TableCell>
                  <TableCell>
                    {isOverdue ? (
                      <span className="text-xs font-bold text-destructive">Vencido</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">{days}d</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">Pendiente</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedDeadline(d);
                        setDecision('');
                        setNotes('');
                      }}
                    >
                      Decidir
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>

      {/* Decision Sheet */}
      <Sheet open={!!selectedDeadline} onOpenChange={open => !open && setSelectedDeadline(null)}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Decisión de Renovación</SheetTitle>
            <SheetDescription>{selectedDeadline?.title}</SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-6">
            {/* GENIUS recommendation placeholder */}
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 text-amber-700">
                <Bot className="h-4 w-4" />
                <span className="text-xs font-semibold">Recomendación GENIUS</span>
              </div>
              <p className="text-sm text-amber-800">
                Análisis de uso y valor comercial no disponible sin suscripción a IP-GENIUS.
              </p>
              <p className="text-[10px] text-amber-600 mt-1">
                🤖 Generado por IA — revisión profesional requerida
              </p>
            </div>

            {/* Decision buttons */}
            <div className="space-y-2">
              <p className="text-sm font-medium">Recomendación:</p>
              <div className="flex gap-2">
                <Button
                  variant={decision === 'renovar' ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setDecision('renovar')}
                >
                  ✅ Renovar
                </Button>
                <Button
                  variant={decision === 'abandonar' ? 'destructive' : 'outline'}
                  className="flex-1"
                  onClick={() => setDecision('abandonar')}
                >
                  ❌ Abandonar
                </Button>
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notas / Justificación</label>
              <Textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Añade notas sobre la decisión..."
                rows={3}
              />
            </div>

            {/* Submit to approvals */}
            <Button
              className="w-full gap-2"
              disabled={!decision}
              onClick={() => {
                // TODO: integrate with approvals workflow
                setSelectedDeadline(null);
              }}
            >
              <Send className="h-4 w-4" />
              Enviar a Aprobaciones
            </Button>

            <p className="text-[10px] text-muted-foreground text-center">
              Renovar / Abandonar son recomendaciones que requieren confirmación del abogado responsable.
            </p>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
