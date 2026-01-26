// =============================================
// COMPONENTE: DeadlineCalendar
// Calendario de plazos con vistas diaria/semanal/mensual
// =============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addDays, addWeeks, addMonths, subDays, subWeeks, subMonths, isToday, isPast } from 'date-fns';
import { es } from 'date-fns/locale';
import { Link } from 'react-router-dom';

export interface CalendarDeadline {
  id: string;
  title: string;
  date: Date;
  priority: 'critical' | 'high' | 'medium' | 'low';
  type: string;
  matterId?: string;
  matterRef?: string;
}

interface DeadlineCalendarProps {
  deadlines: CalendarDeadline[];
}

type ViewMode = 'day' | 'week' | 'month';

const PRIORITY_COLORS = {
  critical: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-500',
  low: 'bg-blue-500',
};

const PRIORITY_BG = {
  critical: 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800',
  high: 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800',
  medium: 'bg-amber-50 border-amber-200 dark:bg-amber-950/30 dark:border-amber-800',
  low: 'bg-blue-50 border-blue-200 dark:bg-blue-950/30 dark:border-blue-800',
};

export function DeadlineCalendar({ deadlines }: DeadlineCalendarProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(new Date());

  const navigate = (direction: 'prev' | 'next') => {
    const operations = {
      day: { prev: subDays, next: addDays },
      week: { prev: subWeeks, next: addWeeks },
      month: { prev: subMonths, next: addMonths },
    };
    setCurrentDate(operations[viewMode][direction](currentDate, 1));
  };

  const goToToday = () => setCurrentDate(new Date());

  const getDateRange = () => {
    switch (viewMode) {
      case 'day':
        return { start: currentDate, end: currentDate };
      case 'week':
        return { 
          start: startOfWeek(currentDate, { weekStartsOn: 1 }), 
          end: endOfWeek(currentDate, { weekStartsOn: 1 }) 
        };
      case 'month':
        return { 
          start: startOfMonth(currentDate), 
          end: endOfMonth(currentDate) 
        };
    }
  };

  const range = getDateRange();

  const getTitle = () => {
    switch (viewMode) {
      case 'day':
        return format(currentDate, "EEEE, d 'de' MMMM yyyy", { locale: es });
      case 'week':
        return `${format(range.start, "d MMM", { locale: es })} - ${format(range.end, "d MMM yyyy", { locale: es })}`;
      case 'month':
        return format(currentDate, "MMMM yyyy", { locale: es });
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Próximos Plazos
          </CardTitle>
          <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
            <TabsList className="h-8">
              <TabsTrigger value="day" className="text-xs px-2">Día</TabsTrigger>
              <TabsTrigger value="week" className="text-xs px-2">Semana</TabsTrigger>
              <TabsTrigger value="month" className="text-xs px-2">Mes</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigate('prev')}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => navigate('next')}>
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" className="text-xs ml-1" onClick={goToToday}>
              Hoy
            </Button>
          </div>
          <span className="text-sm font-medium capitalize">{getTitle()}</span>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        {viewMode === 'day' && (
          <DayView date={currentDate} deadlines={deadlines} />
        )}
        {viewMode === 'week' && (
          <WeekView startDate={range.start} endDate={range.end} deadlines={deadlines} />
        )}
        {viewMode === 'month' && (
          <MonthView currentDate={currentDate} deadlines={deadlines} />
        )}
      </CardContent>
    </Card>
  );
}

// =============================================
// Vista Diaria
// =============================================

function DayView({ date, deadlines }: { date: Date; deadlines: CalendarDeadline[] }) {
  const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));

  if (dayDeadlines.length === 0) {
    return (
      <div className="text-center py-8">
        <CalendarIcon className="h-10 w-10 mx-auto text-muted-foreground/50 mb-2" />
        <p className="text-sm text-muted-foreground">Sin plazos para este día</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {dayDeadlines.map(deadline => (
        <DeadlineItem key={deadline.id} deadline={deadline} />
      ))}
    </div>
  );
}

// =============================================
// Vista Semanal
// =============================================

