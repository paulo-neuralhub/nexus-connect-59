// ============================================
// Panel lateral de detalle de evento
// ============================================

import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Tag,
  FileText,
  Building2,
  ExternalLink,
  AlertTriangle,
  RefreshCw,
  CheckSquare,
  Users,
  Phone,
  Bell,
} from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { CalendarEvent } from '@/hooks/use-calendar-events';

const TYPE_CONFIG: Record<CalendarEvent['type'], { label: string; color: string; icon: React.ElementType }> = {
  deadline_fatal: { label: 'Plazo FATAL', color: 'bg-red-500', icon: AlertTriangle },
  deadline: { label: 'Plazo', color: 'bg-orange-500', icon: Calendar },
  renewal: { label: 'Renovación', color: 'bg-purple-500', icon: RefreshCw },
  task: { label: 'Tarea', color: 'bg-blue-500', icon: CheckSquare },
  meeting: { label: 'Reunión', color: 'bg-green-500', icon: Users },
  call: { label: 'Llamada', color: 'bg-yellow-500', icon: Phone },
  reminder: { label: 'Recordatorio', color: 'bg-gray-400', icon: Bell },
  appointment: { label: 'Cita', color: 'bg-pink-500', icon: Calendar },
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
  
  const navigateToSource = () => {
    if (event.source_table === 'matter_deadlines' && event.matter?.id) {
      navigate(`/app/expedientes/${event.matter.id}?tab=plazos`);
    } else if (event.source_table === 'activities') {
      // Navegar a la actividad correspondiente
      if (event.matter?.id) {
        navigate(`/app/expedientes/${event.matter.id}?tab=tareas`);
      }
    }
    onClose();
  };
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", config.color)} />
            {event.title}
          </SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 py-6">
          {/* Fecha y hora */}
          <div className="flex items-start gap-3">
            <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
            <div>
              <p className="font-medium">
                {format(event.start, "EEEE, d 'de' MMMM yyyy", { locale: es })}
              </p>
              {!event.allDay && (
                <p className="text-sm text-muted-foreground flex items-center gap-1 mt-0.5">
                  <Clock className="h-3.5 w-3.5" />
                  {format(event.start, 'HH:mm')} - {format(event.end, 'HH:mm')}
                </p>
              )}
            </div>
          </div>
          
          {/* Tipo */}
          <div className="flex items-center gap-3">
            <Tag className="h-5 w-5 text-muted-foreground" />
            <Badge className={cn("text-white", config.color)}>
              <Icon className="h-3 w-3 mr-1" />
              {config.label}
            </Badge>
          </div>
          
          {/* Expediente vinculado */}
          {event.matter && (
            <div className="flex items-start gap-3">
              <FileText className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Expediente</p>
                <button
                  onClick={() => {
                    navigate(`/app/expedientes/${event.matter!.id}`);
                    onClose();
                  }}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {event.matter.reference} - {event.matter.title}
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Cliente */}
          {event.account && (
            <div className="flex items-start gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Cliente</p>
                <button
                  onClick={() => {
                    navigate(`/app/crm/clients/${event.account!.id}`);
                    onClose();
                  }}
                  className="text-primary hover:underline flex items-center gap-1"
                >
                  {event.account.name}
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}
          
          {/* Descripción */}
          {event.description && (
            <div className="space-y-1.5">
              <p className="text-sm font-medium text-muted-foreground">Descripción</p>
              <p className="text-sm leading-relaxed">{event.description}</p>
            </div>
          )}
        </div>
        
        <SheetFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" className="flex-1" onClick={navigateToSource}>
            <ExternalLink className="h-4 w-4 mr-2" />
            Ver detalle completo
          </Button>
          {event.type === 'task' && (
            <Button className="flex-1" disabled>
              <CheckSquare className="h-4 w-4 mr-2" />
              Marcar completada
            </Button>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
