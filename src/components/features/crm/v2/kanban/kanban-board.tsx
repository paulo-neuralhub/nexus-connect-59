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
import { StageLockBadge } from "./StageLockBadge";
import { StageLockModal } from "./StageLockModal";
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

// ── Utilities ──────────────────────────────────────────────
function formatLegalDate(isoDate: string): string {
  return new Date(isoDate).toLocaleDateString("es-ES", {
    day: "numeric", month: "long", year: "numeric", timeZone: "UTC",
  });
}

function formatRelativeTime(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "ahora mismo";
  if (minutes < 60) return `hace ${minutes}m`;
  return `hace ${Math.floor(minutes / 60)}h`;
}

// ── DealDeadlineIndicator ──────────────────────────────────
function DealDeadlineIndicator({
  deal,
  deadlinesByMatter,
}: {
  deal: KanbanDeal;
  deadlinesByMatter: Record<string, KanbanDeadline[]>;
}) {
  const matterDeadlines = deal.matter_id ? (deadlinesByMatter[deal.matter_id] ?? []) : [];
  const overdueList = matterDeadlines.filter((d) => d.status === "overdue");
  const urgentList = matterDeadlines.filter(
    (d) => d.status === "pending" && new Date(d.deadline_date) <= new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)
  );

  if (overdueList.length === 0 && urgentList.length === 0) return null;

  return (
    <div className="mt-2 space-y-1">
      {overdueList.length > 0 && (
        <div className="flex items-center gap-1.5 text-xs text-destructive">
          <span className="w-1.5 h-1.5 rounded-full bg-destructive animate-pulse shrink-0 inline-block" />
          <span className="truncate">
            {overdueList.length === 1 ? overdueList[0].title : `${overdueList.length} plazos vencidos`}
          </span>
        </div>
      )}
      {urgentList.length > 0 && overdueList.length === 0 && (
        <div className="flex items-center gap-1.5 text-xs text-amber-600">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 inline-block" />
          <span className="truncate">
            {urgentList.length === 1 ? urgentList[0].title : `${urgentList.length} plazos urgentes`}
          </span>
        </div>
      )}
    </div>
  );
}

// ── SortableDeal ───────────────────────────────────────────
function SortableDeal({
  deal,
  stageColor,
  onClick,
  deadlineIndicator,
}: {
  deal: CRMDeal;
  stageColor?: string;
  onClick: () => void;
  deadlineIndicator?: React.ReactNode;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: deal.id });
  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <DealKanbanCard deal={deal} stageColor={stageColor} isDragging={isDragging} onClick={onClick} />
      {deadlineIndicator}
    </div>
  );
}

// ── Props ──────────────────────────────────────────────────
type Props = {
  pipeline: CRMPipeline;
  deals: CRMDeal[];
  onDealClick: (dealId: string) => void;
  onAddDeal: (stageId: string) => void;
};

