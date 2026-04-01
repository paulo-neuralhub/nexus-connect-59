// ============================================================
// Plazos — Lista Tab: sortable table with urgency, type badges, filters
// ============================================================

import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { differenceInDays, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { CheckCircle, Eye, Search, ArrowUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { MatterDeadline } from '@/hooks/useDeadlines';
import { DEADLINE_TYPE_CONFIG, getUrgencyLevel, URGENCY_COLORS } from './plazos-utils';

interface PlazosListTabProps {
  deadlines: MatterDeadline[];
  isLoading: boolean;
  onComplete: (id: string) => void;
  onExtend: (id: string, newDate: string, reason?: string) => void;
  initialFilter?: string;
}

export function PlazosListTab({ deadlines, isLoading, onComplete, onExtend, initialFilter }: PlazosListTabProps) {
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [urgencyFilter, setUrgencyFilter] = useState(initialFilter || 'all');
  const [sortField, setSortField] = useState<'deadline_date' | 'priority'>('deadline_date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const filtered = useMemo(() => {
    let result = [...deadlines];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(d =>
        d.title?.toLowerCase().includes(q) ||
        d.matter?.title?.toLowerCase().includes(q) ||
        d.matter?.reference?.toLowerCase().includes(q)
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      result = result.filter(d => d.deadline_type === typeFilter);
    }

    // Urgency filter
    if (urgencyFilter !== 'all') {
      result = result.filter(d => {
        const days = differenceInDays(new Date(d.deadline_date), new Date());
        if (urgencyFilter === 'overdue') return days < 0;
        if (urgencyFilter === 'today') return days === 0;
        if (urgencyFilter === 'urgent') return days >= 1 && days <= 3;
        if (urgencyFilter === 'week') return days >= 4 && days <= 7;
        if (urgencyFilter === 'month') return days >= 8 && days <= 30;
        return true;
      });
    }

    // Sort
    result.sort((a, b) => {
      if (sortField === 'deadline_date') {
        const diff = new Date(a.deadline_date).getTime() - new Date(b.deadline_date).getTime();
        return sortDir === 'asc' ? diff : -diff;
      }
      const po: Record<string, number> = { critical: 0, high: 1, normal: 2, low: 3 };
      const diff = (po[a.priority || 'normal'] ?? 2) - (po[b.priority || 'normal'] ?? 2);
      return sortDir === 'asc' ? diff : -diff;
    });

    return result;
  }, [deadlines, search, typeFilter, urgencyFilter, sortField, sortDir]);

  const toggleSort = (field: 'deadline_date' | 'priority') => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map(i => (
          <div key={i} className="h-14 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (deadlines.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <span className="text-4xl mb-3">🎉</span>
        <p className="text-lg font-medium text-foreground">Sin plazos pendientes</p>
        <p className="text-sm text-muted-foreground">Tu portafolio está al día.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por título, expediente..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos los tipos</SelectItem>
            <SelectItem value="office_action">Respuesta Oficina</SelectItem>
            <SelectItem value="opposition">Oposición</SelectItem>
            <SelectItem value="opposition_response">Resp. Oposición</SelectItem>
            <SelectItem value="renewal">Renovación</SelectItem>
            <SelectItem value="paris_priority">Prioridad Paris</SelectItem>
            <SelectItem value="maintenance_fee">Tasa Mantenimiento</SelectItem>
            <SelectItem value="grace_period">Gracia</SelectItem>
            <SelectItem value="cancellation">Cancelación</SelectItem>
            <SelectItem value="publication">Publicación</SelectItem>
          </SelectContent>
        </Select>
        <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Urgencia" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="overdue">🔴 Vencidos</SelectItem>
            <SelectItem value="today">🔴 Hoy</SelectItem>
            <SelectItem value="urgent">🟠 1-3 días</SelectItem>
            <SelectItem value="week">🟡 4-7 días</SelectItem>
            <SelectItem value="month">🟢 8-30 días</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Urgencia</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Expediente</TableHead>
              <TableHead className="hidden lg:table-cell">Jurisdicción</TableHead>
              <TableHead>
                <button onClick={() => toggleSort('deadline_date')} className="flex items-center gap-1 hover:text-foreground transition-colors">
                  Vencimiento
                  <ArrowUpDown className="h-3 w-3" />
                </button>
              </TableHead>
              <TableHead>Días</TableHead>
              <TableHead className="text-right">Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No se encontraron plazos con los filtros seleccionados
                </TableCell>
              </TableRow>
            ) : (
              filtered.map(d => <DeadlineTableRow key={d.id} deadline={d} onComplete={onComplete} />)
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground text-right">
        Mostrando {filtered.length} de {deadlines.length} plazos
      </p>
    </div>
  );
}

function DeadlineTableRow({ deadline: d, onComplete }: { deadline: MatterDeadline; onComplete: (id: string) => void }) {
  const days = differenceInDays(new Date(d.deadline_date), new Date());
  const urgency = getUrgencyLevel(days);
  const typeConf = DEADLINE_TYPE_CONFIG[d.deadline_type] || DEADLINE_TYPE_CONFIG.default;
  const isOverdue = days < 0;

  return (
    <TableRow className={cn(isOverdue && "bg-destructive/5 font-semibold")}>
      {/* Urgency dot */}
      <TableCell>
        <div className="flex justify-center">
          <span
            className={cn("h-3 w-3 rounded-full", isOverdue && "animate-pulse")}
            style={{ backgroundColor: URGENCY_COLORS[urgency] }}
          />
        </div>
      </TableCell>

      {/* Type badge */}
      <TableCell>
        <Badge
          variant="outline"
          className="text-[10px] font-medium whitespace-nowrap"
          style={{ borderColor: typeConf.color, color: typeConf.color }}
        >
          {typeConf.label}
        </Badge>
      </TableCell>

      {/* Matter */}
      <TableCell>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{d.title}</p>
          {d.matter && (
            <Link
              to={`/app/expedientes/${d.matter.id}?tab=plazos`}
              className="text-xs text-primary hover:underline truncate block"
            >
              {d.matter.reference || d.matter.title}
            </Link>
          )}
        </div>
      </TableCell>

      {/* Jurisdiction */}
      <TableCell className="hidden lg:table-cell">
        {d.matter?.jurisdiction ? (
          <span className="text-xs text-muted-foreground">{d.matter.jurisdiction}</span>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Date */}
      <TableCell>
        <span className="text-sm">{format(new Date(d.deadline_date), 'd MMM yyyy', { locale: es })}</span>
      </TableCell>

      {/* Days */}
      <TableCell>
        {isOverdue ? (
          <span className="text-xs font-bold text-destructive">Vencido hace {Math.abs(days)}d</span>
        ) : days === 0 ? (
          <span className="text-xs font-bold text-destructive">HOY</span>
        ) : (
          <span className="text-xs text-muted-foreground">{days} días</span>
        )}
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          {d.matter && (
            <Button variant="ghost" size="icon" asChild className="h-7 w-7">
              <Link to={`/app/expedientes/${d.matter.id}?tab=plazos`}>
                <Eye className="h-3.5 w-3.5" />
              </Link>
            </Button>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
            onClick={() => onComplete(d.id)}
            title="Completar"
          >
            <CheckCircle className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}
