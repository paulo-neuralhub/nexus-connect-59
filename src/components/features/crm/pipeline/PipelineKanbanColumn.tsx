/**
 * PipelineKanbanColumn - Columna del pipeline con header mejorado
 */

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PipelineKanbanColumnProps {
  id: string;
  title: string;
  color: string;
  count: number;
  totalValue?: number;
  children: React.ReactNode;
  isWon?: boolean;
  isLost?: boolean;
  onAddItem?: () => void;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

export function PipelineKanbanColumn({
  id,
  title,
  color,
  count,
  totalValue = 0,
  children,
  isWon,
  isLost,
  onAddItem,
}: PipelineKanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id });

  // Calculate bar width based on value (max 100% for visualization)
  const barWidth = totalValue > 0 ? Math.min(100, (totalValue / 100000) * 100) : 0;

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'flex flex-col h-full rounded-xl border transition-all w-[280px] flex-shrink-0',
        isOver && 'ring-2 ring-primary shadow-lg',
        isWon && 'bg-green-50/50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
        isLost && 'bg-red-50/50 dark:bg-red-950/20 border-red-200 dark:border-red-900',
        !isWon && !isLost && 'bg-muted/30'
      )}
    >
      {/* Header */}
      <div className={cn(
        'p-3 border-b rounded-t-xl',
        isWon && 'bg-green-100/50 dark:bg-green-950/40',
        isLost && 'bg-red-100/50 dark:bg-red-950/40',
        !isWon && !isLost && 'bg-background'
      )}>
        {/* Title row */}
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="font-medium text-sm">{title}</span>
            <span 
              className="text-xs font-bold px-2 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {count}
            </span>
          </div>
          <span className="text-sm font-semibold text-muted-foreground">
            {formatCurrency(totalValue)}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full rounded-full transition-all duration-300"
            style={{ 
              width: `${barWidth}%`,
              backgroundColor: color 
            }}
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1 p-2">
        <SortableContext items={[]} strategy={verticalListSortingStrategy}>
          <div className="space-y-3 min-h-[120px]">
            {children}
          </div>
        </SortableContext>

        {count === 0 && (
          <div className="flex flex-col items-center justify-center text-muted-foreground text-sm py-12">
            <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
              <span className="text-xl">
                {isWon ? '🎉' : isLost ? '😔' : '📭'}
              </span>
            </div>
            <p>Sin elementos</p>
          </div>
        )}
      </ScrollArea>

      {/* Add button */}
      {onAddItem && !isWon && !isLost && (
        <div className="p-2 border-t">
          <Button 
            variant="ghost" 
            size="sm" 
            className="w-full text-muted-foreground hover:text-foreground"
            onClick={onAddItem}
          >
            <Plus className="w-4 h-4 mr-2" />
            Añadir
          </Button>
        </div>
      )}
    </div>
  );
}
