import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MarketUserFilters, AGENT_TYPE_LABELS, AgentType } from '@/types/market-users';

interface AgentFiltersProps {
  filters: MarketUserFilters;
  onFiltersChange: (filters: MarketUserFilters) => void;
  onSearch: (search: string) => void;
}

const COUNTRIES = [
  { code: 'ES', label: 'España' },
  { code: 'DE', label: 'Alemania' },
  { code: 'FR', label: 'Francia' },
  { code: 'IT', label: 'Italia' },
  { code: 'GB', label: 'Reino Unido' },
  { code: 'US', label: 'Estados Unidos' },
  { code: 'PT', label: 'Portugal' },
  { code: 'NL', label: 'Países Bajos' },
];

const JURISDICTIONS = [
  { code: 'ES', label: 'España (OEPM)' },
  { code: 'EU', label: 'Europa (EUIPO)' },
  { code: 'EP', label: 'Europa (EPO)' },
  { code: 'WIPO', label: 'Internacional (OMPI)' },
  { code: 'US', label: 'Estados Unidos (USPTO)' },
  { code: 'GB', label: 'Reino Unido (UKIPO)' },
  { code: 'DE', label: 'Alemania (DPMA)' },
  { code: 'FR', label: 'Francia (INPI)' },
  { code: 'CN', label: 'China (CNIPA)' },
  { code: 'JP', label: 'Japón (JPO)' },
];

export function AgentFilters({ filters, onFiltersChange, onSearch }: AgentFiltersProps) {
  const [searchValue, setSearchValue] = useState(filters.search || '');
  const [sheetOpen, setSheetOpen] = useState(false);
  
  const activeFilterCount = [
    filters.agent_types?.length,
    filters.countries?.length,
    filters.jurisdictions?.length,
    filters.min_rating,
    filters.is_verified_only,
  ].filter(Boolean).length;

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleClearFilters = () => {
    onFiltersChange({});
    setSearchValue('');
    onSearch('');
  };

  const toggleArrayFilter = (
    key: 'agent_types' | 'countries' | 'jurisdictions',
    value: string
  ) => {
    const current = filters[key] || [];
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value];
    onFiltersChange({ ...filters, [key]: updated.length ? updated : undefined });
  };

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form onSubmit={handleSearchSubmit} className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, despacho, especialización..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="pl-10"
          />
        </div>
        
        {/* Quick Filters */}
        <Select 
          value={filters.min_rating?.toString() || 'all'}
          onValueChange={(v) => onFiltersChange({ 
            ...filters, 
            min_rating: v === 'all' ? undefined : Number(v) 
          })}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Rating mínimo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Cualquier rating</SelectItem>
            <SelectItem value="4">4+ estrellas</SelectItem>
            <SelectItem value="4.5">4.5+ estrellas</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center gap-2 px-3 border rounded-md">
          <Checkbox
            id="verified"
            checked={filters.is_verified_only || false}
            onCheckedChange={(c) => onFiltersChange({ 
              ...filters, 
              is_verified_only: c ? true : undefined 
            })}
          />
          <Label htmlFor="verified" className="text-sm cursor-pointer whitespace-nowrap">
            Solo verificados
          </Label>
        </div>
        
        {/* Advanced Filters */}
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" className="gap-2">
              <SlidersHorizontal className="w-4 h-4" />
              Filtros
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </SheetTrigger>
          <SheetContent className="w-[400px]">
            <SheetHeader>
              <SheetTitle>Filtros avanzados</SheetTitle>
            </SheetHeader>
            
            <div className="py-6 space-y-6">
              {/* Agent Type */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Tipo de agente</Label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(AGENT_TYPE_LABELS).map(([type, labels]) => (
                    <label 
                      key={type} 
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.agent_types?.includes(type as AgentType)}
                        onCheckedChange={() => toggleArrayFilter('agent_types', type)}
                      />
                      {labels.es}
                    </label>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Country */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">País</Label>
                <div className="grid grid-cols-2 gap-2">
                  {COUNTRIES.map(({ code, label }) => (
                    <label 
                      key={code} 
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.countries?.includes(code)}
                        onCheckedChange={() => toggleArrayFilter('countries', code)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
              
              <Separator />
              
              {/* Jurisdictions */}
              <div className="space-y-3">
                <Label className="text-sm font-medium">Jurisdicciones</Label>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {JURISDICTIONS.map(({ code, label }) => (
                    <label 
                      key={code} 
                      className="flex items-center gap-2 text-sm cursor-pointer"
                    >
                      <Checkbox
                        checked={filters.jurisdictions?.includes(code)}
                        onCheckedChange={() => toggleArrayFilter('jurisdictions', code)}
                      />
                      {label}
                    </label>
                  ))}
                </div>
              </div>
            </div>
            
            <SheetFooter>
              <Button variant="outline" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-2" />
                Limpiar filtros
              </Button>
              <Button onClick={() => setSheetOpen(false)}>
                Aplicar
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </form>
      
      {/* Active Filters Tags */}
      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {filters.agent_types?.map(type => (
            <Badge 
              key={type} 
              variant="secondary" 
              className="gap-1 cursor-pointer"
              onClick={() => toggleArrayFilter('agent_types', type)}
            >
              {AGENT_TYPE_LABELS[type as AgentType]?.es}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.countries?.map(country => (
            <Badge 
              key={country} 
              variant="secondary" 
              className="gap-1 cursor-pointer"
              onClick={() => toggleArrayFilter('countries', country)}
            >
              {COUNTRIES.find(c => c.code === country)?.label || country}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          {filters.jurisdictions?.map(j => (
            <Badge 
              key={j} 
              variant="secondary" 
              className="gap-1 cursor-pointer"
              onClick={() => toggleArrayFilter('jurisdictions', j)}
            >
              {j}
              <X className="w-3 h-3" />
            </Badge>
          ))}
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleClearFilters}
            className="text-xs h-6"
          >
            Limpiar todo
          </Button>
        </div>
      )}
    </div>
  );
}
