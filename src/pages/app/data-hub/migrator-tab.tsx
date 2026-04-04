import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Plus, Play, CheckCircle2, Clock, AlertTriangle, ArrowRightLeft,
  Loader2, ArrowRight, Zap, RefreshCw, Monitor, Trash2, MoreHorizontal,
  Download, Settings, TestTube2, ExternalLink
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { useMigrationProjects, useDeleteMigrationProject } from '@/hooks/use-migration';
import { 
  useMigrationConnections, 
  useTestConnection, 
  useDeleteConnection,
} from '@/hooks/use-migration-connections';
import { ConnectionWizard, ExtractionWizard } from '@/components/features/migrator';
import type { MigrationConnection } from '@/types/migration-advanced';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  draft: { label: 'Borrador', color: 'bg-slate-100 text-slate-700', icon: Clock },
  mapping: { label: 'Mapeando', color: 'bg-blue-100 text-blue-700', icon: ArrowRightLeft },
  validating: { label: 'Validando', color: 'bg-yellow-100 text-yellow-700', icon: Loader2 },
  ready: { label: 'Listo', color: 'bg-green-100 text-green-700', icon: CheckCircle2 },
  migrating: { label: 'Migrando', color: 'bg-purple-100 text-purple-700', icon: Loader2 },
  completed: { label: 'Completado', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle2 },
  failed: { label: 'Fallido', color: 'bg-red-100 text-red-700', icon: AlertTriangle },
  cancelled: { label: 'Cancelado', color: 'bg-slate-100 text-slate-500', icon: Clock },
};

const SOURCE_SYSTEMS: Record<string, { name: string; color: string }> = {
  web_portal: { name: 'Portal Web (Login)', color: 'bg-primary' },
  patsnap: { name: 'PatSnap', color: 'bg-blue-500' },
  anaqua: { name: 'Anaqua', color: 'bg-purple-500' },
  cpa_global: { name: 'CPA Global', color: 'bg-green-500' },
  dennemeyer: { name: 'Dennemeyer', color: 'bg-orange-500' },
  ipan: { name: 'IPAN', color: 'bg-red-500' },
  thomson_compumark: { name: 'Thomson CompuMark', color: 'bg-indigo-500' },
  corsearch: { name: 'Corsearch', color: 'bg-cyan-500' },
  orbit: { name: 'Questel Orbit', color: 'bg-pink-500' },
  spreadsheet: { name: 'Excel/CSV', color: 'bg-emerald-500' },
  custom: { name: 'Personalizado', color: 'bg-slate-500' },
};

const CONNECTION_STATUS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendiente', color: 'bg-slate-100 text-slate-700' },
  testing: { label: 'Probando', color: 'bg-blue-100 text-blue-700' },
  connected: { label: 'Conectado', color: 'bg-green-100 text-green-700' },
  error: { label: 'Error', color: 'bg-red-100 text-red-700' },
};

