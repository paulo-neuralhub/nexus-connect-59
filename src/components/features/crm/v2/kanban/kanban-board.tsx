/**
 * DealsKanbanBoard — DnD board with lock_type enforcement via canMoveToStage
 */
import { useMemo, useState, useCallback } from "react";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import type { CRMPipeline, CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import type { CRMDeal } from "@/hooks/crm/v2/types";
import { useMoveDealStage } from "@/hooks/crm/v2/deals";
import { fromTable, supabase } from "@/lib/supabase";
import { useOrganization } from "@/hooks/useOrganization";
import { useAuth } from "@/contexts/auth-context";
import { useOrganization as useOrgContext } from "@/contexts/organization-context";
import { KanbanColumn } from "./kanban-column";
import { DealKanbanCard } from "./deal-kanban-card";
import { WonDealMatterModal } from "./WonDealMatterModal";
import { StageConfirmModal } from "./StageConfirmModal";
import { Lock } from "lucide-react";
import type React from "react";

import {
  canMoveToStage,
  executeStageMove,
  logBlockedMove,
  type KanbanStage,
  type KanbanDeal,
  type KanbanDeadline,
  type ChecklistItem,
  type MoveValidationResult,
} from "@/lib/kanban-utils";
import { useKanbanDeadlines } from "@/hooks/useKanbanDeadlines";

function SortableDeal({ deal, stageColor, onClick }: { deal: CRMDeal; stageColor?: string; onClick: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealKanbanCard deal={deal} stageColor={stageColor} isDragging={isDragging} onClick={onClick} />
    </div>
  );
}

type Props = {
  pipeline: CRMPipeline;
  deals: CRMDeal[];
  onDealClick: (dealId: string) => void;
  onAddDeal: (stageId: string) => void;
};

type PendingConfirm = {
  dealId: string;
  deal: CRMDeal;
  stage: CRMPipelineStage;
};

export function DealsKanbanBoard({ pipeline, deals, onDealClick, onAddDeal }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [wonDeal, setWonDeal] = useState<CRMDeal | null>(null);
  const [pendingConfirm, setPendingConfirm] = useState<PendingConfirm | null>(null);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [isExecutingMove, setIsExecutingMove] = useState(false);

  // Lock/confirm modal states for canMoveToStage integration
  const [lockModal, setLockModal] = useState<{
    open: boolean;
    type: string;
    message: string;
    matterId?: string;
    deadlines?: KanbanDeadline[];
  }>({ open: false, type: '', message: '' });

  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    lockType: string;
    checklist?: ChecklistItem[];
    onConfirm: (() => void) | null;
  }>({ open: false, message: '', lockType: '', onConfirm: null });

  const moveDeal = useMoveDealStage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const { userRole } = useOrgContext();

  // Deadlines hook — maps deals to KanbanDeal shape for the hook
  const kanbanDeals: KanbanDeal[] = useMemo(
    () =>
      deals.map((d) => ({
        id: d.id,
        name: d.name,
        pipeline_stage_id: d.pipeline_stage_id ?? '',
        matter_id: d.matter_id ?? null,
        organization_id: d.organization_id,
        stage_history: (d as any).stage_history ?? [],
        stage_entered_at: (d as any).stage_entered_at ?? null,
      })),
    [deals]
  );

  const {
    deadlinesByMatter,
    isLoadingDeadlines,
    refreshDeadlines,
  } = useKanbanDeadlines(kanbanDeals, organizationId, supabase);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const stages = useMemo(
    () => (pipeline.stages ?? []).slice().sort((a, b) => (a.position ?? 0) - (b.position ?? 0)),
    [pipeline.stages]
  );

  const dealsByStage = useMemo(() => {
    const map: Record<string, CRMDeal[]> = {};
    for (const s of stages) map[s.id] = [];
    for (const d of deals) {
      const sid = d.pipeline_stage_id ?? "";
      if (sid && map[sid]) {
        map[sid].push(d);
      } else if (stages.length > 0) {
        map[stages[0].id].push(d);
      }
    }
    return map;
  }, [deals, stages]);

  const activeDeal = activeId ? deals.find((d) => d.id === activeId) : null;

  function handleDragStart(event: DragStartEvent) {
    setActiveId(event.active.id as string);
  }

  function resolveStageId(overId: string): string | null {
    if (stages.some((s) => s.id === overId)) return overId;
    for (const [stageId, stageDeals] of Object.entries(dealsByStage)) {
      if (stageDeals.some((d) => d.id === overId)) return stageId;
    }
    return null;
  }

  const executeDealMove = useCallback(async (dealId: string, deal: CRMDeal, newStage: CRMPipelineStage) => {
    try {
      await moveDeal.mutateAsync({ dealId, newStageId: newStage.id });
      toast.success(`Deal movido a "${newStage.name}"`);

      if (newStage.is_won_stage && !deal.matter_id) {
        setWonDeal(deal);
      } else if (newStage.is_won_stage && deal.matter_id) {
        toast.success("Deal cerrado ✅ Expediente vinculado actualizado");
      }

      if (newStage.is_won_stage || newStage.is_lost_stage) {
        try {
          await fromTable("activities").insert({
            organization_id: deal.organization_id,
            contact_id: (deal as any).contact?.id ?? null,
            deal_id: deal.id,
            type: "note",
            subject: newStage.is_won_stage
              ? `Deal cerrado — ${newStage.name}`
              : `Deal perdido — ${newStage.name}`,
          });
        } catch {
          // Don't block on activity logging
        }
      }

      refreshDeadlines();
    } catch {
      toast.error("No se pudo mover el deal");
    }
  }, [moveDeal, refreshDeadlines]);

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const dealId = active.id as string;
    const newStageId = resolveStageId(over.id as string);
    if (!newStageId) return;

    const deal = deals.find((d) => d.id === dealId);
    if (!deal || deal.pipeline_stage_id === newStageId) return;

    const newStage = stages.find((s) => s.id === newStageId);
    if (!newStage) return;

    // --- canMoveToStage validation ---
    const currentStage = stages.find((s) => s.id === deal.pipeline_stage_id);
    if (!currentStage) return;

    if (isExecutingMove) return;

    const kanbanDeal: KanbanDeal = {
      id: deal.id,
      name: deal.name,
      pipeline_stage_id: deal.pipeline_stage_id ?? '',
      matter_id: deal.matter_id ?? null,
      organization_id: deal.organization_id,
      stage_history: (deal as any).stage_history ?? [],
      stage_entered_at: (deal as any).stage_entered_at ?? null,
    };

    const targetAsKanbanStage: KanbanStage = {
      id: newStage.id,
      name: newStage.name,
      position: newStage.position ?? 0,
      lock_type: (newStage.lock_type as KanbanStage['lock_type']) ?? 'free',
      lock_direction: ((newStage as any).lock_direction as KanbanStage['lock_direction']) ?? 'bidirectional',
      lock_message: newStage.lock_message ?? null,
      requires_matter: (newStage as any).requires_matter ?? false,
      entry_checklist: (newStage as any).entry_checklist ?? [],
      allowed_roles: (newStage as any).allowed_roles ?? [],
      is_won_stage: newStage.is_won_stage ?? false,
      is_lost_stage: newStage.is_lost_stage ?? false,
      matter_status_trigger: (newStage as any).matter_status_trigger ?? null,
    };

    const currentAsKanbanStage: KanbanStage = {
      id: currentStage.id,
      name: currentStage.name,
      position: currentStage.position ?? 0,
      lock_type: (currentStage.lock_type as KanbanStage['lock_type']) ?? 'free',
      lock_direction: ((currentStage as any).lock_direction as KanbanStage['lock_direction']) ?? 'bidirectional',
      lock_message: currentStage.lock_message ?? null,
      requires_matter: (currentStage as any).requires_matter ?? false,
      entry_checklist: (currentStage as any).entry_checklist ?? [],
      allowed_roles: (currentStage as any).allowed_roles ?? [],
      is_won_stage: currentStage.is_won_stage ?? false,
      is_lost_stage: currentStage.is_lost_stage ?? false,
      matter_status_trigger: (currentStage as any).matter_status_trigger ?? null,
    };

    const validation = canMoveToStage(kanbanDeal, currentAsKanbanStage, targetAsKanbanStage, {
      userRole: userRole ?? null,
      deadlinesByMatter,
      isLoadingDeadlines,
    });

    if (!validation.allowed) {
      // Log blocked move (fire-and-forget)
      logBlockedMove(kanbanDeal, targetAsKanbanStage, validation, {
        supabase,
        organizationId: organizationId ?? '',
        userId: user?.id ?? '',
      });

      // Shake animation
      setShakeCardId(dealId);
      setTimeout(() => setShakeCardId(null), 400);

      if (['matter_driven', 'forward_only', 'requires_matter'].includes(validation.lockType ?? '')) {
        setLockModal({
          open: true,
          type: validation.lockType ?? '',
          message: validation.reason ?? '',
          matterId: deal.matter_id ?? undefined,
        });
      } else if (validation.lockType === 'deadline_blocked') {
        setLockModal({
          open: true,
          type: 'deadline_blocked',
          message: validation.reason ?? '',
          matterId: deal.matter_id ?? undefined,
          deadlines: validation.deadlines,
        });
      } else if (validation.lockType === 'admin_only' || validation.lockType === 'role_restricted') {
        toast.error(validation.reason ?? 'Movimiento no permitido');
      } else {
        toast.error(validation.reason ?? 'Movimiento no permitido');
      }
      return;
    }

    if (validation.requiresConfirmation) {
      // Use existing StageConfirmModal for 'confirm' type, set confirmModal for others
      if (validation.lockType === 'confirm') {
        setPendingConfirm({ dealId, deal, stage: newStage });
      } else {
        setConfirmModal({
          open: true,
          message: validation.confirmMessage ?? '¿Confirmar?',
          lockType: validation.lockType ?? 'confirm',
          checklist: validation.checklist,
          onConfirm: async () => {
            setConfirmModal((m) => ({ ...m, open: false }));
            setIsExecutingMove(true);
            await executeDealMove(dealId, deal, newStage);
            setIsExecutingMove(false);
          },
        });
      }
      return;
    }

    // Free move — execute directly
    setIsExecutingMove(true);
    await executeDealMove(dealId, deal, newStage);
    setIsExecutingMove(false);
  }

  async function handleConfirmMove(note: string) {
    if (!pendingConfirm) return;
    const { dealId, deal, stage } = pendingConfirm;
    setPendingConfirm(null);

    setIsExecutingMove(true);
    await executeDealMove(dealId, deal, stage);
    setIsExecutingMove(false);

    // Log confirmation activity
    try {
      await fromTable("activities").insert({
        organization_id: deal.organization_id,
        contact_id: (deal as any).contact?.id ?? null,
        deal_id: deal.id,
        type: "note",
        subject: "Cambio de etapa confirmado",
        content: note,
      });
    } catch {
      // Don't block
    }
  }

  return (
    <>
      {/* Shake animation CSS */}
      <style>{`
        @keyframes card-shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(8px); }
          75% { transform: translateX(-8px); }
        }
        .shake-card { animation: card-shake 300ms ease-in-out; }
      `}</style>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
          {stages.map((stage) => {
            const stageDeals = dealsByStage[stage.id] ?? [];
            return (
              <KanbanColumn
                key={stage.id}
                stage={stage as CRMPipelineStage}
                deals={stageDeals.map((d) => ({ id: d.id, amount: d.amount_eur ?? d.amount }))}
                onAddDeal={onAddDeal}
              >
                {stageDeals.map((deal) => (
                  <div key={deal.id} className={shakeCardId === deal.id ? "shake-card" : ""}>
                    <SortableDeal
                      deal={deal}
                      stageColor={stage.color}
                      onClick={() => onDealClick(deal.id)}
                    />
                  </div>
                ))}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? (
            <DealKanbanCard deal={activeDeal} isDragging />
          ) : null}
        </DragOverlay>
      </DndContext>

      {wonDeal && (
        <WonDealMatterModal
          open={!!wonDeal}
          onClose={() => setWonDeal(null)}
          dealId={wonDeal.id}
          dealName={wonDeal.name}
          accountId={wonDeal.account_id}
          dealType={wonDeal.deal_type ?? wonDeal.opportunity_type}
        />
      )}

      <StageConfirmModal
        open={!!pendingConfirm}
        onClose={() => setPendingConfirm(null)}
        onConfirm={handleConfirmMove}
        stageName={pendingConfirm?.stage.name ?? ""}
        lockMessage={pendingConfirm?.stage.lock_message ?? null}
        isPending={moveDeal.isPending}
      />
    </>
  );
}
