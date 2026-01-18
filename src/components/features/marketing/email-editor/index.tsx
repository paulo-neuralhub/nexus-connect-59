import { useState, useCallback } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  UniqueIdentifier,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import type { EmailEditorContent, EmailBlock, EmailSettings } from '@/types/marketing';
import { BlockPalette } from './block-palette';
import { EditorCanvas } from './editor-canvas';
import { BlockEditor } from './block-editor';
import { SettingsPanel } from './settings-panel';
import { EmailPreview } from './email-preview';
import { generateUniqueId } from '@/lib/utils';
import { Button } from '@/components/ui/button';

interface Props {
  initialContent?: EmailEditorContent;
  onChange: (content: EmailEditorContent) => void;
  onSave?: () => void;
}

const defaultSettings: EmailSettings = {
  backgroundColor: '#f4f4f4',
  contentWidth: 600,
  fontFamily: 'Arial, sans-serif',
  linkColor: '#3B82F6',
};

export function EmailEditor({ initialContent, onChange, onSave }: Props) {
  const [blocks, setBlocks] = useState<EmailBlock[]>(initialContent?.blocks || []);
  const [settings, setSettings] = useState<EmailSettings>(initialContent?.settings || defaultSettings);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  const [activeId, setActiveId] = useState<UniqueIdentifier | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  
  const selectedBlock = blocks.find(b => b.id === selectedBlockId);
  
  // Notificar cambios
  const notifyChange = useCallback((newBlocks: EmailBlock[], newSettings?: EmailSettings) => {
    onChange({
      blocks: newBlocks,
      settings: newSettings || settings,
    });
  }, [onChange, settings]);
  
  // Añadir bloque
  const addBlock = (type: EmailBlock['type']) => {
    const newBlock: EmailBlock = {
      id: generateUniqueId(),
      type,
      content: getDefaultContent(type),
      styles: getDefaultStyles(type),
    };
    const newBlocks = [...blocks, newBlock];
    setBlocks(newBlocks);
    setSelectedBlockId(newBlock.id);
    notifyChange(newBlocks);
  };
  
  // Actualizar bloque
  const updateBlock = (id: string, updates: Partial<EmailBlock>) => {
    const newBlocks = blocks.map(b => 
      b.id === id ? { ...b, ...updates } : b
    );
    setBlocks(newBlocks);
    notifyChange(newBlocks);
  };
  
  // Eliminar bloque
  const deleteBlock = (id: string) => {
    const newBlocks = blocks.filter(b => b.id !== id);
    setBlocks(newBlocks);
    if (selectedBlockId === id) setSelectedBlockId(null);
    notifyChange(newBlocks);
  };
  
  // Duplicar bloque
  const duplicateBlock = (id: string) => {
    const index = blocks.findIndex(b => b.id === id);
    if (index === -1) return;
    const original = blocks[index];
    const duplicate: EmailBlock = {
      ...original,
      id: generateUniqueId(),
    };
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicate);
    setBlocks(newBlocks);
    notifyChange(newBlocks);
  };
  
  // Drag & drop
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (over && active.id !== over.id) {
      const oldIndex = blocks.findIndex(b => b.id === String(active.id));
      const newIndex = blocks.findIndex(b => b.id === String(over.id));
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newBlocks = arrayMove(blocks, oldIndex, newIndex);
        setBlocks(newBlocks);
        notifyChange(newBlocks);
      }
    }
  };
  
  // Actualizar settings
  const updateSettings = (updates: Partial<EmailSettings>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    notifyChange(blocks, newSettings);
  };
  
  return (
    <div className="h-full flex flex-col">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex gap-2">
          <Button
            variant={activeTab === 'edit' ? 'default' : 'outline'}
            onClick={() => setActiveTab('edit')}
          >
            Editar
          </Button>
          <Button
            variant={activeTab === 'preview' ? 'default' : 'outline'}
            onClick={() => setActiveTab('preview')}
          >
            Vista previa
          </Button>
        </div>
        
        {onSave && (
          <Button onClick={onSave}>
            Guardar
          </Button>
        )}
      </div>
      
      {/* Content */}
      {activeTab === 'edit' ? (
        <div className="flex-1 flex overflow-hidden">
          {/* Paleta de bloques */}
          <BlockPalette onAddBlock={addBlock} />
          
          {/* Canvas central */}
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div 
              className="flex-1 overflow-auto p-6" 
              style={{ backgroundColor: settings.backgroundColor }}
            >
              <EditorCanvas
                blocks={blocks}
                settings={settings}
                selectedBlockId={selectedBlockId}
                onSelectBlock={setSelectedBlockId}
                onDeleteBlock={deleteBlock}
                onDuplicateBlock={duplicateBlock}
              />
            </div>
            
            <DragOverlay>
              {activeId && (
                <div className="bg-background shadow-lg rounded p-2 opacity-80">
                  Moviendo bloque...
                </div>
              )}
            </DragOverlay>
          </DndContext>
          
          {/* Panel derecho */}
          <div className="w-80 border-l bg-background overflow-auto">
            {selectedBlock ? (
              <BlockEditor
                block={selectedBlock}
                onUpdate={(updates) => updateBlock(selectedBlock.id, updates)}
                onClose={() => setSelectedBlockId(null)}
              />
            ) : (
              <SettingsPanel
                settings={settings}
                onUpdate={updateSettings}
              />
            )}
          </div>
        </div>
      ) : (
        <EmailPreview content={{ blocks, settings }} />
      )}
    </div>
  );
}

// Contenido por defecto según tipo de bloque
function getDefaultContent(type: EmailBlock['type']): Record<string, unknown> {
  const defaults: Record<string, Record<string, unknown>> = {
    header: { 
      logoUrl: '', 
      title: 'Tu título aquí',
      alignment: 'center' 
    },
    text: { 
      html: '<p>Escribe tu contenido aquí...</p>' 
    },
    image: { 
      src: '', 
      alt: '', 
      link: '', 
      alignment: 'center',
      width: '100%' 
    },
    button: { 
      text: 'Click aquí', 
      link: '', 
      alignment: 'center',
      backgroundColor: '#3B82F6',
      textColor: '#FFFFFF',
      borderRadius: 4 
    },
    divider: { 
      style: 'solid', 
      color: '#E5E7EB', 
      width: 1 
    },
    spacer: { 
      height: 20 
    },
    columns: { 
      columns: 2, 
      content: [[], []] 
    },
    social: { 
      networks: ['facebook', 'twitter', 'linkedin', 'instagram'],
      alignment: 'center',
      iconStyle: 'color' 
    },
    footer: { 
      companyName: '{{organization.name}}',
      address: 'Tu dirección',
      unsubscribeText: '¿No quieres recibir más emails? {{unsubscribe_link}}' 
    },
    html: { 
      code: '<!-- Tu código HTML -->' 
    },
  };
  return defaults[type] || {};
}

// Estilos por defecto
function getDefaultStyles(_type: EmailBlock['type']): Record<string, string> {
  return {
    padding: '16px',
    backgroundColor: '#FFFFFF',
  };
}
