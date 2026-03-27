import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useOrganization } from '@/hooks/useOrganization';
import { useQuery } from '@tanstack/react-query';
import { useBriefingPDF } from '@/hooks/useBriefingPDF';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from '@/components/ui/sheet';
import { HeroBriefing } from '@/components/briefing/HeroBriefing';
import {
  ArrowLeft, ArrowRight, CalendarDays, AlertTriangle,
  Check, Circle, Search, Loader2, Clock, Download,
} from 'lucide-react';
import { format, subDays } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover, PopoverContent, PopoverTrigger,
} from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';

/* ── helpers ── */
function calcHealthScore(urgent: number, total: number) {
  return Math.max(0, 100 - urgent * 15 - total * 3);
}

function healthColor(score: number) {
  if (score >= 70) return '#22C55E';
  if (score >= 40) return '#EAB308';
  return '#EF4444';
}

function healthBg(score: number) {
  if (score >= 70) return 'rgba(34,197,94,0.15)';
  if (score >= 40) return 'rgba(234,179,8,0.15)';
  return 'rgba(239,68,68,0.15)';
}

/* ── main ── */
const BriefingHistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { organizationId } = useOrganization();

  const [dateFrom, setDateFrom] = useState<Date>(subDays(new Date(), 30));
  const [dateTo, setDateTo] = useState<Date>(new Date());
  const [onlyUnread, setOnlyUnread] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedBriefing, setSelectedBriefing] = useState<any>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const { download: downloadPDF } = useBriefingPDF();

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['briefing-history', organizationId, dateFrom.toISOString(), dateTo.toISOString()],
    enabled: !!organizationId,
    queryFn: async () => {
      const { data } = await (supabase as any)
        .from('genius_daily_briefings')
        .select('id, briefing_date, content_json, total_items, urgent_items, was_read, read_at, model_used, generation_seconds, created_at')
        .eq('organization_id', organizationId)
        .gte('briefing_date', format(dateFrom, 'yyyy-MM-dd'))
        .lte('briefing_date', format(dateTo, 'yyyy-MM-dd'))
        .order('briefing_date', { ascending: false });
      return (data || []) as any[];
    },
  });

  /* derived */
  const filtered = useMemo(() => {
    let list = rows;
    if (onlyUnread) list = list.filter((r: any) => !r.was_read);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((r: any) => {
        const summary = r.content_json?.summary || '';
        return summary.toLowerCase().includes(q);
      });
    }
    return list;
  }, [rows, onlyUnread, search]);

  const stats = useMemo(() => {
    const total = rows.length;
    const read = rows.filter((r: any) => r.was_read).length;
    const avgItems = total ? Math.round(rows.reduce((s: number, r: any) => s + (r.total_items || 0), 0) / total) : 0;
    const avgHealth = total
      ? Math.round(rows.reduce((s: number, r: any) => s + calcHealthScore(r.urgent_items || 0, r.total_items || 0), 0) / total)
      : 0;
    const readPct = total ? Math.round((read / total) * 100) : 0;
    return { total, readPct, avgItems, avgHealth };
  }, [rows]);

  const today = format(new Date(), 'yyyy-MM-dd');

  const openDetail = (row: any) => {
    setSelectedBriefing(row);
    setSheetOpen(true);
  };

  /* ── render ── */
  return (
    <div className="min-h-full" style={{ background: '#EEF2F7' }}>
      {/* HEADER */}
      <div className="px-8 pt-8 pb-0">
        <div className="flex items-center gap-3 mb-1">
          <button
            onClick={() => navigate('/app/briefing')}
            className="inline-flex items-center justify-center rounded-xl transition-colors hover:bg-white/60"
            style={{ width: 36, height: 36, border: '1px solid rgba(0,0,0,0.06)' }}
          >
            <ArrowLeft className="w-4 h-4 text-muted-foreground" />
          </button>
          <div className="flex-1">
            <h1
              className="text-2xl font-bold tracking-tight"
              style={{ color: '#0A2540', fontFamily: "'Plus Jakarta Sans', sans-serif" }}
            >
              Morning Briefing — Histórico
            </h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Registro completo de análisis diarios
            </p>
          </div>
          <button
            onClick={() => navigate('/app/briefing')}
            className="inline-flex items-center gap-1.5 rounded-xl text-sm font-medium transition-colors hover:bg-white/60"
            style={{
              padding: '8px 16px',
              background: 'white',
              boxShadow: '4px 4px 10px #cdd1dc, -4px -4px 10px #ffffff',
              border: '1px solid rgba(0,0,0,0.06)',
              borderRadius: 11,
              color: '#64748B',
              fontSize: 13,
            }}
          >
            Hoy <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* STATS */}
        <div className="flex gap-3 mt-6 mb-5">
          <NeoBadge value={stats.total} label="Total" color="#3B82F6" size="lg" />
          <NeoBadge value={`${stats.readPct}%`} label="Leídos" color="#22C55E" size="lg" />
          <NeoBadge value={stats.avgItems} label="Avg items" color="#F59E0B" size="lg" />
          <NeoBadge value={stats.avgHealth} label="Health" color={healthColor(stats.avgHealth)} size="lg" />
        </div>

        {/* FILTERS */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          {/* Date from */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-xl text-xs"
                style={{
                  padding: '7px 14px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 11,
                  color: '#64748B',
                }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Desde: {format(dateFrom, 'dd MMM yyyy', { locale: es })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateFrom}
                onSelect={(d) => d && setDateFrom(d)}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <Popover>
            <PopoverTrigger asChild>
              <button
                className="inline-flex items-center gap-2 rounded-xl text-xs"
                style={{
                  padding: '7px 14px',
                  background: 'white',
                  border: '1px solid rgba(0,0,0,0.06)',
                  borderRadius: 11,
                  color: '#64748B',
                }}
              >
                <CalendarDays className="w-3.5 h-3.5" />
                Hasta: {format(dateTo, 'dd MMM yyyy', { locale: es })}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={dateTo}
                onSelect={(d) => d && setDateTo(d)}
                className="pointer-events-auto"
              />
            </PopoverContent>
          </Popover>

          <label className="inline-flex items-center gap-2 text-xs text-muted-foreground cursor-pointer select-none">
            <Switch checked={onlyUnread} onCheckedChange={setOnlyUnread} />
            Solo no leídos
          </label>

          <div className="relative ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              placeholder="Buscar en resúmenes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 w-56 h-8 text-xs"
              style={{ borderRadius: 11 }}
            />
          </div>
        </div>
      </div>

      {/* TABLE / CARDS */}
      <div className="px-8 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title="Sin briefings generados"
            description="El sistema genera un briefing automáticamente cada día a las 7:00"
          />
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden md:block rounded-2xl overflow-hidden"
              style={{ background: 'white', border: '1px solid rgba(0,0,0,0.06)' }}>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-black/[0.06]">
                    {['Fecha', 'Health', 'Items', 'Urgentes', 'Leído', 'Tiempo', ''].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-muted-foreground"
                        style={{ fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row: any) => {
                    const hs = calcHealthScore(row.urgent_items || 0, row.total_items || 0);
                    const isToday = row.briefing_date === today;
                    return (
                      <tr
                        key={row.id}
                        onClick={() => openDetail(row)}
                        className="border-b border-black/[0.04] cursor-pointer transition-colors hover:bg-slate-50"
                        style={isToday ? { borderLeft: '3px solid #3B82F6' } : undefined}
                      >
                        <td className="px-4 py-3 font-medium" style={{ color: '#0A2540', fontSize: 13 }}>
                          {format(new Date(row.briefing_date), "EEE dd MMM yyyy", { locale: es })}
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-xs font-bold"
                            style={{
                              background: healthBg(hs),
                              color: healthColor(hs),
                              border: `1px solid ${healthColor(hs)}40`,
                              fontVariantNumeric: 'tabular-nums',
                            }}>
                            {hs}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground" style={{ fontVariantNumeric: 'tabular-nums' }}>
                          {row.total_items ?? 0}
                        </td>
                        <td className="px-4 py-3">
                          {(row.urgent_items || 0) > 0 ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold" style={{ color: '#EF4444' }}>
                              <AlertTriangle className="w-3.5 h-3.5" /> {row.urgent_items}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">0</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {row.was_read ? (
                            <Check className="w-4 h-4" style={{ color: '#22C55E' }} />
                          ) : (
                            <Circle className="w-4 h-4 text-muted-foreground/40" />
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {row.generation_seconds != null ? (
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />{row.generation_seconds}s
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button
                            title="Descargar PDF de este briefing"
                            onClick={(e) => {
                              e.stopPropagation();
                              downloadPDF({
                                date: row.briefing_date,
                                contentJson: row.content_json || {},
                                totalItems: row.total_items || 0,
                                urgentItems: row.urgent_items || 0,
                              });
                            }}
                            className="inline-flex items-center gap-1 text-xs text-primary font-medium hover:underline"
                          >
                            <Download className="w-3.5 h-3.5" /> PDF
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="md:hidden flex flex-col gap-3">
              {filtered.map((row: any) => {
                const hs = calcHealthScore(row.urgent_items || 0, row.total_items || 0);
                const isToday = row.briefing_date === today;
                return (
                  <div
                    key={row.id}
                    onClick={() => openDetail(row)}
                    className="rounded-2xl p-4 cursor-pointer transition-colors hover:bg-slate-50"
                    style={{
                      background: 'white',
                      border: '1px solid rgba(0,0,0,0.06)',
                      borderLeft: isToday ? '3px solid #3B82F6' : undefined,
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold" style={{ color: '#0A2540' }}>
                        {format(new Date(row.briefing_date), "EEE dd MMM yyyy", { locale: es })}
                      </span>
                      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-bold"
                        style={{ background: healthBg(hs), color: healthColor(hs) }}>
                        {hs}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{row.total_items ?? 0} items</span>
                      {(row.urgent_items || 0) > 0 && (
                        <span className="flex items-center gap-1 font-semibold" style={{ color: '#EF4444' }}>
                          <AlertTriangle className="w-3 h-3" /> {row.urgent_items}
                        </span>
                      )}
                      {row.was_read ? (
                        <Check className="w-3.5 h-3.5" style={{ color: '#22C55E' }} />
                      ) : (
                        <Circle className="w-3.5 h-3.5 text-muted-foreground/40" />
                      )}
                      {row.generation_seconds != null && (
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{row.generation_seconds}s</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>

      {/* DETAIL SHEET */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="right" className="w-full sm:max-w-2xl overflow-y-auto p-0" style={{ background: '#EEF2F7' }}>
          <SheetHeader className="px-6 pt-6">
            <SheetTitle>
              {selectedBriefing
                ? format(new Date(selectedBriefing.briefing_date), "EEEE dd 'de' MMMM yyyy", { locale: es })
                : ''}
            </SheetTitle>
            <SheetDescription>Briefing completo del día</SheetDescription>
          </SheetHeader>
          {selectedBriefing?.content_json && (
            <div className="px-0">
              <HeroBriefing
                content={selectedBriefing.content_json}
                briefing={selectedBriefing}
                onRefresh={() => {}}
              />
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
};

export default BriefingHistoryPage;
