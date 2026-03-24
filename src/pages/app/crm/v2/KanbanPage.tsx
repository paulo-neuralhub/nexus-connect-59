/**
 * CRM Kanban Page V2 — Redesigned with Pipedrive-style UI
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMPipelines, useDefaultCRMPipeline } from "@/hooks/crm/v2/pipelines";
import { useCRMDeals } from "@/hooks/crm/v2/deals";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Settings, Search, Filter, RefreshCw, Kanban, TrendingUp } from "lucide-react";
import { DealsKanbanBoard } from "@/components/features/crm/v2/kanban";
import { DealFormModal } from "@/components/features/crm/v2/DealFormModal";
import { DealDetailModal } from "@/components/features/crm/v2/deal-panel";
import { EmptyState } from "@/components/ui/empty-state";
import { Link } from "react-router-dom";

/** Pipeline color by type or id */
const PIPELINE_COLORS: Record<string, string> = {
  // By known IDs
  "b0100001-0000-0000-0000-000000000001": "#3B82F6", // Captación
  "b0100002-0000-0000-0000-000000000002": "#8B5CF6", // Marca
  "b0100003-0000-0000-0000-000000000003": "#0EA5E9", // Patente
  "b0100004-0000-0000-0000-000000000004": "#EF4444", // Contencioso
  "b0100005-0000-0000-0000-000000000005": "#14B8A6", // Renovaciones
  // By pipeline_type fallback
  sales: "#3B82F6",
  trademark: "#8B5CF6",
  patent: "#0EA5E9",
  litigation: "#EF4444",
  renewal: "#14B8A6",
  renewals: "#14B8A6",
  ip_services: "#6366F1",
};

