// ============================================
// Modal para crear eventos multi-tipo en el calendario
// Soporta: Tarea, Reunión, Llamada, Recordatorio, Plazo, Plazo Fatal, Personalizado
// ============================================

import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  CheckSquare, Phone, Video, Bell, AlertTriangle,
  ChevronLeft, Calendar as CalendarIcon, Clock, MapPin
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MatterSelect, type MatterOption } from '@/components/features/docket/MatterSelect';
import { cn } from '@/lib/utils';

// Colores disponibles para eventos personalizados
const CUSTOM_COLORS = [
  '#3b82f6', // blue
  '#22c55e', // green
  '#eab308', // yellow
  '#ef4444', // red
  '#a855f7', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#64748b', // slate
];

// Tipos de eventos disponibles
const EVENT_TYPES = [
  { 
    id: 'task', 
    label: 'Tarea', 
    icon: CheckSquare, 
    color: 'bg-blue-500',
    table: 'activities',
    description: 'Tarea pendiente con fecha límite'
  },
  { 
    id: 'meeting', 
    label: 'Reunión', 
    icon: Video, 
    color: 'bg-green-500',
    table: 'activities',
    description: 'Reunión con fecha y hora'
  },
  { 
    id: 'call', 
    label: 'Llamada', 
    icon: Phone, 
    color: 'bg-yellow-500',
    table: 'activities',
    description: 'Llamada programada'
  },
  { 
    id: 'reminder', 
    label: 'Recordatorio', 
    icon: Bell, 
    color: 'bg-gray-500',
    table: 'activities',
    description: 'Recordatorio personal'
  },
  { 
    id: 'deadline', 
    label: 'Plazo', 
    icon: AlertTriangle, 
    color: 'bg-orange-500',
    table: 'matter_deadlines',
    description: 'Plazo legal de un expediente'
  },
  { 
    id: 'deadline_fatal', 
    label: 'Plazo FATAL', 
    icon: AlertTriangle, 
    color: 'bg-red-500',
    table: 'matter_deadlines',
    description: 'Plazo improrrogable (fatal)'
  },
  { 
    id: 'custom', 
    label: 'Evento personalizado', 
    icon: CalendarIcon, 
    color: 'bg-slate-500',
    table: 'activities',
    description: 'Evento libre con fecha y descripción'
  },
] as const;

type EventTypeId = typeof EVENT_TYPES[number]['id'];

interface FormData {
  title: string;
  description: string;
  date: string;
  time: string;
  endTime: string;
  hasEndTime: boolean;
  allDay: boolean;
  matter: MatterOption | null;
  priority: string;
  deadlineType: string;
  // Custom event fields
  customType: string;
  eventColor: string;
  location: string;
  linkType: 'none' | 'matter' | 'client';
}

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultDate?: Date;
  defaultType?: EventTypeId;
}

