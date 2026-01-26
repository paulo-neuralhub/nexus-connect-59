/**
 * Edit Portal User Dialog - Editar permisos de usuario del portal
 */

import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { User, Shield, Save } from 'lucide-react';

interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  permissions: Record<string, boolean>;
}

interface EditPortalUserDialogProps {
  user: PortalUser;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const PERMISSION_LABELS: Record<string, string> = {
  view_matters: 'Ver expedientes',
  view_documents: 'Ver documentos',
  download_documents: 'Descargar documentos',
  view_deadlines: 'Ver plazos',
  send_messages: 'Enviar mensajes',
  view_invoices: 'Ver facturas',
  pay_invoices: 'Pagar facturas',
};

export function EditPortalUserDialog({
  user,
  open,
  onOpenChange,
  onSuccess,
}: EditPortalUserDialogProps) {
  const [name, setName] = useState(user.name || '');
  const [permissions, setPermissions] = useState<Record<string, boolean>>(
    user.permissions || {}
  );
  const [isSaving, setIsSaving] = useState(false);

  const togglePermission = (key: string) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('portal_users')
        .update({
          name: name || null,
          permissions,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('Usuario actualizado');
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating portal user:', error);
      toast.error('Error al actualizar usuario');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Editar permisos
          </DialogTitle>
          <DialogDescription>
            Modifica los permisos de acceso para este usuario del portal
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* User info */}
          <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="font-medium">{user.name || user.email}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              {user.status}
            </Badge>
          </div>

          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="edit-name">Nombre</Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Nombre del usuario"
            />
          </div>

          <Separator />

          {/* Permissions */}
          <div className="space-y-4">
            <Label>Permisos</Label>
            <div className="space-y-3">
              {Object.entries(PERMISSION_LABELS).map(([key, label]) => (
                <div key={key} className="flex items-center justify-between">
                  <Label htmlFor={`perm-${key}`} className="cursor-pointer">
                    {label}
                  </Label>
                  <Switch
                    id={`perm-${key}`}
                    checked={permissions[key] ?? false}
                    onCheckedChange={() => togglePermission(key)}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isSaving}>
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
