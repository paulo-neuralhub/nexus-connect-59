/**
 * UnroutedEmailsQueue - UI for manually routing unclassified emails
 * Shows emails that couldn't be automatically routed to a matter
 */

import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Mail,
  Inbox,
  Search,
  CheckCircle,
  AlertTriangle,
  Lightbulb,
  ExternalLink,
  ArrowRight,
  Loader2,
  X,
  RefreshCw,
  FileText,
  Clock,
} from 'lucide-react';

import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from 'sonner';

// ============================================================
// TYPES
// ============================================================

interface UnroutedEmail {
  id: string;
  from_address: string;
  subject: string;
  body_text: string | null;
  status: string;
  created_at: string;
  matched_matter_id: string | null;
  extracted_data: {
    routing_status?: string;
    routing_reason?: string;
    routing_confidence?: number;
    reference_detected?: string | null;
    reference_valid?: boolean | null;
  } | null;
}

interface MatterOption {
  id: string;
  reference: string;
  title: string;
  account_name: string | null;
  status: string;
}

// ============================================================
// HOOKS
// ============================================================

function useUnroutedEmails() {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['unrouted-emails', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];

      const { data, error } = await supabase
        .from('email_ingestion_queue')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .in('status', ['pending', 'manual_review'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      return (data || []) as UnroutedEmail[];
    },
    enabled: !!currentOrganization?.id,
  });
}

function useSearchMatters(search: string) {
  const { currentOrganization } = useOrganization();

  return useQuery({
    queryKey: ['search-matters-for-routing', currentOrganization?.id, search],
    queryFn: async (): Promise<MatterOption[]> => {
      if (!currentOrganization?.id || !search || search.length < 2) return [];

      // Use fromTable helper to avoid deep type instantiation
      const { data, error } = await (supabase as any)
        .from('matters')
        .select('id, reference, title, status')
        .eq('organization_id', currentOrganization.id)
        .or(`reference.ilike.%${search}%,title.ilike.%${search}%`)
        .order('updated_at', { ascending: false })
        .limit(10);

      if (error) throw error;

      return (data || []).map((m: any) => ({
        id: m.id,
        reference: m.reference,
        title: m.title,
        account_name: null, // Simplified to avoid join issues
        status: m.status,
      }));
    },
    enabled: !!currentOrganization?.id && search.length >= 2,
  });
}

function useRouteEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      emailId,
      matterId,
    }: {
      emailId: string;
      matterId: string;
    }) => {
      // Get email data first
      const { data: email, error: emailError } = await supabase
        .from('email_ingestion_queue')
        .select('*')
        .eq('id', emailId)
        .single();

      if (emailError) throw emailError;

      // Get matter data
      const { data: matter, error: matterError } = await supabase
        .from('matters')
        .select('id, organization_id')
        .eq('id', matterId)
        .single();

      if (matterError) throw matterError;

      // Create communication record
      const { error: commError } = await supabase
        .from('communications')
        .insert({
          organization_id: matter.organization_id,
          matter_id: matterId,
          channel: 'email',
          direction: 'inbound',
          subject: email.subject,
          body: email.body_text || email.body_html,
          sender_email: email.from_address,
          external_id: email.message_id,
          metadata: {
            to: email.to_addresses,
            attachments: email.attachments,
            manually_routed: true,
            original_ingestion_id: emailId,
          },
        });

      if (commError) throw commError;

      // Update ingestion queue status - use any to bypass Json type constraints
      const existingData = (email.extracted_data as Record<string, unknown>) || {};
      const newExtractedData = {
        ...existingData,
        routing_status: 'manual',
        routing_reason: 'Asignado manualmente por usuario',
      };

      const { error: updateError } = await (supabase as any)
        .from('email_ingestion_queue')
        .update({
          status: 'completed',
          matched_matter_id: matterId,
          processing_completed_at: new Date().toISOString(),
          extracted_data: newExtractedData,
        })
        .eq('id', emailId);

      if (updateError) throw updateError;

      return { emailId, matterId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unrouted-emails'] });
      toast.success('Email asignado al expediente');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

function useDismissEmail() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (emailId: string) => {
      const { error } = await supabase
        .from('email_ingestion_queue')
        .update({
          status: 'dismissed',
          processing_completed_at: new Date().toISOString(),
        })
        .eq('id', emailId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['unrouted-emails'] });
      toast.success('Email descartado');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });
}

// ============================================================
// COMPONENTS
// ============================================================

