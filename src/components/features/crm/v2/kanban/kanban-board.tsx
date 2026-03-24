/**
 * DealsKanbanBoard — DnD board using redesigned cards and columns
 */
import { useMemo, useState } from "react";
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
import type { CRMPipeline, CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import type { CRMDeal } from "@/hooks/crm/v2/types";
import { useMoveDealStage } from "@/hooks/crm/v2/deals";
import { KanbanColumn } from "./kanban-column";
import { DealKanbanCard } from "./deal-kanban-card";
import type React from "react";

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

export function DealsKanbanBoard({ pipeline, deals, onDealClick, onAddDeal }: Props) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const moveDeal = useMoveDealStage();

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

  /** Resolve the target stage from a drag-over id (could be a stage id OR a deal id) */
  function resolveStageId(overId: string): string | null {
    // Direct match on a stage
    if (stages.some((s) => s.id === overId)) return overId;
    // Otherwise it's a deal id — find which stage contains it
    for (const [stageId, stageDeals] of Object.entries(dealsByStage)) {
      if (stageDeals.some((d) => d.id === overId)) return stageId;
    }
    return null;
  }

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

    try {
      await moveDeal.mutateAsync({ dealId, newStageId });
      toast.success(`Deal movido a "${newStage?.name ?? ""}"`);
    } catch {
      toast.error("No se pudo mover el deal");
    }
  }

  return (
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
                <SortableDeal
                  key={deal.id}
                  deal={deal}
                  stageColor={stage.color}
                  onClick={() => onDealClick(deal.id)}
                />
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
  );
}
