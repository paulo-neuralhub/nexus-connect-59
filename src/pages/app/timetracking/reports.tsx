/**
 * Time Tracking Reports Page
 * P57: Time Tracking Module
 */

import { useState } from 'react';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  BarChart3,
  Calendar as CalendarIcon,
  Download,
  Clock,
  DollarSign,
  Users,
  Briefcase,
} from 'lucide-react';
import { useTimeEntries, TimeEntry } from '@/hooks/timetracking';
import { cn } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

export default function TimeReportsPage() {
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
  });
  const [groupBy, setGroupBy] = useState<'matter' | 'user' | 'activity'>('matter');

  const { data: entries = [], isLoading } = useTimeEntries({
    startDate: dateRange.from,
    endDate: dateRange.to,
  });

  // Calculate totals
  const totalMinutes = entries.reduce((sum, e) => sum + e.duration_minutes, 0);
  const billableMinutes = entries.filter(e => e.is_billable).reduce((sum, e) => sum + e.duration_minutes, 0);
  const totalAmount = entries.filter(e => e.is_billable && e.billing_rate)
    .reduce((sum, e) => sum + (e.duration_minutes / 60) * (e.billing_rate || 0), 0);

  // Group data for charts
  const groupedData = () => {
    const groups: Record<string, { name: string; minutes: number; amount: number }> = {};
    
    entries.forEach(entry => {
      let key = '';
      let name = '';
      
      switch (groupBy) {
        case 'matter':
          key = entry.matter_id;
          name = entry.matter?.reference || 'Sin expediente';
          break;
        case 'user':
          key = entry.user_id;
          name = entry.user?.full_name || 'Usuario';
          break;
        case 'activity':
          key = entry.activity_type || 'other';
          name = ACTIVITY_LABELS[entry.activity_type || 'other'] || 'Otro';
          break;
      }

      if (!groups[key]) {
        groups[key] = { name, minutes: 0, amount: 0 };
      }
      groups[key].minutes += entry.duration_minutes;
      if (entry.is_billable && entry.billing_rate) {
        groups[key].amount += (entry.duration_minutes / 60) * entry.billing_rate;
      }
    });

    return Object.values(groups)
      .sort((a, b) => b.minutes - a.minutes)
      .slice(0, 10);
  };

  const chartData = groupedData();

  const formatDuration = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h ${m}m`;
  };

  // Quick date range presets
  const setPreset = (preset: string) => {
    const today = new Date();
    switch (preset) {
      case 'week':
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case 'month':
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'quarter':
        setDateRange({ from: subDays(today, 90), to: today });
        break;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reportes de Tiempo</h1>
          <p className="text-muted-foreground">
            Análisis del tiempo registrado
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Período:</span>
              <div className="flex gap-1">
                <Button variant="outline" size="sm" onClick={() => setPreset('week')}>
                  7 días
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreset('month')}>
                  Mes
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPreset('quarter')}>
                  Trimestre
                </Button>
              </div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="sm">
                    <CalendarIcon className="h-4 w-4 mr-2" />
                    {format(dateRange.from, "d MMM", { locale: es })} - {format(dateRange.to, "d MMM", { locale: es })}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="range"
                    selected={{ from: dateRange.from, to: dateRange.to }}
                    onSelect={(range) => {
                      if (range?.from && range?.to) {
                        setDateRange({ from: range.from, to: range.to });
                      }
                    }}
                    locale={es}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Agrupar por:</span>
              <Select value={groupBy} onValueChange={(v) => setGroupBy(v as any)}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="matter">Expediente</SelectItem>
                  <SelectItem value="user">Usuario</SelectItem>
                  <SelectItem value="activity">Actividad</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total horas</p>
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
                <DollarSign className="h-4 w-4 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Importe total</p>
                <p className="text-xl font-bold">{totalAmount.toFixed(2)}€</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                <BarChart3 className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">% Facturable</p>
                <p className="text-xl font-bold">
                  {totalMinutes > 0 ? Math.round((billableMinutes / totalMinutes) * 100) : 0}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Horas por {groupBy === 'matter' ? 'Expediente' : groupBy === 'user' ? 'Usuario' : 'Actividad'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tickFormatter={(v) => `${(v / 60).toFixed(1)}h`} />
                  <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number) => formatDuration(value)}
                    labelFormatter={(label) => label}
                  />
                  <Bar dataKey="minutes" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Distribución</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartData}
                    dataKey="minutes"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {chartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatDuration(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Entries Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detalle por {groupBy === 'matter' ? 'Expediente' : groupBy === 'user' ? 'Usuario' : 'Actividad'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div 
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[idx % COLORS.length] }}
                  />
                  <span className="font-medium">{item.name}</span>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <span>{formatDuration(item.minutes)}</span>
                  <span className="text-muted-foreground">{item.amount.toFixed(2)}€</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ACTIVITY_LABELS: Record<string, string> = {
  research: 'Investigación',
  drafting: 'Redacción',
  review: 'Revisión',
  meeting: 'Reunión',
  call: 'Llamada',
  email: 'Email',
  filing: 'Presentación',
  court: 'Tribunal',
  travel: 'Desplazamiento',
  admin: 'Administrativo',
  other: 'Otro',
};
