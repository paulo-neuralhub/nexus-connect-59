// ============================================================
// IP-NEXUS BACKOFFICE — Coverage Tab (dot-matrix + cards)
// ============================================================

import { useState, useMemo } from 'react';
import {
  useKnowledgeCoverageTable,
  useKnowledgeOpportunities,
  useResearchJurisdiction,
  type CoverageRow,
} from '@/hooks/backoffice/useKnowledgeMap';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Spinner } from '@/components/ui/spinner';
import { Search, LayoutGrid, LayoutList, AlertTriangle, Sparkles } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { KnowledgeDetailPanel } from './KnowledgeDetailPanel';

const DOT_COLORS: Record<string, string> = {
  complete: '#22C55E',
  partial: '#EAB308',
  none: '#EF4444',
  minimal: '#EF4444',
};

function CoverageDot({ level }: { level: string }) {
  const color = DOT_COLORS[level] || '#94A3B8';
  return (
    <span
      className="inline-block w-3 h-3 rounded-full"
      style={{ background: color, boxShadow: `0 0 4px ${color}40` }}
      title={level}
    />
  );
}

const REGIONS = [
  { value: 'all', label: 'Todas las regiones' },
  { value: 'europe', label: 'Europa' },
  { value: 'latin_america', label: 'América Latina' },
  { value: 'north_america', label: 'América del Norte' },
  { value: 'asia_pacific', label: 'Asia Pacífico' },
  { value: 'middle_east', label: 'Oriente Medio' },
  { value: 'africa', label: 'África' },
];

const LEVELS = [
  { value: 'all', label: 'Todos los niveles' },
  { value: 'complete', label: '🟢 Completo' },
  { value: 'partial', label: '🟡 Parcial' },
  { value: 'minimal', label: '🔴 Mínimo' },
  { value: 'none', label: '⚫ Sin cobertura' },
];

