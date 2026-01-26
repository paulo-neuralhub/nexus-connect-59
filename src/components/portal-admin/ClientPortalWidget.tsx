/**
 * Client Portal Widget - Widget para ficha de cliente
 */

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Globe, UserPlus, Settings, FileText, 
  Clock, Shield, ExternalLink
} from 'lucide-react';
import { InvitePortalUserDialog } from './InvitePortalUserDialog';
import { ShareDocumentDialog } from './ShareDocumentDialog';

interface ClientPortalWidgetProps {
  clientId: string;
  organizationId: string;
}

interface PortalUser {
  id: string;
  email: string;
  name: string | null;
  status: string;
  last_login: string | null;
}

interface SharedDocument {
  id: string;
  content_id: string;
  shared_at: string;
  document?: {
    name: string;
  } | null;
}

const STATUS_CONFIG = {
  active: { label: 'Activo', color: 'bg-green-500' },
  pending: { label: 'Pendiente', color: 'bg-yellow-500' },
  suspended: { label: 'Suspendido', color: 'bg-red-500' },
};

export function ClientPortalWidget({ clientId, organizationId }: ClientPortalWidgetProps) {
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);

  // Fetch portal data for this client
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['client-portal-widget', clientId],
    queryFn: async () => {
      // Get portal - use any to avoid type issues
      const { data: portal } = await (supabase as any)
        .from('client_portals')
        .select('id, portal_slug, is_active')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!portal) return { hasPortal: false, portal: null, users: [], sharedDocs: [] };

      // Get users
      const { data: users } = await supabase
        .from('portal_users')
        .select('id, email, name, status, last_login')
        .eq('portal_id', portal.id);

      // Get shared documents count
      const { data: sharedDocs } = await supabase
        .from('portal_shared_content')
        .select(`
          id,
          content_id,
          shared_at,
          document:matter_documents(name)
        `)
        .eq('portal_id', portal.id)
        .eq('content_type', 'document')
        .eq('is_active', true)
        .limit(5);

      return {
        hasPortal: true,
        portal,
        users: (users as unknown as PortalUser[]) || [],
        sharedDocs: (sharedDocs as unknown as SharedDocument[]) || [],
      };
    },
    enabled: !!clientId && !!organizationId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-32" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-20" />
        </CardContent>
      </Card>
    );
  }

  // No portal yet
  if (!data?.hasPortal) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portal de Cliente
            </CardTitle>
            <CardDescription>
              Este cliente no tiene acceso al portal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setInviteDialogOpen(true)} className="w-full">
              <UserPlus className="h-4 w-4 mr-2" />
              Invitar al portal
            </Button>
          </CardContent>
        </Card>

        <InvitePortalUserDialog
          open={inviteDialogOpen}
          onOpenChange={setInviteDialogOpen}
          preselectedClientId={clientId}
          onSuccess={() => refetch()}
        />
      </>
    );
  }

  const { portal, users, sharedDocs } = data;
  const activeUsers = users.filter(u => u.status === 'active');

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portal de Cliente
            </CardTitle>
            <Badge variant={portal?.is_active ? 'default' : 'secondary'}>
              {portal?.is_active ? 'Activo' : 'Inactivo'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Users */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Usuarios ({users.length})
            </h4>
            {users.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin usuarios registrados</p>
            ) : (
              <div className="space-y-2">
                {users.slice(0, 3).map((user) => (
                  <div key={user.id} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span 
                        className={`w-2 h-2 rounded-full ${
                          STATUS_CONFIG[user.status as keyof typeof STATUS_CONFIG]?.color || 'bg-gray-500'
                        }`} 
                      />
                      <span className="truncate max-w-[150px]">
                        {user.name || user.email}
                      </span>
                    </div>
                    {user.last_login && (
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(user.last_login), { 
                          addSuffix: true, 
                          locale: es 
                        })}
                      </span>
                    )}
                  </div>
                ))}
                {users.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{users.length - 3} más
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Shared documents */}
          <div>
            <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Documentos compartidos ({sharedDocs.length})
            </h4>
            {sharedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin documentos compartidos</p>
            ) : (
              <div className="space-y-1">
                {sharedDocs.slice(0, 3).map((doc) => (
                  <p key={doc.id} className="text-sm truncate">
                    {(doc.document as any)?.name || 'Documento'}
                  </p>
                ))}
                {sharedDocs.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    +{sharedDocs.length - 3} más
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setInviteDialogOpen(true)}
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Invitar
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => setShareDialogOpen(true)}
            >
              <FileText className="h-4 w-4 mr-1" />
              Compartir
            </Button>
          </div>
        </CardContent>
      </Card>

      <InvitePortalUserDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        preselectedClientId={clientId}
        onSuccess={() => refetch()}
      />

      <ShareDocumentDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentIds={[]}
        preselectedClientId={clientId}
        onSuccess={() => refetch()}
      />
    </>
  );
}
