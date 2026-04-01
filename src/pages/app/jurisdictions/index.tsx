/**
 * Tenant Jurisdiction Directory — /app/jurisdictions
 * Shows only jurisdictions subscribed by the current organization
 */
import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/organization-context";
import { useAuth } from "@/contexts/auth-context";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Search, Globe, Star, StarOff, Lock, Sparkles,
  LayoutGrid, List, Brain, Check,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ── Hooks ──────────────────────────────────────────────

function useMyJurisdictions(orgId: string | undefined) {
  return useQuery({
    queryKey: ["my-jurisdictions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data: myCodes } = await supabase
        .from("organization_jurisdictions")
        .select("jurisdiction_code, activated_at, source")
        .eq("is_active", true);

      if (!myCodes?.length) return [];

      const codes = myCodes.map(r => r.jurisdiction_code);
      const { data: offices } = await supabase
        .from("ipo_offices")
        .select("country_code, code, name_en, name_es, name, flag_emoji, region, office_type, supports_trademarks, supports_patents, supports_designs, rejection_rate_pct, approval_rate_pct, avg_days_to_decision, genius_coverage_score, genius_coverage_level, annual_filing_volume, tier, office_acronym")
        .in("country_code", codes)
        .order("name_en");

      return (offices ?? []) as Record<string, unknown>[];
    },
  });
}

function useMaxJurisdictions(orgId: string | undefined) {
  return useQuery({
    queryKey: ["max-jurisdictions", orgId],
    enabled: !!orgId,
    queryFn: async () => {
      const { data } = await supabase
        .from("subscriptions")
        .select("plan_definitions(max_jurisdictions)")
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      return ((data as any)?.plan_definitions?.max_jurisdictions as number) ?? 3;
    },
  });
}

function useUserFavorites(userId: string | undefined) {
  return useQuery({
    queryKey: ["jurisdiction-favorites", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("user_jurisdiction_preferences")
        .select("jurisdiction_code, is_favorite");
      return new Set((data ?? []).filter(r => r.is_favorite).map(r => r.jurisdiction_code));
    },
  });
}

function useAllOffices() {
  return useQuery({
    queryKey: ["all-ipo-offices-for-add"],
    queryFn: async () => {
      const { data } = await supabase
        .from("ipo_offices")
        .select("country_code, code, name_en, name_es, name, flag_emoji, region, office_type, supports_trademarks, supports_patents, supports_designs, rejection_rate_pct, genius_coverage_score, office_acronym")
        .eq("is_active", true)
        .order("name_en");
      return (data ?? []) as Record<string, unknown>[];
    },
  });
}

// ── Main Page ──────────────────────────────────────────

