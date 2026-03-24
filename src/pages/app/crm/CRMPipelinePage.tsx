/**
 * CRM Kanban Page — Redesign Pipedrive/HubSpot level
 * Uses CRM v2 hooks, dnd-kit drag & drop, stage automations
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { usePageTitle } from '@/contexts/page-context';
import {
  DndContext, DragOverlay, closestCorners,
  PointerSensor, KeyboardSensor, useSensor, useSensors,
  DragStartEvent, DragEndEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Skeleton } from '@/components/ui/skeleton';
import { KanbanSquare, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

import { useCRMPipelines } from '@/hooks/crm/v2/pipelines';
import { useDealsByStage, useMoveDealStage } from '@/hooks/crm/v2/deals';
import { KanbanHeader } from '@/components/features/crm/v2/kanban/KanbanHeader';
import { KanbanColumn } from '@/components/features/crm/v2/kanban/KanbanColumn';
import { KanbanDealCard } from '@/components/features/crm/v2/kanban/KanbanDealCard';
import { LostDealModal } from '@/components/features/crm/v2/kanban/LostDealModal';
import { DealFormModal } from '@/components/features/crm/v2/DealFormModal';
import { onDealStageChange } from '@/lib/crm/stage-automations';
import { supabase } from '@/integrations/supabase/client';
import type { CRMDeal } from '@/hooks/crm/v2/types';

export default function CRMPipelinePage() {
  usePageTitle('Kanban CRM');
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const boardRef = useRef<HTMLDivElement | null>(null);
  const scrollRef = useRef(0);

  // Pipeline selection
  const { data: pipelines = [], isLoading: loadingPipelines } = useCRMPipelines();
  const [selectedPipelineId, setSelectedPipelineId] = useState<string | null>(null);

  // Set default pipeline
  useEffect(() => {
    if (pipelines.length > 0 && !selectedPipelineId) {
      const urlPipeline = searchParams.get('pipeline');
      const found = urlPipeline ? pipelines.find(p => p.id === urlPipeline) : null;
      const def = found || pipelines.find(p => p.is_default) || pipelines[0];
      if (def) setSelectedPipelineId(def.id);
    }
  }, [pipelines, selectedPipelineId, searchParams]);

  const selectedPipeline = useMemo(
    () => pipelines.find(p => p.id === selectedPipelineId) || pipelines[0],
    [pipelines, selectedPipelineId]
  );

  const stages = useMemo(
    () => (selectedPipeline?.stages ?? []).slice().sort((a, b) => a.position - b.position),
    [selectedPipeline]
  );

  // Deals grouped by stage
  const {
    deals, dealsByStage, kpis, isLoading: loadingDeals, refetch,
  } = useDealsByStage(selectedPipelineId ?? undefined, stages);

  const moveDeal = useMoveDealStage();

  // UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Lost deal modal
  const [lostModalDeal, setLostModalDeal] = useState<CRMDeal | null>(null);
  const [lostTargetStageId, setLostTargetStageId] = useState<string | null>(null);

  // Sensors
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  // Filter deals
  const filteredDealsByStage = useMemo(() => {
    const result: Record<string, CRMDeal[]> = {};
    for (const stage of stages) {
      let stageDeals = dealsByStage[stage.id] || [];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        stageDeals = stageDeals.filter(d =>
          d.name?.toLowerCase().includes(q) ||
          d.account?.name?.toLowerCase().includes(q) ||
          d.account_name_cache?.toLowerCase().includes(q)
        );
      }
      if (filterType) {
        stageDeals = stageDeals.filter(d =>
          d.deal_type === filterType || d.opportunity_type === filterType
        );
      }
      result[stage.id] = stageDeals;
    }
    return result;
  }, [stages, dealsByStage, searchQuery, filterType]);

  // Active deals count (not won/lost)
  const activeDeals = useMemo(
    () => deals.filter(d => !d.pipeline_stage?.is_won_stage && !d.pipeline_stage?.is_lost_stage).length,
    [deals]
  );

  // Pipeline change
  const handlePipelineChange = useCallback((id: string) => {
    setSelectedPipelineId(id);
    setSearchParams({ pipeline: id });
  }, [setSearchParams]);

  // Drag handlers
  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    if (boardRef.current) scrollRef.current = boardRef.current.scrollLeft;
  }, []);

  const handleDragEnd = useCallback(async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const dealId = active.id as string;
    const targetStageId = over.id as string;
    const deal = deals.find(d => d.id === dealId);
    if (!deal || deal.pipeline_stage_id === targetStageId) return;

    const targetStage = stages.find(s => s.id === targetStageId);
    if (!targetStage) return;

    // Lost stage → show confirmation modal
    if (targetStage.is_lost_stage) {
      setLostModalDeal(deal);
      setLostTargetStageId(targetStageId);
      return;
    }

    // Move deal
    try {
      await moveDeal.mutateAsync({ dealId, newStageId: targetStageId });

      // Get current user for automations
      const { data: { user } } = await supabase.auth.getUser();

      // Run automations in background
      onDealStageChange({
        dealId, dealName: deal.name,
        accountId: deal.account_id,
        organizationId: deal.organization_id,
        fromStageName: deal.pipeline_stage?.name || null,
        toStageName: targetStage.name,
        isWon: targetStage.is_won_stage,
        isLost: false,
        userId: user?.id,
      });

      if (targetStage.is_won_stage) {
        toast.success('🎉 ¡Deal ganado!');
      }
    } catch {
      // useMoveDealStage already shows error toast
    }

    // Restore scroll
    requestAnimationFrame(() => {
      if (boardRef.current) boardRef.current.scrollLeft = scrollRef.current;
    });
  }, [deals, stages, moveDeal]);

  // Lost deal confirmation
  const handleLostConfirm = useCallback(async (data: { reason: string; notes: string; competitor: string }) => {
    if (!lostModalDeal || !lostTargetStageId) return;

    try {
      await moveDeal.mutateAsync({
        dealId: lostModalDeal.id,
        newStageId: lostTargetStageId,
        lostReason: `${data.reason}: ${data.notes}`.trim(),
      });

      const { data: { user } } = await supabase.auth.getUser();

      onDealStageChange({
        dealId: lostModalDeal.id,
        dealName: lostModalDeal.name,
        accountId: lostModalDeal.account_id,
        organizationId: lostModalDeal.organization_id,
        fromStageName: lostModalDeal.pipeline_stage?.name || null,
        toStageName: 'Perdido',
        isWon: false, isLost: true,
        lostReason: data.reason,
        userId: user?.id,
      });

      toast.success('Deal marcado como perdido');
    } catch {
      // handled by mutation
    }

    setLostModalDeal(null);
    setLostTargetStageId(null);
  }, [lostModalDeal, lostTargetStageId, moveDeal]);

  // Active deal for drag overlay
  const activeDeal = useMemo(
    () => activeId ? deals.find(d => d.id === activeId) : null,
    [activeId, deals]
  );

  const isLoading = loadingPipelines || loadingDeals;

  return (
    <div className="flex flex-col gap-3 h-full" style={{ minHeight: 'calc(100vh - 160px)' }}>
      {/* Header */}
      <KanbanHeader
        pipelines={pipelines}
        selectedPipelineId={selectedPipelineId}
        onPipelineChange={handlePipelineChange}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        filterType={filterType}
        onFilterTypeChange={setFilterType}
        kpis={{ ...kpis, activeDeals }}
        onRefresh={() => { refetch(); toast.success('Datos actualizados'); }}
        onAddDeal={() => setShowCreateModal(true)}
      />

      {/* Board */}
      {isLoading ? (
        <div className="flex gap-3 pb-4 flex-1 overflow-x-auto">
          {[1, 2, 3, 4, 5].map(i => (
            <Skeleton key={i} className="w-[280px] h-[500px] flex-shrink-0 rounded-xl" />
          ))}
        </div>
      ) : stages.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <KanbanSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No hay etapas configuradas</h3>
            <p className="text-muted-foreground mb-4">Crea un pipeline con etapas en la configuración</p>
            <Link to="/app/settings" state={{ section: 'crm' }}>
              <Button>
                <Settings className="w-4 h-4 mr-2" />
                Configurar pipelines
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div
            ref={boardRef}
            className="flex gap-3 pb-4 flex-1 min-h-0"
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              height: 'calc(100vh - 260px)',
              minHeight: '400px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#cbd5e1 transparent',
            }}
          >
            {stages.map(stage => {
              const stageDeals = filteredDealsByStage[stage.id] || [];
              const totalValue = stageDeals.reduce((s, d) => s + (d.amount_eur ?? d.amount ?? 0), 0);
              const avgProb = stageDeals.length > 0
                ? Math.round(stageDeals.reduce((s, d) => s + (d.probability_pct ?? stage.probability ?? 0), 0) / stageDeals.length)
                : stage.probability;

              return (
                <KanbanColumn
                  key={stage.id}
                  id={stage.id}
                  title={stage.name}
                  color={stage.color}
                  count={stageDeals.length}
                  totalValue={totalValue}
                  avgProbability={avgProb}
                  isWon={stage.is_won_stage}
                  isLost={stage.is_lost_stage}
                  onAddDeal={() => setShowCreateModal(true)}
                >
                  {stageDeals.map(deal => (
                    <KanbanDealCard
                      key={deal.id}
                      deal={deal}
                      stageColor={stage.color}
                      onClick={() => navigate(`/app/crm/deals/${deal.id}`)}
                    />
                  ))}
                </KanbanColumn>
              );
            })}
          </div>

          <DragOverlay>
            {activeDeal && (
              <div className="w-[264px]">
                <KanbanDealCard
                  deal={activeDeal}
                  stageColor={activeDeal.pipeline_stage?.color || '#3B82F6'}
                  isDragOverlay
                />
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      {/* Lost deal modal */}
      <LostDealModal
        open={!!lostModalDeal}
        onOpenChange={open => { if (!open) { setLostModalDeal(null); setLostTargetStageId(null); } }}
        dealName={lostModalDeal?.name || ''}
        onConfirm={handleLostConfirm}
        isLoading={moveDeal.isPending}
      />

      {/* Create deal modal */}
      <DealFormModal
        open={showCreateModal}
        onClose={() => { setShowCreateModal(false); refetch(); }}
        defaultPipelineId={selectedPipelineId || undefined}
      />
    </div>
  );
}
