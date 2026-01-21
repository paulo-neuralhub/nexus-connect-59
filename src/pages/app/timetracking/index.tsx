/**
 * Timesheet Page
 * Weekly view for time entry management
 * P57: Time Tracking Module
 */

import { useState } from 'react';
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, eachDayOfInterval, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Calendar,
  DollarSign,
  TrendingUp,
} from 'lucide-react';
import { useWeeklyTimeEntries, TimeEntry } from '@/hooks/timetracking';
import { AddTimeEntryDialog, TimeEntryRow } from '@/components/timetracking';
import { cn } from '@/lib/utils';

export default function TimesheetPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const { data: entries = [], isLoading } = useWeeklyTimeEntries(weekStart);

  // Group entries by day
  const entriesByDay = weekDays.map(day => ({
    date: day,
    entries: entries.filter(e => isSameDay(new Date(e.date), day)),
  }));

  // Calculate totals
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const billableMinutes = entries.filter(e => e.is_billable).reduce((sum, e) => sum + e.duration_minutes, 0);
  const totalAmount = entries.filter(e => e.is_billable && e.billing_rate)
    .reduce((sum, e) => sum + (e.duration_minutes / 60) * (e.billing_rate || 0), 0);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  const goToPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleAddEntry = (date?: Date) => {
    setSelectedDate(date || null);
    setDialogOpen(true);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Timesheet</h1>
          <p className="text-muted-foreground">
            Registro y gestión de tiempo dedicado a expedientes
          </p>
        </div>
        <Button onClick={() => handleAddEntry()}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva entrada
        </Button>
      </div>

      {/* Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">
            {format(weekStart, "d MMM", { locale: es })} - {format(weekEnd, "d MMM yyyy", { locale: es })}
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tiempo total</p>
                <p className="text-xl font-bold">{formatDuration(totalMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                <DollarSign className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Facturable</p>
                <p className="text-xl font-bold">{formatDuration(billableMinutes)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/30">
                <TrendingUp className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Importe</p>
                <p className="text-xl font-bold">{totalAmount.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <Clock className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Entradas</p>
                <p className="text-xl font-bold">{entries.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Timesheet Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-32">Día</TableHead>
                    <TableHead>Expediente</TableHead>
                    <TableHead>Descripción</TableHead>
                    <TableHead className="text-center w-24">Duración</TableHead>
                    <TableHead className="text-center w-24">Facturable</TableHead>
                    <TableHead className="text-center w-24">Importe</TableHead>
                    <TableHead className="w-24">Estado</TableHead>
                    <TableHead className="w-16"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entriesByDay.map(({ date, entries: dayEntries }) => (
                    <>
                      {/* Day header row */}
                      <TableRow key={date.toISOString()} className="bg-muted/30 hover:bg-muted/30">
                        <TableCell colSpan={6} className="py-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className={cn(
                                "font-medium",
                                isSameDay(date, new Date()) && "text-primary"
                              )}>
                                {format(date, "EEEE d", { locale: es })}
                              </span>
                              {isSameDay(date, new Date()) && (
                                <Badge variant="secondary" className="text-xs">Hoy</Badge>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {formatDuration(dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0))}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell colSpan={2} className="py-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAddEntry(date)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Añadir
                          </Button>
                        </TableCell>
                      </TableRow>
                      {/* Entry rows */}
                      {dayEntries.length > 0 ? (
                        dayEntries.map(entry => (
                          <TimeEntryRow key={entry.id} entry={entry} />
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center text-muted-foreground py-4">
                            Sin entradas
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add Entry Dialog */}
      <AddTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}
