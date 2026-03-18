// ============================================================
// DOCUMENT TYPE SELECTOR - 15 tipos agrupados por categoría
// ============================================================

import { cn } from '@/lib/utils';
import { useDocumentTypesByCategory } from '@/hooks/documents/useDocumentTypes';
import type { DocumentType, DocumentCategory } from '@/lib/document-templates/designTokens';
import { CATEGORY_LABELS, CATEGORY_ICONS } from '@/lib/document-templates/designTokens';
import { Check, Loader2 } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface DocumentTypeSelectorProps {
  selectedTypeId: string | null;
  onSelect: (type: DocumentType) => void;
  className?: string;
}

export function DocumentTypeSelector({ selectedTypeId, onSelect, className }: DocumentTypeSelectorProps) {
  const { data: typesByCategory, isLoading } = useDocumentTypesByCategory();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!typesByCategory) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay tipos disponibles
      </div>
    );
  }

  const categories: DocumentCategory[] = ['financiero', 'comunicacion', 'informe', 'legal', 'ip'];

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-4 p-1">
        {categories.map((category) => {
          const types = typesByCategory[category] || [];
          if (types.length === 0) return null;

          return (
            <div key={category}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">{CATEGORY_ICONS[category]}</span>
                <span className="font-medium text-sm">{CATEGORY_LABELS[category]}</span>
              </div>
              
              <div className="grid grid-cols-1 gap-2">
                {types.map((type) => (
                  <TypeCard
                    key={type.id}
                    type={type}
                    isSelected={selectedTypeId === type.id}
                    onSelect={() => onSelect(type)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </ScrollArea>
  );
}

interface TypeCardProps {
  type: DocumentType;
  isSelected: boolean;
  onSelect: () => void;
}

function TypeCard({ type, isSelected, onSelect }: TypeCardProps) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        'flex items-center gap-3 rounded-lg border p-3 text-left transition-all hover:bg-accent/50',
        isSelected ? 'border-primary bg-primary/5' : 'border-border'
      )}
    >
      <span className="text-xl shrink-0">{type.icon}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{type.name}</p>
        <p className="text-xs text-muted-foreground truncate">{type.description}</p>
      </div>
      {isSelected && (
        <Check className="h-4 w-4 text-primary shrink-0" />
      )}
    </button>
  );
}

export default DocumentTypeSelector;
