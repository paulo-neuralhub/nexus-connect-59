// ============================================================
// STYLE SELECTOR - Grid visual de 18 estilos
// Agrupados por pack: Classic, Modern, Executive
// ============================================================

import { cn } from '@/lib/utils';
import { useDocumentStylesByPack, useDocumentStyles } from '@/hooks/documents/useDocumentStyles';
import type { DesignTokens, StylePack } from '@/lib/document-templates/designTokens';
import { PACK_COLORS } from '@/lib/document-templates/designTokens';
import { Check, Loader2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';

interface StyleSelectorProps {
  selectedStyleId: string | null;
  onSelect: (style: DesignTokens) => void;
  className?: string;
}

export function StyleSelector({ selectedStyleId, onSelect, className }: StyleSelectorProps) {
  const { data: stylesByPack, isLoading } = useDocumentStylesByPack();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!stylesByPack) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No hay estilos disponibles
      </div>
    );
  }

  const packs: StylePack[] = ['Classic', 'Modern', 'Executive'];

  return (
    <ScrollArea className={cn('h-full', className)}>
      <div className="space-y-6 p-1">
        {packs.map((pack) => {
          const styles = stylesByPack[pack] || [];
          if (styles.length === 0) return null;

          const packColors = PACK_COLORS[pack];

          return (
            <div key={pack}>
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="secondary" className={cn(packColors.bg, packColors.text)}>
                  {pack}
                </Badge>
                <span className="text-sm text-muted-foreground">
                  {styles.length} estilos
                </span>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {styles.map((style) => (
                  <StyleCard
                    key={style.id}
                    style={style}
                    isSelected={selectedStyleId === style.id}
                    onSelect={() => onSelect(style)}
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

interface StyleCardProps {
  style: DesignTokens;
  isSelected: boolean;
  onSelect: () => void;
}

function StyleCard({ style, isSelected, onSelect }: StyleCardProps) {
  const colors = style.colors;

  return (
    <button
      onClick={onSelect}
      className={cn(
        'relative rounded-lg border-2 p-3 text-left transition-all hover:border-primary/50',
        isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'
      )}
    >
      {/* Mini preview */}
      <div
        className="aspect-[3/4] rounded overflow-hidden mb-2 relative"
        style={{ backgroundColor: colors.background }}
      >
        {/* Header */}
        <div
          className="h-6"
          style={{ backgroundColor: colors.headerBg }}
        />
        
        {/* Content lines */}
        <div className="p-2 space-y-1">
          <div 
            className="h-1.5 rounded-full w-3/4"
            style={{ backgroundColor: colors.text, opacity: 0.3 }}
          />
          <div 
            className="h-1 rounded-full w-full"
            style={{ backgroundColor: colors.text, opacity: 0.15 }}
          />
          <div 
            className="h-1 rounded-full w-2/3"
            style={{ backgroundColor: colors.text, opacity: 0.15 }}
          />
        </div>

        {/* Table preview */}
        <div className="mx-2 mt-1">
          <div 
            className="h-2 rounded-sm"
            style={{ backgroundColor: colors.tableHeadBg }}
          />
          <div className="space-y-0.5 mt-0.5">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-sm"
                style={{ backgroundColor: colors.backgroundAlt }}
              />
            ))}
          </div>
        </div>

        {/* Total bar */}
        <div
          className="h-2 mx-2 mt-2 rounded-sm"
          style={{ backgroundColor: colors.totalBg }}
        />

        {/* Dark indicator */}
        {style.isDark && (
          <div className="absolute top-1 right-1">
            <span className="text-[8px] bg-black/50 text-white px-1 rounded">
              DARK
            </span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium text-sm">{style.name}</p>
          <p className="text-xs text-muted-foreground">{style.description}</p>
        </div>
        {isSelected && (
          <Check className="h-4 w-4 text-primary shrink-0" />
        )}
      </div>
    </button>
  );
}

export default StyleSelector;