export function DealsKanbanBoard({ pipeline, deals, onDealClick, onAddDeal }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [wonDeal, setWonDeal] = useState<CRMDeal | null>(null);
  const [shakeCardId, setShakeCardId] = useState<string | null>(null);
  const [isExecutingMove, setIsExecutingMove] = useState(false);

  // Lock modal state
  const [lockModal, setLockModal] = useState<{
    open: boolean;
    type: string;
    message: string;
    matterId?: string;
    deadlines?: KanbanDeadline[];
  }>({ open: false, type: "", message: "" });

  // Confirm modal state (v2 with targetStageName + notes param)
  const [confirmModal, setConfirmModal] = useState<{
    open: boolean;
    message: string;
    lockType: string;
    checklist?: ChecklistItem[];
    targetStageName?: string;
    onConfirm: ((notes: string) => void) | null;
  }>({ open: false, message: "", lockType: "", targetStageName: undefined, onConfirm: null });

  const moveDeal = useMoveDealStage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { organizationId } = useOrganization();
  const { userRole } = useOrgContext();

  // Deadlines hook
  const kanbanDeals: KanbanDeal[] = useMemo(
    () =>
      deals.map((d) => ({
        id: d.id,
        name: d.name,
        pipeline_stage_id: d.pipeline_stage_id ?? "",
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
    lastFetchAt,
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

  // Helper to convert CRMPipelineStage → KanbanStage
  function toKanbanStage(s: CRMPipelineStage): KanbanStage {
    return {
      id: s.id,
      name: s.name,
      position: s.position ?? 0,
      lock_type: (s.lock_type as KanbanStage["lock_type"]) ?? "free",
      lock_direction: ((s as any).lock_direction as KanbanStage["lock_direction"]) ?? "bidirectional",
      lock_message: s.lock_message ?? null,
      requires_matter: (s as any).requires_matter ?? false,
      entry_checklist: (s as any).entry_checklist ?? [],
      allowed_roles: (s as any).allowed_roles ?? [],
      is_won_stage: s.is_won_stage ?? false,
      is_lost_stage: s.is_lost_stage ?? false,
      matter_status_trigger: (s as any).matter_status_trigger ?? null,
    };
  }

  const executeDealMove = useCallback(
    async (dealId: string, deal: CRMDeal, newStage: CRMPipelineStage, notes?: string) => {
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
              content: notes || undefined,
            });
          } catch {
            // Don't block on activity logging
          }
        }

        // Log confirmation note if provided
        if (notes && !newStage.is_won_stage && !newStage.is_lost_stage) {
          try {
            await fromTable("activities").insert({
              organization_id: deal.organization_id,
              contact_id: (deal as any).contact?.id ?? null,
              deal_id: deal.id,
              type: "note",
              subject: "Cambio de etapa confirmado",
              content: notes,
            });
          } catch {
            // Don't block
          }
        }

        refreshDeadlines();
      } catch {
        toast.error("No se pudo mover el deal");
      }
    },
    [moveDeal, refreshDeadlines]
  );

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

    const currentStage = stages.find((s) => s.id === deal.pipeline_stage_id);
    if (!currentStage) return;

    if (isExecutingMove) return;

    const kanbanDeal: KanbanDeal = {
      id: deal.id,
      name: deal.name,
      pipeline_stage_id: deal.pipeline_stage_id ?? "",
      matter_id: deal.matter_id ?? null,
      organization_id: deal.organization_id,
      stage_history: (deal as any).stage_history ?? [],
      stage_entered_at: (deal as any).stage_entered_at ?? null,
    };

    const targetKS = toKanbanStage(newStage);
    const currentKS = toKanbanStage(currentStage);

    const validation = canMoveToStage(kanbanDeal, currentKS, targetKS, {
      userRole: userRole ?? null,
      deadlinesByMatter,
      isLoadingDeadlines,
    });

    if (!validation.allowed) {
      logBlockedMove(kanbanDeal, targetKS, validation, {
        supabase,
        organizationId: organizationId ?? "",
        userId: user?.id ?? "",
      });

      setShakeCardId(dealId);
      setTimeout(() => setShakeCardId(null), 400);

      if (["matter_driven", "forward_only", "requires_matter"].includes(validation.lockType ?? "")) {
        setLockModal({
          open: true,
          type: validation.lockType ?? "",
          message: validation.reason ?? "",
          matterId: deal.matter_id ?? undefined,
        });
      } else if (validation.lockType === "deadline_blocked") {
        setLockModal({
          open: true,
          type: "deadline_blocked",
          message: validation.reason ?? "",
          matterId: deal.matter_id ?? undefined,
          deadlines: validation.deadlines,
        });
      } else {
        toast.error(validation.reason ?? "Movimiento no permitido");
      }
      return;
    }

    if (validation.requiresConfirmation) {
      setConfirmModal({
        open: true,
        message: validation.confirmMessage ?? "¿Confirmar?",
        lockType: validation.lockType ?? "confirm",
        checklist: validation.checklist,
        targetStageName: newStage.name,
        onConfirm: async (notes: string) => {
          setConfirmModal((m) => ({ ...m, open: false }));
          setIsExecutingMove(true);
          await executeDealMove(dealId, deal, newStage, notes);
          setIsExecutingMove(false);
        },
      });
      return;
    }

    // Free move
    setIsExecutingMove(true);
    await executeDealMove(dealId, deal, newStage);
    setIsExecutingMove(false);
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

      {/* Freshness indicator */}
      <div className="flex items-center justify-end mb-2">
        <span className="text-xs text-muted-foreground flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full shrink-0 ${
              isLoadingDeadlines ? "bg-amber-400 animate-pulse" : "bg-green-400"
            }`}
          />
          {isLoadingDeadlines
            ? "Actualizando plazos..."
            : lastFetchAt
              ? `Plazos · ${formatRelativeTime(lastFetchAt)}`
              : "Plazos sin cargar"}
          {!isLoadingDeadlines && (
            <button
              type="button"
              onClick={refreshDeadlines}
              className="text-primary hover:text-primary/80 underline text-xs ml-0.5"
            >
              Actualizar
            </button>
          )}
        </span>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: 520 }}>
          {stages.map((stage) => {
            const stageDeals = dealsByStage[stage.id] ?? [];
            const kanbanStage = toKanbanStage(stage);

            // Count overdue deals in this column
            const colOverdue = stageDeals.filter(
              (d) =>
                d.matter_id &&
                (deadlinesByMatter[d.matter_id] ?? []).some((dl) => dl.status === "overdue")
            ).length;

            return (
              <KanbanColumn
                key={stage.id}
                stage={stage as CRMPipelineStage}
                deals={stageDeals.map((d) => ({ id: d.id, amount: d.amount_eur ?? d.amount }))}
                onAddDeal={onAddDeal}
              >
                {/* Lock badge + overdue counter injected above cards */}
                {(kanbanStage.lock_type !== "free" || colOverdue > 0) && (
                  <div className="flex items-center gap-1.5 mb-1 -mt-1">
                    <StageLockBadge stage={kanbanStage} />
                    {colOverdue > 0 && (
                      <span className="text-xs bg-red-100 text-red-600 border border-red-200 rounded-full px-1.5 py-0.5 font-medium">
                        {colOverdue}⚠
                      </span>
                    )}
                  </div>
                )}

                {/* matter_driven empty state */}
                {kanbanStage.lock_type === "matter_driven" && stageDeals.length === 0 && (
                  <div className="text-center py-8 px-4">
                    <Lock className="w-8 h-8 text-blue-200 mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Los deals llegan aquí automáticamente desde el expediente vinculado
                    </p>
                  </div>
                )}

                {stageDeals.map((deal) => {
                  const kd: KanbanDeal = {
                    id: deal.id,
                    name: deal.name,
                    pipeline_stage_id: deal.pipeline_stage_id ?? "",
                    matter_id: deal.matter_id ?? null,
                    organization_id: deal.organization_id,
                    stage_history: (deal as any).stage_history ?? [],
                    stage_entered_at: (deal as any).stage_entered_at ?? null,
                  };

                  return (
                    <div key={deal.id} className={shakeCardId === deal.id ? "shake-card" : ""}>
                      <SortableDeal
                        deal={deal}
                        stageColor={stage.color}
                        onClick={() => onDealClick(deal.id)}
                        deadlineIndicator={
                          <DealDeadlineIndicator deal={kd} deadlinesByMatter={deadlinesByMatter} />
                        }
                      />
                    </div>
                  );
                })}
              </KanbanColumn>
            );
          })}
        </div>

        <DragOverlay>
          {activeDeal ? <DealKanbanCard deal={activeDeal} isDragging /> : null}
        </DragOverlay>
      </DndContext>

      {/* Won deal modal */}
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

      {/* Lock modal (blocked moves) */}
      <StageLockModal
        open={lockModal.open}
        type={lockModal.type}
        message={lockModal.message}
        matterId={lockModal.matterId}
        deadlines={lockModal.deadlines}
        onClose={() => setLockModal((m) => ({ ...m, open: false }))}
      />

      {/* Confirm modal (v2 with checklist + notes) */}
      <StageConfirmModal
        open={confirmModal.open}
        message={confirmModal.message}
        lockType={confirmModal.lockType}
        targetStageName={confirmModal.targetStageName}
        checklist={confirmModal.checklist}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal((m) => ({ ...m, open: false, onConfirm: null }))}
      />
    </>
  );
}