export function MigratorTab() {
  const navigate = useNavigate();
  const { data: projects, isLoading } = useMigrationProjects();
  const { connections, isLoading: loadingConnections } = useMigrationConnections();
  const deleteMutation = useDeleteMigrationProject();
  const testConnection = useTestConnection();
  const deleteConnection = useDeleteConnection();
  
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteConnectionId, setDeleteConnectionId] = useState<string | null>(null);
  const [showConnectionWizard, setShowConnectionWizard] = useState(false);
  const [extractionConnection, setExtractionConnection] = useState<MigrationConnection | null>(null);

  const handleDelete = async () => {
    if (deleteId) {
      await deleteMutation.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleDeleteConnection = async () => {
    if (deleteConnectionId) {
      await deleteConnection.mutateAsync(deleteConnectionId);
      setDeleteConnectionId(null);
    }
  };

  const activeProjects = projects?.filter(p => !['completed', 'cancelled', 'failed'].includes(p.status)) || [];

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-lg">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{connections.length}</p>
                <p className="text-sm text-muted-foreground">Conexiones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <RefreshCw className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{projects?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Migraciones</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {projects?.filter(p => p.status === 'completed').length || 0}
                </p>
                <p className="text-sm text-muted-foreground">Completadas</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Monitor className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{activeProjects.length}</p>
                <p className="text-sm text-muted-foreground">En Proceso</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => setShowConnectionWizard(true)}>
          <Zap className="h-4 w-4 mr-2" />
          Nueva Conexión
        </Button>
        <Button onClick={() => navigate('/app/migrator/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Migración
        </Button>
      </div>

      {/* Connections */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            Conexiones a Sistemas Externos
          </CardTitle>
          <CardDescription>
            Conecta con PatSnap, Anaqua, CPA Global y otros sistemas de gestión de PI
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingConnections ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : connections.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Zap className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">No hay conexiones configuradas</p>
              <p className="text-sm">Conecta con tus sistemas de PI existentes</p>
              <Button className="mt-4" onClick={() => setShowConnectionWizard(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Primera Conexión
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {connections.map((conn) => {
                const source = SOURCE_SYSTEMS[conn.system_type] || { name: conn.system_type, color: 'bg-slate-500' };
                const status = CONNECTION_STATUS[conn.status] || CONNECTION_STATUS.pending;
                const isConnected = conn.status === 'connected';
                const isTesting = testConnection.isPending && testConnection.variables === conn.id;

                return (
                  <Card key={conn.id} className="flex flex-col">
                    <CardContent className="pt-6 flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn("w-3 h-3 rounded-full", source.color)} />
                          <div>
                            <p className="font-medium">{conn.name}</p>
                            <p className="text-sm text-muted-foreground">{source.name}</p>
                          </div>
                        </div>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => testConnection.mutate(conn.id)}>
                              <TestTube2 className="h-4 w-4 mr-2" />
                              Probar Conexión
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => {
                              if (conn.system_type === 'web_portal') {
                                setExtractionConnection(conn as unknown as MigrationConnection);
                              } else {
                                navigate(`/app/migrator/new?connection=${conn.id}`);
                              }
                            }}>
                              <Download className="h-4 w-4 mr-2" />
                              {conn.system_type === 'web_portal' ? 'Extraer Datos' : 'Migrar desde aquí'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => setDeleteConnectionId(conn.id)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>

                      <div className="mt-4 flex items-center justify-between">
                        <Badge className={status.color}>
                          {isTesting ? (
                            <><Loader2 className="h-3 w-3 mr-1 animate-spin" />Probando...</>
                          ) : (
                            status.label
                          )}
                        </Badge>
                        {conn.last_successful_connection && (
                          <span className="text-xs text-muted-foreground">
                            Última: {formatDistanceToNow(new Date(conn.last_successful_connection), { addSuffix: true, locale: es })}
                          </span>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="mt-4 flex gap-2">
                        {isConnected ? (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={() => {
                              if (conn.system_type === 'web_portal') {
                                setExtractionConnection(conn as unknown as MigrationConnection);
                              } else {
                                navigate(`/app/migrator/new?connection=${conn.id}`);
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            {conn.system_type === 'web_portal' ? 'Extraer Datos' : 'Iniciar Migración'}
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            disabled={isTesting}
                            onClick={() => testConnection.mutate(conn.id)}
                          >
                            {isTesting ? (
                              <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Probando...</>
                            ) : (
                              <><TestTube2 className="h-4 w-4 mr-2" />Probar Conexión</>
                            )}
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Active Migrations */}
      {activeProjects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5 text-primary" />
              Migraciones Activas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeProjects.map((project) => {
                const StatusIcon = STATUS_CONFIG[project.status]?.icon || Clock;
                const source = SOURCE_SYSTEMS[project.source_system];
                const progress = project.total_steps > 0 
                  ? Math.round((project.current_step / project.total_steps) * 100) 
                  : 0;
                
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/migrator/${project.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-3 h-3 rounded-full", source?.color || 'bg-slate-400')} />
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {source?.name || project.source_system} • Paso {project.current_step} de {project.total_steps}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="w-32">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-primary transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground text-center mt-1">{progress}%</p>
                      </div>
                      <Badge className={STATUS_CONFIG[project.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[project.status]?.label}
                      </Badge>
                      <Button variant="ghost" size="sm">
                        Continuar <ArrowRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* History */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Migraciones</CardTitle>
          <CardDescription>Todas tus migraciones anteriores</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : projects?.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <ArrowRightLeft className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Sin migraciones</p>
              <p className="text-sm">Aún no has realizado ninguna migración de datos</p>
            </div>
          ) : (
            <div className="space-y-2">
              {projects?.filter(p => ['completed', 'cancelled', 'failed'].includes(p.status)).map((project) => {
                const StatusIcon = STATUS_CONFIG[project.status]?.icon || Clock;
                const source = SOURCE_SYSTEMS[project.source_system];
                
                return (
                  <div
                    key={project.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => navigate(`/app/migrator/${project.id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn("w-3 h-3 rounded-full", source?.color || 'bg-slate-400')} />
                      <div>
                        <h3 className="font-medium">{project.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {source?.name || project.source_system}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={STATUS_CONFIG[project.status]?.color}>
                        <StatusIcon className="h-3 w-3 mr-1" />
                        {STATUS_CONFIG[project.status]?.label}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem onClick={() => navigate(`/app/migrator/${project.id}`)}>
                            Ver Detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            className="text-destructive"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteId(project.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Connection Wizard */}
      <ConnectionWizard
        open={showConnectionWizard}
        onOpenChange={setShowConnectionWizard}
      />

      {/* Extraction Wizard (for web_portal connections) */}
      <ExtractionWizard
        open={!!extractionConnection}
        onOpenChange={(open) => { if (!open) setExtractionConnection(null); }}
        connection={extractionConnection!}
      />

      {/* Delete Project Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar migración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción no se puede deshacer. Se eliminarán todos los registros de esta migración.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Connection Dialog */}
      <AlertDialog open={!!deleteConnectionId} onOpenChange={() => setDeleteConnectionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar conexión?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminarán todas las sincronizaciones asociadas a esta conexión.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConnection}>Eliminar</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
