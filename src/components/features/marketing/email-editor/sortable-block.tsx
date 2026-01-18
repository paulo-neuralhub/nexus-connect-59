import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2, Copy } from 'lucide-react';
import type { EmailBlock } from '@/types/marketing';
import { BlockRenderer } from './block-renderer';
import { cn } from '@/lib/utils';

interface Props {
  block: EmailBlock;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

export function SortableBlock({ block, isSelected, onSelect, onDelete, onDuplicate }: Props) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: block.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        "relative group",
        isDragging && "opacity-50",
        isSelected && "ring-2 ring-primary ring-inset"
      )}
      onClick={onSelect}
    >
      {/* Toolbar del bloque */}
      <div className={cn(
        "absolute -left-10 top-0 flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-10",
        isSelected && "opacity-100"
      )}>
        <button
          {...attributes}
          {...listeners}
          className="p-1 bg-muted rounded hover:bg-muted/80 cursor-grab active:cursor-grabbing"
        >
          <GripVertical className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
          className="p-1 bg-muted rounded hover:bg-muted/80"
        >
          <Copy className="w-4 h-4 text-muted-foreground" />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1 bg-destructive/10 rounded hover:bg-destructive/20"
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      </div>
      
      {/* Contenido del bloque */}
      <BlockRenderer block={block} />
    </div>
  );
}
