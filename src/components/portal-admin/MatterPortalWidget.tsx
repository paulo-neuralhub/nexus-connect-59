/**
 * Matter Portal Widget - Widget para ficha de expediente
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Globe, FileText, MessageSquare, Share2, 
  Eye, Download, ExternalLink
} from 'lucide-react';
import { ShareDocumentDialog } from './ShareDocumentDialog';

interface MatterPortalWidgetProps {
  matterId: string;
  clientId: string | null;
  organizationId: string;
}

interface SharedDocument {
  id: string;
  content_id: string;
  shared_at: string;
  permissions: { can_download?: boolean; download_count?: number };
  document?: {
    id: string;
    name: string;
  } | null;
}

interface PortalMessage {
  id: string;
  subject: string | null;
  body: string;
  direction: string;
  created_at: string;
  read_at: string | null;
}

export function MatterPortalWidget({ matterId, clientId, organizationId }: MatterPortalWidgetProps) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);

  // Fetch portal data for this matter
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['matter-portal-widget', matterId, clientId],
    queryFn: async () => {
      if (!clientId) return { hasPortal: false, portal: null, sharedDocs: [], messages: [] };

      // Get client's portal
      const { data: portal } = await (supabase as any)
        .from('client_portals')
        .select('id, portal_slug, is_active')
        .eq('client_id', clientId)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (!portal) return { hasPortal: false, portal: null, sharedDocs: [], messages: [] };

      // Get matter documents shared to this portal
      const { data: sharedDocs } = await supabase
        .from('portal_shared_content')
        .select(`
          id,
          content_id,
          shared_at,
          permissions,
          document:matter_documents!inner(id, name, matter_id)
        `)
        .eq('portal_id', portal.id)
        .eq('content_type', 'document')
        .eq('is_active', true);

      // Filter to only this matter's documents
      const matterDocs = (sharedDocs || []).filter(
        (sd: any) => sd.document?.matter_id === matterId
      ) as unknown as SharedDocument[];

      // Get messages related to this matter
      const { data: messages } = await supabase
        .from('portal_messages')
        .select('id, subject, body, direction, created_at, read_at')
        .eq('portal_id', portal.id)
        .eq('matter_id', matterId)
        .order('created_at', { ascending: false })
        .limit(5);

      return {
        hasPortal: true,
        portal,
        sharedDocs: matterDocs,
        messages: (messages as PortalMessage[]) || [],
      };
    },
    enabled: !!matterId && !!clientId && !!organizationId,
  });

  const handleShareDocument = () => {
    setSelectedDocIds([]);
    setShareDialogOpen(true);
  };

  if (!clientId) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Este expediente no tiene cliente asignado
          </p>
        </CardContent>
      </Card>
    );
  }

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

  if (!data?.hasPortal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Portal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            El cliente no tiene acceso al portal
          </p>
        </CardContent>
      </Card>
    );
  }

  const { portal, sharedDocs, messages } = data;
  const unreadMessages = messages.filter(m => m.direction === 'inbound' && !m.read_at);

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Portal
            </CardTitle>
            <Badge variant="outline" className="text-xs">
              <Eye className="h-3 w-3 mr-1" />
              Visible
            </Badge>
          </div>
          <CardDescription>
            Este expediente es visible en el portal del cliente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Shared documents */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Documentos compartidos
              </h4>
              <span className="text-xs text-muted-foreground">
                {sharedDocs.length} doc{sharedDocs.length !== 1 && 's'}
              </span>
            </div>
            
            {sharedDocs.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No hay documentos compartidos de este expediente
              </p>
            ) : (
              <ScrollArea className="h-[100px]">
                <div className="space-y-2">
                  {sharedDocs.map((doc) => (
                    <div 
                      key={doc.id} 
                      className="flex items-center justify-between text-sm p-2 bg-muted rounded"
                    >
                      <span className="truncate flex-1">
                        {(doc.document as any)?.name || 'Documento'}
                      </span>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        {doc.permissions?.can_download && (
                          <Download className="h-3 w-3" />
                        )}
                        {doc.permissions?.download_count ? (
                          <span>{doc.permissions.download_count}x</span>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Messages */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Mensajes
                {unreadMessages.length > 0 && (
                  <Badge variant="destructive" className="text-xs h-5">
                    {unreadMessages.length}
                  </Badge>
                )}
              </h4>
            </div>
            
            {messages.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Sin mensajes sobre este expediente
              </p>
            ) : (
              <div className="space-y-2">
                {messages.slice(0, 2).map((msg) => (
                  <div 
                    key={msg.id}
                    className="text-sm p-2 bg-muted rounded"
                  >
                    <div className="flex items-center gap-2">
                      {msg.direction === 'inbound' && !msg.read_at && (
                        <span className="w-2 h-2 rounded-full bg-primary" />
                      )}
                      <span className="font-medium truncate">
                        {msg.subject || 'Sin asunto'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                      {msg.body.substring(0, 60)}...
                    </p>
                  </div>
                ))}
                {messages.length > 2 && (
                  <Button variant="link" size="sm" className="p-0 h-auto">
                    Ver todos ({messages.length})
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full"
            onClick={handleShareDocument}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartir documento
          </Button>
        </CardContent>
      </Card>

      <ShareDocumentDialog
        open={shareDialogOpen}
        onOpenChange={setShareDialogOpen}
        documentIds={selectedDocIds}
        preselectedClientId={clientId}
        onSuccess={() => refetch()}
      />
    </>
  );
}
