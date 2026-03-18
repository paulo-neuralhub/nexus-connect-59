import { useState } from 'react';
import { useDataConnectors, useDeleteConnector, useSyncConnector } from '@/hooks/use-data-hub';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Database, Cloud, Globe, CheckCircle, XCircle, 
  RefreshCw, Settings2, Trash2, AlertCircle, Plug
} from 'lucide-react';
import { ConnectorModal } from './components/connector-modal';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';

const CONNECTOR_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  euipo: Globe,
  oepm: Globe,
  wipo: Globe,
  custom_api: Cloud,
  webhook: RefreshCw,
  default: Database
};

export default function DataHubConnectors() {
  const { data: connectors = [], isLoading } = useDataConnectors();
  const deleteConnector = useDeleteConnector();
  const syncConnector = useSyncConnector();
  const [showModal, setShowModal] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = async (id: string) => {
    setSyncing(id);
    try {
      await syncConnector.mutateAsync({ connectorId: id, syncType: 'full' });
    } finally {
      setSyncing(null);
    }
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteConnector.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><AlertCircle className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex justify-between items-center">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Conectores</h1>
          <p className="text-muted-foreground">Gestiona tus conexiones con sistemas externos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Conector
        </Button>
      </div>

      {/* Connectors Grid */}
      {connectors.length === 0 ? (
        <EmptyState
          icon={<Plug className="h-8 w-8" />}
          title="Sin conectores"
          description="Aún no has configurado ningún conector. Crea uno para sincronizar datos automáticamente."
          action={
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Crear Conector
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {connectors.map((connector: any) => {
            const Icon = CONNECTOR_ICONS[connector.connector_type] || CONNECTOR_ICONS.default;
            
            return (
              <Card key={connector.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{connector.name}</CardTitle>
                        <CardDescription className="text-xs">{connector.connector_type}</CardDescription>
                      </div>
                    </div>
                    {getStatusBadge(connector.connection_status || 'pending')}
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div className="flex justify-between">
                      <span>Última sincronización:</span>
                      <span className="font-medium text-foreground">
                        {connector.last_sync_at 
                          ? format(new Date(connector.last_sync_at), 'dd MMM HH:mm', { locale: es })
                          : 'Nunca'}
                      </span>
                    </div>
                    {connector.sync_enabled && (
                      <div className="flex justify-between">
                        <span>Frecuencia:</span>
                        <span className="font-medium text-foreground">
                          {connector.sync_frequency || 'Manual'}
                        </span>
                      </div>
                    )}
                  </div>

                  {connector.last_error && (
                    <div className="p-2 bg-destructive/10 rounded-md">
                      <p className="text-xs text-destructive">{connector.last_error}</p>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1"
                      onClick={() => handleSync(connector.id)}
                      disabled={syncing === connector.id}
                    >
                      <RefreshCw className={`h-4 w-4 mr-1 ${syncing === connector.id ? 'animate-spin' : ''}`} />
                      Sincronizar
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setShowModal(true)}
                    >
                      <Settings2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => setDeleteId(connector.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Connector Modal */}
      <ConnectorModal 
        open={showModal} 
        onOpenChange={setShowModal}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conector?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todas las configuraciones de sincronización asociadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
