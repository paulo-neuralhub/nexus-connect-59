import * as React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, RefreshCw, Clock, CheckCircle, AlertTriangle, XCircle, ChevronRight } from "lucide-react";
import { useSyncHistory, SyncHistoryItem } from "@/hooks/useSyncHistory";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export default function SyncHistoryPage() {
  const [period, setPeriod] = React.useState('week');
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [selectedSync, setSelectedSync] = React.useState<SyncHistoryItem | null>(null);
  
  const { history, isLoading, summaryStats, runManualSync, isRunningSync, getSyncDetail } = useSyncHistory({ period });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'partial': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'running': return <Loader2 className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
      completed: 'default',
      partial: 'secondary',
      failed: 'destructive',
      running: 'outline',
    };
    return <Badge variant={variants[status] || 'outline'}>{status}</Badge>;
  };

  const handleViewDetail = async (sync: SyncHistoryItem) => {
    const detail = await getSyncDetail(sync.id);
    setSelectedSync(detail || sync);
    setDetailModalOpen(true);
  };

  // Group history by date
  const groupedHistory = React.useMemo(() => {
    const groups: Record<string, SyncHistoryItem[]> = {};
    
    history.forEach(item => {
      const date = new Date(item.created_at).toLocaleDateString('es-ES', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      if (!groups[date]) groups[date] = [];
      groups[date].push(item);
    });
    
    return groups;
  }, [history]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Historial de Sincronizaciones</h1>
          <p className="text-muted-foreground mt-1">
            Revisa las sincronizaciones con las oficinas de PI
          </p>
        </div>
        <Button onClick={() => runManualSync()} disabled={isRunningSync}>
          {isRunningSync ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Ejecutar sincronización manual
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{summaryStats.totalSyncs}</div>
            <p className="text-sm text-muted-foreground">Syncs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{summaryStats.totalMattersChecked}</div>
            <p className="text-sm text-muted-foreground">Expedientes revisados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{summaryStats.totalUpdated}</div>
            <p className="text-sm text-muted-foreground">Actualizados</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-red-600">{summaryStats.totalErrors}</div>
            <p className="text-sm text-muted-foreground">Errores</p>
          </CardContent>
        </Card>
      </div>

      {/* History List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Historial</CardTitle>
            <CardDescription>
              Sincronizaciones recientes ordenadas por fecha
            </CardDescription>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Hoy</SelectItem>
              <SelectItem value="week">Esta semana</SelectItem>
              <SelectItem value="month">Este mes</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          {Object.keys(groupedHistory).length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No hay sincronizaciones en el período seleccionado.
            </p>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedHistory).map(([date, items]) => (
                <div key={date}>
                  <h3 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                    📅 {date.toUpperCase()}
                  </h3>
                  <div className="space-y-2">
                    {items.map((sync) => (
                      <div
                        key={sync.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                        onClick={() => handleViewDetail(sync)}
                      >
                        <div className="flex items-center gap-3">
                          {getStatusIcon(sync.status)}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">
                                {new Date(sync.created_at).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <span className="text-muted-foreground">-</span>
                              <span className="text-sm">
                                Sincronización {sync.sync_type === 'manual' ? 'manual' : 'automática'}
                              </span>
                              {getStatusBadge(sync.status)}
                            </div>
                            <div className="text-sm text-muted-foreground mt-1">
                              {sync.matters_checked} expedientes revisados
                              {sync.matters_updated > 0 && `, ${sync.matters_updated} actualizados`}
                              {sync.documents_downloaded > 0 && `, ${sync.documents_downloaded} docs descargados`}
                              {sync.errors_count > 0 && (
                                <span className="text-red-600"> • {sync.errors_count} errores</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground" />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalle Sincronización</DialogTitle>
            <DialogDescription>
              {selectedSync && new Date(selectedSync.created_at).toLocaleString('es-ES')} - 
              {selectedSync?.sync_type === 'manual' ? ' Manual' : ' Automática'}
            </DialogDescription>
          </DialogHeader>
          
          {selectedSync && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="flex items-center gap-4">
                <div>Estado: {getStatusBadge(selectedSync.status)}</div>
                {selectedSync.duration_seconds && (
                  <div className="text-sm text-muted-foreground">
                    Duración: {Math.floor(selectedSync.duration_seconds / 60)}m {selectedSync.duration_seconds % 60}s
                  </div>
                )}
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{selectedSync.matters_checked}</div>
                  <div className="text-xs text-muted-foreground">Revisados</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{selectedSync.matters_updated}</div>
                  <div className="text-xs text-muted-foreground">Actualizados</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{selectedSync.documents_downloaded}</div>
                  <div className="text-xs text-muted-foreground">Documentos</div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-center">
                  <div className="text-xl font-bold">{selectedSync.deadlines_created}</div>
                  <div className="text-xs text-muted-foreground">Plazos</div>
                </div>
              </div>

              {/* Changes Table (placeholder) */}
              {selectedSync.matters_updated > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Cambios detectados</h4>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Expediente</TableHead>
                        <TableHead>Campo</TableHead>
                        <TableHead>Anterior</TableHead>
                        <TableHead>Nuevo</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="font-mono text-sm">ACME-2025-001</TableCell>
                        <TableCell>Estado</TableCell>
                        <TableCell className="text-muted-foreground">En examen</TableCell>
                        <TableCell className="text-green-600">Publicado</TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>
              )}

              {/* Errors */}
              {selectedSync.errors_count > 0 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <h4 className="font-medium text-red-800 mb-1">Errores ({selectedSync.errors_count})</h4>
                  <p className="text-sm text-red-700">
                    Algunos expedientes no pudieron sincronizarse. Revisa los logs para más detalles.
                  </p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
