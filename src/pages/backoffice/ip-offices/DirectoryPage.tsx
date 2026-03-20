/**
 * Directorio Mundial de Oficinas de Propiedad Intelectual
 * Réplica exacta de UmbrellaBrandsV2, adaptada al design system SILK de IP-NEXUS
 */

import { useState, useMemo, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Building2, Loader2, Globe, RefreshCw, Download, History, CalendarClock, BarChart3 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useIpOfficesDirectory, type IpOfficeWithCommercial } from "@/hooks/useIpOfficesDirectory";
import { IpOfficeGridCard } from "@/components/ip-offices/IpOfficeGridCard";
import { IpOfficeListView } from "@/components/ip-offices/IpOfficeListView";
import { IpOfficeStats } from "@/components/ip-offices/IpOfficeStats";
import { IpOfficeFilters, REGIONS, IP_TYPES } from "@/components/ip-offices/IpOfficeFilters";
import { IpOfficeLevelDescriptions } from "@/components/ip-offices/IpOfficeLevelDescriptions";
import { IpOfficeAuditPanel } from "@/components/ip-offices/IpOfficeAuditPanel";

function getNextMonthFirstDay(): string {
  const now = new Date();
  const next = new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1, 3, 0));
  return next.toLocaleDateString("es-ES", { day: "numeric", month: "short", year: "numeric" });
}

function getFreshnessIndicator(lastSyncDate: string | null): { emoji: string; label: string; color: string } {
  if (!lastSyncDate) return { emoji: "🔴", label: "Sin datos", color: "text-red-600" };
  const days = Math.floor((Date.now() - new Date(lastSyncDate).getTime()) / (1000 * 60 * 60 * 24));
  if (days < 30) return { emoji: "🟢", label: `Hace ${days}d`, color: "text-emerald-600" };
  if (days < 60) return { emoji: "🟡", label: `Hace ${days}d`, color: "text-amber-600" };
  return { emoji: "🔴", label: `Hace ${days}d`, color: "text-red-600" };
}

