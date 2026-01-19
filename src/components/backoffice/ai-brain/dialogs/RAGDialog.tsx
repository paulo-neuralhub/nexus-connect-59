import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { AIRAGCollection, AIRAGCollectionFormData } from '@/types/ai-brain.types';

interface RAGDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  rag: AIRAGCollection | null;
  onSave: (data: AIRAGCollectionFormData) => void;
  isSaving: boolean;
}

const embeddingModels = [
  'text-embedding-3-small',
  'text-embedding-3-large',
  'text-embedding-ada-002'
];

const collectionTypes = [
  'legal',
  'documentation',
  'knowledge_base',
  'faq',
  'custom'
];

export function RAGDialog({ 
  open, 
  onOpenChange, 
  rag, 
  onSave, 
  isSaving 
}: RAGDialogProps) {
  const [form, setForm] = useState<AIRAGCollectionFormData>({
    name: '',
    description: '',
    collection_type: 'knowledge_base',
    embedding_model: 'text-embedding-3-small',
    chunk_size: 1000,
    chunk_overlap: 200,
    auto_update_enabled: false,
    update_frequency: 'daily',
    is_active: true
  });

  useEffect(() => {
    if (rag) {
      setForm({
        name: rag.name,
        description: rag.description || '',
        collection_type: rag.collection_type,
        embedding_model: rag.embedding_model,
        chunk_size: rag.chunk_size,
        chunk_overlap: rag.chunk_overlap,
        auto_update_enabled: rag.auto_update_enabled,
        update_frequency: rag.update_frequency || 'daily',
        is_active: rag.is_active
      });
    } else {
      setForm({
        name: '',
        description: '',
        collection_type: 'knowledge_base',
        embedding_model: 'text-embedding-3-small',
        chunk_size: 1000,
        chunk_overlap: 200,
        auto_update_enabled: false,
        update_frequency: 'daily',
        is_active: true
      });
    }
  }, [rag, open]);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>{rag ? 'Editar RAG' : 'Nueva Base de Conocimiento'}</DialogTitle>
          <DialogDescription>
            Configura la base de conocimiento para RAG
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="rag-name">Nombre</Label>
            <Input
              id="rag-name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="ej: Legal España, IP Documentation..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="rag-desc">Descripción</Label>
            <Textarea
              id="rag-desc"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Describe el contenido de esta base de conocimiento..."
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Colección</Label>
              <Select 
                value={form.collection_type} 
                onValueChange={(v) => setForm({ ...form, collection_type: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {collectionTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Embedding Model</Label>
              <Select 
                value={form.embedding_model} 
                onValueChange={(v) => setForm({ ...form, embedding_model: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  {embeddingModels.map(model => (
                    <SelectItem key={model} value={model}>{model}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="chunk-size">Chunk Size</Label>
              <Input
                id="chunk-size"
                type="number"
                value={form.chunk_size}
                onChange={(e) => setForm({ ...form, chunk_size: parseInt(e.target.value) || 1000 })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="chunk-overlap">Chunk Overlap</Label>
              <Input
                id="chunk-overlap"
                type="number"
                value={form.chunk_overlap}
                onChange={(e) => setForm({ ...form, chunk_overlap: parseInt(e.target.value) || 200 })}
              />
            </div>
          </div>
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <div className="space-y-0.5">
              <Label>Auto-Update</Label>
              <p className="text-xs text-muted-foreground">
                Actualizar automáticamente la base de conocimiento
              </p>
            </div>
            <Switch
              checked={form.auto_update_enabled}
              onCheckedChange={(checked) => setForm({ ...form, auto_update_enabled: checked })}
            />
          </div>
          {form.auto_update_enabled && (
            <div className="space-y-2">
              <Label>Frecuencia de Actualización</Label>
              <Select 
                value={form.update_frequency} 
                onValueChange={(v) => setForm({ ...form, update_frequency: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background">
                  <SelectItem value="hourly">Cada hora</SelectItem>
                  <SelectItem value="daily">Diario</SelectItem>
                  <SelectItem value="weekly">Semanal</SelectItem>
                  <SelectItem value="monthly">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Activo</Label>
              <p className="text-xs text-muted-foreground">
                Las bases inactivas no se usarán en RAG
              </p>
            </div>
            <Switch
              checked={form.is_active}
              onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
