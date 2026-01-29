// ============================================
// Modal de configuración del calendario
// ============================================

import { useState, useEffect } from 'react';
import { type View } from 'react-big-calendar';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import type { EventFilters } from '@/hooks/use-calendar-events';

interface CalendarSettings {
  defaultView: View;
  weekStartsOn: 0 | 1;
  showWeekNumbers: boolean;
  defaultFilters: EventFilters;
}

const defaultSettings: CalendarSettings = {
  defaultView: 'month',
  weekStartsOn: 1,
  showWeekNumbers: true,
  defaultFilters: {
    showDeadlines: true,
    showDeadlinesFatal: true,
    showRenewals: true,
    showTasks: true,
    showMeetings: true,
    showCalls: true,
    showReminders: true,
    showOnlyMine: false,
  },
};

export function CalendarSettingsModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [settings, setSettings] = useState<CalendarSettings>(() => {
    try {
      const saved = localStorage.getItem('calendar_settings');
      return saved ? JSON.parse(saved) : defaultSettings;
    } catch {
      return defaultSettings;
    }
  });
  
  const saveSettings = () => {
    localStorage.setItem('calendar_settings', JSON.stringify(settings));
    localStorage.setItem('calendar_default_view', settings.defaultView);
    toast.success('Preferencias guardadas');
    onClose();
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Configuración del Calendario</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Vista por defecto */}
          <div className="space-y-2">
            <Label>Vista por defecto</Label>
            <Select
              value={settings.defaultView}
              onValueChange={(v) => setSettings({ ...settings, defaultView: v as View })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Día</SelectItem>
                <SelectItem value="week">Semana</SelectItem>
                <SelectItem value="month">Mes</SelectItem>
                <SelectItem value="agenda">Agenda</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Inicio de semana */}
          <div className="space-y-2">
            <Label>La semana empieza en</Label>
            <Select
              value={String(settings.weekStartsOn)}
              onValueChange={(v) => setSettings({ ...settings, weekStartsOn: Number(v) as 0 | 1 })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Lunes</SelectItem>
                <SelectItem value="0">Domingo</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {/* Mostrar números de semana */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={settings.showWeekNumbers}
              onCheckedChange={(c) => setSettings({ ...settings, showWeekNumbers: !!c })}
            />
            <span className="text-sm">Mostrar números de semana</span>
          </label>
          
          {/* Filtros por defecto */}
          <div className="space-y-3">
            <Label>Filtros por defecto al abrir el calendario</Label>
            <div className="space-y-2 pl-2">
              {Object.entries({
                showDeadlinesFatal: 'Plazos FATALES',
                showDeadlines: 'Plazos',
                showRenewals: 'Renovaciones',
                showTasks: 'Tareas',
                showMeetings: 'Reuniones',
                showCalls: 'Llamadas',
                showReminders: 'Recordatorios',
              }).map(([key, label]) => (
                <label key={key} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={settings.defaultFilters[key as keyof EventFilters] as boolean}
                    onCheckedChange={(c) => setSettings({
                      ...settings,
                      defaultFilters: { ...settings.defaultFilters, [key]: !!c }
                    })}
                  />
                  <span className="text-sm">{label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Solo mis eventos por defecto */}
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={settings.defaultFilters.showOnlyMine}
              onCheckedChange={(c) => setSettings({
                ...settings,
                defaultFilters: { ...settings.defaultFilters, showOnlyMine: !!c }
              })}
            />
            <span className="text-sm">Por defecto mostrar solo mis eventos</span>
          </label>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={saveSettings}>
            Guardar preferencias
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
