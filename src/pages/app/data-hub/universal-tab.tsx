import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Plus, Upload, Database, Cloud, Globe, FileSpreadsheet, 
  RefreshCw, CheckCircle, XCircle, Clock, Sparkles, Link2, Plug
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';
import { useShadowImport, useApplyShadowImport } from '@/hooks/use-shadow-import';
import { useImports } from '@/hooks/use-data-hub';

export function UniversalTab() {
  const navigate = useNavigate();
  const shadowImport = useShadowImport();
  const applyImport = useApplyShadowImport();
  const { data: imports = [] } = useImports();

  // Show all recent imports (universal tab shows general overview)
  const recentJobs = imports.slice(0, 5);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Completado</Badge>;
      case 'running':
      case 'importing':
        return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><RefreshCw className="h-3 w-3 mr-1 animate-spin" />En proceso</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Error</Badge>;
      case 'pending':
        return <Badge variant="secondary"><Clock className="h-3 w-3 mr-1" />Pendiente</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'api': return Globe;
      case 'database': return Database;
      case 'file': return FileSpreadsheet;
      case 'cloud': return Cloud;
      default: return Plug;
    }
  };

  return (
    <div className="space-y-6">
      {/* Info Banner */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="flex items-center gap-4 py-4">
          <div className="p-3 bg-primary/10 rounded-lg">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold">Sistema Universal de Importación</h3>
            <p className="text-sm text-muted-foreground">
              Importa datos desde cualquier fuente: APIs, bases de datos, archivos, web scraping y más.
              Incluye modo shadow para previsualizar cambios antes de aplicarlos.
            </p>
          </div>
          <Button variant="outline">
            Documentación
          </Button>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Fuentes de Datos</CardTitle>
          <CardDescription>Selecciona el tipo de fuente para importar</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Button 
            variant="outline" 
            className="h-auto py-6 flex-col gap-2"
            onClick={() => navigate('/app/data-hub/import')}
          >
            <Upload className="h-8 w-8 text-green-600" />
            <span className="font-medium">Subir Archivo</span>
            <span className="text-xs text-muted-foreground">CSV, Excel, JSON</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" disabled>
            <Link2 className="h-8 w-8 text-blue-600" />
            <span className="font-medium">Conectar API</span>
            <span className="text-xs text-muted-foreground">REST, GraphQL</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" disabled>
            <Database className="h-8 w-8 text-purple-600" />
            <span className="font-medium">Base de Datos</span>
            <span className="text-xs text-muted-foreground">MySQL, PostgreSQL</span>
          </Button>
          
          <Button variant="outline" className="h-auto py-6 flex-col gap-2" disabled>
            <Globe className="h-8 w-8 text-orange-600" />
            <span className="font-medium">Web Scraping</span>
            <span className="text-xs text-muted-foreground">Extracción web</span>
          </Button>
        </CardContent>
      </Card>

      {/* Shadow Import Feature */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Modo Shadow (Vista Previa)
          </CardTitle>
          <CardDescription>
            Simula la importación antes de ejecutarla. Ve exactamente qué cambios se aplicarán.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 bg-muted/50 rounded-lg">
            <div className="flex-1">
              <h4 className="font-medium">¿Cómo funciona?</h4>
              <ul className="text-sm text-muted-foreground mt-2 space-y-1">
                <li>1. Sube tu archivo o configura tu fuente</li>
                <li>2. El sistema analiza y mapea los datos automáticamente</li>
                <li>3. Revisa los cambios propuestos en modo shadow</li>
                <li>4. Confirma para aplicar los cambios reales</li>
              </ul>
            </div>
            <Button onClick={() => navigate('/app/data-hub/import')}>
              <Upload className="h-4 w-4 mr-2" />
              Iniciar Import Shadow
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Jobs Recientes</CardTitle>
            <CardDescription>Últimas importaciones del sistema universal</CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver Todo
          </Button>
        </CardHeader>
        <CardContent>
          {recentJobs.length === 0 ? (
            <EmptyState
              icon={<Plug className="h-8 w-8" />}
              title="Sin importaciones recientes"
              description="Las importaciones desde archivos, APIs y otras fuentes aparecerán aquí."
              action={
                <Button onClick={() => navigate('/app/data-hub/import')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Primera Importación
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {recentJobs.map(job => (
                <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-primary/10">
                      <FileSpreadsheet className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{job.file_name || 'Importación'}</p>
                      <p className="text-xs text-muted-foreground">
                        {job.success_rows} de {job.total_rows} registros
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(job.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Capabilities Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-green-100">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold">Auto-Mapeo IA</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Detecta automáticamente los campos y sugiere el mapeo óptimo.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-blue-100">
                <RefreshCw className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold">Sincronización</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Programa sincronizaciones periódicas para mantener datos actualizados.
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-lg bg-purple-100">
                <Sparkles className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold">Validación</h4>
            </div>
            <p className="text-sm text-muted-foreground">
              Valida datos antes de importar para evitar errores y duplicados.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