function getPipelineColor(p: { id: string; pipeline_type?: string | null }) {
  return PIPELINE_COLORS[p.id] ?? PIPELINE_COLORS[p.pipeline_type ?? ""] ?? "#64748B";
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k €`;
  return `${value.toLocaleString("es-ES")} €`;
}

export default function CRMKanbanPageV2() {
  usePageTitle("Pipeline");
  const navigate = useNavigate();

  const { data: pipelines = [], isLoading: loadingPipelines, refetch } = useCRMPipelines();
  const { data: defaultPipeline } = useDefaultCRMPipeline();
  const [pipelineId, setPipelineId] = useState<string | undefined>(undefined);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null);

  const activePipelineId = pipelineId || defaultPipeline?.id;
  const selectedPipeline = pipelines.find((p) => p.id === activePipelineId) ?? defaultPipeline;

  const { data: deals = [], isLoading: loadingDeals } = useCRMDeals(
    activePipelineId ? { pipeline_id: activePipelineId } : undefined
  );

  const [showDealForm, setShowDealForm] = useState(false);
  const [prefillStageId, setPrefillStageId] = useState<string | undefined>();
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [showPanel, setShowPanel] = useState(false);

  const selectedDeal = useMemo(
    () => (selectedDealId ? deals.find((d) => d.id === selectedDealId) : undefined),
    [deals, selectedDealId]
  );

  // Filter deals by search + type
  const filteredDeals = useMemo(() => {
    let result = deals;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          (d.account_name_cache ?? "").toLowerCase().includes(q) ||
          (d.account?.name ?? "").toLowerCase().includes(q)
      );
    }
    if (filterType) {
      result = result.filter((d) => d.deal_type === filterType || d.opportunity_type === filterType);
    }
    return result;
  }, [deals, searchQuery, filterType]);

  // KPIs
  const openDeals = deals.filter((d) => !d.pipeline_stage?.is_won_stage && !d.pipeline_stage?.is_lost_stage);
  const totalValue = openDeals.reduce((s, d) => s + (d.amount_eur ?? d.amount ?? 0), 0);
  const wonCount = deals.filter((d) => d.pipeline_stage?.is_won_stage).length;
  const closedCount = deals.filter((d) => d.pipeline_stage?.is_won_stage || d.pipeline_stage?.is_lost_stage).length;
  const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0;

  const isLoading = loadingPipelines || loadingDeals;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="flex gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-[400px] w-80 rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!selectedPipeline || pipelines.length === 0) {
    return (
      <EmptyState
        icon={<Kanban className="w-8 h-8" />}
        title="Sin pipelines configurados"
        description="Crea un pipeline con etapas para comenzar a gestionar deals."
        actionLabel="Configurar pipelines"
        onAction={() => navigate("/app/crm/settings")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Row 1: Pipeline selector + KPIs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Select value={activePipelineId ?? ""} onValueChange={(v) => setPipelineId(v)}>
            <SelectTrigger className="w-[280px] h-10 font-semibold text-[15px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.08)] border-border">
              <div className="flex items-center gap-2.5">
                {selectedPipeline && (
                  <span
                    className="w-3 h-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: getPipelineColor(selectedPipeline) }}
                  />
                )}
                <SelectValue placeholder="Seleccionar pipeline..." />
              </div>
            </SelectTrigger>
            <SelectContent className="bg-white border shadow-lg z-50">
              {pipelines.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: getPipelineColor(p) }}
                    />
                    <span>{p.name}</span>
                    {p.is_default && (
                      <span className="text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded ml-1">
                        Default
                      </span>
                    )}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Link to="/app/settings" state={{ section: "crm" }}>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Configurar pipelines">
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        {/* KPI chips */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Deals:</span>
            <span className="font-bold">{deals.length}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Pipeline:</span>
            <span className="font-bold text-primary">{formatCurrency(totalValue)}</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Win rate:</span>
            <span className="font-bold text-green-600">{winRate}%</span>
          </div>
          <div className="h-4 w-px bg-border" />
          <div className="flex items-center gap-1.5">
            <span className="text-muted-foreground">Activos:</span>
            <span className="font-bold">{openDeals.length}</span>
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
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 h-9"
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant={filterType ? "secondary" : "outline"} size="sm" className="h-9">
              <Filter className="w-3.5 h-3.5 mr-1.5" />
              {filterType ? `🏷️ ${filterType}` : "Tipo"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="bg-background">
            <DropdownMenuItem onClick={() => setFilterType(null)}>Todos</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("trademark")}>⚖️ Trademark</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("patent")}>🔬 Patent</DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterType("design")}>🎨 Design</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button variant="outline" size="icon" className="h-9 w-9" onClick={() => refetch()}>
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>

        <div className="flex-1" />

        <Button
          onClick={() => {
            setPrefillStageId(undefined);
            setShowDealForm(true);
          }}
          className="h-9"
        >
          <Plus className="w-4 h-4 mr-1.5" />
          Nuevo Deal
        </Button>
      </div>

      {/* Kanban Board */}
      {(selectedPipeline.stages?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Kanban className="w-8 h-8" />}
          title="Pipeline sin etapas"
          description="Agrega etapas a este pipeline para empezar a organizar tus deals."
          actionLabel="Configurar etapas"
          onAction={() => navigate("/app/crm/settings")}
        />
      ) : filteredDeals.length === 0 && deals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8" />}
          title="Sin deals en este pipeline"
          description="Crea tu primer deal para comenzar a hacer seguimiento."
          actionLabel="Crear deal"
          onAction={() => setShowDealForm(true)}
        />
      ) : (
        <DealsKanbanBoard
          pipeline={selectedPipeline}
          deals={filteredDeals}
          onDealClick={(dealId) => {
            setSelectedDealId(dealId);
            setShowPanel(true);
          }}
          onAddDeal={(stageId) => {
            setPrefillStageId(stageId);
            setShowDealForm(true);
          }}
        />
      )}

      <DealFormModal
        open={showDealForm}
        onClose={() => setShowDealForm(false)}
        defaultPipelineId={activePipelineId}
        defaultStageId={prefillStageId}
      />

      <DealDetailPanel
        deal={selectedDeal ?? null}
        open={showPanel}
        onClose={() => setShowPanel(false)}
        stages={selectedPipeline?.stages ?? []}
        onEdit={() => {
          setShowPanel(false);
          setShowDealForm(true);
        }}
      />
    </div>
  );
}
