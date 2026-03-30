/**
 * Timesheet Page — Enhanced
 * Weekly calendar view + List view with multi-select for invoicing
 * P57: Time Tracking Module with NeoBadge KPIs
 * PHASE 3: IP Activity types, integrated timer, list view
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  eachDayOfInterval,
  isSameDay,
  startOfMonth,
  endOfMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar,
  List,
  LayoutGrid,
  Play,
  Square,
  FileText,
  Download,
} from 'lucide-react';
import {
  useWeeklyTimeEntries,
  useTimeEntries,
  TimeEntry,
} from '@/hooks/timetracking';
import { AddTimeEntryDialog, TimeEntryRow } from '@/components/timetracking';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

// IP-specific activity type colors for calendar blocks
const ACTIVITY_COLORS: Record<string, string> = {
  filing: 'bg-blue-200 border-blue-400 text-blue-800',
  research: 'bg-violet-200 border-violet-400 text-violet-800',
  correspondence: 'bg-emerald-200 border-emerald-400 text-emerald-800',
  email: 'bg-emerald-200 border-emerald-400 text-emerald-800',
  meeting: 'bg-amber-200 border-amber-400 text-amber-800',
  translation: 'bg-pink-200 border-pink-400 text-pink-800',
  review: 'bg-orange-200 border-orange-400 text-orange-800',
  drafting: 'bg-orange-200 border-orange-400 text-orange-800',
  court: 'bg-red-200 border-red-400 text-red-800',
  call: 'bg-teal-200 border-teal-400 text-teal-800',
  travel: 'bg-gray-200 border-gray-400 text-gray-800',
  admin: 'bg-slate-200 border-slate-400 text-slate-800',
  other: 'bg-gray-200 border-gray-400 text-gray-700',
  general: 'bg-gray-200 border-gray-400 text-gray-700',
};

const ACTIVITY_LABELS: Record<string, string> = {
  filing: 'Presentación',
  research: 'Investigación',
  correspondence: 'Correspondencia',
  email: 'Email',
  meeting: 'Reunión',
  translation: 'Traducción',
  review: 'Revisión',
  drafting: 'Redacción',
  court: 'Vista oral',
  call: 'Llamada',
  travel: 'Desplazamiento',
  admin: 'Administrativo',
  other: 'Otro',
  general: 'General',
};

// KPI colors
const TIME_COLORS: Record<string, string> = {
  total: '#2563eb',
  billable: '#10b981',
  billed: '#8b5cf6',
  pending: '#f59e0b',
};

type ViewMode = 'week' | 'list';

export default function TimesheetPage() {
  const navigate = useNavigate();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [editEntry, setEditEntry] = useState<TimeEntry | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('week');
  const [selectedEntries, setSelectedEntries] = useState<Set<string>>(new Set());

  const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  // Weekly entries for calendar
  const { data: weekEntries = [], isLoading: weekLoading } = useWeeklyTimeEntries(weekStart);

  // Monthly entries for KPIs
  const monthStart = startOfMonth(new Date());
  const monthEnd = endOfMonth(new Date());
  const { data: monthEntries = [] } = useTimeEntries({
    startDate: monthStart,
    endDate: monthEnd,
  });

  // Group entries by day for weekly view
  const entriesByDay = weekDays.map(day => ({
    date: day,
    entries: weekEntries.filter(e => isSameDay(new Date(e.date), day)),
  }));

  // Monthly KPIs
  const totalMinutesMonth = monthEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const billableMinutesMonth = monthEntries.filter(e => e.is_billable).reduce((sum, e) => sum + e.duration_minutes, 0);
  const billedMinutesMonth = monthEntries.filter(e => e.billing_status === 'billed').reduce((sum, e) => sum + e.duration_minutes, 0);
  const pendingMinutesMonth = billableMinutesMonth - billedMinutesMonth;

  // Weekly totals
  const totalMinutes = weekEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const billableMinutes = weekEntries.filter(e => e.is_billable).reduce((sum, e) => sum + e.duration_minutes, 0);

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}h ${m}m`;
  };

  const formatDurationShort = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    if (h === 0 && m === 0) return '0h';
    if (h === 0) return `${m}m`;
    if (m === 0) return `${h}h`;
    return `${h}:${m.toString().padStart(2, '0')}`;
  };

  const goToPreviousWeek = () => setWeekStart(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setWeekStart(prev => addWeeks(prev, 1));
  const goToToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  const handleAddEntry = (date?: Date) => {
    setEditEntry(null);
    setSelectedDate(date || null);
    setDialogOpen(true);
  };

  const handleEditEntry = (entry: TimeEntry) => {
    setEditEntry(entry);
    setDialogOpen(true);
  };

  const toggleSelectEntry = (id: string) => {
    setSelectedEntries(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const billable = weekEntries.filter(e => e.is_billable && e.billing_status !== 'billed');
    if (selectedEntries.size === billable.length) {
      setSelectedEntries(new Set());
    } else {
      setSelectedEntries(new Set(billable.map(e => e.id)));
    }
  };

  const handleCreateInvoice = () => {
    if (selectedEntries.size === 0) return;
    const entryIds = Array.from(selectedEntries).join(',');
    navigate(`/app/finance/invoices/new?time_entries=${entryIds}`);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Timesheet</h1>
          <p className="text-muted-foreground">
            Registro y gestión de tiempo dedicado a expedientes
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedEntries.size > 0 && (
            <Button variant="outline" onClick={handleCreateInvoice}>
              <FileText className="h-4 w-4 mr-2" />
              Crear factura ({selectedEntries.size})
            </Button>
          )}
          <Button onClick={() => handleAddEntry()}>
            <Plus className="h-4 w-4 mr-2" />
            Nueva entrada
          </Button>
        </div>
      </div>

      {/* Monthly KPIs with NeoBadge */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard label="Horas este mes" value={formatDurationShort(totalMinutesMonth)} color={TIME_COLORS.total} />
        <StatCard label="Facturables" value={formatDurationShort(billableMinutesMonth)} color={TIME_COLORS.billable} />
        <StatCard label="Facturadas" value={formatDurationShort(billedMinutesMonth)} color={TIME_COLORS.billed} />
        <StatCard label="Pendientes" value={formatDurationShort(pendingMinutesMonth)} color={pendingMinutesMonth > 0 ? TIME_COLORS.pending : '#94a3b8'} />
      </div>

      {/* View Toggle + Week Navigation */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" onClick={goToToday}>Hoy</Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="ml-2 gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="font-medium text-foreground">
                  {format(weekStart, "d MMM", { locale: es })} – {format(weekEnd, "d MMM yyyy", { locale: es })}
                </span>
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <DayPickerCalendar
                mode="single"
                selected={weekStart}
                onSelect={(date) => {
                  if (date) setWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
                }}
                initialFocus
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Badge variant="secondary" className="text-xs">
            {formatDuration(totalMinutes)}
          </Badge>
        </div>
        <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as ViewMode)}>
          <TabsList>
            <TabsTrigger value="week" className="gap-1">
              <LayoutGrid className="h-3.5 w-3.5" />
              Semanal
            </TabsTrigger>
            <TabsTrigger value="list" className="gap-1">
              <List className="h-3.5 w-3.5" />
              Lista
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Weekly Calendar View */}
      {viewMode === 'week' && (
        <Card>
          <CardContent className="p-0">
            {weekLoading ? (
              <div className="p-6 space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-12" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-7 divide-x min-h-[400px]">
                {entriesByDay.map(({ date, entries: dayEntries }) => {
                  const dayMinutes = dayEntries.reduce((sum, e) => sum + e.duration_minutes, 0);
                  const isToday = isSameDay(date, new Date());

                  return (
                    <div
                      key={date.toISOString()}
                      className={cn(
                        'flex flex-col min-h-[400px]',
                        isToday && 'bg-primary/[0.03]'
                      )}
                    >
                      {/* Day header */}
                      <div className={cn(
                        'p-2 border-b text-center',
                        isToday && 'bg-primary/10'
                      )}>
                        <div className={cn(
                          'text-xs font-medium uppercase',
                          isToday ? 'text-primary' : 'text-muted-foreground'
                        )}>
                          {format(date, 'EEE', { locale: es })}
                        </div>
                        <div className={cn(
                          'text-lg font-semibold',
                          isToday ? 'text-primary' : 'text-foreground'
                        )}>
                          {format(date, 'd')}
                        </div>
                        {dayMinutes > 0 && (
                          <div className="text-[10px] text-muted-foreground">
                            {formatDuration(dayMinutes)}
                          </div>
                        )}
                      </div>

                      {/* Time blocks */}
                      <div className="flex-1 p-1 space-y-1 overflow-y-auto">
                        {dayEntries.map(entry => {
                          const actColor = ACTIVITY_COLORS[entry.activity_type || 'general'] || ACTIVITY_COLORS.general;
                          return (
                            <button
                              key={entry.id}
                              onClick={() => handleEditEntry(entry)}
                              className={cn(
                                'w-full text-left rounded-md border px-1.5 py-1 text-[10px] leading-tight transition-opacity hover:opacity-80 cursor-pointer',
                                actColor
                              )}
                              title={`${entry.description}\n${formatDuration(entry.duration_minutes)} • ${entry.matter?.reference || ''}`}
                            >
                              <div className="font-medium truncate">
                                {entry.matter?.reference || 'Sin exp.'}
                              </div>
                              <div className="truncate opacity-80">{entry.description}</div>
                              <div className="flex items-center justify-between mt-0.5">
                                <span>{formatDuration(entry.duration_minutes)}</span>
                                {entry.is_billable && (
                                  <span className="text-[8px] font-semibold">€</span>
                                )}
                              </div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Add button at bottom */}
                      <div className="p-1 border-t">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full h-7 text-xs text-muted-foreground"
                          onClick={() => handleAddEntry(date)}
                        >
                          <Plus className="h-3 w-3 mr-1" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* List View with multi-select */}
      {viewMode === 'list' && (
        <Card>
          <CardContent className="p-0">
            {weekLoading ? (
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
                      <TableHead className="w-10">
                        <Checkbox
                          checked={
                            selectedEntries.size > 0 &&
                            selectedEntries.size === weekEntries.filter(e => e.is_billable && e.billing_status !== 'billed').length
                          }
                          onCheckedChange={toggleSelectAll}
                        />
                      </TableHead>
                      <TableHead className="w-28">Día</TableHead>
                      <TableHead>Expediente</TableHead>
                      <TableHead>Actividad</TableHead>
                      <TableHead>Descripción</TableHead>
                      <TableHead className="text-center w-20">Duración</TableHead>
                      <TableHead className="text-center w-20">Facturable</TableHead>
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
                          <TableCell colSpan={8} className="py-2">
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
                            <Button variant="ghost" size="sm" onClick={() => handleAddEntry(date)}>
                              <Plus className="h-3 w-3 mr-1" />
                              Añadir
                            </Button>
                          </TableCell>
                        </TableRow>
                        {/* Entry rows */}
                        {dayEntries.length > 0 ? (
                          dayEntries.map(entry => {
                            const canSelect = entry.is_billable && entry.billing_status !== 'billed';
                            return (
                              <TableRow key={entry.id}>
                                <TableCell>
                                  {canSelect && (
                                    <Checkbox
                                      checked={selectedEntries.has(entry.id)}
                                      onCheckedChange={() => toggleSelectEntry(entry.id)}
                                    />
                                  )}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {format(new Date(entry.date), 'd MMM', { locale: es })}
                                </TableCell>
                                <TableCell>
                                  <span className="text-sm font-medium">{entry.matter?.reference || '-'}</span>
                                </TableCell>
                                <TableCell>
                                  {entry.activity_type && (
                                    <Badge variant="secondary" className={cn('text-[10px]', ACTIVITY_COLORS[entry.activity_type])}>
                                      {ACTIVITY_LABELS[entry.activity_type] || entry.activity_type}
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="max-w-[200px] truncate text-sm">
                                  {entry.description}
                                </TableCell>
                                <TableCell className="text-center text-sm font-medium">
                                  {formatDuration(entry.duration_minutes)}
                                </TableCell>
                                <TableCell className="text-center">
                                  {entry.is_billable ? (
                                    <Badge variant="secondary" className="text-xs bg-green-100 text-green-700">Sí</Badge>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">No</span>
                                  )}
                                </TableCell>
                                <TableCell className="text-center text-sm font-medium">
                                  {entry.is_billable && entry.billing_rate ? (
                                    <span className="text-green-600">
                                      {((entry.duration_minutes / 60) * entry.billing_rate).toFixed(0)}€
                                    </span>
                                  ) : '-'}
                                </TableCell>
                                <TableCell>
                                  <StatusBadge status={entry.billing_status} />
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-7 text-xs"
                                    onClick={() => handleEditEntry(entry)}
                                  >
                                    Editar
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={10} className="text-center text-muted-foreground py-4 text-sm">
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
      )}

      {/* Add/Edit Entry Dialog */}
      <AddTimeEntryDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        defaultDate={selectedDate}
      />
    </div>
  );
}

// --- Sub-components ---

function StatCard({ label, value, color }: { label: string; value: number | string; color: string }) {
  const numericValue = typeof value === 'number' ? value : 0;
  const hasValue = numericValue > 0 || (typeof value === 'string' && !value.includes('0h') && !value.includes('0m') && value !== '€0');

  return (
    <Card
      className="border border-black/[0.06] rounded-[14px] hover:border-[rgba(0,180,216,0.15)] transition-colors"
      style={{ background: '#f1f4f9' }}
    >
      <CardContent className="pt-4">
        <div className="flex items-center gap-3">
          <NeoBadge
            value={value}
            color={hasValue ? color : '#94a3b8'}
            size="md"
          />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: '#0a2540' }}>
              {label}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

const STATUS_CONFIG: Record<string, { label: string; classes: string }> = {
  draft: { label: 'Borrador', classes: 'bg-gray-100 text-gray-700' },
  submitted: { label: 'Enviado', classes: 'bg-blue-100 text-blue-700' },
  approved: { label: 'Aprobado', classes: 'bg-green-100 text-green-700' },
  rejected: { label: 'Rechazado', classes: 'bg-red-100 text-red-700' },
  billed: { label: 'Facturado', classes: 'bg-purple-100 text-purple-700' },
};

function StatusBadge({ status }: { status: string }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <Badge variant="secondary" className={cn('text-xs', config.classes)}>
      {config.label}
    </Badge>
  );
}
