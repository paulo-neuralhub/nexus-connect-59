// ============================================
// Modal centrado de detalle de evento
// ============================================

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  MapPin,
  FileText,
  Building2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Users,
  Phone,
  Bell,
  Pencil,
  Trash2,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

const TYPE_CONFIG: Record<
  CalendarEvent['type'],
  { label: string; bg: string; text: string; border: string; icon: React.ElementType }
> = {
  deadline_fatal: { label: 'Plazo FATAL', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: AlertTriangle },
  deadline: { label: 'Plazo', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-200', icon: Calendar },
  renewal: { label: 'Renovación', bg: 'bg-purple-50', text: 'text-purple-600', border: 'border-purple-200', icon: RefreshCw },
  task: { label: 'Tarea', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: CheckSquare },
  meeting: { label: 'Reunión', bg: 'bg-violet-50', text: 'text-violet-600', border: 'border-violet-200', icon: Users },
  call: { label: 'Llamada', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', icon: Phone },
  reminder: { label: 'Recordatorio', bg: 'bg-slate-50', text: 'text-slate-600', border: 'border-slate-200', icon: Bell },
  appointment: { label: 'Cita', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-200', icon: Calendar },
};

export function EventDetailSheet({
  event,
  open,
  onClose,
}: {
  event: CalendarEvent | null;
  open: boolean;
  onClose: () => void;
}) {
  const navigate = useNavigate();

  if (!event) return null;

  const config = TYPE_CONFIG[event.type];
  const Icon = config.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-2xl overflow-hidden gap-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">{event.title}</DialogTitle>

        {/* Header */}
        <div className="p-6 pb-4">
          <div className="flex items-start justify-between mb-4">
            <Badge
              variant="outline"
              className={cn(
                'text-xs font-medium px-2.5 py-1 rounded-full',
                config.bg, config.text, config.border
              )}
            >
              <Icon className="w-3 h-3 mr-1.5" />
              {config.label}
            </Badge>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          <h2 className="text-xl font-bold text-foreground leading-tight">
            {event.title}
          </h2>
        </div>

        {/* Date / Time / Location */}
        <div className="px-6 pb-4 space-y-2.5">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4 shrink-0" />
            <span className="capitalize">
              {format(event.start, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
            </span>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <Clock className="w-4 h-4 shrink-0" />
            {event.allDay ? (
              <span>Todo el día</span>
            ) : (
              <span>{format(event.start, 'HH:mm')} — {format(event.end, 'HH:mm')}</span>
            )}
          </div>
          {/* Location placeholder — shown if description hints at a location */}
        </div>

        <div className="border-t mx-6" />

        {/* Description */}
        {event.description && (
          <>
            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Descripción
              </p>
              <div className="bg-muted/40 rounded-lg p-3">
                <p className="text-[13px] text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {event.description}
                </p>
              </div>
            </div>
            <div className="border-t mx-6" />
          </>
        )}

        {/* Linked matter */}
        {event.matter && (
          <>
            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Expediente vinculado
              </p>
              <button
                onClick={() => {
                  navigate(`/app/expedientes/${event.matter!.id}`);
                  onClose();
                }}
                className="flex items-center gap-2 group w-full text-left"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors truncate">
                    {event.matter.reference} — {event.matter.title}
                  </p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <div className="border-t mx-6" />
          </>
        )}

        {/* Linked account */}
        {event.account && (
          <>
            <div className="px-6 py-4">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Cliente
              </p>
              <button
                onClick={() => {
                  navigate(`/app/crm/clients/${event.account!.id}`);
                  onClose();
                }}
                className="flex items-center gap-2 group w-full text-left"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
                  {event.account.name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                  {event.account.name}
                </p>
                <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </button>
            </div>
            <div className="border-t mx-6" />
          </>
        )}

        {/* Footer actions */}
        <div className="px-6 py-4 flex items-center justify-between">
          <Button variant="outline" size="sm" disabled>
            <Pencil className="w-3.5 h-3.5 mr-1.5" />
            Editar
          </Button>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10" disabled>
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            Eliminar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
