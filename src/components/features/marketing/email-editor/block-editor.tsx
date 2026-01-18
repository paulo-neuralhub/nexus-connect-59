import { X } from 'lucide-react';
import type { EmailBlock } from '@/types/marketing';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EMAIL_BLOCKS } from '@/lib/constants/marketing';
import { Button } from '@/components/ui/button';

interface Props {
  block: EmailBlock;
  onUpdate: (updates: Partial<EmailBlock>) => void;
  onClose: () => void;
}

export function BlockEditor({ block, onUpdate, onClose }: Props) {
  const blockConfig = EMAIL_BLOCKS[block.type as keyof typeof EMAIL_BLOCKS];
  
  const updateContent = (key: string, value: unknown) => {
    onUpdate({
      content: { ...block.content, [key]: value }
    });
  };
  
  const updateStyles = (key: string, value: string) => {
    onUpdate({
      styles: { ...block.styles, [key]: value }
    });
  };
  
  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-medium text-foreground">{blockConfig?.label || 'Bloque'}</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
      
      {/* Campos específicos según tipo */}
      <div className="space-y-4">
        {block.type === 'text' && (
          <div className="space-y-2">
            <Label>Contenido</Label>
            <Textarea
              value={block.content.html as string}
              onChange={(e) => updateContent('html', e.target.value)}
              className="min-h-32"
              placeholder="Escribe tu texto..."
            />
          </div>
        )}
        
        {block.type === 'button' && (
          <>
            <div className="space-y-2">
              <Label>Texto del botón</Label>
              <Input
                value={block.content.text as string}
                onChange={(e) => updateContent('text', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>URL de destino</Label>
              <Input
                value={block.content.link as string}
                onChange={(e) => updateContent('link', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-2">
                <Label>Color fondo</Label>
                <input
                  type="color"
                  value={block.content.backgroundColor as string}
                  onChange={(e) => updateContent('backgroundColor', e.target.value)}
                  className="w-full h-10 rounded cursor-pointer border border-border"
                />
              </div>
              <div className="space-y-2">
                <Label>Color texto</Label>
                <input
                  type="color"
                  value={block.content.textColor as string}
                  onChange={(e) => updateContent('textColor', e.target.value)}
                  className="w-full h-10 rounded cursor-pointer border border-border"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select 
                value={block.content.alignment as string} 
                onValueChange={(v) => updateContent('alignment', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {block.type === 'image' && (
          <>
            <div className="space-y-2">
              <Label>URL de la imagen</Label>
              <Input
                value={block.content.src as string}
                onChange={(e) => updateContent('src', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Texto alternativo</Label>
              <Input
                value={block.content.alt as string}
                onChange={(e) => updateContent('alt', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Link al hacer clic</Label>
              <Input
                value={block.content.link as string}
                onChange={(e) => updateContent('link', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select 
                value={block.content.alignment as string} 
                onValueChange={(v) => updateContent('alignment', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {block.type === 'header' && (
          <>
            <div className="space-y-2">
              <Label>URL del logo</Label>
              <Input
                value={block.content.logoUrl as string}
                onChange={(e) => updateContent('logoUrl', e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-2">
              <Label>Título</Label>
              <Input
                value={block.content.title as string}
                onChange={(e) => updateContent('title', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Alineación</Label>
              <Select 
                value={block.content.alignment as string} 
                onValueChange={(v) => updateContent('alignment', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="left">Izquierda</SelectItem>
                  <SelectItem value="center">Centro</SelectItem>
                  <SelectItem value="right">Derecha</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {block.type === 'spacer' && (
          <div className="space-y-2">
            <Label>Altura: {String(block.content.height)}px</Label>
            <input
              type="range"
              min="10"
              max="100"
              value={block.content.height as number}
              onChange={(e) => updateContent('height', parseInt(e.target.value))}
              className="w-full"
            />
          </div>
        )}
        
        {block.type === 'divider' && (
          <>
            <div className="space-y-2">
              <Label>Estilo</Label>
              <Select 
                value={block.content.style as string} 
                onValueChange={(v) => updateContent('style', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solid">Sólido</SelectItem>
                  <SelectItem value="dashed">Guiones</SelectItem>
                  <SelectItem value="dotted">Puntos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <input
                type="color"
                value={block.content.color as string}
                onChange={(e) => updateContent('color', e.target.value)}
                className="w-full h-10 rounded cursor-pointer border border-border"
              />
            </div>
          </>
        )}
        
        {block.type === 'footer' && (
          <>
            <div className="space-y-2">
              <Label>Nombre empresa</Label>
              <Input
                value={block.content.companyName as string}
                onChange={(e) => updateContent('companyName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Dirección</Label>
              <Input
                value={block.content.address as string}
                onChange={(e) => updateContent('address', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Texto de baja</Label>
              <Textarea
                value={block.content.unsubscribeText as string}
                onChange={(e) => updateContent('unsubscribeText', e.target.value)}
              />
            </div>
          </>
        )}
        
        {block.type === 'html' && (
          <div className="space-y-2">
            <Label>Código HTML</Label>
            <Textarea
              value={block.content.code as string}
              onChange={(e) => updateContent('code', e.target.value)}
              className="font-mono text-sm min-h-40"
              placeholder="<div>Tu código HTML</div>"
            />
          </div>
        )}
        
        {/* Estilos comunes */}
        <div className="pt-4 border-t border-border">
          <h4 className="text-sm font-medium mb-3">Estilos</h4>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label>Fondo</Label>
              <input
                type="color"
                value={block.styles?.backgroundColor || '#FFFFFF'}
                onChange={(e) => updateStyles('backgroundColor', e.target.value)}
                className="w-full h-10 rounded cursor-pointer border border-border"
              />
            </div>
            <div className="space-y-2">
              <Label>Padding</Label>
              <Select 
                value={block.styles?.padding || '16px'} 
                onValueChange={(v) => updateStyles('padding', v)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="8px">Pequeño</SelectItem>
                  <SelectItem value="16px">Normal</SelectItem>
                  <SelectItem value="24px">Grande</SelectItem>
                  <SelectItem value="32px">Extra grande</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
