// =============================================
// COMPONENTE: DeadlineCalendar
// Calendario compacto con expansión a modal
// =============================================

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, AlertCircle, Maximize2 } from 'lucide-react';
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
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());

  // Próximos 7 días para vista compacta
  const next7Days = useMemo(() => {
    return eachDayOfInterval({ 
      start: new Date(), 
      end: addDays(new Date(), 6) 
    });
  }, []);

  // Plazos próximos (ordenados)
  const upcomingDeadlines = useMemo(() => {
    return deadlines
      .filter(d => d.date >= new Date() || isToday(d.date))
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .slice(0, 5);
  }, [deadlines]);

  return (
    <>
      {/* Vista Compacta */}
      <Card className="h-full">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendario
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 gap-1 text-xs"
              onClick={() => setIsExpanded(true)}
            >
              <Maximize2 className="h-3.5 w-3.5" />
              Ampliar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Mini calendario semanal */}
          <div className="grid grid-cols-7 gap-1 mb-3">
            {next7Days.map(day => {
              const dayDeadlines = deadlines.filter(d => isSameDay(d.date, day));
              const hasCritical = dayDeadlines.some(d => d.priority === 'critical');
              const hasHigh = dayDeadlines.some(d => d.priority === 'high');
              
              return (
                <div 
                  key={day.toISOString()} 
                  className={cn(
                    "text-center p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-muted",
                    isToday(day) && "bg-primary/10 ring-1 ring-primary"
                  )}
                  onClick={() => {
                    setCurrentDate(day);
                    setIsExpanded(true);
                  }}
                >
                  <div className="text-[10px] text-muted-foreground uppercase">
                    {format(day, 'EEE', { locale: es })}
                  </div>
                  <div className={cn(
                    "text-sm font-medium",
                    isToday(day) && "text-primary"
                  )}>
                    {format(day, 'd')}
                  </div>
                  {dayDeadlines.length > 0 && (
                    <div className="flex justify-center gap-0.5 mt-0.5">
                      {dayDeadlines.slice(0, 3).map((_, i) => (
                        <span 
                          key={i} 
                          className={cn(
                            "w-1.5 h-1.5 rounded-full",
                            hasCritical ? PRIORITY_COLORS.critical : 
                            hasHigh ? PRIORITY_COLORS.high : PRIORITY_COLORS.medium
                          )} 
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Lista compacta de próximos plazos */}
          {upcomingDeadlines.length > 0 ? (
            <div className="space-y-1.5">
              {upcomingDeadlines.slice(0, 3).map(deadline => (
                <CompactDeadlineItem key={deadline.id} deadline={deadline} />
              ))}
              {upcomingDeadlines.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="w-full text-xs h-7"
                  onClick={() => setIsExpanded(true)}
                >
                  Ver {upcomingDeadlines.length - 3} más
                </Button>
              )}
            </div>
          ) : (
            <div className="text-center py-3 text-sm text-muted-foreground">
              Sin plazos próximos
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal Expandido */}
      <ExpandedCalendarModal 
        open={isExpanded} 
        onOpenChange={setIsExpanded}
        deadlines={deadlines}
        initialDate={currentDate}
      />
    </>
  );
}

// =============================================
// Item compacto de deadline
// =============================================

function CompactDeadlineItem({ deadline }: { deadline: CalendarDeadline }) {
  const isOverdue = isPast(deadline.date) && !isToday(deadline.date);
  
  const content = (
    <div className={cn(
      "flex items-center gap-2 p-2 rounded-md text-sm transition-colors",
      PRIORITY_BG[deadline.priority],
      deadline.matterId && "hover:opacity-80 cursor-pointer"
    )}>
      <span className={cn("w-2 h-2 rounded-full shrink-0", PRIORITY_COLORS[deadline.priority])} />
      <span className="truncate flex-1 font-medium">{deadline.title}</span>
      <span className={cn(
        "text-xs shrink-0",
        isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"
      )}>
        {isToday(deadline.date) ? 'Hoy' : format(deadline.date, 'd MMM', { locale: es })}
      </span>
    </div>
  );

  if (deadline.matterId) {
    return <Link to={`/app/docket/${deadline.matterId}`}>{content}</Link>;
  }
  return content;
}

// =============================================
// Modal con calendario completo
// =============================================

type ViewMode = 'day' | 'week' | 'month';

function ExpandedCalendarModal({ 
  open, 
  onOpenChange, 
  deadlines,
  initialDate 
}: { 
  open: boolean; 
  onOpenChange: (open: boolean) => void;
  deadlines: CalendarDeadline[];
  initialDate: Date;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [currentDate, setCurrentDate] = useState(initialDate);

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5 text-primary" />
              Calendario de Plazos
            </DialogTitle>
            <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
              <TabsList className="h-8">
                <TabsTrigger value="day" className="text-xs px-3">Día</TabsTrigger>
                <TabsTrigger value="week" className="text-xs px-3">Semana</TabsTrigger>
                <TabsTrigger value="month" className="text-xs px-3">Mes</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => navigate('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-xs ml-2" onClick={goToToday}>
                Hoy
              </Button>
            </div>
            <span className="text-sm font-medium capitalize">{getTitle()}</span>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto pt-2">
          {viewMode === 'day' && (
            <DayView date={currentDate} deadlines={deadlines} />
          )}
          {viewMode === 'week' && (
            <WeekView startDate={range.start} endDate={range.end} deadlines={deadlines} />
          )}
          {viewMode === 'month' && (
            <MonthView currentDate={currentDate} deadlines={deadlines} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =============================================
// Vista Diaria
// =============================================

function DayView({ date, deadlines }: { date: Date; deadlines: CalendarDeadline[] }) {
  const dayDeadlines = deadlines.filter(d => isSameDay(d.date, date));

  if (dayDeadlines.length === 0) {
    return (
      <div className="text-center py-12">
        <CalendarIcon className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
        <p className="text-muted-foreground">Sin plazos para este día</p>
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
    <div className="grid grid-cols-7 gap-2">
      {/* Headers */}
      {days.map(day => (
        <div 
          key={day.toISOString()} 
          className={cn(
            "text-center py-2 rounded-lg",
            isToday(day) && "bg-primary text-primary-foreground"
          )}
        >
          <div className="text-xs font-medium">{format(day, 'EEE', { locale: es })}</div>
          <div className="text-lg font-bold">{format(day, 'd')}</div>
        </div>
      ))}
      {/* Deadline cells */}
      {days.map(day => {
        const dayDeadlines = deadlines.filter(d => isSameDay(d.date, day));
        return (
          <div 
            key={`cell-${day.toISOString()}`} 
            className={cn(
              "min-h-[120px] p-2 rounded-lg border",
              isToday(day) ? "border-primary/50 bg-primary/5" : "border-border",
              isPast(day) && !isToday(day) && "opacity-60"
            )}
          >
            {dayDeadlines.map(deadline => (
              <WeekDeadlineItem key={deadline.id} deadline={deadline} />
            ))}
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
        "text-xs p-1.5 rounded mb-1 border cursor-pointer hover:opacity-80",
        PRIORITY_BG[deadline.priority]
      )}
      title={deadline.title}
    >
      <div className="flex items-center gap-1">
        <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", PRIORITY_COLORS[deadline.priority])} />
        <span className="truncate">{deadline.title}</span>
      </div>
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
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div key={day} className="text-center text-xs font-medium text-muted-foreground py-2">
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
                "min-h-[70px] p-1.5 rounded-lg text-center",
                isCurrentMonth ? "bg-muted/30" : "bg-muted/10 opacity-50",
                isToday(day) && "ring-2 ring-primary ring-offset-2"
              )}
            >
              <div className={cn(
                "text-sm font-medium mb-1",
                isToday(day) && "text-primary"
              )}>
                {format(day, 'd')}
              </div>
              {dayDeadlines.length > 0 && (
                <div className="flex flex-wrap justify-center gap-0.5">
                  {dayDeadlines.slice(0, 4).map(deadline => (
                    <span 
                      key={deadline.id} 
                      className={cn("w-2 h-2 rounded-full", PRIORITY_COLORS[deadline.priority])}
                      title={deadline.title}
                    />
                  ))}
                  {dayDeadlines.length > 4 && (
                    <span className="text-[10px] text-muted-foreground">+{dayDeadlines.length - 4}</span>
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
// Item de deadline completo
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
        <p className="font-medium text-sm">{deadline.title}</p>
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