export default function JurisdictionsPage() {
  const navigate = useNavigate();
  const { currentOrganization } = useOrganization();
  const { profile } = useAuth();
  const orgId = currentOrganization?.id;
  const userId = profile?.id;

  const { data: offices, isLoading } = useMyJurisdictions(orgId);
  const { data: maxJurisdictions = 3 } = useMaxJurisdictions(orgId);
  const { data: favorites = new Set<string>() } = useUserFavorites(userId);

  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const [ipTypeFilter, setIpTypeFilter] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showAddDialog, setShowAddDialog] = useState(false);

  const activeCount = offices?.length ?? 0;
  const remaining = maxJurisdictions === -1 ? Infinity : maxJurisdictions - activeCount;
  const canAddMore = remaining > 0;
  const isLimitedPlan = maxJurisdictions <= 5;

  const filtered = useMemo(() => {
    if (!offices) return [];
    return offices.filter(o => {
      const q = search.toLowerCase();
      if (q) {
        const name = String(o.name_en || o.name || "").toLowerCase();
        const code = String(o.country_code || o.code || "").toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      if (regionFilter !== "all" && o.region !== regionFilter) return false;
      if (ipTypeFilter === "trademarks" && !o.supports_trademarks) return false;
      if (ipTypeFilter === "patents" && !o.supports_patents) return false;
      if (ipTypeFilter === "designs" && !o.supports_designs) return false;
      return true;
    });
  }, [offices, search, regionFilter, ipTypeFilter]);

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-44 rounded-xl" />)}
        </div>
      </div>
    );
  }

  if (!offices?.length) {
    return (
      <div className="p-6">
        <div className="text-center py-20">
          <Globe className="h-16 w-16 text-muted-foreground/30 mx-auto mb-6" />
          <h2 className="text-xl font-semibold">Sin jurisdicciones configuradas</h2>
          <p className="text-muted-foreground mt-2 max-w-md mx-auto">
            Añade las jurisdicciones donde operas para acceder a datos de oficinas,
            tarifas, plazos e inteligencia de registro.
          </p>
          <Button className="mt-6" onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir mi primera jurisdicción
          </Button>
        </div>
        <AddJurisdictionDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          subscribedCodes={[]}
          canAddMore={canAddMore}
          remaining={remaining}
          orgId={orgId!}
        />
      </div>
    );
  }

  const subscribedCodes = offices.map(o => String(o.country_code || o.code));

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Mis Jurisdicciones</h1>
          <p className="text-sm text-muted-foreground">
            {activeCount} de {maxJurisdictions === -1 ? "∞" : maxJurisdictions} jurisdicciones activas
          </p>
        </div>
        {canAddMore && (
          <Button onClick={() => setShowAddDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Añadir Jurisdicción
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={regionFilter} onValueChange={setRegionFilter}>
          <SelectTrigger className="w-[150px]"><SelectValue placeholder="Región" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="europe">Europa</SelectItem>
            <SelectItem value="latin_america">América Latina</SelectItem>
            <SelectItem value="north_america">América del Norte</SelectItem>
            <SelectItem value="asia_pacific">Asia Pacífico</SelectItem>
            <SelectItem value="africa">África</SelectItem>
            <SelectItem value="middle_east">Oriente Medio</SelectItem>
            <SelectItem value="oceania">Oceanía</SelectItem>
            <SelectItem value="international">Internacional</SelectItem>
          </SelectContent>
        </Select>
        <Select value={ipTypeFilter} onValueChange={setIpTypeFilter}>
          <SelectTrigger className="w-[140px]"><SelectValue placeholder="Tipo PI" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="trademarks">Marcas</SelectItem>
            <SelectItem value="patents">Patentes</SelectItem>
            <SelectItem value="designs">Diseños</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-1 border rounded-md p-0.5">
          <Button variant={viewMode === "grid" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("grid")}>
            <LayoutGrid className="h-4 w-4" />
          </Button>
          <Button variant={viewMode === "list" ? "secondary" : "ghost"} size="icon" className="h-8 w-8" onClick={() => setViewMode("list")}>
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Cards */}
      {viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(office => (
            <JurisdictionCard
              key={String(office.country_code || office.code)}
              office={office}
              isFavorite={favorites.has(String(office.country_code))}
              userId={userId}
              onClick={() => navigate(`/app/jurisdictions/${office.country_code || office.code}`)}
            />
          ))}
        </div>
      ) : (
        <JurisdictionListView offices={filtered} favorites={favorites} onRowClick={code => navigate(`/app/jurisdictions/${code}`)} />
      )}

      {/* Upsell banner */}
      {isLimitedPlan && (
        <Card className="border-blue-200 bg-blue-50/50 dark:bg-blue-950/20 dark:border-blue-800">
          <CardContent className="flex items-center justify-between py-3 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-500" />
              <span className="text-sm">
                {remaining > 0
                  ? `Puedes añadir ${remaining === Infinity ? "más" : remaining} jurisdicciones más.`
                  : "Has alcanzado el límite de tu plan."}
                {" "}¿Necesitas más?
              </span>
            </div>
            <Button variant="outline" size="sm" onClick={() => navigate("/app/store")}>Upgrade →</Button>
          </CardContent>
        </Card>
      )}

      <AddJurisdictionDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        subscribedCodes={subscribedCodes}
        canAddMore={canAddMore}
        remaining={remaining}
        orgId={orgId!}
      />
    </div>
  );
}

// ── Card ───────────────────────────────────────────────