export function CreateEventModal({ 
  isOpen, 
  onClose, 
  defaultDate = new Date(),
  defaultType
}: CreateEventModalProps) {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();
  
  // Estado del wizard
  const [step, setStep] = useState<'type' | 'details'>(defaultType ? 'details' : 'type');
  const [eventType, setEventType] = useState<EventTypeId | ''>(defaultType || '');
  
  // Datos del evento
  const [formData, setFormData] = useState<FormData>({
    title: '',
    description: '',
    date: format(defaultDate, 'yyyy-MM-dd'),
    time: '09:00',
    endTime: '10:00',
    hasEndTime: false,
    allDay: true,
    matter: null,
    priority: 'medium',
    deadlineType: 'internal',
    customType: '',
    eventColor: '#3b82f6',
    location: '',
    linkType: 'none',
  });
  
  // Reset cuando se abre/cierra
  useEffect(() => {
    if (isOpen) {
      setStep(defaultType ? 'details' : 'type');
      setEventType(defaultType || '');
      setFormData({
        title: '',
        description: '',
        date: format(defaultDate, 'yyyy-MM-dd'),
        time: '09:00',
        endTime: '10:00',
        hasEndTime: false,
        allDay: true,
        matter: null,
        priority: 'medium',
        deadlineType: 'internal',
        customType: '',
        eventColor: '#3b82f6',
        location: '',
        linkType: 'none',
      });
    }
  }, [isOpen, defaultDate, defaultType]);
  
  // Mutation para crear evento
  const createEvent = useMutation({
    mutationFn: async () => {
      if (!currentOrganization?.id) throw new Error('No hay organización seleccionada');
      
      const selectedType = EVENT_TYPES.find(t => t.id === eventType);
      
      if (eventType === 'custom') {
        // Crear evento personalizado
        const startDateTime = formData.allDay 
          ? `${formData.date}T00:00:00`
          : `${formData.date}T${formData.time}:00`;
        
        const endDateTime = formData.allDay 
          ? `${formData.date}T23:59:59`
          : `${formData.date}T${formData.endTime}:00`;
        
        const { error } = await supabase.from('activities').insert({
          organization_id: currentOrganization.id,
          owner_type: 'tenant',
          type: 'custom',
          subject: formData.title,
          content: formData.description || null,
          due_date: startDateTime,
          meeting_start: startDateTime,
          meeting_end: endDateTime,
          matter_id: formData.linkType === 'matter' && formData.matter?.id ? formData.matter.id : null,
          meeting_location: formData.location || null,
          is_completed: false,
          metadata: {
            custom_type: formData.customType,
            color: formData.eventColor,
            location: formData.location,
            all_day: formData.allDay,
          },
        });
        
        if (error) throw error;
        
      } else if (selectedType?.table === 'activities') {
        // Crear en tabla activities
        const dueDate = formData.allDay 
          ? `${formData.date}T23:59:59`
          : `${formData.date}T${formData.time}:00`;
        
        const endDate = formData.hasEndTime && !formData.allDay
          ? `${formData.date}T${formData.endTime}:00`
          : null;
        
        const { error } = await supabase.from('activities').insert({
          organization_id: currentOrganization.id,
          owner_type: 'tenant',
          type: eventType,
          subject: formData.title,
          content: formData.description || null,
          due_date: dueDate,
          meeting_start: eventType === 'meeting' ? dueDate : null,
          meeting_end: eventType === 'meeting' ? endDate : null,
          matter_id: formData.matter?.id || null,
          is_completed: false,
        });
        
        if (error) throw error;
        
      } else if (selectedType?.table === 'matter_deadlines') {
        // Crear en tabla matter_deadlines
        if (!formData.matter?.id) {
          throw new Error('Los plazos requieren un expediente vinculado');
        }
        
        const { error } = await supabase.from('matter_deadlines').insert({
          organization_id: currentOrganization.id,
          matter_id: formData.matter.id,
          title: formData.title,
          description: formData.description || null,
          deadline_date: `${formData.date}T23:59:59`,
          trigger_date: new Date().toISOString(),
          deadline_type: formData.deadlineType,
          priority: eventType === 'deadline_fatal' ? 'fatal' : formData.priority,
          status: 'pending',
        });
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      queryClient.invalidateQueries({ queryKey: ['all-tasks'] });
      queryClient.invalidateQueries({ queryKey: ['matter-deadlines'] });
      toast.success('Evento creado correctamente');
      onClose();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Error al crear evento');
    },
  });
  
  const selectedTypeConfig = EVENT_TYPES.find(t => t.id === eventType);
  
  const handleSelectType = (typeId: EventTypeId) => {
    setEventType(typeId);
    setStep('details');
    // Pre-configurar según tipo
    if (typeId === 'meeting') {
      setFormData(prev => ({ ...prev, allDay: false, hasEndTime: true }));
    }
    if (typeId === 'custom') {
      setFormData(prev => ({ ...prev, allDay: true, hasEndTime: true }));
    }
  };
  
  const isValid = () => {
    if (!formData.title.trim()) return false;
    if ((eventType === 'deadline' || eventType === 'deadline_fatal') && !formData.matter?.id) {
      return false;
    }
    return true;
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {step === 'type' ? (
              <>
                <CalendarIcon className="h-5 w-5 text-primary" />
                Nuevo evento
              </>
            ) : (
              <>
                {selectedTypeConfig && (
                  <div 
                    className={cn(
                      "w-6 h-6 rounded flex items-center justify-center text-white",
                      eventType === 'custom' ? '' : selectedTypeConfig.color
                    )}
                    style={eventType === 'custom' ? { backgroundColor: formData.eventColor } : undefined}
                  >
                    <selectedTypeConfig.icon className="h-4 w-4" />
                  </div>
                )}
                Nuevo {selectedTypeConfig?.label}
              </>
            )}
          </DialogTitle>
        </DialogHeader>
        
        {/* PASO 1: Selección de tipo */}
        {step === 'type' && (
          <div className="py-4 space-y-3">
            {/* Grid de 6 tipos principales */}
            <div className="grid grid-cols-3 gap-3">
              {EVENT_TYPES.slice(0, 6).map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleSelectType(type.id)}
                  className={cn(
                    "flex flex-col items-center gap-2 p-3 rounded-lg border-2 transition-all",
                    "hover:border-primary hover:bg-muted/50"
                  )}
                >
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center text-white", type.color)}>
                    <type.icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium text-xs">{type.label}</span>
                </button>
              ))}
            </div>
            
            {/* Evento personalizado - destacado */}
            <button
              onClick={() => handleSelectType('custom')}
              className={cn(
                "w-full flex items-center gap-3 p-4 rounded-lg border-2 border-dashed transition-all",
                "hover:border-primary hover:bg-muted/50"
              )}
            >
              <div className="w-10 h-10 rounded-lg bg-slate-500 flex items-center justify-center text-white">
                <CalendarIcon className="h-5 w-5" />
              </div>
              <div className="text-left">
                <span className="font-medium text-sm">Evento personalizado</span>
                <p className="text-xs text-muted-foreground">Evento libre con fecha, hora y color personalizable</p>
              </div>
            </button>
          </div>
        )}
        
        {/* PASO 2: Detalles del evento */}
        {step === 'details' && (
          <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
            {/* Título */}
            <div className="space-y-2">
              <Label htmlFor="title">Título *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={getPlaceholderByType(eventType)}
                autoFocus
              />
            </div>
            
            {/* Campos específicos para evento personalizado */}
            {eventType === 'custom' && (
              <>
                {/* Tipo personalizado */}
                <div className="space-y-2">
                  <Label htmlFor="customType">Tipo de evento</Label>
                  <Input
                    id="customType"
                    value={formData.customType}
                    onChange={(e) => setFormData({ ...formData, customType: e.target.value })}
                    placeholder="Ej: Conferencia, Webinar, Entrega, etc."
                  />
                </div>
                
                {/* Color del evento */}
                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex gap-2">
                    {CUSTOM_COLORS.map(color => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setFormData({ ...formData, eventColor: color })}
                        className={cn(
                          "w-8 h-8 rounded-full transition-all",
                          formData.eventColor === color && "ring-2 ring-offset-2 ring-primary"
                        )}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>
              </>
            )}
            
            {/* Fecha y hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">Fecha *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              
              {!formData.allDay && (
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <Input
                    id="time"
                    type="time"
                    value={formData.time}
                    onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                  />
                </div>
              )}
            </div>
            
            {/* Todo el día / Hora fin (para reuniones y custom) */}
            {(eventType === 'meeting' || eventType === 'custom') && (
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="allDay"
                    checked={formData.allDay}
                    onCheckedChange={(c) => setFormData({ ...formData, allDay: !!c })}
                  />
                  <Label htmlFor="allDay" className="cursor-pointer text-sm">Todo el día</Label>
                </div>
                
                {!formData.allDay && (
                  <div className="flex items-center gap-2">
                    <Label htmlFor="endTime" className="text-sm text-muted-foreground">Hasta:</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      className="w-24"
                    />
                  </div>
                )}
              </div>
            )}
            
            {/* Ubicación (para custom y meeting) */}
            {(eventType === 'custom' || eventType === 'meeting') && (
              <div className="space-y-2">
                <Label htmlFor="location">Ubicación (opcional)</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    placeholder="Ej: Sala de reuniones, Zoom, Oficina cliente..."
                    className="pl-9"
                  />
                </div>
              </div>
            )}
            
            {/* Descripción */}
            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detalles adicionales..."
                rows={2}
              />
            </div>
            
            {/* Vincular a (para custom) */}
            {eventType === 'custom' && (
              <div className="space-y-2">
                <Label>Vincular a (opcional)</Label>
                <Tabs 
                  value={formData.linkType} 
                  onValueChange={(v) => setFormData({ ...formData, linkType: v as 'none' | 'matter' | 'client', matter: null })}
                  className="w-full"
                >
                  <TabsList className="w-full grid grid-cols-3">
                    <TabsTrigger value="none">Ninguno</TabsTrigger>
                    <TabsTrigger value="matter">Expediente</TabsTrigger>
                    <TabsTrigger value="client">Cliente</TabsTrigger>
                  </TabsList>
                  <TabsContent value="matter" className="mt-2">
                    <MatterSelect
                      value={formData.matter}
                      onChange={(matter) => setFormData({ ...formData, matter })}
                      placeholder="Buscar expediente..."
                    />
                  </TabsContent>
                  <TabsContent value="client" className="mt-2">
                    <p className="text-sm text-muted-foreground italic">Selector de clientes en desarrollo</p>
                  </TabsContent>
                </Tabs>
              </div>
            )}
            
            {/* Vincular a expediente (para otros tipos) */}
            {eventType !== 'custom' && (
              <div className="space-y-2">
                <Label>
                  Expediente
                  {(eventType === 'deadline' || eventType === 'deadline_fatal') && (
                    <span className="text-destructive"> *</span>
                  )}
                </Label>
                <MatterSelect
                  value={formData.matter}
                  onChange={(matter) => setFormData({ ...formData, matter })}
                  placeholder="Buscar expediente..."
                />
              </div>
            )}
            
            {/* Tipo de plazo (solo para deadlines) */}
            {(eventType === 'deadline' || eventType === 'deadline_fatal') && (
              <div className="space-y-2">
                <Label>Tipo de plazo</Label>
                <Select
                  value={formData.deadlineType}
                  onValueChange={(v) => setFormData({ ...formData, deadlineType: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legal">Legal (oficial)</SelectItem>
                    <SelectItem value="renewal">Renovación</SelectItem>
                    <SelectItem value="internal">Interno</SelectItem>
                    <SelectItem value="client">Cliente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Prioridad (para tareas y plazos normales) */}
            {(eventType === 'task' || eventType === 'deadline') && (
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select
                  value={formData.priority}
                  onValueChange={(v) => setFormData({ ...formData, priority: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Baja</SelectItem>
                    <SelectItem value="medium">Media</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {/* Warning para plazos fatales */}
            {eventType === 'deadline_fatal' && (
              <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/30 rounded-lg">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-destructive">Plazo FATAL</p>
                  <p className="text-destructive/80">
                    Este plazo es improrrogable. Se enviarán alertas automáticas a 30, 15, 7, 3 y 1 día antes.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
        
        <DialogFooter>
          {step === 'details' && (
            <Button variant="ghost" onClick={() => setStep('type')} className="mr-auto">
              <ChevronLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          {step === 'details' && (
            <Button
              onClick={() => createEvent.mutate()}
              disabled={createEvent.isPending || !isValid()}
              style={eventType === 'custom' ? { backgroundColor: formData.eventColor } : undefined}
              className={cn(
                eventType !== 'custom' && selectedTypeConfig?.color.replace('bg-', 'bg-'),
                "hover:opacity-90 text-white"
              )}
            >
              {createEvent.isPending ? 'Creando...' : 'Crear evento'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Helpers
function getPlaceholderByType(type: string): string {
  switch (type) {
    case 'task': return 'Ej: Revisar documentos de solicitud';
    case 'meeting': return 'Ej: Reunión con cliente TechVision';
    case 'call': return 'Ej: Llamada de seguimiento';
    case 'reminder': return 'Ej: Recordar enviar presupuesto';
    case 'deadline': return 'Ej: Plazo alegaciones oposición';
    case 'deadline_fatal': return 'Ej: Plazo FATAL presentación recurso';
    case 'custom': return 'Ej: Conferencia IP 2026';
    default: return 'Título del evento';
  }
}
