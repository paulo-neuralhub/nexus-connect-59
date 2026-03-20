/**
 * CRM Kanban Page V2 — Real data from crm_* tables
 * Replaces old CRMPipelinePage at /app/crm/kanban
 */
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePageTitle } from "@/contexts/page-context";
import { useCRMPipelines, useDefaultCRMPipeline } from "@/hooks/crm/v2/pipelines";
import { useCRMDeals, useMoveDealStage } from "@/hooks/crm/v2/deals";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, TrendingUp, Kanban } from "lucide-react";
import { DealsKanbanBoard } from "@/components/features/crm/v2/kanban";
import { DealFormModal } from "@/components/features/crm/v2/DealFormModal";
import { DealDetailPanel } from "@/components/features/crm/v2/deal-panel";
import { EmptyState } from "@/components/ui/empty-state";

function formatEUR(amount: number) {
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(amount);
}

export default function CRMKanbanPageV2() {
  usePageTitle("Pipeline");
  const navigate = useNavigate();

  const { data: pipelines = [], isLoading: loadingPipelines } = useCRMPipelines();
  const { data: defaultPipeline } = useDefaultCRMPipeline();
  const [pipelineId, setPipelineId] = useState<string | undefined>(undefined);

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
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-full md:w-[280px]">
            <Select value={activePipelineId ?? ""} onValueChange={(v) => setPipelineId(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Pipeline" />
              </SelectTrigger>
              <SelectContent>
                {pipelines.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* SILK NeoBadge KPIs */}
          <div className="hidden md:flex items-center gap-3">
            <div
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <span className="text-muted-foreground">Deals: </span>
              <span className="font-bold text-foreground">{openDeals.length}</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <span className="text-muted-foreground">Pipeline: </span>
              <span className="font-bold text-foreground">{formatEUR(totalValue)}</span>
            </div>
            <div
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "linear-gradient(135deg, hsl(var(--muted)) 0%, hsl(var(--background)) 100%)",
                border: "1px solid hsl(var(--border))",
              }}
            >
              <span className="text-muted-foreground">Win rate: </span>
              <span className="font-bold text-foreground">{winRate}%</span>
            </div>
          </div>

          <Button
            onClick={() => {
              setPrefillStageId(undefined);
              setShowDealForm(true);
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Deal
          </Button>
        </div>
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
      ) : deals.length === 0 ? (
        <EmptyState
          icon={<TrendingUp className="w-8 h-8" />}
          title="Sin deals en este pipeline"
          description="Crea tu primer deal para comenzar a hacer seguimiento de oportunidades."
          actionLabel="Crear deal"
          onAction={() => setShowDealForm(true)}
        />
      ) : (
        <DealsKanbanBoard
          pipeline={selectedPipeline}
          deals={deals.map((d) => ({
            id: d.id,
            name: d.name,
            amount: d.amount_eur ?? d.amount,
            stage_id: d.pipeline_stage_id ?? null,
            stage_entered_at: d.stage_entered_at ?? null,
            account: d.account ?? null,
          }))}
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
