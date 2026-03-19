import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Button } from "@/components/ui/button";
import { Search, Globe, LayoutGrid, List, Download, X } from "lucide-react";
import { AUTOMATION_LEVELS } from "./IpOfficeLevelBadge";

export const REGIONS: Record<string, { label: string; icon: string }> = {
  ALL: { label: "Todas las regiones", icon: "🌐" },
  international: { label: "Internacional", icon: "🌐" },
  europe: { label: "Europa", icon: "🇪🇺" },
  north_america: { label: "Norteamérica", icon: "🇺🇸" },
  latin_america: { label: "Latinoamérica", icon: "🌎" },
  caribbean: { label: "Caribe", icon: "🏝️" },
  asia_pacific: { label: "Asia-Pacífico", icon: "🌏" },
  middle_east: { label: "Oriente Medio", icon: "🕌" },
  africa: { label: "África", icon: "🌍" },
  oceania: { label: "Oceanía", icon: "🏝️" },
};

export const OFFICE_TYPES: Record<string, { label: string; icon: string }> = {
  ALL: { label: "Todos los tipos", icon: "🏛️" },
  international: { label: "Internacional", icon: "🌐" },
  regional: { label: "Regional", icon: "🗺️" },
  national: { label: "Nacional", icon: "🏴" },
};

export const IP_TYPES: Record<string, { label: string; key: string }> = {
  ALL: { label: "Todos", key: "all" },
  trademarks: { label: "Marcas", key: "handles_trademarks" },
  patents: { label: "Patentes", key: "handles_patents" },
  designs: { label: "Diseños", key: "handles_designs" },
};

interface Props {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  selectedRegion: string;
  onRegionChange: (region: string) => void;
  selectedLevel: string;
  onLevelChange: (level: string) => void;
  selectedType: string;
  onTypeChange: (type: string) => void;
  selectedIpType: string;
  onIpTypeChange: (ipType: string) => void;
  viewMode: "grid" | "list";
  onViewModeChange: (mode: "grid" | "list") => void;
  totalResults: number;
  onExport?: () => void;
  priceFilter?: string;
  onPriceFilterChange?: (value: string) => void;
  webFilter?: string;
  onWebFilterChange?: (value: string) => void;
}

export function IpOfficeFilters({
  searchQuery, onSearchChange,
  selectedRegion, onRegionChange,
  selectedLevel, onLevelChange,
  selectedType, onTypeChange,
  selectedIpType, onIpTypeChange,
  viewMode, onViewModeChange,
  totalResults, onExport,
  priceFilter, onPriceFilterChange,
  webFilter, onWebFilterChange,
}: Props) {
  const hasActiveFilters = searchQuery || selectedRegion !== "ALL" || selectedLevel !== "ALL" || selectedType !== "ALL" || selectedIpType !== "ALL" || (priceFilter && priceFilter !== "ALL") || (webFilter && webFilter !== "ALL");

  const clearFilters = () => {
    onSearchChange("");
    onRegionChange("ALL");
    onLevelChange("ALL");
    onTypeChange("ALL");
    onIpTypeChange("ALL");
    onPriceFilterChange?.("ALL");
    onWebFilterChange?.("ALL");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar oficina por nombre, país o código..." value={searchQuery} onChange={(e) => onSearchChange(e.target.value)} className="pl-10" />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">{totalResults} resultados</span>
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport}><Download className="h-4 w-4 mr-1" />Exportar</Button>
          )}
          <ToggleGroup type="single" value={viewMode} onValueChange={(v) => v && onViewModeChange(v as "grid" | "list")}>
            <ToggleGroupItem value="grid" aria-label="Vista grid"><LayoutGrid className="h-4 w-4" /></ToggleGroupItem>
            <ToggleGroupItem value="list" aria-label="Vista lista"><List className="h-4 w-4" /></ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <div className="flex flex-wrap gap-3 items-center">
        <Select value={selectedRegion} onValueChange={onRegionChange}>
          <SelectTrigger className="w-[180px]"><Globe className="h-4 w-4 mr-2" /><SelectValue placeholder="Región" /></SelectTrigger>
          <SelectContent>
            {Object.entries(REGIONS).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedLevel} onValueChange={onLevelChange}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder="Nivel" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">Todos los niveles</SelectItem>
            {Object.entries(AUTOMATION_LEVELS).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedType} onValueChange={onTypeChange}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            {Object.entries(OFFICE_TYPES).map(([key, { label, icon }]) => (
              <SelectItem key={key} value={key}>{icon} {label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={selectedIpType} onValueChange={onIpTypeChange}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo PI" /></SelectTrigger>
          <SelectContent>
            {Object.entries(IP_TYPES).map(([key, { label }]) => (
              <SelectItem key={key} value={key}>{label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        {onPriceFilterChange && (
          <Select value={priceFilter || "ALL"} onValueChange={onPriceFilterChange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="Precio" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">💰 Precio: Todos</SelectItem>
              <SelectItem value="with_price">💰 Precio real</SelectItem>
              <SelectItem value="suggested">🟡 Sugerido</SelectItem>
              <SelectItem value="no_data">⚪ Sin datos</SelectItem>
            </SelectContent>
          </Select>
        )}
        {onWebFilterChange && (
          <Select value={webFilter || "ALL"} onValueChange={onWebFilterChange}>
            <SelectTrigger className="w-[150px]"><SelectValue placeholder="En web" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">🌐 Web: Todas</SelectItem>
              <SelectItem value="active">🟢 Activas</SelectItem>
              <SelectItem value="hidden">⚪ Ocultas</SelectItem>
            </SelectContent>
          </Select>
        )}
        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="text-muted-foreground">
            <X className="h-4 w-4 mr-1" />Limpiar
          </Button>
        )}
      </div>
    </div>
  );
}
