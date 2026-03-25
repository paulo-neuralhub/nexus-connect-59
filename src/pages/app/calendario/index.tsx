// ============================================
// Calendario Unificado - Google Calendar Style
// ============================================

import { useState, useMemo, useCallback } from 'react';
import { Calendar, dateFnsLocalizer, Views, type View, type SlotInfo } from 'react-big-calendar';
import { format, parse, startOfWeek, getDay, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import 'react-big-calendar/lib/css/react-big-calendar.css';

import { useCalendarEvents, type CalendarEvent, type EventFilters } from '@/hooks/use-calendar-events';
import { CalendarHeader } from '@/components/features/calendario/CalendarHeader';
import { CalendarSidebar } from '@/components/features/calendario/CalendarSidebar';
import { CalendarSettingsModal } from '@/components/features/calendario/CalendarSettingsModal';
import { EventDetailSheet } from '@/components/features/calendario/EventDetailSheet';
import { CreateEventModal } from '@/components/features/calendario/CreateEventModal';
import { Skeleton } from '@/components/ui/skeleton';

// Localizer para español
const locales = { 'es': es };
const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek: () => startOfWeek(new Date(), { weekStartsOn: 1 }),
  getDay,
  locales,
});

// Mensajes en español
const calendarMessages = {
  today: 'Hoy',
  previous: 'Anterior',
  next: 'Siguiente',
  month: 'Mes',
  week: 'Semana',
  day: 'Día',
  agenda: 'Agenda',
  date: 'Fecha',
  time: 'Hora',
  event: 'Evento',
  noEventsInRange: 'No hay eventos en este rango.',
  showMore: (total: number) => `+ Ver ${total} más`,
};

// Color config por tipo de evento
const EVENT_TYPE_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  deadline_fatal: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
  deadline: { bg: '#FEE2E2', text: '#DC2626', border: '#EF4444' },
  meeting: { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6' },
  task: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  reminder: { bg: '#F1F5F9', text: '#475569', border: '#94A3B8' },
  call: { bg: '#FEF3C7', text: '#B45309', border: '#F59E0B' },
  renewal: { bg: '#EDE9FE', text: '#7C3AED', border: '#8B5CF6' },
  appointment: { bg: '#DBEAFE', text: '#1D4ED8', border: '#3B82F6' },
};

// Función para aplicar estilos mini-card a los eventos
function eventStyleGetter(event: CalendarEvent) {
  const styles = EVENT_TYPE_STYLES[event.type] || EVENT_TYPE_STYLES.task;

  return {
    style: {
      background: styles.bg,
      color: styles.text,
      borderLeft: `3px solid ${styles.border}`,
      borderRadius: '6px',
      border: 'none',
      borderLeftWidth: '3px',
      borderLeftStyle: 'solid' as const,
      borderLeftColor: styles.border,
      fontSize: '11px',
      fontWeight: 500,
      padding: '2px 8px',
      height: '22px',
      lineHeight: '18px',
      cursor: 'pointer',
      whiteSpace: 'nowrap' as const,
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      boxShadow: 'none',
      opacity: 1,
      transition: 'filter 0.15s ease, box-shadow 0.15s ease',
    },
  };
}

// Custom title accessor to show time + title
function eventTitleAccessor(event: CalendarEvent) {
  if (event.allDay) return event.title;
  const time = format(event.start, 'HH:mm');
  return `${time}  ${event.title}`;
}

// Cargar preferencias guardadas
function loadSavedFilters(): EventFilters {
  try {
    const saved = localStorage.getItem('calendar_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return parsed.defaultFilters || getDefaultFilters();
    }
  } catch {}
  return getDefaultFilters();
}

function getDefaultFilters(): EventFilters {
  return {
    showDeadlines: true,
    showDeadlinesFatal: true,
    showRenewals: true,
    showTasks: true,
    showMeetings: true,
    showCalls: true,
    showReminders: true,
    showOnlyMine: false,
  };
}

function loadDefaultView(): View {
  try {
    const saved = localStorage.getItem('calendar_default_view');
    if (saved && ['day', 'week', 'month', 'agenda'].includes(saved)) {
      return saved as View;
    }
  } catch {}
  return Views.MONTH;
}

export default function CalendarioPage() {
  // Estado de vista y navegación
  const [view, setView] = useState<View>(loadDefaultView);
  const [date, setDate] = useState(new Date());
  const [filters, setFilters] = useState<EventFilters>(loadSavedFilters);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createModalDate, setCreateModalDate] = useState<Date>(new Date());
  
  // Calcular rango de fechas según la vista actual
  const dateRange = useMemo(() => {
    const start = startOfMonth(subMonths(date, 1));
    const end = endOfMonth(addMonths(date, 1));
    return { start, end };
  }, [date]);
  
  // Cargar eventos
  const { data, isLoading } = useCalendarEvents(dateRange.start, dateRange.end, filters);
  const events = data?.items || [];
  const stats = data?.stats;
  
  // Handlers
  const handleViewChange = useCallback((newView: View) => {
    setView(newView);
    localStorage.setItem('calendar_default_view', newView);
  }, []);
  
  const handleNavigate = useCallback((newDate: Date) => {
    setDate(newDate);
  }, []);
  
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    setSelectedEvent(event);
  }, []);
  
  const handleTodayClick = useCallback(() => {
    setDate(new Date());
  }, []);
  
  const handleNewEvent = useCallback(() => {
    setCreateModalDate(date);
    setCreateModalOpen(true);
  }, [date]);
  
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setCreateModalDate(slotInfo.start);
    setCreateModalOpen(true);
  }, []);
  
  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col overflow-hidden">
      {/* Header */}
      <CalendarHeader
        date={date}
        view={view}
        onViewChange={handleViewChange}
        onDateChange={handleNavigate}
        onSettingsClick={() => setSettingsOpen(true)}
        onTodayClick={handleTodayClick}
        onNewEvent={handleNewEvent}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar izquierdo - FIJO */}
        <aside className="w-64 flex-shrink-0 border-r bg-muted/30 overflow-y-auto">
          <CalendarSidebar
            date={date}
            onDateChange={handleNavigate}
            filters={filters}
            onFiltersChange={setFilters}
            stats={stats}
          />
        </aside>
        
        {/* Calendario principal - FLEX GROW */}
        <main className="flex-1 overflow-hidden p-4">
          {isLoading ? (
            <div className="space-y-4 h-full">
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-full w-full" />
            </div>
          ) : (
            <div className="h-full bg-card rounded-lg border shadow-sm">
              <Calendar
                localizer={localizer}
                events={events}
                startAccessor="start"
                endAccessor="end"
                view={view}
                onView={handleViewChange}
                date={date}
                onNavigate={handleNavigate}
                onSelectEvent={handleSelectEvent}
                onSelectSlot={handleSelectSlot}
                eventPropGetter={eventStyleGetter}
                messages={calendarMessages}
                culture="es"
                popup
                selectable
                className="p-4 h-full [&_.rbc-calendar]:h-full [&_.rbc-month-view]:flex-1"
                style={{ height: '100%' }}
                toolbar={false}
                views={['month', 'week', 'day', 'agenda']}
              />
            </div>
          )}
        </main>
      </div>
      
      {/* Modal de configuración */}
      <CalendarSettingsModal
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
      />
      
      {/* Panel de detalle de evento */}
      <EventDetailSheet
        event={selectedEvent}
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
      />
      
      {/* Modal crear evento */}
      <CreateEventModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        defaultDate={createModalDate}
      />
    </div>
  );
}
