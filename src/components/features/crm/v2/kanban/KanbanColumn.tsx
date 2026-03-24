/**
 * KanbanColumn — Pipedrive-style column with sticky header, metrics, and add button
 */

import { useDroppable } from '@dnd-kit/core';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  totalValue: number;
  avgProbability: number;
  isWon?: boolean;
  isLost?: boolean;
  children: React.ReactNode;
  onAddDeal?: () => void;
}

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M €`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1)}k €`;
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function KanbanColumn({
  id, title, color, count, totalValue, avgProbability,
  isWon, isLost, children, onAddDeal,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col w-[280px] flex-shrink-0 rounded-xl transition-all duration-200',
        isOver && 'ring-2 ring-primary/50 bg-primary/5',
      )}
      style={{ height: '100%', background: '#F8FAFC' }}
    >
      {/* Sticky header */}
      <div className="sticky top-0 z-10 bg-[#F8FAFC] rounded-t-xl px-3 pt-3 pb-2">
        {/* Row 1: Color dot + name + count + menu */}
        <div className="flex items-center gap-2 mb-1">
          <div
            className="w-2.5 h-2.5 rounded-full flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span className="text-sm font-semibold text-foreground truncate flex-1">
            {title}
          </span>
          <span className="text-xs font-medium bg-muted text-muted-foreground px-1.5 py-0.5 rounded-md">
            {count}
          </span>
        </div>

        {/* Row 2: Total value + avg probability */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground pl-[18px]">
          <span className="font-medium">{formatCurrency(totalValue)}</span>
          {!isWon && !isLost && (
            <span>·  {avgProbability}% prob. media</span>
          )}
          {isWon && <span className="text-green-600">✓ Ganados</span>}
          {isLost && <span className="text-red-500">✗ Perdidos</span>}
        </div>
      </div>

      {/* Cards area with vertical scroll */}
      <div
        className="flex-1 px-2 pb-2 overflow-y-auto min-h-0"
        style={{
          scrollbarWidth: 'thin',
          scrollbarColor: '#cbd5e1 transparent',
        }}
      >
        <div className="space-y-2 min-h-[60px] py-1">
          {children}
        </div>

        {count === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <span className="text-2xl mb-1">
              {isWon ? '🎉' : isLost ? '😔' : '📭'}
            </span>
            <p className="text-xs">Arrastra deals aquí</p>
          </div>
        )}
      </div>

      {/* Add button at bottom */}
      {onAddDeal && !isWon && !isLost && (
        <div className="px-2 pb-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full text-xs text-muted-foreground hover:text-foreground border border-dashed border-border/60 hover:border-primary/30"
            onClick={onAddDeal}
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Añadir deal
          </Button>
        </div>
      )}
    </div>
  );
}
