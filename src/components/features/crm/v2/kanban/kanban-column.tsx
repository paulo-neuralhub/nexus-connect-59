/**
 * KanbanColumn — Pipedrive-style column with sticky header, metrics, and add button
 */
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Plus } from "lucide-react";
import type { CRMPipelineStage } from "@/hooks/crm/v2/pipelines";
import type React from "react";

type DealLite = {
  id: string;
  amount?: number | null;
};

type Props = {
  stage: CRMPipelineStage;
  deals: DealLite[];
  onAddDeal: (stageId: string) => void;
  children: React.ReactNode;
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k €`;
  return new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

export function KanbanColumn({ stage, deals, onAddDeal, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[280px] flex-shrink-0 rounded-xl transition-all duration-200",
        isOver && "ring-2 ring-primary/50 bg-primary/5"
      )}
      style={{ height: "100%", background: "#F8FAFC" }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 rounded-t-xl px-3 pt-3 pb-2" style={{ background: "#F8FAFC" }}>
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stage.color }}
          />
          <span className="text-sm font-semibold text-foreground truncate flex-1">
            {stage.name}
          </span>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-[18px]">
          <span className="font-medium">{formatCurrency(total)}</span>
          {!stage.is_won_stage && !stage.is_lost_stage && (
            <span>· {stage.probability}% prob.</span>
          )}
          {stage.is_won_stage && <span className="text-green-600">✓ Ganados</span>}
          {stage.is_lost_stage && <span className="text-red-500">✗ Perdidos</span>}
        </div>
      </div>

      {/* Cards area */}
      <div
        className="flex-1 px-2 pb-2 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[60px] py-1">
            {children}
          </div>
        </SortableContext>

        {deals.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <span className="text-2xl mb-1">
              {stage.is_won_stage ? "🎉" : stage.is_lost_stage ? "😔" : "📭"}
            </span>
            <p className="text-xs">Arrastra deals aquí</p>
          </div>
        )}
      </div>

      {/* Add button */}
      {!stage.is_won_stage && !stage.is_lost_stage && (
        <div className="px-2 pb-2">
          <button
            type="button"
            onClick={() => onAddDeal(stage.id)}
            className={cn(
              "w-full p-2 text-xs text-muted-foreground rounded-lg",
              "border border-dashed border-border/60",
              "hover:text-primary hover:bg-background hover:border-primary/30 transition-colors",
              "flex items-center justify-center gap-1"
            )}
          >
            <Plus className="w-3.5 h-3.5" />
            Añadir deal
          </button>
        </div>
      )}
    </div>
  );
}
