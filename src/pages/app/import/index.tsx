import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Plus, Upload, Database, Cloud, Globe, FileSpreadsheet, 
  RefreshCw, History, Settings2, Play, CheckCircle, XCircle,
  Clock, Sparkles, Link2, Plug, AlertCircle
} from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

// Mock data for Universal Import System
const mockSources = [
  {
    id: '1',
    name: 'EUIPO Sync',
    type: 'api',
    status: 'connected',
    lastSync: '2026-01-18T10:30:00Z',
    totalRecords: 1250
  },
  {
    id: '2',
    name: 'Excel Marcas España',
    type: 'file',
    status: 'pending',
    lastSync: null,
    totalRecords: 0
  },
  {
    id: '3',
    name: 'CRM Legacy Database',
    type: 'database',
    status: 'connected',
    lastSync: '2026-01-17T15:00:00Z',
    totalRecords: 5420
  }
];

const mockJobs = [
  {
    id: '1',
    name: 'Sincronización EUIPO',
    source: 'EUIPO Sync',
    status: 'completed',
    records: 150,
    createdAt: '2026-01-18T10:30:00Z',
    duration: '2m 35s'
  },
  {
    id: '2',
    name: 'Importación Excel Q4',
    source: 'Excel Marcas España',
    status: 'running',
    records: 45,
    createdAt: '2026-01-18T11:00:00Z',
    duration: null
  },
  {
    id: '3',
    name: 'Migración Contactos',
    source: 'CRM Legacy Database',
    status: 'failed',
    records: 0,
    createdAt: '2026-01-17T14:00:00Z',
    duration: '5m 12s',
    error: 'Connection timeout'
  }
];

export default function UniversalImport() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get('tab') || 'dashboard';

  const setActiveTab = (tab: string) => {
    setSearchParams({ tab });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
      case 'completed':
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><CheckCircle className="h-3 w-3 mr-1" />Conectado</Badge>;
      case 'running':
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
      case 'api': return <Globe className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'file': return <FileSpreadsheet className="h-5 w-5" />;
      case 'cloud': return <Cloud className="h-5 w-5" />;
      default: return <Plug className="h-5 w-5" />;
    }
  };

  // Stats
  const stats = {
    sources: mockSources.length,
    connected: mockSources.filter(s => s.status === 'connected').length,
    totalRecords: mockSources.reduce((acc, s) => acc + s.totalRecords, 0),
    pendingJobs: mockJobs.filter(j => j.status === 'running').length
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-2xl font-bold text-foreground">Sistema Universal de Importación</h1>
            <Badge variant="default" className="bg-primary">Nuevo</Badge>
          </div>
          <p className="text-muted-foreground">Importa datos desde cualquier fuente: APIs, bases de datos, archivos y más</p>
        </div>
        <Button onClick={() => navigate('/app/import/source/new')}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Fuente
        </Button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Plug className="h-4 w-4" />
              Fuentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.sources}</div>
            <p className="text-xs text-muted-foreground">{stats.connected} conectadas</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Database className="h-4 w-4" />
              Registros Totales
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRecords.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">importados</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              Jobs Activos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingJobs}</div>
            <p className="text-xs text-muted-foreground">en ejecución</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              IA Activa
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Sí</div>
            <p className="text-xs text-muted-foreground">Mapeo automático</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Panel
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center gap-2">
            <Plug className="h-4 w-4" />
            Fuentes
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center gap-2">
            <RefreshCw className="h-4 w-4" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            Historial
          </TabsTrigger>
        </TabsList>

        {/* Dashboard Tab */}
        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Acciones Rápidas</CardTitle>
                <CardDescription>Importa datos de manera rápida</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-3">
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Upload className="h-6 w-6" />
                  <span>Subir Archivo</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Link2 className="h-6 w-6" />
                  <span>Conectar API</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Database className="h-6 w-6" />
                  <span>Base de Datos</span>
                </Button>
                <Button variant="outline" className="h-auto py-4 flex-col gap-2">
                  <Globe className="h-6 w-6" />
                  <span>Web Scraping</span>
                </Button>
              </CardContent>
            </Card>

            {/* Recent Jobs */}
            <Card>
              <CardHeader>
                <CardTitle>Jobs Recientes</CardTitle>
                <CardDescription>Últimas importaciones ejecutadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockJobs.slice(0, 3).map(job => (
                    <div key={job.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-full ${
                          job.status === 'completed' ? 'bg-green-500/10' :
                          job.status === 'running' ? 'bg-blue-500/10' :
                          'bg-red-500/10'
                        }`}>
                          {job.status === 'completed' ? <CheckCircle className="h-4 w-4 text-green-600" /> :
                           job.status === 'running' ? <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" /> :
                           <XCircle className="h-4 w-4 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{job.name}</p>
                          <p className="text-xs text-muted-foreground">{job.source}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{job.records} registros</p>
                        <p className="text-xs text-muted-foreground">{job.duration || 'En curso...'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Sources Tab */}
        <TabsContent value="sources" className="space-y-4">
          {mockSources.length === 0 ? (
            <EmptyState
              icon={Plug}
              title="Sin fuentes configuradas"
              description="Añade tu primera fuente de datos para comenzar a importar."
              action={
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Nueva Fuente
                </Button>
              }
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mockSources.map(source => (
                <Card key={source.id} className="hover:shadow-md transition-shadow cursor-pointer">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getSourceIcon(source.type)}
                        </div>
                        <div>
                          <CardTitle className="text-base">{source.name}</CardTitle>
                          <CardDescription className="text-xs capitalize">{source.type}</CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(source.status)}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{source.totalRecords.toLocaleString()} registros</span>
                      <span>{source.lastSync ? 'Última sync: hace 2h' : 'Sin sincronizar'}</span>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button variant="outline" size="sm" className="flex-1">
                        <Play className="h-4 w-4 mr-1" />
                        Ejecutar
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Settings2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Jobs Tab */}
        <TabsContent value="jobs" className="space-y-4">
          {mockJobs.map(job => (
            <Card key={job.id}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="flex items-center gap-4">
                  <div className={`p-2 rounded-full ${
                    job.status === 'completed' ? 'bg-green-500/10' :
                    job.status === 'running' ? 'bg-blue-500/10' :
                    'bg-red-500/10'
                  }`}>
                    {job.status === 'completed' ? <CheckCircle className="h-5 w-5 text-green-600" /> :
                     job.status === 'running' ? <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" /> :
                     <XCircle className="h-5 w-5 text-red-600" />}
                  </div>
                  <div>
                    <p className="font-medium">{job.name}</p>
                    <p className="text-sm text-muted-foreground">{job.source}</p>
                  </div>
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="font-medium">{job.records} registros</p>
                    <p className="text-sm text-muted-foreground">
                      {job.status === 'running' ? 'En proceso...' : job.duration}
                    </p>
                  </div>
                  {getStatusBadge(job.status)}
                  <Button variant="ghost" size="sm">
                    <Settings2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history">
          <Card>
            <CardHeader>
              <CardTitle>Historial de Importaciones</CardTitle>
              <CardDescription>Todas las importaciones realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <EmptyState
                icon={History}
                title="Sin historial"
                description="Las importaciones completadas aparecerán aquí."
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
