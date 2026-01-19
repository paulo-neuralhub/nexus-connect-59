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
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Key, Loader2 } from 'lucide-react';
import { AIProvider, AIProviderFormData } from '@/types/ai-brain.types';

interface ProviderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  provider: AIProvider | null;
  onSave: (data: AIProviderFormData) => void;
  isSaving: boolean;
}

export function ProviderDialog({ 
  open, 
  onOpenChange, 
  provider, 
  onSave, 
  isSaving 
}: ProviderDialogProps) {
  const [form, setForm] = useState<AIProviderFormData>({
    name: '',
    code: '',
    api_key: '',
    base_url: '',
    is_gateway: false,
    status: 'active'
  });

  useEffect(() => {
    if (provider) {
      setForm({
        name: provider.name,
        code: provider.code,
        api_key: '',
        base_url: provider.base_url || '',
        is_gateway: provider.is_gateway,
        status: provider.status
      });
    } else {
      setForm({
        name: '',
        code: '',
        api_key: '',
        base_url: '',
        is_gateway: false,
        status: 'active'
      });
    }
  }, [provider, open]);

  const handleSubmit = () => {
    onSave(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-background">
        <DialogHeader>
          <DialogTitle>{provider ? 'Editar Provider' : 'Nuevo Provider'}</DialogTitle>
          <DialogDescription>
            Configura los datos del proveedor de IA
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="provider-name">Nombre</Label>
              <Input
                id="provider-name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="ej: Anthropic, OpenAI..."
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="provider-code">Código</Label>
              <Input
                id="provider-code"
                value={form.code}
                onChange={(e) => setForm({ ...form, code: e.target.value.toLowerCase() })}
                placeholder="ej: anthropic, openai..."
                disabled={!!provider}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="api-key">API Key {provider && '(dejar vacío para mantener)'}</Label>
            <div className="relative">
              <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="api-key"
                type="password"
                value={form.api_key}
                onChange={(e) => setForm({ ...form, api_key: e.target.value })}
                placeholder="sk-..."
                className="pl-10"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="base-url">Base URL (opcional)</Label>
            <Input
              id="base-url"
              value={form.base_url}
              onChange={(e) => setForm({ ...form, base_url: e.target.value })}
              placeholder="https://api.example.com"
            />
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Es Gateway</Label>
              <p className="text-xs text-muted-foreground">
                Un gateway enruta a múltiples providers
              </p>
            </div>
            <Switch
              checked={form.is_gateway}
              onCheckedChange={(checked) => setForm({ ...form, is_gateway: checked })}
            />
          </div>
          <div className="space-y-2">
            <Label>Estado</Label>
            <Select 
              value={form.status} 
              onValueChange={(v) => setForm({ ...form, status: v as 'active' | 'inactive' | 'error' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-background">
                <SelectItem value="active">Activo</SelectItem>
                <SelectItem value="inactive">Inactivo</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={isSaving || !form.name || !form.code}>
            {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Guardar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
