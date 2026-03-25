// ============================================
// Modal centrado de detalle de evento — con edición inline
// ============================================

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import {
  Calendar,
  Clock,
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
  Save,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
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

const EVENT_TYPE_OPTIONS = [
  { value: 'deadline', label: 'Plazo' },
  { value: 'meeting', label: 'Reunión' },
  { value: 'task', label: 'Tarea' },
  { value: 'call', label: 'Llamada' },
  { value: 'reminder', label: 'Recordatorio' },
];

const COLOR_OPTIONS = [
  { value: '#EF4444', label: 'Rojo' },
  { value: '#8B5CF6', label: 'Violeta' },
  { value: '#F59E0B', label: 'Ámbar' },
  { value: '#3B82F6', label: 'Azul' },
  { value: '#22C55E', label: 'Verde' },
  { value: '#94A3B8', label: 'Gris' },
];

function toDatetimeLocal(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

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
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  // Edit form state
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editType, setEditType] = useState('');
  const [editColor, setEditColor] = useState('');

  const startEditing = () => {
    if (!event) return;
    setEditTitle(event.title);
    setEditDescription(event.description || '');
    setEditStart(toDatetimeLocal(event.start));
    setEditEnd(toDatetimeLocal(event.end));
    setEditType(event.type);
    setEditColor(event.color || '#3B82F6');
    setEditing(true);
  };

  const cancelEditing = () => setEditing(false);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!event) throw new Error('No event');
      // Only calendar_events are editable
      if (event.source_table !== 'calendar_events') {
        throw new Error('Solo se pueden editar eventos del calendario');
      }
      const { error } = await (supabase.from('calendar_events') as any)
        .update({
          title: editTitle,
          description: editDescription || null,
          start_at: new Date(editStart).toISOString(),
          end_at: new Date(editEnd).toISOString(),
          event_type: editType,
          color: editColor,
          updated_at: new Date().toISOString(),
        })
        .eq('id', event.source_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('✅ Evento actualizado');
      setEditing(false);
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Error al guardar'),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!event || event.source_table !== 'calendar_events') {
        throw new Error('Solo se pueden eliminar eventos del calendario');
      }
      const { error } = await (supabase.from('calendar_events') as any)
        .delete()
        .eq('id', event.source_id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success('Evento eliminado');
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      onClose();
    },
    onError: (e: any) => toast.error(e.message || 'Error al eliminar'),
  });

  const handleClose = () => {
    setEditing(false);
    onClose();
  };

  if (!event) return null;

  const config = TYPE_CONFIG[event.type];
  const Icon = config.icon;
  const isCalendarEvent = event.source_table === 'calendar_events';

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[480px] p-0 rounded-2xl overflow-hidden gap-0 border-0 shadow-2xl">
        <DialogTitle className="sr-only">{event.title}</DialogTitle>

        {editing ? (
          /* ── EDIT MODE ── */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold">Editar evento</h3>
              <button onClick={cancelEditing} className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
                <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Descripción</label>
                <Textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Inicio</label>
                  <Input type="datetime-local" value={editStart} onChange={e => setEditStart(e.target.value)} />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Fin</label>
                  <Input type="datetime-local" value={editEnd} onChange={e => setEditEnd(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Tipo</label>
                  <Select value={editType} onValueChange={setEditType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {EVENT_TYPE_OPTIONS.map(o => (
                        <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Color</label>
                  <div className="flex gap-2 pt-1">
                    {COLOR_OPTIONS.map(c => (
                      <button
                        key={c.value}
                        onClick={() => setEditColor(c.value)}
                        className={cn(
                          'w-7 h-7 rounded-full border-2 transition-all',
                          editColor === c.value ? 'border-foreground scale-110' : 'border-transparent'
                        )}
                        style={{ backgroundColor: c.value }}
                        title={c.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 justify-end">
              <Button variant="outline" size="sm" onClick={cancelEditing}>Cancelar</Button>
              <Button size="sm" onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !editTitle.trim()}>
                <Save className="w-3.5 h-3.5 mr-1.5" />
                {saveMutation.isPending ? 'Guardando...' : 'Guardar'}
              </Button>
            </div>
          </div>
        ) : (
          /* ── VIEW MODE ── */
          <>
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
                  onClick={handleClose}
                  className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-muted transition-colors"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              </div>

              <h2 className="text-xl font-bold text-foreground leading-tight">
                {event.title}
              </h2>
            </div>

            {/* Date / Time */}
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
                    onClick={() => { navigate(`/app/expedientes/${event.matter!.id}`); handleClose(); }}
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
                    onClick={() => { navigate(`/app/crm/clients/${event.account!.id}`); handleClose(); }}
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
              <Button
                variant="outline"
                size="sm"
                onClick={startEditing}
                disabled={!isCalendarEvent}
                title={!isCalendarEvent ? 'Solo eventos del calendario son editables' : undefined}
              >
                <Pencil className="w-3.5 h-3.5 mr-1.5" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                disabled={!isCalendarEvent || deleteMutation.isPending}
                onClick={() => {
                  if (confirm('¿Eliminar este evento?')) deleteMutation.mutate();
                }}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