function EmailCard({
  email,
  onAssign,
  onDismiss,
}: {
  email: UnroutedEmail;
  onAssign: () => void;
  onDismiss: () => void;
}) {
  const dismissEmail = useDismissEmail();
  const routingData = email.extracted_data;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="flex items-center gap-2 mb-2">
              <Mail className="h-4 w-4 text-primary shrink-0" />
              <span className="font-medium truncate">{email.subject || '(Sin asunto)'}</span>
              <Badge variant="outline" className="shrink-0">
                {formatDistanceToNow(new Date(email.created_at), { 
                  addSuffix: true, 
                  locale: es 
                })}
              </Badge>
            </div>

            {/* Sender */}
            <p className="text-sm text-muted-foreground mb-2">
              De: {email.from_address}
            </p>

            {/* Body preview */}
            {email.body_text && (
              <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                {email.body_text}
              </p>
            )}

            {/* Routing info */}
            <div className="flex flex-wrap items-center gap-2">
              {routingData?.reference_detected && (
                <Badge 
                  variant={routingData.reference_valid ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {routingData.reference_valid ? '✓' : '✗'} Ref: {routingData.reference_detected}
                </Badge>
              )}

              {routingData?.routing_reason && (
                <div className="flex items-center gap-1.5 text-xs text-warning">
                  <AlertTriangle className="h-3.5 w-3.5" />
                  <span>{routingData.routing_reason}</span>
                </div>
              )}
            </div>

            {/* Suggested matter */}
            {email.matched_matter_id && email.status === 'pending' && (
              <div className="flex items-center gap-2 mt-3 p-2 bg-accent rounded-md">
                <Lightbulb className="h-4 w-4 text-primary" />
                <span className="text-sm text-foreground">
                  Expediente sugerido disponible
                </span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 shrink-0">
            <Button size="sm" onClick={onAssign}>
              <FileText className="h-4 w-4 mr-1" />
              Asignar
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (confirm('¿Descartar este email?')) {
                  dismissEmail.mutate(email.id);
                }
              }}
              disabled={dismissEmail.isPending}
            >
              <X className="h-4 w-4 mr-1" />
              Descartar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AssignMatterDialog({
  email,
  open,
  onOpenChange,
}: {
  email: UnroutedEmail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [search, setSearch] = useState('');
  const { data: matters, isLoading } = useSearchMatters(search);
  const routeEmail = useRouteEmail();

  const handleAssign = (matterId: string) => {
    if (!email) return;
    routeEmail.mutate(
      { emailId: email.id, matterId },
      { onSuccess: () => onOpenChange(false) }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5" />
            Asignar email a expediente
          </DialogTitle>
        </DialogHeader>

        {email && (
          <div className="space-y-4">
            {/* Email summary */}
            <Card className="bg-muted/50">
              <CardContent className="p-3">
                <p className="font-medium text-sm truncate">{email.subject}</p>
                <p className="text-xs text-muted-foreground">De: {email.from_address}</p>
              </CardContent>
            </Card>

            {/* Search */}
            <div>
              <Label htmlFor="search-matter">Buscar expediente</Label>
              <div className="relative mt-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search-matter"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Referencia, título o cliente..."
                  className="pl-10"
                />
              </div>
            </div>

            {/* Results */}
            <ScrollArea className="h-60">
              {isLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-16" />
                  <Skeleton className="h-16" />
                </div>
              ) : search.length < 2 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Escribe al menos 2 caracteres para buscar
                </p>
              ) : !matters?.length ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No se encontraron expedientes
                </p>
              ) : (
                <div className="space-y-2">
                  {matters.map((matter) => (
                    <Card
                      key={matter.id}
                      className="cursor-pointer hover:bg-accent transition-colors"
                      onClick={() => handleAssign(matter.id)}
                    >
                      <CardContent className="p-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-mono text-sm font-medium">
                              {matter.reference}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {matter.title}
                            </p>
                            {matter.account_name && (
                              <p className="text-xs text-muted-foreground">
                                {matter.account_name}
                              </p>
                            )}
                          </div>
                          <Badge variant="outline" className="shrink-0">
                            {matter.status}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// MAIN COMPONENT
// ============================================================

export function UnroutedEmailsQueue() {
  const { data: emails, isLoading, refetch, isRefetching } = useUnroutedEmails();
  const [selectedEmail, setSelectedEmail] = useState<UnroutedEmail | null>(null);

  const pendingCount = useMemo(() => emails?.length || 0, [emails]);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Inbox className="h-5 w-5" />
          Emails pendientes de clasificar
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount}</Badge>
          )}
        </h2>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isRefetching}
        >
          {isRefetching ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="space-y-3">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
      ) : !emails?.length ? (
        <Card className="p-8 text-center">
          <CheckCircle className="h-10 w-10 mx-auto mb-3 text-success" />
          <p className="font-medium">Todos los emails están clasificados</p>
          <p className="text-sm text-muted-foreground mt-1">
            No hay emails pendientes de asignar a expedientes
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {emails.map((email) => (
            <EmailCard
              key={email.id}
              email={email}
              onAssign={() => setSelectedEmail(email)}
              onDismiss={() => {}}
            />
          ))}
        </div>
      )}

      {/* Assign Dialog */}
      <AssignMatterDialog
        email={selectedEmail}
        open={!!selectedEmail}
        onOpenChange={(open) => !open && setSelectedEmail(null)}
      />
    </div>
  );
}

export default UnroutedEmailsQueue;
