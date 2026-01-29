// ============================================
// Sidebar del Calendario con filtros y mini-calendario
// ============================================

import { useState } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { AlertTriangle, RefreshCw, CheckSquare, Users, Phone, Bell } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import type { EventFilters, EventStats } from '@/hooks/use-calendar-events';

interface CalendarSidebarProps {
  date: Date;
  onDateChange: (date: Date) => void;
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  stats?: EventStats | null;
}

export function CalendarSidebar({
  date,
  onDateChange,
  filters,
  onFiltersChange,
  stats,
}: CalendarSidebarProps) {
  const toggleFilter = (key: keyof EventFilters) => {
    onFiltersChange({ ...filters, [key]: !filters[key] });
  };
  
  const setAllFilters = (value: boolean) => {
    onFiltersChange({
      showDeadlines: value,
      showDeadlinesFatal: value,
      showRenewals: value,
      showTasks: value,
      showMeetings: value,
      showCalls: value,
      showReminders: value,
      showOnlyMine: filters.showOnlyMine,
    });
  };
  
  return (
    <ScrollArea className="h-full">
      <div className="p-4 space-y-6">
        {/* Mini calendario */}
        <div className="border rounded-lg p-2 bg-card">
          <Calendar
            mode="single"
            selected={date}
            onSelect={(d) => d && onDateChange(d)}
            locale={es}
            className="p-0 w-full [&_table]:w-full"
            classNames={{
              months: "w-full",
              month: "w-full space-y-2",
              table: "w-full border-collapse",
              head_row: "flex w-full",
              head_cell: "flex-1 text-center text-xs font-medium text-muted-foreground",
              row: "flex w-full mt-1",
              cell: "flex-1 text-center p-0 relative",
              day: "h-8 w-full text-sm p-0 font-normal hover:bg-muted rounded-md transition-colors aria-selected:opacity-100",
              day_selected: "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground font-bold",
              day_outside: "text-muted-foreground opacity-50",
              nav: "flex items-center justify-between mb-2",
              nav_button: "h-7 w-7 bg-transparent hover:bg-muted rounded-md inline-flex items-center justify-center",
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              caption: "flex justify-center relative items-center h-7",
              caption_label: "text-sm font-medium",
            }}
          />
        </div>
        
        {/* Filtro personal */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Vista
          </h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <Checkbox
              checked={filters.showOnlyMine}
              onCheckedChange={() => toggleFilter('showOnlyMine')}
            />
            <span className="text-sm">Solo mis eventos</span>
          </label>
        </div>
        
        {/* Filtros por tipo */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Mostrar
          </h3>
          
          <FilterCheckbox
            checked={filters.showDeadlinesFatal}
            onChange={() => toggleFilter('showDeadlinesFatal')}
            color="bg-red-500"
            label="Plazos FATALES"
            count={stats?.deadlinesFatal}
            icon={<AlertTriangle className="h-3 w-3" />}
          />
          
          <FilterCheckbox
            checked={filters.showDeadlines}
            onChange={() => toggleFilter('showDeadlines')}
            color="bg-orange-500"
            label="Plazos"
            count={stats?.deadlines}
          />
          
          <FilterCheckbox
            checked={filters.showRenewals}
            onChange={() => toggleFilter('showRenewals')}
            color="bg-purple-500"
            label="Renovaciones"
            count={stats?.renewals}
            icon={<RefreshCw className="h-3 w-3" />}
          />
          
          <FilterCheckbox
            checked={filters.showTasks}
            onChange={() => toggleFilter('showTasks')}
            color="bg-blue-500"
            label="Tareas"
            count={stats?.tasks}
            icon={<CheckSquare className="h-3 w-3" />}
          />
          
          <FilterCheckbox
            checked={filters.showMeetings}
            onChange={() => toggleFilter('showMeetings')}
            color="bg-green-500"
            label="Reuniones"
            count={stats?.meetings}
            icon={<Users className="h-3 w-3" />}
          />
          
          <FilterCheckbox
            checked={filters.showCalls}
            onChange={() => toggleFilter('showCalls')}
            color="bg-yellow-500"
            label="Llamadas"
            count={stats?.calls}
            icon={<Phone className="h-3 w-3" />}
          />
          
          <FilterCheckbox
            checked={filters.showReminders}
            onChange={() => toggleFilter('showReminders')}
            color="bg-gray-400"
            label="Recordatorios"
            count={stats?.reminders}
            icon={<Bell className="h-3 w-3" />}
          />
        </div>
        
        {/* Atajos rápidos */}
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Filtros rápidos
          </h3>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onFiltersChange({
                ...filters,
                showDeadlines: true,
                showDeadlinesFatal: true,
                showRenewals: false,
                showTasks: false,
                showMeetings: false,
                showCalls: false,
                showReminders: false,
              })}
            >
              Solo plazos
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => onFiltersChange({
                ...filters,
                showDeadlines: false,
                showDeadlinesFatal: false,
                showRenewals: true,
                showTasks: false,
                showMeetings: false,
                showCalls: false,
                showReminders: false,
              })}
            >
              Solo renovaciones
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-7"
              onClick={() => setAllFilters(true)}
            >
              Mostrar todo
            </Button>
          </div>
        </div>
        
        {/* Resumen del mes */}
        {stats && (
          <div className="space-y-2">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
              Este período
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <StatItem color="bg-red-500" label="fatales" count={stats.deadlinesFatal} />
              <StatItem color="bg-purple-500" label="renovaciones" count={stats.renewals} />
              <StatItem color="bg-green-500" label="reuniones" count={stats.meetings} />
              <StatItem color="bg-blue-500" label="tareas" count={stats.tasks} />
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}

// Componente auxiliar para filtros
function FilterCheckbox({ 
  checked, 
  onChange, 
  color, 
  label, 
  count,
  icon,
}: {
  checked: boolean;
  onChange: () => void;
  color: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <div className={cn("w-3 h-3 rounded-sm flex items-center justify-center text-white", color)}>
        {icon}
      </div>
      <span className="text-sm flex-1">{label}</span>
      {count !== undefined && count > 0 && (
        <Badge variant="secondary" className="text-[10px] h-5 px-1.5">
          {count}
        </Badge>
      )}
    </label>
  );
}

// Componente para estadísticas
function StatItem({ color, label, count }: { color: string; label: string; count: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={cn("w-2 h-2 rounded-full", color)} />
      <span className="text-muted-foreground">
        <span className="font-medium text-foreground">{count}</span> {label}
      </span>
    </div>
  );
}
