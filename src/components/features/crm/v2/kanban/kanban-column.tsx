/**
 * KanbanColumn — Pipedrive-style column with colored header, sticky, metrics, lock icons
 */
import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { cn } from "@/lib/utils";
import { Plus, AlertTriangle, Lock, UserCheck } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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

/** Convert hex to rgba for backgrounds */
function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function KanbanColumn({ stage, deals, onAddDeal, children }: Props) {
  const { setNodeRef, isOver } = useDroppable({ id: stage.id });
  const total = deals.reduce((sum, d) => sum + (d.amount ?? 0), 0);
  const stageColor = stage.color || "#94A3B8";

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col w-[280px] flex-shrink-0 rounded-xl transition-all duration-200 overflow-hidden",
        isOver && "ring-2 ring-primary/50"
      )}
      style={{ height: "100%", background: "rgba(238, 242, 247, 0.6)" }}
    >
      {/* Sticky header — tinted with stage color */}
      <div
        className="sticky top-0 z-10 px-3 pt-3 pb-2"
        style={{
          background: hexToRgba(stageColor, 0.08),
          borderBottom: `2px solid ${stageColor}`,
        }}
      >
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: stageColor }}
          />
          <span
            className="text-[13px] font-bold text-foreground truncate flex-1 uppercase"
            style={{ letterSpacing: "0.05em" }}
          >
            {stage.name}
          </span>
          {/* Lock type icon */}
          {stage.lock_type && stage.lock_type !== "free" && (
            <TooltipProvider delayDuration={200}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="shrink-0">
                    {stage.lock_type === "confirm" && <AlertTriangle className="w-3 h-3 text-amber-500" />}
                    {stage.lock_type === "matter_driven" && <Lock className="w-3 h-3 text-muted-foreground" />}
                    {stage.lock_type === "admin_only" && <UserCheck className="w-3 h-3 text-muted-foreground" />}
                  </span>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[240px] text-xs">
                  {(stage.lock_message ?? "").substring(0, 80) || (
                    stage.lock_type === "confirm" ? "Requiere confirmación"
                    : stage.lock_type === "matter_driven" ? "Controlada por expediente"
                    : "Solo administradores"
                  )}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white min-w-[22px] text-center"
            style={{ backgroundColor: stageColor }}
          >
            {deals.length}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-[18px]">
          <span className="font-semibold" style={{ fontVariantNumeric: "tabular-nums" }}>
            {formatCurrency(total)}
          </span>
          {!stage.is_won_stage && !stage.is_lost_stage && (
            <span>· {stage.probability}% prob.</span>
          )}
          {stage.is_won_stage && <span className="text-green-600 font-semibold">✓ Ganados</span>}
          {stage.is_lost_stage && <span className="text-red-500 font-semibold">✗ Perdidos</span>}
        </div>
      </div>

      {/* Cards area */}
      <div
        className="flex-1 px-2 pb-2 overflow-y-auto min-h-0"
        style={{ scrollbarWidth: "thin", scrollbarColor: "#cbd5e1 transparent" }}
      >
        <SortableContext items={deals.map((d) => d.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-2 min-h-[60px] py-2">
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
              "hover:text-primary hover:bg-white hover:border-primary/30 transition-colors",
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
