/**
 * Portal Management Dashboard — /app/portal/dashboard
 * Despacho-side portal management
 */

import { useQuery } from '@tanstack/react-query';
import { fromTable } from '@/lib/supabase';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NeoBadge } from '@/components/ui/neo-badge';
import { Loader2, Eye, MessageSquare, FileText, Users, Award, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function PortalManagementDashboard() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  // Portal clients
  const { data: clients, isLoading: clientsLoading } = useQuery({
    queryKey: ['portal-clients', orgId],
    queryFn: async () => {
      const { data } = await fromTable('portal_access')
        .select('id, crm_account_id, status, last_activity_at, crm_accounts(id, name, email)')
        .eq('organization_id', orgId)
        .order('last_activity_at', { ascending: false, nullsFirst: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Waiting chats
  const { data: waitingChats } = useQuery({
    queryKey: ['portal-waiting-chats', orgId],
    queryFn: async () => {
      const { count } = await fromTable('portal_chat_sessions')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .in('mode', ['waiting_human', 'human']);
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Pending intake forms
  const { data: pendingIntake } = useQuery({
    queryKey: ['portal-pending-intake', orgId],
    queryFn: async () => {
      const { count } = await fromTable('portal_intake_forms')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'pending');
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Pending signatures
  const { data: pendingSignatures } = useQuery({
    queryKey: ['portal-pending-signatures', orgId],
    queryFn: async () => {
      const { count } = await fromTable('matter_documents')
        .select('id', { count: 'exact', head: true })
        .eq('portal_requires_signature', true)
        .eq('portal_signature_status', 'pending');
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Pending certificates
  const { data: pendingCerts } = useQuery({
    queryKey: ['portal-pending-certs', orgId],
    queryFn: async () => {
      const { count } = await fromTable('matters')
        .select('id', { count: 'exact', head: true })
        .eq('organization_id', orgId)
        .eq('status', 'registered')
        .eq('portal_visible', true)
        .eq('portal_certificate_generated', false);
      return count || 0;
    },
    enabled: !!orgId,
  });

  const handleImpersonate = async (crmAccountId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('portal-impersonate', {
        body: { action: 'start', crm_account_id: crmAccountId, purpose: 'configuration_review' },
      });
      if (error) throw error;
      if (data?.portal_url) {
        window.open(data.portal_url, '_blank');
        toast.success('Portal abierto en nueva pestaña');
      }
    } catch (err: any) {
      toast.error(err.message || 'Error al iniciar impersonación');
    }
  };

  const activeClients = clients?.filter((c: any) => c.status === 'active') || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Portal de Cliente</h1>
        <p className="text-muted-foreground">Gestiona el acceso y la experiencia de tus clientes</p>
      </div>

      {/* Stats */}
      <div className="flex gap-4 flex-wrap">
        <NeoBadge value={activeClients.length} label="Clientes" color="#1E40AF" size="lg" />
        <NeoBadge value={waitingChats || 0} label="Chats" color="#DC2626" size="lg" active={(waitingChats || 0) > 0} />
        <NeoBadge value={pendingIntake || 0} label="Intake" color="#F59E0B" size="lg" />
        <NeoBadge value={pendingSignatures || 0} label="Firmas" color="#7C3AED" size="lg" />
        <NeoBadge value={pendingCerts || 0} label="Certif." color="#059669" size="lg" />
      </div>

      {/* Requires Action */}
      {((waitingChats || 0) > 0 || (pendingIntake || 0) > 0 || (pendingCerts || 0) > 0) && (
        <Card className="border-amber-200 bg-amber-50/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-700">
              <AlertCircle className="w-5 h-5" />
              Requiere acción
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {(waitingChats || 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-red-600" />
                  <span className="text-sm font-medium">{waitingChats} chats esperando agente humano</span>
                </div>
                <Button size="sm" variant="outline" asChild>
                  <a href="/app/portal/live-chat">Ir al chat</a>
                </Button>
              </div>
            )}
            {(pendingIntake || 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-600" />
                  <span className="text-sm font-medium">{pendingIntake} formularios de intake pendientes</span>
                </div>
              </div>
            )}
            {(pendingCerts || 0) > 0 && (
              <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-green-600" />
                  <span className="text-sm font-medium">{pendingCerts} certificados pendientes de generar</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Clients List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Clientes con acceso al portal
          </CardTitle>
          <CardDescription>{activeClients.length} clientes activos</CardDescription>
        </CardHeader>
        <CardContent>
          {clientsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : activeClients.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto opacity-30 mb-2" />
              <p>No hay clientes con acceso al portal</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeClients.map((client: any) => {
                const account = client.crm_accounts;
                return (
                  <div key={client.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {account?.name?.charAt(0) || '?'}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium text-sm">{account?.name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{account?.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-700 bg-green-50">
                        Activo
                      </Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleImpersonate(client.crm_account_id)}
                        title="Ver como cliente"
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ver como cliente
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
