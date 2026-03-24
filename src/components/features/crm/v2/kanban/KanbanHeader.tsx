/**
 * KanbanHeader — Pipeline selector, KPIs, search, filters, settings
 */

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Search, Filter, Settings, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { CRMPipeline } from '@/hooks/crm/v2/types';

interface KanbanHeaderProps {
  pipelines: CRMPipeline[];
  selectedPipelineId: string | null;
  onPipelineChange: (id: string) => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterType: string | null;
  onFilterTypeChange: (t: string | null) => void;
  kpis: { totalDeals: number; totalValue: number; winRate: number; activeDeals: number };
  onRefresh: () => void;
  onAddDeal: () => void;
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k €`;
  return `${value.toLocaleString('es-ES')} €`;
}

export function KanbanHeader({
  pipelines, selectedPipelineId, onPipelineChange,
  searchQuery, onSearchChange,
  filterType, onFilterTypeChange,
  kpis, onRefresh, onAddDeal,
}: KanbanHeaderProps) {
  return (
    <div className="space-y-3">
      {/* Row 1: Pipeline selector + KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={selectedPipelineId || ''} onValueChange={onPipelineChange}>
            <SelectTrigger className="w-[240px] font-semibold">
              <SelectValue placeholder="Seleccionar pipeline..." />
            </SelectTrigger>
            <SelectContent className="bg-background border shadow-lg z-50">
              {pipelines.map(p => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2">
                    <span>{p.name}</span>
                    {p.is_default && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                        Default
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link to="/app/settings" state={{ section: 'crm' }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurar pipelines">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Deals:</span>
            <span className="font-bold">{kpis.totalDeals}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Pipeline:</span>
            <span className="font-bold text-primary">{formatCurrency(kpis.totalValue)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Win rate:</span>
            <span className="font-bold text-green-600">{kpis.winRate}%</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Activos:</span>
            <span className="font-bold">{kpis.activeDeals}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Search + filters + actions */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar deals..."
            value={searchQuery}
            onChange={e => onSearchChange(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        {/* Type filter */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={filterType ? 'secondary' : 'outline'} size="sm" className="h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {filterType ? `🏷️ ${filterType}` : 'Tipo'}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background">
            <DropdownMenuItem onClick={() => onFilterTypeChange(null)}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterTypeChange('trademark')}>⚖️ Trademark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterTypeChange('patent')}>🔬 Patent</DropdownMenuItem>
            <DropdownMenuItem onClick={() => onFilterTypeChange('design')}>🎨 Design</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="icon" className="h-9 w-9" onClick={onRefresh}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1" />

        <Button onClick={onAddDeal} className="h-9">
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Deal
        </Button>
      </div>
    </div>
  );
}
