/**
 * AccountPortalTab — Portal management tab in CRM account detail
 * Shows portal status, impersonation, per-matter visibility toggles
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/hooks/useOrganization';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, Send, Shield, Globe, AlertTriangle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface AccountPortalTabProps {
  accountId: string;
  accountName: string;
}

export function AccountPortalTab({ accountId, accountName }: AccountPortalTabProps) {
  const { organizationId } = useOrganization();
  const queryClient = useQueryClient();
  const [showImpersonateModal, setShowImpersonateModal] = useState(false);
  const [impersonatePurpose, setImpersonatePurpose] = useState('configuration_review');
  const [confirmMatterId, setConfirmMatterId] = useState<string | null>(null);
  const [confirmAction, setConfirmAction] = useState<boolean>(false);

  // Portal access status
  const { data: portalAccess, isLoading: accessLoading } = useQuery({
    queryKey: ['portal-access', accountId],
    queryFn: async () => {
      const { data } = await (supabase.from('portal_access') as any)
        .select('*')
        .eq('crm_account_id', accountId)
        .eq('organization_id', organizationId)
        .maybeSingle();
      return data;
    },
    enabled: !!accountId && !!organizationId,
  });

  // CRM account portal fields
  const { data: crmAccount } = useQuery({
    queryKey: ['crm-account-portal', accountId],
    queryFn: async () => {
      const { data } = await (supabase.from('crm_accounts') as any)
        .select('portal_enabled, portal_user_id, portal_last_login, portal_login_count, portal_invited_at, portal_nps_last_score, email')
        .eq('id', accountId)
        .single();
      return data;
    },
    enabled: !!accountId,
  });

  // Matters with portal visibility
  const { data: matters = [], isLoading: mattersLoading } = useQuery({
    queryKey: ['portal-matters-visibility', accountId],
    queryFn: async () => {
      const { data } = await (supabase.from('matters') as any)
        .select('id, title, reference, type, status, portal_visible, portal_show_deadlines, portal_show_costs, portal_certificate_generated')
        .eq('client_id', accountId)
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!accountId && !!organizationId,
  });

  // Toggle matter visibility
  const toggleVisibility = useMutation({
    mutationFn: async ({ matterId, visible }: { matterId: string; visible: boolean }) => {
      const { error } = await (supabase.from('matters') as any)
        .update({ portal_visible: visible })
        .eq('id', matterId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portal-matters-visibility', accountId] });
      toast.success('Visibilidad actualizada');
      setConfirmMatterId(null);
    },
    onError: () => toast.error('Error al actualizar visibilidad'),
  });

  // Impersonation
  const impersonateMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('portal-impersonate', {
        body: { action: 'start', crm_account_id: accountId, purpose: impersonatePurpose },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: (data) => {
      setShowImpersonateModal(false);
      if (data?.portal_url) {
        window.open(data.portal_url, '_blank');
      }
      toast.success('Sesión de impersonación iniciada');
    },
    onError: () => toast.error('Error al iniciar impersonación'),
  });

  // Invite mutation
  const inviteMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('portal-invite', {
        body: { crm_account_id: accountId },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.error) throw res.error;
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['crm-account-portal', accountId] });
      toast.success('Invitación enviada');
    },
    onError: () => toast.error('Error al enviar invitación'),
  });

  if (accessLoading) {
    return <div className="space-y-4">{[1,2,3].map(i => <Skeleton key={i} className="h-20" />)}</div>;
  }

  const isActive = portalAccess?.status === 'active';
  const isInvited = !!crmAccount?.portal_invited_at;
  const hasPortal = crmAccount?.portal_enabled;

  return (
    <div className="space-y-6">
      {/* Portal Status Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Estado del Portal
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Estado del acceso</span>
            {isActive ? (
              <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1" /> Activo
              </Badge>
            ) : isInvited ? (
              <Badge className="bg-amber-100 text-amber-700 border-amber-200">Invitado — Pendiente</Badge>
            ) : (
              <Badge variant="outline">Sin acceso</Badge>
            )}
          </div>

          {hasPortal && crmAccount?.portal_last_login && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Último acceso</span>
              <span>{format(new Date(crmAccount.portal_last_login), "d MMM yyyy, HH:mm", { locale: es })}</span>
            </div>
          )}

          {hasPortal && crmAccount?.portal_login_count != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Accesos totales</span>
              <span>{crmAccount.portal_login_count}</span>
            </div>
          )}

          {crmAccount?.portal_nps_last_score != null && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Último NPS</span>
              <Badge variant={crmAccount.portal_nps_last_score >= 9 ? 'default' : 'outline'}>
                {crmAccount.portal_nps_last_score}/10
              </Badge>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {isActive && (
              <Button size="sm" variant="outline" onClick={() => setShowImpersonateModal(true)}>
                <Eye className="w-4 h-4 mr-1" /> Ver como cliente
              </Button>
            )}
            {!hasPortal && (
              <Button
                size="sm"
                onClick={() => inviteMutation.mutate()}
                disabled={inviteMutation.isPending}
              >
                <Send className="w-4 h-4 mr-1" />
                {inviteMutation.isPending ? 'Enviando...' : 'Invitar al portal'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Per-matter visibility */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Visibilidad de expedientes
          </CardTitle>
          <CardDescription>
            Controla qué expedientes puede ver el cliente en su portal
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mattersLoading ? (
            <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-12" />)}</div>
          ) : matters.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Sin expedientes asignados</p>
          ) : (
            <div className="space-y-3">
              {matters.map((matter: any) => (
                <div key={matter.id} className="flex items-center justify-between p-3 rounded-lg border">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="text-sm font-medium">{matter.title}</p>
                      <p className="text-xs text-muted-foreground">{matter.reference} • {matter.status}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {matter.portal_certificate_generated && (
                      <Badge variant="outline" className="text-emerald-600 border-emerald-200">📜 Certificado</Badge>
                    )}
                    <Switch
                      checked={matter.portal_visible || false}
                      onCheckedChange={(checked) => {
                        setConfirmMatterId(matter.id);
                        setConfirmAction(checked);
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Confirm visibility change */}
      <Dialog open={!!confirmMatterId} onOpenChange={() => setConfirmMatterId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              Confirmar cambio de visibilidad
            </DialogTitle>
            <DialogDescription>
              {confirmAction
                ? 'El cliente podrá ver este expediente en su portal.'
                : 'El cliente dejará de ver este expediente en su portal.'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmMatterId(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (confirmMatterId) {
                  toggleVisibility.mutate({ matterId: confirmMatterId, visible: confirmAction });
                }
              }}
              disabled={toggleVisibility.isPending}
            >
              Confirmar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Impersonation modal */}
      <Dialog open={showImpersonateModal} onOpenChange={setShowImpersonateModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5" />
              Ver portal como {accountName}
            </DialogTitle>
            <DialogDescription>
              Se abrirá una nueva pestaña con la vista del cliente. Tus acciones quedarán registradas.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Label>Propósito de la visita</Label>
            <Input
              value={impersonatePurpose}
              onChange={(e) => setImpersonatePurpose(e.target.value)}
              placeholder="Ej: Revisión de configuración"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowImpersonateModal(false)}>Cancelar</Button>
            <Button
              onClick={() => impersonateMutation.mutate()}
              disabled={impersonateMutation.isPending}
            >
              <ExternalLink className="w-4 h-4 mr-1" />
              {impersonateMutation.isPending ? 'Abriendo...' : 'Abrir portal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