export function KnowledgeCoverageTab() {
  const { data: rows, isLoading } = useKnowledgeCoverageTable();
  const { data: opportunities } = useKnowledgeOpportunities();
  const researchMut = useResearchJurisdiction();

  const [search, setSearch] = useState('');
  const [regionFilter, setRegionFilter] = useState('all');
  const [levelFilter, setLevelFilter] = useState('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<string | null>(null);
  const [dotSheet, setDotSheet] = useState<{ jurisdictionCode: string; category: string } | null>(null);

  const filtered = useMemo(() => {
    if (!rows) return [];
    return rows.filter((r) => {
      if (search && !r.jurisdiction_name?.toLowerCase().includes(search.toLowerCase()) && !r.jurisdiction_code?.toLowerCase().includes(search.toLowerCase())) return false;
      if (regionFilter !== 'all' && r.region !== regionFilter) return false;
      if (levelFilter !== 'all' && r.coverage_level !== levelFilter) return false;
      return true;
    });
  }, [rows, search, regionFilter, levelFilter]);

  const selectedRow = selectedJurisdiction ? rows?.find((r) => r.jurisdiction_code === selectedJurisdiction) : null;

  if (isLoading) return <div className="flex justify-center py-12"><Spinner /></div>;

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Buscar jurisdicción..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {REGIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={levelFilter} onValueChange={setLevelFilter}>
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            {LEVELS.map((l) => <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex border rounded-lg overflow-hidden">
          <Button
            variant={viewMode === 'table' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('table')}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'cards' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setViewMode('cards')}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* Main Content */}
        <div className={selectedRow ? 'flex-1 min-w-0' : 'w-full'}>
          {viewMode === 'table' ? (
            <DotMatrixTable
              rows={filtered}
              onRowClick={setSelectedJurisdiction}
              onDotClick={(jc, cat) => setDotSheet({ jurisdictionCode: jc, category: cat })}
              selectedCode={selectedJurisdiction}
            />
          ) : (
            <CardsView rows={filtered} onSelect={setSelectedJurisdiction} />
          )}
        </div>

        {/* Detail Panel */}
        {selectedRow && (
          <div className="w-[420px] shrink-0">
            <KnowledgeDetailPanel
              row={selectedRow}
              onClose={() => setSelectedJurisdiction(null)}
            />
          </div>
        )}
      </div>

      {/* Opportunities */}
      <OpportunitiesSection
        opportunities={opportunities}
        onResearch={(code) => researchMut.mutate({ jurisdiction_code: code })}
        isResearching={researchMut.isPending}
      />

      {/* Dot Sheet */}
      <Sheet open={!!dotSheet} onOpenChange={() => setDotSheet(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>
              {dotSheet?.jurisdictionCode} — {dotSheet?.category}
            </SheetTitle>
            <SheetDescription>Chunks de conocimiento para esta categoría</SheetDescription>
          </SheetHeader>
          <div className="mt-4 text-sm text-muted-foreground">
            Selecciona la fila para ver todos los detalles en el panel lateral.
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ---------- Dot Matrix Table ----------
function DotMatrixTable({
  rows,
  onRowClick,
  onDotClick,
  selectedCode,
}: {
  rows: CoverageRow[];
  onRowClick: (code: string) => void;
  onDotClick: (jc: string, cat: string) => void;
  selectedCode: string | null;
}) {
  return (
    <div className="rounded-xl border border-border overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[200px]">País</TableHead>
            <TableHead className="text-center w-16">Plazos</TableHead>
            <TableHead className="text-center w-16">OA</TableHead>
            <TableHead className="text-center w-16">Legisl.</TableHead>
            <TableHead className="text-center w-16">Tasas</TableHead>
            <TableHead className="text-center w-16">Oposic.</TableHead>
            <TableHead className="text-center w-20">Score</TableHead>
            <TableHead className="text-center w-24">Verificado</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                No se encontraron jurisdicciones
              </TableCell>
            </TableRow>
          )}
          {rows.map((r) => (
            <TableRow
              key={r.jurisdiction_code}
              className={`cursor-pointer transition-colors ${selectedCode === r.jurisdiction_code ? 'bg-accent' : ''}`}
              onClick={() => onRowClick(r.jurisdiction_code)}
            >
              <TableCell className="font-medium">
                <span className="mr-1.5">{r.flag_emoji || '🏳️'}</span>
                {r.jurisdiction_name}
                {r.requires_translation && (
                  <span className="ml-1 text-[10px] text-muted-foreground" title="Requiere traducción">🌐</span>
                )}
                {r.rep_requirement_type && r.rep_requirement_type !== 'none' && (
                  <span className="ml-1 text-[10px] text-muted-foreground" title="Requiere representante">⚖️</span>
                )}
              </TableCell>
              <TableCell className="text-center" onClick={(e) => { e.stopPropagation(); onDotClick(r.jurisdiction_code, 'deadlines'); }}>
                <CoverageDot level={r.cov_deadlines || 'none'} />
              </TableCell>
              <TableCell className="text-center" onClick={(e) => { e.stopPropagation(); onDotClick(r.jurisdiction_code, 'oa_response'); }}>
                <CoverageDot level={r.cov_oa_response || 'none'} />
              </TableCell>
              <TableCell className="text-center" onClick={(e) => { e.stopPropagation(); onDotClick(r.jurisdiction_code, 'legislation'); }}>
                <CoverageDot level={r.cov_legislation || 'none'} />
              </TableCell>
              <TableCell className="text-center" onClick={(e) => { e.stopPropagation(); onDotClick(r.jurisdiction_code, 'fees'); }}>
                <CoverageDot level={r.cov_fees || 'none'} />
              </TableCell>
              <TableCell className="text-center" onClick={(e) => { e.stopPropagation(); onDotClick(r.jurisdiction_code, 'opposition'); }}>
                <CoverageDot level={r.cov_opposition || 'none'} />
              </TableCell>
              <TableCell className="text-center">
                <span className="font-mono text-xs font-semibold">{r.effective_score}</span>
                {r.quality_penalty_applied && (
                  <AlertTriangle className="inline h-3 w-3 ml-1 text-amber-500" />
                )}
              </TableCell>
              <TableCell className="text-center text-xs text-muted-foreground">
                {r.last_verification
                  ? formatDistanceToNow(new Date(r.last_verification), { addSuffix: true, locale: es })
                  : '—'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

// ---------- Cards View ----------
function CardsView({ rows, onSelect }: { rows: CoverageRow[]; onSelect: (c: string) => void }) {
  const byRegion = useMemo(() => {
    const map: Record<string, CoverageRow[]> = {};
    rows.forEach((r) => {
      const region = r.region || 'other';
      if (!map[region]) map[region] = [];
      map[region].push(r);
    });
    return map;
  }, [rows]);

  const regionLabels: Record<string, string> = {
    europe: 'Europa',
    north_america: 'América del Norte',
    latin_america: 'América Latina',
    asia_pacific: 'Asia Pacífico',
    middle_east: 'Oriente Medio',
    africa: 'África',
    oceania: 'Oceanía',
    international: 'Internacional',
    other: 'Otros',
  };

  return (
    <div className="space-y-6">
      {Object.entries(byRegion).map(([region, items]) => (
        <div key={region}>
          <h3 className="text-sm font-semibold text-muted-foreground mb-3">{regionLabels[region] || region}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {items.map((r) => (
              <button
                key={r.jurisdiction_code}
                onClick={() => onSelect(r.jurisdiction_code)}
                className="text-left rounded-xl border border-border bg-card p-3 hover:bg-accent transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{r.flag_emoji || '🏳️'}</span>
                  <span className="text-sm font-medium truncate">{r.jurisdiction_name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <CoverageDot level={r.coverage_level} />
                  <span className="text-xs text-muted-foreground">{r.effective_score}%</span>
                  {r.quality_penalty_applied && <AlertTriangle className="h-3 w-3 text-amber-500" />}
                </div>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Opportunities ----------
function OpportunitiesSection({
  opportunities,
  onResearch,
  isResearching,
}: {
  opportunities: any;
  onResearch: (code: string) => void;
  isResearching: boolean;
}) {
  if (!opportunities) return null;
  const { madridNoCoverage, latamUncovered } = opportunities;
  if (!madridNoCoverage?.length && !latamUncovered?.length) return null;

  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/50 dark:bg-amber-900/10 dark:border-amber-800 p-5 space-y-4">
      <h3 className="text-sm font-semibold flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-amber-500" />
        Oportunidades de Investigación
      </h3>

      {madridNoCoverage?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Miembros Madrid sin cobertura</p>
          <div className="flex flex-wrap gap-2">
            {madridNoCoverage.map((o: any) => (
              <Button
                key={o.code}
                variant="outline"
                size="sm"
                onClick={() => onResearch(o.code)}
                disabled={isResearching}
                className="text-xs"
              >
                {o.flag_emoji} {o.name_en || o.code}
              </Button>
            ))}
          </div>
        </div>
      )}

      {latamUncovered?.length > 0 && (
        <div>
          <p className="text-xs text-muted-foreground mb-2">Top LATAM sin investigar</p>
          <div className="flex flex-wrap gap-2">
            {latamUncovered.map((o: any) => (
              <Button
                key={o.code}
                variant="outline"
                size="sm"
                onClick={() => onResearch(o.code)}
                disabled={isResearching}
                className="text-xs"
              >
                {o.flag_emoji} {o.name_en || o.code}
              </Button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
