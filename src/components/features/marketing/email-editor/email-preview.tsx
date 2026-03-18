import { useState } from 'react';
import type { EmailEditorContent } from '@/types/marketing';
import { Button } from '@/components/ui/button';
import { Monitor, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockRenderer } from './block-renderer';

interface Props {
  content: EmailEditorContent;
}

export function EmailPreview({ content }: Props) {
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop');
  
  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Device selector */}
      <div className="p-4 border-b bg-background flex justify-center gap-2">
        <Button
          variant={device === 'desktop' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDevice('desktop')}
        >
          <Monitor className="w-4 h-4 mr-2" />
          Escritorio
        </Button>
        <Button
          variant={device === 'mobile' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setDevice('mobile')}
        >
          <Smartphone className="w-4 h-4 mr-2" />
          Móvil
        </Button>
      </div>
      
      {/* Preview area */}
      <div 
        className="flex-1 overflow-auto p-6"
        style={{ backgroundColor: content.settings.backgroundColor }}
      >
        <div 
          className={cn(
            "mx-auto bg-background shadow-lg rounded-lg overflow-hidden transition-all",
            device === 'mobile' ? "max-w-[375px]" : ""
          )}
          style={{ 
            width: device === 'desktop' ? content.settings.contentWidth : undefined,
            fontFamily: content.settings.fontFamily,
          }}
        >
          {content.blocks.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              No hay contenido para previsualizar
            </div>
          ) : (
            content.blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