function DirectoryContent() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRegion, setSelectedRegion] = useState("ALL");
  const [selectedLevel, setSelectedLevel] = useState("ALL");
  const [selectedType, setSelectedType] = useState("ALL");
  const [selectedIpType, setSelectedIpType] = useState("ALL");
  const [priceFilter, setPriceFilter] = useState("ALL");
  const [webFilter, setWebFilter] = useState("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const navigate = useNavigate();
  const { data: offices, isLoading } = useIpOfficesDirectory();

  const freshness = getFreshnessIndicator(null);
  const lastSyncFormatted = "Nunca";

  const researchMap = useMemo(() => {
    const map = new Map<string, { status: string; research_completed_at: string | null; auto_confidence_score: number }>();
    offices?.forEach(o => {
      const score = o.data_completeness_score ?? 0;
      map.set(o.id, {
        status: (score as number) >= 75 ? 'completed' : (score as number) >= 25 ? 'partial' : 'pending',
        research_completed_at: null,
        auto_confidence_score: score as number,
      });
    });
    return map;
  }, [offices]);

  const handleOfficeClick = (officeId: string) => {
    const office = offices?.find(o => o.id === officeId);
    if (office) navigate(`/backoffice/ipo/${office.code}`);
  };

  const filteredOffices = useMemo(() => {
    if (!offices) return [];
    return offices.filter(office => {
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesSearch =
          office.name?.toLowerCase().includes(query) ||
          (office.official_name_local as string)?.toLowerCase().includes(query) ||
          office.code?.toLowerCase().includes(query) ||
          (office.country_name as string)?.toLowerCase().includes(query) ||
          (office.city as string)?.toLowerCase().includes(query) ||
          (office.acronym as string)?.toLowerCase().includes(query);
        if (!matchesSearch) return false;
      }
      if (selectedRegion !== "ALL" && office.region !== selectedRegion) return false;
      if (selectedLevel !== "ALL" && office.digitalization_level !== selectedLevel) return false;
      if (selectedType !== "ALL" && office.office_type !== selectedType) return false;
      if (selectedIpType !== "ALL") {
        const key = IP_TYPES[selectedIpType as keyof typeof IP_TYPES]?.key;
        if (key && key !== "all" && !office[key as keyof typeof office]) return false;
      }
      if (priceFilter === "with_price" && office.commercial?.price_tier !== 'real') return false;
      if (priceFilter === "suggested" && office.commercial?.price_tier !== 'suggested') return false;
      if (priceFilter === "no_data" && office.commercial?.price_tier !== 'none') return false;
      if (webFilter === "active" && !office.commercial?.pj_is_active) return false;
      if (webFilter === "hidden" && office.commercial?.pj_is_active) return false;
      return true;
    });
  }, [offices, searchQuery, selectedRegion, selectedLevel, selectedType, selectedIpType, priceFilter, webFilter]);

  const officesByRegion = useMemo(() => {
    const groups: Record<string, IpOfficeWithCommercial[]> = {};
    filteredOffices.forEach(office => {
      const region = (office.region as string) || "OTHER";
      if (!groups[region]) groups[region] = [];
      groups[region].push(office);
    });
    const regionOrder = ["international", "europe", "north_america", "latin_america", "caribbean", "asia_pacific", "middle_east", "africa", "oceania", "OTHER"];
    const sorted: Record<string, IpOfficeWithCommercial[]> = {};
    regionOrder.forEach(r => { if (groups[r]) sorted[r] = groups[r]; });
    return sorted;
  }, [filteredOffices]);

  const stats = useMemo(() => {
    if (!offices) return { total: 0, full_digital: 0, mostly_digital: 0, partially_digital: 0, basic_digital: 0, manual: 0, withPrice: 0, withSuggested: 0, withNoData: 0, activeInWeb: 0 };
    return {
      total: offices.length,
      full_digital: offices.filter(o => o.digitalization_level === "FULL_DIGITAL").length,
      mostly_digital: offices.filter(o => o.digitalization_level === "AVANZADA").length,
      partially_digital: offices.filter(o => o.digitalization_level === "PARCIAL").length,
      basic_digital: offices.filter(o => o.digitalization_level === "BASICA").length,
      manual: offices.filter(o => o.digitalization_level === "MANUAL" || !o.digitalization_level).length,
      withPrice: offices.filter(o => o.commercial?.price_tier === 'real').length,
      withSuggested: offices.filter(o => o.commercial?.price_tier === 'suggested').length,
      withNoData: offices.filter(o => o.commercial?.price_tier === 'none').length,
      activeInWeb: offices.filter(o => o.commercial?.pj_is_active).length,
    };
  }, [offices]);

  const handleLevelSelect = (level: string) => setSelectedLevel(level === selectedLevel ? "ALL" : level);

  const handleExport = () => {
    if (!filteredOffices.length) return;
    const headers = ["Código", "Nombre", "País", "Región", "Nivel", "% Automatización", "Marcas", "Patentes", "Diseños", "Madrid"];
    const rows = filteredOffices.map(o => [
      o.code, o.name, o.country_name || "", o.region || "",
      o.digitalization_level || "manual", o.automation_percentage || 0,
      o.handles_trademarks ? "Sí" : "No", o.handles_patents ? "Sí" : "No", o.handles_designs ? "Sí" : "No",
      o.member_madrid_protocol ? "Sí" : "No",
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.map(c => `"${c}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `directorio-oficinas-ip-${new Date().toISOString().split('T')[0]}.csv`; a.click();
  };

  return (
    <>
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 border-b">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-primary/10"><Building2 className="h-8 w-8 text-primary" /></div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-foreground">Directorio Mundial de Oficinas IP</h1>
                <p className="text-muted-foreground mt-1">Catálogo completo de {stats.total} oficinas · {stats.withPrice} con precio · {stats.activeInWeb} en web</p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button variant="outline" size="sm" onClick={handleExport} disabled={filteredOffices.length === 0}><Download className="h-4 w-4 mr-2" />Exportar</Button>
            </div>
          </div>

          <TooltipProvider>
            <div className="flex items-center gap-4 mt-2 mb-4 text-sm">
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-1.5 cursor-default">
                    <span>{freshness.emoji}</span>
                    <span className="text-muted-foreground">Última actualización:</span>
                    <span className={`font-medium ${freshness.color}`}>{lastSyncFormatted}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>Estado de actualización del directorio</TooltipContent>
              </Tooltip>
              <span className="text-muted-foreground/30">|</span>
              <div className="flex items-center gap-1.5">
                <CalendarClock className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">Próxima automática:</span>
                <span className="font-medium text-foreground">{getNextMonthFirstDay()}</span>
              </div>
            </div>
          </TooltipProvider>

          <IpOfficeStats stats={stats} selectedLevel={selectedLevel} onSelectLevel={handleLevelSelect} />
        </div>
        <div className="mt-6 container mx-auto px-4 pb-6">
          <IpOfficeLevelDescriptions stats={stats} selectedLevel={selectedLevel} onSelectLevel={handleLevelSelect} />
        </div>
        {offices && offices.length > 0 && (
          <div className="container mx-auto px-4 pb-4">
            <IpOfficeAuditPanel offices={offices} />
          </div>
        )}
      </div>

      <div className="sticky top-0 z-10 bg-background/95 backdrop-blur border-b">
        <div className="container mx-auto px-4 py-4">
          <IpOfficeFilters
            searchQuery={searchQuery} onSearchChange={setSearchQuery}
            selectedRegion={selectedRegion} onRegionChange={setSelectedRegion}
            selectedLevel={selectedLevel} onLevelChange={setSelectedLevel}
            selectedType={selectedType} onTypeChange={setSelectedType}
            selectedIpType={selectedIpType} onIpTypeChange={setSelectedIpType}
            viewMode={viewMode} onViewModeChange={setViewMode}
            totalResults={filteredOffices.length} onExport={handleExport}
            priceFilter={priceFilter} onPriceFilterChange={setPriceFilter}
            webFilter={webFilter} onWebFilterChange={setWebFilter}
          />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : filteredOffices.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium">No se encontraron oficinas</h3>
              <p className="text-muted-foreground mt-1">Intenta ajustar los filtros de búsqueda</p>
            </CardContent>
          </Card>
        ) : viewMode === "list" ? (
          <IpOfficeListView offices={filteredOffices} researchMap={researchMap} onOfficeClick={handleOfficeClick} />
        ) : selectedRegion === "ALL" ? (
          <div className="space-y-8">
            {Object.entries(officesByRegion).map(([region, regionOffices]) => (
              <div key={region}>
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <span>{REGIONS[region]?.icon || "🌐"}</span>
                  {REGIONS[region]?.label || region}
                  <Badge variant="secondary" className="ml-2">{regionOffices.length}</Badge>
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {regionOffices.map(office => <IpOfficeGridCard key={office.id} office={office} onClick={() => handleOfficeClick(office.id)} />)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredOffices.map(office => <IpOfficeGridCard key={office.id} office={office} onClick={() => handleOfficeClick(office.id)} />)}
          </div>
        )}
      </div>
    </>
  );
}

export default function IpOfficesDirectoryPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "directory";
  const handleTabChange = (value: string) => {
    if (value === "directory") setSearchParams({});
    else setSearchParams({ tab: value });
  };

  return (
    <div className="min-h-screen bg-background -m-6">
      <div className="border-b bg-background">
        <div className="container mx-auto px-4 pt-4">
          <Tabs value={activeTab} onValueChange={handleTabChange}>
            <TabsList>
              <TabsTrigger value="directory" className="gap-2"><Globe className="h-4 w-4" />🌍 Directorio</TabsTrigger>
              <TabsTrigger value="history" className="gap-2"><History className="h-4 w-4" />📋 Historial</TabsTrigger>
              <TabsTrigger value="completitud" className="gap-2"><BarChart3 className="h-4 w-4" />📊 Completitud</TabsTrigger>
            </TabsList>
            <TabsContent value="directory" className="mt-0"><DirectoryContent /></TabsContent>
            <TabsContent value="history" className="mt-4 pb-8">
              <div className="container mx-auto px-4">
                <Card><CardContent className="p-8 text-center text-muted-foreground">Historial de cambios — próximamente</CardContent></Card>
              </div>
            </TabsContent>
            <TabsContent value="completitud" className="mt-4 pb-8">
              <div className="container mx-auto px-4">
                <Card><CardContent className="p-8 text-center text-muted-foreground">Panel de completitud — próximamente</CardContent></Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