function WeekView({ startDate, endDate, deadlines }: { startDate: Date; endDate: Date; deadlines: CalendarDeadline[] }) {
  const days = eachDayOfInterval({ start: startDate, end: endDate });

  return (
    <div className="grid grid-cols-7 gap-1">
      {/* Headers */}
      {days.map(day => (
        <div 
          key={day.toISOString()} 
          className={cn(
            "text-center text-xs font-medium py-1 rounded",
            isToday(day) && "bg-primary text-primary-foreground"
          )}
        >
          <div>{format(day, 'EEE', { locale: es })}</div>
          <div className="text-lg">{format(day, 'd')}</div>
        </div>
      ))}
      {/* Deadline cells */}
      {days.map(day => {
        const dayDeadlines = deadlines.filter(d => isSameDay(d.date, day));
        return (
          <div 
            key={`cell-${day.toISOString()}`} 
            className={cn(
              "min-h-[80px] p-1 rounded border",
              isToday(day) ? "border-primary/50 bg-primary/5" : "border-border/50",
              isPast(day) && !isToday(day) && "opacity-60"
            )}
          >
            {dayDeadlines.slice(0, 3).map(deadline => (
              <WeekDeadlineItem key={deadline.id} deadline={deadline} />
            ))}
            {dayDeadlines.length > 3 && (
              <div className="text-xs text-muted-foreground text-center mt-1">
                +{dayDeadlines.length - 3} más
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function WeekDeadlineItem({ deadline }: { deadline: CalendarDeadline }) {
  const content = (
    <div 
      className={cn(
        "text-xs p-1 rounded mb-1 truncate border cursor-pointer hover:opacity-80",
        PRIORITY_BG[deadline.priority]
      )}
      title={deadline.title}
    >
      <span className={cn("inline-block w-1.5 h-1.5 rounded-full mr-1", PRIORITY_COLORS[deadline.priority])} />
      {deadline.title}
    </div>
  );

  if (deadline.matterId) {
    return <Link to={`/app/docket/${deadline.matterId}`}>{content}</Link>;
  }
  return content;
}

// =============================================
// Vista Mensual
// =============================================

function MonthView({ currentDate, deadlines }: { currentDate: Date; deadlines: CalendarDeadline[] }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekDays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  return (
    <div>
      {/* Week headers */}
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
            {day}
          </div>
        ))}
      </div>
      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-1">
        {days.map(day => {
          const dayDeadlines = deadlines.filter(d => isSameDay(d.date, day));
          const isCurrentMonth = isSameMonth(day, currentDate);
          
          return (
            <div 
              key={day.toISOString()} 
              className={cn(
                "min-h-[50px] p-1 rounded text-center",
                isCurrentMonth ? "bg-muted/30" : "bg-muted/10 opacity-50",
                isToday(day) && "ring-2 ring-primary ring-offset-1"
              )}
            >
              <div className={cn(
                "text-xs font-medium mb-1",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
              {dayDeadlines.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5">
                  {dayDeadlines.slice(0, 3).map(deadline => (
                    <span 
                      key={deadline.id} 
                      className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[deadline.priority])}
                      title={deadline.title}
                    />
                  ))}
                  {dayDeadlines.length > 3 && (
                    <span className="text-[8px] text-muted-foreground">+{dayDeadlines.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =============================================
// Item de deadline individual
// =============================================

function DeadlineItem({ deadline }: { deadline: CalendarDeadline }) {
  const isOverdue = isPast(deadline.date) && !isToday(deadline.date);

  const content = (
    <div className={cn(
      "flex items-start gap-3 p-3 rounded-lg border transition-colors",
      PRIORITY_BG[deadline.priority],
      deadline.matterId && "hover:opacity-80 cursor-pointer"
    )}>
      <div className={cn(
        "p-2 rounded-full shrink-0",
        isOverdue ? "bg-red-200 text-red-700 dark:bg-red-900 dark:text-red-300" : "bg-muted"
      )}>
        {isOverdue ? (
          <AlertCircle className="h-4 w-4" />
        ) : (
          <Clock className="h-4 w-4" />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{deadline.title}</p>
        {deadline.matterRef && (
          <p className="text-xs text-muted-foreground mt-0.5">{deadline.matterRef}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className={cn(
            "text-xs font-medium",
            isOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
          )}>
            {isOverdue ? "Vencido" : format(deadline.date, "HH:mm", { locale: es })}
          </span>
          <Badge variant="outline" className="text-xs capitalize">
            {deadline.priority === 'critical' ? 'Crítico' : 
             deadline.priority === 'high' ? 'Alto' : 
             deadline.priority === 'medium' ? 'Medio' : 'Bajo'}
          </Badge>
        </div>
      </div>
    </div>
  );

  if (deadline.matterId) {
    return <Link to={`/app/docket/${deadline.matterId}`}>{content}</Link>;
  }
  return content;
}
