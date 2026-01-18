import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { EmailBlock, EmailSettings } from '@/types/marketing';
import { SortableBlock } from './sortable-block';

interface Props {
  blocks: EmailBlock[];
  settings: EmailSettings;
  selectedBlockId: string | null;
  onSelectBlock: (id: string | null) => void;
  onDeleteBlock: (id: string) => void;
  onDuplicateBlock: (id: string) => void;
}

export function EditorCanvas({
  blocks,
  settings,
  selectedBlockId,
  onSelectBlock,
  onDeleteBlock,
  onDuplicateBlock,
}: Props) {
  return (
    <div 
      className="max-w-[600px] mx-auto bg-background shadow-lg rounded-lg overflow-hidden"
      style={{ width: settings.contentWidth }}
    >
      <SortableContext items={blocks.map(b => b.id)} strategy={verticalListSortingStrategy}>
        {blocks.length === 0 ? (
          <div className="p-12 text-center text-muted-foreground border-2 border-dashed border-border m-4 rounded-lg">
            <p className="mb-2">Arrastra bloques aquí</p>
            <p className="text-sm">o haz clic en un bloque de la izquierda</p>
          </div>
        ) : (
          blocks.map((block) => (
            <SortableBlock
              key={block.id}
              block={block}
              isSelected={selectedBlockId === block.id}
              onSelect={() => onSelectBlock(block.id)}
              onDelete={() => onDeleteBlock(block.id)}
              onDuplicate={() => onDuplicateBlock(block.id)}
            />
          ))
        )}
      </SortableContext>
    </div>
  );
}
