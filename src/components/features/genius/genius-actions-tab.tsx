/**
 * Genius Actions Tab — Lists action proposals from genius_messages
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useOrganization } from '@/contexts/organization-context';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, XCircle, Zap, Clock, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pendiente', color: 'bg-amber-100 text-amber-700', icon: Clock },
  approved: { label: 'Ejecutado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-700', icon: XCircle },
  executed: { label: 'Ejecutado', color: 'bg-green-100 text-green-700', icon: CheckCircle },
};

export function GeniusActionsTab() {
  const { currentOrganization } = useOrganization();
  const queryClient = useQueryClient();

  const { data: actions = [], isLoading } = useQuery({
    queryKey: ['genius-actions', currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization?.id) return [];
      const { data, error } = await supabase
        .from('genius_messages')
        .select('*')
        .eq('organization_id', currentOrganization.id)
        .eq('content_type', 'action_proposal')
        .order('created_at', { ascending: false })
        .limit(50);
      if (error) throw error;
      return data || [];
    },
    enabled: !!currentOrganization?.id,
  });

  const executeMutation = useMutation({
    mutationFn: async ({ messageId, confirmed }: { messageId: string; confirmed: boolean }) => {
      if (confirmed) {
        const { error } = await supabase.functions.invoke('genius-execute-action', {
          body: { message_id: messageId, confirmed: true },
        });
        if (error) throw error;
      } else {
        // Reject
        const { error } = await supabase
          .from('genius_messages')
          .update({ action_status: 'rejected' })
          .eq('id', messageId);
        if (error) throw error;
      }
    },
    onSuccess: (_, { confirmed }) => {
      queryClient.invalidateQueries({ queryKey: ['genius-actions'] });
      toast.success(confirmed ? 'Acción ejecutada' : 'Acción rechazada');
    },
    onError: () => {
      toast.error('Error al procesar la acción');
    },
  });

  const pendingActions = actions.filter((a: any) => a.action_status === 'pending');
  const completedActions = actions.filter((a: any) => a.action_status !== 'pending');

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Cargando acciones...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Pending */}
      <div>
        <h3 className="font-medium text-foreground mb-3">
          Pendientes ({pendingActions.length})
        </h3>
        {pendingActions.length === 0 ? (
          <Card className="p-6 text-center">
            <Zap className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
            <p className="text-sm text-muted-foreground">No hay acciones pendientes</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pendingActions.map((action: any) => (
              <Card key={action.id} className="p-4 border-amber-200 bg-amber-50/30 dark:bg-amber-950/10">
                <div className="flex items-start gap-3">
                  <Zap className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{action.proposed_action}</p>
                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                      {action.content}
                    </p>
                    {action.action_data && (
                      <pre className="text-xs bg-muted p-2 rounded mt-2 overflow-x-auto">
                        {JSON.stringify(action.action_data, null, 2)}
                      </pre>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      {new Date(action.created_at).toLocaleString('es-ES')}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => executeMutation.mutate({ messageId: action.id, confirmed: true })}
                      disabled={executeMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      {executeMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>✓ Ejecutar</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => executeMutation.mutate({ messageId: action.id, confirmed: false })}
                      disabled={executeMutation.isPending}
                    >
                      ✕ Rechazar
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedActions.length > 0 && (
        <div>
          <h3 className="font-medium text-foreground mb-3">
            Historial ({completedActions.length})
          </h3>
          <div className="space-y-2">
            {completedActions.map((action: any) => {
              const status = STATUS_CONFIG[action.action_status] || STATUS_CONFIG.pending;
              const Icon = status.icon;
              return (
                <Card key={action.id} className="p-3">
                  <div className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm truncate">{action.proposed_action}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(action.created_at).toLocaleDateString('es-ES')}
                      </p>
                    </div>
                    <Badge className={cn('text-xs', status.color)}>
                      {status.label}
                    </Badge>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
