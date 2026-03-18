/**
 * Share Document Dialog - Compartir documento con cliente
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
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Share2, FileText, Building2, Check } from 'lucide-react';

interface ShareDocumentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  documentIds: string[];
  preselectedClientId?: string;
  onSuccess?: () => void;
}

interface ClientPortal {
  id: string;
  client_id: string;
  client: {
    full_name: string | null;
    company_name: string | null;
  } | null;
}

export function ShareDocumentDialog({
  open,
  onOpenChange,
  documentIds,
  preselectedClientId,
  onSuccess,
}: ShareDocumentDialogProps) {
  const { currentOrganization } = useOrganization();
  const [selectedPortalId, setSelectedPortalId] = useState<string | null>(null);
  const [canDownload, setCanDownload] = useState(true);
  const [hasExpiry, setHasExpiry] = useState(false);
  const [expiryDate, setExpiryDate] = useState<Date | undefined>(undefined);
  const [isSharing, setIsSharing] = useState(false);

  // Fetch client portals
  const { data: portals, isLoading } = useQuery({
    queryKey: ['client-portals-for-share', currentOrganization?.id],
    queryFn: async (): Promise<ClientPortal[]> => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('client_portals')
        .select(`
          id,
          client_id,
          client:contacts(full_name, company_name)
        `)
        .eq('organization_id', currentOrganization.id)
        .eq('is_active', true);

      if (error) throw error;

      // If preselected, set it
      if (preselectedClientId && data) {
        const matching = data.find((p: any) => p.client_id === preselectedClientId);
        if (matching) setSelectedPortalId(matching.id);
      }

      return (data as unknown as ClientPortal[]) || [];
    },
    enabled: !!currentOrganization?.id && open,
  });

  const handleShare = async () => {
    if (!selectedPortalId || !documentIds.length) return;

    setIsSharing(true);
    try {
      // Create shared content entries
      const entries = documentIds.map(docId => ({
        portal_id: selectedPortalId,
        content_type: 'document',
        content_id: docId,
        permissions: { can_download: canDownload },
        expires_at: hasExpiry && expiryDate ? expiryDate.toISOString() : null,
        is_active: true,
      }));

      const { error } = await supabase
        .from('portal_shared_content')
        .upsert(entries, {
          onConflict: 'portal_id,content_type,content_id',
        });

      if (error) throw error;

      toast.success(
        documentIds.length === 1 
          ? 'Documento compartido' 
          : `${documentIds.length} documentos compartidos`
      );
      
      onSuccess?.();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sharing documents:', error);
      toast.error('Error al compartir documentos');
    } finally {
      setIsSharing(false);
    }
  };

  const getClientName = (portal: ClientPortal) => {
    return portal.client?.company_name || portal.client?.full_name || 'Sin nombre';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Compartir con cliente
          </DialogTitle>
          <DialogDescription>
            {documentIds.length === 1 
              ? 'Comparte este documento con un cliente del portal' 
              : `Comparte ${documentIds.length} documentos con un cliente del portal`
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Document count */}
          <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
            <FileText className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm">
              {documentIds.length === 1 
                ? '1 documento seleccionado' 
                : `${documentIds.length} documentos seleccionados`
              }
            </span>
          </div>

          {/* Client selection */}
          <div className="space-y-2">
            <Label>Cliente *</Label>
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12" />
                <Skeleton className="h-12" />
              </div>
            ) : !portals?.length ? (
              <p className="text-sm text-muted-foreground">
                No hay clientes con portal activo
              </p>
            ) : (
              <ScrollArea className="h-[200px] border rounded-lg">
                <div className="p-2 space-y-1">
                  {portals.map((portal) => (
                    <button
                      key={portal.id}
                      onClick={() => setSelectedPortalId(portal.id)}
                      className={cn(
                        "w-full text-left p-3 rounded-lg transition-colors flex items-center gap-3",
                        selectedPortalId === portal.id 
                          ? "bg-primary/10 border border-primary" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                      <span className="flex-1">{getClientName(portal)}</span>
                      {selectedPortalId === portal.id && (
                        <Check className="h-4 w-4 text-primary" />
                      )}
                    </button>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>

          {/* Options */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Checkbox
                id="can-download"
                checked={canDownload}
                onCheckedChange={(checked) => setCanDownload(!!checked)}
              />
              <Label htmlFor="can-download" className="cursor-pointer">
                Permitir descarga
              </Label>
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                id="has-expiry"
                checked={hasExpiry}
                onCheckedChange={(checked) => setHasExpiry(!!checked)}
              />
              <Label htmlFor="has-expiry" className="cursor-pointer">
                Fecha de expiración
              </Label>
            </div>

            {hasExpiry && (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !expiryDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {expiryDate 
                      ? format(expiryDate, "PPP", { locale: es })
                      : "Selecciona una fecha"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={expiryDate}
                    onSelect={setExpiryDate}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleShare}
            disabled={!selectedPortalId || isSharing}
          >
            <Share2 className="h-4 w-4 mr-2" />
            {isSharing ? 'Compartiendo...' : 'Compartir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
