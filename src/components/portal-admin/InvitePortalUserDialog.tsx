/**
 * Invite Portal User Dialog - Invitar cliente al portal
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useOrganization } from '@/contexts/organization-context';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Search, User, Building2, ChevronRight, 
  ChevronLeft, Mail, Key, Check
} from 'lucide-react';

interface InvitePortalUserDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  preselectedClientId?: string;
}

interface Contact {
  id: string;
  full_name: string | null;
  email: string | null;
  company_name: string | null;
  type: string;
}

const DEFAULT_PERMISSIONS = {
  view_matters: true,
  view_documents: true,
  download_documents: true,
  view_deadlines: true,
  send_messages: true,
  view_invoices: false,
};

export function InvitePortalUserDialog({
  open,
  onOpenChange,
  onSuccess,
  preselectedClientId,
}: InvitePortalUserDialogProps) {
  const { currentOrganization } = useOrganization();
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Contact | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [permissions, setPermissions] = useState(DEFAULT_PERMISSIONS);
  const [accessMethod, setAccessMethod] = useState<'magic_link' | 'password'>('magic_link');
  const [tempPassword, setTempPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch clients
  const { data: clients, isLoading: loadingClients } = useQuery({
    queryKey: ['portal-invite-clients', currentOrganization?.id, search],
    queryFn: async (): Promise<Contact[]> => {
      if (!currentOrganization?.id) return [];

      let query = (supabase as any)
        .from('contacts')
        .select('id, name, email, company_name, type')
        .eq('organization_id', currentOrganization.id)
        .eq('type', 'company')
        .order('name');

      if (search) {
        query = query.or(`name.ilike.%${search}%,company_name.ilike.%${search}%,email.ilike.%${search}%`);
      }

      const { data, error } = await query.limit(20);
      if (error) throw error;

      return data || [];
    },
    enabled: !!currentOrganization?.id && open,
  });

  const handleSelectClient = (client: Contact) => {
    setSelectedClient(client);
    setEmail(client.email || '');
    setName(client.full_name || client.company_name || '');
    setStep(2);
  };

  const handleSubmit = async () => {
    if (!currentOrganization?.id || !selectedClient) return;

    setIsSubmitting(true);
    try {
      // First, find or create portal for this client
      let portalId: string;

      const { data: existingPortal } = await supabase
        .from('client_portals')
        .select('id')
        .eq('organization_id', currentOrganization.id)
        .eq('client_id', selectedClient.id)
        .maybeSingle();

      if (existingPortal) {
        portalId = existingPortal.id;
      } else {
        const { data: newPortal, error: portalError } = await supabase
          .from('client_portals')
          .insert({
            organization_id: currentOrganization.id,
            client_id: selectedClient.id,
            slug: `portal-${Date.now()}`,
            name: `Portal ${selectedClient.company_name || selectedClient.full_name}`,
            is_active: true,
          })
          .select()
          .single();

        if (portalError) throw portalError;
        portalId = newPortal.id;
      }

      // Call edge function to invite user
      const response = await supabase.functions.invoke('portal-auth', {
        body: {
          action: 'invite',
          portal_id: portalId,
          email,
          name,
          permissions,
          send_magic_link: accessMethod === 'magic_link',
          temp_password: accessMethod === 'password' ? tempPassword : undefined,
        },
      });

      if (response.error) throw response.error;

      toast.success(
        accessMethod === 'magic_link' 
          ? 'Invitación enviada por email' 
          : 'Usuario creado con contraseña temporal'
      );
      
      onSuccess?.();
      handleClose();

    } catch (error: any) {
      console.error('Error inviting user:', error);
      toast.error(error.message || 'Error al invitar usuario');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSearch('');
    setSelectedClient(null);
    setEmail('');
    setName('');
    setPermissions(DEFAULT_PERMISSIONS);
    setAccessMethod('magic_link');
    setTempPassword('');
    onOpenChange(false);
  };

  const togglePermission = (key: keyof typeof DEFAULT_PERMISSIONS) => {
    setPermissions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {step === 1 && 'Seleccionar cliente'}
            {step === 2 && 'Datos del usuario'}
            {step === 3 && 'Permisos'}
            {step === 4 && 'Método de acceso'}
          </DialogTitle>
          <DialogDescription>
            Paso {step} de 4
          </DialogDescription>
        </DialogHeader>

        {/* Step 1: Select client */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <ScrollArea className="h-[300px]">
              {loadingClients ? (
                <div className="space-y-2 p-2">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-16" />
                  ))}
                </div>
              ) : !clients?.length ? (
                <div className="text-center py-8 text-muted-foreground">
                  No se encontraron clientes
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {clients.map((client) => (
                    <button
                      key={client.id}
                      onClick={() => handleSelectClient(client)}
                      className="w-full text-left p-3 rounded-lg hover:bg-muted transition-colors flex items-center gap-3"
                    >
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {client.company_name || client.full_name}
                        </p>
                        <p className="text-sm text-muted-foreground truncate">
                          {client.email || 'Sin email'}
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </button>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        {/* Step 2: User data */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg flex items-center gap-3">
              <Building2 className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {selectedClient?.company_name || selectedClient?.full_name}
              </span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                placeholder="cliente@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Nombre del usuario</Label>
              <Input
                id="name"
                placeholder="Nombre completo"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 3: Permissions */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Selecciona los permisos para este usuario:
            </p>

            <div className="space-y-3">
              {[
                { key: 'view_matters' as const, label: 'Ver expedientes' },
                { key: 'view_documents' as const, label: 'Ver documentos' },
                { key: 'download_documents' as const, label: 'Descargar documentos' },
                { key: 'view_deadlines' as const, label: 'Ver plazos' },
                { key: 'send_messages' as const, label: 'Enviar mensajes' },
                { key: 'view_invoices' as const, label: 'Ver facturas' },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <Checkbox
                    id={key}
                    checked={permissions[key]}
                    onCheckedChange={() => togglePermission(key)}
                  />
                  <Label htmlFor={key} className="cursor-pointer">
                    {label}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 4: Access method */}
        {step === 4 && (
          <div className="space-y-4">
            <RadioGroup value={accessMethod} onValueChange={(v) => setAccessMethod(v as any)}>
              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem value="magic_link" id="magic_link" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="magic_link" className="cursor-pointer flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    Enviar enlace mágico
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    El usuario recibirá un enlace por email para acceder sin contraseña (recomendado)
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 border rounded-lg">
                <RadioGroupItem value="password" id="password" className="mt-1" />
                <div className="flex-1">
                  <Label htmlFor="password" className="cursor-pointer flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    Crear contraseña temporal
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    Define una contraseña que el usuario deberá cambiar al iniciar sesión
                  </p>
                </div>
              </div>
            </RadioGroup>

            {accessMethod === 'password' && (
              <div className="space-y-2">
                <Label htmlFor="temp-password">Contraseña temporal *</Label>
                <Input
                  id="temp-password"
                  type="password"
                  placeholder="Mínimo 8 caracteres"
                  value={tempPassword}
                  onChange={(e) => setTempPassword(e.target.value)}
                />
              </div>
            )}
          </div>
        )}

        <DialogFooter className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              <ChevronLeft className="h-4 w-4 mr-1" />
              Atrás
            </Button>
          )}

          {step < 4 ? (
            <Button 
              onClick={() => setStep(step + 1)}
              disabled={
                (step === 1 && !selectedClient) ||
                (step === 2 && !email)
              }
            >
              Siguiente
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit}
              disabled={
                isSubmitting || 
                (accessMethod === 'password' && tempPassword.length < 8)
              }
            >
              {isSubmitting ? 'Enviando...' : (
                <>
                  <Check className="h-4 w-4 mr-1" />
                  Enviar invitación
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