function JurisdictionCard({ office, isFavorite, userId, onClick }: {
  office: Record<string, unknown>;
  isFavorite: boolean;
  userId?: string;
  onClick: () => void;
}) {
  const qc = useQueryClient();
  const toggleFav = useMutation({
    mutationFn: async () => {
      if (!userId) return;
      const code = String(office.country_code);
      if (isFavorite) {
        await supabase.from("user_jurisdiction_preferences").delete().eq("user_id", userId).eq("jurisdiction_code", code);
      } else {
        await supabase.from("user_jurisdiction_preferences").upsert({
          user_id: userId, jurisdiction_code: code, is_favorite: true,
        }, { onConflict: "user_id,jurisdiction_code" as any });
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["jurisdiction-favorites"] }),
  });

  const gScore = office.genius_coverage_score as number | null;
  const gBadge = gScore != null
    ? gScore >= 90 ? { label: "Full", cls: "bg-emerald-600 text-white" }
    : gScore >= 75 ? { label: "Alta", cls: "bg-blue-600 text-white" }
    : gScore >= 50 ? { label: "Parcial", cls: "bg-amber-500 text-white" }
    : { label: "Baja", cls: "bg-red-500 text-white" }
    : null;

  return (
    <Card
      className="cursor-pointer hover:border-primary/40 transition-colors group"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{String(office.flag_emoji || "🏛️")}</span>
            <div>
              <span className="font-bold text-sm">{String(office.country_code || office.code || "")}</span>
              {office.office_acronym && (
                <span className="text-xs text-muted-foreground ml-1">({String(office.office_acronym)})</span>
              )}
            </div>
          </div>
          <button
            onClick={e => { e.stopPropagation(); toggleFav.mutate(); }}
            className="p-1 rounded hover:bg-muted transition-colors"
          >
            {isFavorite
              ? <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
              : <StarOff className="h-4 w-4 text-muted-foreground" />}
          </button>
        </div>

        <p className="text-sm font-medium truncate">{String(office.name_en || office.name || "")}</p>

        <div className="flex gap-1.5 flex-wrap">
          {office.supports_trademarks && <Badge variant="outline" className="text-[10px] px-1.5">T</Badge>}
          {office.supports_patents && <Badge variant="outline" className="text-[10px] px-1.5">P</Badge>}
          {office.supports_designs && <Badge variant="outline" className="text-[10px] px-1.5">D</Badge>}
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex gap-3">
            {office.rejection_rate_pct != null && (
              <span>Rechazo: <strong className="text-foreground">{String(office.rejection_rate_pct)}%</strong></span>
            )}
            {office.avg_days_to_decision != null && (
              <span>Decisión: <strong className="text-foreground">{String(office.avg_days_to_decision)}d</strong></span>
            )}
          </div>
          {gBadge && (
            <Badge className={cn("text-[9px] h-4", gBadge.cls)}>
              <Brain className="h-2.5 w-2.5 mr-0.5" />{gBadge.label}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ── List view ──────────────────────────────────────────

function JurisdictionListView({ offices, favorites, onRowClick }: {
  offices: Record<string, unknown>[];
  favorites: Set<string>;
  onRowClick: (code: string) => void;
}) {
  return (
    <div className="border rounded-lg overflow-hidden">
      <table className="w-full text-sm">
        <thead className="bg-muted/50">
          <tr>
            <th className="text-left p-3 font-medium">Oficina</th>
            <th className="text-left p-3 font-medium hidden md:table-cell">Tipos PI</th>
            <th className="text-left p-3 font-medium hidden md:table-cell">Rechazo</th>
            <th className="text-left p-3 font-medium hidden lg:table-cell">Decisión</th>
            <th className="text-center p-3 font-medium w-10">★</th>
          </tr>
        </thead>
        <tbody>
          {offices.map(o => {
            const code = String(o.country_code || o.code);
            return (
              <tr
                key={code}
                className="border-t hover:bg-muted/30 cursor-pointer transition-colors"
                onClick={() => onRowClick(code)}
              >
                <td className="p-3">
                  <div className="flex items-center gap-2">
                    <span>{String(o.flag_emoji || "🏛️")}</span>
                    <span className="font-medium">{code}</span>
                    <span className="text-muted-foreground truncate max-w-[200px]">{String(o.name_en || o.name || "")}</span>
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  <div className="flex gap-1">
                    {o.supports_trademarks && <Badge variant="outline" className="text-[10px] px-1">T</Badge>}
                    {o.supports_patents && <Badge variant="outline" className="text-[10px] px-1">P</Badge>}
                    {o.supports_designs && <Badge variant="outline" className="text-[10px] px-1">D</Badge>}
                  </div>
                </td>
                <td className="p-3 hidden md:table-cell">
                  {o.rejection_rate_pct != null ? `${o.rejection_rate_pct}%` : "—"}
                </td>
                <td className="p-3 hidden lg:table-cell">
                  {o.avg_days_to_decision != null ? `${o.avg_days_to_decision}d` : "—"}
                </td>
                <td className="p-3 text-center">
                  {favorites.has(code) ? <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500 mx-auto" /> : null}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ── Add Jurisdiction Dialog ────────────────────────────

function AddJurisdictionDialog({ open, onOpenChange, subscribedCodes, canAddMore, remaining, orgId }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  subscribedCodes: string[];
  canAddMore: boolean;
  remaining: number;
  orgId: string;
}) {
  const [search, setSearch] = useState("");
  const [regionFilter, setRegionFilter] = useState("all");
  const { data: allOffices = [] } = useAllOffices();
  const qc = useQueryClient();
  const subscribedSet = new Set(subscribedCodes);

  const addMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.from("organization_jurisdictions").insert({
        organization_id: orgId,
        jurisdiction_code: code,
        is_active: true,
        source: "manual",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["my-jurisdictions"] });
      toast.success("Jurisdicción añadida");
    },
    onError: () => toast.error("Error al añadir jurisdicción"),
  });

  const filtered = useMemo(() => {
    return allOffices.filter(o => {
      const q = search.toLowerCase();
      if (q) {
        const name = String(o.name_en || o.name || "").toLowerCase();
        const code = String(o.country_code || o.code || "").toLowerCase();
        if (!name.includes(q) && !code.includes(q)) return false;
      }
      if (regionFilter !== "all" && o.region !== regionFilter) return false;
      return true;
    });
  }, [allOffices, search, regionFilter]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Añadir Jurisdicción</DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar oficina..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={regionFilter} onValueChange={setRegionFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue placeholder="Región" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              <SelectItem value="europe">Europa</SelectItem>
              <SelectItem value="latin_america">América Latina</SelectItem>
              <SelectItem value="north_america">América del Norte</SelectItem>
              <SelectItem value="asia_pacific">Asia Pacífico</SelectItem>
              <SelectItem value="africa">África</SelectItem>
              <SelectItem value="middle_east">Oriente Medio</SelectItem>
              <SelectItem value="oceania">Oceanía</SelectItem>
              <SelectItem value="international">Internacional</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {!canAddMore && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 dark:bg-amber-950/20 dark:border-amber-800 mb-2">
            <Lock className="h-4 w-4 text-amber-500" />
            <span className="text-sm">Límite alcanzado. Upgrade tu plan para añadir más jurisdicciones.</span>
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {filtered.map(o => {
            const code = String(o.country_code || o.code);
            const isSubscribed = subscribedSet.has(code);
            return (
              <div
                key={code}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border transition-colors",
                  isSubscribed ? "bg-muted/50 opacity-60" : "hover:bg-muted/30 cursor-pointer"
                )}
                onClick={() => {
                  if (!isSubscribed && canAddMore) addMutation.mutate(code);
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-lg">{String(o.flag_emoji || "🏛️")}</span>
                  <div>
                    <span className="font-medium text-sm">{code}</span>
                    <span className="text-sm text-muted-foreground ml-2">{String(o.name_en || o.name || "")}</span>
                  </div>
                  <div className="flex gap-1 ml-2">
                    {o.supports_trademarks && <Badge variant="outline" className="text-[9px] px-1 h-4">T</Badge>}
                    {o.supports_patents && <Badge variant="outline" className="text-[9px] px-1 h-4">P</Badge>}
                    {o.supports_designs && <Badge variant="outline" className="text-[9px] px-1 h-4">D</Badge>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {o.rejection_rate_pct != null && (
                    <span className="text-xs text-muted-foreground">{String(o.rejection_rate_pct)}%</span>
                  )}
                  {isSubscribed && <Check className="h-4 w-4 text-emerald-500" />}
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
